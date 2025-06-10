from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class OrderStatus(enum.Enum):
    """Enum for order statuses."""
    COMPLETED = "completed"
    PENDING = "pending"
    CANCELLED = "cancelled"

class Category(Base):
    """SQLAlchemy model for product categories."""
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    products = relationship("Product", back_populates="category")

class Product(Base):
    """SQLAlchemy model for products."""
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)

    category = relationship("Category", back_populates="products")
    orders = relationship("Order", back_populates="product")

class Order(Base):
    """SQLAlchemy model for orders."""
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    # Using SQLAlchemy's Enum type for database storage
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    order_date = Column(DateTime, default=func.now(), nullable=False) # Automatically set current timestamp

    product = relationship("Product", back_populates="orders")