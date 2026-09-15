import { formatMoney } from '../../data/mock';
import { Card, Icon } from '../../components/ui';
import { Icons } from '../../components/icons';

export default function MaintenanceStats({
  open,
  inProgress,
  highPriority,
  completed,
  cost,
}: {
  open: number;
  inProgress: number;
  highPriority: number;
  completed: number;
  cost: number;
}) {
  return (
    <div className="grid-4">
      <Card>
        <div className="row">
          <span className="small muted">Open Requests</span>
          <span className="kpi-icon"><Icon d={Icons.wrench} /></span>
        </div>
        <div className="kpi">{open}</div>
        <div className="small"><span className="badge warn">+3 this week</span></div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">In Progress</span>
          <span className="kpi-icon"><Icon d={Icons.chart} /></span>
        </div>
        <div className="kpi">{inProgress}</div>
        <div className="small muted">{highPriority} high priority</div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Completed</span>
          <span className="kpi-icon"><Icon d={Icons.folder} /></span>
        </div>
        <div className="kpi">{completed}</div>
        <div className="small"><span className="badge success">+12 this month</span></div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Estimated Cost</span>
          <span className="kpi-icon"><Icon d={Icons.card} /></span>
        </div>
        <div className="kpi">{formatMoney(cost)}</div>
        <div className="small muted">This month</div>
      </Card>
    </div>
  );
}
