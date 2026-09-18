import type { ReactNode } from 'react';
import { Icon } from './ui';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
      <span className="kpi-chip tint-teal" aria-hidden="true"><Icon d={icon} /></span>
      <div className="font-display font-bold">{title}</div>
      {description ? <p className="small muted m-0 max-w-[380px]">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
