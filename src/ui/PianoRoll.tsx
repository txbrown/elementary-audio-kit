import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { colors, fonts } from './tokens';
import { useClockTimer } from './hooks/useClockTimer';
import { PlayButton } from './PlayButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NoteData {
  noteNumber: number;
  velocity: number;
  /** Position in beats (quarter notes) */
  position: number;
  /** Duration in beats */
  duration: number;
}

export interface RowConfig {
  noteNumber: number;
  label: string;
}

export interface PianoRollProps {
  /** Note data to display/edit */
  notes: NoteData[];
  /** Row configuration (note number to label mapping) */
  rows: RowConfig[];
  /** Total length in bars (default: 1) */
  lengthInBars?: number;
  /** Whether editing is enabled (default: false) */
  editable?: boolean;
  /** Default tempo in BPM (default: 120) */
  defaultTempo?: number;
  /** Whether metronome toggle is shown (default: true) */
  showMetronome?: boolean;
  /** Default metronome state (default: false) */
  defaultMetronomeOn?: boolean;
  /** Called when notes are edited */
  onNotesChange?: (notes: NoteData[]) => void;
  /** Called when a note should be played */
  onNotePlay?: (noteNumber: number, durationBeats?: number) => void;
  /** Called when playback starts */
  onPlaybackStart?: () => void;
  /** Called when playback stops */
  onPlaybackStop?: () => void;
  /** Called on each metronome tick (beat boundary) */
  onMetronomeTick?: () => void;
  /** Pixels per 16th-note column (default: 28) */
  cellWidth?: number;
  /** Pixels per row (default: 28) */
  cellHeight?: number;
  style?: CSSProperties;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAG_THRESHOLD = 3;
const MIN_NOTE_DURATION = 0.25; // 1 sixteenth note

/** Snap a beat value to the nearest 16th note. */
function snap16(value: number): number {
  return Math.round(value * 4) / 4;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PianoRoll({
  notes,
  rows,
  lengthInBars = 1,
  editable = false,
  defaultTempo = 120,
  showMetronome = true,
  defaultMetronomeOn = false,
  onNotesChange,
  onNotePlay,
  onPlaybackStart,
  onPlaybackStop,
  onMetronomeTick,
  cellWidth: CELL_W = 28,
  cellHeight: CELL_H = 28,
  style,
}: PianoRollProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(defaultMetronomeOn);
  const [tempo, setTempo] = useState(defaultTempo);

  // Drag state
  const [dragState, setDragState] = useState<{
    noteIdx: number;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    origPosition: number;
    origDuration: number;
    origNoteNumber: number;
    deltaBeats: number;
    deltaRows: number;
    committed: boolean;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const totalColumns = lengthInBars * 16;
  const totalBeats = totalColumns / 4;
  const gridW = totalColumns * CELL_W;
  const gridH = rows.length * CELL_H;

  // Row index lookup
  const noteToRow = useMemo(() => {
    const map = new Map<number, number>();
    rows.forEach((r, i) => map.set(r.noteNumber, i));
    return map;
  }, [rows]);

  // Refs for clock callback
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const onNotePlayRef = useRef(onNotePlay);
  onNotePlayRef.current = onNotePlay;
  const metronomeOnRef = useRef(metronomeOn);
  metronomeOnRef.current = metronomeOn;
  const onMetronomeTickRef = useRef(onMetronomeTick);
  onMetronomeTickRef.current = onMetronomeTick;

  // Clock step callback
  const onStep = useCallback((col: number) => {
    // Metronome on beat boundaries
    if (metronomeOnRef.current && col % 4 === 0 && onMetronomeTickRef.current) {
      onMetronomeTickRef.current();
    }
    // Play notes at this column
    const play = onNotePlayRef.current;
    if (!play) return;
    for (const n of notesRef.current) {
      const noteCol = Math.round(n.position * 4);
      if (noteCol === col) play(n.noteNumber, n.duration);
    }
  }, []);

  const { currentStep, playheadPosition } = useClockTimer(
    { tempo, totalSteps: totalColumns, subdivision: 4, onStep },
    isPlaying
  );

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      onPlaybackStop?.();
    } else {
      setIsPlaying(true);
      onPlaybackStart?.();
    }
  }, [isPlaying, onPlaybackStart, onPlaybackStop]);

