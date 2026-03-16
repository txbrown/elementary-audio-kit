import { el, type NodeRepr_t } from '@elemaudio/core';

/**
 * Configuration for a single drum pad.
 */
export type DrumPadConfig = {
  /** VFS key for the loaded sample (e.g. 'analog-rytm-808-drums/24') */
  vfsKey: string;
  /** MIDI note number for this pad */
  midiNumber: number;
  /** Current gate value (0 = off, 1 = trigger). Update and re-render to fire. */
  gate?: number;
};

/**
 * Configuration for a drum sampler instrument.
 */
export type DrumSamplerConfig = {
  /** Unique track identifier */
  trackId: string;
  /** Array of drum pad configurations (one per sample) */
  pads: DrumPadConfig[];
};

/**
 * Creates a drum sampler instrument from loaded VFS samples.
 *
 * Each pad gets a keyed `el.const` gate node. To trigger a pad,
 * re-render the graph with the gate value set to 1 (Elementary's
 * diffing engine will detect the change and fire the trigger).
 *
 * Uses the Web MIDI tutorial pattern: keyed el.const nodes for gates,
 * graph re-render for triggering.
 *
 * @returns Object with the mixed mono signal and a map of gate keys
 *          for triggering from JS or native
 */
export function drumSampler(config: DrumSamplerConfig): {
  signal: NodeRepr_t;
  gateKeys: Record<number, string>;
} {
  const { trackId, pads } = config;
  const gateKeys: Record<number, string> = {};

  if (pads.length === 0) {
    return { signal: el.const({ value: 0 }), gateKeys };
  }

  const padSignals = pads.map((pad) => {
    const gateKey = `${trackId}-${pad.midiNumber}-gate`;
    gateKeys[pad.midiNumber] = gateKey;

    const gate = el.const({ key: gateKey, value: pad.gate ?? 0 });

    return el.sample(
      { path: pad.vfsKey, mode: 'trigger', key: `${trackId}-${pad.midiNumber}-sample` },
      gate,
      1
    );
  });

  // Mix all pads
  let mix: NodeRepr_t = padSignals[0]!;
  for (let i = 1; i < padSignals.length; i++) {
    mix = el.add(mix, padSignals[i]!);
  }

  return { signal: mix, gateKeys };
}

/**
 * Creates a sequenced drum sampler that plays patterns via a transport clock.
 *
 * Each pad plays a trigger pattern synchronized to the transport's 16th note clock.
 *
 * @param config - Drum sampler configuration
 * @param patterns - Map of MIDI number to step pattern arrays (0 = off, >0 = velocity)
 * @param clock16th - Transport 16th note clock signal
 * @returns Mixed mono signal
 */
export function sequencedDrumSampler(
  config: DrumSamplerConfig,
  patterns: Record<number, number[]>,
  clock16th: NodeRepr_t
): NodeRepr_t {
  const { trackId, pads } = config;

  if (pads.length === 0) return el.const({ value: 0 });

  const padSignals = pads.map((pad) => {
    const pattern = patterns[pad.midiNumber];
    if (!pattern || pattern.every((v) => v === 0)) {
      return el.const({ value: 0 });
    }

    const seq = el.seq2(
      { key: `${trackId}-${pad.midiNumber}-seq`, seq: pattern, hold: true, loop: true },
      clock16th,
      0
    );
    const trig = el.mul(clock16th, seq);

    return el.mul(
      el.sample(
        { path: pad.vfsKey, mode: 'trigger', key: `${trackId}-${pad.midiNumber}-sample` },
        trig,
        1
      ),
      el.const({ value: pattern.find((v) => v > 0) ?? 0.8 })
    );
  });

  let mix: NodeRepr_t = padSignals[0]!;
  for (let i = 1; i < padSignals.length; i++) {
    mix = el.add(mix, padSignals[i]!);
  }

  return mix;
}
