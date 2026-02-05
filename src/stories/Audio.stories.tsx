import { useState, useEffect, useMemo } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';

import { useAudioContext } from './useAudioContext';
import {
  StoryContainer,
  SectionTitle,
  ParamDisplay,
  BeatRow,
  StepGrid,
  Card,
  HStack,
  VStack,
  colors,
  fonts,
} from './StoryComponents';
import { Knob } from '../ui/Knob';

// Import timing and sequencing modules
import { beatClock, subdivisionClock } from '../timing/clock';
import { euclidean } from '../sequencing/euclidean';

/**
 * Reusable small knob component for stories
 */
const SmallKnob = ({
  value,
  onChange,
  min,
  max,
  label,
  step,
  sensitivity,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
  step?: number;
  sensitivity?: number;
}) => (
  <VStack gap={8} align="center">
    <Knob value={value} onChange={onChange} min={min} max={max} step={step} sensitivity={sensitivity}>
      {({ rotation: rot, normalizedValue }) => (
        <div style={{ width: 44, height: 44, position: 'relative' }}>
          <svg width={44} height={44}>
            <circle cx={22} cy={22} r={18} fill="none" stroke={colors.border} strokeWidth={2} />
            <circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke={colors.accentAlt}
              strokeWidth={2}
              strokeDasharray={`${normalizedValue * 113} 113`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: colors.surfaceAlt,
              transform: `rotate(${rot}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 10,
                width: 4,
                height: 4,
                borderRadius: 2,
                background: '#fff',
              }}
            />
          </div>
        </div>
      )}
    </Knob>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 9,
        letterSpacing: '0.1em',
        color: colors.textMuted,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 14,
        color: colors.text,
      }}
    >
      {step ? value : value.toFixed(0)}
    </div>
  </VStack>
);

/**
 * Simple metronome with BPM control
 */
export const Metronome: Story = () => {
  const { state, start, render } = useAudioContext();
  const [bpm, setBpm] = useState(120);
  const [beatCount, setBeatCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle play toggle - initializes audio on first click
  const handlePlayToggle = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!state.isReady) {
      await start();
    }
    setIsPlaying(true);
  };

  // Render the metronome sound
  useEffect(() => {
    if (!state.isReady) return;

    if (!isPlaying) {
      // Render silence when not playing
      render(el.const({ value: 0 }), el.const({ value: 0 }));
      return;
    }

    // Create click sound: short sine burst on each beat
    const clock = beatClock(bpm);

    // Envelope for the click
    const clickEnv = el.adsr(0.001, 0.05, 0, 0.05, clock);

    // Click oscillator (high pitched for downbeat)
    const clickOsc = el.mul(
      el.cycle(880),
      clickEnv,
      0.3
    );

    render(clickOsc, clickOsc);
  }, [state.isReady, bpm, isPlaying, render]);

  // Simulate beat counter for visualization
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setBeatCount(0);
      return;
    }

    const interval = (60 / bpm) * 1000;
    const timer = setInterval(() => {
      setBeatCount((c) => (c + 1) % 4);
    }, interval);

    return () => clearInterval(timer);
  }, [state.isReady, bpm, isPlaying]);

  return (
    <StoryContainer>
      <VStack gap={32} align="center">
        <Card>
          <VStack gap={24} align="center">
            <SectionTitle>Metronome</SectionTitle>

            <BeatRow count={4} active={beatCount} />

            {/* Play button */}
            <button
              onClick={handlePlayToggle}
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                border: 'none',
                background: isPlaying ? colors.accent : colors.accentAlt,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? (
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

              <HStack gap={32}>
                <VStack gap={8} align="center">
                  <Knob
                    value={bpm}
                    onChange={setBpm}
                    min={40}
                    max={240}
                  >
                    {({ rotation, normalizedValue }) => (
                      <div style={{ width: 64, height: 64, position: 'relative' }}>
                        <svg width={64} height={64}>
                          <circle
                            cx={32}
                            cy={32}
                            r={28}
                            fill="none"
                            stroke={colors.border}
                            strokeWidth={3}
                          />
                          <circle
                            cx={32}
                            cy={32}
                            r={28}
                            fill="none"
                            stroke={colors.accent}
                            strokeWidth={3}
                            strokeDasharray={`${normalizedValue * 175.9} 175.9`}
                            strokeLinecap="round"
                            transform="rotate(-90 32 32)"
                          />
                        </svg>
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: colors.surfaceAlt,
                            transform: `rotate(${rotation}deg)`,
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: 19,
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              background: colors.accent,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </Knob>
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: colors.textMuted,
                      textTransform: 'uppercase',
                    }}
                  >
                    Tempo
                  </div>
                </VStack>

                <ParamDisplay label="BPM" value={bpm.toFixed(0)} />
              </HStack>
            </VStack>
          </Card>
      </VStack>
    </StoryContainer>
  );
};

/**
 * Debug story - minimal knob test
 */
export const DebugKnob: Story = () => {
  const [value, setValue] = useState(5);

  console.log('DebugKnob render, value:', value);

  return (
    <StoryContainer>
      <VStack gap={32} align="center">
        <Card>
          <VStack gap={24} align="center">
            <SectionTitle>Debug Knob</SectionTitle>

            <Knob
              value={value}
              onChange={(v) => {
                console.log('onChange called:', v);
                setValue(v);
              }}
              min={1}
              max={10}
              step={1}
              sensitivity={60}
            >
              {({ rotation, normalizedValue, isDragging }) => (
                <div style={{ width: 64, height: 64, position: 'relative' }}>
                  <svg width={64} height={64}>
                    <circle cx={32} cy={32} r={28} fill="none" stroke={colors.border} strokeWidth={2} />
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      fill="none"
                      stroke={isDragging ? colors.accent : colors.accentAlt}
                      strokeWidth={2}
                      strokeDasharray={`${normalizedValue * 175.9} 175.9`}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: colors.surfaceAlt,
                      transform: `rotate(${rotation}deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        background: '#fff',
                        marginTop: -20,
                      }}
                    />
                  </div>
                </div>
              )}
            </Knob>

            <div style={{ fontFamily: fonts.mono, fontSize: 24, color: colors.text }}>
              {value}
            </div>

            <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
              Drag up/down to change value (1-10)
            </div>
          </VStack>
        </Card>
      </VStack>
    </StoryContainer>
  );
};

