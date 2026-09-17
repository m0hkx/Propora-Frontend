import { useState } from 'react';
import { tenants } from '../../data/mock';
import type { DocumentType, Property } from '../../data/mock';
import Modal from '../../components/Modal';

const TYPES: DocumentType[] = ['Lease', 'Contract', 'Invoice', 'Property Document', 'Tenant Document', 'Maintenance', 'Insurance', 'Legal', 'Other'];

export interface NewDocDraft {
  name: string;
  propertyId: string;
  tenantId?: string;
  type: DocumentType;
  size: string;
}

export default function UploadDocumentModal({
  properties,
  onClose,
  onCreate,
}: {
  properties: Property[];
  onClose: () => void;
  onCreate: (d: NewDocDraft) => void;
}) {
  const [name, setName] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [tenantId, setTenantId] = useState('');
  const [type, setType] = useState<DocumentType>('Lease');
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const nameInvalid = submitted && name.trim() === '';
  const propertyInvalid = submitted && propertyId === '';

  const submit = () => {
    setSubmitted(true);
    if (name.trim() === '' || propertyId === '') return;
    onCreate({
      name: name.trim(),
      propertyId,
      tenantId: tenantId === '' ? undefined : tenantId,
      type,
      size: '1.0 MB',
    });
  };

  return (
    <Modal title="Upload Document" onClose={onClose}>
      <label className="upload-zone" htmlFor="up-file">
        <strong>{fileName === '' ? 'Upload Document File' : fileName}</strong>
        <span className="small muted">Drag &amp; drop or browse files (mocked)</span>
        <input
          id="up-file"
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFileName(f.name);
              if (name.trim() === '') setName(f.name);
            }
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="field">
          <label htmlFor="up-name">Document Name *</label>
          <input id="up-name" value={name} onChange={(e) => setName(e.target.value)} className={nameInvalid ? 'invalid' : ''} placeholder="Lease Agreement - Unit 204" />
          {nameInvalid ? <span className="field-error">Document name is required.</span> : null}
        </div>
        <div className="field">
          <label htmlFor="up-prop">Property *</label>
          <select id="up-prop" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={propertyInvalid ? 'invalid' : ''}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {propertyInvalid ? <span className="field-error">Property is required.</span> : null}
        </div>
        <div className="field">
          <label htmlFor="up-type">Document Type</label>
          <select id="up-type" value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="up-tenant">Tenant (optional)</label>
          <select id="up-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">No tenant</option>
            {tenants.slice(0, 30).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit}>Upload Document</button>
      </div>
    </Modal>
  );
}
