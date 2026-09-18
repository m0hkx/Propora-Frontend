import { useState } from 'react';
import type { Unit, UnitStatus, UnitType } from '../../data/mock';
import { bedroomsForType, isDuplicateUnitName } from '../../lib/units';
import { useStore } from '../../state/useStore';
import Modal from '../../components/Modal';

const TYPES: UnitType[] = ['Studio', '1 BR', '2 BR', '3 BR', '4 BR', 'Other'];
const STATUSES: UnitStatus[] = ['Vacant', 'Occupied', 'Maintenance'];

const INT = /^-?\d+$/;
const NUM = /^\d+(\.\d+)?$/;

export default function UnitFormModal({
  propertyId,
  unit,
  onClose,
}: {
  propertyId: string;
  /** Present when editing; absent when adding. The same form serves both flows. */
  unit?: Unit | null;
  onClose: () => void;
}) {
  const units = useStore((s) => s.units);
  const properties = useStore((s) => s.properties);
  const addUnit = useStore((s) => s.addUnit);
  const updateUnit = useStore((s) => s.updateUnit);
  const pushToast = useStore((s) => s.pushToast);

  const editing = unit ?? null;
  const property = properties.find((p) => p.id === propertyId);

  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState<UnitType>(editing?.type ?? '2 BR');
  const [floor, setFloor] = useState(editing?.floor !== undefined ? String(editing.floor) : '');
  // Only ever the source of truth for 'Other' — every other type implies its
  // own bedroom count, so there is no independent value to track for them.
  const [bedrooms, setBedrooms] = useState(editing ? String(editing.bedrooms) : '1');
  const [bathrooms, setBathrooms] = useState(editing ? String(editing.bathrooms) : '1');
  const [size, setSize] = useState(editing?.size !== undefined ? String(editing.size) : '');
  const [rent, setRent] = useState(editing ? String(editing.rent) : property ? String(property.rent) : '');
  const [status, setStatus] = useState<UnitStatus>(editing?.status ?? 'Vacant');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  // Every type but 'Other' implies its bedroom count; when it does, that
  // count is the only truth — the manual field only matters for 'Other'.
  const impliedBedrooms = bedroomsForType(type);
  const bedroomsLocked = impliedBedrooms !== undefined;

  const errs = {
    name:
      name.trim() === ''
        ? 'Unit name/number is required.'
        : isDuplicateUnitName(units, propertyId, name, editing?.id)
          ? `Unit "${name.trim()}" already exists in this property.`
          : '',
    bedrooms: bedroomsLocked
      ? ''
      : bedrooms.trim() === ''
        ? 'Bedrooms is required (0 for a studio).'
        : !INT.test(bedrooms.trim()) || Number(bedrooms) < 0
          ? 'Enter 0 or more whole bedrooms.'
          : '',
    bathrooms:
      bathrooms.trim() === ''
        ? 'Bathrooms is required.'
        : !NUM.test(bathrooms.trim()) || Number(bathrooms) < 0
          ? 'Enter 0 or more bathrooms.'
          : '',
    floor: floor.trim() !== '' && (!INT.test(floor.trim()) || Number(floor) < -5 || Number(floor) > 200) ? 'Enter a valid floor.' : '',
    size: size.trim() !== '' && (!NUM.test(size.trim()) || Number(size) <= 0) ? 'Enter a size greater than 0.' : '',
    rent: rent.trim() === '' ? 'Monthly rent is required.' : !NUM.test(rent.trim()) || Number(rent) <= 0 ? 'Enter a monthly rent greater than 0.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');
  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);
  const cls = (bad: boolean) => (submitted && bad ? 'invalid' : '');

  const submit = () => {
    setSubmitted(true);
    setServerError('');
    if (invalid) return;
    const patch = {
      name: name.trim(),
      type,
      floor: floor.trim() === '' ? undefined : Number(floor),
      bedrooms: impliedBedrooms ?? Number(bedrooms),
      bathrooms: Number(bathrooms),
      size: size.trim() === '' ? undefined : Number(size),
      rent: Number(rent),
      status,
      notes: notes.trim() === '' ? undefined : notes.trim(),
    };
    // The store re-validates (required name, per-property uniqueness,
    // non-negative numbers) so bad data can never persist, even if the
    // form check is bypassed.
    const rejected = editing
      ? updateUnit(editing.id, { ...patch, propertyId })
      : addUnit({ id: `u-${Date.now()}`, propertyId, ...patch });
    if (rejected) {
      setServerError(rejected);
      return;
    }
    pushToast(editing ? `Saved changes for unit ${patch.name}` : `Unit ${patch.name} added to ${property?.name ?? 'property'}`);
    onClose();
  };

  return (
    <Modal title={editing ? `Edit Unit — ${editing.name}` : `Add Unit · ${property?.name ?? ''}`} onClose={onClose} wide>
      <div className="modal-section">
        <h4>Unit Details</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="uf-name">Unit name/number *</label>
            <input
              id="uf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cls(errs.name !== '')}
              placeholder="A-204"
              autoFocus
            />
            {err(errs.name)}
          </div>
          <div className="field">
            <label htmlFor="uf-type">Unit type</label>
            <select id="uf-type" value={type} onChange={(e) => setType(e.target.value as UnitType)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="uf-floor">Floor</label>
            <input
              id="uf-floor"
              inputMode="numeric"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className={cls(errs.floor !== '')}
              placeholder="2"
            />
            {err(errs.floor)}
          </div>
          <div className="field">
            <label htmlFor="uf-status">Status</label>
            <select id="uf-status" value={status} onChange={(e) => setStatus(e.target.value as UnitStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Size &amp; Pricing</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="uf-beds">Bedrooms{bedroomsLocked ? '' : ' *'}</label>
            <input
              id="uf-beds"
              inputMode="numeric"
              value={bedroomsLocked ? String(impliedBedrooms) : bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className={cls(errs.bedrooms !== '')}
              placeholder="2"
              disabled={bedroomsLocked}
            />
            {bedroomsLocked ? (
              <span className="small muted">Set from Unit type — pick "Other" to enter a custom count.</span>
            ) : (
              err(errs.bedrooms)
            )}
          </div>
          <div className="field">
            <label htmlFor="uf-baths">Bathrooms *</label>
            <input
              id="uf-baths"
              inputMode="decimal"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className={cls(errs.bathrooms !== '')}
              placeholder="1"
            />
            {err(errs.bathrooms)}
          </div>
          <div className="field">
            <label htmlFor="uf-size">Size (sqm)</label>
            <input
              id="uf-size"
              inputMode="decimal"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={cls(errs.size !== '')}
              placeholder="85"
            />
            {err(errs.size)}
          </div>
          <div className="field">
            <label htmlFor="uf-rent">Monthly rent *</label>
            <input
              id="uf-rent"
              inputMode="decimal"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className={cls(errs.rent !== '')}
              placeholder="2850"
            />
            {err(errs.rent)}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="uf-notes">Notes</label>
        <textarea
          id="uf-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Access notes, renovation details, parking…"
        />
      </div>
      {serverError !== '' ? <p className="field-error m-0" role="alert">{serverError}</p> : null}
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>
          {editing ? 'Save Changes' : 'Create Unit'}
        </button>
      </div>
    </Modal>
  );
}
