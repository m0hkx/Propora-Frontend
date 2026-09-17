import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatMoney } from '../data/mock';
import type { Lease } from '../data/mock';
import { Badge, Card, Icon } from '../components/ui';
import { Icons } from '../components/icons';
import { useStore } from '../state/useStore';
import { fmtDate } from '../lib/format';
import { leaseUnitLabel } from '../lib/units';
import SortableTh from '../components/SortableTh';
import { byDate, byNumber, byRank, byText, nextSort, sortRows } from '../lib/sort';
import type { SortState } from '../lib/sort';

type LeaseTab = 'All' | 'Active' | 'Expiring' | 'Expired';
type LeaseSort = 'id' | 'tenant' | 'property' | 'unit' | 'term' | 'rent' | 'status';

/** Lifecycle order for the status column. */
const LEASE_STATUS_ORDER = ['Active', 'Expiring', 'Expired'] as const satisfies readonly Lease['status'][];

const tabs: LeaseTab[] = ['All', 'Active', 'Expiring', 'Expired'];

function tone(s: Lease['status']): 'success' | 'warn' | 'danger' {
  return s === 'Active' ? 'success' : s === 'Expiring' ? 'warn' : 'danger';
}

export default function Leases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusTenantId = searchParams.get('tenantId');
  const leases = useStore((s) => s.leases);
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);
  const units = useStore((s) => s.units);
  const [tab, setTab] = useState<LeaseTab>('All');
  const [search, setSearch] = useState('');
  const [property, setProperty] = useState('all');
  // Default view is unchanged: soonest lease end first.
  const [sort, setSort] = useState<SortState<LeaseSort>>({ key: 'term', dir: 'asc' });

  const tenantOf = (id: string) => tenants.find((t) => t.id === id);
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const focusTenant = focusTenantId ? tenantOf(focusTenantId) : undefined;

  const counts = useMemo(() => {
    const c: Record<LeaseTab, number> = { All: leases.length, Active: 0, Expiring: 0, Expired: 0 };
    for (const l of leases) c[l.status]++;
    return c;
  }, [leases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = leases.filter((l) => {
      if (focusTenantId && l.tenantId !== focusTenantId) return false;
      if (tab !== 'All' && l.status !== tab) return false;
      if (property !== 'all' && l.propertyId !== property) return false;
      if (q) {
        const hay = `${l.id} ${tenantOf(l.tenantId)?.name ?? ''} ${propertyOf(l.propertyId)?.name ?? ''} ${leaseUnitLabel(l, units, tenants)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return sortRows(out, sort, {
      id: byText((l) => l.id),
      tenant: byText((l) => tenantOf(l.tenantId)?.name),
      property: byText((l) => propertyOf(l.propertyId)?.name),
      unit: byText((l) => leaseUnitLabel(l, units, tenants)),
      // The Term cell shows start → end; it sorts by end date, matching the
      // "ending soon" default this page has always opened with.
      term: byDate((l) => l.end),
      rent: byNumber((l) => l.rent),
      status: byRank((l) => l.status, LEASE_STATUS_ORDER),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leases, tenants, properties, tab, search, property, sort, focusTenantId]);

  const onSort = (key: LeaseSort) => setSort((cur) => nextSort(cur, key));

  const filtersOn = tab !== 'All' || search.trim() !== '' || property !== 'all';

  return (
    <div className="flex flex-col gap-4">
      {focusTenant ? (
        <Card>
          <div className="row flex-wrap">
            <div>
              <strong>Leases for {focusTenant.name}</strong>
              <div className="small muted">{focusTenant.email} · Unit {focusTenant.unit}</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('tenantId'); setSearchParams(next); }}>Clear filter · show all leases</button>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="tabs mb-2.5" role="tablist" aria-label="Filter leases by status">
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
        <div className="flex items-center justify-between gap-3 flex-wrap max-md:flex-col max-md:items-stretch">
          <label className="search search-grow">
            <Icon d={Icons.search} />
            <input
              placeholder="Search by lease, tenant, or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search leases"
            />
          </label>
          <div className="flex gap-2 items-center flex-wrap flex-auto justify-end max-md:w-full">
            <select value={property} onChange={(e) => setProperty(e.target.value)} aria-label="Filter by property" className="max-md:flex-1">
              <option value="all">All Properties</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {/* Shortcut into the same sort state the column headers drive. */}
            <select value={sort.key} onChange={(e) => setSort({ key: e.target.value as LeaseSort, dir: 'asc' })} aria-label="Sort leases" className="max-md:flex-1">
              <option value="id">Lease</option>
              <option value="tenant">Tenant</option>
              <option value="property">Property</option>
              <option value="unit">Unit</option>
              <option value="term">Lease end</option>
              <option value="rent">Rent</option>
              <option value="status">Status</option>
            </select>
            {filtersOn ? (
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setTab('All'); setSearch(''); setProperty('all'); }}>
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="table-card">
        <div className="row table-head-row"><strong>Leases</strong><span className="small muted">({filtered.length})</span></div>
        {filtered.length === 0 ? (
          <p className="muted px-3 pb-3">No leases match your filters.</p>
        ) : (
          <div className="table-wrap table-flush">
            <table className="tenant-table">
              <thead>
                <tr>
                  <SortableTh label="Lease" sortKey="id" sort={sort} onSort={onSort} />
                  <SortableTh label="Tenant" sortKey="tenant" sort={sort} onSort={onSort} />
                  <SortableTh label="Property" sortKey="property" sort={sort} onSort={onSort} />
                  <SortableTh label="Unit" sortKey="unit" sort={sort} onSort={onSort} />
                  <SortableTh label="Term" sortKey="term" sort={sort} onSort={onSort} />
                  <SortableTh label="Rent" sortKey="rent" sort={sort} onSort={onSort} />
                  <SortableTh label="Status" sortKey="status" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.id}</strong><div className="small muted">Deposit {formatMoney(l.deposit)}</div></td>
                    <td>{tenantOf(l.tenantId)?.name ?? l.tenantId}</td>
                    <td>{propertyOf(l.propertyId)?.name ?? l.propertyId}</td>
                    <td>{leaseUnitLabel(l, units, tenants)}</td>
                    <td className="small">{fmtDate(l.start)} → {fmtDate(l.end)}</td>
                    <td><strong>{formatMoney(l.rent)}</strong> <span className="small muted">/mo</span></td>
                    <td><Badge tone={tone(l.status)}>{l.status}</Badge></td>
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
