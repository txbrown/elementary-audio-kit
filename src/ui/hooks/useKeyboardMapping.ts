import { useEffect, useRef } from 'react';

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
 * Used by DrumPads (1234/QWER/ASDF/ZXCV) and PianoKeys (ASDFGHJKL + WETYUOP).
 */
export function useKeyboardMapping({
  mapping,
  onKeyDown,
  onKeyUp,
  enabled,
  extraKeys,
}: UseKeyboardMappingOptions): void {
  const heldKeysRef = useRef<Set<string>>(new Set());
  const onKeyDownRef = useRef(onKeyDown);
  const onKeyUpRef = useRef(onKeyUp);
  const extraKeysRef = useRef(extraKeys);

  onKeyDownRef.current = onKeyDown;
  onKeyUpRef.current = onKeyUp;
  extraKeysRef.current = extraKeys;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Check extra keys first (e.g. octave shift)
      const extra = extraKeysRef.current?.[key];
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

      if (heldKeysRef.current.has(key)) return; // prevent key repeat
      heldKeysRef.current.add(key);
      onKeyDownRef.current(value);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      heldKeysRef.current.delete(key);

      const value = mapping[key];
      if (value === undefined) return;
      onKeyUpRef.current?.(value);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      heldKeysRef.current.clear();
    };
  }, [enabled, mapping]);
}
