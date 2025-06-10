# TrendMart E-commerce Analytics Dashboard

This project implements an MVP (Minimum Viable Product) of an analytics dashboard for TrendMart, a rapidly growing e-commerce platform. It provides key insights into sales performance, trends, and top-selling products, catering to merchant needs for fast, insightful, and mobile-friendly data visualization.

## Features

**Core MVP:**

* **Backend API (FastAPI):**
    * `GET /health`: Basic health check endpoint.
    * `GET /api/analytics/overview`: Calculates total revenue, total orders, and average order value for the last 30 days (completed orders). Includes basic in-memory caching for performance.
    * `GET /api/analytics/sales-trends?period={7d|30d|90d}`: Provides daily sales data (revenue, orders) for specified time periods.
    * `GET /api/analytics/top-products?limit={num}`: Lists top products by total revenue.
    * Database connection, SQLAlchemy ORM for models, and Pydantic for schemas.
    * Basic error handling middleware.
* **Frontend Dashboard (React + TypeScript + Tailwind CSS):**
    * Responsive layout for mobile and desktop.
    * Overview cards displaying key metrics.
    * Line chart visualizing sales trends over selected periods (using Recharts).
    * Table listing top-selling products.
    * Automatic data refresh every 60 seconds.
    * Loading states and error handling for API calls.
* **Database (PostgreSQL):**
    * Schema for Products, Orders, and Categories.
    * Seed script to populate the database with realistic dummy data.

**Bonus Features (Implemented to showcase extended capabilities):**

* **Mock External Service Integration:** `POST /api/orders/simulate` endpoint on the backend simulates new orders and triggers a mock "inventory alert" service call with retry logic and fallback handling.
* **Simulate Order UI:** A simple form on the dashboard to trigger new order simulations for testing real-time updates.
* **Dark/Light Mode Toggle:** Allows users to switch between dark and light themes for improved visual comfort.
* **Advanced Analytics: Category Performance Breakdown:** A new API endpoint and a dedicated table on the dashboard display key metrics (total revenue, total orders, average product price) grouped by category.
* **User Experience: Export to CSV:** Provides a button on the "Top Products" section to download the displayed data as a CSV file.
* **Performance & Scale: Basic API Rate Limiting:** An in-memory, per-IP rate limiter has been applied to the `/api/analytics/overview` endpoint to demonstrate basic protection against abuse or excessive requests.

## Technology Stack

* **Backend:** Python 3.x, FastAPI, Uvicorn, SQLAlchemy, Psycopg2, python-dotenv, httpx
* **Database:** PostgreSQL
* **Frontend:** React 18 (with Vite), TypeScript, Tailwind CSS, Recharts
* **Development Tools:** Git, npm/yarn, Python venv

---

## Setup Instructions

Follow these steps to get the project up and running locally.

### Prerequisites

* Node.js (LTS version recommended) & npm (comes with Node.js)
* Python 3.9+ & pip
* PostgreSQL database server (ensure it's running)

### 1. Clone the Repository & Initial Setup

First, ensure you have accepted the GitHub repository invitation to gain access.

```bash
# This step is already handled by the setup script if you ran it as provided.
# If you are cloning a fresh repository, use:
# git clone [https://github.com/your-org/ut-startups-assessment.git](https://github.com/your-org/ut-startups-assessment.git)
# cd ut-startups-assessment

# Create a new branch for your solution (if starting from a fresh clone)
# git checkout -b solution/my-dashboard-mvp