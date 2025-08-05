import React, { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'
import { TrendingUp, Calendar, BarChart3, FolderKanban, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '../AuthPage' // Import useAuth
import axios from 'axios'

// Initialize the Highcharts-more module for waterfall charts
if (typeof HighchartsMore === 'function') HighchartsMore(Highcharts)

// IMPORTANT: Replace with your actual backend API URL
const API_BASE_URL = 'https://quantnow.onrender.com';

const Projections = () => {
  const { toast } = useToast()
  // Get isAuthenticated from the hook, and the token from localStorage
  const { isAuthenticated } = useAuth()
  const token = localStorage.getItem('token');
  
  const [revenueGrowthRate, setRevenueGrowthRate] = useState(5)
  const [costGrowthRate, setCostGrowthRate] = useState(3)
  const [expenseGrowthRate, setExpenseGrowthRate] = useState(2)
  const [baselineData, setBaselineData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Memoized function to get authentication headers
  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // Use useCallback to memoize the function and prevent unnecessary re-creations
  const fetchBaselineData = useCallback(async () => {
    setIsRefreshing(true);
    
    // The useEffect hook now handles the isAuthenticated and token checks,
    // so we can remove the check here for a cleaner function.
    // The toast message is now handled by the UI when the refresh button is disabled.

    try {
      const response = await axios.get(`${API_BASE_URL}/api/projections/baseline-data`, {
        headers: getAuthHeaders(),
      })
      setBaselineData(response.data)
      toast({
        title: 'Success',
        description: 'Financial baseline data loaded successfully.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error fetching baseline data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load financial baseline data.',
        variant: 'destructive'
      })
      setBaselineData(null);
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [getAuthHeaders, toast])

  // Initial data fetch on component mount. Now also depends on 'token'.
  // This ensures the fetch only happens when both isAuthenticated and a valid token are present.
  useEffect(() => {
    // Only fetch if authenticated AND a token exists in local storage
    if (isAuthenticated && token) {
      fetchBaselineData()
    } else {
      // If not authenticated or token is not yet available, stop the loading state.
      setIsLoading(false);
    }
  }, [isAuthenticated, token, fetchBaselineData])

  // A new function to handle the refresh button click
  const handleRefresh = () => {
    if (isAuthenticated && token) {
      fetchBaselineData();
    } else {
      toast({
        title: 'Error',
        description: 'Authentication required. Please log in to view projections.',
        variant: 'destructive',
      })
    }
  }

  const generateProjectionData = (periods: number, isYearly = false) => {
    if (!baselineData) return []
    
    const data = []
    const periodLabel = isYearly ? 'Year' : 'Month'

    for (let i = 0; i <= periods; i++) {
      // The baseline data is at index 0, so no growth is applied
      if (i === 0) {
        const grossProfit = baselineData.sales - baselineData.costOfGoods
        const netProfit = grossProfit - baselineData.totalExpenses
        data.push({
          period: 'Baseline',
          sales: Math.round(baselineData.sales),
          costs: Math.round(baselineData.costOfGoods),
          expenses: Math.round(baselineData.totalExpenses),
          grossProfit: Math.round(grossProfit),
          netProfit: Math.round(netProfit)
        })
        continue // Skip to the next iteration
      }
      
      const multiplier = isYearly ? i : i / 12
      const sales =
        baselineData.sales * Math.pow(1 + revenueGrowthRate / 100, multiplier)
      const costs =
        baselineData.costOfGoods *
        Math.pow(1 + costGrowthRate / 100, multiplier)
      const expenses =
        baselineData.totalExpenses *
        Math.pow(1 + expenseGrowthRate / 100, multiplier)
      const grossProfit = sales - costs
      const netProfit = grossProfit - expenses

      data.push({
        period: `${periodLabel} ${i}`,
        sales: Math.round(sales),
        costs: Math.round(costs),
        expenses: Math.round(expenses),
        grossProfit: Math.round(grossProfit),
        netProfit: Math.round(netProfit)
      })
    }
    return data
  }

  // Helper to transform data for the inverted table (metrics as rows, periods as columns)
  const transformToInvertedTableData = (projectionData: any[]) => {
    if (!projectionData || projectionData.length === 0) return { headers: [], rows: [] }

    const headers = projectionData.map(d => d.period) // Periods become headers
    const metrics = [
      { key: 'sales', label: 'Sales' },
      { key: 'costs', label: 'Cost of Goods' },
      { key: 'grossProfit', label: 'Gross Profit' },
      { key: 'expenses', label: 'Total Expenses' },
      { key: 'netProfit', label: 'Net Profit' }
    ]

    const rows = metrics.map(metric => {
      const rowData = {
        metric: metric.label,
        values: projectionData.map(d => d[metric.key])
      }
      return rowData
    })

    return { headers, rows }
  }

  const createChartOptions = (data: any[], title: string) => {
    if (!data || data.length === 0) {
      return {
        title: { text: title },
        series: [],
        noData: { style: { fontWeight: 'bold', fontSize: '15px' }, position: { verticalAlign: 'middle' }, text: 'No data available to display chart.' }
      };
    }
    
    return {
      chart: {
        type: 'line',
        height: 400
      },
      title: {
        text: title
      },
      xAxis: {
        categories: data.map(d => d.period)
      },
      yAxis: {
        title: {
          text: 'Amount (R)'
        },
        labels: {
          formatter: function () {
            return (
              'R' + Highcharts.numberFormat(this.value as number, 0, '.', ',')
            )
          }
        }
      },
      tooltip: {
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          return `<b>${this.series.name}</b><br/>${
            this.x
          }: R${Highcharts.numberFormat(this.y as number, 0, '.', ',')}`
        }
      },
      series: [
        {
          name: 'Sales',
          data: data.map(d => d.sales),
          color: '#3b82f6'
        },
        {
          name: 'Gross Profit',
          data: data.map(d => d.grossProfit),
          color: '#10b981'
        },
        {
          name: 'Net Profit',
          data: data.map(d => d.netProfit),
          color: '#8b5cf6'
        }
      ] as Highcharts.SeriesOptionsType[],
      legend: {
        enabled: true
      },
      credits: {
        enabled: false
      }
    }
  }

  const createWaterfallOptions = (data: any[]) => {
    if (!data || data.length === 0) {
      return {
        title: { text: 'Profit & Loss Waterfall - Latest Projection' },
        series: [],
        noData: { style: { fontWeight: 'bold', fontSize: '15px' }, position: { verticalAlign: 'middle' }, text: 'No data available to display chart.' }
      };
    }

    const latestData = data[data.length - 1]
    return {
      chart: {
        type: 'waterfall',
        height: 400
      },
      title: {
        text: 'Profit & Loss Waterfall - Latest Projection'
      },
      xAxis: {
        type: 'category'
      },
      yAxis: {
        title: {
          text: 'Amount (R)'
        },
        labels: {
          formatter: function () {
            return (
              'R' + Highcharts.numberFormat(this.value as number, 0, '.', ',')
            )
          }
        }
      },
      tooltip: {
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          return `<b>${this.point.name}</b><br/>R${Highcharts.numberFormat(
            this.y as number,
            0,
            '.',
            ','
          )}`
        }
      },
      series: [
        {
          upColor: '#10b981',
          color: '#ef4444',
          data: [
            {
              name: 'Sales',
              y: latestData.sales
            },
            {
              name: 'Cost of Goods',
              y: -latestData.costs
            },
            {
              name: 'Gross Profit',
              isIntermediateSum: true,
              color: '#3b82f6'
            },
            {
              name: 'Expenses',
              y: -latestData.expenses
            },
            {
              name: 'Net Profit',
              isSum: true,
              color: '#8b5cf6'
            }
          ]
        }
      ] as Highcharts.SeriesOptionsType[],
      credits: {
        enabled: false
      }
    }
  }

  // Generate projection data only if baselineData is available
  const projectionData12Months = baselineData ? generateProjectionData(12) : []
  const projectionData5Years = baselineData ? generateProjectionData(5, true) : []

  const inverted12MonthData = transformToInvertedTableData(projectionData12Months)
  const inverted5YearData = transformToInvertedTableData(projectionData5Years)

  // Static project allocations for demonstration
  const projectAllocations = [
    { name: 'Marketing Campaign A', allocation: 0.30 }, // 30% of total expenses
    { name: 'Product Development X', allocation: 0.45 }, // 45%
    { name: 'Operational Efficiency Y', allocation: 0.15 }, // 15%
    { name: 'General Overhead', allocation: 0.10 } // 10%
  ]

  // Calculate project expenses for the baseline
  const baselineProjectExpenses = baselineData
    ? projectAllocations.map(project => ({
        name: project.name,
        amount: Math.round(baselineData.totalExpenses * project.allocation)
      }))
    : []

  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Financial Projections' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='space-y-6'
      >
        {/* Growth Rate Controls */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Projection Parameters
              </span>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing || !isAuthenticated || !token}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Baseline Data'
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <Label htmlFor='revenue-growth'>Revenue Growth Rate (%)</Label>
                <Input
                  id='revenue-growth'
                  type='number'
                  value={revenueGrowthRate}
                  onChange={e => setRevenueGrowthRate(Number(e.target.value))}
                  min='0'
                  max='100'
                  step='0.1'
                  disabled={isLoading || !isAuthenticated || !token}
                />
              </div>
              <div>
                <Label htmlFor='cost-growth'>
                  Direct Costs Growth Rate (%)
                </Label>
                <Input
                  id='cost-growth'
                  type='number'
                  value={costGrowthRate}
                  onChange={e => setCostGrowthRate(Number(e.target.value))}
                  min='0'
                  max='100'
                  step='0.1'
                  disabled={isLoading || !isAuthenticated || !token}
                />
              </div>
              <div>
                <Label htmlFor='expense-growth'>Expenses Growth Rate (%)</Label>
                <Input
                  id='expense-growth'
                  type='number'
                  value={expenseGrowthRate}
                  onChange={e => setExpenseGrowthRate(Number(e.target.value))}
                  min='0'
                  max='100'
                  step='0.1'
                  disabled={isLoading || !isAuthenticated || !token}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className='flex justify-center items-center h-96'>
            <Loader2 className='h-12 w-12 animate-spin text-gray-500' />
          </div>
        ) : (
          <Tabs defaultValue='12-months' className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='12-months' className='flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                12 Months
              </TabsTrigger>
              <TabsTrigger value='5-years' className='flex items-center gap-2'>
                <TrendingUp className='h-4 w-4' />5 Years
              </TabsTrigger>
              <TabsTrigger value='project-breakdown' className='flex items-center gap-2'>
                <FolderKanban className='h-4 w-4' />
                Project Breakdown
              </TabsTrigger>
              <TabsTrigger value='custom' className='flex items-center gap-2'>
                <BarChart3 className='h-4 w-4' />
                Custom Period
              </TabsTrigger>
            </TabsList>

            <TabsContent value='12-months' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>12-Month Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={createChartOptions(
                        projectionData12Months,
                        '12-Month Financial Projection'
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profit Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={createWaterfallOptions(projectionData12Months)}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed 12-Month Projections (Inverted)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse border border-border'>
                      <thead>
                        <tr className='bg-muted'>
                          <th className='border border-border p-3 text-left'>
                            Metric
                          </th>
                          {inverted12MonthData.headers.map((header, index) => (
                            <th key={index} className='border border-border p-3 text-right'>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inverted12MonthData.rows.map((row, rowIndex) => (
                          <tr
                            key={row.metric}
                            className={row.metric === 'Baseline' ? 'bg-blue-50' : ''}
                          >
                            <td className='border border-border p-3 font-medium'>
                              {row.metric}
                            </td>
                            {row.values.map((value, colIndex) => (
                              <td key={colIndex} className='border border-border p-3 text-right'>
                                R{value.toLocaleString('en-ZA')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='5-years' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>5-Year Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={createChartOptions(
                        projectionData5Years,
                        '5-Year Financial Projection'
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Year 5 Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={createWaterfallOptions(projectionData5Years)}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>5-Year Summary Projections (Inverted)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse border border-border'>
                      <thead>
                        <tr className='bg-muted'>
                          <th className='border border-border p-3 text-left'>
                            Metric
                          </th>
                          {inverted5YearData.headers.map((header, index) => (
                            <th key={index} className='border border-border p-3 text-right'>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inverted5YearData.rows.map((row, rowIndex) => (
                          <tr
                            key={row.metric}
                            className={row.metric === 'Baseline' ? 'bg-blue-50' : ''}
                          >
                            <td className='border border-border p-3 font-medium'>
                              {row.metric}
                            </td>
                            {row.values.map((value, colIndex) => (
                              <td key={colIndex} className='border border-border p-3 text-right'>
                                R{value.toLocaleString('en-ZA')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='project-breakdown' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FolderKanban className='h-5 w-5' />
                    Baseline Expense Breakdown by Project (Static Allocation)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-4'>
                    This section demonstrates a project breakdown using static allocations applied to the baseline total expenses.
                    In a real-world scenario, this data would come from your transaction categories or a dedicated project tracking system.
                  </p>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse border border-border'>
                      <thead>
                        <tr className='bg-muted'>
                          <th className='border border-border p-3 text-left'>
                            Project Name
                          </th>
                          <th className='border border-border p-3 text-right'>
                            Allocation (%)
                          </th>
                          <th className='border border-border p-3 text-right'>
                            Baseline Expense (R)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {baselineProjectExpenses.map((project, index) => (
                          <tr key={index}>
                            <td className='border border-border p-3 font-medium'>
                              {project.name}
                            </td>
                            <td className='border border-border p-3 text-right'>
                              {(projectAllocations[index].allocation * 100).toFixed(0)}%
                            </td>
                            <td className='border border-border p-3 text-right'>
                              R{project.amount.toLocaleString('en-ZA')}
                            </td>
                          </tr>
                        ))}
                        <tr className='bg-blue-50 font-bold'>
                          <td className='border border-border p-3'>Total</td>
                          <td className='border border-border p-3 text-right'>100%</td>
                          <td className='border border-border p-3 text-right'>
                            R{baselineData?.totalExpenses.toLocaleString('en-ZA')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='custom' className='space-y-6'>
              <Card>
                <CardContent className='flex items-center justify-center h-64'>
                  <p className='text-muted-foreground'>
                    Custom projection periods will be implemented here - allowing
                    users to select specific start/end dates and custom growth
                    scenarios.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  )
}

export default Projections
