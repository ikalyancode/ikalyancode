from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from fastapi.middleware.cors import CORSMiddleware
import time
import httpx # For simulating external HTTP call
import asyncio # For async operations like sleep
from collections import defaultdict # For sales trends date filling
from starlette.requests import Request # New import for Rate Limiting

from .database import get_db, Base, engine
from .models import Product, Order, OrderStatus, Category
from .schemas import AnalyticsOverview, DailySalesData, TopProduct, Product as ProductSchema, CategoryPerformance # Import CategoryPerformance

app = FastAPI(
    title="TrendMart Analytics API",
    description="API for E-commerce Analytics Dashboard",
    version="1.0.0"
)

# CORS Middleware for frontend connection
origins = [
    "http://localhost:5173", # Vite development server default
    "http://localhost:3000", # Create-React-App default
    # Add your frontend production URL here when deployed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for API responses
# Structure: {endpoint_key: {"data": data, "timestamp": timestamp}}
API_CACHE = {}
CACHE_TTL_SECONDS = 60 # Cache for 60 seconds (1 minute)

def get_cached_response(key: str) -> Optional[Any]:
    """Retrieves data from cache if valid, otherwise returns None."""
    if key in API_CACHE:
        cached_item = API_CACHE[key]
        if (time.time() - cached_item["timestamp"]) < CACHE_TTL_SECONDS:
            return cached_item["data"]
    return None

def set_cached_response(key: str, data: Any):
    """Stores data in the cache with the current timestamp."""
    API_CACHE[key] = {"data": data, "timestamp": time.time()}

# --- Basic In-Memory Rate Limiter (Bonus Feature) ---
# Limits requests to N per minute per IP address
REQUEST_COUNTS: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"count": 0, "last_reset_time": time.time()})
RATE_LIMIT_CALLS = 5 # Allow 5 calls
RATE_LIMIT_PERIOD_SECONDS = 60 # per 60 seconds

async def rate_limit_dependency(request: Request):
    client_ip = request.client.host # Get client IP

    # Get or initialize the client's request count data
    client_data = REQUEST_COUNTS[client_ip]

    current_time = time.time()
    # Reset count if the period has passed
    if (current_time - client_data["last_reset_time"]) > RATE_LIMIT_PERIOD_SECONDS:
        client_data["count"] = 0
        client_data["last_reset_time"] = current_time

    client_data["count"] += 1
    if client_data["count"] > RATE_LIMIT_CALLS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(RATE_LIMIT_PERIOD_SECONDS - (current_time - client_data['last_reset_time']))} seconds."
        )
    print(f"IP: {client_ip}, Request Count: {client_data['count']}")


@app.on_event("startup")
def on_startup():
    """
    Event handler executed when the application starts.
    Ensures database tables are created.
    """
    # For production, you'd use Alembic or similar for migrations.
    # For this assessment, creating all is fine as seed.py also handles it.
    Base.metadata.create_all(bind=engine)
    print("Database tables ensured.")

# Health Check Endpoint
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Basic health check endpoint to verify API is running.
    """
    return {"status": "ok", "message": "API is healthy"}

# Analytics Overview Endpoint
@app.get("/api/analytics/overview", response_model=AnalyticsOverview, dependencies=[Depends(rate_limit_dependency)]) # Rate limited
async def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Calculates total revenue, total orders, and average order value
    for completed orders within the last 30 days.
    Includes basic rate limiting (bonus feature).
    """
    cache_key = "analytics_overview_30d"
    cached_data = get_cached_response(cache_key)
    if cached_data:
        print("Returning cached overview data.")
        return cached_data

    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    try:
        # Optimized query to get sum of total_amount and count of orders
        # for completed orders within the last 30 days.
        query_results = db.query(
            func.sum(Order.total_amount).label('total_revenue'),
            func.count(Order.id).label('total_orders')
        ).filter(
            Order.status == OrderStatus.COMPLETED,
            Order.order_date >= start_date,
            Order.order_date <= end_date
        ).first()

        total_revenue = query_results.total_revenue if query_results.total_revenue is not None else 0.0
        total_orders = query_results.total_orders if query_results.total_orders is not None else 0

        average_order_value = total_revenue / total_orders if total_orders > 0 else 0.0

        overview_data = AnalyticsOverview(
            total_revenue=round(total_revenue, 2),
            total_orders=total_orders,
            average_order_value=round(average_order_value, 2)
        )

        set_cached_response(cache_key, overview_data)
        return overview_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching analytics overview: {e}"
        )

