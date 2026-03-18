import React, { type CSSProperties, useCallback, useMemo, useState } from 'react';
import { colors, fonts } from './tokens';
import { useKeyboardMapping } from './hooks/useKeyboardMapping';
import { useFlashState } from './hooks/useFlashState';

interface KeyDef {
  note: string;
  isBlack: boolean;
  semitone: number;
}

const OCTAVE_KEYS: KeyDef[] = [
  { note: 'C', isBlack: false, semitone: 0 },
  { note: 'C#', isBlack: true, semitone: 1 },
  { note: 'D', isBlack: false, semitone: 2 },
  { note: 'D#', isBlack: true, semitone: 3 },
  { note: 'E', isBlack: false, semitone: 4 },
  { note: 'F', isBlack: false, semitone: 5 },
  { note: 'F#', isBlack: true, semitone: 6 },
  { note: 'G', isBlack: false, semitone: 7 },
  { note: 'G#', isBlack: true, semitone: 8 },
  { note: 'A', isBlack: false, semitone: 9 },
  { note: 'A#', isBlack: true, semitone: 10 },
  { note: 'B', isBlack: false, semitone: 11 },
];

const WHITE_KEYS_PER_OCTAVE = 7;

const BLACK_KEY_POSITIONS: Record<number, number> = {
  1: 0.75, 3: 1.75, 6: 3.75, 8: 4.75, 10: 5.75,
};

/** Semitone offset → keyboard key mapping */
const KEYBOARD_MAP: Record<string, number> = {
  a: 0, s: 2, d: 4, f: 5, g: 7, h: 9, j: 11,
  k: 12, l: 14, ';': 16, "'": 17,
  w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15,
};

const REVERSE_MAP: Map<number, string> = new Map(
  Object.entries(KEYBOARD_MAP).map(([k, v]) => [
    v,
    k === ';' ? ';' : k === "'" ? "'" : k.toUpperCase(),
  ])
);

export interface PianoKeysProps {
  /** Number of octaves to display (default: 2) */
  octaves?: number;
  /** Starting MIDI note (default: 60 = C4) */
  startNote?: number;
  /** MIDI notes to highlight */
  highlightedNotes?: number[];
  /** Highlight color */
  highlightColor?: string;
  /** Called when a note starts */
  onNoteOn: (midiNote: number) => void;
  /** Called when a note ends */
  onNoteOff: (midiNote: number) => void;
  /** Hold duration in ms (default: 300) */
  holdDuration?: number;
  /** Whether keyboard starts enabled */
  defaultKeyboardEnabled?: boolean;
  /** Initial keyboard octave (default: 4) */
  defaultKeyboardOctave?: number;
  style?: CSSProperties;
}

