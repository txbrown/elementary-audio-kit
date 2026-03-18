import { type CSSProperties, type ReactNode } from 'react';

export interface VStackProps {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties['alignItems'];
  style?: CSSProperties;
}

export function VStack({ children, gap = 16, align = 'stretch', style }: VStackProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap, ...style }}>
      {children}
    </div>
  );
}
