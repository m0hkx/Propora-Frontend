import { useState } from 'react';
import type { MaintenanceRequest, MaintenanceStaff, Property, Tenant, Unit } from '../../data/mock';
import { tenantOption } from '../Leases/leaseUtils';
import { resolveUnitStatus, unitsForProperty } from '../../lib/units';
import { validateMaintenanceTarget } from '../../lib/maintenanceScope';
import { isValidIsoDate, MAX_DATE, MIN_DATE } from '../../lib/format';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import MultiSearchSelect from '../../components/MultiSearchSelect';

type Category = MaintenanceRequest['category'];
type Priority = MaintenanceRequest['priority'];
type Scope = MaintenanceRequest['scope'];

const CATEGORIES: Category[] = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Cleaning', 'General', 'Other'];

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'property', label: 'Entire Property' },
  { value: 'units', label: 'Specific Units' },
  { value: 'tenants', label: 'Specific Tenants' },
];

export interface NewMaintenanceDraft {
  title: string;
  description: string;
  propertyId: string;
  scope: Scope;
  /** Populated only when scope === 'units'. */
  unitIds: string[];
  /** Populated only when scope === 'tenants'. */
  tenantIds: string[];
  category: Category;
  priority: Priority;
  assigneeId?: string;
  scheduledDate?: string;
  estimatedCost: number;
}

export default function NewMaintenanceModal({
  properties,
  units,
  tenants,
  staff,
  onClose,
  onCreate,
}: {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  staff: MaintenanceStaff[];
  onClose: () => void;
  onCreate: (d: NewMaintenanceDraft) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [scope, setScope] = useState<Scope>('property');
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('Plumbing');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [cost, setCost] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Only units/tenants of the selected property are ever offered — never other properties'.
  const propUnits = unitsForProperty(units, propertyId);
  const propTenants = tenants.filter((t) => t.propertyId === propertyId);

  const unitOptions = propUnits.map((u) => ({
    value: u.id,
    label: `${u.name} · ${u.type}`,
    keywords: u.name,
    detail: `Floor ${u.floor ?? '—'} · ${resolveUnitStatus(u, tenants, [])}`,
  }));
  const tenantOptions = propTenants.map(tenantOption);
  const activeStaff = staff.filter((s) => s.status === 'Active');
  const staffOptions = activeStaff.map((s) => ({ value: s.id, label: s.name, detail: s.specialty }));

  const selectProperty = (id: string) => {
    setPropertyId(id);
    // A unit/tenant selection never survives a property switch — both belong to exactly one property.
    setUnitIds([]);
    setTenantIds([]);
  };

  const selectScope = (s: Scope) => {
    setScope(s);
    setUnitIds([]);
    setTenantIds([]);
  };

  const targetErr = validateMaintenanceTarget({ propertyId, scope, unitIds, tenantIds }, units, tenants);
  const errs = {
    title: title.trim() === '' ? 'Title is required.' : '',
    description: description.trim() === '' ? 'Description is required.' : '',
    target: targetErr ?? '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      propertyId,
      scope,
      unitIds: scope === 'units' ? unitIds : [],
      tenantIds: scope === 'tenants' ? tenantIds : [],
      category,
      priority,
      assigneeId: assigneeId === '' ? undefined : assigneeId,
      scheduledDate: scheduledDate === '' ? undefined : scheduledDate,
      estimatedCost: cost.trim() === '' ? 0 : Number(cost),
    });
  };

  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);

  return (
    <Modal title="New Maintenance Request" onClose={onClose} wide>
      <div className="modal-section">
        <h4>Request Details</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="nm-title">Title *</label>
            <input id="nm-title" value={title} onChange={(e) => setTitle(e.target.value)} className={submitted && errs.title !== '' ? 'invalid' : ''} placeholder="AC not cooling" />
            {err(errs.title)}
          </div>
          <div className="field">
            <label htmlFor="nm-prop">Property *</label>
            <select id="nm-prop" value={propertyId} onChange={(e) => selectProperty(e.target.value)}>
              <option value="">Select property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="nm-desc">Description *</label>
          <textarea id="nm-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={submitted && errs.description !== '' ? 'invalid' : ''} placeholder="Describe the issue in detail..." />
          {err(errs.description)}
        </div>
      </div>

      <div className="modal-section">
        <h4>Scope</h4>
        <div className="field">
          <label>What does this request cover? *</label>
          <div className="tabs" role="tablist" aria-label="Request scope">
            {SCOPES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={scope === s.value}
                className={`tab ${scope === s.value ? 'active' : ''}`}
                onClick={() => selectScope(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {scope === 'units' ? (
            <div className="mt-2">
              <MultiSearchSelect
                id="nm-units"
                values={unitIds}
                onChange={setUnitIds}
                options={unitOptions}
                placeholder="Select unit(s)"
                searchPlaceholder="Search units..."
                emptyLabel={propUnits.length === 0 ? 'This property has no units yet' : 'No unit matches that search'}
                invalid={submitted && errs.target !== ''}
              />
            </div>
          ) : null}
          {scope === 'tenants' ? (
            <div className="mt-2">
              <MultiSearchSelect
                id="nm-tenants"
                values={tenantIds}
                onChange={setTenantIds}
                options={tenantOptions}
                placeholder="Select tenant(s)"
                searchPlaceholder="Search by name, email, phone or unit..."
                emptyLabel={propTenants.length === 0 ? 'This property has no tenants yet' : 'No tenant matches that search'}
                invalid={submitted && errs.target !== ''}
              />
            </div>
          ) : null}
          {err(errs.target)}
        </div>
      </div>

      <div className="modal-section">
        <h4>Assignment &amp; Cost</h4>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <div className="field">
            <label htmlFor="nm-cat">Category *</label>
            <select id="nm-cat" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="nm-pri">Priority *</label>
            <select id="nm-pri" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="nm-assign">Assigned To</label>
            <SearchSelect
              id="nm-assign"
              value={assigneeId}
              onChange={setAssigneeId}
              options={staffOptions}
              placeholder="Unassigned"
              searchPlaceholder="Search staff..."
              emptyLabel={activeStaff.length === 0 ? 'No active staff — add one from Manage Staff' : 'No staff matches that search'}
            />
          </div>
          <div className="field">
            <label htmlFor="nm-date">Scheduled Date</label>
            <input id="nm-date" type="date" min={MIN_DATE} max={MAX_DATE} value={scheduledDate} onChange={(e) => { if (isValidIsoDate(e.target.value)) setScheduledDate(e.target.value); }} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="nm-cost">Estimated Cost ($)</label>
          <input id="nm-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="250" />
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>Create Request</button>
      </div>
    </Modal>
  );
}
