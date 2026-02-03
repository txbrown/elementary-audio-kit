/**
 * Euclidean rhythm generator.
 *
 * Euclidean rhythms distribute a number of hits as evenly as possible
 * across a number of steps, creating naturally pleasing patterns that
 * appear in music traditions worldwide.
 *
 * @see https://en.wikipedia.org/wiki/Euclidean_rhythm
 * @see Toussaint, G. (2005). The Euclidean Algorithm Generates Traditional Musical Rhythms
 */
import type { NodeRepr_t } from '@elemaudio/core';
import type { Signal } from '../timing/clock';
import { triggerPattern, rotatePattern } from './pattern';

/**
 * Generates a Euclidean rhythm pattern.
 *
 * Uses Bjorklund's algorithm to distribute `hits` evenly across `steps`.
 *
 * @param hits - Number of active steps (pulses)
 * @param steps - Total number of steps in the pattern
 * @returns Boolean array representing the pattern
 *
 * @example
 * ```ts
 * euclidean(3, 8);  // [true, false, false, true, false, false, true, false]
 * euclidean(5, 8);  // [true, false, true, true, false, true, true, false]
 * euclidean(4, 16); // [true, false, false, false, true, false, false, false, ...]
 * ```
 */
export function euclidean(hits: number, steps: number): boolean[] {
  if (steps <= 0) return [];
  if (hits <= 0) return Array(steps).fill(false);
  if (hits >= steps) return Array(steps).fill(true);

  // Bjorklund's algorithm
  let pattern: number[][] = [];

  // Initialize with groups
  for (let i = 0; i < steps; i++) {
    pattern.push(i < hits ? [1] : [0]);
  }

  let divisor = steps - hits;

  while (divisor > 1) {
    const newPattern: number[][] = [];
    const minLength = Math.min(hits, divisor);

    for (let i = 0; i < minLength; i++) {
      newPattern.push([...pattern[i], ...pattern[pattern.length - 1 - i]]);
    }

    // Add remaining groups
    for (let i = minLength; i < pattern.length - minLength; i++) {
      newPattern.push(pattern[i]);
    }

    pattern = newPattern;
    hits = minLength;
    divisor = pattern.length - hits;
  }

  // Flatten and convert to boolean
  return pattern.flat().map(v => v === 1);
}

/**
 * Generates a rotated Euclidean rhythm.
 *
 * Rotation shifts the pattern, changing where the "downbeat" falls.
 * This creates variations like the difference between a Cuban tresillo
 * and a habanera rhythm.
 *
 * @param hits - Number of active steps
 * @param steps - Total steps in pattern
 * @param rotation - Steps to rotate (positive = right, negative = left)
 * @returns Rotated Euclidean pattern
 *
 * @example
 * ```ts
 * // Tresillo (son clave base)
 * euclideanRotated(3, 8, 0);  // x..x..x.
 *
 * // Habanera variation
 * euclideanRotated(3, 8, 1);  // .x..x..x
 * ```
 */
export function euclideanRotated(
  hits: number,
  steps: number,
  rotation: number
): boolean[] {
  return rotatePattern(euclidean(hits, steps), rotation);
}

/**
 * Creates a Euclidean trigger pattern as an Elementary signal.
 *
 * @param hits - Number of active steps
 * @param steps - Total steps in pattern
 * @param clock - Clock signal to drive the sequencer
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * import { beatClock } from '@elementary-audio-kit/core/timing';
 * import { euclideanTrigger } from '@elementary-audio-kit/core/sequencing';
 *
 * const clock = beatClock(120);
 * const trigger = euclideanTrigger(5, 8, clock);
 *
 * // Use trigger to play a sample
 * const hihat = el.sample({ path: 'hihat', mode: 'trigger' }, trigger, 1);
 * ```
 */
export function euclideanTrigger(
  hits: number,
  steps: number,
  clock: Signal,
  options?: {
    key?: string;
    rotation?: number;
  }
): NodeRepr_t {
  const pattern = options?.rotation
    ? euclideanRotated(hits, steps, options.rotation)
    : euclidean(hits, steps);

  return triggerPattern(pattern, clock, { key: options?.key });
}

/**
 * Common Euclidean rhythm presets found in world music.
 *
 * Many traditional rhythms can be expressed as Euclidean patterns.
 */
export const EuclideanPresets = {
  /** Cuban tresillo - fundamental Afro-Cuban rhythm (3, 8) */
  tresillo: { hits: 3, steps: 8 },

  /** Cuban cinquillo - common in Cuban music (5, 8) */
  cinquillo: { hits: 5, steps: 8 },

  /** Son clave 3-2 (3, 8) + (2, 8) over two bars */
  sonClave: { hits: 5, steps: 16 },

  /** Bossa nova (5, 16) */
  bossaNova: { hits: 5, steps: 16 },

  /** West African bell pattern (7, 12) */
  westAfrican: { hits: 7, steps: 12 },

  /** Turkish aksak (5, 9) */
  aksak: { hits: 5, steps: 9 },

  /** Bulgarian folk (7, 8) - almost every beat */
  bulgarian: { hits: 7, steps: 8 },

  /** Reggae one-drop feel (3, 16) */
  oneDrop: { hits: 3, steps: 16 },

  /** Drum and bass two-step (2, 8) */
  twoStep: { hits: 2, steps: 8 },

  /** Four on the floor (4, 16) */
  fourOnFloor: { hits: 4, steps: 16 },
} as const;

/**
 * Creates a trigger pattern from a Euclidean preset.
 *
 * @param preset - Key from EuclideanPresets
 * @param clock - Clock signal
 * @param options - Optional rotation and key
 *
 * @example
 * ```ts
 * const tresillo = presetTrigger('tresillo', clock);
 * const bossa = presetTrigger('bossaNova', clock, { rotation: 3 });
 * ```
 */
export function presetTrigger(
  preset: keyof typeof EuclideanPresets,
  clock: Signal,
  options?: { key?: string; rotation?: number }
): NodeRepr_t {
  const { hits, steps } = EuclideanPresets[preset];
  return euclideanTrigger(hits, steps, clock, {
    key: options?.key ?? `euclidean-${preset}`,
    rotation: options?.rotation,
  });
}

/**
 * Generates multiple related Euclidean patterns for polyrhythmic textures.
 *
 * Creates a set of patterns with the same number of steps but
 * different hit counts for layering.
 *
 * @param stepCount - Number of steps (shared)
 * @param hitCounts - Array of hit counts for each pattern
 * @returns Array of boolean patterns
 *
 * @example
 * ```ts
 * // Create a polyrhythmic texture
 * const [p1, p2, p3] = euclideanFamily(16, [3, 5, 7]);
 * // p1 = euclidean(3, 16) - sparse
 * // p2 = euclidean(5, 16) - medium
 * // p3 = euclidean(7, 16) - dense
 * ```
 */
export function euclideanFamily(
  stepCount: number,
  hitCounts: number[]
): boolean[][] {
  return hitCounts.map(hits => euclidean(hits, stepCount));
}
