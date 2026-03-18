/**
 * Re-exports from @elementary-audio-kit/ui for backward compatibility.
 * Stories can continue importing from here — all components now live in src/ui/.
 */

export { colors, fonts } from '../ui/tokens';
export { HStack } from '../ui/HStack';
export { VStack } from '../ui/VStack';
export { Card } from '../ui/Card';
export { BeatLight } from '../ui/BeatLight';
export { BeatRow } from '../ui/BeatRow';
export { ParamDisplay } from '../ui/ParamDisplay';
export { StepGrid } from '../ui/StepGrid';
export { StartButton } from '../ui/StartButton';
export { PlayButton } from '../ui/PlayButton';

// Story-only helpers that didn't get promoted

import { type ReactNode } from 'react';
import { colors, fonts } from '../ui/tokens';

export function StoryContainer({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
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
