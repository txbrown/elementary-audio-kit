import { type CSSProperties } from 'react';
import { colors, fonts } from './tokens';
import { BeatLight } from './BeatLight';
import { PlayButton } from './PlayButton';

export interface TransportProps {
  /** Tempo in BPM */
  tempo: number;
  /** Beats per bar (default: 4) */
  beatsPerBar?: number;
  /** Whether currently playing */
  isPlaying: boolean;
  /** Current beat index (0-based, -1 = stopped) */
  currentBeat: number;
  /** Called when play/stop is toggled */
  onToggle: () => void;
  /** Whether to show loop indicator */
  loop?: boolean;
  style?: CSSProperties;
}

/**
 * Controlled transport bar with play/stop, beat dots, and tempo display.
 * The host manages the clock — this component just renders state.
 */
export function Transport({
  tempo,
  beatsPerBar = 4,
  isPlaying,
  currentBeat,
  onToggle,
  loop,
  style,
}: TransportProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 4,
        fontFamily: fonts.sans,
        ...style,
      }}
    >
      <PlayButton isPlaying={isPlaying} onClick={onToggle} size={36} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.text }}>
          {tempo} BPM
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <BeatLight
            key={i}
            active={isPlaying && currentBeat === i}
            size={12}
          />
        ))}
      </div>

      {loop && (
        <span style={{ fontSize: 16, color: colors.textMuted }}>⟳</span>
      )}
    </div>
  );
}
