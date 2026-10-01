import { useState } from 'react';
import type { LiveProperty } from '../../lib/units';
import { Badge, Progress } from '../../components/ui';
import Modal from '../../components/Modal';
import { propertyTone } from '../../lib/tone';
import { propertyHasUnits } from '../../lib/units';
import UnitsSection from './UnitsSection';
import { formatMoney } from '../../lib/format';

export default function PropertyDetailsModal({
  property,
  onClose,
  onEdit,
}: {
  property: LiveProperty;
  onClose: () => void;
  onEdit: () => void;
}) {
  const p = property;
  const [imgFailed, setImgFailed] = useState(false);

  // A blank imageUrl must not reach <img src="">, which makes the browser
  // re-request the page. No image and a failed image are the same state here.
  const hasPhoto = !imgFailed && p.imageUrl.trim() !== '';
  // A villa is one dwelling; legacy ones that already have units keep the unit tools.
  const tracksUnits = propertyHasUnits(p.type) || p.units > 0;
  const hasUnits = p.units > 0;
  const occ = hasUnits ? Math.round((p.occupied / p.units) * 100) : 0;
  const monthlyRevenue = p.revenue;

  return (
    <Modal title={p.name} onClose={onClose} wide>
      {/* The building's own photograph is the identity — nothing is written
          over it. The monogram stands in only when the image fails. */}
      <div className="pd-photo">
        {hasPhoto ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <span className="pd-monogram">{p.image}</span>
        )}
      </div>

      <div className="pd-block-flush">
        <div className="pd-identity">
          <p className="pd-address">{p.address.trim() === '' ? 'No address recorded' : p.address}</p>
          <Badge tone={propertyTone(p.status)}>{p.status}</Badge>
        </div>
        <dl className="pd-facts">
          <div>
            <dt>Type</dt>
            <dd>{p.type}</dd>
          </div>
          <div>
            <dt>Built</dt>
            <dd>{p.yearBuilt}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{p.country ?? '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="pd-block">
        {!tracksUnits ? (
          <p className="pd-note">This property is a single dwelling, so it has no units to manage.</p>
        ) : hasUnits ? (
          <>
            <p className="pd-occupancy">
              <span className="pd-occupancy-count">{p.occupied}</span>
              <span className="pd-occupancy-text">of {p.units} units occupied</span>
            </p>
            <div className="pd-meter">
              <Progress value={occ} label={`Occupancy: ${occ} percent`} />
              <span className="pd-meter-value">{occ}%</span>
            </div>
          </>
        ) : (
          <p className="pd-note">No units recorded yet. Add one below to start tracking occupancy.</p>
        )}
      </div>

      <div className="pd-block">
        <h3 className="pd-heading">Revenue</h3>
        <div className="pd-figures">
          <span>
            <span className="pd-figure">{formatMoney(monthlyRevenue)}</span>
            <span className="pd-unit">per month</span>
          </span>
          <span>
            <span className="pd-figure-sub">{formatMoney(monthlyRevenue * 12)}</span>
            <span className="pd-unit">per year</span>
          </span>
        </div>
        <p className="pd-note">
          {monthlyRevenue > 0
            ? `Estimated from ${p.occupied} occupied ${p.occupied === 1 ? 'unit' : 'units'} based on each tenant's own rent.`
            : 'Nothing is occupied yet, so no revenue is expected.'}
        </p>
      </div>

      {tracksUnits && (
        <div className="pd-block">
          <UnitsSection propertyId={p.id} />
        </div>
      )}

      <div className="modal-foot">
        <button className="btn btn-teal" type="button" onClick={onEdit}>Edit Property</button>
      </div>
    </Modal>
  );
}
