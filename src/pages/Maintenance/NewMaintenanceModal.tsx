import { useState } from 'react';
import { tenants } from '../../data/mock';
import type { MaintenanceRequest, Property } from '../../data/mock';
import Modal from '../../components/Modal';

type Category = MaintenanceRequest['category'];
type Priority = MaintenanceRequest['priority'];

const CATEGORIES: Category[] = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Cleaning', 'General', 'Other'];

export interface NewMaintenanceDraft {
  title: string;
  description: string;
  propertyId: string;
  unit: string;
  tenantId?: string;
  category: Category;
  priority: Priority;
  assignee: string;
  scheduledDate?: string;
  estimatedCost: number;
}

export default function NewMaintenanceModal({
  properties,
  assignees,
  onClose,
  onCreate,
}: {
  properties: Property[];
  assignees: string[];
  onClose: () => void;
  onCreate: (d: NewMaintenanceDraft) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [unit, setUnit] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [category, setCategory] = useState<Category>('Plumbing');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assignee, setAssignee] = useState('Unassigned');
  const [scheduledDate, setScheduledDate] = useState('');
  const [cost, setCost] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errs = {
    title: title.trim() === '' ? 'Title is required.' : '',
    description: description.trim() === '' ? 'Description is required.' : '',
    property: propertyId === '' ? 'Property is required.' : '',
    unit: unit.trim() === '' ? 'Unit is required.' : '',
    category: category === ('' as Category) ? 'Category is required.' : '',
  };
  const invalid = Object.values(errs).some((e) => e !== '');

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      propertyId,
      unit: unit.trim(),
      tenantId: tenantId === '' ? undefined : tenantId,
      category,
      priority,
      assignee,
      scheduledDate: scheduledDate === '' ? undefined : scheduledDate,
      estimatedCost: cost.trim() === '' ? 0 : Number(cost),
    });
  };

  const err = (msg: string) => (submitted && msg !== '' ? <span className="field-error">{msg}</span> : null);

  return (
    <Modal title="New Maintenance Request" onClose={onClose} wide>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="nm-title">Title *</label>
          <input id="nm-title" value={title} onChange={(e) => setTitle(e.target.value)} className={submitted && errs.title !== '' ? 'invalid' : ''} placeholder="AC not cooling" />
          {err(errs.title)}
        </div>
        <div className="field">
          <label htmlFor="nm-unit">Unit *</label>
          <input id="nm-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className={submitted && errs.unit !== '' ? 'invalid' : ''} placeholder="A-204" />
          {err(errs.unit)}
        </div>
      </div>
      <div className="field">
        <label htmlFor="nm-desc">Description *</label>
        <textarea id="nm-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={submitted && errs.description !== '' ? 'invalid' : ''} placeholder="Describe the issue in detail..." />
        {err(errs.description)}
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="nm-prop">Property *</label>
          <select id="nm-prop" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={submitted && errs.property !== '' ? 'invalid' : ''}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err(errs.property)}
        </div>
        <div className="field">
          <label htmlFor="nm-tenant">Tenant (optional)</label>
          <select id="nm-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">No tenant</option>
            {tenants.slice(0, 30).map((t) => <option key={t.id} value={t.id}>{t.name} · {t.unit}</option>)}
          </select>
        </div>
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
          <select id="nm-assign" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="Unassigned">Unassigned</option>
            {assignees.filter((a) => a !== 'Unassigned').map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="nm-date">Scheduled Date</label>
          <input id="nm-date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="nm-cost">Estimated Cost ($)</label>
        <input id="nm-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="250" />
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>Create Request</button>
      </div>
    </Modal>
  );
}