# Sales Trends Endpoint
@app.get("/api/analytics/sales-trends", response_model=List[DailySalesData])
async def get_sales_trends(
    period: str = Query("30d", description="Time period (7d, 30d, 90d)"),
    db: Session = Depends(get_db)
):
    """
    Returns daily sales data (revenue and orders) for a specified period.
    Fills in missing dates with zero values for continuous charting.
    """
    cache_key = f"sales_trends_{period}"
    cached_data = get_cached_response(cache_key)
    if cached_data:
        print(f"Returning cached sales trends data for period: {period}.")
        return cached_data

    if period not in ["7d", "30d", "90d"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid period. Must be '7d', '30d', or '90d'."
        )

    end_date = datetime.now()
    if period == "7d":
        start_date = end_date - timedelta(days=7)
    elif period == "30d":
        start_date = end_date - timedelta(days=30)
    else: # 90d
        start_date = end_date - timedelta(days=90)

    try:
        # Aggregate revenue and orders by date for completed orders
        # Using SQLAlchemy's func.date_trunc for daily grouping (PostgreSQL specific)
        daily_data_query = db.query(
            func.date_trunc('day', Order.order_date).label('order_day'),
            func.sum(Order.total_amount).label('daily_revenue'),
            func.count(Order.id).label('daily_orders')
        ).filter(
            Order.status == OrderStatus.COMPLETED,
            Order.order_date >= start_date,
            Order.order_date <= end_date
        ).group_by(
            'order_day'
        ).order_by(
            'order_day'
        )

        results = daily_data_query.all()

        # Create a map to easily fill in missing dates
        date_map = defaultdict(lambda: {"revenue": 0.0, "orders": 0})
        current_date = start_date
        while current_date <= end_date:
            formatted_date = current_date.strftime('%Y-%m-%d')
            date_map[formatted_date] = {"revenue": 0.0, "orders": 0} # Initialize with zeros
            current_date += timedelta(days=1)

        # Populate the map with actual data
        for row in results:
            formatted_date = row.order_day.strftime('%Y-%m-%d')
            date_map[formatted_date]["revenue"] = round(row.daily_revenue, 2)
            date_map[formatted_date]["orders"] = row.daily_orders

        # Convert map to a list of DailySalesData objects, ensuring chronological order
        response_data = []
        for date_str in sorted(date_map.keys()):
            response_data.append(DailySalesData(
                date=date_str,
                revenue=date_map[date_str]["revenue"],
                orders=date_map[date_str]["orders"]
            ))

        set_cached_response(cache_key, response_data)
        return response_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching sales trends: {e}"
        )

# Top Products Endpoint
@app.get("/api/analytics/top-products", response_model=List[TopProduct])
async def get_top_products(
    limit: int = Query(10, ge=1, le=50, description="Number of top products to return"),
    db: Session = Depends(get_db)
):
    """
    Returns top products by total revenue (for completed orders).
    """
    cache_key = f"top_products_limit_{limit}"
    cached_data = get_cached_response(cache_key)
    if cached_data:
        print(f"Returning cached top products data for limit: {limit}.")
        return cached_data

    try:
        # Join Orders and Products, group by product, sum total_amount and quantity
        # Order by total revenue in descending order and limit the results.
        top_products_query = db.query(
            Product.name,
            func.sum(Order.total_amount).label('total_revenue'),
            func.sum(Order.quantity).label('units_sold')
        ).join(Order).filter(
            Order.status == OrderStatus.COMPLETED
        ).group_by(
            Product.name
        ).order_by(
            desc('total_revenue')
        ).limit(limit)

        results = top_products_query.all()

        top_products_data = []
        for row in results:
            top_products_data.append(TopProduct(
                name=row.name,
                total_revenue=round(row.total_revenue, 2),
                units_sold=row.units_sold
            ))

        set_cached_response(cache_key, top_products_data)
        return top_products_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching top products: {e}"
        )

