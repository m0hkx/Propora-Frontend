function points(values: number[], w: number, h: number, pad = 8): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

export function AreaChart({ values, labels }: { values: number[]; labels: string[] }) {
  const w = 560;
  const h = 180;
  const pts = points(values, w, h);
  const area = `${8},${h - 8} ${pts} ${w - 8},${h - 8}`;
  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="propFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="8" x2={w - 8} y1={h * f} y2={h * f} stroke="#F1F5F9" strokeWidth="1" />
        ))}
        <polygon points={area} fill="url(#propFill)" />
        <polyline points={pts} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => {
          const [x, y] = pts.split(' ')[i].split(',').map(Number);
          void v;
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke="#0F766E" strokeWidth="2" />;
        })}
      </svg>
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