  // ------------------------------------------------------------------
  // Grid click: create note
  // ------------------------------------------------------------------
  const handleGridClick = useCallback(
    (e: React.PointerEvent) => {
      if (!editable || dragState?.committed) return;
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const colIdx = Math.floor(x / CELL_W);
      const rowIdx = Math.floor(y / CELL_H);
      if (rowIdx < 0 || rowIdx >= rows.length) return;
      if (colIdx < 0 || colIdx >= totalColumns) return;

      const row = rows[rowIdx];
      const position = colIdx / 4;

      // Check if a note already exists here
      const existing = notes.findIndex(
        (n) =>
          n.noteNumber === row.noteNumber &&
          position >= n.position &&
          position < n.position + n.duration
      );
      if (existing >= 0) return;

      onNotePlay?.(row.noteNumber);
      const updated = [
        ...notes,
        { noteNumber: row.noteNumber, velocity: 110, position, duration: 0.25 },
      ];
      onNotesChange?.(updated);
    },
    [editable, rows, totalColumns, notes, onNotePlay, onNotesChange, dragState, CELL_W, CELL_H]
  );

  // ------------------------------------------------------------------
  // Note click: delete
  // ------------------------------------------------------------------
  const handleNoteClick = useCallback(
    (noteIdx: number) => {
      if (!editable) return;
      const updated = notes.filter((_, i) => i !== noteIdx);
      onNotesChange?.(updated);
    },
    [editable, notes, onNotesChange]
  );

