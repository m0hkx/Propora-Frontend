import { useMemo, useState } from 'react';
import { formatMoney } from '../data/mock';
import type { Property } from '../data/mock';
import { Badge, Card, Icon, Progress } from '../components/ui';
import { Icons } from '../components/icons';
import KpiCard from '../components/KpiCard';
import PropertyDetailsModal from './Properties/PropertyDetailsModal';
import AddPropertyModal from './Properties/AddPropertyModal';
import { propertyToDraft } from './Properties/propertyForm';
import type { PropertyDraft } from './Properties/propertyForm';
import { useStore } from '../state/useStore';

type StatusFilter = 'All' | 'Active' | 'Vacant' | 'Maintenance';
type SortKey = 'featured' | 'name' | 'revenue' | 'occupancy';

const gradients = [
  'linear-gradient(135deg,#0F766E,#14B8A6 60%,#5EEAD4)',
  'linear-gradient(135deg,#0369A1,#0EA5E9 60%,#BAE6FD)',
  'linear-gradient(135deg,#134E4A,#0F766E 55%,#F59E0B)',
  'linear-gradient(135deg,#7C3AED,#06B6D4 70%,#A5F3FC)',
  'linear-gradient(135deg,#0F172A,#0369A1 60%,#14B8A6)',
  'linear-gradient(135deg,#475569,#0F766E 65%,#99F6E4)',
];

function tone(s: Property['status']): 'success' | 'warn' | 'danger' {
  return s === 'Active' ? 'success' : s === 'Vacant' ? 'warn' : 'danger';
}

function occupancy(p: Property): number {
  return p.units === 0 ? 0 : Math.round((p.occupied / p.units) * 100);
}

function revenue(p: Property): number {
  return p.occupied * p.rent;
}

const tabs: StatusFilter[] = ['All', 'Active', 'Vacant', 'Maintenance'];

