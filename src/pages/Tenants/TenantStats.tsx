import type { Property, Tenant } from '../../data/mock';
import { Icons } from '../../components/icons';
import KpiCard from '../../components/KpiCard';
import { spreadByProperty } from '../../lib/stats';

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function TenantStats({
  total,
  active,
  expiring,
  overdue,
  overdueAmount,
  tenants,
  properties,
}: {
  total: number;
  active: number;
  expiring: number;
  overdue: number;
  overdueAmount: string;
  tenants: Tenant[];
  properties: Property[];
}) {
  const pct = total === 0 ? '0' : ((active / total) * 100).toFixed(1);
  const byProp = (list: Tenant[]) => spreadByProperty(properties, list, (t) => t.propertyId);
  return (
    <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
      <KpiCard
        icon={Icons.users} tint="teal"
        delta={{ text: '+6 this month', tone: 'up' }}
        value={total} format={fmtInt}
        label="Total Tenants" sub="Across portfolio"
        spark={byProp(tenants)} stagger="sd-1"
      />
      <KpiCard
        icon={Icons.user} tint="blue"
        delta={{ text: `${pct}%`, tone: 'flat' }}
        value={active} format={fmtInt}
        label="Active Tenants" sub="Of all tenants"
        spark={byProp(tenants.filter((t) => t.status === 'Active'))} stagger="sd-2"
      />
      <KpiCard
        icon={Icons.lease} tint="amber"
        delta={{ text: 'Within 30 days', tone: 'warn' }}
        value={expiring} format={fmtInt}
        label="Expiring Leases"
        spark={byProp(tenants.filter((t) => t.leaseStatus === 'Expiring Soon'))} stagger="sd-3"
      />
      <KpiCard
        icon={Icons.card} tint="rose"
        delta={{ text: 'Needs follow-up', tone: 'down' }}
        value={overdue} format={fmtInt}
        label="Overdue Payments" sub={`${overdueAmount} outstanding`}
        spark={byProp(tenants.filter((t) => t.paymentStatus === 'Overdue'))} stagger="sd-4"
      />
    </div>
  );
}
