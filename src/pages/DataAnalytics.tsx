import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ChartGrid } from '@/components/analytics/ChartGrid';
import { ChartModal } from '@/components/analytics/ChartModal';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthPage';
import Highcharts from 'highcharts';
import { Spin, Alert, Button } from 'antd';

// Import necessary Highcharts modules for basic chart types
import HighchartsMore from 'highcharts/highcharts-more';
import Highcharts3D from 'highcharts/highcharts-3d';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsAccessibility from 'highcharts/modules/accessibility';
import HighchartsBullet from 'highcharts/modules/bullet';
import Streamgraph from 'highcharts/modules/streamgraph'; // Import the Streamgraph module

// Initialize Highcharts modules once globally
HighchartsMore(Highcharts);
Highcharts3D(Highcharts);
HighchartsExporting(Highcharts);
HighchartsAccessibility(Highcharts);
HighchartsBullet(Highcharts);
Streamgraph(Highcharts); // Initialize the Streamgraph module

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
  type: 'line' | 'bar' | 'pie' | 'area' | 'column' | 'spline' | 'areaspline' | 'bullet' | 'streamgraph';
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

      // Fetch all dynamic charts concurrently
      const [
        revenueTrendRes,
        transactionVolumeRes,
        customerLTVRes,
        productStockRes,
        transactionBreakdownRes,
        payrollDistributionRes,
        topSellingProductsRes,
      ] = await Promise.all([
        fetch('https://quantnow.onrender.com/api/charts/revenue-trend', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/transaction-volume', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/customer-lifetime-value', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/product-stock-levels', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/transaction-type-breakdown', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/payroll-distribution', { headers }),
        fetch('https://quantnow.onrender.com/api/charts/top-selling-products', { headers }),
      ]);

      // Check all responses for success
      if (!revenueTrendRes.ok) throw new Error('Failed to fetch revenue trend data');
      if (!transactionVolumeRes.ok) throw new Error('Failed to fetch transaction volume data');
      if (!customerLTVRes.ok) throw new Error('Failed to fetch customer lifetime value data');
      if (!productStockRes.ok) throw new Error('Failed to fetch product stock levels data');
      if (!transactionBreakdownRes.ok) throw new Error('Failed to fetch transaction type breakdown data');
      if (!payrollDistributionRes.ok) throw new Error('Failed to fetch payroll distribution data');
      if (!topSellingProductsRes.ok) throw new Error('Failed to fetch top-selling products data');

      // Parse all JSON data
      const revenueTrendData = await revenueTrendRes.json();
      const transactionVolumeData = await transactionVolumeRes.json();
      const customerLTVData = await customerLTVRes.json();
      const productStockData = await productStockRes.json();
      const transactionBreakdownData = await transactionBreakdownRes.json();
      const payrollDistributionData = await payrollDistributionRes.json();
      const topSellingProductsData = await topSellingProductsRes.json();

      const charts: ChartData[] = [];

      // 1. Revenue, Expenses, and Profit Trend (Spline Area Chart with Stacking)
      const revenueCategories = revenueTrendData.map((d: any) => d.month);
      const revenueSeriesData = revenueTrendData.map((d: any) => d.revenue);
      const expensesSeriesData = revenueTrendData.map((d: any) => d.expenses);
      const profitSeriesData = revenueTrendData.map((d: any) => d.profit);

      charts.push({
        id: 'revenue-trend',
        title: 'Revenue, Expenses, and Profit Trend',
        type: 'areaspline',
        data: [],
        config: {
          chart: { type: 'areaspline', backgroundColor: 'transparent' },
          title: { text: 'Monthly Financial Performance' },
          xAxis: { categories: revenueCategories },
          yAxis: { title: { text: 'Amount (ZAR)' } },
          plotOptions: {
            areaspline: {
              stacking: 'normal',
              lineColor: '#666666',
              lineWidth: 1,
              marker: {
                lineWidth: 1,
                lineColor: '#666666'
              }
            },
            series: {
              animation: {
                duration: 1000
              }
            }
          },
          series: [
            { name: 'Revenue', data: revenueSeriesData, type: 'areaspline', color: '#4CAF50' },
            { name: 'Expenses', data: expensesSeriesData, type: 'areaspline', color: '#F44336' },
            { name: 'Profit', data: profitSeriesData, type: 'line', color: '#2196F3', dashStyle: 'Solid', lineWidth: 2, marker: { enabled: true, radius: 4 } },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 2. Transaction Volume (3D Column Chart)
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
          chart: {
            type: 'column',
            options3d: {
              enabled: true,
              alpha: 15,
              beta: 15,
              depth: 50,
              viewDistance: 25
            },
            backgroundColor: 'transparent'
          },
          title: { text: 'Monthly Transaction Volume' },
          xAxis: { categories: transactionCategories },
          yAxis: { title: { text: 'Count' } },
          plotOptions: {
            column: {
              depth: 25,
              dataLabels: {
                enabled: true,
                format: '{y}'
              },
              animation: {
                duration: 1000
              }
            }
          },
          series: [
            { name: 'Quotations', data: quotesSeriesData, type: 'column', color: '#FFC107' },
            { name: 'Invoices', data: invoicesSeriesData, type: 'column', color: '#03A9F4' },
            { name: 'Purchases', data: purchasesSeriesData, type: 'column', color: '#9C27B0' },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 3. Customer Lifetime Value Distribution (Donut Chart with Center Label)
      // This now uses data dynamically calculated from sales and customers tables in the backend
      const customerLTVPieData = customerLTVData.map((d: any) => ({
        name: d.bucket,
        y: parseInt(d.count, 10),
      }));

      charts.push({
        id: 'customer-ltv',
        title: 'Customer Value Distribution',
        type: 'pie',
        data: [],
        config: {
          chart: { type: 'pie', backgroundColor: 'transparent' },
          title: { text: 'Distribution of Customers by Value' },
          plotOptions: {
            pie: {
              innerSize: '60%', // Donut chart
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                distance: -50,
                style: {
                  color: 'black'
                }
              },
              showInLegend: true,
              animation: {
                duration: 1000
              }
            }
          },
          series: [{
            name: 'Customers',
            colorByPoint: true,
            data: customerLTVPieData,
            type: 'pie',
            center: ['50%', '50%'],
            size: '100%'
          }],
        },
        isLoading: false,
        error: null,
      });

      // NEW CHART: 7. Top 5 Selling Products (Bar Chart)
      const topProductsCategories = topSellingProductsData.map((d: any) => d.product_name);
      const topProductsSeriesData = topSellingProductsData.map((d: any) => parseInt(d.total_quantity_sold, 10));

      charts.push({
        id: 'top-selling-products',
        title: 'Top 5 Selling Products',
        type: 'bar',
        data: [],
        config: {
          chart: { type: 'bar', backgroundColor: 'transparent' },
          title: { text: 'Top 5 Products by Quantity Sold' },
          xAxis: { categories: topProductsCategories, title: { text: 'Product Name' } },
          yAxis: { title: { text: 'Quantity Sold' } },
          tooltip: {
            pointFormat: '<b>{point.y} units</b>'
          },
          plotOptions: {
            bar: {
              dataLabels: {
                enabled: true,
                format: '{point.y}'
              },
              animation: { duration: 1000 }
            }
          },
          series: [{
            name: 'Quantity Sold',
            data: topProductsSeriesData,
            type: 'bar',
            color: '#607D8B'
          }],
        },
        isLoading: false,
        error: null,
      });


      // 4. Product Stock Levels (Combination Chart with Range Area and Columns)
      const productStockCategories = productStockData.map((d: any) => d.name);
      const currentStockData = productStockData.map((d: any) => d.current);
      const minStockData = productStockData.map((d: any) => [d.min, d.max]);
      const maxStockData = productStockData.map((d: any) => d.max);

      charts.push({
        id: 'product-stock-levels',
        title: 'Product Stock Levels',
        type: 'column',
        data: [],
        config: {
          chart: { type: 'column', backgroundColor: 'transparent' },
          title: { text: 'Current Stock vs. Min/Max Range' },
          xAxis: { categories: productStockCategories },
          yAxis: { title: { text: 'Quantity' } },
          plotOptions: {
            series: {
              animation: {
                duration: 1000
              }
            }
          },
          series: [
            {
              name: 'Acceptable Range',
              data: productStockData.map((d: any) => [d.min, d.max]),
              type: 'arearange',
              lineWidth: 0,
              linkedTo: ':previous',
              color: Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0.3).get(),
              zIndex: 0,
              marker: { enabled: false },
              tooltip: {
                pointFormat: 'Range: {point.low} - {point.high}<br/>'
              }
            },
            {
              name: 'Current Stock',
              data: currentStockData,
              type: 'column',
              color: '#4CAF50',
              zIndex: 1,
              tooltip: {
                pointFormat: 'Current: {point.y}<br/>'
              }
            },
            { name: 'Min Threshold', data: productStockData.map((d: any) => d.min), type: 'line', color: '#FF9800', dashStyle: 'Dot', marker: { enabled: false } },
            { name: 'Max Threshold', data: productStockData.map((d: any) => d.max), type: 'line', color: '#2196F3', dashStyle: 'Dot', marker: { enabled: false } },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 5. Transaction Type Breakdown (Streamgraph)
      const transactionBreakdownMonths = Object.keys(transactionBreakdownData);
      const salesData = transactionBreakdownMonths.map(month => transactionBreakdownData[month].sale);
      const incomeData = transactionBreakdownMonths.map(month => transactionBreakdownData[month].income);
      const expenseData = transactionBreakdownMonths.map(month => transactionBreakdownData[month].expense);
      const cashInData = transactionBreakdownMonths.map(month => transactionBreakdownData[month].cash_in);

      charts.push({
        id: 'transaction-type-breakdown',
        title: 'Monthly Transaction Breakdown',
        type: 'streamgraph',
        data: [],
        config: {
          chart: { type: 'streamgraph', backgroundColor: 'transparent' },
          title: { text: 'Monthly Financial Transaction Breakdown' },
          xAxis: {
            categories: transactionBreakdownMonths,
            crosshair: true,
            labels: {
              align: 'left',
              reserveSpace: false,
              rotation: 270
            },
            lineWidth: 0,
            margin: 20,
            tickWidth: 0
          },
          yAxis: {
            visible: false,
            startOnTick: false,
            endOnTick: false
          },
          plotOptions: {
            streamgraph: {
              lineWidth: 0,
              marker: {
                enabled: false
              },
              animation: {
                duration: 1000
              }
            }
          },
          series: [
            { name: 'Sales', data: salesData, type: 'streamgraph', color: '#8BC34A' },
            { name: 'Income', data: incomeData, type: 'streamgraph', color: '#FFEB3B' },
            { name: 'Expenses', data: expenseData, type: 'streamgraph', color: '#FF5722' },
            { name: 'Cash In', data: cashInData, type: 'streamgraph', color: '#00BCD4' },
          ],
        },
        isLoading: false,
        error: null,
      });

      // 6. Payroll Distribution (Spline Area Chart with Gradient)
      const payrollMonths = payrollDistributionData.map((d: any) => d.month);
      const totalPayrollData = payrollDistributionData.map((d: any) => parseFloat(d.total_payroll));

      charts.push({
        id: 'payroll-distribution',
        title: 'Monthly Payroll Distribution',
        type: 'areaspline',
        data: [],
        config: {
          chart: { type: 'areaspline', backgroundColor: 'transparent' },
          title: { text: 'Total Payroll Expenses Over Time' },
          xAxis: { categories: payrollMonths },
          yAxis: { title: { text: 'Amount (ZAR)' } },
          plotOptions: {
            areaspline: {
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, Highcharts.getOptions().colors[0]],
                  [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get()]
                ]
              },
              marker: {
                enabled: false
              },
              lineWidth: 2,
              states: {
                hover: {
                  lineWidth: 3
                }
              },
              threshold: null,
              animation: {
                duration: 1000
              }
            }
          },
          series: [{
            name: 'Payroll',
            data: totalPayrollData,
            type: 'areaspline',
            color: '#673AB7'
          }],
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
