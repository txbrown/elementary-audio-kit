import { BeatLight } from './BeatLight';

export interface BeatRowProps {
  count: number;
  active: number;
  color?: string;
}

export function BeatRow({ count, active, color }: BeatRowProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <BeatLight key={i} active={i === active} color={color} />
      ))}
    </div>
  );
}
