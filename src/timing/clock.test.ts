import { describe, it, expect } from 'vitest';
import OfflineRenderer from '@elemaudio/offline-renderer';
import { beatClock, subdivisionClock, bpmToHz } from './clock';

describe('timing signals (offline rendering)', () => {
  const sampleRate = 44100;
  const blockSize = 512;

  /**
   * Helper to render a signal and get output samples
   */
  async function renderSignal(
    signal: any,
    numSamples: number
  ): Promise<Float32Array> {
    const core = new OfflineRenderer();
    await core.initialize({
      numInputChannels: 0,
      numOutputChannels: 1,
      sampleRate,
      blockSize,
    });

    // Set up the graph
    core.render(signal);

    // Process samples
    const inps: Float32Array[] = [];
    const outs = [new Float32Array(numSamples)];
    core.process(inps, outs);

    return outs[0];
  }

  /**
   * Count rising edges (transitions from <0.5 to >0.5) in a signal
   */
  function countPulses(samples: Float32Array): number {
    let pulseCount = 0;
    let wasLow = true;

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      if (wasLow && sample > 0.5) {
        pulseCount++;
        wasLow = false;
      } else if (sample < 0.5) {
        wasLow = true;
      }
    }

    return pulseCount;
  }

  describe('beatClock', () => {
    it('produces correct number of pulses at 60 BPM over 4 seconds', async () => {
      // At 60 BPM, we expect 1 beat per second = 4 beats in 4 seconds
      const bpm = 60;
      const durationSec = 4;
      const numSamples = sampleRate * durationSec;

      const clock = beatClock(bpm);
      const samples = await renderSignal(clock, numSamples);
      const pulseCount = countPulses(samples);

      // At 60 BPM for 4 seconds, expect ~4 pulses (allow some tolerance)
      expect(pulseCount).toBeGreaterThanOrEqual(3);
      expect(pulseCount).toBeLessThanOrEqual(5);
    });

    it('produces twice as many pulses at 120 BPM vs 60 BPM', async () => {
      const durationSec = 2;
      const numSamples = sampleRate * durationSec;

      const samples60 = await renderSignal(beatClock(60), numSamples);
      const samples120 = await renderSignal(beatClock(120), numSamples);

      const pulses60 = countPulses(samples60);
      const pulses120 = countPulses(samples120);

      // 120 BPM should have ~2x the pulses of 60 BPM
      expect(pulses120).toBeGreaterThan(pulses60 * 1.5);
      expect(pulses120).toBeLessThan(pulses60 * 2.5);
    });
  });

  describe('subdivisionClock', () => {
    it('produces 4x pulses for 16th notes vs quarter notes', async () => {
      const durationSec = 2;
      const numSamples = sampleRate * durationSec;
      const bpm = 120;

      const quartersSignal = subdivisionClock(bpm, 1);
      const sixteenthsSignal = subdivisionClock(bpm, 4);

      const quarterSamples = await renderSignal(quartersSignal, numSamples);
      const sixteenthSamples = await renderSignal(sixteenthsSignal, numSamples);

      const quarterPulses = countPulses(quarterSamples);
      const sixteenthPulses = countPulses(sixteenthSamples);

      // 16th notes should have ~4x the pulses
      expect(sixteenthPulses).toBeGreaterThan(quarterPulses * 3);
      expect(sixteenthPulses).toBeLessThan(quarterPulses * 5);
    });
  });

  describe('bpmToHz', () => {
    it('converts 60 BPM to 1 Hz (checks last samples after stabilization)', async () => {
      const numSamples = 4096;

      // 60 BPM = 1 Hz = 1 beat per second
      const hz = bpmToHz(60);
      const samples = await renderSignal(hz, numSamples);

      // Skip first blockSize samples for graph stabilization, check the rest
      const stableSamples = samples.slice(512);
      const avg = stableSamples.reduce((a, b) => a + b, 0) / stableSamples.length;
      expect(avg).toBeCloseTo(1.0, 0); // 0 decimal places = within 0.5
    });

    it('120 BPM produces 2x the frequency of 60 BPM', async () => {
      const numSamples = 4096;

      const hz60 = await renderSignal(bpmToHz(60), numSamples);
      const hz120 = await renderSignal(bpmToHz(120), numSamples);

      // Check stable portion
      const stable60 = hz60.slice(512);
      const stable120 = hz120.slice(512);

      const avg60 = stable60.reduce((a, b) => a + b, 0) / stable60.length;
      const avg120 = stable120.reduce((a, b) => a + b, 0) / stable120.length;

      // 120 BPM should be ~2x 60 BPM
      expect(avg120 / avg60).toBeCloseTo(2.0, 0);
    });
  });
});
