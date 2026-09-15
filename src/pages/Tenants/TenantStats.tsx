import { Card, Icon } from '../../components/ui';
import { Icons } from '../../components/icons';

export default function TenantStats({
  total,
  active,
  expiring,
  overdue,
  overdueAmount,
}: {
  total: number;
  active: number;
  expiring: number;
  overdue: number;
  overdueAmount: string;
}) {
  const pct = total === 0 ? 0 : ((active / total) * 100).toFixed(1);
  return (
    <div className="grid-4">
      <Card>
        <div className="row">
          <span className="small muted">Total Tenants</span>
          <span className="kpi-icon"><Icon d={Icons.users} /></span>
        </div>
        <div className="kpi">{total}</div>
        <div className="small"><span className="badge success">+6 this month</span></div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Active Tenants</span>
          <span className="kpi-icon"><Icon d={Icons.user} /></span>
        </div>
        <div className="kpi">{active}</div>
        <div className="small muted">{pct}% of tenants</div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Expiring Leases</span>
          <span className="kpi-icon"><Icon d={Icons.lease} /></span>
        </div>
        <div className="kpi">{expiring}</div>
        <div className="small"><span className="badge warn">Within 30 days</span></div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Overdue Payments</span>
          <span className="kpi-icon"><Icon d={Icons.card} /></span>
        </div>
        <div className="kpi">{overdue}</div>
        <div className="small muted">{overdueAmount} outstanding</div>
      </Card>
    </div>
  );
}
