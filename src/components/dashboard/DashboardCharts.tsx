import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../AuthPage'; // Import useAuth

const API_BASE_URL = 'https://quantnow.onrender.com'; // Changed to localhost:3000 based on previous context

interface RevenueDataPoint {
  month: string;
  profit: number;
  expenses: number;
  revenue: number;
}

interface InvoiceDataPoint {
  month: string;
  quotes: number;
  invoices: number;
  purchases: number;
}

// Update component props to accept a date range
export function DashboardCharts({ startDate, endDate }: { startDate: Date | null, endDate: Date | null }) {
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceDataPoint[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth(); // Get authentication status
  // FIX: Change 'token' to 'access_token' to match the key used in AuthPage.tsx
  const token = localStorage.getItem('token'); // Retrieve the token

  // Helper function to format date for API
  const formatDateForApi = (date: Date | null): string | null => {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Construct query parameters for the date range
  const getPeriodQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);

    if (formattedStartDate) {
      params.append('startDate', formattedStartDate);
    }
    if (formattedEndDate) {
      params.append('endDate', formattedEndDate);
    }
    return params.toString() ? `?${params.toString()}` : '';
  }, [startDate, endDate]);


  // Fetch Revenue Trend Data
  const fetchRevenueData = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for revenue data.');
      setRevenueData([]);
      setIsLoadingRevenue(false);
      return;
    }

    setIsLoadingRevenue(true);
    setRevenueError(null);
    try {
      const queryParams = getPeriodQueryParams();
      const url = `${API_BASE_URL}/api/charts/revenue-trend${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: RevenueDataPoint[] = await response.json();
      setRevenueData(data);
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      setRevenueError(err.message || 'Failed to load revenue data.');
    } finally {
      setIsLoadingRevenue(false);
    }
  }, [getPeriodQueryParams, token]);


  // Fetch Transaction Volume Data
  const fetchInvoiceData = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for invoice data.');
      setInvoiceData([]);
      setIsLoadingInvoice(false);
      return;
    }

    setIsLoadingInvoice(true);
    setInvoiceError(null);
    try {
      const queryParams = getPeriodQueryParams();
      const url = `${API_BASE_URL}/api/charts/transaction-volume${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: InvoiceDataPoint[] = await response.json();
      setInvoiceData(data);
    } catch (err: any) {
      console.error('Error fetching invoice data:', err);
      setInvoiceError(err.message || 'Failed to load invoice data.');
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [getPeriodQueryParams, token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchRevenueData();
      fetchInvoiceData();
    } else {
      setRevenueData([]);
      setInvoiceData([]);
      setIsLoadingRevenue(false);
      setIsLoadingInvoice(false);
      setRevenueError('Please log in to view charts.');
      setInvoiceError('Please log in to view charts.');
    }
  }, [fetchRevenueData, fetchInvoiceData, isAuthenticated, token]);

  // Generate date range string for titles
  const getDateRangeString = () => {
    const start = startDate ? startDate.toLocaleDateString() : '';
    const end = endDate ? endDate.toLocaleDateString() : '';

    if (start && end && start === end) return `for ${start}`;
    if (start && end) return `from ${start} to ${end}`;
    if (start) return `from ${start}`;
    if (end) return `until ${end}`;
    return ''; // No date range selected
  };

  // Highcharts options for Revenue Trend
  const revenueOptions = {
    title: { text: `Revenue Trend (Profit vs Expenses) ${getDateRangeString()}` },
    xAxis: { categories: revenueData.map(item => item.month) },
    yAxis: { title: { text: 'Amount (ZAR)' } },
    tooltip: { shared: true },
    series: [
      {
        name: 'Profit',
        data: revenueData.map(item => item.profit),
        type: 'line',
        color: '#2563eb'
      },
      {
        name: 'Expenses',
        data: revenueData.map(item => item.expenses),
        type: 'line',
        color: '#10b981'
      },
      {
        name: 'Revenue',
        data: revenueData.map(item => item.revenue),
        type: 'line',
        color: '#f59e0b'
      }
    ]
  };

  // Highcharts options for Invoice vs Quotes
  const invoiceOptions = {
    chart: { type: 'column' },
    title: { text: `Invoice vs Quotes  ${getDateRangeString()}` },
    xAxis: { categories: invoiceData.map(item => item.month) },
    yAxis: { title: { text: 'Count' } },
    tooltip: { shared: true },
    plotOptions: { column: { grouping: true } },
    series: [
      {
        name: 'Quotes',
        data: invoiceData.map(item => item.quotes),
        color: '#2563eb'
      },
      {
        name: 'Invoices',
        data: invoiceData.map(item => item.invoices),
        color: '#10b981'
      }
    ]
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Profit vs Expenses)</CardTitle>
            <CardDescription>
              Monthly financial performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className='flex justify-center items-center h-60'>
                <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
                <span className='ml-2 text-gray-600'>Loading revenue chart...</span>
              </div>
            ) : revenueError ? (
              <div className='text-center text-red-500 p-4 border border-red-300 rounded-md h-60 flex flex-col justify-center items-center'>
                <p>Error: {revenueError}</p>
                <Button onClick={fetchRevenueData} className='mt-2'>Retry</Button>
              </div>
            ) : (
              <HighchartsReact highcharts={Highcharts} options={revenueOptions} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Invoice vs Quotes</CardTitle>
            <CardDescription>Business transaction volume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvoice ? (
              <div className='flex justify-center items-center h-60'>
                <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
                <span className='ml-2 text-gray-600'>Loading transaction chart...</span>
              </div>
            ) : invoiceError ? (
              <div className='text-center text-red-500 p-4 border border-red-300 rounded-md h-60 flex flex-col justify-center items-center'>
                <p>Error: {invoiceError}</p>
                <Button onClick={fetchInvoiceData} className='mt-2'>Retry</Button>
              </div>
            ) : (
              <HighchartsReact highcharts={Highcharts} options={invoiceOptions} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
