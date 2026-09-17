import { useState } from 'react';
import { formatMoney } from '../../data/mock';
import type { Property } from '../../data/mock';
import { Badge, Progress } from '../../components/ui';
import Modal from '../../components/Modal';
import UnitsSection from './UnitsSection';

function tone(s: Property['status']): 'success' | 'warn' | 'danger' {
  return s === 'Active' ? 'success' : s === 'Vacant' ? 'warn' : 'danger';
}

export default function PropertyDetailsModal({
  property,
  onClose,
  onEdit,
}: {
  property: Property;
  onClose: () => void;
  onEdit: () => void;
}) {
  const p = property;
  const [imgFailed, setImgFailed] = useState(false);
  const occ = p.units === 0 ? 0 : Math.round((p.occupied / p.units) * 100);
  const available = Math.max(0, p.units - p.occupied);
  const monthlyRevenue = p.occupied * p.rent;
  const location = p.country ? `${p.address}, ${p.country}` : p.address;
  const showImage = !imgFailed;

  return (
    <Modal title={p.name} onClose={onClose} wide>
      <div className="prop-image rounded-chip no-scrim" style={showImage ? undefined : { background: '#0F766E' }}>
        {showImage ? (
          <img
            src={p.imageUrl}
            alt={`${p.name} photo`}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : null}
        <span className="prop-initials">{p.image}</span>
        <span className="z-[2]"><Badge tone={tone(p.status)}>{p.status}</Badge></span>
      </div>

      <p className="small muted break-words">{location === '' ? '—' : location}</p>

      <div className="modal-section">
        <h4>Overview</h4>
        <div className="list mt-0">
          <div className="list-row"><span>Country</span><strong>{p.country ?? '—'}</strong></div>
          <div className="list-row"><span>Property type</span><strong>{p.type}</strong></div>
          <div className="list-row"><span>Year built</span><strong>{p.yearBuilt}</strong></div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Units &amp; occupancy</h4>
        <div>
          <div className="row small"><span className="muted">Occupancy</span><strong>{occ}%</strong></div>
          <Progress value={occ} />
        </div>
        <div className="list mt-0">
          <div className="list-row"><span>Total units</span><strong>{p.units}</strong></div>
          <div className="list-row"><span>Occupied</span><strong>{p.occupied}</strong></div>
          <div className="list-row"><span>Available</span><strong>{available}</strong></div>
        </div>
      </div>

      <UnitsSection propertyId={p.id} />

      <div className="modal-section">
        <h4>Financials</h4>
        <div className="list mt-0">
          <div className="list-row"><span>Base rent (per unit / month)</span><strong>{formatMoney(p.rent)}/mo</strong></div>
          <div className="list-row"><span>Est. monthly revenue</span><strong>{formatMoney(monthlyRevenue)}</strong></div>
          <div className="list-row"><span>Est. annual revenue</span><strong>{formatMoney(monthlyRevenue * 12)}</strong></div>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn btn-teal" type="button" onClick={onEdit}>Edit Property</button>
      </div>
    </Modal>
  );
}
