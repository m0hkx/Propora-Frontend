import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import { useAuth } from '../auth/useAuth';
import { navPages, routeToLabel } from '../lib/nav';
import { Icon } from './ui';
import { Icons } from './icons';
import LogoMark from './Logo';
import NotificationsPanel from './NotificationsPanel';
import MessagesPanel from './MessagesPanel';

type HeaderPanel = 'notif' | 'msg' | null;

const navLinkClass = (base: string) => ({ isActive }: { isActive: boolean }) =>
  `${base} ${isActive ? 'active' : ''}`;

export default function TopBar() {
  const notifications = useStore((s) => s.notifications);
  const conversations = useStore((s) => s.conversations);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [headerPanel, setHeaderPanel] = useState<HeaderPanel>(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [currency, setCurrency] = useState('USD');

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && headerPanel === null && !navOpen) return;

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (headerPanel !== null) {
        const ref = headerPanel === 'notif' ? notifRef : msgRef;
        if (ref.current && !ref.current.contains(e.target as Node)) setHeaderPanel(null);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setHeaderPanel(null);
        setNavOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, headerPanel, navOpen]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread, 0);

  const accountName = user?.name ?? 'Account';
  const accountInitials = accountName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const openFullProfile = () => {
    navigate('/profile');
    setMenuOpen(false);
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const togglePanel = (panel: Exclude<HeaderPanel, null>) =>
    setHeaderPanel((v) => (v === panel ? null : panel));

  return (
    <header className="topbar">
      <div ref={navRef} className="flex items-center gap-3 compact:contents">
        <button
          className={`icon-btn nav-toggle compact:hidden ${navOpen ? 'open' : ''}`}
          type="button"
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={navOpen}
          aria-controls="mobile-nav"
          onClick={() => setNavOpen((v) => !v)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div className="brand">
          <div className="brand-mark"><LogoMark /></div>
          <span className="brand-name max-sm:hidden">Propora</span>
        </div>
        {navOpen ? (
          <nav id="mobile-nav" className="mobile-nav compact:hidden" aria-label="Primary">
            {navPages.map((p) => (
              <NavLink key={p} to={`/${p}`} onClick={() => setNavOpen(false)} className={navLinkClass('mobile-nav-link')}>
                {routeToLabel[p]}
                <span className="mobile-nav-go" aria-hidden="true">→</span>
              </NavLink>
            ))}
            <NavLink to="/profile" onClick={() => setNavOpen(false)} className={navLinkClass('mobile-nav-link')}>
              Profile
              <span className="mobile-nav-go" aria-hidden="true">→</span>
            </NavLink>
          </nav>
        ) : null}
      </div>

      <nav className="nav-pills max-compact:hidden" aria-label="Primary">
        {navPages.map((p) => (
          <NavLink key={p} to={`/${p}`} className={navLinkClass('nav-pill')}>
            {routeToLabel[p]}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
        <div className="relative" ref={notifRef}>
          <button
            className="icon-btn relative"
            type="button"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
            aria-haspopup="menu"
            aria-expanded={headerPanel === 'notif'}
            onClick={() => togglePanel('notif')}
          >
            <Icon icon={Icons.bell} />
            {unreadNotifications > 0 ? <span className="count-badge">{unreadNotifications}</span> : null}
          </button>
          {headerPanel === 'notif' ? <NotificationsPanel onClose={() => setHeaderPanel(null)} /> : null}
        </div>

        <div className="relative" ref={msgRef}>
          <button
            className="icon-btn relative"
            type="button"
            aria-label={`Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ''}`}
            aria-haspopup="menu"
            aria-expanded={headerPanel === 'msg'}
            onClick={() => togglePanel('msg')}
          >
            <Icon icon={Icons.card} />
            {unreadMessages > 0 ? <span className="count-badge">{unreadMessages}</span> : null}
          </button>
          {headerPanel === 'msg' ? <MessagesPanel /> : null}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            className="avatar"
            type="button"
            title={`${accountName} - Account`}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {accountInitials}
          </button>
          {menuOpen && (
            <div className="dropdown" role="menu" aria-label="Profile menu">
              <div className="dropdown-head">
                <div className="avatar avatar-lg">{accountInitials}</div>
                <div>
                  <strong>{accountName}</strong>
                  <div className="small muted">{user?.email}</div>
                  <span className="badge success mt-1">Property Manager</span>
                </div>
              </div>
              <button className="btn btn-teal dropdown-full" type="button" onClick={openFullProfile}>
                Profile
              </button>
              <div className="dropdown-section">
                <div className="dropdown-title">Settings</div>
                <div className="setting-row">
                  <span>Email notifications</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailNotif}
                    className={`switch ${emailNotif ? 'on' : ''}`}
                    onClick={() => setEmailNotif((v) => !v)}
                  >
                    <span className="knob" />
                  </button>
                </div>
                <div className="setting-row">
                  <span>SMS rent alerts</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={smsAlerts}
                    className={`switch ${smsAlerts ? 'on' : ''}`}
                    onClick={() => setSmsAlerts((v) => !v)}
                  >
                    <span className="knob" />
                  </button>
                </div>
                <div className="setting-row">
                  <label htmlFor="cur">Currency</label>
                  <select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="setting-row">
                  <span>Theme</span>
                  <span className="badge neutral">Teal light</span>
                </div>
              </div>
              <div className="dropdown-foot">
                <button className="btn btn-ghost" type="button" onClick={() => setMenuOpen(false)}>Close</button>
                <button className="btn btn-ghost" type="button" onClick={handleSignOut}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
