import { useState, useEffect, useMemo } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';
import { Knob } from '../ui/Knob';
import {
  StoryContainer,
  SectionTitle,
  Card,
  HStack,
  VStack,
  BeatLight,
  colors,
  fonts,
} from './StoryComponents';
import { useAudioContext } from './useAudioContext';
import {
  createTransport,
  TimeSignatures,
  GroovePatterns,
} from '../timing';

// Reusable small knob - MUST be outside story component to avoid remount
const SmallKnob = ({
  value,
  onChange,
  min = 0,
  max = 1,
  label,
  step,
  sensitivity = 150,
  formatValue,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  step?: number;
  sensitivity?: number;
  formatValue?: (v: number) => string;
}) => (
  <VStack gap={8} align="center">
    <Knob
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      sensitivity={sensitivity}
    >
      {({ rotation: rot, normalizedValue }) => (
        <div style={{ width: 44, height: 44, position: 'relative' }}>
          <svg width={44} height={44}>
            <circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke={colors.border}
              strokeWidth={2}
            />
            <circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeDasharray={`${normalizedValue * 113} 113`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: colors.surfaceAlt,
              transform: `rotate(${rot}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: 8,
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
        fontSize: 14,
        color: colors.text,
        fontWeight: 500,
      }}
    >
      {formatValue ? formatValue(value) : value}
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
      {label}
    </div>
  </VStack>
);

// Play/Stop button component
const PlayButton = ({
  isPlaying,
  onClick,
}: {
  isPlaying: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      width: 48,
      height: 48,
      borderRadius: 4,
      border: `1px solid ${colors.border}`,
      background: isPlaying ? colors.accent : colors.surface,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.1s',
    }}
  >
    {isPlaying ? (
      // Stop icon
      <div
        style={{
          width: 16,
          height: 16,
          background: '#fff',
          borderRadius: 2,
        }}
      />
    ) : (
      // Play icon
      <div
        style={{
          width: 0,
          height: 0,
          marginLeft: 4,
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
          borderLeft: '16px solid #fff',
        }}
      />
    )}
  </button>
);

// Time signature selector
const TimeSignatureSelector = ({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (key: string) => void;
}) => {
  const signatures = [
    { key: 'common', label: '4/4' },
    { key: 'waltz', label: '3/4' },
    { key: 'sixEight', label: '6/8' },
    { key: 'cutTime', label: '2/4' },
    { key: 'fiveFour', label: '5/4' },
    { key: 'sevenEight', label: '7/8' },
  ];

  return (
    <HStack gap={4}>
      {signatures.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: '8px 12px',
            fontFamily: fonts.mono,
            fontSize: 12,
            fontWeight: 500,
            border: `1px solid ${selected === key ? colors.accent : colors.border}`,
            borderRadius: 4,
            background: selected === key ? colors.accent : colors.surface,
            color: selected === key ? '#fff' : colors.text,
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </HStack>
  );
};

/**
 * Transport Demo - Interactive transport with beat visualization
 */
export const Transport: Story = () => {
  const { state, start, render } = useAudioContext();
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSigKey, setTimeSigKey] = useState<keyof typeof TimeSignatures>('common');
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);

  const timeSignature = TimeSignatures[timeSigKey];

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

    // Create transport signals
    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: isPlaying ? 1 : 0 }),
      timeSignature,
      key: 'main',
    });

    // Create a simple click for beat feedback
    const clickEnv = el.adsr(0.001, 0.05, 0, 0.001, transport.clock);
    const clickOsc = el.mul(el.cycle(880), clickEnv);

    // Downbeat accent
    const isDownbeat = el.le(transport.beatInBar, 0.5);
    const accentOsc = el.mul(el.cycle(1760), el.mul(clickEnv, isDownbeat));

    const output = el.mul(el.add(clickOsc, el.mul(accentOsc, 0.5)), 0.3);

    render(output, output);
  }, [state.isReady, bpm, isPlaying, timeSignature, render]);

  // JavaScript timer for beat visualization (synced approximately)
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      return;
    }

    const beatInterval = (60 / bpm) * 1000;
    let beatIndex = 0;

    const timer = setInterval(() => {
      setCurrentBeat(beatIndex % timeSignature.beats);
      if (beatIndex % timeSignature.beats === 0 && beatIndex > 0) {
        setCurrentBar((prev) => prev + 1);
      }
      beatIndex++;
    }, beatInterval);

    return () => clearInterval(timer);
  }, [state.isReady, isPlaying, bpm, timeSignature.beats]);

  // Reset on stop
  useEffect(() => {
    if (!isPlaying) {
      setCurrentBeat(0);
      setCurrentBar(0);
    }
  }, [isPlaying]);

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Transport</SectionTitle>

        <Card>
          <VStack gap={24}>
            {/* Controls row */}
            <HStack gap={24} align="flex-end">
              <PlayButton
                isPlaying={isPlaying}
                onClick={handlePlayToggle}
              />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={40}
                  max={240}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
              </HStack>

              {/* Time signature selector */}
              <VStack gap={8}>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                  }}
                >
                  Time Signature
                </div>
                <TimeSignatureSelector
                  selected={timeSigKey}
                  onChange={(key) => setTimeSigKey(key as keyof typeof TimeSignatures)}
                />
              </VStack>

              {/* Beat visualization */}
              <VStack gap={12}>
                <HStack gap={8}>
                  {Array.from({ length: timeSignature.beats }, (_, i) => (
                    <BeatLight
                      key={i}
                      active={currentBeat === i}
                      color={i === 0 ? colors.accent : colors.accentAlt}
                      size={24}
                    />
                  ))}
                </HStack>
                <HStack gap={16}>
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 32,
                      fontWeight: 600,
                      color: colors.text,
                    }}
                  >
                    {currentBar}
                    <span style={{ color: colors.textMuted }}>.</span>
                    {currentBeat + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      color: colors.textMuted,
                      alignSelf: 'flex-end',
                      marginBottom: 6,
                    }}
                  >
                    bar.beat
                  </div>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textMuted,
              lineHeight: 1.6,
            }}
          >
            The transport provides synchronized timing signals:
            <br />
            <span style={{ color: colors.text }}>clock</span> - beat-rate pulse train
            <br />
            <span style={{ color: colors.text }}>clock8th</span> / <span style={{ color: colors.text }}>clock16th</span> - subdivision clocks
            <br />
            <span style={{ color: colors.text }}>beat</span> / <span style={{ color: colors.text }}>bar</span> - counters
            <br />
            <span style={{ color: colors.text }}>beatInBar</span> - position within bar (0 to n-1)
            <br />
            <span style={{ color: colors.text }}>barPhase</span> - 0-1 ramp over each bar
          </div>
        </VStack>
    </StoryContainer>
  );
};

/**
 * Subdivision Clocks - Visualize different clock subdivisions
 */
export const Subdivisions: Story = () => {
  const { state, start, render } = useAudioContext();
  const [bpm, setBpm] = useState(80);
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
  const [quarterBeat, setQuarterBeat] = useState(false);
  const [eighthBeat, setEighthBeat] = useState(false);
  const [sixteenthBeat, setSixteenthBeat] = useState(false);

  useEffect(() => {
    if (!state.isReady) return;

    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: isPlaying ? 1 : 0 }),
    });

    // Create different pitched clicks for each subdivision
    const quarterEnv = el.adsr(0.001, 0.03, 0, 0.001, transport.clock);
    const eighthEnv = el.adsr(0.001, 0.02, 0, 0.001, transport.clock8th);
    const sixteenthEnv = el.adsr(0.001, 0.01, 0, 0.001, transport.clock16th);

    const quarterClick = el.mul(el.cycle(440), quarterEnv);
    const eighthClick = el.mul(el.cycle(660), el.mul(eighthEnv, 0.5));
    const sixteenthClick = el.mul(el.cycle(880), el.mul(sixteenthEnv, 0.25));

    const output = el.mul(
      el.add(quarterClick, el.add(eighthClick, sixteenthClick)),
      0.3
    );

    render(output, output);
  }, [state.isReady, bpm, isPlaying, render]);

  // JavaScript timers for beat visualization
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      return;
    }

    const quarterInterval = (60 / bpm) * 1000;
    const eighthInterval = quarterInterval / 2;
    const sixteenthInterval = quarterInterval / 4;

    // Flash duration
    const flashDuration = 50;

    const quarterTimer = setInterval(() => {
      setQuarterBeat(true);
      setTimeout(() => setQuarterBeat(false), flashDuration);
    }, quarterInterval);

    const eighthTimer = setInterval(() => {
      setEighthBeat(true);
      setTimeout(() => setEighthBeat(false), flashDuration);
    }, eighthInterval);

    const sixteenthTimer = setInterval(() => {
      setSixteenthBeat(true);
      setTimeout(() => setSixteenthBeat(false), flashDuration);
    }, sixteenthInterval);

    return () => {
      clearInterval(quarterTimer);
      clearInterval(eighthTimer);
      clearInterval(sixteenthTimer);
    };
  }, [state.isReady, isPlaying, bpm]);

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Subdivision Clocks</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={24} align="flex-end">
              <PlayButton
                isPlaying={isPlaying}
                onClick={handlePlayToggle}
              />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={40}
                  max={160}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
              </HStack>

              {/* Subdivision visualization */}
              <VStack gap={16}>
                <HStack gap={16}>
                  <div
                    style={{
                      width: 80,
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      color: colors.textMuted,
                    }}
                  >
                    Quarter
                  </div>
                  <BeatLight active={quarterBeat} color={colors.accent} size={20} />
                  <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textMuted
                  }}>
                    beatClock(bpm)
                  </div>
                </HStack>

                <HStack gap={16}>
                  <div
                    style={{
                      width: 80,
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      color: colors.textMuted,
                    }}
                  >
                    8th
                  </div>
                  <HStack gap={4}>
                    <BeatLight active={eighthBeat} color={colors.accentBlue} size={16} />
                    <BeatLight active={eighthBeat} color={colors.accentBlue} size={16} />
                  </HStack>
                  <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textMuted
                  }}>
                    subdivisionClock(bpm, 2)
                  </div>
                </HStack>

                <HStack gap={16}>
                  <div
                    style={{
                      width: 80,
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      color: colors.textMuted,
                    }}
                  >
                    16th
                  </div>
                  <HStack gap={2}>
                    {[0, 1, 2, 3].map((i) => (
                      <BeatLight
                        key={i}
                        active={sixteenthBeat}
                        color={colors.accentAlt}
                        size={12}
                      />
                    ))}
                  </HStack>
                  <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textMuted
                  }}>
                    subdivisionClock(bpm, 4)
                  </div>
                </HStack>
              </VStack>
            </VStack>
          </Card>
        </VStack>
    </StoryContainer>
  );
};

/**
 * Groove Patterns - Visualize accent patterns
 */
export const GroovePatternsDemo: Story = () => {
  const { state, start, render } = useAudioContext();
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [patternKey, setPatternKey] = useState<keyof typeof GroovePatterns>('standard');
  const [currentStep, setCurrentStep] = useState(0);

  const pattern = GroovePatterns[patternKey];

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

    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: isPlaying ? 1 : 0 }),
    });

    // Use 8th note clock for the pattern
    const patternSeq = el.seq2(
      { key: 'groove', seq: pattern as unknown as number[], hold: true, loop: true },
      transport.clock8th,
      0
    );

    // Click with velocity from pattern
    const env = el.adsr(0.001, 0.05, 0, 0.001, transport.clock8th);
    const click = el.mul(el.mul(el.cycle(660), env), patternSeq);

    const output = el.mul(click, 0.3);

    render(output, output);
  }, [state.isReady, bpm, isPlaying, pattern, render]);

  // JavaScript timer for step visualization
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = ((60 / bpm) * 1000) / 2; // 8th notes
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % pattern.length);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, isPlaying, bpm, pattern.length]);

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Groove Patterns</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={24} align="flex-end">
              <PlayButton
                isPlaying={isPlaying}
                onClick={handlePlayToggle}
              />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={140}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
              </HStack>

              {/* Pattern selector */}
              <VStack gap={8}>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                  }}
                >
                  Pattern
                </div>
                <HStack gap={4} style={{ flexWrap: 'wrap' }}>
                  {Object.keys(GroovePatterns).map((key) => (
                    <button
                      key={key}
                      onClick={() => setPatternKey(key as keyof typeof GroovePatterns)}
                      style={{
                        padding: '6px 10px',
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        fontWeight: 500,
                        border: `1px solid ${patternKey === key ? colors.accent : colors.border}`,
                        borderRadius: 4,
                        background: patternKey === key ? colors.accent : colors.surface,
                        color: patternKey === key ? '#fff' : colors.text,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </HStack>
              </VStack>

              {/* Pattern visualization */}
              <VStack gap={8}>
                <HStack gap={4}>
                  {pattern.map((velocity, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32,
                        height: 48,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: `${velocity * 40}px`,
                          background:
                            currentStep === i ? colors.accent : colors.accentAlt,
                          borderRadius: 2,
                          opacity: currentStep === i ? 1 : 0.6,
                          transition: 'opacity 0.05s',
                        }}
                      />
                    </div>
                  ))}
                </HStack>
                <HStack gap={4}>
                  {pattern.map((velocity, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32,
                        textAlign: 'center',
                        fontFamily: fonts.mono,
                        fontSize: 9,
                        color: colors.textMuted,
                      }}
                    >
                      {Math.round(velocity * 100)}
                    </div>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textMuted,
              lineHeight: 1.6,
            }}
          >
            Groove patterns add musical dynamics through velocity accents.
            <br />
            Use <span style={{ color: colors.text }}>accentPattern(clock, velocities)</span> to apply them.
          </div>
        </VStack>
    </StoryContainer>
  );
};

/**
 * Quantization - Grid snapping visualization
 */
export const Quantization: Story = () => {
  const [value, setValue] = useState(0.37);
  const [gridSize, setGridSize] = useState(0.25); // 16th notes

  const gridOptions = [
    { label: '1/4', value: 1 },
    { label: '1/8', value: 0.5 },
    { label: '1/16', value: 0.25 },
    { label: '1/32', value: 0.125 },
    { label: '1/8T', value: 1 / 3 },
  ];

  const quantized = Math.round(value / gridSize) * gridSize;
  const quantizedFloor = Math.floor(value / gridSize) * gridSize;
  const quantizedCeil = Math.ceil(value / gridSize) * gridSize;

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 1 / gridSize; i++) {
      lines.push(i * gridSize);
    }
    return lines;
  }, [gridSize]);

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Quantization</SectionTitle>

        <Card>
          <VStack gap={24}>
            {/* Grid size selector */}
            <VStack gap={8}>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: colors.textMuted,
                }}
              >
                Grid Size
              </div>
              <HStack gap={4}>
                {gridOptions.map(({ label, value: gv }) => (
                  <button
                    key={label}
                    onClick={() => setGridSize(gv)}
                    style={{
                      padding: '6px 12px',
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      fontWeight: 500,
                      border: `1px solid ${gridSize === gv ? colors.accent : colors.border}`,
                      borderRadius: 4,
                      background: gridSize === gv ? colors.accent : colors.surface,
                      color: gridSize === gv ? '#fff' : colors.text,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </HStack>
            </VStack>

            {/* Value control */}
            <SmallKnob
              value={value}
              onChange={setValue}
              min={0}
              max={1}
              label="Input Value"
              formatValue={(v) => v.toFixed(3)}
            />

            {/* Visual grid */}
            <VStack gap={12}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 80,
                  background: colors.surfaceAlt,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                {/* Grid lines */}
                {gridLines.map((pos, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${pos * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: colors.border,
                    }}
                  />
                ))}

                {/* Input value marker */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${value * 100}%`,
                    top: 10,
                    bottom: 10,
                    width: 2,
                    background: colors.text,
                    transform: 'translateX(-50%)',
                  }}
                />

                {/* Quantized markers */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${quantizedFloor * 100}%`,
                    bottom: 8,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.accentBlue,
                    transform: 'translateX(-50%)',
                  }}
                  title="floor"
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${quantized * 100}%`,
                    bottom: 8,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: colors.accent,
                    transform: 'translateX(-50%)',
                  }}
                  title="round"
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${quantizedCeil * 100}%`,
                    bottom: 8,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.accentAlt,
                    transform: 'translateX(-50%)',
                  }}
                  title="ceil"
                />
              </div>

              {/* Legend */}
              <HStack gap={16}>
                <HStack gap={6}>
                  <div style={{ width: 8, height: 8, background: colors.text, borderRadius: 2 }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                    Input: {value.toFixed(3)}
                  </span>
                </HStack>
                <HStack gap={6}>
                  <div style={{ width: 12, height: 12, background: colors.accent, borderRadius: '50%' }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                    quantize: {quantized.toFixed(3)}
                  </span>
                </HStack>
              </HStack>
              <HStack gap={16}>
                <HStack gap={6}>
                  <div style={{ width: 8, height: 8, background: colors.accentBlue, borderRadius: '50%' }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                    floor: {quantizedFloor.toFixed(3)}
                  </span>
                </HStack>
                <HStack gap={6}>
                  <div style={{ width: 8, height: 8, background: colors.accentAlt, borderRadius: '50%' }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                    ceil: {quantizedCeil.toFixed(3)}
                  </span>
                </HStack>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: colors.textMuted,
            lineHeight: 1.6,
          }}
        >
          Quantization snaps continuous values to a musical grid.
          <br />
          <span style={{ color: colors.text }}>quantize(value, grid)</span> - rounds to nearest
          <br />
          <span style={{ color: colors.text }}>quantizeFloor(value, grid)</span> - rounds down
          <br />
          <span style={{ color: colors.text }}>quantizeCeil(value, grid)</span> - rounds up
        </div>
      </VStack>
    </StoryContainer>
  );
};

/**
 * Time Conversion - Beat/time unit conversions
 */
export const TimeConversions: Story = () => {
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(1);

  // Calculate conversions
  const msPerBeat = 60000 / bpm;
  const ms = beats * msPerBeat;
  const hz = bpm / 60;
  const periodSec = 60 / bpm;
  const samples = beats * (48000 * 60) / bpm; // assuming 48kHz

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Time Conversions</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={32}>
              <SmallKnob
                value={bpm}
                onChange={setBpm}
                min={40}
                max={240}
                step={1}
                sensitivity={200}
                label="BPM"
              />
              <SmallKnob
                value={beats}
                onChange={setBeats}
                min={0.25}
                max={4}
                step={0.25}
                sensitivity={100}
                label="Beats"
                formatValue={(v) => v.toFixed(2)}
              />
            </HStack>

            {/* Conversion results */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
              }}
            >
              <ConversionResult
                label="Milliseconds"
                value={`${ms.toFixed(1)} ms`}
                formula="beatsToMs(beats, bpm)"
              />
              <ConversionResult
                label="Frequency"
                value={`${hz.toFixed(3)} Hz`}
                formula="bpmToHz(bpm)"
              />
              <ConversionResult
                label="Period"
                value={`${(periodSec * 1000).toFixed(1)} ms`}
                formula="bpmToPeriod(bpm)"
              />
              <ConversionResult
                label="Samples (48kHz)"
                value={`${Math.round(samples)}`}
                formula="beatsToSamples(beats, bpm)"
              />
            </div>
          </VStack>
        </Card>

        <Card>
          <VStack gap={12}>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: colors.textMuted,
              }}
            >
              Note Divisions
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              <NoteDivisionDisplay label="Whole" ms={msPerBeat * 4} />
              <NoteDivisionDisplay label="Half" ms={msPerBeat * 2} />
              <NoteDivisionDisplay label="Quarter" ms={msPerBeat} />
              <NoteDivisionDisplay label="8th" ms={msPerBeat / 2} />
              <NoteDivisionDisplay label="16th" ms={msPerBeat / 4} />
              <NoteDivisionDisplay label="32nd" ms={msPerBeat / 8} />
              <NoteDivisionDisplay label="8th Triplet" ms={msPerBeat / 3} />
              <NoteDivisionDisplay label="16th Triplet" ms={msPerBeat / 6} />
              <NoteDivisionDisplay label="Dotted 8th" ms={msPerBeat * 0.75} />
            </div>
          </VStack>
        </Card>
      </VStack>
    </StoryContainer>
  );
};

const ConversionResult = ({
  label,
  value,
  formula,
}: {
  label: string;
  value: string;
  formula: string;
}) => (
  <div
    style={{
      padding: 12,
      background: colors.surfaceAlt,
      borderRadius: 4,
    }}
  >
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 18,
        fontWeight: 500,
        color: colors.text,
        marginBottom: 4,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        color: colors.textMuted,
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 9,
        color: colors.accent,
      }}
    >
      {formula}
    </div>
  </div>
);

const NoteDivisionDisplay = ({ label, ms }: { label: string; ms: number }) => (
  <div
    style={{
      padding: 8,
      background: colors.surfaceAlt,
      borderRadius: 4,
    }}
  >
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        color: colors.textMuted,
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 13,
        fontWeight: 500,
        color: colors.text,
      }}
    >
      {ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(1)}ms`}
    </div>
  </div>
);
