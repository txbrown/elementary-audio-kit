import { forwardRef, useMemo } from 'react';
import { useKnobDrag, type KnobDragOptions } from './hooks/useKnobDrag';

export interface KnobProps
  extends Omit<KnobDragOptions, 'value' | 'onChange'>,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Rotation range in degrees (default: 270) */
  rotationRange?: number;
  /** Starting angle in degrees from top (default: -135) */
  startAngle?: number;
  /** Render prop for custom knob visualization */
  children?: (state: KnobRenderState) => React.ReactNode;
  /** CSS class when dragging */
  draggingClassName?: string;
}

export interface KnobRenderState {
  /** Current value */
  value: number;
  /** Normalized value (0-1) */
  normalizedValue: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Whether currently being dragged */
  isDragging: boolean;
  /** Min value */
  min: number;
  /** Max value */
  max: number;
}

/**
 * Headless knob component for audio applications.
 *
 * Provides drag interaction, keyboard navigation, and accessibility
 * without imposing any visual styling. Use the render prop to create
 * your own knob visualization.
 *
 * @example
 * ```tsx
 * // Basic usage with inline styles
 * <Knob value={volume} onChange={setVolume}>
 *   {({ rotation }) => (
 *     <div
 *       style={{
 *         width: 48,
 *         height: 48,
 *         borderRadius: '50%',
 *         background: '#333',
 *         transform: `rotate(${rotation}deg)`,
 *       }}
 *     >
 *       <div style={{ width: 2, height: 12, background: '#fff' }} />
 *     </div>
 *   )}
 * </Knob>
 *
 * // With custom styling library
 * <Knob value={freq} onChange={setFreq} min={20} max={20000} curve="logarithmic">
 *   {({ rotation, isDragging }) => (
 *     <StyledKnob $rotation={rotation} $active={isDragging} />
 *   )}
 * </Knob>
 * ```
 */
export const Knob = forwardRef<HTMLDivElement, KnobProps>(function Knob(
  {
    value,
    onChange,
    min = 0,
    max = 1,
    step,
    sensitivity,
    curve,
    disabled,
    rotationRange = 270,
    startAngle = -135,
    children,
    className,
    draggingClassName,
    style,
    ...rest
  },
  ref
) {
  const { knobProps, isDragging } = useKnobDrag({
    value,
    onChange,
    min,
    max,
    step,
    sensitivity,
    curve,
    disabled,
  });

  const normalizedValue = useMemo(
    () => (value - min) / (max - min),
    [value, min, max]
  );

  const rotation = useMemo(
    () => startAngle + normalizedValue * rotationRange,
    [startAngle, normalizedValue, rotationRange]
  );

  const renderState: KnobRenderState = {
    value,
    normalizedValue,
    rotation,
    isDragging,
    min,
    max,
  };

  const combinedClassName = [
    className,
    isDragging && draggingClassName,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div
      ref={ref}
      {...rest}
      {...knobProps}
      className={combinedClassName}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        cursor: disabled ? 'not-allowed' : 'grab',
        ...style,
      }}
    >
      {children?.(renderState)}
    </div>
  );
});

export type { KnobDragOptions } from './hooks/useKnobDrag';
