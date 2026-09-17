import type { MaintenanceRequest, Property } from '../../data/mock';
import { Icons } from '../../components/icons';
import KpiCard from '../../components/KpiCard';
import { spreadByProperty } from '../../lib/stats';

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
const fmtMoney = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export default function MaintenanceStats({
  open,
  inProgress,
  highPriority,
  completed,
  cost,
  maintenance,
  properties,
}: {
  open: number;
  inProgress: number;
  highPriority: number;
  completed: number;
  cost: number;
  maintenance: MaintenanceRequest[];
  properties: Property[];
}) {
  const byProp = (list: MaintenanceRequest[]) => spreadByProperty(properties, list, (m) => m.propertyId);
  return (
    <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
      <KpiCard
        icon={Icons.wrench} tint="amber"
        delta={{ text: '+3 this week', tone: 'warn' }}
        value={open} format={fmtInt}
        label="Open Requests"
        spark={byProp(maintenance.filter((m) => m.status === 'Open'))} stagger="sd-1"
      />
      <KpiCard
        icon={Icons.chart} tint="blue"
        delta={{ text: `${highPriority} high priority`, tone: 'flat' }}
        value={inProgress} format={fmtInt}
        label="In Progress"
        spark={byProp(maintenance.filter((m) => m.status === 'In Progress'))} stagger="sd-2"
      />
      <KpiCard
        icon={Icons.folder} tint="teal"
        delta={{ text: '+12 this month', tone: 'up' }}
        value={completed} format={fmtInt}
        label="Completed"
        spark={byProp(maintenance.filter((m) => m.status === 'Completed'))} stagger="sd-3"
      />
      <KpiCard
        icon={Icons.card} tint="amber"
        delta={{ text: 'This month', tone: 'flat' }}
        value={cost} format={fmtMoney}
        label="Estimated Cost"
        spark={spreadByProperty(properties, maintenance, (m) => m.propertyId, (m) => m.estimatedCost)} stagger="sd-4"
      />
    </div>
  );
}
