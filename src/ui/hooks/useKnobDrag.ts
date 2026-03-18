import { useCallback, useRef, useState } from 'react';
import { useMountEffect } from './useMountEffect';

export interface KnobDragOptions {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 1) */
  max?: number;
  /** Step size for snapping (default: 0 = continuous) */
  step?: number;
  /** Pixels of drag for full range (default: 150) */
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
 */
export function useKnobDrag(options: KnobDragOptions): KnobDragResult {
  const {
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0,
    sensitivity = 150,
    curve = 'linear',
    disabled = false,
  } = options;

  const [isDragging, setIsDragging] = useState(false);

  // Refs for values needed in event handlers — synced at render time (no effect)
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const optionsRef = useRef({ min, max, step, sensitivity, curve });

  // Sync refs at render time — no useEffect needed
  onChangeRef.current = onChange;
  optionsRef.current = { min, max, step, sensitivity, curve };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const { min, max, step, sensitivity, curve } = optionsRef.current;
    const deltaY = startYRef.current - e.clientY;
    const deltaNormalized = deltaY / sensitivity;

    let newNormalized = Math.max(0, Math.min(1, startValueRef.current + deltaNormalized));

    if (curve === 'logarithmic') {
      newNormalized = Math.pow(newNormalized, 2);
    }

    let newValue = newNormalized * (max - min) + min;

    if (step > 0) {
      newValue = Math.round((newValue - min) / step) * step + min;
      newValue = Math.max(min, Math.min(max, newValue));
    }

    onChangeRef.current(newValue);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      e.preventDefault();

      const { min, max, curve } = optionsRef.current;

      let normalizedValue = (value - min) / (max - min);
      if (curve === 'logarithmic') {
        normalizedValue = Math.sqrt(Math.max(0, normalizedValue));
      }

      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startValueRef.current = normalizedValue;

      setIsDragging(true);

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [disabled, value, handlePointerMove, handlePointerUp]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const keyStep = step > 0 ? step : (max - min) / 100;
      const largeStep = step > 0 ? step * 10 : (max - min) / 10;

      let newValue = value;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          newValue = Math.min(max, value + keyStep);
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          newValue = Math.max(min, value - keyStep);
          break;
        case 'PageUp':
          e.preventDefault();
          newValue = Math.min(max, value + largeStep);
          break;
        case 'PageDown':
          e.preventDefault();
          newValue = Math.max(min, value - largeStep);
          break;
        case 'Home':
          e.preventDefault();
          newValue = min;
          break;
        case 'End':
          e.preventDefault();
          newValue = max;
          break;
        default:
          return;
      }

      if (step > 0) {
        newValue = Math.round((newValue - min) / step) * step + min;
        newValue = Math.max(min, Math.min(max, newValue));
      }

      onChange(newValue);
    },
    [disabled, value, onChange, min, max, step]
  );

  // Cleanup on unmount only
  useMountEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  });

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
    isDragging,
  };
}
