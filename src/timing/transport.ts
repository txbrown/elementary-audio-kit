/**
 * Transport - a higher-level abstraction for managing playback state.
 *
 * The transport provides a unified interface for controlling tempo,
 * time signature, and generating synchronized clock signals.
 */
import { el, type NodeRepr_t } from '@elemaudio/core';
import {
  beatClock,
  subdivisionClock,
  beatCounter,
  barCounter,
  beatInBar,
  barPhasor,
} from './clock';
import type { Signal } from './clock';

/**
 * Time signature representation.
 */
export interface TimeSignature {
  /** Beats per bar (numerator, e.g., 4 in 4/4) */
  beats: number;
  /** Note value that gets one beat (denominator, e.g., 4 in 4/4) */
  noteValue: number;
}

/**
 * Configuration for creating a transport.
 */
export interface TransportConfig {
  /** Tempo in BPM (can be a signal for dynamic tempo) */
  bpm: Signal;
  /** Time signature (default: 4/4) */
  timeSignature?: TimeSignature;
  /** Gate signal for play/stop (1 = playing, 0 = stopped) */
  playing?: Signal;
  /** Unique key prefix for node identification */
  key?: string;
}

/**
 * Transport signals - all the timing signals you need for sequencing.
 */
export interface TransportSignals {
  /** Pulse train at beat rate */
  clock: NodeRepr_t;
  /** Pulse train at 8th note rate */
  clock8th: NodeRepr_t;
  /** Pulse train at 16th note rate */
  clock16th: NodeRepr_t;
  /** Current beat count (0, 1, 2, ...) */
  beat: NodeRepr_t;
  /** Current bar count (0, 1, 2, ...) */
  bar: NodeRepr_t;
  /** Beat position within current bar (0 to beatsPerBar-1) */
  beatInBar: NodeRepr_t;
  /** Phasor ramping 0-1 over each bar */
  barPhase: NodeRepr_t;
  /** The BPM signal */
  bpm: NodeRepr_t;
  /** The playing gate signal */
  playing: NodeRepr_t;
}

/**
 * Creates a transport with all timing signals.
 *
 * The transport is the central timing hub for your audio application.
 * It generates synchronized clocks and counters that can drive
 * sequencers, effects, and visualizations.
 *
 * @param config - Transport configuration
 * @returns All transport signals
 *
 * @example
 * ```ts
 * // Create a transport at 120 BPM in 4/4 time
 * const bpmSignal = el.const({ key: 'bpm', value: 120 });
 * const playingSignal = el.const({ key: 'playing', value: 1 });
 *
 * const transport = createTransport({
 *   bpm: bpmSignal,
 *   playing: playingSignal,
 *   timeSignature: { beats: 4, noteValue: 4 },
 * });
 *
 * // Use the clock to drive a sequencer
 * const pattern = el.seq2(
 *   { seq: [1, 0, 1, 0], hold: true, loop: true },
 *   transport.clock,
 *   0
 * );
 * ```
 */
export function createTransport(config: TransportConfig): TransportSignals {
  const {
    bpm,
    timeSignature = { beats: 4, noteValue: 4 },
    playing = 1,
    key = 'transport',
  } = config;

  // Ensure signals are nodes
  const bpmNode = typeof bpm === 'number'
    ? el.const({ key: `${key}-bpm`, value: bpm })
    : bpm;

  const playingNode = typeof playing === 'number'
    ? el.const({ key: `${key}-playing`, value: playing })
    : playing;

  const beatsPerBar = timeSignature.beats;

  // Create base clock
  const baseClock = beatClock(bpmNode);

  // Gate the clock with playing signal
  const gatedBaseClock = el.mul(baseClock, playingNode);

  // Create subdivision clocks
  const clock8th = el.mul(subdivisionClock(bpmNode, 2), playingNode);
  const clock16th = el.mul(subdivisionClock(bpmNode, 4), playingNode);

  // Create counters
  const beat = beatCounter(gatedBaseClock);
  const bar = barCounter(beat, beatsPerBar);
  const beatPos = beatInBar(beat, beatsPerBar);
  const barPhase = barPhasor(bpmNode, beatsPerBar);

  return {
    clock: gatedBaseClock,
    clock8th,
    clock16th,
    beat,
    bar,
    beatInBar: beatPos,
    barPhase,
    bpm: bpmNode,
    playing: playingNode,
  };
}

/**
 * Common time signatures.
 */
export const TimeSignatures = {
  /** 4/4 - Common time */
  common: { beats: 4, noteValue: 4 } as TimeSignature,
  /** 3/4 - Waltz time */
  waltz: { beats: 3, noteValue: 4 } as TimeSignature,
  /** 6/8 - Compound duple */
  sixEight: { beats: 6, noteValue: 8 } as TimeSignature,
  /** 2/4 - Cut time / March */
  cutTime: { beats: 2, noteValue: 4 } as TimeSignature,
  /** 5/4 - Irregular */
  fiveFour: { beats: 5, noteValue: 4 } as TimeSignature,
  /** 7/8 - Irregular */
  sevenEight: { beats: 7, noteValue: 8 } as TimeSignature,
} as const;
