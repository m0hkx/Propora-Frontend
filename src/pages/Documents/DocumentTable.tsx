import { useEffect, useState } from 'react';
import { propertyName, tenantName } from '../../data/mock';
import type { DocFile } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { docStatusTone } from './documentUtils';

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
      <div className="table-wrap table-flush max-md:hidden">
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Property</th>
              <th className="max-compact:hidden">Unit / Tenant</th>
              <th>Type</th>
              <th className="max-compact:hidden">Uploaded</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="cursor-pointer" onClick={() => act('view', d)}>
                <td><strong>{d.name}</strong><div className="small muted">{d.size}</div></td>
                <td>{propertyName(d.propertyId)}</td>
                <td className="max-compact:hidden">
                  {d.unit ? <div>Unit {d.unit}</div> : <div className="muted">—</div>}
                  {d.tenantId ? <div className="small muted">{tenantName(d.tenantId)}</div> : null}
                </td>
                <td><Badge tone="neutral">{d.type}</Badge></td>
                <td className="max-compact:hidden small">{fmtDate(d.uploadDate)}</td>
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

      <div className="hidden max-md:flex flex-col gap-2.5 p-2">
        {rows.map((d) => (
          <div key={d.id} className="rounded-xl border border-[#F1F5F9] bg-white p-3 cursor-pointer" onClick={() => act('view', d)}>
            <div className="row">
              <div><strong>{d.name}</strong><div className="small muted">{propertyName(d.propertyId)}{d.unit ? ` · Unit ${d.unit}` : ''}</div></div>
              <Badge tone={docStatusTone(d.status)}>{d.status}</Badge>
            </div>
            <div className="row small mt-2">
              <Badge tone="neutral">{d.type}</Badge>
              <span className="muted">{fmtDate(d.uploadDate)}</span>
            </div>
            <div className="row mt-2" onClick={(e) => e.stopPropagation()}>
              <span className="small muted">{d.tenantId ? tenantName(d.tenantId) : 'No tenant'}</span>
              <span className="flex gap-1.5">
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
