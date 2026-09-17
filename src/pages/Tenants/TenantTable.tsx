import { useEffect, useState } from 'react';
import { propertyCity, propertyName } from '../../data/mock';
import type { Tenant } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import TenantRow, { TenantAvatar } from './TenantRow';
import { fmtDate } from '../../lib/format';
import { leaseTone, paymentTone, tenantTone } from './tenantUtils';
import type { TenantAction } from './tenantUtils';

export default function TenantTable({
  rows,
  onSelect,
  onAction,
}: {
  rows: Tenant[];
  onSelect: (t: Tenant) => void;
  onAction: (a: TenantAction, t: Tenant) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!openId) return;
    const close = () => setOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId ]);

  const act = (a: TenantAction, t: Tenant) => {
    setOpenId(null);
    onAction(a, t);
  };

  return (
    <Card className="table-card">
      <div className="table-wrap table-flush max-md:hidden">
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Property</th>
              <th className="max-compact:hidden">Unit</th>
              <th>Monthly Rent</th>
              <th className="max-compact:hidden">Lease</th>
              <th>Payment</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <TenantRow
                key={t.id}
                tenant={t}
                menuOpen={openId === t.id}
                onToggleMenu={() => setOpenId((id) => (id === t.id ? null : t.id))}
                onAction={act}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="hidden max-md:flex flex-col gap-2.5 p-2">
        {rows.map((t) => (
          <div key={t.id} className="rounded-xl border border-[#F1F5F9] bg-white p-3 cursor-pointer" onClick={() => onSelect(t)}>
            <div className="row">
              <div className="flex items-center gap-2.5">
                <TenantAvatar name={t.name} />
                <div><strong>{t.name}</strong><div className="small muted">{t.email}</div></div>
              </div>
              <Badge tone={tenantTone(t.status)}>{t.status}</Badge>
            </div>
            <div className="row small mt-2">
              <span>{propertyName(t.propertyId)} · Unit {t.unit}</span>
              <strong>${t.rent.toLocaleString('en-US')}<span className="muted">/mo</span></strong>
            </div>
            <div className="row small mt-1.5">
              <span className="muted">{propertyCity(t.propertyId)} · Lease {fmtDate(t.leaseEnd)}</span>
              <span className="flex gap-1.5">
                <Badge tone={leaseTone(t.leaseStatus)}>{t.leaseStatus}</Badge>
                <Badge tone={paymentTone(t.paymentStatus)}>{t.paymentStatus}</Badge>
              </span>
            </div>
            <div className="row mt-2" onClick={(e) => e.stopPropagation()}>
              <span className="small muted">{t.phone}</span>
              <span className="flex gap-1.5">
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => onAction('view', t)}>View</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => onAction('edit', t)}>Edit</button>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
