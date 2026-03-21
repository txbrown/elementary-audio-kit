/**
 * Music Markdown parser.
 *
 * Parses `music` fenced code blocks into structured data.
 * Framework-agnostic — no React, no audio dependencies.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Note name ↔ MIDI conversion
// ---------------------------------------------------------------------------

const NOTE_MAP: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert a note name (C4, F#3, Bb5) or MIDI number string to MIDI number.
 * Returns 60 (middle C) if the input is unparseable.
 */
export function noteNameToMidi(name: string): number {
  const trimmed = name.trim();

  // Try as plain number first
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && String(num) === trimmed) return num;

  const match = trimmed.match(/^([A-Ga-g])([#b]?)(\d+)$/);
  if (!match) return 60;

  const letter = match[1].toUpperCase();
  const accidental = match[2];
  const octave = parseInt(match[3], 10);

  const base = NOTE_MAP[letter] ?? 0;
  const mod = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;

  return (octave + 1) * 12 + base + mod;
}

/**
 * Convert a MIDI number to a note name (e.g. 60 → "C4", 61 → "C#4").
 */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

export interface MusicBlockData {
  /** YAML key-value config (above the --- separator) */
  config: Record<string, string>;
  /** Content lines (below the --- separator) */
  bodyLines: string[];
}

/**
 * Parse a music block's source into config + body.
 * Config lines are YAML-style `key: value`. Body lines follow a `---` separator.
 * Lines starting with `#` are comments.
 */
export function parseMusicBlock(source: string): MusicBlockData {
  const lines = source.split('\n');
  const sepIndex = lines.findIndex((l) => l.trim() === '---');

  const configLines = sepIndex === -1 ? lines : lines.slice(0, sepIndex);
  const bodyLines =
    sepIndex === -1 ? [] : lines.slice(sepIndex + 1).filter((l) => l.trim());

  const config: Record<string, string> = {};
  for (const line of configLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    config[trimmed.slice(0, colonIndex).trim()] = trimmed.slice(colonIndex + 1).trim();
  }

  return { config, bodyLines };
}

// ---------------------------------------------------------------------------
// Note data parsing
// ---------------------------------------------------------------------------

export interface NoteData {
  noteNumber: number;
  velocity: number;
  /** Position in beats (quarter notes) */
  position: number;
  /** Duration in beats */
  duration: number;
}

/**
 * Parse note lines in the format: `<pitch> <position> <duration> [velocity]`
 *
 * Examples:
 * ```
 * C4  0  4
 * E4  0  4  80
 * G4  0  4
 * ```
 */
export function parseNoteLines(lines: string[]): NoteData[] {
  const notes: NoteData[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    notes.push({
      noteNumber: noteNameToMidi(parts[0]),
      position: parseFloat(parts[1]),
      duration: parseFloat(parts[2]),
      velocity: parts[3] ? parseInt(parts[3], 10) : 100,
    });
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Pattern data parsing
// ---------------------------------------------------------------------------

export interface PatternRow {
  label: string;
  steps: boolean[];
  /** Ghost note positions (lower velocity) */
  ghostSteps: boolean[];
}

/**
 * Parse pattern lines in the format: `<label> <steps>`
 *
 * Step characters:
 * - `x` or `X` = hit
 * - `.` = rest
 * - `o` or `O` = ghost note (lower velocity)
 *
 * Examples:
 * ```
 * kick   x . . . x . . . x . . . x . . .
 * snare  . . . . x . . . . . . . x . . .
 * hihat  x . x . x . x . x . x . x . x .
 * ```
 */
export function parsePatternLines(lines: string[]): PatternRow[] {
  const rows: PatternRow[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // First word is label, rest is pattern
    const firstSpace = trimmed.search(/\s/);
    if (firstSpace === -1) continue;

    const label = trimmed.slice(0, firstSpace).trim();
    const patternStr = trimmed.slice(firstSpace).trim();

    // Split on whitespace or parse character by character (support both)
    const chars = patternStr.includes(' ')
      ? patternStr.split(/\s+/)
      : patternStr.split('');

    const steps = chars.map((c) => c === 'x' || c === 'X');
    const ghostSteps = chars.map((c) => c === 'o' || c === 'O');

    rows.push({ label, steps, ghostSteps });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Helper: parse note array from config string
// ---------------------------------------------------------------------------

/**
 * Parse a note list string like `[C4, E4, G4]` or `C4, E4, G4` into MIDI numbers.
 */
export function parseNoteList(value: string): number[] {
  const cleaned = value.replace(/[\[\]]/g, '');
  return cleaned
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(noteNameToMidi);
}

/**
 * Parse a number list string like `[0, 1, 4]` or `0, 1, 4` into numbers.
 */
export function parseNumberList(value: string): number[] {
  const cleaned = value.replace(/[\[\]]/g, '');
  return cleaned
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

// ---------------------------------------------------------------------------
// Helper: derive RowConfig from NoteData
// ---------------------------------------------------------------------------

export interface RowConfig {
  noteNumber: number;
  label: string;
}

/**
 * Derive row configuration from a set of notes.
 * Returns one row per unique note number, sorted ascending, labeled with note names.
 */
export function deriveRows(notes: NoteData[]): RowConfig[] {
  const noteNumbers = new Set(notes.map((n) => n.noteNumber));
  const sorted = Array.from(noteNumbers).sort((a, b) => a - b);
  return sorted.map((nn) => ({ noteNumber: nn, label: midiToNoteName(nn) }));
}

/**
 * Derive the number of bars from note data.
 * Returns the smallest whole number of bars that fits all notes.
 */
export function deriveBars(notes: NoteData[]): number {
  if (notes.length === 0) return 1;
  const maxEnd = Math.max(...notes.map((n) => n.position + n.duration));
  return Math.max(1, Math.ceil(maxEnd / 4));
}
