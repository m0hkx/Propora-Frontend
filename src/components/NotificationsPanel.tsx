import { useStore } from '../state/useStore';
import type { AppNotification } from '../data/mock';

const KIND_DOT: Record<AppNotification['kind'], string> = {
  maintenance: '#CA8A04',
  payment: '#DC2626',
  lease: '#EA580C',
  tenant: '#0369A1',
};

export default function NotificationsPanel({
  onNavigate,
  onClose,
}: {
  onNavigate: (page: 'Maintenance' | 'Payments' | 'Leases' | 'Tenants') => void;
  onClose: () => void;
}) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="dropdown dropdown-wide" role="menu" aria-label="Notifications">
      <div className="row">
        <strong>Notifications {unread > 0 ? <span className="badge danger">{unread} new</span> : null}</strong>
        {unread > 0 ? (
          <button className="link-btn small" type="button" onClick={markAllNotificationsRead}>Mark all read</button>
        ) : null}
      </div>
      {notifications.length === 0 ? (
        <p className="small muted" style={{ margin: '12px 0 4px' }}>You're all caught up. New activity will appear here.</p>
      ) : (
        <div className="list">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              role="menuitem"
              className={`notif-item ${n.read ? '' : 'unread'}`}
              onClick={() => {
                markNotificationRead(n.id);
                onClose();
                onNavigate(n.link);
              }}
            >
              <span className="dot" style={{ background: KIND_DOT[n.kind], marginTop: 6 }} />
              <span style={{ flex: 1 }}>
                <strong>{n.title}</strong>
                <span className="small muted" style={{ display: 'block' }}>{n.detail}</span>
                <span className="small muted">{n.time}</span>
              </span>
              {n.read ? null : <span className="unread-dot" aria-label="Unread" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
