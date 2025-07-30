import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Expand } from 'lucide-react';
import { ChartComponent } from './ChartComponent';
import { motion } from 'framer-motion';
import type { ChartData } from '../../pages/DataAnalytics'; // Import ChartData interface

interface ChartGridProps {
  onExpandChart: (chart: ChartData) => void;
  chartData: ChartData[]; // Add chartData prop
}

export function ChartGrid ({ onExpandChart, chartData }: ChartGridProps) { // Destructure chartData from props
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {chartData.map((chart, index) => (
        <motion.div
          key={chart.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className='relative group h-full flex flex-col'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {chart.title}
              </CardTitle>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onExpandChart(chart)}
                className='opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-10'
              >
                <Expand className='h-4 w-4' />
              </Button>
            </CardHeader>
            <CardContent className='flex-1 flex items-center justify-center p-4'>
              <div className='w-full h-full'>
                {chart.isLoading ? (
                  <p>Loading chart...</p>
                ) : chart.error ? (
                  <p className="text-red-500">Error: {chart.error}</p>
                ) : (
                  <ChartComponent
                    data={chart.data}
                    config={{
                      ...chart.config,
                      series: Array.isArray(chart.config.series)
                        ? chart.config.series.map((s: any) => ({
                            ...s,
                            data: s.type === 'pie'
                              ? chart.data.map(item => ({ name: item[0], y: item[1] as number }))
                              : s.data // Use s.data for other chart types
                          }))
                        : [{
                            ...chart.config.series,
                            data: chart.config.series?.type === 'pie'
                              ? chart.data.map(item => ({ name: item[0], y: item[1] as number }))
                              : chart.data // Fallback to chart.data if series not array
                          }]
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}