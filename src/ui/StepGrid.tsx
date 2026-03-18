import { colors } from './tokens';

export interface StepGridProps {
  pattern: boolean[];
  currentStep: number;
  onToggle?: (index: number) => void;
}

export function StepGrid({ pattern, currentStep, onToggle }: StepGridProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {pattern.map((active, i) => (
        <button
          key={i}
          onClick={() => onToggle?.(i)}
          style={{
            width: 32,
            height: 32,
            padding: 0,
            border: `1px solid ${i === currentStep ? colors.accent : colors.border}`,
            borderRadius: 2,
            background: active
              ? i === currentStep
                ? colors.accent
                : colors.accentAlt
              : i === currentStep
                ? colors.surfaceAlt
                : colors.surface,
            cursor: onToggle ? 'pointer' : 'default',
            transition: 'background 0.05s',
          }}
        />
      ))}
    </div>
  );
}
