import type { ReactNode } from 'react';
import { Card, Icon } from './ui';
import { Spark } from './charts';
import { useCountUp } from '../lib/useCountUp';

export type ChipTint = 'teal' | 'blue' | 'amber' | 'rose';
export type DeltaTone = 'up' | 'down' | 'flat' | 'warn';

const TINT_STROKE: Record<ChipTint, string> = {
  teal: '#0F766E',
  blue: '#0369A1',
  amber: '#B45309',
  rose: '#DC2626',
};

export interface KpiDelta {
  text: ReactNode;
  tone: DeltaTone;
}

/**
 * Unified KPI hero card shared by Dashboard + every feature stats row:
 * tinted icon chip + delta pill, animated tabular numeral, label/sub
 * footer with an honest per-property sparkline. `format` receives the
 * animated (float) value — round inside it.
 */
export default function KpiCard({
  icon,
  tint,
  delta,
  value,
  format,
  label,
  sub,
  spark,
  stagger,
}: {
  icon: string;
  tint: ChipTint;
  delta?: KpiDelta;
  value: number;
  format: (n: number) => string;
  label: string;
  sub?: ReactNode;
  spark?: number[];
  stagger?: string;
}) {
  const animated = useCountUp(value);
  return (
    <Card className={`card-lift rise ${stagger ?? ''}`}>
      <div className="row">
        <span className={`kpi-chip tint-${tint}`}>
          <Icon d={icon} />
        </span>
        {delta ? <span className={`delta ${delta.tone}`}>{delta.text}</span> : null}
      </div>
      <div className="kpi tnum">{format(animated)}</div>
      <div className="row items-end">
        <div>
          <div className="small muted">{label}</div>
          {sub ? <div className="small font-semibold">{sub}</div> : null}
        </div>
        {spark && spark.length > 1 ? <Spark values={spark} stroke={TINT_STROKE[tint]} /> : null}
      </div>
    </Card>
  );
}
