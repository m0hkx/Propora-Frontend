import { Card, Icon } from '../../components/ui';
import { Icons } from '../../components/icons';

export default function DocumentStats({
  total,
  propertyDocs,
  leases,
  expiring,
}: {
  total: number;
  propertyDocs: number;
  leases: number;
  expiring: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
      <Card>
        <div className="row">
          <span className="small muted">All Docs</span>
          <span className="kpi-icon"><Icon d={Icons.folder} /></span>
        </div>
        <div className="kpi">{total}</div>
        <div className="small muted">Across portfolio</div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Properties</span>
          <span className="kpi-icon"><Icon d={Icons.building} /></span>
        </div>
        <div className="kpi">{propertyDocs}</div>
        <div className="small muted">Property documents</div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Leases</span>
          <span className="kpi-icon"><Icon d={Icons.lease} /></span>
        </div>
        <div className="kpi">{leases}</div>
        <div className="small muted">Lease agreements</div>
      </Card>
      <Card>
        <div className="row">
          <span className="small muted">Expiring</span>
          <span className="kpi-icon"><Icon d={Icons.bell} /></span>
        </div>
        <div className="kpi">{expiring}</div>
        <div className="small"><span className="badge warn">Needs attention</span></div>
      </Card>
    </div>
  );
}
