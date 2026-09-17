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
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const notifications = useStore((s) => s.notifications);
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
        <p className="small muted mt-3 mb-1">You're all caught up. New activity will appear here.</p>
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
              <span className="dot mt-1.5" style={{ background: KIND_DOT[n.kind] }} />
              <span className="flex-1">
                <strong>{n.title}</strong>
                <span className="small muted block">{n.detail}</span>
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
