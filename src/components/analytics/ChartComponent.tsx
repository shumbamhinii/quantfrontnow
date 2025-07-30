import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react'; // Added React import for JSX

interface ChartComponentProps {
  data: any[];
  config: any; // Highcharts.Options; // Can be more specific if needed
}

export function ChartComponent ({ data, config }: ChartComponentProps) {
  const options = {
    ...config,
    credits: { enabled: false },
    legend: { enabled: true },
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: {
            legend: { enabled: false }
          }
        }
      ]
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
