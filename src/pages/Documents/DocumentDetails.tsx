import { useState } from 'react';
import { propertyName, tenantName, tenants } from '../../data/mock';
import type { DocFile, DocumentStatus, DocumentType, Property } from '../../data/mock';
import { Badge } from '../../components/ui';
import Modal from '../../components/Modal';
import { docStatusTone, fmtDocDate } from './documentUtils';

const TYPES: DocumentType[] = ['Lease', 'Contract', 'Invoice', 'Property Document', 'Tenant Document', 'Maintenance', 'Insurance', 'Legal', 'Other'];
const STATUSES: DocumentStatus[] = ['Active', 'Expiring Soon', 'Expired', 'Archived'];

export default function DocumentDetails({
  doc,
  properties,
  startEditing,
  onClose,
  onSave,
  onDownload,
  onArchive,
  onDelete,
}: {
  doc: DocFile;
  properties: Property[];
  startEditing: boolean;
  onClose: () => void;
  onSave: (patch: Partial<DocFile>) => void;
  onDownload: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [form, setForm] = useState({
    name: doc.name,
    type: doc.type,
    propertyId: doc.propertyId,
    tenantId: doc.tenantId ?? '',
    leaseId: doc.leaseId ?? '',
    status: doc.status,
    expirationDate: doc.expirationDate ?? '',
    description: doc.description,
  });

  const save = () => {
    if (form.name.trim() === '') return;
    onSave({
      name: form.name.trim(),
      type: form.type,
      propertyId: form.propertyId,
      tenantId: form.tenantId === '' ? undefined : form.tenantId,
      leaseId: form.leaseId.trim() === '' ? undefined : form.leaseId.trim(),
      status: form.status,
      expirationDate: form.expirationDate === '' ? undefined : form.expirationDate,
      description: form.description,
    });
    setEditing(false);
  };

  return (
    <Modal title={editing ? 'Edit Document' : doc.name} onClose={onClose} wide>
      {!editing ? (
        <>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Badge tone="neutral">{doc.type}</Badge>
            <Badge tone={docStatusTone(doc.status)}>{doc.status}</Badge>
          </div>
          <div className="list">
            <div className="list-row"><span>Property</span><strong>{propertyName(doc.propertyId)}</strong></div>
            {doc.unit ? <div className="list-row"><span>Unit</span><strong>{doc.unit}</strong></div> : null}
            {doc.tenantId ? <div className="list-row"><span>Tenant</span><strong>{tenantName(doc.tenantId)}</strong></div> : null}
            {doc.leaseId ? <div className="list-row"><span>Lease</span><strong>{doc.leaseId}</strong></div> : null}
            <div className="list-row"><span>Uploaded By</span><strong>{doc.uploadedBy}</strong></div>
            <div className="list-row"><span>Upload Date</span><strong>{fmtDocDate(doc.uploadDate)}</strong></div>
            <div className="list-row"><span>Expiration Date</span><strong>{fmtDocDate(doc.expirationDate)}</strong></div>
            <div className="list-row"><span>Size</span><strong>{doc.size}</strong></div>
          </div>
          <p className="small muted" style={{ margin: 0 }}>{doc.description}</p>
          <div className="modal-foot">
            <button className="btn btn-ghost" type="button" onClick={onDownload}>View Document</button>
            <button className="btn btn-ghost" type="button" onClick={onDownload}>Download</button>
            <button className="btn btn-teal" type="button" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </>
      ) : (
        <>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="dd-name">Document Name *</label>
              <input id="dd-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={form.name.trim() === '' ? 'invalid' : ''} />
              {form.name.trim() === '' ? <span className="field-error">Document name is required.</span> : null}
            </div>
            <div className="field">
              <label htmlFor="dd-type">Document Type</label>
              <select id="dd-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dd-prop">Property (Move / Assign)</label>
              <select id="dd-prop" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dd-tenant">Tenant</label>
              <select id="dd-tenant" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
                <option value="">No tenant</option>
                {tenants.slice(0, 30).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dd-status">Status</label>
              <select id="dd-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DocumentStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dd-exp">Expiration Date</label>
              <input id="dd-exp" type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="dd-desc">Description</label>
            <textarea id="dd-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" type="button" onClick={onArchive}>Archive</button>
            <button className="btn btn-ghost" type="button" onClick={onDelete}>Delete</button>
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-teal" type="button" onClick={save}>Save changes</button>
          </div>
        </>
      )}
    </Modal>
  );
}
