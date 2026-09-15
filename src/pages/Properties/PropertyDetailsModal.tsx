import { formatMoney } from '../../data/mock';
import type { Property } from '../../data/mock';
import { Badge, Progress } from '../../components/ui';
import Modal from '../../components/Modal';

function tone(s: Property['status']): 'success' | 'warn' | 'danger' {
  return s === 'Active' ? 'success' : s === 'Vacant' ? 'warn' : 'danger';
}

export default function PropertyDetailsModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const p = property;
  const occ = p.units === 0 ? 0 : Math.round((p.occupied / p.units) * 100);
  return (
    <Modal title={p.name} onClose={onClose} wide>
      <div className="prop-image" style={{ borderRadius: 12, background: 'linear-gradient(135deg,#0F766E,#14B8A6)' }}>
        <img src={p.imageUrl} alt={`${p.name} photo`} loading="lazy" />
        <span className="prop-initials">{p.image}</span>
        <span style={{ zIndex: 2 }}><Badge tone={tone(p.status)}>{p.status}</Badge></span>
      </div>
      <div className="small muted">{p.address} · {p.type} · Built {p.yearBuilt}</div>
      <div>
        <div className="row small"><span className="muted">Occupancy</span><strong>{occ}%</strong></div>
        <Progress value={occ} />
      </div>
      <div className="list">
        <div className="list-item"><span>Total units</span><strong>{p.units}</strong></div>
        <div className="list-item"><span>Occupied units</span><strong>{p.occupied}</strong></div>
        <div className="list-item"><span>Available units</span><strong>{p.units - p.occupied}</strong></div>
        <div className="list-item"><span>Base rent</span><strong>{formatMoney(p.rent)}/mo</strong></div>
        <div className="list-item"><span>Est. monthly revenue</span><strong>{formatMoney(p.occupied * p.rent)}</strong></div>
      </div>
    </Modal>
  );
}
