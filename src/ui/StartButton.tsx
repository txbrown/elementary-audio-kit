import { colors, fonts } from './tokens';

export interface StartButtonProps {
  onClick: () => void;
  isReady: boolean;
  label?: string;
}

export function StartButton({ onClick, isReady, label = 'Start Audio' }: StartButtonProps) {
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
      {label}
    </button>
  );
}
