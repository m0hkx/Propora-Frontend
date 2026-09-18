import { useStore } from '../state/useStore';
import { Icon } from './ui';
import { Icons } from './icons';

export default function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-check" aria-hidden="true"><Icon d={Icons.check} /></span>
          <span>{t.message}</span>
          <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)}>
            <Icon d={Icons.close} />
          </button>
        </div>
      ))}
    </div>
  );
}
