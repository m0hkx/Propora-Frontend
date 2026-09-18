import type { KeyboardEvent } from 'react';

/** Keyboard equivalent for a non-button element (table row, card) acting as a button. */
export function onActivateKey(onActivate: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };
}
