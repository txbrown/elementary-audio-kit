import { type CSSProperties, useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { colors, fonts } from './tokens';
import { useKeyboardMapping } from './hooks/useKeyboardMapping';
import { useFlashState } from './hooks/useFlashState';

const DEFAULT_LABELS = [
  'Kick', 'Snare', 'Clap', 'Rim',
  'CH', 'OH', 'Perc 1', 'Perc 2',
  'Tom 1', 'Tom 2', 'Tom 3', 'Tom 4',
  'FX 1', 'FX 2', 'FX 3', 'FX 4',
];

const KEYBOARD_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3,
  q: 4, w: 5, e: 6, r: 7,
  a: 8, s: 9, d: 10, f: 11,
  z: 12, x: 13, c: 14, v: 15,
};

const REVERSE_MAP: Map<number, string> = new Map(
  Object.entries(KEYBOARD_MAP).map(([k, v]) => [v, k.toUpperCase()])
);

export interface DrumPadsProps {
  /** Labels for each pad (default: standard 16-pad GM layout) */
  labels?: string[];
  /** Number of columns in the grid (default: 4) */
  columns?: number;
  /** Indices of pads to highlight */
  highlightedPads?: number[];
  /** Highlight color */
  highlightColor?: string;
  /** Called when a pad is triggered */
  onPadTrigger: (padIndex: number) => void;
  /** Flash duration in ms (default: 150) */
  flashDuration?: number;
  /** Whether keyboard input starts enabled */
  defaultKeyboardEnabled?: boolean;
  style?: CSSProperties;
}

export function DrumPads({
  labels = DEFAULT_LABELS,
  columns = 4,
  highlightedPads,
  highlightColor = colors.accentAlt,
  onPadTrigger,
  flashDuration = 150,
  defaultKeyboardEnabled = false,
  style,
}: DrumPadsProps) {
  const [keyboardEnabled, setKeyboardEnabled] = useState(defaultKeyboardEnabled);
  const { activeSet, flash } = useFlashState(flashDuration);

  const handlePadDown = useCallback(
    (index: number) => {
      onPadTrigger(index);
      flash(index);
    },
    [onPadTrigger, flash]
  );

  // Memoize the mapping object for useKeyboardMapping stability
  const mapping = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [key, index] of Object.entries(KEYBOARD_MAP)) {
      if (index < labels.length) map[key] = index;
    }
    return map;
  }, [labels.length]);

  useKeyboardMapping({
    mapping,
    onKeyDown: handlePadDown,
    enabled: keyboardEnabled,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: fonts.sans,
        ...style,
      }}
    >
      {/* Header with keyboard toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          style={{
            background: keyboardEnabled ? colors.accent : colors.surface,
            border: `1px solid ${keyboardEnabled ? colors.accent : colors.border}`,
            color: keyboardEnabled ? '#fff' : colors.textMuted,
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 16,
            cursor: 'pointer',
            lineHeight: 1,
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            setKeyboardEnabled((prev) => !prev);
          }}
          title="Toggle keyboard input (1234 / QWER / ASDF / ZXCV)"
        >
          <Keyboard size={16} />
        </button>
      </div>

      {/* Pad grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 6,
        }}
      >
        {labels.map((label, index) => {
          const isHighlighted = highlightedPads?.includes(index);
          const isActive = activeSet.has(index);
          const kbLabel = keyboardEnabled ? REVERSE_MAP.get(index) : undefined;

          return (
            <button
              key={index}
              style={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                border: `1px solid ${isHighlighted ? highlightColor : colors.border}`,
                borderRadius: 4,
                background: isActive
                  ? colors.accent
                  : isHighlighted
                    ? `${highlightColor}33`
                    : colors.surface,
                color: isActive ? '#fff' : colors.text,
                fontFamily: fonts.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'background 0.05s',
                padding: 4,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePadDown(index);
              }}
            >
              <span>{label}</span>
              {kbLabel && (
                <span style={{ fontSize: 9, color: colors.textMuted, opacity: 0.7 }}>
                  {kbLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
