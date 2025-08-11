import Highcharts from '../../lib/initHighcharts';
import HighchartsReact from 'highcharts-react-official';

export function ChartModal({
  isOpen,
  onClose,
  chart,
}: {
  isOpen: boolean;
  onClose: () => void;
  chart: null | { title: string; config: Highcharts.Options };
}) {
  if (!isOpen || !chart) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 max-w-6xl w-full rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">{chart.title}</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20">
            Close
          </button>
        </div>
        <HighchartsReact highcharts={Highcharts} options={chart.config} />
      </div>
    </div>
  );
}
