import { useEffect, useMemo, useState } from 'react';
import { formatMoney, propertyName, staffName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStaff, Tenant, Unit } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import RowMenu from '../../components/RowMenu';
import MobileRowCard from '../../components/MobileRowCard';
import Pagination from '../../components/Pagination';
import SortableTh from '../../components/SortableTh';
import { fmtDate } from '../../lib/format';
import { onActivateKey } from '../../lib/a11y';
import { byDate, byNumber, byRank, byText, nextSort, sortRows } from '../../lib/sort';
import type { SortState } from '../../lib/sort';
import { MAINTENANCE_PRIORITY_ORDER, MAINTENANCE_STATUS_ORDER, priorityTone, scopeLabel, statusTone, tenantsLabel } from './maintenanceUtils';

type SortKey = 'title' | 'property' | 'tenant' | 'priority' | 'assignee' | 'created' | 'status' | 'cost';

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: 'created', dir: 'desc' });

  // Reset to page 1 whenever the filtered result set itself changes (not on every
  // render) — adjusting state during render, per React's guidance, instead of an effect.
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setPage(1);
  }

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const shown = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
              <tr
                key={m.id}
                className="cursor-pointer"
                onClick={() => onSelect(m)}
                role="button"
                tabIndex={0}
                onKeyDown={onActivateKey(() => onSelect(m))}
              >
                <td><strong>{m.title}</strong><div className="small muted">{m.category} · {m.id}</div></td>
                <td>{propertyName(m.propertyId)}<div className="small muted">{scopeLabel(m, units)}</div></td>
                <td className="max-compact:hidden small">{tenantsLabel(m, tenants)}</td>
                <td><Badge tone={priorityTone(m.priority)}>{m.priority}</Badge></td>
                <td className="max-compact:hidden small">{staffName(m.assigneeId, staff)}</td>
                <td className="max-compact:hidden small">{fmtDate(m.reported, { year: false })}</td>
                <td><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                <td><strong>{formatMoney(m.actualCost ?? m.estimatedCost)}</strong></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    label={`Actions for ${m.title}`}
                    open={openId === m.id}
                    onToggle={() => setOpenId((id) => (id === m.id ? null : m.id))}
                    actions={[{ key: 'view', label: 'View Details', onClick: () => { setOpenId(null); onSelect(m); } }]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden max-md:flex flex-col gap-2.5 p-2">
        {shown.map((m) => (
          <MobileRowCard key={m.id} onSelect={() => onSelect(m)}>
            <div className="row">
              <div><strong>{m.title}</strong><div className="small muted">{propertyName(m.propertyId)} · {scopeLabel(m, units)}</div></div>
              <Badge tone={priorityTone(m.priority)}>{m.priority}</Badge>
            </div>
            <div className="row small mt-2">
              <span className="muted">{staffName(m.assigneeId, staff)} · {fmtDate(m.reported, { year: false })}</span>
              <Badge tone={statusTone(m.status)}>{m.status}</Badge>
            </div>
          </MobileRowCard>
        ))}
      </div>

      {sorted.length > 0 ? (
        <Pagination page={safePage} totalPages={totalPages} total={sorted.length} pageSize={PAGE_SIZE} onPage={setPage} itemLabel="requests" />
      ) : null}
    </Card>
  );
}
