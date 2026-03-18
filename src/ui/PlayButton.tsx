import { type CSSProperties } from 'react';
import { colors } from './tokens';

export interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  size?: number;
  activeColor?: string;
  style?: CSSProperties;
}

export function PlayButton({
  isPlaying,
  onClick,
  size = 48,
  activeColor = colors.accent,
  style,
}: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${isPlaying ? activeColor : colors.border}`,
        background: isPlaying ? activeColor : colors.surface,
        color: isPlaying ? '#fff' : colors.text,
        fontSize: size * 0.4,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.1s',
        padding: 0,
        ...style,
      }}
    >
      {isPlaying ? '■' : '▶'}
    </button>
  );
}
