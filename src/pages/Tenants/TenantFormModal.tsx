import { useMemo, useState } from 'react';
import type { Lease, Property, Tenant, TenantDraft, Unit } from '../../types';
import { bedsLabel, unitOccupant, unitsForProperty, validateTenantUnit } from '../../lib/units';
import { isValidIsoDate, MAX_DATE, MIN_DATE } from '../../lib/format';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import PhoneInput from '../../components/PhoneInput';
import { DEFAULT_CALLING_COUNTRY, callingCountryForName, isPhoneValid } from '../../data/phone';

const MAX_BED_OPTIONS = 10;
const BED_OPTIONS = Array.from({ length: MAX_BED_OPTIONS + 1 }, (_, n) => bedsLabel(n));

const CUSTOM_UNIT = '__custom';

export default function TenantFormModal({
  title,
  initial,
  properties,
  units,
  tenants,
  leases,
  editingId,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: TenantDraft;
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  /** The tenant being edited, so their own unit never counts as taken. */
  editingId?: string;
  onClose: () => void;
  onSubmit: (d: TenantDraft) => void;
}) {
  const [form, setForm] = useState<TenantDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  // Free-text mode only when editing a legacy tenant whose label has no unit record.
  const [unitCustom, setUnitCustom] = useState(initial.unitId === undefined && initial.unit !== '');

  const propertyOptions = useMemo(
    () => properties.map((p) => ({ value: p.id, label: p.name, detail: p.address })),
    [properties]
  );
  const selectedProperty = properties.find((p) => p.id === form.propertyId);
  const phoneCountry = callingCountryForName(selectedProperty?.country) ?? DEFAULT_CALLING_COUNTRY;
  // Only units of the selected property are ever offered — never other properties'.
  const propUnits = unitsForProperty(units, form.propertyId);
  // A unit (or a legacy tenant) can carry a bed count past the stock list — keep it selectable.
  const bedOptions = BED_OPTIONS.includes(form.beds) || form.beds === '' ? BED_OPTIONS : [...BED_OPTIONS, form.beds];
  const useUnitSelect = propUnits.length > 0 && !unitCustom;

  const errs = {
    name: form.name.trim() === '' ? 'Full name is required.' : '',
    email: form.email.trim() === '' ? 'Email is required.' : !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? 'Enter a valid email address.' : '',
    phone: form.phone.trim() !== '' && !isPhoneValid(form.phone, phoneCountry) ? 'Enter a valid phone number.' : '',
    property: form.propertyId === '' ? 'Property is required.' : '',
    unit: form.unit.trim() === '' ? 'Unit is required.' : validateTenantUnit(form, units, tenants, leases, editingId) ?? '',
    rent: !(form.rent > 0) ? 'Enter a monthly rent greater than 0.' : '',
    leaseEnd: form.leaseEnd === '' ? 'Lease end date is required.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');
  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);
  const cls = (bad: boolean) => (submitted && bad ? 'invalid' : '');

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onSubmit({ ...form, name: form.name.trim(), email: form.email.trim(), unit: form.unit.trim() });
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="modal-section">
        <h4>Contact</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="tf-name">Full name *</label>
            <input id="tf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={cls(errs.name !== '')} />
            {err(errs.name)}
          </div>
          <div className="field">
            <label htmlFor="tf-email">Email *</label>
            <input id="tf-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={cls(errs.email !== '')} />
            {err(errs.email)}
          </div>
          <div className="field">
            <label htmlFor="tf-phone">Phone</label>
            <PhoneInput
              id="tf-phone"
              value={form.phone}
              defaultCountry={phoneCountry}
              onChange={(phone) => setForm({ ...form, phone })}
              invalid={submitted && errs.phone !== ''}
            />
            {err(errs.phone)}
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Property &amp; Unit</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="tf-prop">Property *</label>
            <SearchSelect
              id="tf-prop"
              value={form.propertyId}
              onChange={(propertyId) => {
                // A unit link never survives a property switch — units belong to exactly one property.
                setForm({ ...form, propertyId, unit: '', unitId: undefined });
                setUnitCustom(false);
              }}
              options={propertyOptions}
              placeholder="Select property"
              searchPlaceholder="Search by name or address..."
              emptyLabel="No property matches that search"
              invalid={submitted && errs.property !== ''}
            />
            {err(errs.property)}
          </div>
          <div className="field">
            <label htmlFor="tf-unit">Unit *</label>
            {useUnitSelect ? (
              <select
                id="tf-unit"
                value={form.unitId ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id === CUSTOM_UNIT) {
                    setUnitCustom(true);
                    setForm({ ...form, unit: '', unitId: undefined });
                    return;
                  }
                  const picked = propUnits.find((u) => u.id === id);
                  setForm({
                    ...form,
                    unitId: id === '' ? undefined : id,
                    unit: picked?.name ?? '',
                    // Picking a unit pulls in its own rent and bed count — that's the
                    // point of linking to a managed unit instead of typing one in.
                    rent: picked?.rent ?? form.rent,
                    beds: picked ? bedsLabel(picked.bedrooms) : form.beds,
                  });
                }}
                className={cls(errs.unit !== '')}
              >
                <option value="">Select unit</option>
                {propUnits.map((u) => {
                  const taken = form.status !== 'Inactive' && unitOccupant(u, tenants, leases, editingId) !== null;
                  return (
                    <option key={u.id} value={u.id} disabled={taken}>
                      {u.name} · {u.type} · ${u.rent.toLocaleString('en-US')}/mo{taken ? ' · Occupied' : ''}
                    </option>
                  );
                })}
                <option value={CUSTOM_UNIT}>Other — enter manually</option>
              </select>
            ) : (
              <input
                id="tf-unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value, unitId: undefined })}
                className={cls(errs.unit !== '')}
                placeholder="A-204"
              />
            )}
            {err(errs.unit)}
          </div>
          <div className="field">
            <label htmlFor="tf-beds">Beds</label>
            <select id="tf-beds" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })}>
              {bedOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4>Lease &amp; Rent</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="tf-rent">Monthly rent *</label>
            <input id="tf-rent" type="number" min={1} value={form.rent} onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })} className={cls(errs.rent !== '')} />
            {err(errs.rent)}
          </div>
          <div className="field">
            <label htmlFor="tf-status">Status</label>
            <select id="tf-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Tenant['status'] })}>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="tf-start">Lease start</label>
            <input id="tf-start" type="date" min={MIN_DATE} max={MAX_DATE} value={form.leaseStart} onChange={(e) => { if (isValidIsoDate(e.target.value)) setForm({ ...form, leaseStart: e.target.value }); }} />
          </div>
          <div className="field">
            <label htmlFor="tf-end">Lease end *</label>
            <input id="tf-end" type="date" min={MIN_DATE} max={MAX_DATE} value={form.leaseEnd} onChange={(e) => { if (isValidIsoDate(e.target.value)) setForm({ ...form, leaseEnd: e.target.value }); }} className={cls(errs.leaseEnd !== '')} />
            {err(errs.leaseEnd)}
          </div>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>Save Tenant</button>
      </div>
    </Modal>
  );
}
