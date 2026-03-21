import { useCallback, useRef, useState } from 'react';
import { colors, fonts } from './tokens';
import { StepGrid } from './StepGrid';
import { PlayButton } from './PlayButton';
import { useClockTimer } from './hooks/useClockTimer';

export interface PatternPlayerRow {
  label: string;
  steps: boolean[];
}

export interface PatternPlayerProps {
  /** Rows of step data (label + boolean steps) */
  rows: PatternPlayerRow[];
  /** Tempo in BPM (default: 120) */
  defaultTempo?: number;
  /** Allow step toggling (default: false) */
  editable?: boolean;
  /** Called when a row triggers during playback */
  onRowTrigger?: (rowIndex: number) => void;
  /** Called when steps change (editable mode) */
  onRowsChange?: (rows: PatternPlayerRow[]) => void;
  style?: React.CSSProperties;
}

/**
 * Step sequencer grid with playback.
 * Renders multiple StepGrid rows with labels, play/stop, and tempo control.
 */
export function PatternPlayer({
  rows,
  defaultTempo = 120,
  editable = false,
  onRowTrigger,
  onRowsChange,
  style,
}: PatternPlayerProps) {
  const [tempo, setTempo] = useState(defaultTempo);
  const onRowTriggerRef = useRef(onRowTrigger);
  onRowTriggerRef.current = onRowTrigger;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const totalSteps = rows[0]?.steps.length ?? 16;

  const onStep = useCallback((step: number) => {
    const currentRows = rowsRef.current;
    for (let i = 0; i < currentRows.length; i++) {
      if (currentRows[i].steps[step]) {
        onRowTriggerRef.current?.(i);
      }
    }
  }, []);

  const clock = useClockTimer(
    { tempo, totalSteps, subdivision: 4, onStep },
  );

  const handleToggle = useCallback(() => {
    if (clock.isRunning) {
      clock.stop();
    } else {
      clock.start();
    }
  }, [clock]);

  const handleToggleStep = useCallback(
    (rowIndex: number, stepIndex: number) => {
      if (!editable || !onRowsChange) return;
      const updated = rows.map((row, i) => {
        if (i !== rowIndex) return row;
        const newSteps = [...row.steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        return { ...row, steps: newSteps };
      });
      onRowsChange(updated);
    },
    [editable, rows, onRowsChange]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: fonts.sans,
        color: colors.text,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlayButton isPlaying={clock.isRunning} onClick={handleToggle} size={32} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            style={tempoButtonStyle}
            onPointerDown={(e) => { e.preventDefault(); setTempo((t) => Math.max(20, t - 5)); }}
          >
            -
          </button>
          <span style={{ fontFamily: fonts.mono, fontSize: 12, minWidth: 60, textAlign: 'center' }}>
            {tempo} BPM
          </span>
          <button
            style={tempoButtonStyle}
            onPointerDown={(e) => { e.preventDefault(); setTempo((t) => Math.min(300, t + 5)); }}
          >
            +
          </button>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textMuted,
              minWidth: 60,
              textAlign: 'right',
            }}
          >
            {row.label}
          </span>
          <StepGrid
            pattern={row.steps}
            currentStep={clock.currentStep}
            onToggle={editable ? (stepIndex) => handleToggleStep(rowIndex, stepIndex) : undefined}
          />
        </div>
      ))}
    </div>
  );
}

const tempoButtonStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  borderRadius: 3,
  width: 24,
  height: 24,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};
