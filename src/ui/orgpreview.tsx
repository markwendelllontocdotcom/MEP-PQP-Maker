import { useMemo } from 'preact/hooks';
import type { Project } from '../model/types';
import { orgChart } from '../content/orgchart';

/** Live view of the Annexure 8.1 chart; the red tags match the input ids below. */
export function OrgPreview(props: { p: Project }) {
  const n = Array.isArray(props.p.K03) ? props.p.K03.length : 1;
  const svg = useMemo(() => orgChart(props.p, null, true).svg, [n]);
  return (
    <figure class="orgprev" aria-label="Organisation chart preview">
      <div class="orgprev-chart" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>
        Annexure 8.1 chart. Each red tag matches the input with the same id below. The boxes show the role titles; the names
        you enter are listed in the table under the chart.
      </figcaption>
    </figure>
  );
}
