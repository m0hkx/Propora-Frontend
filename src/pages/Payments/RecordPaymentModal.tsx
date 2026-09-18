import { useMemo, useState } from 'react';
import type { Payment, Property, Tenant } from '../../data/mock';
import { tenantById } from '../../data/mock';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import { tenantOption } from '../Leases/leaseUtils';
import { isValidIsoDate, MAX_DATE } from '../../lib/format';

// Payments can't be backdated — only today or a future date is accepted.
const today = new Date().toISOString().slice(0, 10);

export interface PaymentDraft {
  tenantId: string;
  propertyId: string;
  amount: number;
  date: string;
  method: Payment['method'];
  status: Payment['status'];
}

export default function RecordPaymentModal({
  mode,
  title,
  initial,
  properties,
  tenants,
  onClose,
  onSubmit,
}: {
  mode: 'add' | 'edit';
  title: string;
  initial: PaymentDraft;
  properties: Property[];
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (d: PaymentDraft) => void;
}) {
  const [tenantId, setTenantId] = useState(initial.tenantId);
  const [propertyId, setPropertyId] = useState(initial.propertyId);
  const [amount, setAmount] = useState(initial.amount);
  const [date, setDate] = useState(initial.date);
  const [method, setMethod] = useState<Payment['method']>(initial.method);
  const [status, setStatus] = useState<Payment['status']>(initial.status);
  const [submitted, setSubmitted] = useState(false);

  // Only tenants at the selected property are offered, so a payment can never
  // be recorded against a tenant/property mismatch. With no property chosen
  // yet, the full list is shown and picking a tenant fills in their property.
  const propertyTenants = useMemo(
    () => (propertyId === '' ? tenants : tenants.filter((t) => t.propertyId === propertyId)),
    [tenants, propertyId]
  );
  // Same searchable options as the lease form — one builder, no duplicate
  // tenant-search logic. Full list: the picker caps rendered rows itself.
  const tenantOptions = useMemo(() => propertyTenants.map(tenantOption), [propertyTenants]);
  const selectedTenant = tenantId === '' ? undefined : tenantById(tenantId, tenants);
  const tenantMissing =
    tenantId !== '' && (selectedTenant === undefined || (propertyId !== '' && selectedTenant.propertyId !== propertyId));

  const selectTenant = (id: string) => {
    setTenantId(id);
    const t = id === '' ? undefined : tenantById(id, tenants);
    if (t) {
      setPropertyId(t.propertyId);
      if (!(amount > 0)) setAmount(t.rent);
    }
  };

  const selectProperty = (id: string) => {
    setPropertyId(id);
    // A tenant selection never survives a property switch it no longer belongs to.
    if (id !== '' && tenantId !== '' && tenantById(tenantId, tenants)?.propertyId !== id) setTenantId('');
  };

  const errs = {
    tenant: tenantId === '' ? 'Tenant is required.' : tenantMissing ? 'That tenant is no longer available. Pick another.' : '',
    property: propertyId === '' ? 'Property is required.' : '',
    amount: !(amount > 0) ? 'Enter an amount greater than 0.' : '',
    // Only new payments are held to "no past dates" — editing an existing
    // (often historical) payment record shouldn't be blocked by a date it already had.
    date: date === '' ? 'Date is required.' : mode === 'add' && date < today ? 'Payment date cannot be in the past.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');
  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);
  const cls = (bad: boolean) => (submitted && bad ? 'invalid' : '');

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onSubmit({ tenantId, propertyId, amount, date, method, status });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="field">
          <label htmlFor="rp-tenant">Tenant *</label>
          <SearchSelect
            id="rp-tenant"
            value={tenantId}
            onChange={selectTenant}
            options={tenantOptions}
            placeholder="Select tenant"
            searchPlaceholder="Search by name, email, phone or unit..."
            emptyLabel={propertyId !== '' && propertyTenants.length === 0 ? 'No tenants at this property' : 'No tenant matches that search'}
            invalid={submitted && errs.tenant !== ''}
          />
          {err(errs.tenant)}
        </div>
        <div className="field">
          <label htmlFor="rp-prop">Property *</label>
          <select id="rp-prop" value={propertyId} onChange={(e) => selectProperty(e.target.value)} className={cls(errs.property !== '')}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err(errs.property)}
        </div>
        <div className="field">
          <label htmlFor="rp-amount">Amount *</label>
          <input id="rp-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={cls(errs.amount !== '')} />
          {err(errs.amount)}
        </div>
        <div className="field">
          <label htmlFor="rp-date">Date *</label>
          <input id="rp-date" type="date" min={mode === 'add' ? today : undefined} max={MAX_DATE} value={date} onChange={(e) => { if (isValidIsoDate(e.target.value)) setDate(e.target.value); }} className={cls(errs.date !== '')} />
          {err(errs.date)}
        </div>
        <div className="field">
          <label htmlFor="rp-method">Method</label>
          <select id="rp-method" value={method} onChange={(e) => setMethod(e.target.value as Payment['method'])}>
            <option value="Bank">Bank</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rp-status">Status</label>
          <select id="rp-status" value={status} onChange={(e) => setStatus(e.target.value as Payment['status'])}>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>
          {mode === 'add' ? 'Save Payment' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
