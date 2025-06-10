import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
# from sqlalchemy_utils import database_exists, create_database # Uncomment if you install sqlalchemy-utils

from backend.database import engine, Base, SessionLocal
from backend.models import Product, Order, Category, OrderStatus

def create_initial_data(db: Session):
    """
    Creates tables and populates the database with dummy e-commerce data.
    """
    print("Ensuring database tables exist...")
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    print("Seeding database... (Clearing existing data)")
    # Clear existing data to ensure a fresh seed each time
    db.query(Order).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.commit()

    # Create Categories
    categories_data = [
        {"name": "Electronics"},
        {"name": "Books"},
        {"name": "Clothing"},
        {"name": "Home Goods"},
        {"name": "Sports"},
        {"name": "Beauty"},
        {"name": "Groceries"}
    ]
    categories = [Category(**data) for data in categories_data]
    db.add_all(categories)
    db.commit()
    # Refresh to get IDs
    for c in categories:
        db.refresh(c)

    # Create 50+ Products
    products = []
    product_base_names = [
        "Smartphone", "Laptop", "Wireless Earbuds", "Smartwatch", "Tablet",
        "Fiction Novel", "Programming Book", "Fantasy Series", "Cookbook", "History Guide",
        "T-Shirt", "Jeans", "Jacket", "Sneakers", "Dress",
        "Coffee Maker", "Blender", "Toaster", "Vacuum Cleaner", "Air Fryer",
        "Yoga Mat", "Dumbbell Set", "Resistance Bands", "Smart Scale", "Jump Rope",
        "Face Serum", "Shampoo", "Lipstick", "Perfume", "Sunscreen",
        "Organic Apples", "Artisan Bread", "Craft Beer", "Fresh Milk", "Cheese"
    ]
    for i in range(55): # Ensure more than 50 products
        name = f"{random.choice(product_base_names)} {random.choice(['Pro', 'Max', 'Lite', 'Edition', 'Ultra', ''])}{random.randint(1, 99)}"
        category = random.choice(categories)
        price = round(random.uniform(9.99, 1999.99), 2)
        stock = random.randint(0, 500)
        products.append(Product(name=name, category_id=category.id, price=price, stock=stock))
    db.add_all(products)
    db.commit()
    # Refresh to get IDs
    for p in products:
        db.refresh(p)

    # Create 200+ Orders over 30 days
    orders = []
    now = datetime.now()
    for _ in range(220): # Ensure more than 200 orders
        product = random.choice(products)
        quantity = random.randint(1, 5)
        total_amount = round(product.price * quantity, 2)
        order_date = now - timedelta(days=random.randint(0, 29), hours=random.randint(0, 23), minutes=random.randint(0, 59))

        status_roll = random.random()
        if status_roll < 0.80: # 80% completed
            status = OrderStatus.COMPLETED
        elif status_roll < 0.95: # 15% pending
            status = OrderStatus.PENDING
        else: # 5% cancelled
            status = OrderStatus.CANCELLED

        orders.append(Order(
            product_id=product.id,
            quantity=quantity,
            total_amount=total_amount,
            status=status,
            order_date=order_date
        ))
    db.add_all(orders)
    db.commit()

    print("Database seeding complete!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Optional: Check if database exists and create if not
        # This requires sqlalchemy-utils: pip install sqlalchemy-utils
        # if not database_exists(engine.url):
        #     print(f"Database {engine.url.database} does not exist, creating...")
        #     create_database(engine.url)
        #     print("Database created.")

        create_initial_data(db)
    finally:
        db.close()