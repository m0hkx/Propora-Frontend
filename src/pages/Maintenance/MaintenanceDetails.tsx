import { formatMoney, propertyName, tenantName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStatus } from '../../data/mock';
import { Badge } from '../../components/ui';
import Modal from '../../components/Modal';
import { fmtMDate, priorityTone, statusTone } from './maintenanceUtils';

export default function MaintenanceDetails({
  request,
  onClose,
  onStatusChange,
}: {
  request: MaintenanceRequest;
  onClose: () => void;
  onStatusChange: (status: MaintenanceStatus) => void;
}) {
  const m = request;
  return (
    <Modal title={m.title} onClose={onClose} wide>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <Badge tone={priorityTone(m.priority)}>{m.priority} Priority</Badge>
        <Badge tone={statusTone(m.status)}>{m.status}</Badge>
        <Badge tone="neutral">{m.category}</Badge>
      </div>
      <p style={{ margin: 0 }}>{m.description}</p>
      <div className="list">
        <div className="list-row"><span>Property</span><strong>{propertyName(m.propertyId)}</strong></div>
        <div className="list-row"><span>Unit</span><strong>{m.unit}</strong></div>
        <div className="list-row"><span>Tenant</span><strong>{m.tenantId ? tenantName(m.tenantId) : '—'}</strong></div>
        <div className="list-row"><span>Assigned Technician</span><strong>{m.assignee}</strong></div>
        <div className="list-row"><span>Created Date</span><strong>{fmtMDate(m.reported)}</strong></div>
        <div className="list-row"><span>Scheduled Date</span><strong>{fmtMDate(m.scheduledDate)}</strong></div>
        <div className="list-row"><span>Completed Date</span><strong>{fmtMDate(m.completedDate)}</strong></div>
        <div className="list-row"><span>Estimated Cost</span><strong>{formatMoney(m.estimatedCost)}</strong></div>
        <div className="list-row"><span>Actual Cost</span><strong>{m.actualCost !== undefined ? formatMoney(m.actualCost) : '—'}</strong></div>
      </div>
      <div>
        <strong>Activity</strong>
        <div className="timeline">
          {m.history.map((h, i) => (
            <div key={i} className="timeline-item">
              <span className="timeline-dot" />
              <div><div>{h.text}</div><div className="small muted">{fmtMDate(h.date)}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-foot">
        {m.status === 'Open' ? <button className="btn btn-teal" type="button" onClick={() => onStatusChange('In Progress')}>Start Progress</button> : null}
        {m.status === 'In Progress' ? (
          <button className="btn btn-ghost" type="button" onClick={() => onStatusChange('Open')}>Move back to Open</button>
        ) : null}
        {m.status === 'In Progress' || m.status === 'Scheduled' ? (
          <button className="btn btn-teal" type="button" onClick={() => onStatusChange('Completed')}>Mark Completed</button>
        ) : null}
        {m.status === 'Open' ? (
          <button className="btn btn-ghost" type="button" onClick={() => onStatusChange('Scheduled')}>Schedule</button>
        ) : null}
      </div>
    </Modal>
  );
}
