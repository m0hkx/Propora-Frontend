import type { ReactNode } from 'react';
import { onActivateKey } from '../lib/a11y';

/**
 * Shared visual shell for the mobile-card fallback every table renders
 * below `max-md`. Content stays per-table; only the card chrome + the
 * click/keyboard activation are unified here.
 */
export default function MobileRowCard({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-chip border border-[#F1F5F9] bg-white p-3 cursor-pointer"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={onActivateKey(onSelect)}
    >
      {children}
    </div>
  );
}
