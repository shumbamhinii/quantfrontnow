import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ChartGrid } from '@/components/analytics/ChartGrid';
import { ChartModal } from '@/components/analytics/ChartModal';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthPage'; // Import useAuth
import Highcharts from 'highcharts'; // Import Highcharts for direct config
import { Spin, Alert, Button } from 'antd'; // Import Spin, Alert, Button from antd for better UI feedback

// Define a type for the transaction data expected from the backend
interface Transaction {
  id: string;
  type: 'sale' | 'cash_in' | 'expense' | 'income';
  amount: number;
  description: string;
  date: string; // ISO string
  category: string;
  account_id: string;
  payment_type?: 'Cash' | 'Bank' | 'Credit';
  user_id?: string;
  branch?: string;
  created_at: string;
  cart?: Array<{ id: string; quantity: number }>; // Assuming cart structure for sales
}

// Define a type for Product/Service data from backend
interface ProductService {
  id: string;
  name: string;
  description?: string;
  unitPrice: number; // Frontend uses unitPrice
  price: number; // For consistency
  purchasePrice?: number;
  unitPurchasePrice?: number;
  sku?: string;
  isService: boolean;
  qty: number; // Frontend uses qty for stock
  stockQuantity: number;
  unit?: string;
  minQty?: number;
  maxQty?: number;
  availableValue?: number;
  taxRateValue?: number;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  category?: string; // Added category
}

// Define a type for Customer data from backend
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  total_invoiced: number; // Total amount invoiced to this customer
  created_at: string; // Customer creation date
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'column';
  data: (string | number)[][]; // Keep for generic data structure if needed, though Highcharts often uses series directly
  config: Highcharts.Options; // Use Highcharts.Options for type safety
  isLoading: boolean;
  error: string | null;
}

