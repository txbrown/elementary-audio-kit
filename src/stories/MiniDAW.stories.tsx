import { useState, useEffect, useCallback } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';
import { Knob } from '../ui/Knob';
import {
  StoryContainer,
  HStack,
  VStack,
  colors,
  fonts,
} from './StoryComponents';
import { useAudioContext } from './useAudioContext';
import { createTransport } from '../timing';

// ============================================================================
// Types
// ============================================================================

interface Track {
  id: string;
  name: string;
  pattern: boolean[];
  volume: number;
  muted: boolean;
  color: string;
}

interface TransportState {
  bpm: number;
  playing: boolean;
  currentStep: number;
}

// ============================================================================
// Synth functions - create sounds for each track type
// ============================================================================

function createKickSound(trigger: any, env: any) {
  const pitchEnv = el.mul(env, 100);
  const pitch = el.add(55, pitchEnv);
  return el.mul(el.cycle(pitch), env);
}

function createSnareSound(trigger: any, env: any) {
  const noise = el.mul(el.noise(), 0.7);
  const tone = el.mul(el.cycle(180), 0.3);
  return el.mul(el.add(noise, tone), env);
}

function createHihatSound(trigger: any, env: any) {
  return el.mul(el.noise(), env);
}

function createClapSound(trigger: any, env: any) {
  return el.mul(el.noise(), env);
}

function createPercSound(trigger: any, env: any) {
  return el.mul(el.cycle(320), env);
}

function createBassSound(trigger: any, env: any) {
  const osc = el.add(
    el.cycle(55),
    el.mul(el.cycle(110), 0.5)
  );
  return el.mul(osc, env);
}

// Map track IDs to synth functions and envelope settings
const SYNTH_CONFIG: Record<string, {
  synth: (t: any, e: any) => any;
  attack: number;
  decay: number;
}> = {
  kick:  { synth: createKickSound,  attack: 0.001, decay: 0.15 },
  snare: { synth: createSnareSound, attack: 0.001, decay: 0.1 },
  hihat: { synth: createHihatSound, attack: 0.001, decay: 0.025 },
  clap:  { synth: createClapSound,  attack: 0.001, decay: 0.12 },
  perc:  { synth: createPercSound,  attack: 0.001, decay: 0.08 },
  bass:  { synth: createBassSound,  attack: 0.01,  decay: 0.2 },
};

// ============================================================================
// UI Components
// ============================================================================

// Transport play/stop button
const PlayButton = ({ playing, onClick }: { playing: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: 56,
      height: 56,
      borderRadius: 4,
      border: 'none',
      background: playing ? colors.accent : colors.accentAlt,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.1s',
    }}
  >
    {playing ? (
      <div style={{ width: 18, height: 18, background: '#fff', borderRadius: 2 }} />
    ) : (
      <div
        style={{
          width: 0,
          height: 0,
          marginLeft: 4,
          borderTop: '12px solid transparent',
          borderBottom: '12px solid transparent',
          borderLeft: '20px solid #fff',
        }}
      />
    )}
  </button>
);

// BPM display and control
const BPMControl = ({ bpm, onChange }: { bpm: number; onChange: (v: number) => void }) => (
  <VStack gap={4} align="center">
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 28,
        fontWeight: 600,
        color: colors.text,
        letterSpacing: '-0.02em',
      }}
    >
      {bpm}
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 9,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: colors.textMuted,
      }}
    >
      BPM
    </div>
    <input
      type="range"
      min={60}
      max={180}
      value={bpm}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={{ width: 80 }}
    />
  </VStack>
);

// Beat position indicator
const BeatIndicator = ({ step, total }: { step: number; total: number }) => (
  <HStack gap={4}>
    {Array.from({ length: total / 4 }, (_, i) => (
      <div
        key={i}
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: Math.floor(step / 4) === i ? colors.accent : colors.surfaceAlt,
          border: `1px solid ${Math.floor(step / 4) === i ? colors.accent : colors.border}`,
        }}
      />
    ))}
  </HStack>
);

