import { useEffect, useState } from 'react';
import { propertyCity, propertyName } from '../../data/mock';
import type { Property, Tenant } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import MobileRowCard from '../../components/MobileRowCard';
import TenantRow, { TenantAvatar } from './TenantRow';
import { fmtDate } from '../../lib/format';
import { leaseTone, paymentTone, tenantTone } from './tenantUtils';
import type { TenantAction, TenantSort } from './tenantUtils';
import SortableTh from '../../components/SortableTh';
import type { SortState } from '../../lib/sort';

export default function TenantTable({
  rows,
  properties,
  sort,
  onSort,
  onSelect,
  onAction,
}: {
  rows: Tenant[];
  properties: Property[];
  sort: SortState<TenantSort>;
  onSort: (key: TenantSort) => void;
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
              <SortableTh label="Tenant" sortKey="name" sort={sort} onSort={onSort} />
              <SortableTh label="Property" sortKey="property" sort={sort} onSort={onSort} />
              <SortableTh label="Unit" sortKey="unit" sort={sort} onSort={onSort} className="max-compact:hidden" />
              <SortableTh label="Monthly Rent" sortKey="rent" sort={sort} onSort={onSort} />
              <SortableTh label="Lease" sortKey="leaseEnd" sort={sort} onSort={onSort} className="max-compact:hidden" />
              <SortableTh label="Payment" sortKey="payment" sort={sort} onSort={onSort} />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={onSort} />
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <TenantRow
                key={t.id}
                tenant={t}
                properties={properties}
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
          <MobileRowCard key={t.id} onSelect={() => onSelect(t)}>
            <div className="row">
              <div className="flex items-center gap-2.5">
                <TenantAvatar name={t.name} />
                <div><strong>{t.name}</strong><div className="small muted">{t.email}</div></div>
              </div>
              <Badge tone={tenantTone(t.status)}>{t.status}</Badge>
            </div>
            <div className="row small mt-2">
              <span>{propertyName(t.propertyId, properties)} · Unit {t.unit}</span>
              <strong>${t.rent.toLocaleString('en-US')}<span className="muted">/mo</span></strong>
            </div>
            <div className="row small mt-1.5">
              <span className="muted">{propertyCity(t.propertyId, properties)} · Lease {fmtDate(t.leaseEnd)}</span>
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
          </MobileRowCard>
        ))}
      </div>
    </Card>
  );
}
