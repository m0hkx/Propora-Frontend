import { useId, useState } from 'react';

function coords(values: number[], w: number, h: number, pad = 8): { x: number; y: number }[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values.map((v, i) => ({
    x: pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1),
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }));
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
  const w = 560;
  const h = 180;
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();
  if (values.length < 2) return null;
  const pts = coords(values, w, h);
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${8},${h - 8} ${line} ${w - 8},${h - 8}`;
  const step = (w - 16) / (values.length - 1);
  const fmt = formatValue ?? ((v: number) => `$${v}k`);

  const pick = (clientX: number, rectLeft: number, rectWidth: number) => {
    const svgX = ((clientX - rectLeft) / rectWidth) * w;
    const i = Math.round((svgX - 8) / step);
    setActive(Math.max(0, Math.min(values.length - 1, i)));
  };

  const tip = active !== null ? { i: active, p: pts[active] } : null;

  return (
    <div className="chart-box">
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          height="180"
          role="img"
          aria-label={`Trend chart: ${labels.map((l, i) => `${l} ${fmt(values[i])}`).join(', ')}`}
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
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="8" x2={w - 8} y1={h * f} y2={h * f} stroke="#F1F5F9" strokeWidth="1" />
          ))}
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
            style={{ left: `${(tip.p.x / w) * 100}%`, top: `${(tip.p.y / h) * 100}%` }}
          >
            <strong>{labels[tip.i]}</strong>
            <div>Revenue <strong>{fmt(values[tip.i])}</strong></div>
            {counts ? <div className="small muted">Payments {counts[tip.i]}</div> : null}
          </div>
        ) : null}
      </div>
      <div className="row small muted" style={{ padding: '0 4px' }}>
        {labels.map((l) => (
          <span key={l}>{l}</span>
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
