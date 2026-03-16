/**
 * Elementary Audio Kit - Musical abstractions for Elementary Audio.
 *
 * This library provides higher-level building blocks for creating
 * music applications with Elementary Audio:
 *
 * - **Timing**: Beat clocks, transport, quantization, swing
 * - **Sequencing**: Step patterns, Euclidean rhythms, triggers
 *
 * ## Quick Start
 *
 * ```ts
 * import { createTransport, euclideanTrigger } from '@elementary-audio-kit/core';
 * import { el } from '@elemaudio/core';
 *
 * // Create a transport at 120 BPM
 * const transport = createTransport({
 *   bpm: 120,
 *   playing: 1,
 * });
 *
 * // Create a Euclidean rhythm pattern
 * const trigger = euclideanTrigger(5, 8, transport.clock);
 *
 * // Play a sample on each trigger
 * const hihat = el.sample({ path: 'hihat', mode: 'trigger' }, trigger, 1);
 *
 * core.render(hihat, hihat);
 * ```
 *
 * ## Modules
 *
 * You can import from submodules for tree-shaking:
 *
 * ```ts
 * import { beatClock, beatCounter } from '@elementary-audio-kit/core/timing';
 * import { euclidean, triggerPattern } from '@elementary-audio-kit/core/sequencing';
 * ```
 *
 * @packageDocumentation
 */

// Re-export all timing utilities
export * from './timing';

// Re-export all sequencing utilities
export * from './sequencing';

// Re-export all instrument factories
export * from './instruments';

// Re-export mixer utilities
export * from './mixer';
