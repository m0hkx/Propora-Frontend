import type { DocFile, Property } from '../../data/mock';
import { Icons } from '../../components/icons';
import KpiCard from '../../components/KpiCard';
import { spreadByProperty } from '../../lib/stats';

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function DocumentStats({
  total,
  propertyDocs,
  leases,
  expiring,
  documents,
  properties,
}: {
  total: number;
  propertyDocs: number;
  leases: number;
  expiring: number;
  documents: DocFile[];
  properties: Property[];
}) {
  const byProp = (list: DocFile[]) => spreadByProperty(properties, list, (d) => d.propertyId);
  return (
    <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
      <KpiCard
        icon={Icons.folder} tint="teal"
        value={total} format={fmtInt}
        label="All Docs" sub="Across portfolio"
        spark={byProp(documents)} stagger="sd-1"
      />
      <KpiCard
        icon={Icons.building} tint="blue"
        value={propertyDocs} format={fmtInt}
        label="Properties" sub="Property documents"
        spark={byProp(documents.filter((d) => d.type === 'Property Document'))} stagger="sd-2"
      />
      <KpiCard
        icon={Icons.lease} tint="amber"
        value={leases} format={fmtInt}
        label="Leases" sub="Lease agreements"
        spark={byProp(documents.filter((d) => d.type === 'Lease'))} stagger="sd-3"
      />
      <KpiCard
        icon={Icons.bell} tint="rose"
        delta={{ text: 'Needs attention', tone: 'warn' }}
        value={expiring} format={fmtInt}
        label="Expiring"
        spark={byProp(documents.filter((d) => d.status === 'Expiring Soon'))} stagger="sd-4"
      />
    </div>
  );
}
