import { useEffect, useState } from 'react';
import LogoMark from './Logo';
import FloorPlan from './FloorPlan';

/** After this long the wait is almost certainly the API waking from sleep. */
const SLOW_AFTER_MS = 6000;

/**
 * Shown while the app checks whether the visitor is signed in. On the free
 * API host that check can take up to a minute after a quiet period, so a slow
 * wait explains itself instead of looking stuck.
 */
export default function LoadingScreen() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="loader-screen">
      <div className="loader-brand">
        <div className="brand-mark"><LogoMark /></div>
        <span className="brand-name font-bold">Propora</span>
      </div>

      <div className="loader-center" role="status" aria-live="polite">
        <FloorPlan className="loader-plan" rooms />
        <p className="loader-message">Checking your sign-in</p>
        {/* Space is reserved up front so the plan doesn't jump when the note appears. */}
        <div className="loader-note-slot">
          {slow ? (
            <p className="loader-note">
              The server is waking up after a quiet period. The first visit can take up to a minute.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
