import { useMemo, useState } from 'react';
import { formatMoney, propertyCity, propertyName, tenants as seedTenants } from '../../data/mock';
import type { Tenant } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import TenantStats from './TenantStats';
import TenantFilters from './TenantFilters';
import TenantTable from './TenantTable';
import TenantPagination from './TenantPagination';
import { TenantAvatar } from './TenantRow';
import { fmtDate, leaseTone, matchesTab, paymentTone, tenantTone } from './tenantUtils';
import type { TenantAction, TenantSort, TenantTab } from './tenantUtils';

const PAGE_SIZE = 10;

export default function Tenants({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: (page: 'Leases' | 'Payments') => void;
}) {
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);
  const [tab, setTab] = useState<TenantTab>('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<TenantSort>('featured');
  const [page, setPage] = useState(1);
  // Selected tenant id mirrors the /tenants/:id detail route (detail view below for now).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', rent: 0, status: 'Active' as Tenant['status'] });

  const counts = useMemo(() => {
    const c: Record<TenantTab, number> = { All: tenants.length, Active: 0, Pending: 0, Expiring: 0, Overdue: 0 };
    for (const t of tenants) {
      if (t.status === 'Active') c.Active++;
      if (t.status === 'Pending') c.Pending++;
      if (t.leaseStatus === 'Expiring Soon') c.Expiring++;
      if (t.paymentStatus === 'Overdue') c.Overdue++;
    }
    return c;
  }, [tenants]);

  const filtered = useMemo(() => {
    const q = `${query} ${search}`.trim().toLowerCase();
    let out = tenants.filter((t) => {
      if (!matchesTab(t, tab)) return false;
      if (
        q &&
        !(t.name + ' ' + t.email + ' ' + t.phone + ' ' + propertyName(t.propertyId) + ' ' + t.unit).toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    out = [...out];
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'rent') out.sort((a, b) => b.rent - a.rent);
    if (sort === 'leaseEnd') out.sort((a, b) => a.leaseEnd.localeCompare(b.leaseEnd));
    return out;
  }, [tenants, tab, search, sort, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selected = selectedId ? tenants.find((t) => t.id === selectedId) ?? null : null;

  const overdueSum = useMemo(
    () => tenants.filter((t) => t.paymentStatus === 'Overdue').reduce((s, t) => s + t.rent, 0),
    [tenants]
  );

  const startEdit = (t: Tenant) => {
    setSelectedId(t.id);
    setDraft({ name: t.name, email: t.email, phone: t.phone, rent: t.rent, status: t.status });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selectedId) return;
    setTenants((list) => list.map((t) => (t.id === selectedId ? { ...t, ...draft } : t)));
    setEditing(false);
  };

  const remove = (t: Tenant) => {
    if (!window.confirm(`Delete tenant ${t.name}?`)) return;
    setTenants((list) => list.filter((x) => x.id !== t.id));
    if (selectedId === t.id) {
      setSelectedId(null);
      setEditing(false);
    }
  };

  const onAction = (a: TenantAction, t: Tenant) => {
    if (a === 'view') {
      setSelectedId(t.id);
      setEditing(false);
    } else if (a === 'edit') {
      startEdit(t);
    } else if (a === 'lease') {
      onNavigate('Leases');
    } else if (a === 'payments') {
      onNavigate('Payments');
    } else {
      remove(t);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TenantStats
        total={tenants.length}
        active={counts.Active}
        expiring={counts.Expiring}
        overdue={counts.Overdue}
        overdueAmount={formatMoney(overdueSum)}
      />

      <TenantFilters
        tab={tab}
        counts={counts}
        search={search}
        sort={sort}
        onTab={(t) => { setTab(t); setPage(1); }}
        onSearch={(s) => { setSearch(s); setPage(1); }}
        onSort={(s) => { setSort(s); setPage(1); }}
      />

      <div className="row">
        <div><strong>Tenants</strong> <span className="small muted">({filtered.length} tenants)</span></div>
      </div>

      {rows.length === 0 ? (
        <Card><p className="muted">No tenants match your filters.</p></Card>
      ) : (
        <TenantTable rows={rows} onSelect={(t) => { setSelectedId(t.id); setEditing(false); }} onAction={onAction} />
      )}

      <TenantPagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />

      {selected && (
        <Card>
          {!editing ? (
            <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="tenant-cell">
                <TenantAvatar name={selected.name} />
                <div>
                  <strong>{selected.name}</strong>
                  <div className="small muted">{selected.email} · {selected.phone}</div>
                  <div className="small muted">
                    {propertyName(selected.propertyId)} ({propertyCity(selected.propertyId)}) · Unit {selected.unit} · {selected.beds}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <Badge tone={tenantTone(selected.status)}>{selected.status}</Badge>
                <Badge tone={leaseTone(selected.leaseStatus)}>Lease {fmtDate(selected.leaseEnd)}</Badge>
                <Badge tone={paymentTone(selected.paymentStatus)}>{selected.paymentStatus}</Badge>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(selected)}>Edit</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelectedId(null)}>Close</button>
              </div>
            </div>
          ) : (
            <div>
              <strong>Edit Tenant</strong>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field"><label htmlFor="tn-name">Full name</label><input id="tn-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div className="field"><label htmlFor="tn-email">Email</label><input id="tn-email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
                <div className="field"><label htmlFor="tn-phone">Phone</label><input id="tn-phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
                <div className="field"><label htmlFor="tn-rent">Monthly rent</label><input id="tn-rent" type="number" value={draft.rent} onChange={(e) => setDraft({ ...draft, rent: Number(e.target.value) })} /></div>
                <div className="field">
                  <label htmlFor="tn-status">Status</label>
                  <select id="tn-status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Tenant['status'] })}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn btn-teal" type="button" onClick={saveEdit}>Save changes</button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
