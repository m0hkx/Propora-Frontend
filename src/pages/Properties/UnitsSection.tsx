import { useMemo, useState } from 'react';
import { formatMoney } from '../../data/mock';
import type { Unit, UnitStatus } from '../../data/mock';
import { getUnitBlockers, resolveUnitStatus, unitsForProperty } from '../../lib/units';
import { useStore } from '../../state/useStore';
import { Badge } from '../../components/ui';
import SortableTh from '../../components/SortableTh';
import { byNumber, byRank, byText, nextSort, sortRows } from '../../lib/sort';
import type { SortState } from '../../lib/sort';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import UnitFormModal from './UnitFormModal';

type SortKey = 'name' | 'floor' | 'type' | 'rent' | 'status';

/** Occupancy order for the status column. */
const UNIT_STATUS_ORDER = ['Occupied', 'Vacant', 'Maintenance'] as const satisfies readonly UnitStatus[];

function statusTone(s: UnitStatus): 'success' | 'info' | 'warn' {
  return s === 'Occupied' ? 'success' : s === 'Maintenance' ? 'warn' : 'info';
}

function spec(u: Unit): string {
  const parts = [`${u.bedrooms} bd`, `${u.bathrooms} ba`];
  if (u.size !== undefined) parts.push(`${u.size} sqm`);
  return parts.join(' · ');
}

export default function UnitsSection({ propertyId }: { propertyId: string }) {
  const units = useStore((s) => s.units);
  const tenants = useStore((s) => s.tenants);
  const leases = useStore((s) => s.leases);
  const maintenance = useStore((s) => s.maintenance);
  const deleteUnit = useStore((s) => s.deleteUnit);
  const pushToast = useStore((s) => s.pushToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'name', dir: 'asc' });
  const onSort = (key: SortKey) => setSort((cur) => nextSort(cur, key));

  const all = unitsForProperty(units, propertyId);
  // Unit labels sort naturally ("A-2" before "A-10"); a unit with no floor
  // recorded sorts last either way. Status uses the live (lease-derived) value
  // shown in the cell, not the stored one.
  const rows = useMemo(
    () =>
      sortRows(all, sort, {
        name: byText((u) => u.name),
        floor: byNumber((u) => u.floor),
        type: byText((u) => u.type),
        rent: byNumber((u) => u.rent),
        status: byRank((u) => resolveUnitStatus(u, tenants, leases), UNIT_STATUS_ORDER),
      }),
    [all, sort, tenants, leases]
  );
  const editing = editId ? units.find((u) => u.id === editId) ?? null : null;
  const deleting = deleteId ? units.find((u) => u.id === deleteId) ?? null : null;
  const blockers = deleting ? getUnitBlockers(deleting, tenants, leases, maintenance) : [];

  const confirmDelete = () => {
    if (!deleting) return;
    deleteUnit(deleting.id);
    setDeleteId(null);
    pushToast(`Deleted unit ${deleting.name}`);
  };

  return (
    <div className="modal-section">
      <div className="row">
        <h4 className="m-0 text-muted-foreground uppercase tracking-[0.5px] text-xs">
          Units · {rows.length}
        </h4>
        <button className="btn btn-teal btn-sm" type="button" onClick={() => setFormOpen(true)}>
          + Add Unit
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="row flex-wrap">
          <p className="muted m-0">No units have been added yet.</p>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setFormOpen(true)}>
            Add Unit
          </button>
        </div>
      ) : (
        <div className="table-wrap table-flush">
          <table className="tenant-table">
            <thead>
              <tr>
                <SortableTh label="Unit" sortKey="name" sort={sort} onSort={onSort} />
                <SortableTh label="Floor" sortKey="floor" sort={sort} onSort={onSort} />
                <SortableTh label="Type" sortKey="type" sort={sort} onSort={onSort} />
                <SortableTh label="Rent" sortKey="rent" sort={sort} onSort={onSort} />
                <SortableTh label="Status" sortKey="status" sort={sort} onSort={onSort} />
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const live = resolveUnitStatus(u, tenants, leases);
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div className="small muted">{spec(u)}</div>
                    </td>
                    <td>{u.floor !== undefined ? u.floor : '—'}</td>
                    <td>{u.type}</td>
                    <td><strong>{formatMoney(u.rent)}</strong> <span className="small muted">/mo</span></td>
                    <td><Badge tone={statusTone(live)}>{live}</Badge></td>
                    <td>
                      <span className="flex gap-1.5 justify-end">
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditId(u.id)}>
                          Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDeleteId(u.id)}>
                          Delete
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <UnitFormModal propertyId={propertyId} onClose={() => setFormOpen(false)} />
      )}

      {editing && (
        <UnitFormModal propertyId={propertyId} unit={editing} onClose={() => setEditId(null)} />
      )}

      {deleting && blockers.length > 0 && (
        <Modal title={`Cannot delete unit ${deleting.name}`} onClose={() => setDeleteId(null)}>
          <p className="m-0">This unit still has dependent records. Resolve these first:</p>
          <div className="list mt-0">
            {blockers.map((b) => (
              <div key={b} className="list-row"><span>{b}</span></div>
            ))}
          </div>
          <div className="modal-foot">
            <button className="btn btn-teal" type="button" onClick={() => setDeleteId(null)}>
              Understood
            </button>
          </div>
        </Modal>
      )}

      {deleting && blockers.length === 0 && (
        <ConfirmDialog
          title="Delete Unit"
          message={`Delete unit ${deleting.name}? Only the unit record is removed — tenants, leases and history stay in the system.`}
          confirmLabel="Delete Unit"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
