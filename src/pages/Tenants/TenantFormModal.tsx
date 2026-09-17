import { useState } from 'react';
import type { Property, Tenant } from '../../data/mock';
import Modal from '../../components/Modal';

export interface TenantDraft {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unit: string;
  beds: string;
  rent: number;
  leaseStart: string;
  leaseEnd: string;
  status: Tenant['status'];
}

const BED_OPTIONS = ['Studio', '1 BR', '2 BR', '3 BR', '4 BR'];

export default function TenantFormModal({
  title,
  initial,
  properties,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: TenantDraft;
  properties: Property[];
  onClose: () => void;
  onSubmit: (d: TenantDraft) => void;
}) {
  const [form, setForm] = useState<TenantDraft>(initial);
  const [submitted, setSubmitted] = useState(false);

  const errs = {
    name: form.name.trim() === '' ? 'Full name is required.' : '',
    email: form.email.trim() === '' ? 'Email is required.' : !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? 'Enter a valid email address.' : '',
    property: form.propertyId === '' ? 'Property is required.' : '',
    unit: form.unit.trim() === '' ? 'Unit is required.' : '',
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
          <input id="tf-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 555-0100" />
        </div>
        <div className="field">
          <label htmlFor="tf-prop">Property *</label>
          <select id="tf-prop" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className={cls(errs.property !== '')}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err(errs.property)}
        </div>
        <div className="field">
          <label htmlFor="tf-unit">Unit *</label>
          <input id="tf-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={cls(errs.unit !== '')} placeholder="A-204" />
          {err(errs.unit)}
        </div>
        <div className="field">
          <label htmlFor="tf-beds">Beds</label>
          <select id="tf-beds" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })}>
            {BED_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
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
          <input id="tf-start" type="date" value={form.leaseStart} onChange={(e) => setForm({ ...form, leaseStart: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="tf-end">Lease end *</label>
          <input id="tf-end" type="date" value={form.leaseEnd} onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })} className={cls(errs.leaseEnd !== '')} />
          {err(errs.leaseEnd)}
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>Save Tenant</button>
      </div>
    </Modal>
  );
}
