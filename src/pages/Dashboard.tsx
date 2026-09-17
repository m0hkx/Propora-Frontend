import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Donut, Spark } from '../components/charts';
import { Badge, Card, Icon, Progress } from '../components/ui';
import { Icons } from '../components/icons';
import Modal from '../components/Modal';
import { useStore } from '../state/useStore';
import { fmtDate } from '../lib/format';
import { useCountUp } from '../lib/useCountUp';

type Range = 'Monthly' | 'Quarterly' | 'Yearly';

const revenueSets: Record<Range, { values: number[]; labels: string[]; counts: number[] }> = {
  Monthly: { values: [82, 88, 84, 92, 95, 102, 108, 115, 124], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], counts: [0, 0, 0, 0, 0, 0, 1, 3, 4] },
  Quarterly: { values: [260, 310, 345, 372], labels: ['Q1', 'Q2', 'Q3', 'Q4'], counts: [0, 0, 8, 0] },
  Yearly: { values: [820, 950, 1100, 1280, 1450], labels: ['2022', '2023', '2024', '2025', '2026'], counts: [0, 0, 0, 0, 8] },
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
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('Monthly');
  const [actionOpen, setActionOpen] = useState(false);
  const set = revenueSets[range];
  const properties = useStore((s) => s.properties);
  const payments = useStore((s) => s.payments);
  const maintenance = useStore((s) => s.maintenance);
  const tenants = useStore((s) => s.tenants);
  // Portfolio-wide total: 18 managed + any created in this session.
  const totalProperties = 18 + Math.max(0, properties.length - 6);

  // Hero metrics ease in on mount (instant under reduced motion).
  const propsCount = useCountUp(totalProperties);
  const unitsCount = useCountUp(142);
  const revenueCount = useCountUp(124850);
  const outstandingCount = useCountUp(12450);
  const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
  const fmtMoney = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

  const overdue = payments.filter((p) => p.status === 'Overdue');
  const openMaint = maintenance.filter((m) => m.status === 'Open');
  const expiring = tenants.filter((t) => t.leaseStatus === 'Expiring Soon');
  const tenantOf = (id: string) => tenants.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — Core KPIs: chip + delta, hero numeral, label + sparkline */}
      <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
        <Card className="card-lift rise sd-1">
          <div className="row">
            <span className="kpi-chip tint-teal"><Icon d={Icons.building} /></span>
            <span className="delta up">▲ +2 this month</span>
          </div>
          <div className="kpi tnum">{fmtInt(propsCount)}</div>
          <div className="row items-end">
            <div><div className="small muted">Total Properties</div><div className="small font-semibold">17 Active</div></div>
            <Spark values={[14, 15, 15, 16, 16, 17, 18]} />
          </div>
        </Card>
        <Card className="card-lift rise sd-2">
          <div className="row">
            <span className="kpi-chip tint-blue"><Icon d={Icons.home} /></span>
            <span className="delta flat">90.1% occupied</span>
          </div>
          <div className="kpi tnum">{fmtInt(unitsCount)} <span className="small muted text-sm font-[inherit]">Units</span></div>
          <div className="row items-end">
            <div><div className="small muted">Total Units</div><div className="small font-semibold">128 Occupied</div></div>
            <Spark values={[118, 121, 122, 124, 126, 127, 128]} stroke="#0369A1" />
          </div>
        </Card>
        <Card className="card-lift rise sd-3">
          <div className="row">
            <span className="kpi-chip tint-amber"><Icon d={Icons.card} /></span>
            <span className="delta up">▲ +$8,420</span>
          </div>
          <div className="kpi tnum">{fmtMoney(revenueCount)}</div>
          <div className="row items-end">
            <div><div className="small muted">Monthly Revenue</div><div className="small font-semibold">vs last month</div></div>
            <Spark values={[82, 88, 84, 92, 95, 102, 108, 115, 124]} stroke="#B45309" />
          </div>
        </Card>
        <Card className="card-lift rise sd-4">
          <div className="row">
            <span className="kpi-chip tint-rose"><Icon d={Icons.bell} /></span>
            <span className="delta down"><span className="dot" style={{ background: 'currentColor' }} /> 3 overdue</span>
          </div>
          <div className="kpi tnum">{fmtMoney(outstandingCount)}</div>
          <div className="row items-end">
            <div><div className="small muted">Outstanding</div><div className="small font-semibold">8 Payments</div></div>
            <Spark values={[9.8, 10.4, 11.2, 10.8, 11.9, 12.1, 12.45]} stroke="#DC2626" />
          </div>
        </Card>
      </div>

      {/* Row 2 — Revenue + Occupancy */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 max-compact:grid-cols-2 max-md:grid-cols-1 rise sd-3">
        <Card>
          <div className="row">
            <div><strong>Revenue Overview</strong><div className="kpi my-1">$124,850</div><div className="small text-success font-bold">+7.2% vs last month</div></div>
            <label className="small muted">Range&nbsp;
              <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Revenue range">
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>
          </div>
          <AreaChart values={set.values} labels={set.labels} counts={set.counts} />
        </Card>
        <Card>
          <div className="small muted">Occupancy</div>
          <div className="kpi">90.1%</div>
          <div className="small muted">128 / 142 units occupied</div>
          <div className="my-3"><Progress value={90.1} /></div>
          <Donut percent={90} label="Occupied" />
          <div className="list">
            <div className="list-row"><span>Occupied</span><strong>128</strong></div>
            <div className="list-row"><span>Vacant</span><strong>14</strong></div>
          </div>
          <div className="small text-success font-bold mt-2">+2.4% vs last month</div>
        </Card>
      </div>

      {/* Row 3 — Performance + Action */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 max-compact:grid-cols-2 max-md:grid-cols-1 rise sd-4">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="row"><strong>Property Performance</strong><button className="btn btn-ghost" type="button" onClick={() => navigate('/properties')}>View All Properties →</button></div>
            <div className="table-wrap">
              <table className="tenant-table">
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
            <div className="list-row">
              <span><span className="dot dot-live" style={{ background: '#DC2626' }} /> {overdue.length} Overdue Payments</span>
              <strong>${overdue.reduce((s, p) => s + p.amount, 0).toLocaleString('en-US')} outstanding</strong>
            </div>
            <div className="list-row">
              <span><span className="dot" style={{ background: '#EA580C' }} /> {expiring.length} Leases Expiring Soon</span>
              <strong>Within 30 days</strong>
            </div>
            <div className="list-row">
              <span><span className="dot" style={{ background: '#CA8A04' }} /> {openMaint.length} Maintenance Requests</span>
              <strong>Awaiting resolution</strong>
            </div>
          </div>
          <button className="btn btn-teal mt-3 w-full justify-center" type="button" onClick={() => setActionOpen(true)}>View All →</button>
        </Card>
      </div>

      {/* Row 4 — Operations */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 rise sd-5">
        <Card>
          <div className="row"><strong>Recent Payments</strong><button className="btn btn-ghost" type="button" onClick={() => navigate('/payments')}>View All Payments →</button></div>
          <div className="table-wrap">
            <table className="tenant-table">
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
          <div className="row"><strong>Maintenance Requests</strong><button className="btn btn-ghost" type="button" onClick={() => navigate('/maintenance')}>View All Requests →</button></div>
          <div className="list">
            {maintenanceItems.map((m) => (
              <div key={m.title} className="list-row">
                <div><strong>{m.title}</strong><div className="small muted">{m.unit}</div><div className="small muted">{m.meta}</div></div>
                <Badge tone={m.tone}>{m.meta.split('·')[1]?.trim() ?? 'Open'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 5 — Activity */}
      <Card className="rise sd-6">
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

      {actionOpen && (
        <Modal title="Action Required" onClose={() => setActionOpen(false)} wide>
          <div className="modal-section">
            <h4>Overdue Payments ({overdue.length})</h4>
            {overdue.length === 0 ? <p className="small muted m-0">Nothing overdue.</p> : (
              <div className="list">
                {overdue.slice(0, 5).map((p) => (
                  <div key={p.id} className="list-row">
                    <span>{tenantOf(p.tenantId)} · ${p.amount.toLocaleString('en-US')}</span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setActionOpen(false); navigate('/payments'); }}>
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-section">
            <h4>Leases Expiring Soon ({expiring.length})</h4>
            {expiring.length === 0 ? <p className="small muted m-0">No upcoming expirations.</p> : (
              <div className="list">
                {expiring.slice(0, 5).map((t) => (
                  <div key={t.id} className="list-row">
                    <span>{t.name} · ends {fmtDate(t.leaseEnd)}</span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setActionOpen(false); navigate('/leases'); }}>
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-section">
            <h4>Open Maintenance ({openMaint.length})</h4>
            {openMaint.length === 0 ? <p className="small muted m-0">Queue is clear.</p> : (
              <div className="list">
                {openMaint.slice(0, 5).map((m) => (
                  <div key={m.id} className="list-row">
                    <span>{m.title}</span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setActionOpen(false); navigate('/maintenance'); }}>
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
