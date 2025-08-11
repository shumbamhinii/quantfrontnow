import Highcharts from 'highcharts';

// Core extensions FIRST
import HighchartsMore from 'highcharts/highcharts-more';
import Exporting from 'highcharts/modules/exporting';
import ExportData from 'highcharts/modules/export-data';
import Accessibility from 'highcharts/modules/accessibility';

// WOW modules (note the exact names)
import Sankey from 'highcharts/modules/sankey';
import DependencyWheel from 'highcharts/modules/dependency-wheel'; // needs sankey
import Networkgraph from 'highcharts/modules/networkgraph';
import Streamgraph from 'highcharts/modules/streamgraph';
import Sunburst from 'highcharts/modules/sunburst';
//import PackedBubble from 'highcharts/modules/packed-bubble';
import Variwide from 'highcharts/modules/variwide';
import SolidGauge from 'highcharts/modules/solid-gauge'; // needs highcharts-more
import Annotations from 'highcharts/modules/annotations';

// Init in the right order
HighchartsMore(Highcharts);
Exporting(Highcharts);
ExportData(Highcharts);
Accessibility(Highcharts);

Sankey(Highcharts);
DependencyWheel(Highcharts);
Networkgraph(Highcharts);
Streamgraph(Highcharts);
Sunburst(Highcharts);
//PackedBubble(Highcharts);
Variwide(Highcharts);
SolidGauge(Highcharts);
Annotations(Highcharts);

// Optional: silence accessibility warning or keep it enabled
Highcharts.setOptions({
  accessibility: { enabled: false },
  chart: { backgroundColor: 'transparent' }
});

// Sanity log (only once on boot). You can remove later.
if (import.meta.env.DEV) {
  // These must be truthy if modules loaded
  console.log('[HC modules]',
    !!Highcharts.seriesTypes.sankey,
    !!Highcharts.seriesTypes.dependencywheel,
    !!Highcharts.seriesTypes.networkgraph,
    !!Highcharts.seriesTypes.streamgraph,
    !!Highcharts.seriesTypes.sunburst,
    !!Highcharts.seriesTypes.packedbubble,
    !!Highcharts.seriesTypes.variwide,
    !!Highcharts.seriesTypes.solidgauge
  );
}

export default Highcharts;
