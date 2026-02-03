import { useCallback, useRef, useEffect } from 'react';

export interface KnobDragOptions {
  /** Current value (0-1 normalized) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 1) */
  max?: number;
  /** Pixels of drag for full range (default: 200) */
  sensitivity?: number;
  /** Value curve: 'linear' | 'logarithmic' (default: 'linear') */
  curve?: 'linear' | 'logarithmic';
  /** Disabled state */
  disabled?: boolean;
}

export interface KnobDragResult {
  /** Props to spread on the knob element */
  knobProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex: number;
    role: string;
    'aria-valuenow': number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-disabled': boolean | undefined;
  };
  /** Whether the knob is currently being dragged */
  isDragging: boolean;
}

/**
 * Hook for knob drag interaction.
 *
 * Provides pointer and keyboard handling for rotary knob controls.
 * Follows ARIA slider pattern for accessibility.
 *
 * @example
 * ```tsx
 * const { knobProps, isDragging } = useKnobDrag({
 *   value: volume,
 *   onChange: setVolume,
 *   min: 0,
 *   max: 1,
 * });
 *
 * return <div {...knobProps} className={isDragging ? 'active' : ''} />;
 * ```
 */
export function useKnobDrag(options: KnobDragOptions): KnobDragResult {
  const {
    value,
    onChange,
    min = 0,
    max = 1,
    sensitivity = 200,
    curve = 'linear',
    disabled = false,
  } = options;

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  // Convert between normalized (0-1) and actual value
  const normalize = useCallback(
    (val: number) => (val - min) / (max - min),
    [min, max]
  );

  const denormalize = useCallback(
    (normalized: number) => normalized * (max - min) + min,
    [min, max]
  );

  // Apply curve transformation
  const applyCurve = useCallback(
    (normalized: number): number => {
      if (curve === 'logarithmic') {
        // Attempt logarithmic scaling for frequency-like values
        return Math.pow(normalized, 2);
      }
      return normalized;
    },
    [curve]
  );

  const applyInverseCurve = useCallback(
    (normalized: number): number => {
      if (curve === 'logarithmic') {
        return Math.sqrt(Math.max(0, normalized));
      }
      return normalized;
    },
    [curve]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      e.preventDefault();
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startValueRef.current = applyInverseCurve(normalize(value));

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, value, normalize, applyInverseCurve]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = startYRef.current - e.clientY;
      const deltaNormalized = deltaY / sensitivity;
      const newNormalized = Math.max(
        0,
        Math.min(1, startValueRef.current + deltaNormalized)
      );

      const newValue = denormalize(applyCurve(newNormalized));
      onChange(newValue);
    },
    [sensitivity, denormalize, applyCurve, onChange]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const step = (max - min) / 100;
      const largeStep = (max - min) / 10;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          onChange(Math.min(max, value + step));
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          onChange(Math.max(min, value - step));
          break;
        case 'PageUp':
          e.preventDefault();
          onChange(Math.min(max, value + largeStep));
          break;
        case 'PageDown':
          e.preventDefault();
          onChange(Math.max(min, value - largeStep));
          break;
        case 'Home':
          e.preventDefault();
          onChange(min);
          break;
        case 'End':
          e.preventDefault();
          onChange(max);
          break;
      }
    },
    [disabled, value, onChange, min, max]
  );

  // Global event listeners for drag
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    knobProps: {
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
      tabIndex: disabled ? -1 : 0,
      role: 'slider',
      'aria-valuenow': value,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-disabled': disabled || undefined,
    },
    isDragging: isDraggingRef.current,
  };
}
