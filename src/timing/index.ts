/**
 * Timing module - musical time abstractions for Elementary Audio.
 *
 * This module provides primitives for working with musical time:
 * - Clocks and counters for beat-based sequencing
 * - Transport for managing playback state
 * - Quantization utilities for snapping to grids
 * - Swing and groove for humanization
 *
 * @example
 * ```ts
 * import { createTransport, TimeSignatures } from '@elementary-audio-kit/core/timing';
 * import { el } from '@elemaudio/core';
 *
 * // Create a transport at 120 BPM
 * const transport = createTransport({
 *   bpm: el.const({ key: 'bpm', value: 120 }),
 *   playing: el.const({ key: 'playing', value: 1 }),
 *   timeSignature: TimeSignatures.common,
 * });
 *
 * // Use transport signals to drive a sequencer
 * const sequence = el.seq2(
 *   { seq: [440, 550, 660, 880], hold: true, loop: true },
 *   transport.clock,
 *   0
 * );
 *
 * core.render(el.cycle(sequence), el.cycle(sequence));
 * ```
 *
 * @packageDocumentation
 */

// Clock primitives
export {
  beatClock,
  subdivisionClock,
  gatedClock,
  beatCounter,
  barCounter,
  beatInBar,
  barPhasor,
  bpmToHz,
  bpmToPeriod,
  bpmToSamples,
  type Signal,
} from './clock';

// Transport
export {
  createTransport,
  TimeSignatures,
  type TimeSignature,
  type TransportConfig,
  type TransportSignals,
} from './transport';

// Quantization
export {
  quantize,
  quantizeFloor,
  quantizeCeil,
  beatsToMs,
  msToBeats,
  beatsToSamples,
  samplesToBeats,
  barsToBeats,
  divisionToBeats,
  createGrid,
  NoteDivision,
} from './quantize';

// Swing and groove
export {
  swing,
  humanize,
  accentPattern,
  GroovePatterns,
} from './swing';
