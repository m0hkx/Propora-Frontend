import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatMoney } from '../data/mock';
import type { Lease } from '../data/mock';
import { Badge, Card } from '../components/ui';
import { FilterControls, FilterRow, FilterTabs, SearchField } from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { Icons } from '../components/icons';
import { useStore } from '../state/useStore';
import { fmtDate } from '../lib/format';
import { leaseUnitLabel } from '../lib/units';
import { leaseTone as tone } from '../lib/tone';
import { spreadByProperty } from '../lib/stats';
import SortableTh from '../components/SortableTh';
import { byDate, byNumber, byRank, byText, nextSort, sortRows } from '../lib/sort';
import type { SortState } from '../lib/sort';

type LeaseTab = 'All' | 'Active' | 'Expiring' | 'Expired';
type LeaseSort = 'id' | 'tenant' | 'property' | 'unit' | 'term' | 'rent' | 'status';

/** Lifecycle order for the status column. */
const LEASE_STATUS_ORDER = ['Active', 'Expiring', 'Expired'] as const satisfies readonly Lease['status'][];

const tabs: LeaseTab[] = ['All', 'Active', 'Expiring', 'Expired'];
const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
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

  const totalRent = leases.reduce((s, l) => s + l.rent, 0);
  const rentSpread = spreadByProperty(properties, leases, (l) => l.propertyId, (l) => l.rent);
  const countSpread = spreadByProperty(properties, leases, (l) => l.propertyId);

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
  const resetFilters = () => { setTab('All'); setSearch(''); setProperty('all'); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

      <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
        <KpiCard
          icon={Icons.lease} tint="teal"
          delta={{ text: 'Portfolio-wide', tone: 'flat' }}
          value={leases.length} format={(n) => Math.round(n).toLocaleString('en-US')}
          label="Total Leases" spark={countSpread} stagger="sd-1"
        />
        <KpiCard
          icon={Icons.key} tint="blue"
          delta={{ text: `${counts.All === 0 ? 0 : Math.round((counts.Active / counts.All) * 100)}% of total`, tone: 'flat' }}
          value={counts.Active} format={(n) => Math.round(n).toLocaleString('en-US')}
          label="Active Leases" spark={countSpread} stagger="sd-2"
        />
        <KpiCard
          icon={Icons.bell} tint="amber"
          delta={{ text: 'Within 30 days', tone: counts.Expiring > 0 ? 'warn' : 'flat' }}
          value={counts.Expiring} format={(n) => Math.round(n).toLocaleString('en-US')}
          label="Expiring Soon" spark={countSpread} stagger="sd-3"
        />
        <KpiCard
          icon={Icons.card} tint="rose"
          delta={{ text: 'Across all leases', tone: 'flat' }}
          value={totalRent} format={(n) => formatMoney(Math.round(n))}
          label="Total Monthly Rent" spark={rentSpread} stagger="sd-4"
        />
      </div>

      <Card>
        <FilterTabs
          tabs={tabs.map((t) => ({ key: t, label: t, count: counts[t] }))}
          active={tab}
          onChange={(k) => { setTab(k as LeaseTab); setPage(1); }}
          ariaLabel="Filter leases by status"
          className="mb-2.5"
        />
        <FilterRow>
          <SearchField
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by lease, tenant, or property..."
            ariaLabel="Search leases"
          />
          <FilterControls>
            <select value={property} onChange={(e) => { setProperty(e.target.value); setPage(1); }} aria-label="Filter by property" className="max-md:flex-1">
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
              <button className="btn btn-ghost btn-sm" type="button" onClick={resetFilters}>
                Reset
              </button>
            ) : null}
          </FilterControls>
        </FilterRow>
      </Card>

      <Card className="table-card">
        <div className="row table-head-row"><strong>Leases</strong><span className="small muted">({filtered.length})</span></div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Icons.lease}
            title="No leases found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={filtersOn ? <button className="btn btn-ghost btn-sm" type="button" onClick={resetFilters}>Reset filters</button> : undefined}
          />
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
                {paged.map((l) => (
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

      {filtered.length > 0 ? (
        <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} itemLabel="leases" />
      ) : null}
    </div>
  );
}
