/**
 * Pattern sequencing utilities.
 *
 * Higher-level abstractions for step sequencing built on Elementary's
 * el.seq and el.seq2 primitives.
 */
import { el, type NodeRepr_t } from '@elemaudio/core';
import type { Signal } from '../timing/clock';

/**
 * A step in a sequence - can be a simple value or include metadata.
 */
export type Step<T = number> = T | { value: T; velocity?: number; duration?: number };

/**
 * A pattern is an array of steps.
 */
export type Pattern<T = number> = Step<T>[];

/**
 * Extracts the value from a step.
 */
function stepValue<T>(step: Step<T>): T {
  return typeof step === 'object' && step !== null && 'value' in step
    ? (step as { value: T }).value
    : (step as T);
}

/**
 * Creates a step sequencer that cycles through values on each clock tick.
 *
 * @param pattern - Array of values to sequence
 * @param clock - Clock signal that advances the sequence
 * @param options - Sequencer options
 *
 * @example
 * ```ts
 * // Sequence through frequencies
 * const melody = stepSequencer([440, 550, 660, 880], clock);
 * core.render(el.cycle(melody), el.cycle(melody));
 *
 * // With options
 * const bass = stepSequencer([110, 110, 220, 165], clock, {
 *   key: 'bass-seq',
 *   offset: 0,
 * });
 * ```
 */
export function stepSequencer(
  pattern: Pattern<number>,
  clock: Signal,
  options?: {
    key?: string;
    offset?: number;
    hold?: boolean;
    loop?: boolean;
  }
): NodeRepr_t {
  const values = pattern.map(stepValue);

  return el.seq2(
    {
      key: options?.key,
      seq: values,
      offset: options?.offset ?? 0,
      hold: options?.hold ?? true,
      loop: options?.loop ?? true,
    },
    clock,
    0 // no reset signal
  );
}

/**
 * Creates a trigger pattern - outputs 1 on active steps, 0 on inactive.
 *
 * This is the fundamental building block for drum patterns.
 *
 * @param hits - Boolean array where true = trigger, false = rest
 * @param clock - Clock signal that advances the pattern
 * @param options - Sequencer options
 *
 * @example
 * ```ts
 * // Four-on-the-floor kick pattern
 * const kickTrigger = triggerPattern(
 *   [true, false, false, false, true, false, false, false],
 *   clock8th
 * );
 *
 * const kick = el.sample(
 *   { path: 'kick', mode: 'trigger' },
 *   kickTrigger,
 *   1
 * );
 * ```
 */
export function triggerPattern(
  hits: boolean[],
  clock: Signal,
  options?: { key?: string; offset?: number }
): NodeRepr_t {
  const values = hits.map(h => (h ? 1 : 0));
  return stepSequencer(values, clock, {
    ...options,
    hold: true,
    loop: true,
  });
}

/**
 * Creates a velocity pattern - outputs velocity values (0-1) for each step.
 *
 * Use this to add dynamics to your patterns.
 *
 * @param velocities - Array of velocity values (0-1)
 * @param clock - Clock signal
 * @param options - Sequencer options
 *
 * @example
 * ```ts
 * const velocities = velocityPattern([1, 0.5, 0.7, 0.5], clock);
 * const sample = el.mul(
 *   el.sample({ path: 'snare', mode: 'trigger' }, trigger, 1),
 *   velocities
 * );
 * ```
 */
export function velocityPattern(
  velocities: number[],
  clock: Signal,
  options?: { key?: string; offset?: number }
): NodeRepr_t {
  return stepSequencer(velocities, clock, {
    ...options,
    hold: true,
    loop: true,
  });
}

/**
 * Combines a trigger pattern with a velocity pattern.
 *
 * @param hits - Boolean array for triggers
 * @param velocities - Velocity values for each step
 * @param clock - Clock signal
 * @param options - Sequencer options
 *
 * @returns Object with trigger and velocity signals
 */
export function triggerWithVelocity(
  hits: boolean[],
  velocities: number[],
  clock: Signal,
  options?: { key?: string }
): { trigger: NodeRepr_t; velocity: NodeRepr_t } {
  const keyPrefix = options?.key ?? 'twv';

  return {
    trigger: triggerPattern(hits, clock, { key: `${keyPrefix}-trig` }),
    velocity: velocityPattern(velocities, clock, { key: `${keyPrefix}-vel` }),
  };
}

/**
 * Rotates a pattern by a number of steps.
 *
 * Positive rotation shifts right, negative shifts left.
 *
 * @param pattern - The pattern to rotate
 * @param steps - Number of steps to rotate
 * @returns Rotated pattern
 *
 * @example
 * ```ts
 * const original = [1, 0, 0, 0];
 * const rotated = rotatePattern(original, 1);
 * // [0, 1, 0, 0]
 * ```
 */
export function rotatePattern<T>(pattern: T[], steps: number): T[] {
  const len = pattern.length;
  if (len === 0) return pattern;

  const normalizedSteps = ((steps % len) + len) % len;
  return [...pattern.slice(-normalizedSteps), ...pattern.slice(0, -normalizedSteps)];
}

/**
 * Reverses a pattern.
 */
export function reversePattern<T>(pattern: T[]): T[] {
  return [...pattern].reverse();
}

/**
 * Inverts a trigger pattern (true becomes false and vice versa).
 */
export function invertPattern(pattern: boolean[]): boolean[] {
  return pattern.map(v => !v);
}

/**
 * Combines multiple trigger patterns with OR logic.
 *
 * A step is active if any input pattern has it active.
 */
export function combinePatterns(...patterns: boolean[][]): boolean[] {
  if (patterns.length === 0) return [];
  const maxLength = Math.max(...patterns.map(p => p.length));

  return Array.from({ length: maxLength }, (_, i) =>
    patterns.some(p => p[i % p.length] === true)
  );
}

/**
 * Creates a pattern from a string notation.
 *
 * 'x' or '1' = hit, '-' or '0' or '.' = rest
 *
 * @example
 * ```ts
 * const kick = patternFromString('x---x---');
 * const hihat = patternFromString('x-x-x-x-');
 * ```
 */
export function patternFromString(notation: string): boolean[] {
  return notation.split('').map(char =>
    char === 'x' || char === 'X' || char === '1'
  );
}
