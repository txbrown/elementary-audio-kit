import { type CSSProperties } from 'react';
import { Knob, type KnobProps } from './Knob';
import { colors, fonts } from './tokens';

export interface AudioKnobProps extends Omit<KnobProps, 'children'> {
  label: string;
  valueLabel?: string;
  size?: number;
  accentColor?: string;
  style?: CSSProperties;
}

/**
 * Styled knob that follows elementary-audio-kit's dark, sharp audio UI.
 * Use this when you want the library's opinionated look instead of the
 * headless Knob primitive.
 */
export function AudioKnob({
  label,
  valueLabel,
  size = 54,
  accentColor = colors.accent,
  style,
  ...knobProps
}: AudioKnobProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: size + 16,
        fontFamily: fonts.mono,
        color: colors.text,
        ...style,
      }}
    >
      {valueLabel && (
        <span style={{ fontSize: 10, color: accentColor, lineHeight: 1 }}>
          {valueLabel}
        </span>
      )}
      <Knob {...knobProps}>
        {({ rotation, isDragging }) => (
          <span
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(135deg, ${colors.surfaceAlt}, ${colors.bg})`,
              border: `1px solid ${isDragging ? accentColor : colors.border}`,
              boxShadow: isDragging
                ? `0 0 0 2px ${accentColor}33, 0 0 18px ${accentColor}44`
                : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 20px rgba(0,0,0,0.35)',
            }}
          >
            <span
              style={{
                width: size - 14,
                height: size - 14,
                borderRadius: '50%',
                position: 'relative',
                transform: `rotate(${rotation}deg)`,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
              }}
            >
              <i
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 5,
                  width: 2,
                  height: Math.max(10, size * 0.24),
                  transform: 'translateX(-50%)',
                  borderRadius: 2,
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
            </span>
          </span>
        )}
      </Knob>
      <span
        style={{
          fontSize: 10,
          lineHeight: 1,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
    </label>
  );
}
