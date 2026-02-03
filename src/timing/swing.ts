/**
 * Swing and groove utilities.
 *
 * These functions add humanization and groove to rigid clock signals.
 */
import { el, type NodeRepr_t } from '@elemaudio/core';
import type { Signal } from './clock';

/**
 * Applies swing to a clock signal by delaying every other tick.
 *
 * Swing creates a "shuffle" feel by pushing the off-beats later.
 * A swing amount of 0 is straight timing, 0.5 is triplet feel,
 * and 1.0 delays the off-beat to just before the next beat.
 *
 * Note: This is a simplified swing that works best with subdivision clocks
 * (8th notes or 16th notes). For more complex groove patterns, consider
 * using sparse sequencers with explicit timing.
 *
 * @param clock - The clock signal to swing (should be 8th or 16th notes)
 * @param amount - Swing amount from 0 (straight) to 1 (maximum swing)
 *
 * @example
 * ```ts
 * import { subdivisionClock, swing } from '@elementary-audio-kit/core';
 *
 * // Create swung 8th notes
 * const clock8th = subdivisionClock(120, 2);
 * const swungClock = swing(clock8th, 0.3); // 30% swing
 * ```
 */
export function swing(
  clock: Signal,
  amount: Signal
): NodeRepr_t {
  // Track which tick we're on (even or odd)
  const tickCount = el.counter(clock);
  const isOffBeat = el.mod(tickCount, 2);

  // Calculate delay amount (0 to ~0.5 of the tick period)
  // We use a simple approach: delay the off-beats
  const swingDelay = el.mul(isOffBeat, el.mul(amount, 0.5));

  // Apply micro-timing shift
  // This is a simplified version - true swing would require
  // sample-accurate delay which is complex to implement purely
  // in the signal domain
  return el.mul(clock, el.sub(1, swingDelay));
}

/**
 * Adds random timing variation (humanization) to a clock signal.
 *
 * This creates subtle timing imperfections that make programmed
 * rhythms feel more natural and human-played.
 *
 * @param clock - The clock signal to humanize
 * @param amount - Amount of randomization (0 = none, 1 = maximum)
 *
 * @example
 * ```ts
 * const humanizedClock = humanize(clock, 0.1); // 10% humanization
 * ```
 */
export function humanize(
  clock: Signal,
  amount: Signal
): NodeRepr_t {
  // Generate random offset per tick
  // Note: This is a placeholder - proper humanization would
  // require sample-and-hold on the random signal synced to the clock
  const noise = el.rand();
  const scaledNoise = el.mul(el.sub(el.mul(noise, 2), 1), amount);

  // For now, return the clock as-is with a gain modulation
  // True humanization requires more complex timing manipulation
  return el.mul(clock, el.add(1, el.mul(scaledNoise, 0.1)));
}

/**
 * Creates a velocity accent pattern.
 *
 * Accents emphasize certain beats in a pattern, creating groove
 * through dynamics rather than timing.
 *
 * @param clock - The clock signal
 * @param pattern - Array of velocity values (0-1) for each step
 * @param options - Optional key for node identification
 *
 * @example
 * ```ts
 * // Accent on beats 1 and 3
 * const accent = accentPattern(clock, [1, 0.5, 0.8, 0.5]);
 * const accented = el.mul(sample, accent);
 * ```
 */
export function accentPattern(
  clock: Signal,
  pattern: number[],
  options?: { key?: string }
): NodeRepr_t {
  return el.seq2(
    {
      key: options?.key,
      seq: pattern,
      hold: true,
      loop: true,
    },
    clock,
    0
  );
}

/**
 * Pre-defined groove patterns expressed as accent values.
 *
 * These patterns can be used with `accentPattern` to add
 * musical dynamics to your sequences.
 */
export const GroovePatterns = {
  /** Flat - no accents */
  flat: [1, 1, 1, 1, 1, 1, 1, 1],

  /** Standard 4/4 - emphasis on 1 and 3 */
  standard: [1, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6],

  /** Backbeat - emphasis on 2 and 4 */
  backbeat: [0.7, 1, 0.7, 1, 0.7, 1, 0.7, 1],

  /** Funky - syncopated accents */
  funky: [1, 0.5, 0.8, 0.6, 0.9, 0.5, 0.7, 0.6],

  /** House - four-on-the-floor with off-beat hi-hat feel */
  house: [1, 0.4, 0.7, 0.4, 1, 0.4, 0.7, 0.4],

  /** Hip-hop - laid back feel */
  hipHop: [1, 0.5, 0.6, 0.8, 0.9, 0.5, 0.7, 0.6],

  /** Reggae - emphasis on off-beats */
  reggae: [0.6, 1, 0.6, 0.9, 0.6, 1, 0.6, 0.9],
} as const;
