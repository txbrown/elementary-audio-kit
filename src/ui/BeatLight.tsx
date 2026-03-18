import { colors } from './tokens';

export interface BeatLightProps {
  active: boolean;
  color?: string;
  size?: number;
}

export function BeatLight({ active, color = colors.accent, size = 16 }: BeatLightProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: active ? color : colors.surfaceAlt,
        border: `1px solid ${active ? color : colors.border}`,
        transition: 'background 0.05s, border-color 0.05s',
      }}
    />
  );
}
