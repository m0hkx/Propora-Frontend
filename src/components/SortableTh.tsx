import type { SortState } from '../lib/sort';

/**
 * A sortable column header: the whole label is one button, so click, Tab and
 * Enter/Space all work, and `aria-sort` tells assistive tech which column is
 * driving the order. Columns rendered as a plain `<th>` stay visibly inert.
 */
export default function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={`th-sort ${active ? 'is-sorted' : ''}`} onClick={() => onSort(sortKey)}>
        {label}
        <span className="th-sort-arrow" aria-hidden="true">
          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
