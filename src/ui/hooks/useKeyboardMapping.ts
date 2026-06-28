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
  /** Attach listeners in the capture phase so mapped events can be consumed first */
  capture?: boolean;
}

/**
 * Maps computer keyboard keys to actions with repeat prevention and held-key tracking.
 */
export function useKeyboardMapping(options: UseKeyboardMappingOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const heldKeysRef = useRef<Set<string>>(new Set());
  const captureAtMount = useRef(options.capture ?? false);

  useMountEffect(() => {
    const useCapture = captureAtMount.current;

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
      const { enabled, mapping, onKeyUp } = optionsRef.current;
      const key = e.key.toLowerCase();
      const wasHeld = heldKeysRef.current.delete(key);
      const value = mapping[key];
      if (value === undefined || (!enabled && !wasHeld)) return;

      e.preventDefault();
      e.stopPropagation();
      onKeyUp?.(value);
    };

    document.addEventListener('keydown', handleKeyDown, { capture: useCapture });
    document.addEventListener('keyup', handleKeyUp, { capture: useCapture });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: useCapture });
      document.removeEventListener('keyup', handleKeyUp, { capture: useCapture });
      heldKeysRef.current.clear();
    };
  });
}