/**
 * Euclidean rhythm generator with audio
 */
export const EuclideanRhythm: Story = () => {
  const { state, start, render } = useAudioContext();
  const [bpm, setBpm] = useState(120);
  const [hits, setHits] = useState(5);
  const [steps, setSteps] = useState(8);
  const [rotation, setRotation] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle play toggle - initializes audio on first click
  const handlePlayToggle = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!state.isReady) {
      await start();
    }
    setIsPlaying(true);
  };

  // Clamp hits and rotation when steps changes
  useEffect(() => {
    if (hits > steps) setHits(steps);
    if (rotation >= steps) setRotation(Math.max(0, steps - 1));
  }, [steps, hits, rotation]);

  // Generate pattern (memoized to prevent unnecessary re-renders)
  const rotatedPattern = useMemo(() => {
    const pattern = euclidean(hits, steps);
    if (rotation === 0) return pattern;
    return [...pattern.slice(-rotation), ...pattern.slice(0, -rotation)];
  }, [hits, steps, rotation]);

  // Render the rhythm
  useEffect(() => {
    if (!state.isReady) return;

    if (!isPlaying) {
      render(el.const({ value: 0 }), el.const({ value: 0 }));
      return;
    }

    const seq = rotatedPattern.map((hit) => (hit ? 1 : 0));
    const clock = subdivisionClock(bpm, steps / 4);
    const trigger = el.seq2({ seq, hold: false, loop: true }, clock, 0);
    const env = el.adsr(0.001, 0.08, 0, 0.08, trigger);
    const noise = el.noise();
    const filtered = el.lowpass(el.add(200, el.mul(env, 2000)), 1, noise);
    const sound = el.mul(filtered, env, 0.4);
    render(sound, sound);
  }, [state.isReady, bpm, rotatedPattern, steps, isPlaying, render]);

  // Track current step for visualization (reset when pattern changes)
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const interval = (60 / bpm / (steps / 4)) * 1000;
    const timer = setInterval(() => {
      setCurrentStep((s) => (s + 1) % steps);
    }, interval);

    return () => clearInterval(timer);
  }, [state.isReady, bpm, steps, rotatedPattern, isPlaying]);

  return (
    <StoryContainer>
      <VStack gap={32} align="center">
        <Card style={{ minWidth: 400 }}>
          <VStack gap={24} align="center">
            <SectionTitle>Euclidean Rhythm</SectionTitle>

            <StepGrid
              pattern={rotatedPattern}
              currentStep={currentStep}
            />

            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              E({hits}, {steps}){rotation !== 0 && ` +${rotation}`}
            </div>

            {/* Play button */}
            <button
              onClick={handlePlayToggle}
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                border: 'none',
                background: isPlaying ? colors.accent : colors.accentAlt,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? (
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

            <HStack gap={24}>
              <SmallKnob value={hits} onChange={setHits} min={1} max={steps} label="Hits" step={1} sensitivity={60} />
              <SmallKnob value={steps} onChange={setSteps} min={2} max={16} label="Steps" step={1} sensitivity={80} />
              <SmallKnob value={rotation} onChange={setRotation} min={0} max={Math.max(0, steps - 1)} label="Rotate" step={1} sensitivity={60} />
              <SmallKnob value={bpm} onChange={setBpm} min={40} max={200} label="BPM" step={5} sensitivity={100} />
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </StoryContainer>
  );
};