// Track header with name, mute, volume
const TrackHeader = ({
  track,
  onMute,
  onVolumeChange,
}: {
  track: Track;
  onMute: () => void;
  onVolumeChange: (v: number) => void;
}) => (
  <HStack gap={8} align="center" style={{ width: 120 }}>
    <button
      onClick={onMute}
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        border: 'none',
        background: track.muted ? colors.surfaceAlt : track.color,
        cursor: 'pointer',
        fontFamily: fonts.mono,
        fontSize: 9,
        fontWeight: 600,
        color: track.muted ? colors.textMuted : '#fff',
      }}
    >
      {track.muted ? 'M' : ''}
    </button>
    <div
      style={{
        flex: 1,
        fontFamily: fonts.mono,
        fontSize: 10,
        fontWeight: 500,
        color: track.muted ? colors.textMuted : colors.text,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {track.name}
    </div>
    <Knob
      value={track.volume}
      onChange={onVolumeChange}
      min={0}
      max={1}
      disabled={track.muted}
    >
      {({ rotation, normalizedValue }) => (
        <div style={{ width: 24, height: 24, position: 'relative', opacity: track.muted ? 0.4 : 1 }}>
          <svg width={24} height={24}>
            <circle cx={12} cy={12} r={10} fill="none" stroke={colors.border} strokeWidth={2} />
            <circle
              cx={12}
              cy={12}
              r={10}
              fill="none"
              stroke={track.color}
              strokeWidth={2}
              strokeDasharray={`${normalizedValue * 62.8} 62.8`}
              strokeLinecap="round"
              transform="rotate(-90 12 12)"
            />
          </svg>
        </div>
      )}
    </Knob>
  </HStack>
);

// Pattern step button
const StepButton = ({
  active,
  current,
  color,
  isDownbeat,
  onClick,
}: {
  active: boolean;
  current: boolean;
  color: string;
  isDownbeat: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      width: 28,
      height: 28,
      padding: 0,
      border: `1px solid ${current ? colors.text : colors.border}`,
      borderRadius: 3,
      background: active
        ? current
          ? color
          : `${color}cc`
        : isDownbeat
          ? colors.surfaceAlt
          : colors.surface,
      cursor: 'pointer',
      transition: 'background 0.05s',
    }}
  />
);

// Full track row with header + pattern
const TrackRow = ({
  track,
  currentStep,
  onToggleStep,
  onMute,
  onVolumeChange,
}: {
  track: Track;
  currentStep: number;
  onToggleStep: (step: number) => void;
  onMute: () => void;
  onVolumeChange: (v: number) => void;
}) => (
  <HStack gap={12} align="center">
    <TrackHeader track={track} onMute={onMute} onVolumeChange={onVolumeChange} />
    <HStack gap={2}>
      {track.pattern.map((active, i) => (
        <StepButton
          key={i}
          active={active}
          current={currentStep === i}
          color={track.color}
          isDownbeat={i % 4 === 0}
          onClick={() => onToggleStep(i)}
        />
      ))}
    </HStack>
  </HStack>
);

// ============================================================================
// Default track configurations
// ============================================================================

const DEFAULT_TRACKS: Track[] = [
  {
    id: 'kick',
    name: 'Kick',
    pattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    volume: 0.8,
    muted: false,
    color: colors.accent,
  },
  {
    id: 'snare',
    name: 'Snare',
    pattern: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    volume: 0.6,
    muted: false,
    color: colors.accentBlue,
  },
  {
    id: 'hihat',
    name: 'HiHat',
    pattern: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    volume: 0.4,
    muted: false,
    color: colors.accentAlt,
  },
  {
    id: 'clap',
    name: 'Clap',
    pattern: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
    volume: 0.5,
    muted: false,
    color: '#9966ff',
  },
  {
    id: 'perc',
    name: 'Perc',
    pattern: [false, false, true, false, false, false, true, false, false, true, false, false, false, false, true, false],
    volume: 0.4,
    muted: false,
    color: '#ff66aa',
  },
  {
    id: 'bass',
    name: 'Bass',
    pattern: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
    volume: 0.5,
    muted: false,
    color: '#66ffaa',
  },
];

