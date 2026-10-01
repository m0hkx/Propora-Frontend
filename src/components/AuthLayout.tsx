import { NavLink, Outlet, useLocation } from 'react-router-dom';
import LogoMark from './Logo';
import FloorPlan from './FloorPlan';

/** Illustrative rows for the panel's rent-roll card — decoration, not account data. */
const ROLL = [
  { unit: 'A-101', amount: '$2,650', status: 'Paid' },
  { unit: 'A-102', amount: '$2,700', status: 'Paid' },
  { unit: 'B-101', amount: '$1,950', status: 'Pending' },
  { unit: 'C-305', amount: '$2,400', status: 'Overdue' },
] as const;

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
          <FloorPlan className="auth-plan" labels />
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
