import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatMoney } from '../data/mock';
import type { Payment } from '../data/mock';
import { Badge, Card } from '../components/ui';
import { FilterControls, FilterRow, FilterTabs, SearchField } from '../components/FilterBar';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { Icons } from '../components/icons';
import KpiCard from '../components/KpiCard';
import RecordPaymentModal from './Payments/RecordPaymentModal';
import type { PaymentDraft } from './Payments/RecordPaymentModal';
import { useStore } from '../state/useStore';
import { fmtDate } from '../lib/format';
import { spreadByProperty } from '../lib/stats';
import { paymentTone as tone } from '../lib/tone';
import SortableTh from '../components/SortableTh';
import { byDate, byNumber, byRank, byText, nextSort, sortRows } from '../lib/sort';
import type { SortState } from '../lib/sort';

type PayTab = 'All' | 'Paid' | 'Pending' | 'Overdue';
type PaySort = 'id' | 'tenant' | 'property' | 'amount' | 'date' | 'method' | 'status';

/** Lifecycle order for the status column. */
const PAYMENT_STATUS_ORDER = ['Paid', 'Pending', 'Overdue'] as const satisfies readonly Payment['status'][];

const tabs: PayTab[] = ['All', 'Paid', 'Pending', 'Overdue'];
const PAGE_SIZE = 10;

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusTenantId = searchParams.get('tenantId');
  const payments = useStore((s) => s.payments);
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);
  const updatePayment = useStore((s) => s.updatePayment);
  const pushToast = useStore((s) => s.pushToast);
  const [tab, setTab] = useState<PayTab>('All');
  const [search, setSearch] = useState('');
  const [property, setProperty] = useState('all');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(1);
  // Default view is unchanged: newest payments first.
  const [sort, setSort] = useState<SortState<PaySort>>({ key: 'date', dir: 'desc' });

  // Catch-up for long-open sessions (idempotent; silent when nothing is due).
  useEffect(() => {
    try {
      useStore.getState().runPaymentAutomation();
    } catch (err) {
      console.error('[payments:auto] catch-up failed', err);
    }
  }, []);
  const [editId, setEditId] = useState<string | null>(null);

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
    const out = payments.filter((p) => {
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
    return sortRows(out, sort, {
      id: byText((p) => p.id),
      tenant: byText((p) => tenantOf(p.tenantId)?.name),
      property: byText((p) => propertyOf(p.propertyId)?.name),
      // Sorts the raw number, not the "$1,200" the cell renders.
      amount: byNumber((p) => p.amount),
      date: byDate((p) => p.date),
      method: byText((p) => p.method),
      status: byRank((p) => p.status, PAYMENT_STATUS_ORDER),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, tenants, properties, tab, search, property, method, sort, focusTenantId]);

  const onSort = (key: PaySort) => setSort((cur) => nextSort(cur, key));

  const filtersOn = tab !== 'All' || search.trim() !== '' || property !== 'all' || method !== 'all';
  const resetFilters = () => { setTab('All'); setSearch(''); setProperty('all'); setMethod('all'); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const sumsByProp = (status: Payment['status']) =>
    spreadByProperty(
      properties,
      payments.filter((p) => p.status === status),
      (p) => p.propertyId,
      (p) => p.amount
    );
  const rateSpread = properties.map((p) => {
    const mine = payments.filter((pp) => pp.propertyId === p.id);
    const paid = mine.filter((pp) => pp.status === 'Paid').reduce((s, pp) => s + pp.amount, 0);
    const total = mine.reduce((s, pp) => s + pp.amount, 0);
    return total === 0 ? 0 : Math.round((paid / total) * 100);
  });
  const fmtMoney = (n: number) => formatMoney(Math.round(n));

  const editing = editId ? payments.find((p) => p.id === editId) ?? null : null;

  const saveEdit = (id: string, d: PaymentDraft) => {
    updatePayment(id, { ...d });
    setEditId(null);
    pushToast(`Saved changes for ${id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {focusTenant ? (
        <Card>
          <div className="row flex-wrap">
            <div>
              <strong>Payments for {focusTenant.name}</strong>
              <div className="small muted">{focusTenant.email} · Unit {focusTenant.unit}</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('tenantId'); setSearchParams(next); }}>Clear filter · show all payments</button>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
        <KpiCard
          icon={Icons.card} tint="teal"
          delta={{ text: 'This period', tone: 'flat' }}
          value={sums.Paid} format={fmtMoney}
          label="Collected" spark={sumsByProp('Paid')} stagger="sd-1"
        />
        <KpiCard
          icon={Icons.folder} tint="amber"
          delta={{ text: 'Awaiting clearance', tone: 'flat' }}
          value={sums.Pending} format={fmtMoney}
          label="Pending" spark={sumsByProp('Pending')} stagger="sd-2"
        />
        <KpiCard
          icon={Icons.bell} tint="rose"
          delta={{ text: 'Needs follow-up', tone: 'down' }}
          value={sums.Overdue} format={fmtMoney}
          label="Overdue" spark={sumsByProp('Overdue')} stagger="sd-3"
        />
        <KpiCard
          icon={Icons.chart} tint="blue"
          delta={{ text: 'Paid share of total', tone: 'flat' }}
          value={sums.rate} format={(n) => `${Math.round(n)}%`}
          label="Collection rate" spark={rateSpread} stagger="sd-4"
        />
      </div>

      <Card>
        <FilterTabs
          tabs={tabs.map((t) => ({ key: t, label: t, count: counts[t] }))}
          active={tab}
          onChange={(k) => { setTab(k as PayTab); setPage(1); }}
          ariaLabel="Filter payments by status"
          className="mb-2.5"
        />
        <FilterRow>
          <SearchField
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by payment, tenant, property, or amount..."
            ariaLabel="Search payments"
          />
          <FilterControls>
            <select value={property} onChange={(e) => { setProperty(e.target.value); setPage(1); }} aria-label="Filter by property" className="max-md:flex-1">
              <option value="all">All Properties</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} aria-label="Filter by method" className="max-md:flex-1">
              <option value="all">All Methods</option>
              <option value="Bank">Bank</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>
            {/* Shortcut into the same sort state the column headers drive. */}
            <select value={sort.key} onChange={(e) => setSort({ key: e.target.value as PaySort, dir: 'asc' })} aria-label="Sort payments" className="max-md:flex-1">
              <option value="id">ID</option>
              <option value="tenant">Tenant</option>
              <option value="property">Property</option>
              <option value="amount">Amount</option>
              <option value="date">Date</option>
              <option value="method">Method</option>
              <option value="status">Status</option>
            </select>
            {filtersOn ? (
              <button className="btn btn-ghost btn-sm" type="button" onClick={resetFilters}>
                Reset
              </button>
            ) : null}
          </FilterControls>
        </FilterRow>
      </Card>

      <Card className="table-card">
        <div className="row table-head-row"><strong>Payment history</strong><span className="small muted">({filtered.length} records)</span></div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Icons.card}
            title="No payments found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={filtersOn ? <button className="btn btn-ghost btn-sm" type="button" onClick={resetFilters}>Reset filters</button> : undefined}
          />
        ) : (
          <div className="table-wrap table-flush">
            <table className="tenant-table">
              <thead>
                <tr>
                  <SortableTh label="ID" sortKey="id" sort={sort} onSort={onSort} />
                  <SortableTh label="Tenant" sortKey="tenant" sort={sort} onSort={onSort} />
                  <SortableTh label="Property" sortKey="property" sort={sort} onSort={onSort} />
                  <SortableTh label="Amount" sortKey="amount" sort={sort} onSort={onSort} />
                  <SortableTh label="Date" sortKey="date" sort={sort} onSort={onSort} />
                  <SortableTh label="Method" sortKey="method" sort={sort} onSort={onSort} />
                  <SortableTh label="Status" sortKey="status" sort={sort} onSort={onSort} />
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td>{tenantOf(p.tenantId)?.name ?? p.tenantId}</td>
                    <td>{propertyOf(p.propertyId)?.name ?? p.propertyId}</td>
                    <td>{formatMoney(p.amount)}</td>
                    <td className="small">{fmtDate(p.date)}</td>
                    <td>{p.method}</td>
                    <td><Badge tone={tone(p.status)}>{p.status}</Badge></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditId(p.id)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {filtered.length > 0 ? (
        <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} itemLabel="payments" />
      ) : null}

      {editing && (
        <RecordPaymentModal
          mode="edit"
          title={`Edit Payment — ${editing.id}`}
          initial={{
            tenantId: editing.tenantId,
            propertyId: editing.propertyId,
            amount: editing.amount,
            date: editing.date,
            method: editing.method,
            status: editing.status,
          }}
          properties={properties}
          tenants={tenants}
          onClose={() => setEditId(null)}
          onSubmit={(d) => saveEdit(editing.id, d)}
        />
      )}
    </div>
  );
}
