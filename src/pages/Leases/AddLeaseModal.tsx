import { useState } from 'react';
import type { Property, Tenant } from '../../data/mock';
import Modal from '../../components/Modal';

export interface LeaseDraft {
  propertyId: string;
  tenantId: string;
  rent: number;
  deposit: number;
  start: string;
  end: string;
}

export default function AddLeaseModal({
  properties,
  tenants,
  onClose,
  onCreate,
}: {
  properties: Property[];
  tenants: Tenant[];
  onClose: () => void;
  onCreate: (d: LeaseDraft) => void;
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [tenantId, setTenantId] = useState('');
  const [rent, setRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errs = {
    property: propertyId === '' ? 'Property is required.' : '',
    tenant: tenantId === '' ? 'Tenant is required.' : '',
    rent: !(rent > 0) ? 'Enter a monthly rent greater than 0.' : '',
    start: start === '' ? 'Start date is required.' : '',
    end: end === '' ? 'End date is required.' : start !== '' && end !== '' && end <= start ? 'End date must be after the start date.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');
  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);
  const cls = (bad: boolean) => (submitted && bad ? 'invalid' : '');

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onCreate({ propertyId, tenantId, rent, deposit, start, end });
  };

  const tenantOptions = tenants;
  void tenantOptions;

  return (
    <Modal title="Add Lease" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="field">
          <label htmlFor="al-prop">Property *</label>
          <select id="al-prop" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={cls(errs.property !== '')}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err(errs.property)}
        </div>
        <div className="field">
          <label htmlFor="al-tenant">Tenant *</label>
          <select id="al-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={cls(errs.tenant !== '')}>
            <option value="">Select tenant</option>
            {tenants.slice(0, 40).map((t) => <option key={t.id} value={t.id}>{t.name} · Unit {t.unit}</option>)}
          </select>
          {err(errs.tenant)}
        </div>
        <div className="field">
          <label htmlFor="al-rent">Monthly rent *</label>
          <input id="al-rent" type="number" min={1} value={rent} onChange={(e) => setRent(Number(e.target.value))} className={cls(errs.rent !== '')} />
          {err(errs.rent)}
        </div>
        <div className="field">
          <label htmlFor="al-dep">Deposit</label>
          <input id="al-dep" type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="al-start">Start date *</label>
          <input id="al-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={cls(errs.start !== '')} />
          {err(errs.start)}
        </div>
        <div className="field">
          <label htmlFor="al-end">End date *</label>
          <input id="al-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={cls(errs.end !== '')} />
          {err(errs.end)}
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>Create Lease</button>
      </div>
    </Modal>
  );
}
