/**
 * Converts a DAW-style MIDI clip into step patterns for Elementary Audio sequencing.
 *
 * This bridges the gap between DAW clip formats (array of note events with
 * position/duration) and Elementary's `el.seq2` pattern arrays.
 */

/**
 * A MIDI note event in a clip.
 */
export type ClipNote = {
  /** MIDI note number (0–127) */
  noteNumber: number;
  /** Velocity (0–1 normalized, or 0–127 raw) */
  velocity: number;
  /** Start position in beats */
  position: number;
  /** Duration in beats */
  duration: number;
};

/**
 * Convert a clip's note events into per-pitch step patterns.
 *
 * Each pitch gets an array of step values where:
 * - 0 = no note at this step
 * - >0 = velocity at this step (used as trigger amplitude)
 *
 * @param notes - Array of clip note events
 * @param steps - Total number of steps (e.g. 16 for one bar of 16ths)
 * @param clipLengthBeats - Length of the clip in beats (default: steps/4, assuming 16th resolution)
 * @returns Map of MIDI note number → step pattern array
 */
export function clipToPatterns(
  notes: ClipNote[],
  steps: number = 16,
  clipLengthBeats: number = steps / 4
): Record<number, number[]> {
  const patterns: Record<number, number[]> = {};
  const beatsPerStep = clipLengthBeats / steps;

  for (const note of notes) {
    if (!patterns[note.noteNumber]) {
      patterns[note.noteNumber] = Array(steps).fill(0);
    }

    const stepIndex = Math.round(note.position / beatsPerStep);
    if (stepIndex >= 0 && stepIndex < steps) {
      // Normalize velocity to 0–1 if it's in 0–127 range
      const vel = note.velocity > 1 ? note.velocity / 127 : note.velocity;
      patterns[note.noteNumber]![stepIndex] = vel;
    }
  }

  return patterns;
}
