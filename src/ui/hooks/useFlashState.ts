import { useCallback, useRef, useState } from 'react';

/**
 * Manages a set of "active" IDs that auto-deactivate after a timeout.
 * Used for visual flash feedback on drum pads (150ms) and piano keys (300ms).
 */
export function useFlashState(duration: number): {
  activeSet: Set<number>;
  flash: (id: number) => void;
} {
  const [activeSet, setActiveSet] = useState<Set<number>>(new Set());
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const flash = useCallback(
    (id: number) => {
      // Activate
      setActiveSet((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      // Clear existing timer for this ID
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);

      // Schedule deactivation
      const timer = setTimeout(() => {
        setActiveSet((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timersRef.current.delete(id);
      }, duration);

      timersRef.current.set(id, timer);
    },
    [duration]
  );

  return { activeSet, flash };
}
