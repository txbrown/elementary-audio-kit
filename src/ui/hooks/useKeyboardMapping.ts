import { useRef } from 'react';
import { useMountEffect } from './useMountEffect';

export interface UseKeyboardMappingOptions {
  /** Lowercase key → value mapping (e.g. { 'a': 0, 's': 1 }) */
  mapping: Record<string, number>;
  /** Called when a mapped key is pressed */
  onKeyDown: (value: number) => void;
  /** Called when a mapped key is released */
  onKeyUp?: (value: number) => void;
  /** Whether keyboard input is active */
  enabled: boolean;
  /** Extra key handlers (e.g. { 'z': () => shiftDown(), 'x': () => shiftUp() }) */
  extraKeys?: Record<string, () => void>;
}

/**
 * Maps computer keyboard keys to actions with repeat prevention and held-key tracking.
 * Listeners are added on mount and removed on unmount. The `enabled` flag is checked
 * via ref inside the handler — no effect needed for enable/disable toggling.
 */
export function useKeyboardMapping(options: UseKeyboardMappingOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const heldKeysRef = useRef<Set<string>>(new Set());

  useMountEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { enabled, mapping, onKeyDown, extraKeys } = optionsRef.current;
      if (!enabled) return;

      const key = e.key.toLowerCase();

      const extra = extraKeys?.[key];
      if (extra) {
        e.preventDefault();
        e.stopPropagation();
        extra();
        return;
      }

      const value = mapping[key];
      if (value === undefined) return;

      e.preventDefault();
      e.stopPropagation();

      if (heldKeysRef.current.has(key)) return;
      heldKeysRef.current.add(key);
      onKeyDown(value);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { mapping, onKeyUp } = optionsRef.current;
      const key = e.key.toLowerCase();
      heldKeysRef.current.delete(key);

      const value = mapping[key];
      if (value === undefined) return;
      onKeyUp?.(value);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      heldKeysRef.current.clear();
    };
  });
}
