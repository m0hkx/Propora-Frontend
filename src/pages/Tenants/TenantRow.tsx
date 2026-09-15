import { propertyCity, propertyName } from '../../data/mock';
import type { Tenant } from '../../data/mock';
import { Badge } from '../../components/ui';
import { avatarBg, fmtDate, initials, leaseTone, paymentTone, tenantTone } from './tenantUtils';
import type { TenantAction } from './tenantUtils';

export function TenantAvatar({ name }: { name: string }) {
  return (
    <span className="avatar-sm" style={{ background: avatarBg(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export default function TenantRow({
  tenant,
  menuOpen,
  onToggleMenu,
  onAction,
  onSelect,
}: {
  tenant: Tenant;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAction: (a: TenantAction, t: Tenant) => void;
  onSelect: (t: Tenant) => void;
}) {
  const t = tenant;
  return (
    <tr className="clickable" onClick={() => onSelect(t)}>
      <td>
        <div className="tenant-cell">
          <TenantAvatar name={t.name} />
          <div><strong>{t.name}</strong><div className="small muted">{t.email}</div></div>
        </div>
      </td>
      <td>
        <div><strong>{propertyName(t.propertyId)}</strong></div>
        <div className="small muted">{propertyCity(t.propertyId)}</div>
      </td>
      <td className="hide-tablet">
        <div>Unit {t.unit}</div>
        <div className="small muted">{t.beds}</div>
      </td>
      <td>
        <strong>${t.rent.toLocaleString('en-US')}</strong> <span className="small muted">/month</span>
      </td>
      <td className="hide-tablet">
        <Badge tone={leaseTone(t.leaseStatus)}>{t.leaseStatus}</Badge>
        <div className="small muted" style={{ marginTop: 4 }}>{fmtDate(t.leaseEnd)}</div>
      </td>
      <td>
        <Badge tone={paymentTone(t.paymentStatus)}>{t.paymentStatus}</Badge>
        <div className="small muted" style={{ marginTop: 4 }}>{t.paymentDate}</div>
      </td>
      <td><Badge tone={tenantTone(t.status)}>{t.status}</Badge></td>
      <td onClick={(e) => e.stopPropagation()}>
        <div className="row-menu-wrap">
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            aria-label={`Actions for ${t.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
          {menuOpen && (
            <div className="row-menu" role="menu">
              {(
                [
                  ['view', 'View Tenant'],
                  ['edit', 'Edit Tenant'],
                  ['lease', 'View Lease'],
                  ['payments', 'View Payments'],
                  ['delete', 'Delete Tenant'],
                ] as [TenantAction, string][]
              ).map(([a, label]) => (
                <button
                  key={a}
                  type="button"
                  role="menuitem"
                  className={`row-menu-item ${a === 'delete' ? 'danger' : ''}`}
                  onClick={() => onAction(a, t)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
