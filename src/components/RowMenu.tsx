export interface RowMenuAction {
  key: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

/**
 * The "⋮" trigger + dropdown action list shared by every row-action menu
 * (Tenants/Maintenance/Documents tables). Open/close state stays with the
 * caller since some tables track it per-row and some track a single open id.
 */
export default function RowMenu({
  label,
  open,
  onToggle,
  actions,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  actions: RowMenuAction[];
}) {
  return (
    <div className="row-menu-wrap">
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="row-menu" role="menu">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              role="menuitem"
              className={`row-menu-item ${a.danger ? 'danger' : ''}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
