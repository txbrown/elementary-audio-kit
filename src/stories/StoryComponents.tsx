import { type CSSProperties, type ReactNode } from 'react';

// Design tokens (matching Knob stories)
export const colors = {
  bg: '#1a1a1a',
  surface: '#242424',
  surfaceAlt: '#2a2a2a',
  border: '#333',
  text: '#fff',
  textMuted: '#808080',
  accent: '#ff5500',
  accentAlt: '#00d084',
  accentBlue: '#00aaff',
};

export const fonts = {
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

/**
 * Container for audio stories
 */
export function StoryContainer({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        padding: 32,
        background: colors.bg,
        minHeight: '100vh',
        color: colors.text,
        fontFamily: fonts.sans,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Start audio button (required for user gesture)
 */
export function StartButton({
  onClick,
  isReady,
}: {
  onClick: () => void;
  isReady: boolean;
}) {
  if (isReady) return null;

  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 32px',
        fontSize: 14,
        fontFamily: fonts.mono,
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: colors.accent,
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'transform 0.1s, opacity 0.1s',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      Start Audio
    </button>
  );
}

/**
 * Section title
 */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Parameter display with label
 */
export function ParamDisplay({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 20,
          fontWeight: 500,
          color: colors.text,
        }}
      >
        {value}
        {unit && (
          <span
            style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Beat indicator light
 */
export function BeatLight({
  active,
  color = colors.accent,
  size = 16,
}: {
  active: boolean;
  color?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: active ? color : colors.surfaceAlt,
        border: `1px solid ${active ? color : colors.border}`,
        boxShadow: active ? `0 0 ${size}px ${color}` : 'none',
        transition: 'all 0.05s',
      }}
    />
  );
}

/**
 * Row of beat indicators
 */
export function BeatRow({
  count,
  active,
  color,
}: {
  count: number;
  active: number;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <BeatLight key={i} active={i === active} color={color} />
      ))}
    </div>
  );
}

/**
 * Step sequencer grid
 */
export function StepGrid({
  pattern,
  currentStep,
  onToggle,
}: {
  pattern: boolean[];
  currentStep: number;
  onToggle?: (index: number) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {pattern.map((active, i) => (
        <button
          key={i}
          onClick={() => onToggle?.(i)}
          style={{
            width: 32,
            height: 32,
            padding: 0,
            border: `1px solid ${i === currentStep ? colors.accent : colors.border}`,
            borderRadius: 2,
            background: active
              ? i === currentStep
                ? colors.accent
                : colors.accentAlt
              : i === currentStep
                ? colors.surfaceAlt
                : colors.surface,
            cursor: onToggle ? 'pointer' : 'default',
            transition: 'background 0.05s',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Card container
 */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 4,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Horizontal stack
 */
export function HStack({
  children,
  gap = 16,
  align = 'center',
  style,
}: {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties['alignItems'];
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: align,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Vertical stack
 */
export function VStack({
  children,
  gap = 16,
  align = 'stretch',
  style,
}: {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties['alignItems'];
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Oscilloscope-style waveform display (placeholder)
 */
export function WaveformDisplay({ width = 200, height = 64 }: { width?: number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
        Waveform
      </span>
    </div>
  );
}
