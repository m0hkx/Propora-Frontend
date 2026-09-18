import { propertyCity, propertyName } from '../../data/mock';
import type { Property, Tenant } from '../../data/mock';
import { Badge } from '../../components/ui';
import RowMenu from '../../components/RowMenu';
import { fmtDate } from '../../lib/format';
import { onActivateKey } from '../../lib/a11y';
import { avatarBg, initials, leaseTone, paymentTone, tenantTone } from './tenantUtils';
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
  properties,
  menuOpen,
  onToggleMenu,
  onAction,
  onSelect,
}: {
  tenant: Tenant;
  properties: Property[];
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAction: (a: TenantAction, t: Tenant) => void;
  onSelect: (t: Tenant) => void;
}) {
  const t = tenant;
  return (
    <tr
      className="cursor-pointer"
      onClick={() => onSelect(t)}
      role="button"
      tabIndex={0}
      onKeyDown={onActivateKey(() => onSelect(t))}
    >
      <td>
        <div className="flex items-center gap-2.5">
          <TenantAvatar name={t.name} />
          <div><strong>{t.name}</strong><div className="small muted">{t.email}</div></div>
        </div>
      </td>
      <td>
        <div><strong>{propertyName(t.propertyId, properties)}</strong></div>
        <div className="small muted">{propertyCity(t.propertyId, properties)}</div>
      </td>
      <td className="max-compact:hidden">
        <div>Unit {t.unit}</div>
        <div className="small muted">{t.beds}</div>
      </td>
      <td>
        <strong>${t.rent.toLocaleString('en-US')}</strong> <span className="small muted">/month</span>
      </td>
      <td className="max-compact:hidden">
        <Badge tone={leaseTone(t.leaseStatus)}>{t.leaseStatus}</Badge>
        <div className="small muted mt-1">{fmtDate(t.leaseEnd)}</div>
      </td>
      <td>
        <Badge tone={paymentTone(t.paymentStatus)}>{t.paymentStatus}</Badge>
        <div className="small muted mt-1">{t.paymentDate}</div>
      </td>
      <td><Badge tone={tenantTone(t.status)}>{t.status}</Badge></td>
      <td onClick={(e) => e.stopPropagation()}>
        <RowMenu
          label={`Actions for ${t.name}`}
          open={menuOpen}
          onToggle={onToggleMenu}
          actions={(
            [
              ['view', 'View Tenant'],
              ['edit', 'Edit Tenant'],
              ['lease', 'View Lease'],
              ['payments', 'View Payments'],
              ['delete', 'Delete Tenant'],
            ] as [TenantAction, string][]
          ).map(([a, label]) => ({ key: a, label, danger: a === 'delete', onClick: () => onAction(a, t) }))}
        />
      </td>
    </tr>
  );
}
