import { propertyCity, propertyName } from '../../data/mock';
import type { Tenant } from '../../data/mock';
import { Badge } from '../../components/ui';
import Modal from '../../components/Modal';
import { TenantAvatar } from './TenantRow';
import { fmtDate, leaseTone, paymentTone, tenantTone } from './tenantUtils';

export default function TenantDetailsModal({
  tenant,
  onClose,
  onEdit,
  onViewLease,
  onViewPayments,
}: {
  tenant: Tenant;
  onClose: () => void;
  onEdit: () => void;
  onViewLease: () => void;
  onViewPayments: () => void;
}) {
  return (
    <Modal title={tenant.name} onClose={onClose}>
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="tenant-cell">
          <TenantAvatar name={tenant.name} />
          <div>
            <div className="small muted">{tenant.email} · {tenant.phone}</div>
            <div className="small muted">
              {propertyName(tenant.propertyId)} ({propertyCity(tenant.propertyId)}) · Unit {tenant.unit} · {tenant.beds}
            </div>
          </div>
        </div>
        <Badge tone={tenantTone(tenant.status)}>{tenant.status}</Badge>
      </div>
      <div className="list">
        <div className="list-item"><span>Monthly rent</span><strong>${tenant.rent.toLocaleString('en-US')}</strong></div>
        <div className="list-item">
          <span>Lease</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Badge tone={leaseTone(tenant.leaseStatus)}>{tenant.leaseStatus}</Badge>
            <strong className="small">{fmtDate(tenant.leaseStart)} → {fmtDate(tenant.leaseEnd)}</strong>
          </span>
        </div>
        <div className="list-item">
          <span>Payment</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Badge tone={paymentTone(tenant.paymentStatus)}>{tenant.paymentStatus}</Badge>
            <strong className="small">{tenant.paymentDate}</strong>
          </span>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onViewLease}>View Lease</button>
        <button className="btn btn-ghost" type="button" onClick={onViewPayments}>View Payments</button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-teal" type="button" onClick={onEdit}>Edit</button>
      </div>
    </Modal>
  );
}
