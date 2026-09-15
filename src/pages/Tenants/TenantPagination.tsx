export default function TenantPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const numbers: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) numbers.push(i);
  } else {
    numbers.push(1);
    if (page > 3) numbers.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) numbers.push(i);
    if (page < totalPages - 2) numbers.push('…');
    numbers.push(totalPages);
  }

  return (
    <div className="pagination">
      <span className="small muted">Showing {from}–{to} of {total} tenants</span>
      <div className="page-btns">
        <button type="button" className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">←</button>
        {numbers.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={n}
              type="button"
              className={`page-btn ${n === page ? 'active' : ''}`}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          )
        )}
        <button type="button" className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => onPage(page + 1)} aria-label="Next page">→</button>
      </div>
    </div>
  );
}