/**
 * Polyrhythm with multiple euclidean patterns
 */
export const Polyrhythm: Story = () => {
  const { state, start, render } = useAudioContext();
  const [bpm, setBpm] = useState(100);
  const [patterns] = useState([
    { hits: 3, steps: 8, pitch: 880 },
    { hits: 5, steps: 8, pitch: 660 },
    { hits: 7, steps: 12, pitch: 440 },
  ]);
  const [currentSteps, setCurrentSteps] = useState([0, 0, 0]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle play toggle - initializes audio on first click
  const handlePlayToggle = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!state.isReady) {
      await start();
    }
    setIsPlaying(true);
  };

  // Render polyrhythm
  useEffect(() => {
    if (!state.isReady) return;

    if (!isPlaying) {
      render(el.const({ value: 0 }), el.const({ value: 0 }));
      return;
    }

    const voices = patterns.map((p) => {
      const pattern = euclidean(p.hits, p.steps);
      const seq = pattern.map((hit) => (hit ? 1 : 0));
      const clock = subdivisionClock(bpm, p.steps / 4);
      const trigger = el.seq2({ seq, hold: false, loop: true }, clock, 0);
      const env = el.adsr(0.001, 0.1, 0, 0.1, trigger);
      const osc = el.cycle(p.pitch);
      return el.mul(osc, env, 0.15);
    });

    const mixed = voices.reduce((acc, v) => el.add(acc, v), el.const({ value: 0 }));
    render(mixed, mixed);
  }, [state.isReady, bpm, patterns, isPlaying, render]);

  // Track current steps
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentSteps([0, 0, 0]);
      return;
    }

    const timers = patterns.map((p, i) => {
      const interval = (60 / bpm / (p.steps / 4)) * 1000;
      return setInterval(() => {
        setCurrentSteps((prev) => {
          const next = [...prev];
          next[i] = (prev[i] + 1) % p.steps;
          return next;
        });
      }, interval);
    });

    return () => timers.forEach(clearInterval);
  }, [state.isReady, bpm, patterns, isPlaying]);

  const colors_voices = [colors.accent, colors.accentAlt, colors.accentBlue];

  return (
    <StoryContainer>
      <VStack gap={32} align="center">
        <Card style={{ minWidth: 500 }}>
          <VStack gap={24}>
            <HStack style={{ justifyContent: 'space-between' }}>
              <SectionTitle>Polyrhythm</SectionTitle>
              <ParamDisplay label="BPM" value={bpm.toFixed(0)} />
            </HStack>

            {patterns.map((p, i) => (
              <HStack key={i} gap={16} align="center">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: colors_voices[i],
                  }}
                />
                <StepGrid
                  pattern={euclidean(p.hits, p.steps)}
                  currentStep={currentSteps[i]}
                />
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    color: colors.textMuted,
                    minWidth: 60,
                  }}
                >
                  E({p.hits},{p.steps})
                </div>
              </HStack>
            ))}

            {/* Play button */}
            <button
              onClick={handlePlayToggle}
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                border: 'none',
                background: isPlaying ? colors.accent : colors.accentAlt,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? (
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

            <HStack gap={16} style={{ marginTop: 8 }}>
              <Knob value={bpm} onChange={setBpm} min={40} max={180}>
                {({ rotation: rot, normalizedValue }) => (
                  <div style={{ width: 48, height: 48, position: 'relative' }}>
                    <svg width={48} height={48}>
                      <circle cx={24} cy={24} r={20} fill="none" stroke={colors.border} strokeWidth={2} />
                      <circle
                        cx={24}
                        cy={24}
                        r={20}
                        fill="none"
                        stroke={colors.accent}
                        strokeWidth={2}
                        strokeDasharray={`${normalizedValue * 125.6} 125.6`}
                        strokeLinecap="round"
                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: colors.surfaceAlt,
                        transform: `rotate(${rot}deg)`,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 12,
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          background: '#fff',
                        }}
                      />
                    </div>
                  </div>
                )}
              </Knob>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Tempo
              </div>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </StoryContainer>
  );
};

