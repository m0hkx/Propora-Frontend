import { useMemo, useState } from 'react';
import { staffName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStatus } from '../../data/mock';
import { Card } from '../../components/ui';
import { useStore } from '../../state/useStore';
import MaintenanceStats from './MaintenanceStats';
import MaintenanceFilters from './MaintenanceFilters';
import MaintenanceTable from './MaintenanceTable';
import MaintenanceDetails from './MaintenanceDetails';
import StaffModal from './StaffModal';
import { EMPTY_MFILTERS, maintenanceSearchText } from './maintenanceUtils';
import type { MaintenanceFilters as Filters, MaintenanceTab } from './maintenanceUtils';

export default function Maintenance() {
  const updateMaintenance = useStore((s) => s.updateMaintenance);
  const pushToast = useStore((s) => s.pushToast);
  const maintenance = useStore((s) => s.maintenance);
  const properties = useStore((s) => s.properties);
  const units = useStore((s) => s.units);
  const tenants = useStore((s) => s.tenants);
  const staff = useStore((s) => s.staff);
  const [tab, setTab] = useState<MaintenanceTab>('All');
  const [filters, setFilters] = useState<Filters>(EMPTY_MFILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<MaintenanceTab, number> = { All: maintenance.length, Open: 0, 'In Progress': 0, Paused: 0, Scheduled: 0, Completed: 0 };
    for (const m of maintenance) c[m.status]++;
    return c;
  }, [maintenance]);

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
      if (filters.assignee === 'unassigned' && m.assigneeId !== undefined) return false;
      if (filters.assignee !== 'all' && filters.assignee !== 'unassigned' && m.assigneeId !== filters.assignee) return false;
      if (q && !maintenanceSearchText(m, properties, units, tenants, staff).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [maintenance, properties, units, tenants, staff, tab, filters]);

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

  const changeAssignee = (m: MaintenanceRequest, staffId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const assigneeId = staffId === '' ? undefined : staffId;
    updateMaintenance(m.id, {
      assigneeId,
      history: [...m.history, { date: today, text: assigneeId ? `Reassigned to ${staffName(assigneeId, staff)}` : 'Unassigned' }],
    });
    pushToast(assigneeId ? `Assigned to ${staffName(assigneeId, staff)}` : `${m.id} unassigned`);
  };

  return (
    <div className="flex flex-col gap-4">
      <MaintenanceStats
        open={counts.Open}
        inProgress={counts['In Progress']}
        highPriority={highPriority}
        completed={counts.Completed}
        cost={cost}
        maintenance={maintenance}
        properties={properties}
      />

      <MaintenanceFilters
        tab={tab}
        counts={counts}
        filters={filters}
        properties={properties}
        staff={staff}
        onTab={setTab}
        onChange={setFilters}
      />

      <div className="row">
        <div><strong>Maintenance</strong> <span className="small muted">({filtered.length} requests)</span></div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setStaffOpen(true)}>Manage Staff</button>
      </div>

      {filtered.length === 0 ? (
        <Card><p className="muted">No maintenance requests match your filters.</p></Card>
      ) : (
        <MaintenanceTable rows={filtered} units={units} tenants={tenants} staff={staff} onSelect={(m) => setSelectedId(m.id)} />
      )}

      {selected && (
        <MaintenanceDetails
          request={selected}
          units={units}
          tenants={tenants}
          staff={staff}
          onClose={() => setSelectedId(null)}
          onStatusChange={(s) => changeStatus(selected, s)}
          onAssigneeChange={(staffId) => changeAssignee(selected, staffId)}
        />
      )}

      {staffOpen && <StaffModal onClose={() => setStaffOpen(false)} />}
    </div>
  );
}
