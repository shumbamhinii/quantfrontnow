import { useState } from 'react'
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
import { TrendingUp, Calendar, BarChart3, FolderKanban } from 'lucide-react' // Added FolderKanban icon

// Initialize the waterfall module
if (typeof HighchartsMore === 'function') HighchartsMore(Highcharts)

const Projections = () => {
  const [revenueGrowthRate, setRevenueGrowthRate] = useState(5)
  const [costGrowthRate, setCostGrowthRate] = useState(3)
  const [expenseGrowthRate, setExpenseGrowthRate] = useState(2)

  // Sample baseline data
  const baselineData = {
    sales: 1801157,
    costOfGoods: 124561,
    grossProfit: 1676596,
    totalExpenses: 495875,
    netProfit: 1180721
  }

  // Static project allocations for demonstration
  const projectAllocations = [
    { name: 'Marketing Campaign A', allocation: 0.30 }, // 30% of total expenses
    { name: 'Product Development X', allocation: 0.45 }, // 45%
    { name: 'Operational Efficiency Y', allocation: 0.15 }, // 15%
    { name: 'General Overhead', allocation: 0.10 } // 10%
  ];


  const generateProjectionData = (periods: number, isYearly = false) => {
    const data = []
    const periodLabel = isYearly ? 'Year' : 'Month'

    for (let i = 0; i <= periods; i++) {
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
        period: i === 0 ? 'Baseline' : `${periodLabel} ${i}`,
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
  const transformToInvertedTableData = (projectionData) => {
    if (!projectionData || projectionData.length === 0) return { headers: [], rows: [] };

    const headers = projectionData.map(d => d.period); // Periods become headers
    const metrics = [
      { key: 'sales', label: 'Sales' },
      { key: 'costs', label: 'Cost of Goods' },
      { key: 'grossProfit', label: 'Gross Profit' },
      { key: 'expenses', label: 'Total Expenses' },
      { key: 'netProfit', label: 'Net Profit' },
    ];

    const rows = metrics.map(metric => {
      const rowData = {
        metric: metric.label,
        values: projectionData.map(d => d[metric.key])
      };
      return rowData;
    });

    return { headers, rows };
  };


  const createChartOptions = (data, title) => ({
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
            'R' + Highcharts.numberFormat(this.value, 0, '.', ',')
          )
        }
      }
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.series.name}</b><br/>${
          this.x
        }: R${Highcharts.numberFormat(this.y, 0, '.', ',')}`
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
    ],
    legend: {
      enabled: true
    },
    credits: {
      enabled: false
    }
  })

  const createWaterfallOptions = (data) => {
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
              'R' + Highcharts.numberFormat(this.value, 0, '.', ',')
            )
          }
        }
      },
      tooltip: {
        formatter: function () {
          return `<b>${this.point.name}</b><br/>R${Highcharts.numberFormat(
            this.y,
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
      ],
      credits: {
        enabled: false
      }
    }
  }

  const projectionData12Months = generateProjectionData(12)
  const projectionData5Years = generateProjectionData(5, true)

  const inverted12MonthData = transformToInvertedTableData(projectionData12Months);
  const inverted5YearData = transformToInvertedTableData(projectionData5Years);

  // Calculate project expenses for the baseline
  const baselineProjectExpenses = projectAllocations.map(project => ({
    name: project.name,
    amount: Math.round(baselineData.totalExpenses * project.allocation)
  }));


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
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Projection Parameters
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projection Tabs */}
        <Tabs defaultValue='12-months' className='w-full'>
          <TabsList className='grid w-full grid-cols-4'> {/* Increased grid-cols for new tab */}
            <TabsTrigger value='12-months' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              12 Months
            </TabsTrigger>
            <TabsTrigger value='5-years' className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />5 Years
            </TabsTrigger>
            <TabsTrigger value='project-breakdown' className='flex items-center gap-2'> {/* New Tab */}
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

            {/* Inverted 12-Month Projection Table */}
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
                          key={row.metric} // Use metric name as key
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

            {/* Inverted 5-Year Summary Table */}
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
                          key={row.metric} // Use metric name as key
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

          {/* New Tab for Project Breakdown */}
          <TabsContent value='project-breakdown' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FolderKanban className='h-5 w-5' />
                  Baseline Expense Breakdown by Project (Static Allocation)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
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
                          R{baselineData.totalExpenses.toLocaleString('en-ZA')}
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
      </motion.div>
    </div>
  )
}

export default Projections
