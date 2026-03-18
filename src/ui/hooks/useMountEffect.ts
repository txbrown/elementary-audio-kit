import { useEffect, useRef } from 'react';

/**
 * Runs a callback once on mount, with optional cleanup on unmount.
 * This is the ONLY allowed useEffect pattern — all other reactive
 * behavior should use event handlers, refs, or derived state.
 */
export function useMountEffect(callback: () => void | (() => void)): void {
  const calledRef = useRef(false);

  useEffect(() => {
    // StrictMode double-mount guard
    if (calledRef.current) return;
    calledRef.current = true;
    return callback();
  }, []);
}
