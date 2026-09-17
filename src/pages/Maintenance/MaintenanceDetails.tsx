import { useState } from 'react';
import { formatMoney, propertyName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStaff, MaintenanceStatus, Tenant, Unit } from '../../data/mock';
import { Badge } from '../../components/ui';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SearchSelect from '../../components/SearchSelect';
import { fmtDate } from '../../lib/format';
import { priorityTone, scopeLabel, statusTone, tenantsLabel } from './maintenanceUtils';

export default function MaintenanceDetails({
  request,
  units,
  tenants,
  staff,
  onClose,
  onStatusChange,
  onAssigneeChange,
}: {
  request: MaintenanceRequest;
  units: Unit[];
  tenants: Tenant[];
  staff: MaintenanceStaff[];
  onClose: () => void;
  onStatusChange: (status: MaintenanceStatus) => void;
  onAssigneeChange: (staffId: string) => void;
}) {
  const m = request;
  const [confirmPause, setConfirmPause] = useState(false);

  // The currently assigned staff member always stays selectable even if since
  // deactivated, so a reassign picker never silently drops the existing pick.
  const assigneeOptions = staff
    .filter((s) => s.status === 'Active' || s.id === m.assigneeId)
    .map((s) => ({ value: s.id, label: s.name, detail: `${s.specialty}${s.status === 'Inactive' ? ' · Inactive' : ''}` }));

  return (
    <Modal title={m.title} onClose={onClose} wide>
      <div className="row flex-wrap">
        <Badge tone={priorityTone(m.priority)}>{m.priority} Priority</Badge>
        <Badge tone={statusTone(m.status)}>{m.status}</Badge>
        <Badge tone="neutral">{m.category}</Badge>
      </div>
      <p className="m-0">{m.description}</p>
      <div className="list">
        <div className="list-row"><span>Property</span><strong>{propertyName(m.propertyId)}</strong></div>
        <div className="list-row"><span>Scope</span><strong>{m.scope === 'property' ? 'Entire Property' : m.scope === 'units' ? 'Specific Unit(s)' : 'Specific Tenant(s)'}</strong></div>
        {m.scope === 'units' ? <div className="list-row"><span>Unit(s)</span><strong>{scopeLabel(m, units)}</strong></div> : null}
        {m.scope === 'tenants' ? <div className="list-row"><span>Tenant(s)</span><strong>{tenantsLabel(m, tenants)}</strong></div> : null}
        <div className="list-row">
          <span>Assigned Technician</span>
          <div className="min-w-[220px]">
            <SearchSelect
              id="md-assignee"
              value={m.assigneeId ?? ''}
              onChange={onAssigneeChange}
              options={assigneeOptions}
              placeholder="Unassigned"
              searchPlaceholder="Search staff..."
              emptyLabel="No staff matches that search"
            />
          </div>
        </div>
        <div className="list-row"><span>Created Date</span><strong>{fmtDate(m.reported, { year: false })}</strong></div>
        <div className="list-row"><span>Scheduled Date</span><strong>{fmtDate(m.scheduledDate, { year: false })}</strong></div>
        <div className="list-row"><span>Completed Date</span><strong>{fmtDate(m.completedDate, { year: false })}</strong></div>
        <div className="list-row"><span>Estimated Cost</span><strong>{formatMoney(m.estimatedCost)}</strong></div>
        <div className="list-row"><span>Actual Cost</span><strong>{m.actualCost !== undefined ? formatMoney(m.actualCost) : '—'}</strong></div>
      </div>
      <div>
        <strong>Activity</strong>
        <div className="timeline">
          {m.history.map((h, i) => (
            <div key={i} className="timeline-item">
              <span className="timeline-dot" />
              <div><div>{h.text}</div><div className="small muted">{fmtDate(h.date, { year: false })}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-foot">
        {m.status === 'Open' ? <button className="btn btn-teal" type="button" onClick={() => onStatusChange('In Progress')}>Start Progress</button> : null}
        {m.status === 'In Progress' ? (
          <button className="btn btn-ghost" type="button" onClick={() => onStatusChange('Open')}>Move back to Open</button>
        ) : null}
        {m.status === 'In Progress' ? (
          <button className="btn btn-ghost" type="button" onClick={() => setConfirmPause(true)}>Pause Progress</button>
        ) : null}
        {m.status === 'Paused' ? (
          <button className="btn btn-teal" type="button" onClick={() => onStatusChange('In Progress')}>Resume Progress</button>
        ) : null}
        {m.status === 'In Progress' || m.status === 'Scheduled' || m.status === 'Paused' ? (
          <button className="btn btn-teal" type="button" onClick={() => onStatusChange('Completed')}>Mark Completed</button>
        ) : null}
        {m.status === 'Open' ? (
          <button className="btn btn-ghost" type="button" onClick={() => onStatusChange('Scheduled')}>Schedule</button>
        ) : null}
      </div>

      {confirmPause && (
        <ConfirmDialog
          title="Pause Maintenance Request"
          message="Pause progress on this request? Its history and any scheduled/cost info stay as-is, and it can be resumed later."
          confirmLabel="Pause Progress"
          onConfirm={() => { setConfirmPause(false); onStatusChange('Paused'); }}
          onCancel={() => setConfirmPause(false)}
        />
      )}
    </Modal>
  );
}
