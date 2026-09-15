import { useEffect, useState } from 'react';
import { formatMoney, propertyName, tenantName } from '../../data/mock';
import type { MaintenanceRequest } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import { fmtMDate, priorityTone, statusTone } from './maintenanceUtils';

export default function MaintenanceTable({
  rows,
  onSelect,
}: {
  rows: MaintenanceRequest[];
  onSelect: (m: MaintenanceRequest) => void;
}) {
  const [visible, setVisible] = useState(20);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId]);

  // When filters change, clamping keeps the visible window valid without an effect.
  const shown = rows.slice(0, Math.max(visible, 20));

  return (
    <Card className="table-card">
      <div className="row table-head-row"><strong>Requests</strong><span className="small muted">({rows.length})</span></div>
      <div className="table-wrap table-flush">
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Property / Unit</th>
              <th className="hide-tablet">Tenant</th>
              <th>Priority</th>
              <th className="hide-tablet">Assigned To</th>
              <th className="hide-tablet">Created</th>
              <th>Status</th>
              <th>Cost</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="clickable" onClick={() => onSelect(m)}>
                <td><strong>{m.title}</strong><div className="small muted">{m.category} · {m.id}</div></td>
                <td>{propertyName(m.propertyId)}<div className="small muted">Unit {m.unit}</div></td>
                <td className="hide-tablet small">{m.tenantId ? tenantName(m.tenantId) : '—'}</td>
                <td><Badge tone={priorityTone(m.priority)}>{m.priority}</Badge></td>
                <td className="hide-tablet small">{m.assignee}</td>
                <td className="hide-tablet small">{fmtMDate(m.reported)}</td>
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

      <div className="tenant-cards">
        {shown.map((m) => (
          <div key={m.id} className="tenant-card clickable" onClick={() => onSelect(m)}>
            <div className="row">
              <div><strong>{m.title}</strong><div className="small muted">{propertyName(m.propertyId)} · Unit {m.unit}</div></div>
              <Badge tone={priorityTone(m.priority)}>{m.priority}</Badge>
            </div>
            <div className="row small" style={{ marginTop: 8 }}>
              <span className="muted">{m.assignee} · {fmtMDate(m.reported)}</span>
              <Badge tone={statusTone(m.status)}>{m.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      {visible < rows.length ? (
        <div style={{ padding: 12, textAlign: 'center' }}>
          <button className="btn btn-ghost" type="button" onClick={() => setVisible((v) => v + 20)}>
            Show more ({rows.length - visible} remaining)
          </button>
        </div>
      ) : null}
    </Card>
  );
}
