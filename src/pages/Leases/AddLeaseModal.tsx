import { useMemo, useState } from 'react';
import type { Property, Tenant, Unit } from '../../data/mock';
import { formatMoney, propertyName, tenantById } from '../../data/mock';
import { leaseTone, orDash, tenantOption, tenantPrefill } from './leaseUtils';
import { fmtDate } from '../../lib/format';
import { unitsForProperty } from '../../lib/units';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import { Badge } from '../../components/ui';

export interface LeaseDraft {
  propertyId: string;
  tenantId: string;
  /** Leased unit within `propertyId`; undefined when the lease covers no specific unit. */
  unitId?: string;
  rent: number;
  deposit: number;
  start: string;
  end: string;
}

export default function AddLeaseModal({
  properties,
  tenants,
  units,
  onClose,
  onCreate,
}: {
  properties: Property[];
  tenants: Tenant[];
  units: Unit[];
  onClose: () => void;
  onCreate: (d: LeaseDraft) => void;
}) {
  const defaultPropertyId = properties[0]?.id ?? '';
  const [propertyId, setPropertyId] = useState(defaultPropertyId);
  const [tenantId, setTenantId] = useState('');
  const [unitId, setUnitId] = useState<string | undefined>(undefined);
  const [rent, setRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [submitted, setSubmitted] = useState(false);

  /**
   * The tenant record is read from the live `tenants` list on every render
   * rather than copied into state, so the panel below can never show a stale
   * snapshot and no second copy of the tenant is created. `undefined` here
   * means the id no longer resolves (tenant deleted mid-session).
   */
  const tenant = tenantId === '' ? undefined : tenantById(tenantId, tenants);
  const notFound = tenantId !== '' && tenant === undefined;

  const tenantOptions = useMemo(
    () =>
      tenants
        // Only tenants of the currently selected property — the lease is
        // always created under one property, so tenants of other properties
        // are not selectable here.
        .filter((t) => t.propertyId === propertyId)
        .map(tenantOption),
    [tenants, propertyId]
  );

  /**
   * Every tenant-derived field is rewritten on each selection — including back
   * to its pristine default when the picker is cleared — so nothing from the
   * previously selected tenant can survive the change.
   */
  const selectTenant = (id: string) => {
    setTenantId(id);
    const prefill = tenantPrefill(id, tenants, defaultPropertyId);
    setPropertyId(prefill.propertyId);
    setRent(prefill.rent);
    // Adopt the tenant's unit link when it belongs to the prefilled property.
    const picked = id === '' ? undefined : tenantById(id, tenants);
    setUnitId(
      picked?.unitId !== undefined &&
        units.some((u) => u.id === picked.unitId && u.propertyId === prefill.propertyId)
        ? picked.unitId
        : undefined
    );
  };

  // Only units of the selected property are ever offered — never other properties'.
  const propUnits = unitsForProperty(units, propertyId);

  const selectProperty = (id: string) => {
    setPropertyId(id);
    // A unit link never survives a property switch — units belong to exactly one property.
    if (unitId !== undefined && !units.some((u) => u.id === unitId && u.propertyId === id)) {
      setUnitId(undefined);
    }
    // A tenant of another property cannot be leased here — when the property
    // changes, drop any selection that does not belong to the new property.
    if (tenantId !== '' && !tenants.some((t) => t.id === tenantId && t.propertyId === id)) {
      setTenantId('');
    }
  };

  const errs = {
    property: propertyId === '' ? 'Property is required.' : '',
    tenant: tenantId === '' ? 'Tenant is required.' : notFound ? 'That tenant is no longer available. Pick another.' : '',
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
    // Only the tenant's id travels with the lease — the tenant record itself
    // is never written back to.
    onCreate({ propertyId, tenantId, unitId, rent, deposit, start, end });
  };

  return (
    <Modal title="Add Lease" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="field">
          <label htmlFor="al-tenant">Tenant *</label>
          <SearchSelect
            id="al-tenant"
            value={tenantId}
            onChange={selectTenant}
            options={tenantOptions}
            placeholder="Select tenant"
            searchPlaceholder="Search by name, email, phone or unit..."
            emptyLabel="No tenant matches that search"
            invalid={submitted && errs.tenant !== ''}
          />
          {err(errs.tenant)}
        </div>
        <div className="field">
          <label htmlFor="al-prop">Property *</label>
          <select id="al-prop" value={propertyId} onChange={(e) => selectProperty(e.target.value)} className={cls(errs.property !== '')}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err(errs.property)}
        </div>
        <div className="field">
          <label htmlFor="al-unit">Unit</label>
          <select id="al-unit" value={unitId ?? ''} onChange={(e) => setUnitId(e.target.value === '' ? undefined : e.target.value)}>
            <option value="">No specific unit</option>
            {propUnits.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.type} · {formatMoney(u.rent)}/mo</option>)}
          </select>
        </div>
      </div>

      {notFound ? (
        <div className="modal-section" role="alert">
          <h4>Tenant details</h4>
          <p className="small field-error m-0">
            This tenant record could not be found — it may have been deleted. Pick another tenant to continue.
          </p>
        </div>
      ) : null}

      {tenant ? (
        <div className="modal-section">
          <div className="row">
            <h4>Tenant details</h4>
            <Badge tone={leaseTone(tenant.leaseStatus)}>{tenant.leaseStatus}</Badge>
          </div>
          <div className="list mt-0">
            <div className="list-row"><span>Name</span><strong>{orDash(tenant.name)}</strong></div>
            <div className="list-row"><span>Email</span><strong className="break-all">{orDash(tenant.email)}</strong></div>
            <div className="list-row"><span>Phone</span><strong>{orDash(tenant.phone)}</strong></div>
            <div className="list-row"><span>Property</span><strong>{propertyName(tenant.propertyId, properties)}</strong></div>
            <div className="list-row"><span>Unit</span><strong>{orDash(tenant.unit)}{tenant.beds.trim() === '' ? '' : ` · ${tenant.beds}`}</strong></div>
            <div className="list-row"><span>Current rent</span><strong>{formatMoney(tenant.rent)}/mo</strong></div>
            <div className="list-row">
              <span>Current lease term</span>
              <strong>{fmtDate(tenant.leaseStart)} – {fmtDate(tenant.leaseEnd)}</strong>
            </div>
          </div>
          <span className="small muted">
            Property and monthly rent are prefilled from this record — edit them if this lease differs. The tenant's own record is not changed.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
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