// Pattern presets
const PATTERN_PRESETS = {
  'Four on Floor': {
    kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
  },
  'Breakbeat': {
    kick:  [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
    hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
  },
  'Hip Hop': {
    kick:  [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
  },
  'Reggaeton': {
    kick:  [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
    snare: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
  },
  'Clear All': {
    kick:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    hihat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    clap:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    perc:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    bass:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  },
};

// ============================================================================
// Main DAW Component
// ============================================================================

export const MiniDAW: Story = () => {
  const { state, start, render } = useAudioContext();

  // Transport state
  const [bpm, setBpm] = useState(110);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Tracks
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);

  // Master volume
  const [masterVolume, setMasterVolume] = useState(0.7);

  // Toggle a step in a track's pattern
  const toggleStep = useCallback((trackId: string, step: number) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId
        ? { ...track, pattern: track.pattern.map((v, i) => i === step ? !v : v) }
        : track
    ));
  }, []);

  // Toggle track mute
  const toggleMute = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  }, []);

  // Set track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, volume } : track
    ));
  }, []);

  // Apply pattern preset
  const applyPreset = useCallback((presetName: string) => {
    const preset = PATTERN_PRESETS[presetName as keyof typeof PATTERN_PRESETS];
    if (!preset) return;

    setTracks(prev => prev.map(track => ({
      ...track,
      pattern: preset[track.id as keyof typeof preset] ?? track.pattern,
    })));
  }, []);

  // Handle play toggle - initializes audio on first click
  const handlePlayToggle = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (!state.isReady) {
      await start();
    }
    setPlaying(true);
  }, [playing, state.isReady, start]);

  // Audio rendering
  useEffect(() => {
    if (!state.isReady) return;

    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: playing ? 1 : 0 }),
    });

    // Build audio graph for each track
    const trackSignals = tracks.map(track => {
      if (track.muted) return el.const({ value: 0 });

      const config = SYNTH_CONFIG[track.id];
      if (!config) return el.const({ value: 0 });

      // Create trigger from pattern
      const seq = el.seq2(
        { key: `${track.id}-seq`, seq: track.pattern.map(v => v ? 1 : 0), hold: true, loop: true },
        transport.clock16th,
        0
      );
      const trig = el.mul(transport.clock16th, seq);

      // Create envelope
      const env = el.adsr(config.attack, config.decay, 0, 0.001, trig);

      // Create sound and apply volume
      const sound = config.synth(trig, env);
      return el.mul(sound, track.volume);
    });

    // Mix all tracks
    let mix = trackSignals[0];
    for (let i = 1; i < trackSignals.length; i++) {
      mix = el.add(mix, trackSignals[i]);
    }

    // Apply master volume
    const output = el.mul(mix, masterVolume);

    render(output, output);
  }, [state.isReady, bpm, playing, tracks, masterVolume, render]);

  // Step sequencer visualization timer
  useEffect(() => {
    if (!state.isReady || !playing) {
      return;
    }

    const stepInterval = ((60 / bpm) * 1000) / 4; // 16th notes
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % 16);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, playing, bpm]);

  // Reset step on stop
  useEffect(() => {
    if (!playing) {
      setCurrentStep(0);
    }
  }, [playing]);

  return (
    <StoryContainer style={{ padding: 24 }}>
      <VStack gap={24}>
        {/* Header */}
        <HStack gap={16} align="center">
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: colors.text,
            }}
          >
            MINI DAW
          </div>
          <div style={{ flex: 1 }} />
          <BeatIndicator step={currentStep} total={16} />
        </HStack>

        {/* Transport */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <HStack gap={24} align="center">
            <PlayButton playing={playing} onClick={handlePlayToggle} />
              <BPMControl bpm={bpm} onChange={setBpm} />

              <div style={{ width: 1, height: 40, background: colors.border }} />

              {/* Pattern presets */}
              <VStack gap={4}>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                  }}
                >
                  Presets
                </div>
                <HStack gap={4}>
                  {Object.keys(PATTERN_PRESETS).map(name => (
                    <button
                      key={name}
                      onClick={() => applyPreset(name)}
                      style={{
                        padding: '4px 8px',
                        fontFamily: fonts.mono,
                        fontSize: 9,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 4,
                        background: colors.surfaceAlt,
                        color: colors.text,
                        cursor: 'pointer',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </HStack>
              </VStack>

              <div style={{ flex: 1 }} />

              {/* Master volume */}
              <VStack gap={4} align="center">
                <Knob value={masterVolume} onChange={setMasterVolume} min={0} max={1}>
                  {({ rotation, normalizedValue }) => (
                    <div style={{ width: 40, height: 40, position: 'relative' }}>
                      <svg width={40} height={40}>
                        <circle cx={20} cy={20} r={16} fill="none" stroke={colors.border} strokeWidth={3} />
                        <circle
                          cx={20}
                          cy={20}
                          r={16}
                          fill="none"
                          stroke={colors.text}
                          strokeWidth={3}
                          strokeDasharray={`${normalizedValue * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontFamily: fonts.mono,
                          fontSize: 10,
                          color: colors.text,
                        }}
                      >
                        {Math.round(masterVolume * 100)}
                      </div>
                    </div>
                  )}
                </Knob>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                  }}
                >
                  Master
                </div>
              </VStack>
            </HStack>
          </div>

          {/* Step numbers */}
          <HStack gap={2} style={{ marginLeft: 132 }}>
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  textAlign: 'center',
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  color: i % 4 === 0 ? colors.text : colors.textMuted,
                }}
              >
                {i + 1}
              </div>
            ))}
          </HStack>

          {/* Tracks */}
          <VStack gap={8}>
            {tracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                currentStep={currentStep}
                onToggleStep={(step) => toggleStep(track.id, step)}
                onMute={() => toggleMute(track.id)}
                onVolumeChange={(v) => setTrackVolume(track.id, v)}
              />
            ))}
          </VStack>

          {/* Footer */}
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.textMuted,
              lineHeight: 1.6,
            }}
          >
            Click steps to toggle • Click colored button to mute • Drag knobs for volume
          </div>
        </VStack>
    </StoryContainer>
  );
};
