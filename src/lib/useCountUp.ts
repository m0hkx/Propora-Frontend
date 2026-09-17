import { useEffect, useRef, useState } from 'react';

/**
 * Eased count-up for hero metrics. Jumps straight to the target under
 * prefers-reduced-motion. Pair with tabular numerals (.tnum) so the
 * value doesn't jitter horizontally while animating.
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useCountUp(target: number, opts: { duration?: number; decimals?: number } = {}): number {
  const { duration = 900, decimals = 0 } = opts;
  // Reduced-motion users start at the final value; no animation runs at all.
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const raf = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((target * eased).toFixed(decimals)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);

  return value;
}
