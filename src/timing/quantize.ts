/**
 * Quantization utilities.
 *
 * Functions for snapping values to musical grids and converting
 * between different time representations.
 */
import { el, type NodeRepr_t } from '@elemaudio/core';
import type { Signal } from './clock';

/**
 * Note value divisions relative to a whole note.
 */
export const NoteDivision = {
  whole: 1,
  half: 2,
  quarter: 4,
  eighth: 8,
  sixteenth: 16,
  thirtySecond: 32,
  tripletHalf: 3,
  tripletQuarter: 6,
  tripletEighth: 12,
  tripletSixteenth: 24,
  dottedHalf: 1.5,
  dottedQuarter: 3,
  dottedEighth: 6,
} as const;

/**
 * Quantizes a continuous value to the nearest grid point.
 *
 * @param value - The value to quantize
 * @param gridSize - The grid spacing
 * @returns The quantized value
 *
 * @example
 * ```ts
 * // Quantize to quarter notes
 * const quantized = quantize(position, 1);
 *
 * // Quantize to 16th notes
 * const quantized16 = quantize(position, 0.25);
 * ```
 */
export function quantize(value: Signal, gridSize: Signal): NodeRepr_t {
  return el.mul(el.round(el.div(value, gridSize)), gridSize);
}

/**
 * Quantizes a value to the nearest grid point, rounding down.
 *
 * @param value - The value to quantize
 * @param gridSize - The grid spacing
 * @returns The quantized value (always <= input)
 */
export function quantizeFloor(value: Signal, gridSize: Signal): NodeRepr_t {
  return el.mul(el.floor(el.div(value, gridSize)), gridSize);
}

/**
 * Quantizes a value to the nearest grid point, rounding up.
 *
 * @param value - The value to quantize
 * @param gridSize - The grid spacing
 * @returns The quantized value (always >= input)
 */
export function quantizeCeil(value: Signal, gridSize: Signal): NodeRepr_t {
  return el.mul(el.ceil(el.div(value, gridSize)), gridSize);
}

/**
 * Converts beats to milliseconds at a given tempo.
 *
 * @param beats - Number of beats
 * @param bpm - Tempo in beats per minute
 * @returns Duration in milliseconds
 *
 * @example
 * ```ts
 * const delayMs = beatsToMs(0.5, 120); // Half beat at 120 BPM = 250ms
 * ```
 */
export function beatsToMs(beats: Signal, bpm: Signal): NodeRepr_t {
  const msPerBeat = el.div(60000, bpm);
  return el.mul(beats, msPerBeat);
}

/**
 * Converts milliseconds to beats at a given tempo.
 *
 * @param ms - Duration in milliseconds
 * @param bpm - Tempo in beats per minute
 * @returns Number of beats
 */
export function msToBeats(ms: Signal, bpm: Signal): NodeRepr_t {
  const msPerBeat = el.div(60000, bpm);
  return el.div(ms, msPerBeat);
}

/**
 * Converts beats to samples at a given tempo and sample rate.
 *
 * @param beats - Number of beats
 * @param bpm - Tempo in beats per minute
 * @param sampleRate - Sample rate in Hz (default: uses el.sr())
 * @returns Duration in samples
 */
export function beatsToSamples(
  beats: Signal,
  bpm: Signal,
  sampleRate?: Signal
): NodeRepr_t {
  const sr = sampleRate ?? el.sr();
  const samplesPerBeat = el.div(el.mul(sr, 60), bpm);
  return el.mul(beats, samplesPerBeat);
}

/**
 * Converts samples to beats at a given tempo and sample rate.
 *
 * @param samples - Number of samples
 * @param bpm - Tempo in beats per minute
 * @param sampleRate - Sample rate in Hz (default: uses el.sr())
 * @returns Number of beats
 */
export function samplesToBeats(
  samples: Signal,
  bpm: Signal,
  sampleRate?: Signal
): NodeRepr_t {
  const sr = sampleRate ?? el.sr();
  const samplesPerBeat = el.div(el.mul(sr, 60), bpm);
  return el.div(samples, samplesPerBeat);
}

/**
 * Converts bars to beats.
 *
 * @param bars - Number of bars
 * @param beatsPerBar - Beats per bar (time signature numerator)
 * @returns Number of beats
 */
export function barsToBeats(bars: Signal, beatsPerBar: Signal): NodeRepr_t {
  return el.mul(bars, beatsPerBar);
}

/**
 * Converts a note division to beats.
 *
 * @param division - Note division (e.g., NoteDivision.quarter = 4)
 * @param beatsPerBar - Beats per bar (time signature numerator, default: 4)
 * @returns Duration in beats
 *
 * @example
 * ```ts
 * // A quarter note in 4/4 = 1 beat
 * const quarterNote = divisionToBeats(NoteDivision.quarter, 4);
 *
 * // A 16th note in 4/4 = 0.25 beats
 * const sixteenth = divisionToBeats(NoteDivision.sixteenth, 4);
 * ```
 */
export function divisionToBeats(
  division: Signal,
  beatsPerBar: Signal = 4
): NodeRepr_t {
  return el.div(beatsPerBar, division);
}

/**
 * Creates a grid of time points for a given number of steps.
 *
 * This is a pure JavaScript utility (not a signal) for generating
 * step sequences.
 *
 * @param steps - Number of steps
 * @param beatsPerStep - Duration of each step in beats
 * @returns Array of time points in beats
 *
 * @example
 * ```ts
 * // 16 steps, 16th notes each
 * const grid = createGrid(16, 0.25);
 * // [0, 0.25, 0.5, 0.75, 1, 1.25, ...]
 * ```
 */
export function createGrid(steps: number, beatsPerStep: number): number[] {
  return Array.from({ length: steps }, (_, i) => i * beatsPerStep);
}