const DataAnalytics = () => {
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allChartData, setAllChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth(); // Get authentication status
  // Get token directly from localStorage using 'access_token' for consistency
  const token = localStorage.getItem('token'); 

  const fetchChartData = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for data analytics.');
      setAllChartData([]);
      setLoading(false);
      setError('Authentication required. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Include the JWT token
      };

      // Fetch all necessary data concurrently
      const [
        revenueTrendRes,
        transactionVolumeRes,
        allTransactionsRes, // New fetch for all transactions
        productsServicesRes,
        invoicesRes,
        customersRes,
      ] = await Promise.all([
        fetch('http://localhost:3000/api/charts/revenue-trend', { headers }),
        fetch('http://localhost:3000/api/charts/transaction-volume', { headers }),
        fetch('http://localhost:3000/transactions', { headers }), // Fetch all transactions
        fetch('http://localhost:3000/api/products', { headers }), // Using /api/products
        fetch('http://localhost:3000/api/invoices', { headers }),
        fetch('http://localhost:3000/api/customers', { headers }),
      ]);

      // Check all responses for success
      if (!revenueTrendRes.ok) throw new Error('Failed to fetch revenue trend data');
      if (!transactionVolumeRes.ok) throw new Error('Failed to fetch transaction volume data');
      if (!allTransactionsRes.ok) throw new Error('Failed to fetch all transactions data');
      if (!productsServicesRes.ok) throw new Error('Failed to fetch products/services data');
      if (!invoicesRes.ok) throw new Error('Failed to fetch invoices data');
      if (!customersRes.ok) throw new Error('Failed to fetch customers data');

      // Parse all JSON data
      const revenueTrendData = await revenueTrendRes.json();
      const transactionVolumeData = await transactionVolumeRes.json();
      const allTransactions: Transaction[] = await allTransactionsRes.json();
      const productsServicesData: ProductService[] = await productsServicesRes.json();
      const invoicesData = await invoicesRes.json();
      const customersData: Customer[] = await customersRes.json();

      const charts: ChartData[] = [];

      // 1. Revenue, Expenses, and Profit Trend (Existing)
      const revenueCategories = revenueTrendData.map((d: any) => d.month);
      const revenueSeriesData = revenueTrendData.map((d: any) => d.revenue);
      const expensesSeriesData = revenueTrendData.map((d: any) => d.expenses);
      const profitSeriesData = revenueTrendData.map((d: any) => d.profit);

      charts.push({
        id: 'revenue-trend',
        title: 'Revenue, Expenses, and Profit Trend',
        type: 'line',
        data: [],
        config: {
          chart: { type: 'line' },
          title: { text: 'Monthly Financial Performance' },
          xAxis: { categories: revenueCategories },
          yAxis: { title: { text: 'Amount (ZAR)' } },
          series: [
            { name: 'Revenue', data: revenueSeriesData, type: 'line' },
            { name: 'Expenses', data: expensesSeriesData, type: 'line' },
            { name: 'Profit', data: profitSeriesData, type: 'line' },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 2. Transaction Volume (Existing)
      const transactionCategories = transactionVolumeData.map((d: any) => d.month);
      const quotesSeriesData = transactionVolumeData.map((d: any) => d.quotes);
      const invoicesSeriesData = transactionVolumeData.map((d: any) => d.invoices);
      const purchasesSeriesData = transactionVolumeData.map((d: any) => d.purchases);

      charts.push({
        id: 'transaction-volume',
        title: 'Transaction Volume',
        type: 'column',
        data: [],
        config: {
          chart: { type: 'column' },
          title: { text: 'Monthly Transaction Volume' },
          xAxis: { categories: transactionCategories },
          yAxis: { title: { text: 'Count' } },
          series: [
            { name: 'Quotations', data: quotesSeriesData, type: 'column' },
            { name: 'Invoices', data: invoicesSeriesData, type: 'column' },
            { name: 'Purchases', data: purchasesSeriesData, type: 'column' },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 3. Expenses by Category (Pie Chart)
      const expenseCategoryMap: { [key: string]: number } = {};
      allTransactions.filter(t => t.type === 'expense').forEach((expense: Transaction) => {
        const category = expense.category || 'Uncategorized';
        expenseCategoryMap[category] = (expenseCategoryMap[category] || 0) + expense.amount;
      });

      const expenseSeries = Object.entries(expenseCategoryMap).map(([name, y]) => ({ name, y }));

      charts.push({
        id: 'expenses-by-category',
        title: 'Expenses by Category',
        type: 'pie',
        data: [],
        config: {
          chart: { type: 'pie' },
          title: { text: 'Expense Distribution' },
          series: [{
            name: 'Expenses',
            data: expenseSeries,
            type: 'pie',
            innerSize: '50%',
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %'
            }
          }],
        },
        isLoading: false,
        error: null,
      });

      // 4. Top N Selling Products/Services (Bar Chart)
      const productSalesMap: { [productId: string]: number } = {};
      allTransactions.filter(t => t.type === 'sale' && t.cart).forEach(sale => {
        sale.cart?.forEach(item => {
          productSalesMap[item.id] = (productSalesMap[item.id] || 0) + item.quantity;
        });
      });

      // Map product IDs to names and sort
      const topN = 10;
      const sortedProductSales = Object.entries(productSalesMap)
        .map(([productId, totalQuantity]) => {
          const product = productsServicesData.find(p => p.id === productId);
          return {
            name: product ? product.name : `Unknown Product (${productId})`,
            y: totalQuantity,
          };
        })
        .sort((a, b) => b.y - a.y)
        .slice(0, topN);

      charts.push({
        id: 'top-selling-products',
        title: `Top ${topN} Selling Products/Services`,
        type: 'bar',
        data: [],
        config: {
          chart: { type: 'bar' },
          title: { text: `Top ${topN} Selling Products/Services by Quantity` },
          xAxis: { categories: sortedProductSales.map(item => item.name), title: { text: 'Product/Service' } },
          yAxis: { title: { text: 'Quantity Sold' } },
          series: [{
            name: 'Quantity Sold',
            data: sortedProductSales.map(item => item.y),
            type: 'bar',
          }],
          legend: { enabled: false },
        },
        isLoading: false,
        error: null,
      });

      // 5. Customer Lifetime Value Distribution (Pie Chart)
      const customerValueTiers: { [tier: string]: number } = {
        'Low Value (<R1000)': 0,
        'Medium Value (R1000-R5000)': 0,
        'High Value (>R5000)': 0,
      };

      customersData.forEach(customer => {
        const totalInvoiced = customer.total_invoiced || 0;
        if (totalInvoiced < 1000) {
          customerValueTiers['Low Value (<R1000)']++;
        } else if (totalInvoiced >= 1000 && totalInvoiced <= 5000) {
          customerValueTiers['Medium Value (R1000-R5000)']++;
        } else {
          customerValueTiers['High Value (>R5000)']++;
        }
      });

      const customerValueSeries = Object.entries(customerValueTiers).map(([name, y]) => ({ name, y }));

      charts.push({
        id: 'customer-lifetime-value',
        title: 'Customer Lifetime Value Distribution',
        type: 'pie',
        data: [],
        config: {
          chart: { type: 'pie' },
          title: { text: 'Customer Value Tiers' },
          series: [{
            name: 'Customers',
            data: customerValueSeries,
            type: 'pie',
            innerSize: '50%',
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %'
            }
          }],
        },
        isLoading: false,
        error: null,
      });

      // 6. Product Stock Levels vs. Thresholds (Column Chart with plot lines)
      const productsWithStock = productsServicesData.filter(p => !p.isService && p.qty !== undefined && p.minQty !== undefined && p.maxQty !== undefined);

      const stockCategories = productsWithStock.map(p => p.name);
      const currentStockData = productsWithStock.map(p => p.qty);
      const minStockData = productsWithStock.map(p => p.minQty);
      const maxStockData = productsWithStock.map(p => p.maxQty);

      charts.push({
        id: 'product-stock-levels',
        title: 'Product Stock Levels vs. Thresholds',
        type: 'column',
        data: [],
        config: {
          chart: { type: 'column' },
          title: { text: 'Current Stock vs. Min/Max Thresholds' },
          xAxis: { categories: stockCategories, title: { text: 'Product' } },
          yAxis: { title: { text: 'Quantity' } },
          series: [
            { name: 'Current Stock', data: currentStockData, type: 'column' },
            { name: 'Minimum Stock', data: minStockData, type: 'line', dashStyle: 'Dot', marker: { enabled: false } },
            { name: 'Maximum Stock', data: maxStockData, type: 'line', dashStyle: 'Dot', marker: { enabled: false } },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 7. Monthly Transaction Types Breakdown (Stacked Column Chart)
      const monthlyTransactionData: { [month: string]: { [type: string]: number } } = {};

      allTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyTransactionData[monthYear]) {
          monthlyTransactionData[monthYear] = { 'sale': 0, 'cash_in': 0, 'expense': 0, 'income': 0 };
        }
        monthlyTransactionData[monthYear][transaction.type] = (monthlyTransactionData[monthYear][transaction.type] || 0) + transaction.amount;
      });

      const sortedMonths = Object.keys(monthlyTransactionData).sort();
      const salesData = sortedMonths.map(month => monthlyTransactionData[month]['sale'] || 0);
      const cashInData = sortedMonths.map(month => monthlyTransactionData[month]['cash_in'] || 0);
      const expenseData = sortedMonths.map(month => monthlyTransactionData[month]['expense'] || 0);
      const incomeData = sortedMonths.map(month => monthlyTransactionData[month]['income'] || 0);

      charts.push({
        id: 'monthly-transaction-breakdown',
        title: 'Monthly Transaction Types Breakdown',
        type: 'column',
        data: [],
        config: {
          chart: { type: 'column' },
          title: { text: 'Monthly Financial Activity by Type' },
          xAxis: { categories: sortedMonths, title: { text: 'Month' } },
          yAxis: { title: { text: 'Amount (ZAR)' } },
          plotOptions: {
            column: {
              stacking: 'normal',
              dataLabels: {
                enabled: true,
                format: 'R{point.y:.2f}' // Format data labels
              }
            }
          },
          series: [
            { name: 'Sales', data: salesData, type: 'column', stack: 'monthly' },
            { name: 'Cash In', data: cashInData, type: 'column', stack: 'monthly' },
            { name: 'Expenses', data: expenseData, type: 'column', stack: 'monthly' },
            { name: 'Income', data: incomeData, type: 'column', stack: 'monthly' },
          ],
        },
        isLoading: false,
        error: null,
      });


      setAllChartData(charts);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]); // Dependency array updated to use 'token' from localStorage

  useEffect(() => {
    // Only fetch data if authenticated and token is available
    if (isAuthenticated && token) {
      fetchChartData();
    } else {
      // If not authenticated or token is missing, clear data and show message
      setAllChartData([]);
      setLoading(false);
      setError('Please log in to view analytics.'); 
    }
  }, [fetchChartData, isAuthenticated, token]); // Dependencies updated to reflect changes

  const handleExpandChart = (chart: ChartData) => {
    setSelectedChart(chart);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChart(null);
  };

  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Data Analytics' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <Spin size="large" tip="Loading charts..." />
          </div>
        )}
        {error && (
          <Alert
            message="Error Loading Charts"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={fetchChartData}>
                Retry
              </Button>
            }
            style={{ marginBottom: '20px' }}
          />
        )}
        {!loading && !error && (
          <ChartGrid onExpandChart={handleExpandChart} chartData={allChartData} />
        )}
      </motion.div>

      <ChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        chart={selectedChart}
      />
    </div>
  );
};

export default DataAnalytics;
