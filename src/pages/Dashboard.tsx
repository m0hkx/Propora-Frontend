import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney, propertyName, tenantName } from '../data/mock';
import { AreaChart, Donut } from '../components/charts';
import { Badge, Card, Progress } from '../components/ui';
import { Icons } from '../components/icons';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import { useStore } from '../state/useStore';
import { fmtDate } from '../lib/format';
import { revenueByPeriod, spreadByProperty } from '../lib/stats';
import type { RevenueRange } from '../lib/stats';
import { maintenancePriorityTone, paymentTone } from '../lib/tone';
import { withLiveOccupancy } from '../lib/units';
import { scopeLabel } from './Maintenance/maintenanceUtils';

type Range = RevenueRange;

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('Monthly');
  const [actionOpen, setActionOpen] = useState(false);
  const rawProperties = useStore((s) => s.properties);
  const payments = useStore((s) => s.payments);
  const maintenance = useStore((s) => s.maintenance);
  const tenants = useStore((s) => s.tenants);
  const units = useStore((s) => s.units);
  const documents = useStore((s) => s.documents);
  // Nothing keeps the stored `occupied` field in sync — see withLiveOccupancy.
  const properties = useMemo(() => withLiveOccupancy(rawProperties, tenants), [rawProperties, tenants]);
  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.status === 'Active').length;

  const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
  const fmtMoney = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const occupiedUnits = properties.reduce((s, p) => s + p.occupied, 0);
  const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
  const occPct = totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100);
  // Expected monthly revenue from currently occupied units — same formula the
  // Property Performance / Revenue by Property sections use per property.
  const monthlyRevenue = properties.reduce((s, p) => s + p.occupied * p.rent, 0);

  const chart = useMemo(() => revenueByPeriod(payments, range), [payments, range]);

  const overdueSums = spreadByProperty(
    properties,
    payments.filter((p) => p.status === 'Overdue'),
    (p) => p.propertyId,
    (p) => p.amount
  );

  const overdue = payments.filter((p) => p.status === 'Overdue');
  const outstanding = overdue.reduce((s, p) => s + p.amount, 0);
  const openMaint = maintenance.filter((m) => m.status === 'Open');
  const expiring = tenants.filter((t) => t.leaseStatus === 'Expiring Soon');
  const tenantOf = (id: string) => tenants.find((t) => t.id === id)?.name ?? id;

  // Merges every dated event this account actually has — maintenance history
  // entries, paid payments, document uploads — sorted newest-first. Tenants
  // and leases carry no creation timestamp (only contractual dates), so they
  // aren't a reliable "recent activity" signal and are left out.
  const activity = useMemo(() => {
    const items: { text: string; date: string }[] = [];
    for (const m of maintenance) {
      for (const h of m.history) items.push({ text: `${h.text} — ${m.title}`, date: h.date });
    }
    for (const p of payments) {
      if (p.status === 'Paid') items.push({ text: `${tenantName(p.tenantId, tenants)} paid ${formatMoney(p.amount)}`, date: p.date });
    }
    for (const d of documents) items.push({ text: `Document uploaded: ${d.name}`, date: d.uploadDate });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [maintenance, payments, documents, tenants]);

  // Top properties by revenue, feeding both the performance table and the
  // revenue-by-property list below — same live store data, two views of it.
  const topProperties = [...properties]
    .sort((a, b) => b.occupied * b.rent - a.occupied * a.rent)
    .slice(0, 4);
  const maxTopRevenue = Math.max(1, ...topProperties.map((p) => p.occupied * p.rent));
  const propertyRows = topProperties.map((p) => {
    const occPct = p.units === 0 ? 0 : Math.round((p.occupied / p.units) * 100);
    const healthy = occPct >= 95 ? 'Excellent' : occPct >= 85 ? 'Good' : 'Attention';
    return {
      name: p.name,
      occ: `${occPct}%`,
      rev: fmtMoney(p.occupied * p.rent),
      tone: occPct >= 85 ? ('success' as const) : ('warn' as const),
      status: healthy,
    };
  });
  const revenueBars = topProperties.map((p) => ({
    name: p.name,
    pct: Math.round(((p.occupied * p.rent) / maxTopRevenue) * 100),
    value: fmtMoney(p.occupied * p.rent),
  }));

  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map((p) => ({
      tenant: tenantName(p.tenantId, tenants),
      prop: propertyName(p.propertyId, properties),
      amount: fmtMoney(p.amount),
      tone: paymentTone(p.status),
      status: p.status,
    }));

  const maintenanceItems = [...maintenance]
    .filter((m) => m.status !== 'Completed')
    .sort((a, b) => b.reported.localeCompare(a.reported))
    .slice(0, 3)
    .map((m) => ({
      title: m.title,
      unit: `${propertyName(m.propertyId, properties)} · ${scopeLabel(m, units)}`,
      meta: `${m.priority} Priority · ${m.status}`,
      status: m.status,
      tone: maintenancePriorityTone(m.priority),
    }));

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — Core KPIs (unified KpiCard system; sparks are live portfolio spreads) */}
      <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
        <KpiCard
          icon={Icons.building} tint="teal"
          delta={{ text: `${properties.length - activeProperties} inactive`, tone: 'flat' }}
          value={totalProperties} format={fmtInt}
          label="Total Properties" sub={`${activeProperties} Active`}
          spark={properties.map((p) => p.units)} stagger="sd-1"
        />
        <KpiCard
          icon={Icons.home} tint="blue"
          delta={{ text: `${occPct}% occupied`, tone: 'flat' }}
          value={totalUnits} format={(n) => `${fmtInt(n)} Units`}
          label="Total Units" sub={`${occupiedUnits} Occupied`}
          spark={properties.map((p) => p.occupied)} stagger="sd-2"
        />
        <KpiCard
          icon={Icons.card} tint="amber"
          delta={{ text: 'From occupied units', tone: 'flat' }}
          value={monthlyRevenue} format={fmtMoney}
          label="Monthly Revenue" sub="Current run-rate"
          spark={properties.map((p) => p.occupied * p.rent)} stagger="sd-3"
        />
        <KpiCard
          icon={Icons.bell} tint="rose"
          delta={{ text: (<><span className="dot" style={{ background: 'currentColor' }} /> {overdue.length} overdue</>), tone: overdue.length > 0 ? 'down' : 'flat' }}
          value={outstanding} format={fmtMoney}
          label="Outstanding" sub={`${overdue.length} Payments`}
          spark={overdueSums} stagger="sd-4"
        />
      </div>

      {/* Row 2 — Revenue + Occupancy */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 max-compact:grid-cols-1 rise sd-3">
        <Card>
          <div className="row">
            <div><strong>Revenue Overview</strong><div className="kpi my-1">{fmtMoney(monthlyRevenue)}</div><div className="small muted">Current run-rate from occupied units</div></div>
            <label className="small muted">Range&nbsp;
              <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Revenue range">
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>
          </div>
          {chart.values.length >= 2 ? (
            <AreaChart values={chart.values} labels={chart.labels} counts={chart.counts} />
          ) : (
            <p className="small muted mt-3 mb-1">Not enough payment history yet to chart a trend — record a few payments to see it here.</p>
          )}
        </Card>
        <Card>
          <div className="small muted">Occupancy</div>
          <div className="kpi">{occPct}%</div>
          <div className="small muted">{occupiedUnits} / {totalUnits} units occupied</div>
          <div className="my-3"><Progress value={occPct} /></div>
          <Donut percent={occPct} label="Occupied" />
          <div className="list">
            <div className="list-row"><span>Occupied</span><strong>{occupiedUnits}</strong></div>
            <div className="list-row"><span>Vacant</span><strong>{vacantUnits}</strong></div>
          </div>
        </Card>
      </div>

      {/* Row 3 — Performance + Action */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 max-compact:grid-cols-1 rise sd-4">
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
              <span><span className="dot dot-live" style={{ background: 'var(--color-destructive)' }} /> {overdue.length} Overdue Payments</span>
              <strong>${overdue.reduce((s, p) => s + p.amount, 0).toLocaleString('en-US')} outstanding</strong>
            </div>
            <div className="list-row">
              <span><span className="dot" style={{ background: 'var(--color-category-lease)' }} /> {expiring.length} Leases Expiring Soon</span>
              <strong>Within 30 days</strong>
            </div>
            <div className="list-row">
              <span><span className="dot" style={{ background: 'var(--color-category-maintenance)' }} /> {openMaint.length} Maintenance Requests</span>
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
                <Badge tone={m.tone}>{m.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 5 — Activity */}
      <Card className="rise sd-6">
        <strong>Recent Activity</strong>
        {activity.length === 0 ? (
          <p className="small muted mt-3 mb-1">No activity yet — it will show up here as you record payments, upload documents and work maintenance requests.</p>
        ) : (
          <div className="timeline">
            {activity.map((a, i) => (
              <div key={`${a.date}-${i}`} className="timeline-item">
                <span className="timeline-dot" />
                <div><div>{a.text}</div><div className="small muted">{fmtDate(a.date)}</div></div>
              </div>
            ))}
          </div>
        )}
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
