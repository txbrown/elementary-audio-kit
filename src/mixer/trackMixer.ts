import { el, type NodeRepr_t } from '@elemaudio/core';

/**
 * Per-track channel strip configuration.
 */
export type ChannelStrip = {
  /** Unique track identifier */
  trackId: string;
  /** Mono input signal */
  signal: NodeRepr_t;
  /** Volume 0–1 */
  volume: number;
  /** Pan -1 (left) to 1 (right) */
  pan?: number;
  /** Muted */
  muted?: boolean;
};

/**
 * Stereo output pair.
 */
export type StereoSignal = {
  left: NodeRepr_t;
  right: NodeRepr_t;
};

/**
 * Apply volume and mute to a mono signal using keyed consts.
 */
export function channelVolume(
  trackId: string,
  signal: NodeRepr_t,
  volume: number,
  muted: boolean = false
): NodeRepr_t {
  const vol = el.const({ key: `${trackId}-vol`, value: muted ? 0 : volume });
  return el.mul(signal, vol);
}

/**
 * Apply equal-power pan to a mono signal, returning stereo.
 * Pan range: -1 (full left) to 1 (full right), 0 = center.
 */
export function channelPan(
  trackId: string,
  signal: NodeRepr_t,
  pan: number = 0
): StereoSignal {
  // Equal-power panning using cos/sin
  const angle = ((pan + 1) / 2) * (Math.PI / 2); // 0 to π/2
  const leftGain = Math.cos(angle);
  const rightGain = Math.sin(angle);

  return {
    left: el.mul(signal, el.const({ key: `${trackId}-panL`, value: leftGain })),
    right: el.mul(signal, el.const({ key: `${trackId}-panR`, value: rightGain })),
  };
}

/**
 * Mix multiple channel strips into a stereo output.
 */
export function mixTracks(strips: ChannelStrip[]): StereoSignal {
  if (strips.length === 0) {
    return { left: el.const({ value: 0 }), right: el.const({ value: 0 }) };
  }

  let leftMix: NodeRepr_t = el.const({ value: 0 });
  let rightMix: NodeRepr_t = el.const({ value: 0 });

  for (const strip of strips) {
    const withVol = channelVolume(strip.trackId, strip.signal, strip.volume, strip.muted);
    const stereo = channelPan(strip.trackId, withVol, strip.pan ?? 0);
    leftMix = el.add(leftMix, stereo.left);
    rightMix = el.add(rightMix, stereo.right);
  }

  return { left: leftMix, right: rightMix };
}

/**
 * Master output with soft limiter (tanh saturation).
 * Matches the SessionDAW pattern: tanh(mix * drive) * outputGain.
 */
export function masterOutput(
  stereo: StereoSignal,
  drive: number = 1.5,
  outputGain: number = 0.5
): StereoSignal {
  return {
    left: el.mul(el.tanh(el.mul(stereo.left, drive)), outputGain),
    right: el.mul(el.tanh(el.mul(stereo.right, drive)), outputGain),
  };
}
