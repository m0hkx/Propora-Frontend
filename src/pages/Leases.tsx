import { formatMoney, leases, propertyName, tenantName } from '../data/mock';
import type { Lease } from '../data/mock';
import { Badge, Card } from '../components/ui';

function LeaseSection({ title, items, tone }: { title: string; items: Lease[]; tone: 'success' | 'warn' | 'danger' }) {
  return (
    <Card>
      <div className="row"><strong>{title} ({items.length})</strong><Badge tone={tone}>{title}</Badge></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Lease</th><th>Tenant</th><th>Property</th><th>Term</th><th>Rent</th></tr></thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.id}</strong></td>
                <td>{tenantName(l.tenantId)}</td>
                <td>{propertyName(l.propertyId)}</td>
                <td className="small">{l.start} → {l.end}</td>
                <td>{formatMoney(l.rent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Leases() {
  const active = leases.filter((l) => l.status === 'Active');
  const expiring = leases.filter((l) => l.status === 'Expiring');
  const expired = leases.filter((l) => l.status === 'Expired');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <LeaseSection title="Active leases" items={active} tone="success" />
      <LeaseSection title="Expiring soon" items={expiring} tone="warn" />
      <LeaseSection title="Expired" items={expired} tone="danger" />
    </div>
  );
}
