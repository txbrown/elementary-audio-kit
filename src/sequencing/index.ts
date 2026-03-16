/**
 * Sequencing module - pattern and rhythm abstractions.
 *
 * This module provides utilities for creating and manipulating
 * musical patterns:
 * - Step sequencers and trigger patterns
 * - Euclidean rhythm generation
 * - Pattern manipulation (rotate, reverse, combine)
 *
 * @example
 * ```ts
 * import { euclideanTrigger, triggerPattern, patternFromString } from '@elementary-audio-kit/core/sequencing';
 * import { beatClock } from '@elementary-audio-kit/core/timing';
 *
 * const clock = beatClock(120);
 *
 * // Euclidean rhythm
 * const hihat = euclideanTrigger(5, 8, clock);
 *
 * // Manual pattern
 * const kick = triggerPattern([true, false, false, false], clock);
 *
 * // String notation
 * const snare = triggerPattern(patternFromString('--x---x-'), clock);
 * ```
 *
 * @packageDocumentation
 */

// Pattern utilities
export {
  stepSequencer,
  triggerPattern,
  velocityPattern,
  triggerWithVelocity,
  rotatePattern,
  reversePattern,
  invertPattern,
  combinePatterns,
  patternFromString,
  type Step,
  type Pattern,
} from './pattern';

// Clip conversion
export { clipToPatterns, type ClipNote } from './clipToPatterns';

// Euclidean rhythms
export {
  euclidean,
  euclideanRotated,
  euclideanTrigger,
  euclideanFamily,
  presetTrigger,
  EuclideanPresets,
} from './euclidean';