export function PianoKeys({
  octaves = 2,
  startNote = 60,
  highlightedNotes,
  highlightColor = colors.accentAlt,
  onNoteOn,
  onNoteOff,
  holdDuration = 300,
  defaultKeyboardEnabled = false,
  defaultKeyboardOctave = 4,
  style,
}: PianoKeysProps) {
  const [keyboardEnabled, setKeyboardEnabled] = useState(defaultKeyboardEnabled);
  const [keyboardOctave, setKeyboardOctave] = useState(defaultKeyboardOctave);
  const { activeSet, flash } = useFlashState(holdDuration);

  const totalWhiteKeys = WHITE_KEYS_PER_OCTAVE * octaves;

  const handleNoteOn = useCallback(
    (midiNote: number) => {
      onNoteOn(midiNote);
      flash(midiNote);
    },
    [onNoteOn, flash]
  );

  // Build keyboard mapping from offset → MIDI note
  const kbMapping = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [key, offset] of Object.entries(KEYBOARD_MAP)) {
      map[key] = keyboardOctave * 12 + 12 + offset;
    }
    return map;
  }, [keyboardOctave]);

  const extraKeys = useMemo(
    () => ({
      z: () => setKeyboardOctave((o) => Math.max(1, o - 1)),
      x: () => setKeyboardOctave((o) => Math.min(7, o + 1)),
    }),
    []
  );

  useKeyboardMapping({
    mapping: kbMapping,
    onKeyDown: handleNoteOn,
    onKeyUp: onNoteOff,
    enabled: keyboardEnabled,
    extraKeys,
  });

  // Build key elements
  const whiteKeyEls: React.ReactElement[] = [];
  const blackKeyEls: React.ReactElement[] = [];

  for (let oct = 0; oct < octaves; oct++) {
    for (const keyDef of OCTAVE_KEYS) {
      const midiNote = startNote + oct * 12 + keyDef.semitone;
      const isActive = activeSet.has(midiNote);
      const isHighlighted = highlightedNotes?.includes(midiNote);

      // Keyboard shortcut label
      const offset = midiNote - (keyboardOctave * 12 + 12);
      const kbLabel =
        keyboardEnabled && offset >= 0 && offset <= 17
          ? REVERSE_MAP.get(offset)
          : undefined;

      if (!keyDef.isBlack) {
        whiteKeyEls.push(
          <button
            key={midiNote}
            style={{
              flex: 1,
              height: 120,
              background: isActive
                ? colors.whiteKeyActive
                : isHighlighted
                  ? highlightColor
                  : colors.whiteKey,
              border: `1px solid ${colors.border}`,
              borderRadius: '0 0 4px 4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 6,
              fontSize: 9,
              fontFamily: fonts.mono,
              color: colors.textMuted,
              transition: 'background 0.05s',
              position: 'relative',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleNoteOn(midiNote);
            }}
            onPointerUp={() => onNoteOff(midiNote)}
            onPointerLeave={() => onNoteOff(midiNote)}
          >
            {kbLabel && <span>{kbLabel}</span>}
            {oct === 0 && keyDef.semitone === 0 && !kbLabel && (
              <span>C{Math.floor(startNote / 12) - 1}</span>
            )}
          </button>
        );
      } else {
        const pos = BLACK_KEY_POSITIONS[keyDef.semitone];
        if (pos === undefined) continue;
        const leftPercent = ((oct * WHITE_KEYS_PER_OCTAVE + pos) / totalWhiteKeys) * 100;

        blackKeyEls.push(
          <button
            key={midiNote}
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              width: `${(0.55 / totalWhiteKeys) * 100}%`,
              height: 72,
              background: isActive
                ? colors.blackKeyActive
                : isHighlighted
                  ? highlightColor
                  : colors.blackKey,
              border: `1px solid ${colors.border}`,
              borderRadius: '0 0 3px 3px',
              cursor: 'pointer',
              zIndex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 4,
              fontSize: 8,
              fontFamily: fonts.mono,
              color: isHighlighted ? colors.text : colors.textMuted,
              transition: 'background 0.05s',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleNoteOn(midiNote);
            }}
            onPointerUp={() => onNoteOff(midiNote)}
            onPointerLeave={() => onNoteOff(midiNote)}
          >
            {kbLabel && <span>{kbLabel}</span>}
          </button>
        );
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: fonts.sans,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        {keyboardEnabled && (
          <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
            C{keyboardOctave}
            <button
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                borderRadius: 3,
                padding: '2px 6px',
                fontSize: 10,
                cursor: 'pointer',
                marginLeft: 4,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                setKeyboardOctave((o) => Math.max(1, o - 1));
              }}
            >
              Z
            </button>
            <button
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                borderRadius: 3,
                padding: '2px 6px',
                fontSize: 10,
                cursor: 'pointer',
                marginLeft: 2,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                setKeyboardOctave((o) => Math.min(7, o + 1));
              }}
            >
              X
            </button>
          </span>
        )}
        <button
          style={{
            background: keyboardEnabled ? colors.accent : colors.surface,
            border: `1px solid ${keyboardEnabled ? colors.accent : colors.border}`,
            color: keyboardEnabled ? '#fff' : colors.textMuted,
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 16,
            cursor: 'pointer',
            lineHeight: 1,
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            setKeyboardEnabled((prev) => !prev);
          }}
          title="Toggle keyboard input (ASDF = notes, Z/X = octave)"
        >
          ⌨
        </button>
      </div>

      {/* Keyboard */}
      <div style={{ position: 'relative', display: 'flex' }}>
        {whiteKeyEls}
        {blackKeyEls}
      </div>
    </div>
  );
}
