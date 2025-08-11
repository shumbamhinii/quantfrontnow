import Highcharts from '../../lib/initHighcharts';
import HighchartsReact from 'highcharts-react-official';

type ChartData = {
  id: string;
  title: string;
  config: Highcharts.Options;
};

export function ChartGrid({
  chartData,
  onExpandChart,
}: {
  chartData: ChartData[];
  onExpandChart: (c: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
      {chartData.map((c) => (
        <div key={c.id} className="rounded-2xl bg-white/5 backdrop-blur p-4 shadow-lg hover:shadow-2xl transition">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{c.title}</h3>
            <button
              onClick={() => onExpandChart(c)}
              className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
            >
              Expand
            </button>
          </div>
          <HighchartsReact highcharts={Highcharts} options={c.config} />
        </div>
      ))}
    </div>
  );
}
