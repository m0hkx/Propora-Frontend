import { useMemo, useState } from 'react';
import { propertyName, tenantName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStatus } from '../../data/mock';
import { Card } from '../../components/ui';
import { useStore } from '../../state/useStore';
import MaintenanceStats from './MaintenanceStats';
import MaintenanceFilters from './MaintenanceFilters';
import MaintenanceTable from './MaintenanceTable';
import MaintenanceDetails from './MaintenanceDetails';
import { EMPTY_MFILTERS } from './maintenanceUtils';
import type { MaintenanceFilters as Filters, MaintenanceTab } from './maintenanceUtils';

export default function Maintenance() {
  const updateMaintenance = useStore((s) => s.updateMaintenance);
  const pushToast = useStore((s) => s.pushToast);
  const maintenance = useStore((s) => s.maintenance);
  const properties = useStore((s) => s.properties);
  const [tab, setTab] = useState<MaintenanceTab>('All');
  const [filters, setFilters] = useState<Filters>(EMPTY_MFILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<MaintenanceTab, number> = { All: maintenance.length, Open: 0, 'In Progress': 0, Scheduled: 0, Completed: 0 };
    for (const m of maintenance) c[m.status]++;
    return c;
  }, [maintenance]);

  const assignees = useMemo(() => [...new Set(maintenance.map((m) => m.assignee))].sort(), [maintenance]);

  const highPriority = useMemo(
    () => maintenance.filter((m) => m.status === 'In Progress' && (m.priority === 'High' || m.priority === 'Urgent')).length,
    [maintenance]
  );

  const cost = useMemo(() => maintenance.reduce((s, m) => s + m.estimatedCost, 0), [maintenance]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return maintenance.filter((m) => {
      if (tab !== 'All' && m.status !== tab) return false;
      if (filters.status !== 'All' && m.status !== filters.status) return false;
      if (filters.priority !== 'All' && m.priority !== filters.priority) return false;
      if (filters.property !== 'all' && m.propertyId !== filters.property) return false;
      if (filters.category !== 'All' && m.category !== filters.category) return false;
      if (filters.assignee !== 'all' && m.assignee !== filters.assignee) return false;
      if (
        q &&
        !`${m.title} ${propertyName(m.propertyId)} ${m.unit} ${m.tenantId ? tenantName(m.tenantId) : ''} ${m.description}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [maintenance, tab, filters]);

  const selected = selectedId ? maintenance.find((m) => m.id === selectedId) ?? null : null;

  const changeStatus = (m: MaintenanceRequest, status: MaintenanceStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    updateMaintenance(m.id, {
      status,
      scheduledDate: m.scheduledDate ?? (status !== 'Open' ? today : undefined),
      completedDate: status === 'Completed' ? today : undefined,
      actualCost: status === 'Completed' ? m.actualCost ?? m.estimatedCost : m.actualCost,
      history: [...m.history, { date: today, text: `Status changed to ${status}` }],
    });
    pushToast(`${m.id} marked as ${status}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MaintenanceStats
        open={counts.Open}
        inProgress={counts['In Progress']}
        highPriority={highPriority}
        completed={counts.Completed}
        cost={cost}
      />

      <MaintenanceFilters
        tab={tab}
        counts={counts}
        filters={filters}
        properties={properties}
        assignees={assignees}
        onTab={setTab}
        onChange={setFilters}
      />

      {filtered.length === 0 ? (
        <Card><p className="muted">No maintenance requests match your filters.</p></Card>
      ) : (
        <MaintenanceTable rows={filtered} onSelect={(m) => setSelectedId(m.id)} />
      )}

      {selected && (
        <MaintenanceDetails
          request={selected}
          onClose={() => setSelectedId(null)}
          onStatusChange={(s) => changeStatus(selected, s)}
        />
      )}
    </div>
  );
}
