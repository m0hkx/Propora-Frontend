import { formatMoney, payments, propertyName, tenantName } from '../data/mock';
import { Badge, Card, Stat } from '../components/ui';

export default function Payments() {
  const paid = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === 'Overdue').reduce((s, p) => s + p.amount, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-4">
        <Card><Stat label="Collected" value={formatMoney(paid)} sub="This period" /></Card>
        <Card><Stat label="Pending" value={formatMoney(pending)} sub="Awaiting clearance" /></Card>
        <Card><Stat label="Overdue" value={formatMoney(overdue)} sub="Needs follow-up" /></Card>
        <Card><Stat label="Collection rate" value="91%" sub="+2.4% vs last month" /></Card>
      </div>
      <Card>
        <div className="row"><strong>Payment history</strong><Badge tone="info">{payments.length} records</Badge></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Tenant</th><th>Property</th><th>Amount</th><th>Date</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.id}</strong></td>
                  <td>{tenantName(p.tenantId)}</td>
                  <td>{propertyName(p.propertyId)}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td>{p.date}</td>
                  <td>{p.method}</td>
                  <td><Badge tone={p.status === 'Paid' ? 'success' : p.status === 'Pending' ? 'warn' : 'danger'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
