/** Room fills, listed clockwise so the loader's lights travel around the plan. */
const ROOMS = [
  { x: 22, y: 22, w: 276, h: 176 }, // bedroom 1
  { x: 302, y: 22, w: 196, h: 126 }, // kitchen
  { x: 302, y: 152, w: 196, h: 106 }, // bath
  { x: 302, y: 262, w: 196, h: 96 }, // bedroom 2
  { x: 22, y: 202, w: 276, h: 156 }, // living
];

/**
 * Architect-style apartment plan in thin lines. Each stroke uses
 * pathLength="1" so one CSS animation can draw every line in; colors come from
 * the wrapper class (`auth-plan` on the login panel, `loader-plan` on the
 * loading screen).
 */
export default function FloorPlan({
  className,
  labels = false,
  rooms = false,
}: {
  className: string;
  /** Windows, room names, areas and the dimension line, for the large login panel. */
  labels?: boolean;
  /** Room fills the loading screen lights up one after another. */
  rooms?: boolean;
}) {
  const line = (d: string, delay: number, cls = 'plan-wall') => (
    <path d={d} pathLength={1} className={`plan-line ${cls}`} style={{ animationDelay: `${delay}s` }} />
  );
  const label = (x: number, y: number, name: string, area: string) => (
    <text x={x} y={y} className="plan-label">
      {name}
      <tspan x={x} dy="14" className="plan-area">{area}</tspan>
    </text>
  );

  return (
    <svg viewBox={labels ? '0 0 520 400' : '0 0 520 380'} className={className} aria-hidden="true" fill="none">
      {rooms
        ? ROOMS.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              className="plan-room"
              style={{ animationDelay: `${1.2 + i * 0.5}s` }}
            />
          ))
        : null}

      {/* Outer walls */}
      {line('M20 20 H500 V360 H20 Z', 0, 'plan-outer')}
      {/* Interior walls, with gaps left for doors */}
      {line('M300 20 V230 M300 270 V360', 0.15)}
      {line('M20 200 H120 M160 200 H300', 0.25)}
      {line('M300 150 H360 M400 150 H500', 0.35)}
      {line('M300 260 H420 M460 260 H500', 0.45)}
      {/* Door swings */}
      {line('M120 200 V160 A40 40 0 0 1 160 200', 0.7, 'plan-door')}
      {line('M300 230 H340 A40 40 0 0 1 300 270', 0.8, 'plan-door')}
      {line('M360 150 V110 A40 40 0 0 1 400 150', 0.9, 'plan-door')}
      {line('M420 260 V300 A40 40 0 0 0 460 260', 1.0, 'plan-door')}
      {labels ? (
        <>
          {line('M70 14 H210 M70 26 H210', 1.1, 'plan-window')}
          {line('M506 300 V340 M494 300 V340', 1.15, 'plan-window')}
          {line('M60 366 H240 M60 354 H240', 1.2, 'plan-window')}
          {line('M20 386 H500 M20 380 V392 M500 380 V392', 1.3, 'plan-dim')}
          {label(44, 52, 'BEDROOM 1', '16 m²')}
          {label(44, 232, 'LIVING', '28 m²')}
          {label(322, 52, 'KITCHEN', '11 m²')}
          {label(322, 182, 'BATH', '6 m²')}
          {label(322, 292, 'BEDROOM 2', '12 m²')}
          <text x="140" y="399" className="plan-dim-label" textAnchor="middle">12.4 m</text>
        </>
      ) : null}
    </svg>
  );
}
