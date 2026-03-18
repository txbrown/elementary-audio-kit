import { type CSSProperties, type ReactNode } from 'react';

export interface HStackProps {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties['alignItems'];
  style?: CSSProperties;
}

export function HStack({ children, gap = 16, align = 'center', style }: HStackProps) {
  return (
    <div style={{ display: 'flex', alignItems: align, gap, ...style }}>
      {children}
    </div>
  );
}
