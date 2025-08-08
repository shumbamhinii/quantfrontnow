import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ChartComponent } from './ChartComponent'; // Relative import for ChartComponent
import type { ChartData } from '../../pages/DataAnalytics'; // Corrected relative path for ChartData type import

// IMPORTANT: Removed Highcharts module imports and initializations from here.
// These should be handled globally (e.g., in index.tsx/App.tsx) or within ChartComponent.tsx,
// which is the component directly using HighchartsReact.
// import Highcharts from 'highcharts';
// import HighchartsMore from 'highcharts/highcharts-more';
// import Highcharts3D from 'highcharts/highcharts-3d';
// import HighchartsExporting from 'highcharts/modules/exporting';
// import HighchartsAccessibility from 'highcharts/modules/accessibility';
// import HighchartsHeatmap from 'highcharts/modules/heatmap';

// HighchartsMore(Highcharts); // This line was causing the error
// Highcharts3D(Highcharts);
// HighchartsExporting(Highcharts);
// HighchartsAccessibility(Highcharts);
// HighchartsHeatmap(Highcharts);

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: ChartData | null;
}

export function ChartModal ({ isOpen, onClose, chart }: ChartModalProps) {
  // If no chart data is provided, return null to not render the modal
  if (!chart) return null;

  // The chart.config already contains the full Highcharts options, including series data.
  // We pass this directly to ChartComponent.
  const modalConfig = chart.config;

  // Use a ref to access the Highcharts instance from ChartComponent for reflow
  const chartComponentRef = useRef<any>(null); // Type can be more specific if ChartComponent exposes HighchartsReact.RefObject

  // This useEffect is for Highcharts reflow, which is crucial when charts are in hidden containers
  // that become visible. It forces Highcharts to recalculate its dimensions.
  useEffect(() => {
    // A small delay to ensure modal animation is complete before reflowing the chart
    if (chartComponentRef.current && chartComponentRef.current.chart) {
      setTimeout(() => {
        chartComponentRef.current?.chart.reflow();
      }, 100);
    }
  }, [isOpen, chart]); // Re-run when modal opens or chart data changes

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-auto'>
        <DialogHeader>
          <DialogTitle>{chart.title}</DialogTitle>
        </DialogHeader>
        {/* The div below provides a defined height for the chart to render properly */}
        <div className='h-96'>
          {/* ChartComponent is expected to render the Highcharts chart using the provided config */}
          {/* Pass a key to force re-render when chart data changes, ensuring a fresh chart instance */}
          <ChartComponent key={chart.id} config={modalConfig} ref={chartComponentRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
