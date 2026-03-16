import { el, type NodeRepr_t } from '@elemaudio/core';

/**
 * Configuration for a melodic/bass sampler instrument.
 */
export type MelodicSamplerConfig = {
  /** Unique track identifier */
  trackId: string;
  /** VFS key for the base sample */
  vfsKey: string;
  /** MIDI note number of the base sample (used for pitch calculation) */
  baseMidiNumber: number;
  /** Number of polyphonic voices (default: 8) */
  voiceCount?: number;
};

/**
 * A voice state for the re-render pattern (Web MIDI tutorial approach).
 */
export type Voice = {
  /** MIDI note number (0 = inactive) */
  note: number;
  /** Gate state: 1 = on, 0 = off */
  gate: number;
  /** Unique key for this voice instance (monotonic counter for Elementary diffing) */
  key: number;
};

/**
 * Convert MIDI note to playback rate relative to a base note.
 */
export function midiToRate(targetMidi: number, baseMidi: number): number {
  return Math.pow(2, (targetMidi - baseMidi) / 12);
}

/**
 * Creates a polyphonic melodic sampler instrument.
 *
 * Uses the keyed el.const pattern from Elementary's Web MIDI tutorial.
 * Each voice has gate and freq const nodes. To play a note, update the
 * voices array and re-render — Elementary's diffing handles the rest.
 *
 * @param config - Sampler configuration
 * @param voices - Current voice states (update and re-render to play notes)
 * @returns Mixed mono signal
 */
export function melodicSampler(
  config: MelodicSamplerConfig,
  voices: Voice[]
): NodeRepr_t {
  const { trackId, vfsKey, baseMidiNumber } = config;

  if (voices.length === 0) return el.const({ value: 0 });

  const voiceSignals = voices.map((voice, i) => {
    const rate = voice.note > 0 ? midiToRate(voice.note, baseMidiNumber) : 1;

    const gate = el.const({ key: `${trackId}:v${voice.key}:gate`, value: voice.gate });
    const rateNode = el.const({ key: `${trackId}:v${voice.key}:rate`, value: rate });

    return el.mul(
      el.sample(
        { path: vfsKey, mode: 'trigger', key: `${trackId}:v${voice.key}:sample` },
        gate,
        rateNode
      ),
      gate // Use gate as amplitude (1 when playing, 0 when off)
    );
  });

  let mix: NodeRepr_t = voiceSignals[0]!;
  for (let i = 1; i < voiceSignals.length; i++) {
    mix = el.add(mix, voiceSignals[i]!);
  }

  return mix;
}

/**
 * Simple voice allocator for polyphonic playback.
 *
 * Call `noteOn` / `noteOff` then pass the `voices` array to `melodicSampler`.
 */
export class VoiceAllocator {
  private voices: Voice[];
  private nextKey = 0;

  constructor(voiceCount: number = 8) {
    this.voices = Array.from({ length: voiceCount }, () => ({
      note: 0,
      gate: 0,
      key: this.nextKey++,
    }));
  }

  noteOn(note: number): Voice[] {
    // Find a free voice, or steal the oldest
    let voice = this.voices.find((v) => v.gate === 0);
    if (!voice) {
      voice = this.voices[0]!; // Steal oldest
    }

    voice.note = note;
    voice.gate = 1;
    voice.key = this.nextKey++;

    return [...this.voices];
  }

  noteOff(note: number): Voice[] {
    const voice = this.voices.find((v) => v.note === note && v.gate === 1);
    if (voice) {
      voice.gate = 0;
    }
    return [...this.voices];
  }

  getVoices(): Voice[] {
    return [...this.voices];
  }
}

/**
 * Creates a sequenced melodic sampler that plays patterns via a transport clock.
 */
export function sequencedMelodicSampler(
  config: MelodicSamplerConfig,
  patterns: Record<number, number[]>,
  clock16th: NodeRepr_t
): NodeRepr_t {
  const { trackId, vfsKey, baseMidiNumber } = config;

  const pitches = Object.keys(patterns).map(Number);
  if (pitches.length === 0) return el.const({ value: 0 });

  const pitchSignals = pitches.map((pitch) => {
    const pattern = patterns[pitch]!;
    if (pattern.every((v) => v === 0)) return el.const({ value: 0 });

    const seq = el.seq2(
      { key: `${trackId}-${pitch}-seq`, seq: pattern, hold: true, loop: true },
      clock16th,
      0
    );
    const trig = el.mul(clock16th, seq);
    const rate = midiToRate(pitch, baseMidiNumber);

    return el.mul(
      el.sample(
        { path: vfsKey, mode: 'trigger', key: `${trackId}-${pitch}-sample` },
        trig,
        rate
      ),
      el.const({ value: pattern.find((v) => v > 0) ?? 0.8 })
    );
  });

  let mix: NodeRepr_t = pitchSignals[0]!;
  for (let i = 1; i < pitchSignals.length; i++) {
    mix = el.add(mix, pitchSignals[i]!);
  }

  return mix;
}
