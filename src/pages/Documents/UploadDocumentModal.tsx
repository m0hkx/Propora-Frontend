import { useRef, useState } from 'react';
import { tenants } from '../../data/mock';
import type { DocumentType, Property } from '../../data/mock';
import {
  DOC_ACCEPT,
  MAX_DOC_LABEL,
  docFormatList,
  formatBytes,
  sanitizeFileName,
  validateDocRecord,
  verifyDocFileContent,
} from '../../lib/files';
import Modal from '../../components/Modal';

const TYPES: DocumentType[] = ['Lease', 'Contract', 'Invoice', 'Property Document', 'Tenant Document', 'Maintenance', 'Insurance', 'Legal', 'Other'];

export interface NewDocDraft {
  name: string;
  propertyId: string;
  tenantId?: string;
  type: DocumentType;
  size: string;
  /** Real byte count — enforced again by the storage layer. */
  sizeBytes: number;
  /** Browser-supplied MIME — advisory only, re-checked by the storage layer. */
  mime: string;
}

export default function UploadDocumentModal({
  properties,
  onClose,
  onCreate,
}: {
  properties: Property[];
  onClose: () => void;
  onCreate: (d: NewDocDraft, file: File) => void;
}) {
  const [name, setName] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [tenantId, setTenantId] = useState('');
  const [type, setType] = useState<DocumentType>('Lease');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectSeq = useRef(0);

  const nameInvalid = submitted && name.trim() === '';
  const propertyInvalid = submitted && propertyId === '';
  const uploadInvalid = submitted && (file === null || fileError !== null);

  const resetPicker = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const rejectFile = (reason: string) => {
    // A rejected file is never kept around: no upload, clear message, pick again.
    setFile(null);
    setFileError(reason);
    setVerifying(false);
    resetPicker();
  };

  const handleFile = (picked: File | undefined) => {
    if (!picked) return;
    // Gate 1 (sync): extension allowlist, size limit, MIME mismatch. The
    // picker's `accept` filter is advisory only and bypassable.
    const metaError = validateDocRecord(picked.name, picked.size, picked.type);
    if (metaError) {
      rejectFile(metaError);
      return;
    }
    const token = ++selectSeq.current;
    setFile(picked);
    setFileError(null);
    setVerifying(true);
    if (name.trim() === '') setName(sanitizeFileName(picked.name));
    // Gate 2 (content): magic bytes / OOXML central directory, so a renamed
    // image, archive or executable cannot pass as a document.
    void verifyDocFileContent(picked).then((contentError) => {
      if (selectSeq.current !== token) return;
      if (contentError) rejectFile(contentError);
      else {
        setFileError(null);
        setVerifying(false);
      }
    });
  };

  const removeFile = () => {
    selectSeq.current++;
    setFile(null);
    setFileError(null);
    setVerifying(false);
    resetPicker();
  };

  const submit = () => {
    setSubmitted(true);
    if (name.trim() === '' || propertyId === '') return;
    if (file === null || verifying) {
      if (file === null && fileError === null) setFileError('Select a document file to upload.');
      return;
    }
    if (fileError !== null) return;
    onCreate(
      {
        name: name.trim(),
        propertyId,
        tenantId: tenantId === '' ? undefined : tenantId,
        type,
        size: formatBytes(file.size),
        sizeBytes: file.size,
        mime: file.type,
      },
      file
    );
  };

  return (
    <Modal title="Upload Document" onClose={onClose}>
      <label
        className="upload-zone"
        htmlFor="up-file"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <strong>{file ? sanitizeFileName(file.name) : 'Upload Document File'}</strong>
        {file ? (
          <span className="small muted">{formatBytes(file.size)}{verifying ? ' · Checking file contents…' : ''}</span>
        ) : (
          <span className="small muted">Drag &amp; drop or browse files · single file</span>
        )}
        <span className="small muted">Supported formats: {docFormatList()} · Maximum size: {MAX_DOC_LABEL}</span>
        <input
          id="up-file"
          ref={inputRef}
          type="file"
          hidden
          accept={DOC_ACCEPT}
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
          }}
        />
      </label>
      {fileError !== null ? (
        <p className="field-error m-0" role="alert">{fileError}</p>
      ) : null}
      {file !== null && fileError === null && !verifying ? (
        <div className="row">
          <span className="small muted">Ready to upload</span>
          <button className="link-btn" type="button" onClick={removeFile}>Remove file</button>
        </div>
      ) : null}
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
      {uploadInvalid && fileError === null ? (
        <p className="field-error m-0" role="alert">
          {verifying ? 'Please wait while the file contents are checked.' : 'Select a document file to upload.'}
        </p>
      ) : null}
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-teal" type="button" onClick={submit} disabled={verifying}>
          {verifying ? 'Checking File…' : 'Upload Document'}
        </button>
      </div>
    </Modal>
  );
}
