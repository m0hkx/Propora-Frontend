import { useMemo, useState } from 'react';
import { staffName } from '../../data/mock';
import type { MaintenanceRequest, MaintenanceStatus } from '../../data/mock';
import { Card } from '../../components/ui';
import EmptyState from '../../components/EmptyState';
import { Icons } from '../../components/icons';
import { useStore } from '../../state/useStore';
import MaintenanceStats from './MaintenanceStats';
import MaintenanceFilters from './MaintenanceFilters';
import MaintenanceTable from './MaintenanceTable';
import MaintenanceDetails from './MaintenanceDetails';
import StaffModal from './StaffModal';
import { EMPTY_MFILTERS, maintenanceSearchText } from './maintenanceUtils';
import type { MaintenanceFilters as Filters, MaintenanceTab } from './maintenanceUtils';

export default function Maintenance() {
  const updateMaintenanceStatus = useStore((s) => s.updateMaintenanceStatus);
  const updateMaintenanceAssignee = useStore((s) => s.updateMaintenanceAssignee);
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

  const changeStatus = async (m: MaintenanceRequest, status: MaintenanceStatus) => {
    try {
      await updateMaintenanceStatus(m.id, status);
      pushToast(`${m.id} marked as ${status}`);
    } catch (error) {
      console.error(error);
      pushToast(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const changeAssignee = async (m: MaintenanceRequest, staffId: string) => {
    const assigneeId = staffId === '' ? undefined : staffId;
    try {
      await updateMaintenanceAssignee(m.id, assigneeId);
      pushToast(assigneeId ? `Assigned to ${staffName(assigneeId, staff)}` : `${m.id} unassigned`);
    } catch (error) {
      console.error(error);
      pushToast(error instanceof Error ? error.message : 'Failed to update assignee');
    }
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
        <Card>
          <EmptyState
            icon={Icons.wrench}
            title="No requests found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        </Card>
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
