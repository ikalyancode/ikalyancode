import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
# Assuming .env is in the same directory as database.py
load_dotenv()

# --- Configuration ---
# Fallback to a default URL if not found in .env, useful for development
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://user:password@localhost:5432/ecommerce_db_fallback")

# The `+psycopg2` part specifies the driver for SQLAlchemy.
# For direct asyncpg, it would be 'postgresql://'.
engine = create_engine(DATABASE_URL) # Removed pool_pre_ping=True for simplicity in MVP, but good for production
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency for getting a database session.
    Manages session lifecycle (opens and closes automatically).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()