import { useMemo, useState } from 'react';
import { formatMoney } from '../data/mock';
import type { Payment } from '../data/mock';
import { Badge, Card, Icon, Stat } from '../components/ui';
import { Icons } from '../components/icons';
import { useStore } from '../state/useStore';
import { fmtDate } from './Tenants/tenantUtils';

type PayTab = 'All' | 'Paid' | 'Pending' | 'Overdue';
type PaySort = 'date' | 'amount';

const tabs: PayTab[] = ['All', 'Paid', 'Pending', 'Overdue'];

function tone(s: Payment['status']): 'success' | 'warn' | 'danger' {
  return s === 'Paid' ? 'success' : s === 'Pending' ? 'warn' : 'danger';
}

export default function Payments({
  focusTenantId,
  onClearFocus,
}: {
  focusTenantId: string | null;
  onClearFocus: () => void;
}) {
  const { payments, tenants, properties } = useStore();
  const [tab, setTab] = useState<PayTab>('All');
  const [search, setSearch] = useState('');
  const [property, setProperty] = useState('all');
  const [method, setMethod] = useState('all');
  const [sort, setSort] = useState<PaySort>('date');

  const tenantOf = (id: string) => tenants.find((t) => t.id === id);
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const focusTenant = focusTenantId ? tenantOf(focusTenantId) : undefined;

  const counts = useMemo(() => {
    const c: Record<PayTab, number> = { All: payments.length, Paid: 0, Pending: 0, Overdue: 0 };
    for (const p of payments) c[p.status]++;
    return c;
  }, [payments]);

  const sums = useMemo(() => {
    const s: Record<Payment['status'], number> = { Paid: 0, Pending: 0, Overdue: 0 };
    for (const p of payments) s[p.status] += p.amount;
    const total = s.Paid + s.Pending + s.Overdue;
    return { ...s, rate: total === 0 ? 0 : Math.round((s.Paid / total) * 100) };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = payments.filter((p) => {
      if (focusTenantId && p.tenantId !== focusTenantId) return false;
      if (tab !== 'All' && p.status !== tab) return false;
      if (property !== 'all' && p.propertyId !== property) return false;
      if (method !== 'all' && p.method !== method) return false;
      if (q) {
        const hay = `${p.id} ${tenantOf(p.tenantId)?.name ?? ''} ${propertyOf(p.propertyId)?.name ?? ''} ${p.amount}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    out = [...out];
    if (sort === 'date') out.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'amount') out.sort((a, b) => b.amount - a.amount);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, tenants, properties, tab, search, property, method, sort, focusTenantId]);

  const filtersOn = tab !== 'All' || search.trim() !== '' || property !== 'all' || method !== 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {focusTenant ? (
        <Card>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <div>
              <strong>Payments for {focusTenant.name}</strong>
              <div className="small muted">{focusTenant.email} · Unit {focusTenant.unit}</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClearFocus}>Clear filter · show all payments</button>
          </div>
        </Card>
      ) : null}

      <div className="grid-4">
        <Card><Stat label="Collected" value={formatMoney(sums.Paid)} sub="This period" /></Card>
        <Card><Stat label="Pending" value={formatMoney(sums.Pending)} sub="Awaiting clearance" /></Card>
        <Card><Stat label="Overdue" value={formatMoney(sums.Overdue)} sub="Needs follow-up" /></Card>
        <Card><Stat label="Collection rate" value={`${sums.rate}%`} sub="Paid share of total" /></Card>
      </div>

      <Card>
        <div className="tabs" role="tablist" aria-label="Filter payments by status" style={{ marginBottom: 10 }}>
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`tab ${tab === t ? 'active' : ''}`}
            >
              {t} · {counts[t]}
            </button>
          ))}
        </div>
        <div className="controls-row">
          <label className="search search-grow">
            <Icon d={Icons.search} />
            <input
              placeholder="Search by payment, tenant, property, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search payments"
            />
          </label>
          <div className="controls-side">
            <select value={property} onChange={(e) => setProperty(e.target.value)} aria-label="Filter by property">
              <option value="all">All Properties</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Filter by method">
              <option value="all">All Methods</option>
              <option value="Bank">Bank</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as PaySort)} aria-label="Sort payments">
              <option value="date">Newest first</option>
              <option value="amount">Amount high–low</option>
            </select>
            {filtersOn ? (
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setTab('All'); setSearch(''); setProperty('all'); setMethod('all'); }}>
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="table-card">
        <div className="row table-head-row"><strong>Payment history</strong><span className="small muted">({filtered.length} records)</span></div>
        {filtered.length === 0 ? (
          <p className="muted" style={{ padding: '0 12px 12px' }}>No payments match your filters.</p>
        ) : (
          <div className="table-wrap table-flush">
            <table className="tenant-table">
              <thead><tr><th>ID</th><th>Tenant</th><th>Property</th><th>Amount</th><th>Date</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td>{tenantOf(p.tenantId)?.name ?? p.tenantId}</td>
                    <td>{propertyOf(p.propertyId)?.name ?? p.propertyId}</td>
                    <td>{formatMoney(p.amount)}</td>
                    <td className="small">{fmtDate(p.date)}</td>
                    <td>{p.method}</td>
                    <td><Badge tone={tone(p.status)}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