export default function Properties({ query }: { query: string }) {
  const properties = useStore((s) => s.properties);
  const updateProperty = useStore((s) => s.updateProperty);
  const pushToast = useStore((s) => s.pushToast);
  const [status, setStatus] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [sort, setSort] = useState<SortKey>('featured');
  const [selected, setSelected] = useState<Property | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  // Portfolio-wide total: 18 managed + any created in this session.
  const totalProperties = 18 + Math.max(0, properties.length - 6);

  const types = useMemo(() => ['All types', ...Array.from(new Set(properties.map((p) => p.type)))], [properties]);
  const counts = useMemo(
    () => ({
      All: properties.length,
      Active: properties.filter((p) => p.status === 'Active').length,
      Vacant: properties.filter((p) => p.status === 'Vacant').length,
      Maintenance: properties.filter((p) => p.status === 'Under Maintenance').length,
    }),
    [properties]
  );

  const list = useMemo(() => {
    const q = `${query} ${search}`.trim().toLowerCase();
    let out = properties.filter((p) => {
      if (status === 'Active' && p.status !== 'Active') return false;
      if (status === 'Vacant' && p.status !== 'Vacant') return false;
      if (status === 'Maintenance' && p.status !== 'Under Maintenance') return false;
      if (typeFilter !== 'All types' && p.type !== typeFilter) return false;
      if (q && !(p.name + ' ' + p.address + ' ' + p.type).toLowerCase().includes(q)) return false;
      return true;
    });
    out = [...out];
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'revenue') out.sort((a, b) => revenue(b) - revenue(a));
    if (sort === 'occupancy') out.sort((a, b) => occupancy(b) - occupancy(a));
    return out;
  }, [query, search, status, typeFilter, sort, properties]);

  const editing = editId ? properties.find((p) => p.id === editId) ?? null : null;

  const saveEdit = (id: string, d: PropertyDraft, imageUrl: string) => {
    const existing = properties.find((p) => p.id === id);
    if (!existing) return;
    const seed = `custom-${Date.now()}`;
    updateProperty(id, {
      name: d.name,
      address: `${d.address}, ${d.city}`,
      country: d.country === '' ? undefined : d.country,
      type: d.type,
      units: Number(d.units),
      // Base rent stays exactly what the user typed — never recalculated.
      rent: Number(d.baseRent),
      yearBuilt: d.yearBuilt.trim() !== '' ? Number(d.yearBuilt) : existing.yearBuilt,
      image: d.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase(),
      imageUrl: imageUrl === '' ? `https://picsum.photos/seed/${seed}/600/400` : imageUrl,
    });
    setEditId(null);
    pushToast(`Saved changes for ${d.name}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 2. Summary cards (unified KpiCard system) */}
      <div className="grid grid-cols-4 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
        <KpiCard
          icon={Icons.building} tint="teal"
          delta={{ text: '+2.4% vs last month', tone: 'up' }}
          value={totalProperties} format={(n) => Math.round(n).toLocaleString('en-US')}
          label="Total Properties"
          spark={properties.map((p) => p.units)} stagger="sd-1"
        />
        <KpiCard
          icon={Icons.home} tint="blue"
          delta={{ text: '90.1% occupancy', tone: 'flat' }}
          value={128} format={(n) => Math.round(n).toLocaleString('en-US')}
          label="Occupied Units"
          spark={properties.map((p) => p.occupied)} stagger="sd-2"
        />
        <KpiCard
          icon={Icons.key} tint="amber"
          delta={{ text: '-3.2% vs last month', tone: 'down' }}
          value={14} format={(n) => Math.round(n).toLocaleString('en-US')}
          label="Available Units"
          spark={properties.map((p) => p.units - p.occupied)} stagger="sd-3"
        />
        <KpiCard
          icon={Icons.card} tint="amber"
          delta={{ text: '+8.4% vs last month', tone: 'up' }}
          value={124850} format={(n) => '$' + Math.round(n).toLocaleString('en-US')}
          label="Monthly Revenue"
          spark={properties.map((p) => p.occupied * p.rent)} stagger="sd-4"
        />
      </div>

      {/* 3. Filters / controls */}
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap max-md:flex-col max-md:items-stretch">
          <div className="tabs" role="tablist" aria-label="Filter by status">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={status === t}
                onClick={() => setStatus(t)}
                className={`tab ${status === t ? 'active' : ''}`}
              >
                {t === 'All' ? 'All Properties' : t} · {counts[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap flex-auto justify-end max-md:w-full">
            <label className="search search-sm">
              <Icon d={Icons.search} />
              <input
                placeholder="Search properties by name, location, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search properties by name, location, or type"
              />
            </label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by property type" className="max-md:flex-1">
              {types.map((t) => (
                <option key={t} value={t}>{t === 'All types' ? 'Filter' : t}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort properties" className="max-md:flex-1">
              <option value="featured">Sort</option>
              <option value="name">Name A–Z</option>
              <option value="revenue">Revenue high–low</option>
              <option value="occupancy">Occupancy high–low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Properties grid */}
      <div className="row">
        <div><strong>Properties</strong> <span className="small muted">({list.length} of {properties.length})</span></div>
      </div>
      {list.length === 0 ? (
        <Card><p className="muted">No properties match your filters.</p></Card>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-compact:grid-cols-2 max-md:grid-cols-1">
          {list.map((p, i) => {
            const occ = occupancy(p);
            const avail = p.units - p.occupied;
            return (
              <Card key={p.id} className={`prop-card ${selected?.id === p.id ? 'selected' : ''}`}>
                <div className="prop-image" style={{ background: gradients[i % gradients.length] }}>
                  {!failed[p.id] && (
                    <img
                      src={p.imageUrl}
                      alt={`${p.name} photo`}
                      loading="lazy"
                      onError={() => setFailed((f) => ({ ...f, [p.id]: true }))}
                    />
                  )}
                  <span className="prop-initials">{p.image}</span>
                  <span className="z-[2]"><Badge tone={tone(p.status)}>{p.status}</Badge></span>
                </div>
                <div className="prop-body">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="small muted">{p.address}</div>
                    <div className="small muted">{p.type}</div>
                  </div>
                  <div className="row small">
                    <span>{p.units} Units</span>
                    <span>{p.occupied} Occupied</span>
                    <span>{avail} Available</span>
                  </div>
                  <div><strong>{formatMoney(revenue(p))}</strong> <span className="small muted">/ month</span></div>
                  <div>
                    <div className="row small"><span className="muted">Occupancy</span><strong>{occ}%</strong></div>
                    <Progress value={occ} />
                  </div>
                  <div className="row">
                    <Badge tone={tone(p.status)}>{p.status}</Badge>
                    <span className="flex gap-1.5">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditId(p.id)}>
                        Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelected(p)}>
                        View Details →
                      </button>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <PropertyDetailsModal
          property={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditId(selected.id); setSelected(null); }}
        />
      )}

      {editing && (
        <AddPropertyModal
          mode="edit"
          title={`Edit Property — ${editing.name}`}
          initial={propertyToDraft(editing)}
          initialImageUrl={editing.imageUrl}
          onClose={() => setEditId(null)}
          onSubmit={(d, img) => saveEdit(editing.id, d, img)}
        />
      )}
    </div>
  );
}