  // ------------------------------------------------------------------
  // Note drag: move / resize
  // ------------------------------------------------------------------
  const handleNotePointerDown = useCallback(
    (e: React.PointerEvent, noteIdx: number, mode: 'move' | 'resize') => {
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();
      const note = notes[noteIdx];
      if (!note) return;

      setDragState({
        noteIdx,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        origPosition: note.position,
        origDuration: note.duration,
        origNoteNumber: note.noteNumber,
        deltaBeats: 0,
        deltaRows: 0,
        committed: false,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [editable, notes]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const committed = dragState.committed || dist > DRAG_THRESHOLD;
      const deltaBeats = snap16(dx / CELL_W / 4);
      const deltaRows = Math.round(dy / CELL_H);
      setDragState((prev) => (prev ? { ...prev, deltaBeats, deltaRows, committed } : null));
    },
    [dragState, CELL_W, CELL_H]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (!dragState.committed) {
        handleNoteClick(dragState.noteIdx);
        setDragState(null);
        return;
      }

      const updated = [...notes];
      const note = { ...updated[dragState.noteIdx] };

      if (dragState.mode === 'move') {
        let newPos = snap16(dragState.origPosition + dragState.deltaBeats);
        newPos = Math.max(0, Math.min(newPos, totalBeats - note.duration));
        const origRow = noteToRow.get(dragState.origNoteNumber) ?? 0;
        let newRow = origRow + dragState.deltaRows;
        newRow = Math.max(0, Math.min(newRow, rows.length - 1));
        note.noteNumber = rows[newRow].noteNumber;
        note.position = newPos;
      } else {
        let newDur = snap16(dragState.origDuration + dragState.deltaBeats);
        newDur = Math.max(MIN_NOTE_DURATION, newDur);
        newDur = Math.min(newDur, totalBeats - note.position);
        note.duration = newDur;
      }

      updated[dragState.noteIdx] = note;
      onNotesChange?.(updated);
      setDragState(null);
    },
    [dragState, notes, totalBeats, noteToRow, rows, onNotesChange, handleNoteClick]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => setIsPlaying(false);
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  function noteStyle(note: NoteData, noteIdx: number): CSSProperties {
    const rowIdx = noteToRow.get(note.noteNumber) ?? 0;
    let left = note.position * 4 * CELL_W;
    let top = rowIdx * CELL_H;
    let width = note.duration * 4 * CELL_W;

    if (dragState && dragState.noteIdx === noteIdx && dragState.committed) {
      if (dragState.mode === 'move') {
        left = (dragState.origPosition + dragState.deltaBeats) * 4 * CELL_W;
        const origRow = noteToRow.get(dragState.origNoteNumber) ?? 0;
        top = (origRow + dragState.deltaRows) * CELL_H;
      } else {
        width = (dragState.origDuration + dragState.deltaBeats) * 4 * CELL_W;
        width = Math.max(CELL_W, width);
      }
    }

    return {
      position: 'absolute',
      left, top: top + 2,
      width: width - 2, height: CELL_H - 4,
    };
  }

  const beatLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i <= totalColumns; i++) {
      if (i % 4 === 0) lines.push(i);
    }
    return lines;
  }, [totalColumns]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: fonts.sans,
        color: colors.text,
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 0',
        }}
      >
        <PlayButton isPlaying={isPlaying} onClick={handleToggle} size={32} />

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

        {showMetronome && (
          <button
            style={{
              background: metronomeOn ? colors.accent : colors.surface,
              border: `1px solid ${metronomeOn ? colors.accent : colors.border}`,
              color: metronomeOn ? '#fff' : colors.textMuted,
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 14,
              cursor: 'pointer',
            }}
            onPointerDown={(e) => { e.preventDefault(); setMetronomeOn((v) => !v); }}
            title="Toggle metronome"
          >
            {metronomeOn ? '🔔' : '🔕'}
          </button>
        )}
      </div>

      {/* Grid area */}
      <div style={{ display: 'flex' }}>
        {/* Row labels */}
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, paddingRight: 8 }}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                height: CELL_H,
                display: 'flex',
                alignItems: 'center',
                fontFamily: fonts.mono,
                fontSize: 10,
                color: colors.textMuted,
                whiteSpace: 'nowrap',
              }}
            >
              {row.label}
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <div
            ref={gridRef}
            style={{ position: 'relative', width: gridW, height: gridH }}
            onPointerDown={editable ? handleGridClick : undefined}
            onPointerMove={dragState ? handlePointerMove : undefined}
            onPointerUp={dragState ? handlePointerUp : undefined}
          >
            {/* Row backgrounds */}
            {rows.map((_, i) => (
              <div
                key={`row-${i}`}
                style={{
                  position: 'absolute',
                  top: i * CELL_H,
                  width: gridW,
                  height: CELL_H,
                  background: i % 2 === 0 ? colors.surface : colors.surfaceAlt,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              />
            ))}

            {/* Beat lines */}
            {beatLines.map((col) => (
              <div
                key={`beat-${col}`}
                style={{
                  position: 'absolute',
                  left: col * CELL_W,
                  top: 0,
                  width: 1,
                  height: gridH,
                  background: colors.border,
                }}
              />
            ))}

            {/* Playhead */}
            {isPlaying && playheadPosition >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: playheadPosition * CELL_W,
                  top: 0,
                  width: 2,
                  height: gridH,
                  background: colors.accent,
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Notes */}
            {notes.map((note, idx) => {
              const isDragging = dragState?.noteIdx === idx && dragState.committed;
              const noteStartCol = Math.round(note.position * 4);
              const noteEndCol = Math.round((note.position + note.duration) * 4);
              const isNoteActive =
                isPlaying && currentStep >= noteStartCol && currentStep < noteEndCol;

              return (
                <div
                  key={idx}
                  style={{
                    ...noteStyle(note, idx),
                    background: isNoteActive ? colors.noteColorActive : colors.noteColor,
                    borderRadius: 2,
                    cursor: editable ? 'grab' : 'default',
                    opacity: isDragging ? 0.7 : 1,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 4,
                    fontSize: 9,
                    fontFamily: fonts.mono,
                    color: colors.bg,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  onPointerDown={
                    editable ? (e) => handleNotePointerDown(e, idx, 'move') : undefined
                  }
                >
                  {note.duration >= 0.75 && (
                    <span>{rows.find((r) => r.noteNumber === note.noteNumber)?.label}</span>
                  )}
                  {/* Resize handle */}
                  {editable && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 8,
                        height: '100%',
                        cursor: 'ew-resize',
                      }}
                      onPointerDown={
                        editable ? (e) => handleNotePointerDown(e, idx, 'resize') : undefined
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const tempoButtonStyle: CSSProperties = {
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
