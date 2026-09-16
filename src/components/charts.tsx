import { useId, useState } from 'react';

// Plot geometry (viewBox units). Left margin reserves room for the Y-axis,
// right margin keeps the last point off the card edge.
const CHART_W = 560;
const CHART_H = 200;
const MARGIN = { left: 48, right: 12, top: 12, bottom: 8 };

function coords(values: number[], top: number): { x: number; y: number }[] {
  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const plotH = CHART_H - MARGIN.top - MARGIN.bottom;
  return values.map((v, i) => ({
    x: MARGIN.left + (i * plotW) / Math.max(1, values.length - 1),
    y: MARGIN.top + plotH - (Math.max(0, v) / top) * plotH,
  }));
}

// Largest round step giving at most 4 intervals (≤5 ticks).
function niceTicks(maxV: number): { ticks: number[]; top: number } {
  const steps = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
  const step = steps.find((s) => maxV / s <= 4) ?? 5000;
  const top = Math.ceil(maxV / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { ticks, top };
}

function formatRevenueTick(v: number): string {
  if (v === 0) return '$0';
  if (v >= 1000) return `$${parseFloat((Math.round(v / 100) / 10).toFixed(1))}M`;
  return `$${v}K`;
}

export function AreaChart({
  values,
  labels,
  counts,
  formatValue,
}: {
  values: number[];
  labels: string[];
  counts?: number[];
  formatValue?: (v: number) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();
  if (values.length < 2) return null;
  const maxV = Math.max(...values);
  const { ticks, top } = niceTicks(maxV);
  const plotBottom = CHART_H - MARGIN.bottom;
  const pts = coords(values, top);
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${MARGIN.left},${plotBottom} ${line} ${CHART_W - MARGIN.right},${plotBottom}`;
  const plotW = CHART_W - MARGIN.left - MARGIN.right;
  const step = plotW / (values.length - 1);
  const fmt = formatValue ?? formatRevenueTick;
  const yOf = (v: number) => MARGIN.top + (plotBottom - MARGIN.top) - (v / top) * (plotBottom - MARGIN.top);

  const pick = (clientX: number, rectLeft: number, rectWidth: number) => {
    const svgX = ((clientX - rectLeft) / rectWidth) * CHART_W;
    const i = Math.round((svgX - MARGIN.left) / step);
    setActive(Math.max(0, Math.min(values.length - 1, i)));
  };

  const tip = active !== null ? { i: active, p: pts[active] } : null;

  return (
    <div className="chart-box">
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          width="100%"
          role="img"
          aria-label={`Revenue trend, $0 to ${fmt(top)}: ${labels.map((l, i) => `${l} ${fmt(values[i])}`).join(', ')}`}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            pick(e.clientX, r.left, r.width);
          }}
          onMouseLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={CHART_W - MARGIN.right}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text
                x={MARGIN.left - 8}
                y={yOf(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="11"
                fill="#475569"
              >
                {fmt(t)}
              </text>
            </g>
          ))}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={plotBottom}
            stroke="#E8F0F3"
            strokeWidth="1.5"
          />
          <polygon points={area} fill={`url(#${gradientId})`} />
          <polyline points={line} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={active === i ? 5 : 3.5}
              fill="#fff"
              stroke="#0F766E"
              strokeWidth="2"
              tabIndex={0}
              aria-label={`${labels[i]}: ${fmt(values[i])}`}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(i)}
            />
          ))}
        </svg>
        {tip ? (
          <div
            className="chart-tip"
            role="status"
            style={{ left: `${(tip.p.x / CHART_W) * 100}%`, top: `${(tip.p.y / CHART_H) * 100}%` }}
          >
            <strong>{labels[tip.i]}</strong>
            <div>Revenue <strong>{fmt(values[tip.i])}</strong></div>
            {counts ? <div className="small muted">Payments {counts[tip.i]}</div> : null}
          </div>
        ) : null}
      </div>
      <div className="x-labels" aria-hidden="true">
        {labels.map((l, i) => (
          <span
            key={l}
            className="x-label"
            style={{
              left: `${(pts[i].x / CHART_W) * 100}%`,
              transform: i === 0 ? 'translateX(0)' : i === labels.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ percent, label }: { percent: number; label: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label={`${label} ${percent}%`}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
        <circle
          cx="55" cy="55" r={r} fill="none" stroke="#0F766E" strokeWidth="12"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 55 55)"
        />
        <text x="55" y="60" textAnchor="middle" fontWeight="700" fontSize="18" fill="#134E4A">{percent}%</text>
      </svg>
      <div><div style={{ fontWeight: 700 }}>{label}</div><div className="small muted">Portfolio occupancy</div></div>
    </div>
  );
}
