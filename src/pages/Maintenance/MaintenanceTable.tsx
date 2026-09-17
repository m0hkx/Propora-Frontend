import { useEffect, useState } from 'react';
import { formatMoney, propertyName, tenantName } from '../../data/mock';
import type { MaintenanceRequest } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { priorityTone, statusTone } from './maintenanceUtils';

type SortKey = 'title' | 'created' | 'priority' | 'cost';

const PRIORITY_RANK: Record<MaintenanceRequest['priority'], number> = {
  Urgent: 0, High: 1, Medium: 2, Low: 3,
};

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={className} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="th-sort" onClick={() => onSort(sortKey)} aria-label={`Sort by ${label}`}>
        {label} <span aria-hidden="true">{active ? (dir === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );
}

export default function MaintenanceTable({
  rows,
  onSelect,
}: {
  rows: MaintenanceRequest[];
  onSelect: (m: MaintenanceRequest) => void;
}) {
  const [visible, setVisible] = useState(20);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir(k === 'title' ? 'asc' : 'desc');
    }
  };

  const sorted = [...rows].sort((a, b) => {
    let cmp: number;
    if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortKey === 'created') cmp = a.reported.localeCompare(b.reported);
    else if (sortKey === 'priority') cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    else cmp = (a.actualCost ?? a.estimatedCost) - (b.actualCost ?? b.estimatedCost);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // When filters change, clamping keeps the visible window valid without an effect.
  const shown = sorted.slice(0, Math.max(visible, 20));

  return (
    <Card className="table-card">
      <div className="row table-head-row"><strong>Requests</strong><span className="small muted">({rows.length})</span></div>
      <div className="table-wrap table-flush max-md:hidden">
        <table className="tenant-table">
          <thead>
            <tr>
              <SortHeader label="Request" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <th>Property / Unit</th>
              <th className="max-compact:hidden">Tenant</th>
              <SortHeader label="Priority" sortKey="priority" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <th className="max-compact:hidden">Assigned To</th>
              <SortHeader label="Created" sortKey="created" activeKey={sortKey} dir={sortDir} onSort={onSort} className="max-compact:hidden" />
              <th>Status</th>
              <SortHeader label="Cost" sortKey="cost" activeKey={sortKey} dir={sortDir} onSort={onSort} />
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="cursor-pointer" onClick={() => onSelect(m)}>
                <td><strong>{m.title}</strong><div className="small muted">{m.category} · {m.id}</div></td>
                <td>{propertyName(m.propertyId)}<div className="small muted">Unit {m.unit}</div></td>
                <td className="max-compact:hidden small">{m.tenantId ? tenantName(m.tenantId) : '—'}</td>
                <td><Badge tone={priorityTone(m.priority)}>{m.priority}</Badge></td>
                <td className="max-compact:hidden small">{m.assignee}</td>
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
              <div><strong>{m.title}</strong><div className="small muted">{propertyName(m.propertyId)} · Unit {m.unit}</div></div>
              <Badge tone={priorityTone(m.priority)}>{m.priority}</Badge>
            </div>
            <div className="row small mt-2">
              <span className="muted">{m.assignee} · {fmtDate(m.reported, { year: false })}</span>
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