/**
 * Simple oscillator with frequency control
 */
export const Oscillator: Story = () => {
  const { state, start, render } = useAudioContext();
  const [freq, setFreq] = useState(440);
  const [gain, setGain] = useState(0.3);
  const [waveform, setWaveform] = useState<'sine' | 'saw' | 'square' | 'triangle'>('sine');
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle play toggle - initializes audio on first click
  const handlePlayToggle = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!state.isReady) {
      await start();
    }
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!state.isReady) return;

    if (!isPlaying) {
      render(el.const({ value: 0 }), el.const({ value: 0 }));
      return;
    }

    let osc;
    switch (waveform) {
      case 'sine':
        osc = el.cycle(freq);
        break;
      case 'saw':
        osc = el.saw(freq);
        break;
      case 'square':
        osc = el.square(freq);
        break;
      case 'triangle':
        osc = el.triangle(freq);
        break;
    }

    const out = el.mul(osc, gain);
    render(out, out);
  }, [state.isReady, freq, gain, waveform, isPlaying, render]);

  const formatFreq = (f: number) => {
    if (f >= 1000) return `${(f / 1000).toFixed(2)}k`;
    return f.toFixed(0);
  };

  return (
    <StoryContainer>
      <VStack gap={32} align="center">
        <Card>
          <VStack gap={24} align="center">
            <SectionTitle>Oscillator</SectionTitle>

            {/* Play button */}
            <button
              onClick={handlePlayToggle}
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                border: 'none',
                background: isPlaying ? colors.accent : colors.accentAlt,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? (
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

            <HStack gap={32}>
              <VStack gap={8} align="center">
                <Knob
                  value={freq}
                  onChange={setFreq}
                  min={20}
                  max={2000}
                  curve="logarithmic"
                >
                  {({ rotation, normalizedValue }) => (
                    <div style={{ width: 72, height: 72, position: 'relative' }}>
                      <svg width={72} height={72}>
                        <circle cx={36} cy={36} r={32} fill="none" stroke={colors.border} strokeWidth={3} />
                        <circle
                          cx={36}
                          cy={36}
                          r={32}
                          fill="none"
                          stroke={colors.accent}
                          strokeWidth={3}
                          strokeDasharray={`${normalizedValue * 201} 201`}
                          strokeLinecap="round"
                          transform="rotate(-90 36 36)"
                        />
                      </svg>
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: colors.surfaceAlt,
                          transform: `rotate(${rotation}deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            background: colors.accent,
                            marginTop: -20,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Knob>
                <div style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.text }}>
                  {formatFreq(freq)} <span style={{ fontSize: 10, color: colors.textMuted }}>Hz</span>
                </div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Frequency
                </div>
              </VStack>

              <VStack gap={8} align="center">
                <Knob value={gain} onChange={setGain} min={0} max={1}>
                  {({ rotation, normalizedValue }) => (
                    <div style={{ width: 48, height: 48, position: 'relative' }}>
                      <svg width={48} height={48}>
                        <circle cx={24} cy={24} r={20} fill="none" stroke={colors.border} strokeWidth={2} />
                        <circle
                          cx={24}
                          cy={24}
                          r={20}
                          fill="none"
                          stroke={colors.accentAlt}
                          strokeWidth={2}
                          strokeDasharray={`${normalizedValue * 125.6} 125.6`}
                          strokeLinecap="round"
                          transform="rotate(-90 24 24)"
                        />
                      </svg>
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: colors.surfaceAlt,
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            left: 12,
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            background: '#fff',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Knob>
                <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.text }}>
                  {(gain * 100).toFixed(0)}%
                </div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Gain
                </div>
              </VStack>
            </HStack>

            <HStack gap={8}>
              {(['sine', 'saw', 'square', 'triangle'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWaveform(w)}
                  style={{
                    padding: '8px 12px',
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    background: waveform === w ? colors.accent : colors.surfaceAlt,
                    color: waveform === w ? '#fff' : colors.textMuted,
                    border: `1px solid ${waveform === w ? colors.accent : colors.border}`,
                    borderRadius: 2,
                    cursor: 'pointer',
                  }}
                >
                  {w}
                </button>
              ))}
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </StoryContainer>
  );
};
