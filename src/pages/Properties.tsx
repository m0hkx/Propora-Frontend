import { useMemo, useState } from 'react';
import { formatMoney } from '../data/mock';
import type { Property } from '../data/mock';
import { Badge, Card, Icon, Progress } from '../components/ui';
import { Icons } from '../components/icons';
import PropertyDetailsModal from './Properties/PropertyDetailsModal';
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
  const [status, setStatus] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [sort, setSort] = useState<SortKey>('featured');
  const [selected, setSelected] = useState<Property | null>(null);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 2. Summary cards */}
      <div className="grid-4">
        <Card>
          <div className="row">
            <span className="small muted">Total Properties</span>
            <span className="kpi-icon"><Icon d={Icons.building} /></span>
          </div>
          <div className="kpi">{totalProperties}</div>
          <div className="small"><span className="badge success">+2.4% vs last month</span></div>
        </Card>
        <Card>
          <div className="row">
            <span className="small muted">Occupied Units</span>
            <span className="kpi-icon"><Icon d={Icons.home} /></span>
          </div>
          <div className="kpi">128</div>
          <div className="small muted">90.1% occupancy</div>
        </Card>
        <Card>
          <div className="row">
            <span className="small muted">Available Units</span>
            <span className="kpi-icon"><Icon d={Icons.key} /></span>
          </div>
          <div className="kpi">14</div>
          <div className="small"><span className="badge danger">-3.2% vs last month</span></div>
        </Card>
        <Card>
          <div className="row">
            <span className="small muted">Monthly Revenue</span>
            <span className="kpi-icon"><Icon d={Icons.card} /></span>
          </div>
          <div className="kpi">$124,850</div>
          <div className="small"><span className="badge success">+8.4% vs last month</span></div>
        </Card>
      </div>

      {/* 3. Filters / controls */}
      <Card>
        <div className="controls-row">
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
          <div className="controls-side">
            <label className="search search-sm">
              <Icon d={Icons.search} />
              <input
                placeholder="Search properties by name, location, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search properties by name, location, or type"
              />
            </label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by property type">
              {types.map((t) => (
                <option key={t} value={t}>{t === 'All types' ? 'Filter' : t}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort properties">
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
        <div className="prop-grid">
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
                  <span style={{ zIndex: 2 }}><Badge tone={tone(p.status)}>{p.status}</Badge></span>
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
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelected(p)}>
                      View Details →
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <PropertyDetailsModal property={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
