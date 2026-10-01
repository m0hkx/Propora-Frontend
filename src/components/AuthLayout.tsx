import { NavLink, Outlet, useLocation } from 'react-router-dom';
import LogoMark from './Logo';

/** Illustrative rows for the panel's rent-roll card — decoration, not account data. */
const ROLL = [
  { unit: 'A-101', amount: '$2,650', status: 'Paid' },
  { unit: 'A-102', amount: '$2,700', status: 'Paid' },
  { unit: 'B-101', amount: '$1,950', status: 'Pending' },
  { unit: 'C-305', amount: '$2,400', status: 'Overdue' },
] as const;

function FloorPlan() {
  // Each stroke uses pathLength="1" so one CSS animation can draw every line in.
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
    <svg viewBox="0 0 520 400" className="auth-plan" aria-hidden="true" fill="none">
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
      {/* Windows */}
      {line('M70 14 H210 M70 26 H210', 1.1, 'plan-window')}
      {line('M506 300 V340 M494 300 V340', 1.15, 'plan-window')}
      {line('M60 366 H240 M60 354 H240', 1.2, 'plan-window')}
      {/* Dimension line */}
      {line('M20 386 H500 M20 380 V392 M500 380 V392', 1.3, 'plan-dim')}

      {label(44, 52, 'BEDROOM 1', '16 m²')}
      {label(44, 232, 'LIVING', '28 m²')}
      {label(322, 52, 'KITCHEN', '11 m²')}
      {label(322, 182, 'BATH', '6 m²')}
      {label(322, 292, 'BEDROOM 2', '12 m²')}
      <text x="140" y="399" className="plan-dim-label" textAnchor="middle">12.4 m</text>
    </svg>
  );
}

/**
 * Layout route for /login and /register: a brand panel on wide screens and the
 * form column, which stands alone on phones. Staying mounted across the two
 * routes keeps the panel still while only the form swaps.
 */
export default function AuthLayout() {
  const { pathname } = useLocation();
  const month = new Date().toLocaleDateString('en-US', { month: 'long' });
  const switchLink = ({ isActive }: { isActive: boolean }) => `auth-switch-link ${isActive ? 'active' : ''}`;

  return (
    <div className="auth-shell">
      <aside className="auth-panel">
        <div className="flex items-center gap-2.5 relative z-[1]">
          <div className="brand-mark"><LogoMark /></div>
          <span className="font-display font-bold text-lg tracking-[0.2px]">Propora</span>
        </div>

        <div className="auth-plan-wrap">
          <FloorPlan />
          <div className="auth-roll" aria-hidden="true">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[13px] font-bold">{month} rent roll</span>
              <span className="text-[11px] text-[#99F6E4]">Due on the 1st</span>
            </div>
            {ROLL.map((r) => (
              <div key={r.unit} className="auth-roll-row">
                <span className="font-semibold">{r.unit}</span>
                <span className="tabular-nums text-[#CCFBF1]">{r.amount}</span>
                <span className={`auth-roll-pill ${r.status.toLowerCase()}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[1] max-w-[440px]">
          <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#5EEAD4] m-0">Property management</p>
          <h2 className="font-display text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] mt-3 mb-3">
            Every unit, lease and rent payment in one ledger.
          </h2>
          <p className="text-[15px] leading-relaxed text-[#CCFBF1]/80 m-0">
            Rent is billed on the 1st, late payments are flagged the next day, and every repair stays tied to the unit it belongs to.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="relative z-[1] w-full max-w-[400px] mx-auto rise">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="brand-mark"><LogoMark /></div>
            <span className="brand-name font-bold text-lg">Propora</span>
          </div>

          <nav className="auth-switch" aria-label="Account">
            <span className={`auth-switch-indicator ${pathname === '/register' ? 'right' : ''}`} aria-hidden="true" />
            <NavLink to="/login" className={switchLink}>Sign in</NavLink>
            <NavLink to="/register" className={switchLink}>Create account</NavLink>
          </nav>

          <div key={pathname} className="auth-swap">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
