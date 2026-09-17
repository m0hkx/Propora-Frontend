import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatMoney } from '../data/mock';
import type { Lease } from '../data/mock';
import { Badge, Card, Icon } from '../components/ui';
import { Icons } from '../components/icons';
import { useStore } from '../state/useStore';
import { fmtDate } from '../lib/format';

type LeaseTab = 'All' | 'Active' | 'Expiring' | 'Expired';
type LeaseSort = 'endDate' | 'rent' | 'tenant';

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
  const [tab, setTab] = useState<LeaseTab>('All');
  const [search, setSearch] = useState('');
  const [property, setProperty] = useState('all');
  const [sort, setSort] = useState<LeaseSort>('endDate');

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
    let out = leases.filter((l) => {
      if (focusTenantId && l.tenantId !== focusTenantId) return false;
      if (tab !== 'All' && l.status !== tab) return false;
      if (property !== 'all' && l.propertyId !== property) return false;
      if (q) {
        const hay = `${l.id} ${tenantOf(l.tenantId)?.name ?? ''} ${propertyOf(l.propertyId)?.name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    out = [...out];
    if (sort === 'endDate') out.sort((a, b) => a.end.localeCompare(b.end));
    if (sort === 'rent') out.sort((a, b) => b.rent - a.rent);
    if (sort === 'tenant') out.sort((a, b) => (tenantOf(a.tenantId)?.name ?? '').localeCompare(tenantOf(b.tenantId)?.name ?? ''));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leases, tenants, properties, tab, search, property, sort, focusTenantId]);

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
            <select value={sort} onChange={(e) => setSort(e.target.value as LeaseSort)} aria-label="Sort leases" className="max-md:flex-1">
              <option value="endDate">Ending soon</option>
              <option value="rent">Rent high–low</option>
              <option value="tenant">Tenant A–Z</option>
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
              <thead><tr><th>Lease</th><th>Tenant</th><th>Property</th><th>Term</th><th>Rent</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.id}</strong><div className="small muted">Deposit {formatMoney(l.deposit)}</div></td>
                    <td>{tenantOf(l.tenantId)?.name ?? l.tenantId}</td>
                    <td>{propertyOf(l.propertyId)?.name ?? l.propertyId}</td>
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