# Category Performance Endpoint
@app.get("/api/analytics/category-performance", response_model=List[CategoryPerformance])
async def get_category_performance(db: Session = Depends(get_db)):
    """
    Returns performance metrics per product category (total revenue, total orders, average price).
    """
    cache_key = "category_performance"
    cached_data = get_cached_response(cache_key)
    if cached_data:
        print("Returning cached category performance data.")
        return cached_data

    try:
        # Join Orders, Products, and Categories
        # Group by category name and aggregate metrics
        category_performance_query = db.query(
            Category.name.label('category_name'),
            func.sum(Order.total_amount).label('total_revenue'),
            func.count(Order.id).label('total_orders'),
            func.avg(Product.price).label('average_product_price') # Average price of products in that category
        ).join(Product, Order.product_id == Product.id).join(Category, Product.category_id == Category.id).filter(
            Order.status == OrderStatus.COMPLETED # Only completed orders contribute to performance
        ).group_by(
            Category.name
        ).order_by(
            desc('total_revenue') # Order by highest revenue category
        )

        results = category_performance_query.all()

        category_performance_data = []
        for row in results:
            category_performance_data.append(CategoryPerformance(
                category_name=row.category_name,
                total_revenue=round(row.total_revenue, 2),
                total_orders=row.total_orders,
                average_price=round(row.average_product_price, 2)
            ))

        set_cached_response(cache_key, category_performance_data)
        return category_performance_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching category performance: {e}"
        )

# Bonus Feature: Simulate Order Endpoint with Mock External Integration
@app.post("/api/orders/simulate", status_code=status.HTTP_201_CREATED)
async def simulate_order(
    product_id: int = Query(..., description="ID of the product to order"),
    quantity: int = Query(..., gt=0, description="Quantity of the product"),
    db: Session = Depends(get_db)
):
    """
    Simulates a new completed order and triggers a mock inventory alert service call.
    Includes basic retry logic and fallback for the external service call.
    """
    try:
        # Find product and check stock
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.stock < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock for product {product.name}. Available: {product.stock}, Requested: {quantity}")

        # Create new order
        total_amount = round(product.price * quantity, 2)
        new_order = Order(
            product_id=product_id,
            quantity=quantity,
            total_amount=total_amount,
            status=OrderStatus.COMPLETED, # Simulate as completed for immediate analytics impact
            order_date=datetime.now()
        )
        db.add(new_order)

        # Decrement stock (optional for more realism, but not strictly required by assessment)
        # product.stock -= quantity
        db.commit()
        db.refresh(new_order)
        # db.refresh(product) # Refresh product to get updated stock if stock was decremented

        print(f"Simulated new order: ID={new_order.id}, Product='{product.name}', Qty={new_order.quantity}")

        # --- Mock "inventory alert" service integration with retry logic ---
        MOCK_INVENTORY_SERVICE_URL = "http://localhost:8000/mock-inventory-alert" # Can be internal or external
        max_retries = 3

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        MOCK_INVENTORY_SERVICE_URL,
                        json={
                            "product_id": product_id,
                            "quantity_sold": quantity,
                            "current_stock": product.stock - quantity # Send hypothetical current stock
                        },
                        timeout=5 # Timeout for the external call
                    )
                    response.raise_for_status() # Raises HTTPStatusError for 4xx/5xx responses
                    print(f"Inventory alert sent successfully (Attempt {attempt+1}). Status: {response.status_code}")
                    break # Success, exit retry loop
            except httpx.RequestError as e:
                print(f"Attempt {attempt+1} failed to reach mock inventory service: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt) # Exponential backoff: 1s, 2s, 4s
                else:
                    print("Max retries reached for inventory alert. Falling back to logging/DLQ.")
                    # Fallback action: e.g., log to an error system, push to a message queue for async processing
                    # For this assessment, simply print a message.
                    pass # Or raise a specific exception if this is a critical failure

        return {"message": "Order simulated successfully and inventory alert triggered.", "order_id": new_order.id}

    except HTTPException as e:
        # Re-raise FastAPI's HTTPException for proper client response
        raise e
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during order simulation: {e}"
        )

# Mock endpoint for the "external" inventory service to be called by simulate_order
@app.post("/mock-inventory-alert", status_code=status.HTTP_200_OK)
async def mock_inventory_alert_service(payload: Dict[str, Any]):
    """
    A mock endpoint simulating an external inventory alert service.
    """
    print(f"*** MOCK INVENTORY SERVICE RECEIVED ALERT ***: {payload}")
    # Simulate some processing time or occasional, controlled failure for testing retry
    # if random.random() < 0.2: # Uncomment to test retry logic
    #     await asyncio.sleep(0.5)
    #     raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Mock service internal error (simulated)")
    await asyncio.sleep(0.1) # Simulate network latency
    return {"status": "success", "message": "Inventory update received by mock service"}