import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { fmtDate } from '../../lib/format';
import type { MaintenanceRequest, Payment, Tenant } from '../../types';

interface ActionRequiredModalProps {
  overdue: Payment[];
  expiring: Tenant[];
  openMaintenance: MaintenanceRequest[];
  tenants: Tenant[];
  onClose: () => void;
}

interface SectionProps {
  title: string;
  empty: string;
  to: string;
  items: { id: string; label: string }[];
  total: number;
  onReview: (to: string) => void;
}

function Section({ title, empty, to, items, total, onReview }: SectionProps) {
  return (
    <div className="modal-section">
      <h4>{title} ({total})</h4>
      {total === 0 ? <p className="small muted m-0">{empty}</p> : (
        <div className="list">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="list-row">
              <span>{item.label}</span>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => onReview(to)}>Review →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActionRequiredModal({ overdue, expiring, openMaintenance, tenants, onClose }: ActionRequiredModalProps) {
  const navigate = useNavigate();
  const review = (to: string) => {
    onClose();
    navigate(to);
  };
  const tenantOf = (id: string) => tenants.find((t) => t.id === id)?.name ?? id;

  return (
    <Modal title="Action Required" onClose={onClose} wide>
      <Section
        title="Overdue Payments" empty="Nothing overdue." to="/payments" onReview={review} total={overdue.length}
        items={overdue.map((p) => ({ id: p.id, label: `${tenantOf(p.tenantId)} · $${p.amount.toLocaleString('en-US')}` }))}
      />
      <Section
        title="Leases Expiring Soon" empty="No upcoming expirations." to="/leases" onReview={review} total={expiring.length}
        items={expiring.map((t) => ({ id: t.id, label: `${t.name} · ends ${fmtDate(t.leaseEnd)}` }))}
      />
      <Section
        title="Open Maintenance" empty="Queue is clear." to="/maintenance" onReview={review} total={openMaintenance.length}
        items={openMaintenance.map((m) => ({ id: m.id, label: m.title }))}
      />
    </Modal>
  );
}
