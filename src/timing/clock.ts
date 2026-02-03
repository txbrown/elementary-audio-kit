/**
 * Clock and timing utilities for Elementary Audio.
 *
 * These functions create signals for musical time - beat clocks,
 * bar counters, and position tracking.
 */
import { el, type NodeRepr_t } from '@elemaudio/core';

/** A node or number that can be used as a signal */
export type Signal = NodeRepr_t | number;

/**
 * Creates a beat clock signal that emits pulses at the given BPM.
 *
 * The output is a pulse train (0 to 1 ramp that resets on each beat)
 * suitable for driving sequencers with el.seq, el.seq2, etc.
 *
 * @param bpm - Beats per minute (can be a signal for tempo changes)
 *
 * @example
 * ```ts
 * // Fixed tempo
 * const clock = beatClock(120);
 *
 * // Dynamic tempo
 * const tempoSignal = el.const({ key: 'tempo', value: 120 });
 * const clock = beatClock(tempoSignal);
 * ```
 */
export function beatClock(bpm: Signal): NodeRepr_t {
  const beatsPerSecond = el.div(bpm, 60);
  return el.train(beatsPerSecond);
}

/**
 * Creates a subdivision clock that ticks faster than the beat clock.
 *
 * @param bpm - Beats per minute
 * @param subdivision - Number of ticks per beat (2 = 8th notes, 4 = 16th notes)
 *
 * @example
 * ```ts
 * // 16th note clock at 120 BPM
 * const clock16th = subdivisionClock(120, 4);
 * ```
 */
export function subdivisionClock(
  bpm: Signal,
  subdivision: Signal
): NodeRepr_t {
  const ticksPerSecond = el.mul(el.div(bpm, 60), subdivision);
  return el.train(ticksPerSecond);
}

/**
 * Creates a gated clock that only ticks when the gate is high.
 *
 * Useful for play/stop functionality - multiply the clock by a gate
 * signal to start/stop the sequence.
 *
 * @param clock - The source clock signal
 * @param gate - Gate signal (1 = playing, 0 = stopped)
 *
 * @example
 * ```ts
 * const clock = beatClock(120);
 * const playing = el.const({ key: 'playing', value: 1 });
 * const gated = gatedClock(clock, playing);
 * ```
 */
export function gatedClock(clock: Signal, gate: Signal): NodeRepr_t {
  return el.mul(clock, gate);
}

/**
 * Counts the number of beats (rising edges) from a clock signal.
 *
 * @param clock - The clock signal to count
 *
 * @example
 * ```ts
 * const clock = beatClock(120);
 * const count = beatCounter(clock);
 * // count will be 0, 1, 2, 3, ... incrementing each beat
 * ```
 */
export function beatCounter(clock: Signal): NodeRepr_t {
  return el.counter(clock);
}

/**
 * Returns the current bar number (0-indexed).
 *
 * @param beatCount - The current beat count
 * @param beatsPerBar - Number of beats per bar (e.g., 4 for 4/4 time)
 *
 * @example
 * ```ts
 * const beats = beatCounter(beatClock(120));
 * const bar = barCounter(beats, 4); // 4/4 time
 * // bar will be 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, ...
 * ```
 */
export function barCounter(beatCount: Signal, beatsPerBar: Signal): NodeRepr_t {
  return el.floor(el.div(beatCount, beatsPerBar));
}

/**
 * Returns the beat position within the current bar (0 to beatsPerBar-1).
 *
 * @param beatCount - The current beat count
 * @param beatsPerBar - Number of beats per bar
 *
 * @example
 * ```ts
 * const beats = beatCounter(beatClock(120));
 * const pos = beatInBar(beats, 4);
 * // pos will cycle: 0, 1, 2, 3, 0, 1, 2, 3, ...
 * ```
 */
export function beatInBar(beatCount: Signal, beatsPerBar: Signal): NodeRepr_t {
  return el.mod(beatCount, beatsPerBar);
}

/**
 * Creates a phasor that ramps from 0 to 1 over the duration of one bar.
 *
 * Useful for position-based effects or visualizations that sync to bars.
 *
 * @param bpm - Beats per minute
 * @param beatsPerBar - Number of beats per bar
 *
 * @example
 * ```ts
 * const barPhase = barPhasor(120, 4);
 * // Ramps 0 to 1 over 2 seconds (one bar at 120 BPM in 4/4)
 * ```
 */
export function barPhasor(bpm: Signal, beatsPerBar: Signal): NodeRepr_t {
  const barsPerSecond = el.div(el.div(bpm, 60), beatsPerBar);
  return el.phasor(barsPerSecond);
}

/**
 * Converts BPM to frequency in Hz.
 *
 * @param bpm - Beats per minute
 * @returns Frequency in Hz (beats per second)
 */
export function bpmToHz(bpm: Signal): NodeRepr_t {
  return el.div(bpm, 60);
}

/**
 * Converts BPM to period in seconds.
 *
 * @param bpm - Beats per minute
 * @returns Period in seconds (time between beats)
 */
export function bpmToPeriod(bpm: Signal): NodeRepr_t {
  return el.div(60, bpm);
}

/**
 * Converts BPM to period in samples.
 *
 * @param bpm - Beats per minute
 * @param sampleRate - Sample rate in Hz (default: uses el.sr())
 * @returns Period in samples
 */
export function bpmToSamples(bpm: Signal, sampleRate?: Signal): NodeRepr_t {
  const sr = sampleRate ?? el.sr();
  return el.mul(bpmToPeriod(bpm), sr);
}
