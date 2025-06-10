import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

# --- Interfaces for API Data ---
interface AnalyticsOverview {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
}

interface DailySalesData {
    date: string; // YYYY-MM-DD
    revenue: number;
    orders: number;
}

interface TopProductData {
    name: string;
    total_revenue: number;
    units_sold: number;
}

interface CategoryPerformanceData { // New interface for Category Performance
    category_name: string;
    total_revenue: number;
    total_orders: number;
    average_price: number;
}


const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI backend URL

function App() {
# --- State for Dashboard Data ---
    const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(null);
    const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
    const [errorOverview, setErrorOverview] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const [salesTrendsData, setSalesTrendsData] = useState<DailySalesData[]>([]);
    const [loadingSalesTrends, setLoadingSalesTrends] = useState<boolean>(true);
    const [errorSalesTrends, setErrorSalesTrends] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");

    const [topProductsData, setTopProductsData] = useState<TopProductData[]>([]);
    const [loadingTopProducts, setLoadingTopProducts] = useState<boolean>(true);
    const [errorTopProducts, setErrorTopProducts] = useState<string | null>(null);

    const [categoryPerformanceData, setCategoryPerformanceData] = useState<CategoryPerformanceData[]>([]); // New state for Category Performance
    const [loadingCategoryPerformance, setLoadingCategoryPerformance] = useState<boolean>(true);
    const [errorCategoryPerformance, setErrorCategoryPerformance] = useState<string | null>(null);

# --- State for Simulate Order Bonus Feature ---
    const [simulateProductId, setSimulateProductId] = useState<string>('');
    const [simulateQuantity, setSimulateQuantity] = useState<string>('');
    const [simulateMessage, setSimulateMessage] = useState<string | null>(null);
    const [simulateError, setSimulateError] = useState<string | null>(null);

# --- State for Dark/Light Mode Bonus Feature ---
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    # Initialize theme from local storage or system preference
        const savedMode = localStorage.getItem('theme');
        if (savedMode) {
            return savedMode === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

# --- Theme Effect ---
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

# --- Data Fetching Functions ---

    const fetchOverviewData = useCallback(async () => {
        setLoadingOverview(true);
        setErrorOverview(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/analytics/overview`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data: AnalyticsOverview = await response.json();
            setOverviewData(data);
            setLastUpdated(new Date().toLocaleTimeString()); # Update timestamp
        } catch (err: any) {
            setErrorOverview(`Failed to fetch overview: ${err.message}`);
            console.error("Fetch overview error:", err);
        } finally {
            setLoadingOverview(false);
        }
    }, []); // No dependencies as API_BASE_URL is constant

    const fetchSalesTrendsData = useCallback(async (period: "7d" | "30d" | "90d") => {
        setLoadingSalesTrends(true);
        setErrorSalesTrends(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/analytics/sales-trends?period=${period}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data: DailySalesData[] = await response.json();
            setSalesTrendsData(data);
        } catch (err: any) {
            setErrorSalesTrends(`Failed to fetch sales trends: ${err.message}`);
            console.error("Fetch sales trends error:", err);
        } finally {
            setLoadingSalesTrends(false);
        }
    }, []); // No dependencies

    const fetchTopProductsData = useCallback(async (limit: number = 10) => {
        setLoadingTopProducts(true);
        setErrorTopProducts(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/analytics/top-products?limit=${limit}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data: TopProductData[] = await response.json();
            setTopProductsData(data);
        } catch (err: any) {
            setErrorTopProducts(`Failed to fetch top products: ${err.message}`);
            console.error("Fetch top products error:", err);
        } finally {
            setLoadingTopProducts(false);
        }
    }, []); // No dependencies

    const fetchCategoryPerformanceData = useCallback(async () => { // New fetch function for Category Performance
        setLoadingCategoryPerformance(true);
        setErrorCategoryPerformance(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/analytics/category-performance`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data: CategoryPerformanceData[] = await response.json();
            setCategoryPerformanceData(data);
        } catch (err: any) {
            setErrorCategoryPerformance(`Failed to fetch category performance: ${err.message}`);
            console.error("Fetch category performance error:", err);
        } finally {
            setLoadingCategoryPerformance(false);
        }
    }, []);

# --- Effects for Initial Load and Auto-Refresh ---
    useEffect(() => {
        // Initial fetches
        fetchOverviewData();
        fetchSalesTrendsData(selectedPeriod);
        fetchTopProductsData();
        fetchCategoryPerformanceData(); // <-- Add this for initial fetch

        // Set up auto-refresh intervals
        const overviewIntervalId = setInterval(fetchOverviewData, 60000); // Every 60 seconds
        const salesTrendsIntervalId = setInterval(() => fetchSalesTrendsData(selectedPeriod), 60000);
        const topProductsIntervalId = setInterval(fetchTopProductsData, 60000);
        const categoryPerformanceIntervalId = setInterval(fetchCategoryPerformanceData, 60000); // <-- Add this for auto-refresh

        // Cleanup intervals on component unmount
        return () => {
            clearInterval(overviewIntervalId);
            clearInterval(salesTrendsIntervalId);
            clearInterval(topProductsIntervalId);
            clearInterval(categoryPerformanceIntervalId); // <-- Clear new interval
        };
    }, [fetchOverviewData, fetchSalesTrendsData, fetchTopProductsData, fetchCategoryPerformanceData, selectedPeriod]);

# --- Simulate Order Handler ---
    const handleSimulateOrder = async () => {
        setSimulateMessage(null);
        setSimulateError(null);
        const productId = parseInt(simulateProductId);
        const quantity = parseInt(simulateQuantity);

        if (isNaN(productId) || isNaN(quantity) || productId <= 0 || quantity <= 0) {
            setSimulateError("Please enter valid Product ID and Quantity.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/simulate?product_id=${productId}&quantity=${quantity}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || "Failed to simulate order.");
            }
            setSimulateMessage(result.message);
            // Immediately refresh dashboard data after simulating order to see changes
            fetchOverviewData();
            fetchSalesTrendsData(selectedPeriod);
            fetchTopProductsData();
            fetchCategoryPerformanceData(); // Refresh category performance after simulation
            setSimulateProductId(''); // Clear inputs after successful simulation
            setSimulateQuantity('');
        } catch (err: any) {
            setSimulateError(`Simulation error: ${err.message}`);
            console.error("Simulate order error:", err);
        }
    };

# --- Export to CSV Handler (Bonus Feature) ---
    const handleExportTopProductsToCSV = () => {
        if (topProductsData.length === 0) {
            alert("No data to export!");
            return;
        }

        // Define CSV header
        const headers = ["Product Name", "Total Revenue", "Units Sold"];
        // Map data to CSV rows
        const rows = topProductsData.map(product => [
            `"${product.name.replace(/"/g, '""')}"`, // Handle commas and quotes in product names
            product.total_revenue.toFixed(2),
            product.units_sold
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create a Blob and download it as a CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'top_products_export.csv');
        link.click();
        URL.revokeObjectURL(url); // Clean up the URL object
    };

# Function to determine text color for charts based on theme
    const getChartTextColor = () => {
        return isDarkMode ? '#ddd' : '#333';
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-center flex-grow">TrendMart Analytics Dashboard</h1>
                # Dark/Light Mode Toggle Button
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDarkMode ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 4a1 1 0 01.293.707L14.5 7a1 1 0 11-1.414 1.414l-.147-.146a1 1 0 01-.707-1.414zM16 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-6 4a1 1 0 01-1 1v1a1 1 0 112 0v-1a1 1 0 01-1-1zm-4-4a1 1 0 01-.293.707L5.5 13a1 1 0 111.414 1.414l.147-.146a1 1 0 01.707-1.414zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"></path><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"></path></svg>
                    )}
                </button>
            </header>

            <main>
                # Overview Section
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Overview (Last 30 Days)</h2>
                    {loadingOverview && <div className="text-center py-4">Loading overview insights...</div>}
                    {errorOverview && <div className="text-center py-4 text-red-600">Error: {errorOverview}</div>}

                    {!loadingOverview && !errorOverview && overviewData && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            # Total Revenue Card
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                <p className="text-lg text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    ${overviewData.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            # Total Orders Card
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                <p className="text-lg text-gray-500 dark:text-gray-400">Total Orders</p>
                                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {overviewData.total_orders.toLocaleString('en-US')}
                                </p>
                            </div>

                            # Average Order Value Card
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                <p className="text-lg text-gray-500 dark:text-gray-400">Average Order Value</p>
                                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    ${overviewData.average_order_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-right">
                        Last updated: {lastUpdated} <span className="animate-pulse text-green-500">● Live</span>
                    </p>
                </section>

                # Sales Trends Chart Section
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Sales Trends</h2>
                    <div className="flex justify-center mb-4 space-x-2">
                        {["7d", "30d", "90d"].map((periodOption) => (
                            <button
                                key={periodOption}
                                onClick={() => setSelectedPeriod(periodOption as "7d" | "30d" | "90d")}
                                className={`px-4 py-2 rounded-md transition-colors duration-200
                  ${selectedPeriod === periodOption
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                {periodOption.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96 flex flex-col items-center justify-center">
                        {loadingSalesTrends && <div className="text-center py-4">Loading sales trends...</div>}
                        {errorSalesTrends && <div className="text-center py-4 text-red-600">Error: {errorSalesTrends}</div>}
                        {salesTrendsData.length > 0 && !loadingSalesTrends && !errorSalesTrends && (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={salesTrendsData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={getChartTextColor()} strokeOpacity={0.5} />
                                    <XAxis dataKey="date" stroke={getChartTextColor()} />
                                    <YAxis stroke={getChartTextColor()} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: isDarkMode ? '#333' : '#fff', border: `1px solid ${isDarkMode ? '#555' : '#ccc'}` }}
                                        itemStyle={{ color: getChartTextColor() }}
                                        labelStyle={{ color: getChartTextColor() }}
                                        formatter={(value: any, name: string) => {
                                            if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
                                            if (name === 'orders') return [`${value}`, 'Orders'];
                                            return value;
                                        }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue" />
                                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                        {salesTrendsData.length === 0 && !loadingSalesTrends && !errorSalesTrends && (
                            <div className="text-center py-4 text-gray-500">No sales data for this period.</div>
                        )}
                    </div>
                </section>

                # Top Products Section
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 flex justify-between items-center">
                        Top Products (Top 10)
                        <button
                            onClick={handleExportTopProductsToCSV}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-sm"
                        >
                            Export to CSV
                        </button>
                    </h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto">
                        {loadingTopProducts && <div className="text-center py-4">Loading top products...</div>}
                        {errorTopProducts && <div className="text-center py-4 text-red-600">Error: {errorTopProducts}</div>}
                        {topProductsData.length > 0 && !loadingTopProducts && !errorTopProducts && (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Product Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total Revenue
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Units Sold
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {topProductsData.map((product, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            ${product.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {product.units_sold.toLocaleString('en-US')}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        {topProductsData.length === 0 && !loadingTopProducts && !errorTopProducts && (
                            <div className="text-center py-4 text-gray-500">No top products found for the given criteria.</div>
                        )}
                    </div>
                </section>

                # Category Performance Section (New Section)
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Category Performance</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto">
                        {loadingCategoryPerformance && <div className="text-center py-4">Loading category performance...</div>}
                        {errorCategoryPerformance && <div className="text-center py-4 text-red-600">Error: {errorCategoryPerformance}</div>}
                        {categoryPerformanceData.length > 0 && !loadingCategoryPerformance && !errorCategoryPerformance && (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Category Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total Revenue
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total Orders
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Avg. Product Price
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {categoryPerformanceData.map((category, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {category.category_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            ${category.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {category.total_orders.toLocaleString('en-US')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            ${category.average_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        {categoryPerformanceData.length === 0 && !loadingCategoryPerformance && !errorCategoryPerformance && (
                            <div className="text-center py-4 text-gray-500">No category performance data found.</div>
                        )}
                    </div>
                </section>


                # Simulate Order Section (Bonus Feature)
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Simulate Order (Bonus)</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Use this to simulate new completed orders and observe real-time dashboard updates.
                            (Product IDs can be found in your database, e.g., run `SELECT id, name FROM products;` in PostgreSQL)
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <input
                                type="number"
                                placeholder="Product ID (e.g., 1)"
                                value={simulateProductId}
                                onChange={(e) => setSimulateProductId(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                            />
                            <input
                                type="number"
                                placeholder="Quantity (e.g., 2)"
                                value={simulateQuantity}
                                onChange={(e) => setSimulateQuantity(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                            />
                            <button
                                onClick={handleSimulateOrder}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                            >
                                Simulate Order
                            </button>
                        </div>
                        {simulateMessage && <p className="text-green-600 text-sm mt-2">{simulateMessage}</p>}
                        {simulateError && <p className="text-red-600 text-sm mt-2">{simulateError}</p>}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;