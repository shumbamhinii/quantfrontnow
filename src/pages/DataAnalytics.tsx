import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ChartGrid } from '@/components/analytics/ChartGrid';
import { ChartModal } from '@/components/analytics/ChartModal';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthPage';
import Highcharts from 'highcharts';
import { Spin, Alert, Button } from 'antd';

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
  cart?: Array<{ id: string; quantity: number }>;
}

// Define a type for Product/Service data from backend
interface ProductService {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  price: number;
  purchasePrice?: number;
  unitPurchasePrice?: number;
  sku?: string;
  isService: boolean;
  qty: number;
  stockQuantity: number;
  unit?: string;
  minQty?: number;
  maxQty?: number;
  availableValue?: number;
  taxRateValue?: number;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  category?: string;
}

// Define a type for Customer data from backend
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  total_invoiced: number;
  created_at: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'column';
  data: (string | number)[][];
  config: Highcharts.Options;
  isLoading: boolean;
  error: string | null;
}

const DataAnalytics = () => {
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allChartData, setAllChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
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
        'Authorization': `Bearer ${token}`,
      };

      // Fetch only the two dynamic charts concurrently
      const [
        revenueTrendRes,
        transactionVolumeRes,
      ] = await Promise.all([
        fetch('https://quantnow.onrender.com/api/charts/revenue-trend', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/transaction-volume', { headers }),
      ]);

      // Check all responses for success
      if (!revenueTrendRes.ok) throw new Error('Failed to fetch revenue trend data');
      if (!transactionVolumeRes.ok) throw new Error('Failed to fetch transaction volume data');

      // Parse all JSON data
      const revenueTrendData = await revenueTrendRes.json();
      const transactionVolumeData = await transactionVolumeRes.json();

      const charts: ChartData[] = [];

      // 1. Revenue, Expenses, and Profit Trend (Dynamic - Fetched from API)
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

      // 2. Transaction Volume (Dynamic - Fetched from API)
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

      // --- All charts from here onwards are hardcoded as requested ---

      // 3. Expenses by Category (Pie Chart) - Hardcoded
      const expenseCategorySeries = [
        { name: 'Payroll', y: 30000 },
        { name: 'Rent', y: 12000 },
        { name: 'Utilities', y: 5500 },
        { name: 'Supplies', y: 8000 },
        { name: 'Marketing', y: 4500 },
        { name: 'Maintenance', y: 3000 },
      ];



      // 4. Top N Selling Products/Services (Bar Chart) - Hardcoded
      const topSellingProductsData = [
        { name: 'Product A', y: 1500 },
        { name: 'Service B', y: 1250 },
        { name: 'Product C', y: 980 },
        { name: 'Service D', y: 750 },
        { name: 'Product E', y: 620 },
      ];

      charts.push({
        id: 'top-selling-products',
        title: `Top 5 Selling Products/Services`,
        type: 'bar',
        data: [],
        config: {
          chart: { type: 'bar' },
          title: { text: `Top 5 Selling Products/Services by Quantity` },
          xAxis: { categories: topSellingProductsData.map(item => item.name), title: { text: 'Product/Service' } },
          yAxis: { title: { text: 'Quantity Sold' } },
          series: [{
            name: 'Quantity Sold',
            data: topSellingProductsData.map(item => item.y),
            type: 'bar',
          }],
          legend: { enabled: false },
        },
        isLoading: false,
        error: null,
      });

      // 5. Customer Lifetime Value Distribution (Pie Chart) - Hardcoded
      const customerValueSeries = [
        { name: 'Low Value (<R1000)', y: 45 },
        { name: 'Medium Value (R1000-R5000)', y: 30 },
        { name: 'High Value (>R5000)', y: 25 },
      ];



      // 6. Product Stock Levels vs. Thresholds (Column Chart with plot lines) - Hardcoded
      const hardcodedProductsWithStock = [
        { name: 'Item 1', current: 150, min: 50, max: 200 },
        { name: 'Item 2', current: 30, min: 20, max: 50 },
        { name: 'Item 3', current: 210, min: 100, max: 250 },
        { name: 'Item 4', current: 80, min: 70, max: 120 },
      ];

      charts.push({
        id: 'product-stock-levels',
        title: 'Product Stock Levels vs. Thresholds',
        type: 'column',
        data: [],
        config: {
          chart: { type: 'column' },
          title: { text: 'Current Stock vs. Min/Max Thresholds' },
          xAxis: { categories: hardcodedProductsWithStock.map(p => p.name), title: { text: 'Product' } },
          yAxis: { title: { text: 'Quantity' } },
          series: [
            { name: 'Current Stock', data: hardcodedProductsWithStock.map(p => p.current), type: 'column' },
            { name: 'Minimum Stock', data: hardcodedProductsWithStock.map(p => p.min), type: 'line', dashStyle: 'Dot', marker: { enabled: false } },
            { name: 'Maximum Stock', data: hardcodedProductsWithStock.map(p => p.max), type: 'line', dashStyle: 'Dot', marker: { enabled: false } },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 7. Monthly Transaction Types Breakdown (Stacked Column Chart) - Hardcoded
      const hardcodedMonthlyTransactionData = {
        '2023-11': { sale: 80000, income: 5000, expense: 20000, cash_in: 3000 },
        '2023-12': { sale: 95000, income: 8000, expense: 25000, cash_in: 4000 },
        '2024-01': { sale: 110000, income: 6500, expense: 22000, cash_in: 5000 },
        '2024-02': { sale: 120000, income: 7000, expense: 24000, cash_in: 6000 },
      };

      const sortedMonths = Object.keys(hardcodedMonthlyTransactionData).sort();
      const salesData = sortedMonths.map(month => hardcodedMonthlyTransactionData[month]['sale'] || 0);
      const cashInData = sortedMonths.map(month => hardcodedMonthlyTransactionData[month]['cash_in'] || 0);
      const expenseData = sortedMonths.map(month => hardcodedMonthlyTransactionData[month]['expense'] || 0);
      const incomeData = sortedMonths.map(month => hardcodedMonthlyTransactionData[month]['income'] || 0);

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
                format: 'R{point.y:,.0f}',
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

      // 8. Customer Retention Rate (Line Chart) - Hardcoded
      const customerRetentionData = [
        { month: 'Nov 23', retention: 95 },
        { month: 'Dec 23', retention: 92 },
        { month: 'Jan 24', retention: 94 },
        { month: 'Feb 24', retention: 96 },
        { month: 'Mar 24', retention: 91 },
      ];

      charts.push({
        id: 'customer-retention-rate',
        title: 'Customer Retention Rate',
        type: 'line',
        data: [],
        config: {
          chart: { type: 'line' },
          title: { text: 'Customer Retention Rate Over Time' },
          xAxis: { categories: customerRetentionData.map(d => d.month), title: { text: 'Month' } },
          yAxis: { 
            title: { text: 'Retention Rate (%)' },
            min: 80, // Set a minimum value for better visualization
            max: 100,
          },
          series: [{
            name: 'Retention Rate',
            data: customerRetentionData.map(d => d.retention),
            type: 'line',
          }],
          tooltip: {
            pointFormat: '{series.name}: <b>{point.y}%</b>'
          },
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
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchChartData();
    } else {
      setAllChartData([]);
      setLoading(false);
      setError('Please log in to view analytics.');
    }
  }, [fetchChartData, isAuthenticated, token]);

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
