import { useEffect, useState } from 'react';
import { propertyName, tenantName } from '../../data/mock';
import type { DocFile } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import { docStatusTone, fmtDocDate } from './documentUtils';

export type DocAction = 'view' | 'download' | 'edit' | 'move' | 'archive' | 'delete';

export default function DocumentTable({
  rows,
  onAction,
}: {
  rows: DocFile[];
  onAction: (a: DocAction, d: DocFile) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId]);

  const act = (a: DocAction, d: DocFile) => {
    setOpenId(null);
    onAction(a, d);
  };

  return (
    <Card className="table-card">
      <div className="row table-head-row"><strong>Documents</strong><span className="small muted">({rows.length})</span></div>
      <div className="table-wrap table-flush">
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Property</th>
              <th className="hide-tablet">Unit / Tenant</th>
              <th>Type</th>
              <th className="hide-tablet">Uploaded</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="clickable" onClick={() => act('view', d)}>
                <td><strong>{d.name}</strong><div className="small muted">{d.size}</div></td>
                <td>{propertyName(d.propertyId)}</td>
                <td className="hide-tablet">
                  {d.unit ? <div>Unit {d.unit}</div> : <div className="muted">—</div>}
                  {d.tenantId ? <div className="small muted">{tenantName(d.tenantId)}</div> : null}
                </td>
                <td><Badge tone="neutral">{d.type}</Badge></td>
                <td className="hide-tablet small">{fmtDocDate(d.uploadDate)}</td>
                <td><Badge tone={docStatusTone(d.status)}>{d.status}</Badge></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="row-menu-wrap">
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm"
                      aria-label={`Actions for ${d.name}`}
                      aria-haspopup="menu"
                      aria-expanded={openId === d.id}
                      onClick={() => setOpenId((id) => (id === d.id ? null : d.id))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </button>
                    {openId === d.id && (
                      <div className="row-menu" role="menu">
                        {(
                          [
                            ['view', 'View'],
                            ['download', 'Download'],
                            ['edit', 'Edit Details'],
                            ['move', 'Move / Assign'],
                            ['archive', 'Archive'],
                            ['delete', 'Delete'],
                          ] as [DocAction, string][]
                        ).map(([a, label]) => (
                          <button
                            key={a}
                            type="button"
                            role="menuitem"
                            className={`row-menu-item ${a === 'delete' ? 'danger' : ''}`}
                            onClick={() => act(a, d)}
                          >
                            {label}
                          </button>
                        ))}
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
        {rows.map((d) => (
          <div key={d.id} className="tenant-card clickable" onClick={() => act('view', d)}>
            <div className="row">
              <div><strong>{d.name}</strong><div className="small muted">{propertyName(d.propertyId)}{d.unit ? ` · Unit ${d.unit}` : ''}</div></div>
              <Badge tone={docStatusTone(d.status)}>{d.status}</Badge>
            </div>
            <div className="row small" style={{ marginTop: 8 }}>
              <Badge tone="neutral">{d.type}</Badge>
              <span className="muted">{fmtDocDate(d.uploadDate)}</span>
            </div>
            <div className="row" style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
              <span className="small muted">{d.tenantId ? tenantName(d.tenantId) : 'No tenant'}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => act('download', d)}>Download</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => act('edit', d)}>Edit</button>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
