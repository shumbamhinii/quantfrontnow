import React from 'react'; // Added React import for JSX
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ChartComponent } from './ChartComponent'; // Relative import
import type { ChartData } from '../../pages/DataAnalytics'; // Corrected relative path for type import

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: ChartData | null;
}

export function ChartModal ({ isOpen, onClose, chart }: ChartModalProps) {
  if (!chart) return null;

  // Ensure chart.config.series is an array before spreading
  const modalConfig = {
    ...chart.config,
    series: Array.isArray(chart.config.series)
      ? chart.config.series.map((s: any) => ({ ...s, data: chart.data }))
      : [{ ...chart.config.series, data: chart.data }]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-auto'>
        <DialogHeader>
          <DialogTitle>{chart.title}</DialogTitle>
        </DialogHeader>
        <div className='h-96'>
          <ChartComponent data={chart.data} config={modalConfig} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
