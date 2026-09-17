import { useState } from 'react';
import type { MaintenanceRequest, MaintenanceStaff, MaintenanceStaffStatus } from '../../data/mock';
import { DEFAULT_CALLING_COUNTRY, isPhoneValid } from '../../data/phone';
import { useStore } from '../../state/useStore';
import Modal from '../../components/Modal';
import PhoneInput from '../../components/PhoneInput';

const SPECIALTIES: MaintenanceRequest['category'][] = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Cleaning', 'General', 'Other'];

export default function StaffFormModal({
  staffMember,
  onClose,
}: {
  /** Present when editing; absent when adding. The same form serves both flows. */
  staffMember?: MaintenanceStaff | null;
  onClose: () => void;
}) {
  const addStaff = useStore((s) => s.addStaff);
  const updateStaff = useStore((s) => s.updateStaff);
  const pushToast = useStore((s) => s.pushToast);

  const editing = staffMember ?? null;

  const [name, setName] = useState(editing?.name ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [specialty, setSpecialty] = useState<MaintenanceRequest['category']>(editing?.specialty ?? 'General');
  const [status, setStatus] = useState<MaintenanceStaffStatus>(editing?.status ?? 'Active');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const errs = {
    name: name.trim() === '' ? 'Name is required.' : '',
    email: email.trim() === '' ? 'Email is required.' : !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email address.' : '',
    phone: phone.trim() !== '' && !isPhoneValid(phone, DEFAULT_CALLING_COUNTRY) ? 'Enter a valid phone number.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');
  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);
  const cls = (bad: boolean) => (submitted && bad ? 'invalid' : '');

  const submit = () => {
    setSubmitted(true);
    setServerError('');
    if (invalid) return;
    const patch = { name: name.trim(), email: email.trim(), phone, specialty, status };
    // The store re-validates (name, email format, phone) so bad data can
    // never persist, even if the form check is bypassed.
    const rejected = editing ? updateStaff(editing.id, patch) : addStaff({ id: `st-${Date.now()}`, ...patch });
    if (rejected) {
      setServerError(rejected);
      return;
    }
    pushToast(editing ? `Saved changes for ${patch.name}` : `${patch.name} added to maintenance staff`);
    onClose();
  };

  return (
    <Modal title={editing ? `Edit Staff — ${editing.name}` : 'Add Maintenance Staff'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="field">
          <label htmlFor="sf-name">Name *</label>
          <input id="sf-name" value={name} onChange={(e) => setName(e.target.value)} className={cls(errs.name !== '')} placeholder="R. Alvarez" autoFocus />
          {err(errs.name)}
        </div>
        <div className="field">
          <label htmlFor="sf-email">Email *</label>
          <input id="sf-email" value={email} onChange={(e) => setEmail(e.target.value)} className={cls(errs.email !== '')} placeholder="r.alvarez@propora.io" />
          {err(errs.email)}
        </div>
        <div className="field">
          <label htmlFor="sf-phone">Phone</label>
          <PhoneInput id="sf-phone" value={phone} defaultCountry={DEFAULT_CALLING_COUNTRY} onChange={setPhone} invalid={submitted && errs.phone !== ''} />
          {err(errs.phone)}
        </div>
        <div className="field">
          <label htmlFor="sf-specialty">Specialty</label>
          <select id="sf-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value as MaintenanceRequest['category'])}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sf-status">Status</label>
          <select id="sf-status" value={status} onChange={(e) => setStatus(e.target.value as MaintenanceStaffStatus)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      {serverError !== '' ? <p className="field-error m-0" role="alert">{serverError}</p> : null}
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>
          {editing ? 'Save Changes' : 'Add Staff'}
        </button>
      </div>
    </Modal>
  );
}
