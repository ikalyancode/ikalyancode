from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from .models import OrderStatus # Import OrderStatus enum from models

# Category Schemas
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    class Config:
        from_attributes = True # Maps SQLAlchemy models to Pydantic

# Product Schemas
class ProductBase(BaseModel):
    name: str
    category_id: int
    price: float = Field(..., gt=0) # Price must be greater than 0
    stock: int = Field(..., ge=0)  # Stock must be greater than or equal to 0

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    category: Category # Nested schema for category details
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    total_amount: float = Field(..., gt=0)
    status: OrderStatus # Use the defined Enum
    order_date: datetime

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    product: Product # Nested schema for product details
    class Config:
        from_attributes = True

# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_revenue: float = Field(..., ge=0)
    total_orders: int = Field(..., ge=0)
    average_order_value: float = Field(..., ge=0)

class DailySalesData(BaseModel):
    date: str # YYYY-MM-DD
    revenue: float = Field(..., ge=0)
    orders: int = Field(..., ge=0)

class TopProduct(BaseModel):
    name: str
    total_revenue: float = Field(..., ge=0)
    units_sold: int = Field(..., ge=0)
    # growth_rate: Optional[float] = None # Optional for future growth rate calculation

class CategoryPerformance(BaseModel):
    category_name: str
    total_revenue: float = Field(..., ge=0)
    total_orders: int = Field(..., ge=0)
    average_price: float = Field(..., ge=0) # Average price of products in category