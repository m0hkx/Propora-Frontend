import { useState } from 'react';
import { AreaChart, Donut } from '../components/charts';
import { Badge, Card, Progress } from '../components/ui';
import { useStore } from '../state/useStore';

type Range = 'Monthly' | 'Quarterly' | 'Yearly';

const revenueSets: Record<Range, { values: number[]; labels: string[] }> = {
  Monthly: { values: [82, 88, 84, 92, 95, 102, 108, 115, 124], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'] },
  Quarterly: { values: [260, 310, 345, 372], labels: ['Q1', 'Q2', 'Q3', 'Q4'] },
  Yearly: { values: [820, 950, 1100, 1280, 1450], labels: ['2022', '2023', '2024', '2025', '2026'] },
};

const propertyRows = [
  { name: 'Harbor Point', occ: '100%', rev: '$62,400', tone: 'success' as const, status: 'Excellent' },
  { name: 'Sunset Apartments', occ: '94%', rev: '$41,200', tone: 'success' as const, status: 'Good' },
  { name: 'Palm Residence', occ: '82%', rev: '$29,800', tone: 'warn' as const, status: 'Attention' },
  { name: 'Downtown Plaza', occ: '76%', rev: '$18,400', tone: 'warn' as const, status: 'Attention' },
];

const revenueBars = [
  { name: 'Harbor Point', pct: 100, value: '$62.4k' },
  { name: 'Sunset Apartments', pct: 66, value: '$41.2k' },
  { name: 'Palm Residence', pct: 48, value: '$29.8k' },
  { name: 'Downtown Plaza', pct: 30, value: '$18.4k' },
];

const recentPayments = [
  { tenant: 'Sarah Johnson', prop: 'Harbor #204', amount: '$1,200', tone: 'success' as const, status: 'Paid' },
  { tenant: 'Michael Smith', prop: 'Palm #102', amount: '$950', tone: 'success' as const, status: 'Paid' },
  { tenant: 'David Brown', prop: 'Sunset #301', amount: '$1,400', tone: 'danger' as const, status: 'Overdue' },
  { tenant: 'John Wilson', prop: 'Harbor #102', amount: '$1,100', tone: 'warn' as const, status: 'Pending' },
];

const maintenanceItems = [
  { title: 'AC not working', unit: 'Apartment #204', meta: 'High Priority · In Progress', tone: 'danger' as const },
  { title: 'Broken window', unit: 'Apartment #103', meta: 'Medium · Open', tone: 'warn' as const },
  { title: 'Water leakage', unit: 'Apartment #302', meta: 'High Priority · Open', tone: 'danger' as const },
];

const timeline = [
  { text: 'Sarah Johnson paid $1,200', time: '10 minutes ago' },
  { text: 'New lease created for Unit #204', time: '1 hour ago' },
  { text: 'Maintenance request completed', time: '3 hours ago' },
  { text: 'Michael Smith added as a tenant', time: 'Yesterday' },
  { text: 'Property "Harbor Point" added', time: 'Yesterday' },
];

export default function Dashboard() {
  const [range, setRange] = useState<Range>('Monthly');
  const set = revenueSets[range];
  const { properties } = useStore();
  // Portfolio-wide total: 18 managed + any created in this session.
  const totalProperties = 18 + Math.max(0, properties.length - 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Row 1 — Core KPIs */}
      <div className="grid-4">
        <Card>
          <div className="small muted">Total Properties</div>
          <div className="kpi">{totalProperties} <span className="small muted" style={{ fontFamily: 'inherit', fontSize: 14 }}>Properties</span></div>
          <div className="small">17 Active</div>
          <div className="small muted"><span className="badge success">+2 this month</span></div>
        </Card>
        <Card>
          <div className="small muted">Total Units</div>
          <div className="kpi">142 <span className="small muted" style={{ fontSize: 14 }}>Units</span></div>
          <div className="small">128 Occupied</div>
          <div className="small muted">Occupancy: 90.1%</div>
        </Card>
        <Card>
          <div className="small muted">Monthly Revenue</div>
          <div className="kpi">$124,850</div>
          <div className="small" style={{ color: '#047857', fontWeight: 700 }}>▲ +$8,420 vs last month</div>
          <div className="small muted">Small upward trend</div>
        </Card>
        <Card>
          <div className="small muted">Outstanding Payments</div>
          <div className="kpi">$12,450</div>
          <div className="small">8 Payments</div>
          <div className="small"><span className="badge danger">3 Overdue</span></div>
        </Card>
      </div>

      {/* Row 2 — Revenue + Occupancy */}
      <div className="split-21">
        <Card>
          <div className="row">
            <div><strong>Revenue Overview</strong><div className="kpi" style={{ margin: '4px 0' }}>$124,850</div><div className="small" style={{ color: '#047857', fontWeight: 700 }}>+7.2% vs last month</div></div>
            <label className="small muted">Range&nbsp;
              <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Revenue range">
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>
          </div>
          <AreaChart values={set.values} labels={set.labels} />
        </Card>
        <Card>
          <div className="small muted">Occupancy</div>
          <div className="kpi">90.1%</div>
          <div className="small muted">128 / 142 units occupied</div>
          <div style={{ margin: '12px 0' }}><Progress value={90.1} /></div>
          <Donut percent={90} label="Occupied" />
          <div className="list">
            <div className="list-item"><span>Occupied</span><strong>128</strong></div>
            <div className="list-item"><span>Vacant</span><strong>14</strong></div>
          </div>
          <div className="small" style={{ color: '#047857', fontWeight: 700, marginTop: 8 }}>+2.4% vs last month</div>
        </Card>
      </div>

      {/* Row 3 — Performance + Action */}
      <div className="split-21">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div className="row"><strong>Property Performance</strong><button className="btn btn-ghost" type="button">View All Properties →</button></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Property</th><th>Occupancy</th><th>Revenue</th><th>Status</th></tr></thead>
                <tbody>
                  {propertyRows.map((r) => (
                    <tr key={r.name}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.occ}</td>
                      <td>{r.rev}</td>
                      <td><Badge tone={r.tone}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <strong>Revenue by Property</strong>
            <div className="list">
              {revenueBars.map((b) => (
                <div key={b.name}>
                  <div className="row small"><span>{b.name}</span><strong>{b.value}</strong></div>
                  <div className="progress" role="progressbar" aria-valuenow={b.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.name} revenue`}>
                    <div style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="tint">
          <strong>Action Required</strong>
          <div className="list">
            <div className="list-item">
              <span><span className="dot" style={{ background: '#DC2626' }} /> 3 Overdue Payments</span>
              <strong>$4,250 outstanding</strong>
            </div>
            <div className="list-item">
              <span><span className="dot" style={{ background: '#EA580C' }} /> 5 Leases Expiring Soon</span>
              <strong>Within 30 days</strong>
            </div>
            <div className="list-item">
              <span><span className="dot" style={{ background: '#CA8A04' }} /> 4 Maintenance Requests</span>
              <strong>Awaiting resolution</strong>
            </div>
          </div>
          <button className="btn btn-teal" type="button" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>View All →</button>
        </Card>
      </div>

      {/* Row 4 — Operations */}
      <div className="grid-2">
        <Card>
          <div className="row"><strong>Recent Payments</strong><button className="btn btn-ghost" type="button">View All Payments →</button></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.tenant}>
                    <td><strong>{p.tenant}</strong></td>
                    <td>{p.prop}</td>
                    <td>{p.amount}</td>
                    <td><Badge tone={p.tone}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <div className="row"><strong>Maintenance Requests</strong><button className="btn btn-ghost" type="button">View All Requests →</button></div>
          <div className="list">
            {maintenanceItems.map((m) => (
              <div key={m.title} className="list-item">
                <div><strong>{m.title}</strong><div className="small muted">{m.unit}</div><div className="small muted">{m.meta}</div></div>
                <Badge tone={m.tone}>{m.meta.split('·')[1]?.trim() ?? 'Open'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 5 — Activity */}
      <Card>
        <strong>Recent Activity</strong>
        <div className="timeline">
          {timeline.map((t) => (
            <div key={t.text} className="timeline-item">
              <span className="timeline-dot" />
              <div><div>{t.text}</div><div className="small muted">{t.time}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
