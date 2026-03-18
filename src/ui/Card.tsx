import { type CSSProperties, type ReactNode } from 'react';
import { colors } from './tokens';

export interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Card({ children, style }: CardProps) {
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
