import { useMemo, useState } from 'react';
import { propertyName, tenantName } from '../../data/mock';
import type { DocFile } from '../../data/mock';
import { Badge, Card } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useStore } from '../../state/useStore';
import DocumentStats from './DocumentStats';
import DocumentFilters from './DocumentFilters';
import DocumentTable from './DocumentTable';
import type { DocAction } from './DocumentTable';
import DocumentDetails from './DocumentDetails';
import { EMPTY_FILTERS, docSearchText, docStatusTone, filtersActive, matchesDateFilter } from './documentUtils';
import type { DocFilters } from './documentUtils';

export default function Documents() {
  const updateDocument = useStore((s) => s.updateDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const pushToast = useStore((s) => s.pushToast);
  const documents = useStore((s) => s.documents);
  const properties = useStore((s) => s.properties);
  const [filters, setFilters] = useState<DocFilters>(EMPTY_FILTERS);
  const [grouped, setGrouped] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startEdit, setStartEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);

  const tenantIds = useMemo(() => {
    const seen = new Set<string>();
    for (const d of documents) if (d.tenantId) seen.add(d.tenantId);
    return [...seen];
  }, [documents]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return documents.filter((d) => {
      if (filters.property !== 'all' && d.propertyId !== filters.property) return false;
      if (filters.type !== 'All Types' && d.type !== filters.type) return false;
      if (filters.tenant !== 'all' && d.tenantId !== filters.tenant) return false;
      if (filters.status !== 'All' && d.status !== filters.status) return false;
      if (!matchesDateFilter(d.uploadDate, filters.date, now)) return false;
      if (q && !docSearchText(d, propertyName(d.propertyId), d.tenantId ? tenantName(d.tenantId) : '').includes(q)) return false;
      return true;
    });
  }, [documents, filters, now]);

  const openDetails = (d: DocFile, edit: boolean) => {
    setSelectedId(d.id);
    setStartEdit(edit);
  };

  const onAction = (a: DocAction, d: DocFile) => {
    if (a === 'view' || a === 'edit' || a === 'move') openDetails(d, a !== 'view');
    else if (a === 'download') pushToast(`Download started: ${d.name} (mock)`);
    else if (a === 'archive') {
      updateDocument(d.id, { status: 'Archived' });
      pushToast(`Archived: ${d.name}`);
    } else {
      setDeleteId(d.id);
    }
  };

  const deleted = deleteId ? documents.find((d) => d.id === deleteId) ?? null : null;

  const confirmDelete = () => {
    if (!deleted) return;
    deleteDocument(deleted.id);
    pushToast(`Deleted: ${deleted.name}`);
    if (selectedId === deleted.id) setSelectedId(null);
    setDeleteId(null);
  };

  const selected = selectedId ? documents.find((d) => d.id === selectedId) ?? null : null;

  const groups = useMemo(
    () =>
      properties
        .map((p) => ({ property: p, docs: filtered.filter((d) => d.propertyId === p.id) }))
        .filter((g) => g.docs.length > 0),
    [properties, filtered]
  );

  return (
    <div className="flex flex-col gap-4">
      <DocumentStats
        total={documents.length}
        propertyDocs={documents.filter((d) => d.type === 'Property Document').length}
        leases={documents.filter((d) => d.type === 'Lease').length}
        expiring={documents.filter((d) => d.status === 'Expiring Soon').length}
        documents={documents}
        properties={properties}
      />

      <DocumentFilters
        filters={filters}
        properties={properties}
        tenantIds={tenantIds}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="row">
        <div className="tabs" role="tablist" aria-label="Documents view">
          <button type="button" role="tab" aria-selected={!grouped} className={`tab ${!grouped ? 'active' : ''}`} onClick={() => setGrouped(false)}>
            All Documents
          </button>
          <button type="button" role="tab" aria-selected={grouped} className={`tab ${grouped ? 'active' : ''}`} onClick={() => setGrouped(true)}>
            Documents by Property
          </button>
        </div>
        {filtersActive(filters) ? <span className="small muted">{filtered.length} of {documents.length} match</span> : null}
      </div>

      {!grouped ? (
        filtered.length === 0 ? (
          <Card><p className="muted">No documents match your filters.</p></Card>
        ) : (
          <DocumentTable rows={filtered} onAction={onAction} />
        )
      ) : (
        <div className="flex flex-col gap-4">
          {groups.length === 0 ? (
            <Card><p className="muted">No documents match your filters.</p></Card>
          ) : (
            groups.map((g) => (
              <Card key={g.property.id}>
                <div className="row">
                  <div>
                    <button type="button" className="link-btn" onClick={() => { setFilters({ ...filters, property: g.property.id }); setGrouped(false); }}>
                      <strong>{g.property.name}</strong>
                    </button>
                    <div className="small muted">{g.property.address}</div>
                  </div>
                  <Badge tone="neutral">{g.docs.length} documents</Badge>
                </div>
                <div className="list">
                  {g.docs.slice(0, 6).map((d) => (
                    <div key={d.id} className="list-row cursor-pointer" onClick={() => openDetails(d, false)}>
                      <span>{d.name}</span>
                      <span className="flex gap-1.5 items-center">
                        <Badge tone="neutral">{d.type}</Badge>
                        <Badge tone={docStatusTone(d.status)}>{d.status}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
                {g.docs.length > 6 ? (
                    <button type="button" className="link-btn mt-2" onClick={() => { setFilters({ ...filters, property: g.property.id }); setGrouped(false); }}>
                    View all {g.docs.length} →
                  </button>
                ) : null}
              </Card>
            ))
          )}
        </div>
      )}

      {selected && (
        <DocumentDetails
          doc={selected}
          properties={properties}
          startEditing={startEdit}
          onClose={() => setSelectedId(null)}
          onSave={(patch) => {
            updateDocument(selected.id, patch);
            pushToast(`Saved: ${patch.name ?? selected.name}`);
          }}
          onDownload={() => pushToast(`Preview is mocked — no file storage yet (${selected.name})`)}
          onArchive={() => {
            updateDocument(selected.id, { status: 'Archived' });
            pushToast(`Archived: ${selected.name}`);
            setSelectedId(null);
          }}
          onDelete={() => setDeleteId(selected.id)}
        />
      )}

      {deleted && (
        <ConfirmDialog
          title="Delete Document"
          message={`Delete document ${deleted.name}? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
