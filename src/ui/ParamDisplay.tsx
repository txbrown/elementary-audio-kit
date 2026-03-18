import { colors, fonts } from './tokens';

export interface ParamDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
}

export function ParamDisplay({ label, value, unit }: ParamDisplayProps) {
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
          <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
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
