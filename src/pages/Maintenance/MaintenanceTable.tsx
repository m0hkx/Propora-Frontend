import { useEffect, useMemo, useState } from 'react';
import { formatMoney, propertyName, staffName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStaff, Tenant, Unit } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import SortableTh from '../../components/SortableTh';
import { fmtDate } from '../../lib/format';
import { byDate, byNumber, byRank, byText, nextSort, sortRows } from '../../lib/sort';
import type { SortState } from '../../lib/sort';
import { MAINTENANCE_PRIORITY_ORDER, MAINTENANCE_STATUS_ORDER, priorityTone, scopeLabel, statusTone, tenantsLabel } from './maintenanceUtils';

type SortKey = 'title' | 'property' | 'tenant' | 'priority' | 'assignee' | 'created' | 'status' | 'cost';

export default function MaintenanceTable({
  rows,
  units,
  tenants,
  staff,
  onSelect,
}: {
  rows: MaintenanceRequest[];
  units: Unit[];
  tenants: Tenant[];
  staff: MaintenanceStaff[];
  onSelect: (m: MaintenanceRequest) => void;
}) {
  const [visible, setVisible] = useState(20);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'created', dir: 'desc' });

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId]);

  const onSort = (k: SortKey) => setSort((cur) => nextSort(cur, k));

  // Cost sorts on the raw number behind the formatted cell, dates chronologically,
  // priority/status by their domain order.
  const sorted = useMemo(
    () =>
      sortRows(rows, sort, {
        title: byText((m) => m.title),
        property: byText((m) => propertyName(m.propertyId)),
        tenant: byText((m) => {
          const label = tenantsLabel(m, tenants);
          return label === '—' ? undefined : label;
        }),
        priority: byRank((m) => m.priority, MAINTENANCE_PRIORITY_ORDER),
        assignee: byText((m) => (m.assigneeId ? staffName(m.assigneeId, staff) : undefined)),
        created: byDate((m) => m.reported),
        status: byRank((m) => m.status, MAINTENANCE_STATUS_ORDER),
        cost: byNumber((m) => m.actualCost ?? m.estimatedCost),
      }),
    [rows, sort, tenants, staff]
  );

  // When filters change, clamping keeps the visible window valid without an effect.
  const shown = sorted.slice(0, Math.max(visible, 20));

  return (
    <Card className="table-card">
      <div className="row table-head-row"><strong>Requests</strong><span className="small muted">({rows.length})</span></div>
      <div className="table-wrap table-flush max-md:hidden">
        <table className="tenant-table">
          <thead>
            <tr>
              <SortableTh label="Request" sortKey="title" sort={sort} onSort={onSort} />
              <SortableTh label="Property / Target" sortKey="property" sort={sort} onSort={onSort} />
              <SortableTh label="Tenant" sortKey="tenant" sort={sort} onSort={onSort} className="max-compact:hidden" />
              <SortableTh label="Priority" sortKey="priority" sort={sort} onSort={onSort} />
              <SortableTh label="Assigned To" sortKey="assignee" sort={sort} onSort={onSort} className="max-compact:hidden" />
              <SortableTh label="Created" sortKey="created" sort={sort} onSort={onSort} className="max-compact:hidden" />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={onSort} />
              <SortableTh label="Cost" sortKey="cost" sort={sort} onSort={onSort} />
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="cursor-pointer" onClick={() => onSelect(m)}>
                <td><strong>{m.title}</strong><div className="small muted">{m.category} · {m.id}</div></td>
                <td>{propertyName(m.propertyId)}<div className="small muted">{scopeLabel(m, units)}</div></td>
                <td className="max-compact:hidden small">{tenantsLabel(m, tenants)}</td>
                <td><Badge tone={priorityTone(m.priority)}>{m.priority}</Badge></td>
                <td className="max-compact:hidden small">{staffName(m.assigneeId, staff)}</td>
                <td className="max-compact:hidden small">{fmtDate(m.reported, { year: false })}</td>
                <td><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                <td><strong>{formatMoney(m.actualCost ?? m.estimatedCost)}</strong></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="row-menu-wrap">
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm"
                      aria-label={`Actions for ${m.title}`}
                      aria-haspopup="menu"
                      aria-expanded={openId === m.id}
                      onClick={() => setOpenId((id) => (id === m.id ? null : m.id))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </button>
                    {openId === m.id && (
                      <div className="row-menu" role="menu">
                        <button type="button" role="menuitem" className="row-menu-item" onClick={() => { setOpenId(null); onSelect(m); }}>View Details</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden max-md:flex flex-col gap-2.5 p-2">
        {shown.map((m) => (
          <div key={m.id} className="rounded-xl border border-[#F1F5F9] bg-white p-3 cursor-pointer" onClick={() => onSelect(m)}>
            <div className="row">
              <div><strong>{m.title}</strong><div className="small muted">{propertyName(m.propertyId)} · {scopeLabel(m, units)}</div></div>
              <Badge tone={priorityTone(m.priority)}>{m.priority}</Badge>
            </div>
            <div className="row small mt-2">
              <span className="muted">{staffName(m.assigneeId, staff)} · {fmtDate(m.reported, { year: false })}</span>
              <Badge tone={statusTone(m.status)}>{m.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      {visible < rows.length ? (
        <div className="p-3 text-center">
          <button className="btn btn-ghost" type="button" onClick={() => setVisible((v) => v + 20)}>
            Show more ({rows.length - visible} remaining)
          </button>
        </div>
      ) : null}
    </Card>
  );
}
