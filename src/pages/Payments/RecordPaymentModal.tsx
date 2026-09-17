import { useState } from 'react';
import type { Payment, Property, Tenant } from '../../data/mock';
import Modal from '../../components/Modal';

export interface PaymentDraft {
  tenantId: string;
  propertyId: string;
  amount: number;
  date: string;
  method: Payment['method'];
  status: Payment['status'];
}

export default function RecordPaymentModal({
  properties,
  tenants,
  onClose,
  onCreate,
}: {
  properties: Property[];
  tenants: Tenant[];
  onClose: () => void;
  onCreate: (d: PaymentDraft) => void;
}) {
  const [tenantId, setTenantId] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<Payment['method']>('Bank');
  const [status, setStatus] = useState<Payment['status']>('Paid');
  const [submitted, setSubmitted] = useState(false);

  const errs = {
    tenant: tenantId === '' ? 'Tenant is required.' : '',
    property: propertyId === '' ? 'Property is required.' : '',
    amount: !(amount > 0) ? 'Enter an amount greater than 0.' : '',
    date: date === '' ? 'Date is required.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');
  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);
  const cls = (bad: boolean) => (submitted && bad ? 'invalid' : '');

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onCreate({ tenantId, propertyId, amount, date, method, status });
  };

  return (
    <Modal title="Record Payment" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="field">
          <label htmlFor="rp-tenant">Tenant *</label>
          <select
            id="rp-tenant"
            value={tenantId}
            onChange={(e) => {
              const id = e.target.value;
              setTenantId(id);
              const t = tenants.find((x) => x.id === id);
              if (t) {
                setPropertyId(t.propertyId);
                if (!(amount > 0)) setAmount(t.rent);
              }
            }}
            className={cls(errs.tenant !== '')}
          >
            <option value="">Select tenant</option>
            {tenants.slice(0, 40).map((t) => <option key={t.id} value={t.id}>{t.name} · Unit {t.unit}</option>)}
          </select>
          {err(errs.tenant)}
        </div>
        <div className="field">
          <label htmlFor="rp-prop">Property *</label>
          <select id="rp-prop" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={cls(errs.property !== '')}>
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
          <input id="rp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cls(errs.date !== '')} />
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
        <button className="btn btn-teal" type="button" onClick={submit}>Save Payment</button>
      </div>
    </Modal>
  );
}
