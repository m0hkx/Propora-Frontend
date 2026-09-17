import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney, propertyName } from '../../data/mock';
import type { Tenant } from '../../data/mock';
import { Card } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useStore } from '../../state/useStore';
import TenantStats from './TenantStats';
import TenantFilters from './TenantFilters';
import TenantTable from './TenantTable';
import TenantPagination from './TenantPagination';
import TenantDetailsModal from './TenantDetailsModal';
import TenantFormModal from './TenantFormModal';
import type { TenantDraft } from './TenantFormModal';
import { matchesTab } from './tenantUtils';
import type { TenantAction, TenantSort, TenantTab } from './tenantUtils';
import { PAYMENT_STATUS_ORDER, TENANT_STATUS_ORDER } from './tenantUtils';
import { byDate, byNumber, byRank, byText, nextSort, sortRows } from '../../lib/sort';
import type { SortState } from '../../lib/sort';

const PAGE_SIZE = 10;

export default function Tenants({
  query,
}: {
  query: string;
}) {
  const navigate = useNavigate();
  const updateTenant = useStore((s) => s.updateTenant);
  const deleteTenant = useStore((s) => s.deleteTenant);
  const pushToast = useStore((s) => s.pushToast);
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);
  const units = useStore((s) => s.units);
  const [tab, setTab] = useState<TenantTab>('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<TenantSort>>({ key: 'featured', dir: 'asc' });
  const [page, setPage] = useState(1);
  // Selected tenant id mirrors the /tenants/:id detail route (modal for now).
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    const out = tenants.filter((t) => {
      if (!matchesTab(t, tab)) return false;
      if (
        q &&
        !(t.name + ' ' + t.email + ' ' + t.phone + ' ' + propertyName(t.propertyId, properties) + ' ' + t.unit).toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    // Sorted here, over the whole filtered set, so pagination slices an
    // already-ordered list rather than reordering one page.
    return sortRows(out, sort, {
      name: byText((t) => t.name),
      property: byText((t) => propertyName(t.propertyId, properties)),
      unit: byText((t) => t.unit),
      rent: byNumber((t) => t.rent),
      leaseEnd: byDate((t) => t.leaseEnd),
      payment: byRank((t) => t.paymentStatus, PAYMENT_STATUS_ORDER),
      status: byRank((t) => t.status, TENANT_STATUS_ORDER),
    });
  }, [tenants, properties, tab, search, sort, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const overdueSum = useMemo(
    () => tenants.filter((t) => t.paymentStatus === 'Overdue').reduce((s, t) => s + t.rent, 0),
    [tenants]
  );

  const viewed = viewId ? tenants.find((t) => t.id === viewId) ?? null : null;
  const edited = editId ? tenants.find((t) => t.id === editId) ?? null : null;
  const deleted = deleteId ? tenants.find((t) => t.id === deleteId) ?? null : null;

  const saveEdit = (id: string, draft: TenantDraft) => {
    updateTenant(id, { ...draft });
    setEditId(null);
    pushToast(`Saved changes for ${draft.name}`);
  };

  const confirmDelete = () => {
    if (!deleted) return;
    deleteTenant(deleted.id);
    setDeleteId(null);
    if (viewId === deleted.id) setViewId(null);
    pushToast(`Deleted tenant ${deleted.name}`);
  };

  const onAction = (a: TenantAction, t: Tenant) => {
    if (a === 'view') setViewId(t.id);
    else if (a === 'edit') setEditId(t.id);
    else if (a === 'lease') navigate(`/leases?tenantId=${t.id}`);
    else if (a === 'payments') navigate(`/payments?tenantId=${t.id}`);
    else setDeleteId(t.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <TenantStats
        total={tenants.length}
        active={counts.Active}
        expiring={counts.Expiring}
        overdue={counts.Overdue}
        overdueAmount={formatMoney(overdueSum)}
        tenants={tenants}
        properties={properties}
      />

      <TenantFilters
        tab={tab}
        counts={counts}
        search={search}
        sort={sort}
        onTab={(t) => { setTab(t); setPage(1); }}
        onSearch={(s) => { setSearch(s); setPage(1); }}
        onSort={(key) => { setSort({ key, dir: 'asc' }); setPage(1); }}
      />

      <div className="row">
        <div><strong>Tenants</strong> <span className="small muted">({filtered.length} tenants)</span></div>
      </div>

      {rows.length === 0 ? (
        <Card><p className="muted">No tenants match your filters.</p></Card>
      ) : (
        <TenantTable
          rows={rows}
          properties={properties}
          sort={sort}
          onSort={(key) => { setSort((cur) => nextSort(cur, key)); setPage(1); }}
          onSelect={(t) => setViewId(t.id)}
          onAction={onAction}
        />
      )}

      <TenantPagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />

      {viewed && (
        <TenantDetailsModal
          tenant={viewed}
          properties={properties}
          onClose={() => setViewId(null)}
          onEdit={() => { setViewId(null); setEditId(viewed.id); }}
          onViewLease={() => { setViewId(null); navigate(`/leases?tenantId=${viewed.id}`); }}
          onViewPayments={() => { setViewId(null); navigate(`/payments?tenantId=${viewed.id}`); }}
        />
      )}

      {edited && (
        <TenantFormModal
          title={`Edit Tenant — ${edited.name}`}
          initial={{
            name: edited.name, email: edited.email, phone: edited.phone,
            propertyId: edited.propertyId, unit: edited.unit, unitId: edited.unitId, beds: edited.beds,
            rent: edited.rent, leaseStart: edited.leaseStart, leaseEnd: edited.leaseEnd,
            status: edited.status,
          }}
          properties={properties}
          units={units}
          onClose={() => setEditId(null)}
          onSubmit={(d) => saveEdit(edited.id, d)}
        />
      )}

      {deleted && (
        <ConfirmDialog
          title="Delete Tenant"
          message={`Delete tenant ${deleted.name}? Their leases and payment records stay in the system for bookkeeping.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
