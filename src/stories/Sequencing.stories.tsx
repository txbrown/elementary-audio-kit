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
import { createTransport } from '../timing';
import {
  euclidean,
  euclideanRotated,
  EuclideanPresets,
  patternFromString,
  rotatePattern,
  reversePattern,
  invertPattern,
  combinePatterns,
} from '../sequencing';

// Reusable small knob - MUST be outside story component
const SmallKnob = ({
  value,
  onChange,
  min = 0,
  max = 1,
  label,
  step,
  sensitivity = 150,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  step?: number;
  sensitivity?: number;
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
            <circle cx={22} cy={22} r={18} fill="none" stroke={colors.border} strokeWidth={2} />
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
    <div style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.text, fontWeight: 500 }}>
      {value}
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

// Play button component
const PlayButton = ({ isPlaying, onClick }: { isPlaying: boolean; onClick: () => void }) => (
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
    }}
  >
    {isPlaying ? (
      <div style={{ width: 16, height: 16, background: '#fff', borderRadius: 2 }} />
    ) : (
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

// Pattern step button
const StepButton = ({
  active,
  current,
  onClick,
  size = 28,
}: {
  active: boolean;
  current: boolean;
  onClick?: () => void;
  size?: number;
}) => (
  <button
    onClick={onClick}
    style={{
      width: size,
      height: size,
      padding: 0,
      border: `1px solid ${current ? colors.accent : colors.border}`,
      borderRadius: 2,
      background: active
        ? current
          ? colors.accent
          : colors.accentAlt
        : current
          ? colors.surfaceAlt
          : colors.surface,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.05s',
    }}
  />
);

// Pattern display as string
const PatternString = ({ pattern }: { pattern: boolean[] }) => (
  <div
    style={{
      fontFamily: fonts.mono,
      fontSize: 14,
      letterSpacing: '0.1em',
      color: colors.text,
    }}
  >
    {pattern.map((v) => (v ? 'x' : '-')).join('')}
  </div>
);

/**
 * Euclidean Presets - World music rhythms
 */
export const EuclideanPresetsDemo: Story = () => {
  const { state, start, render } = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [presetKey, setPresetKey] = useState<keyof typeof EuclideanPresets>('tresillo');
  const [rotation, setRotation] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const preset = EuclideanPresets[presetKey];
  const pattern = useMemo(
    () => euclideanRotated(preset.hits, preset.steps, rotation),
    [preset.hits, preset.steps, rotation]
  );

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

    // Use 16th notes for finer patterns
    const patternSeq = el.seq2(
      { key: 'pattern', seq: pattern.map((v) => (v ? 1 : 0)), hold: true, loop: true },
      transport.clock16th,
      0
    );

    const env = el.adsr(0.001, 0.08, 0, 0.001, el.mul(transport.clock16th, patternSeq));
    const click = el.mul(el.cycle(660), env);
    const output = el.mul(click, 0.3);

    render(output, output);
  }, [state.isReady, bpm, isPlaying, pattern, render]);

  // Step visualization
  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = ((60 / bpm) * 1000) / 4; // 16th notes
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % pattern.length);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, isPlaying, bpm, pattern.length]);

  // Reset rotation when preset changes
  useEffect(() => {
    setRotation(0);
  }, [presetKey]);

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Euclidean Presets</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={24} align="flex-end">
              <PlayButton isPlaying={isPlaying} onClick={handlePlayToggle} />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={160}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
                <SmallKnob
                  value={rotation}
                  onChange={setRotation}
                  min={0}
                  max={preset.steps - 1}
                  step={1}
                  sensitivity={50}
                  label="Rotate"
                />
              </HStack>

              {/* Preset selector */}
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
                  Preset
                </div>
                <HStack gap={4} style={{ flexWrap: 'wrap' }}>
                  {Object.entries(EuclideanPresets).map(([key, { hits, steps }]) => (
                    <button
                      key={key}
                      onClick={() => setPresetKey(key as keyof typeof EuclideanPresets)}
                      style={{
                        padding: '6px 10px',
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        border: `1px solid ${presetKey === key ? colors.accent : colors.border}`,
                        borderRadius: 4,
                        background: presetKey === key ? colors.accent : colors.surface,
                        color: presetKey === key ? '#fff' : colors.text,
                        cursor: 'pointer',
                      }}
                    >
                      {key}
                      <span style={{ opacity: 0.6, marginLeft: 4 }}>
                        ({hits},{steps})
                      </span>
                    </button>
                  ))}
                </HStack>
              </VStack>

              {/* Pattern visualization */}
              <VStack gap={12}>
                <HStack gap={4} style={{ flexWrap: 'wrap' }}>
                  {pattern.map((active, i) => (
                    <StepButton key={i} active={active} current={currentStep === i} />
                  ))}
                </HStack>
                <PatternString pattern={pattern} />
              </VStack>
            </VStack>
          </Card>

          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, lineHeight: 1.6 }}>
            Euclidean rhythms distribute hits evenly across steps.
            <br />
            These presets represent traditional rhythms from world music.
          </div>
        </VStack>
    </StoryContainer>
  );
};

/**
 * Pattern Builder - Create patterns from string notation
 */
export const PatternBuilder: Story = () => {
  const { state, start, render } = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [notation, setNotation] = useState('x--x--x-');
  const [currentStep, setCurrentStep] = useState(0);

  const pattern = useMemo(() => patternFromString(notation), [notation]);

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

    const patternSeq = el.seq2(
      { key: 'builder', seq: pattern.map((v) => (v ? 1 : 0)), hold: true, loop: true },
      transport.clock8th,
      0
    );

    const env = el.adsr(0.001, 0.06, 0, 0.001, el.mul(transport.clock8th, patternSeq));
    const click = el.mul(el.cycle(550), env);
    const output = el.mul(click, 0.3);

    render(output, output);
  }, [state.isReady, bpm, isPlaying, pattern, render]);

  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = ((60 / bpm) * 1000) / 2;
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % pattern.length);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, isPlaying, bpm, pattern.length]);

  const toggleStep = (index: number) => {
    const chars = notation.split('');
    chars[index] = chars[index] === 'x' ? '-' : 'x';
    setNotation(chars.join(''));
  };

  const presets = [
    { label: 'Four on floor', pattern: 'x---x---x---x---' },
    { label: 'Offbeat', pattern: '--x---x---x---x-' },
    { label: 'Tresillo', pattern: 'x--x--x-' },
    { label: 'Syncopated', pattern: 'x-x--x-x--x-x--x' },
    { label: 'Sparse', pattern: 'x-------x-------' },
    { label: 'Dense', pattern: 'x-x-x-x-x-x-x-x-' },
  ];

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Pattern Builder</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={24} align="flex-end">
              <PlayButton isPlaying={isPlaying} onClick={handlePlayToggle} />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={180}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
              </HStack>

              {/* Pattern input */}
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
                  Pattern (x = hit, - = rest)
                </div>
                <input
                  type="text"
                  value={notation}
                  onChange={(e) => setNotation(e.target.value.replace(/[^x\-\.0]/gi, '-'))}
                  style={{
                    padding: '8px 12px',
                    fontFamily: fonts.mono,
                    fontSize: 16,
                    letterSpacing: '0.15em',
                    background: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    color: colors.text,
                    width: '100%',
                  }}
                />
              </VStack>

              {/* Visual pattern */}
              <HStack gap={4} style={{ flexWrap: 'wrap' }}>
                {pattern.map((active, i) => (
                  <StepButton
                    key={i}
                    active={active}
                    current={currentStep === i}
                    onClick={() => toggleStep(i)}
                    size={32}
                  />
                ))}
              </HStack>

              {/* Presets */}
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
                  Presets
                </div>
                <HStack gap={4} style={{ flexWrap: 'wrap' }}>
                  {presets.map(({ label, pattern: p }) => (
                    <button
                      key={label}
                      onClick={() => setNotation(p)}
                      style={{
                        padding: '6px 10px',
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        border: `1px solid ${notation === p ? colors.accent : colors.border}`,
                        borderRadius: 4,
                        background: notation === p ? colors.accent : colors.surface,
                        color: notation === p ? '#fff' : colors.text,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, lineHeight: 1.6 }}>
            Use <span style={{ color: colors.text }}>patternFromString('x--x--x-')</span> to create patterns.
            <br />
            Click steps to toggle them on/off.
          </div>
        </VStack>
    </StoryContainer>
  );
};

/**
 * Pattern Operations - Rotate, reverse, invert, combine
 */
export const PatternOperations: Story = () => {
  const [basePattern] = useState([true, true, false, true, false, true, false, false]);
  const [rotation, setRotation] = useState(0);
  const [showReverse, setShowReverse] = useState(false);
  const [showInvert, setShowInvert] = useState(false);

  const rotated = useMemo(() => rotatePattern(basePattern, rotation), [basePattern, rotation]);
  const reversed = useMemo(() => reversePattern(basePattern), [basePattern]);
  const inverted = useMemo(() => invertPattern(basePattern), [basePattern]);
  const combined = useMemo(
    () => combinePatterns(basePattern, rotatePattern(basePattern, 2)),
    [basePattern]
  );

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Pattern Operations</SectionTitle>

        <Card>
          <VStack gap={20}>
            {/* Original */}
            <VStack gap={8}>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Original
              </div>
              <HStack gap={4}>
                {basePattern.map((active, i) => (
                  <StepButton key={i} active={active} current={false} />
                ))}
              </HStack>
              <PatternString pattern={basePattern} />
            </VStack>

            {/* Rotation */}
            <VStack gap={8}>
              <HStack gap={16} align="center">
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  rotatePattern(pattern, {rotation})
                </div>
                <input
                  type="range"
                  min={-7}
                  max={7}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  style={{ width: 120 }}
                />
              </HStack>
              <HStack gap={4}>
                {rotated.map((active, i) => (
                  <StepButton key={i} active={active} current={false} />
                ))}
              </HStack>
              <PatternString pattern={rotated} />
            </VStack>

            {/* Reverse */}
            <VStack gap={8}>
              <HStack gap={16} align="center">
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  reversePattern(pattern)
                </div>
                <button
                  onClick={() => setShowReverse(!showReverse)}
                  style={{
                    padding: '4px 8px',
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    background: showReverse ? colors.accent : colors.surface,
                    color: showReverse ? '#fff' : colors.text,
                    cursor: 'pointer',
                  }}
                >
                  {showReverse ? 'Hide' : 'Show'}
                </button>
              </HStack>
              {showReverse && (
                <>
                  <HStack gap={4}>
                    {reversed.map((active, i) => (
                      <StepButton key={i} active={active} current={false} />
                    ))}
                  </HStack>
                  <PatternString pattern={reversed} />
                </>
              )}
            </VStack>

            {/* Invert */}
            <VStack gap={8}>
              <HStack gap={16} align="center">
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  invertPattern(pattern)
                </div>
                <button
                  onClick={() => setShowInvert(!showInvert)}
                  style={{
                    padding: '4px 8px',
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    background: showInvert ? colors.accent : colors.surface,
                    color: showInvert ? '#fff' : colors.text,
                    cursor: 'pointer',
                  }}
                >
                  {showInvert ? 'Hide' : 'Show'}
                </button>
              </HStack>
              {showInvert && (
                <>
                  <HStack gap={4}>
                    {inverted.map((active, i) => (
                      <StepButton key={i} active={active} current={false} />
                    ))}
                  </HStack>
                  <PatternString pattern={inverted} />
                </>
              )}
            </VStack>

            {/* Combine */}
            <VStack gap={8}>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                combinePatterns(pattern, rotatePattern(pattern, 2))
              </div>
              <HStack gap={4}>
                {combined.map((active, i) => (
                  <StepButton key={i} active={active} current={false} />
                ))}
              </HStack>
              <PatternString pattern={combined} />
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </StoryContainer>
  );
};

/**
 * Step Sequencer - Melodic sequencer with frequencies
 */
export const StepSequencer: Story = () => {
  const { state, start, render } = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [sequence, setSequence] = useState([
    440, 440, 523, 523, 587, 587, 523, 0,
    494, 494, 440, 440, 392, 392, 349, 0,
  ]);

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

  const notes = [
    { freq: 0, label: '-' },
    { freq: 261, label: 'C' },
    { freq: 293, label: 'D' },
    { freq: 329, label: 'E' },
    { freq: 349, label: 'F' },
    { freq: 392, label: 'G' },
    { freq: 440, label: 'A' },
    { freq: 494, label: 'B' },
    { freq: 523, label: 'C+' },
    { freq: 587, label: 'D+' },
  ];

  useEffect(() => {
    if (!state.isReady) return;

    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: isPlaying ? 1 : 0 }),
    });

    const freq = el.seq2(
      { key: 'melody', seq: sequence, hold: true, loop: true },
      transport.clock8th,
      0
    );

    // Gate based on frequency > 0
    const gate = el.ge(freq, 1);
    const env = el.adsr(0.01, 0.1, 0.3, 0.2, gate);
    const osc = el.mul(el.cycle(freq), env);
    const output = el.mul(osc, 0.25);

    render(output, output);
  }, [state.isReady, bpm, isPlaying, sequence, render]);

  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = ((60 / bpm) * 1000) / 2;
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % sequence.length);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, isPlaying, bpm, sequence.length]);

  const cycleNote = (index: number) => {
    const currentFreq = sequence[index];
    const currentNoteIndex = notes.findIndex((n) => n.freq === currentFreq);
    const nextNoteIndex = (currentNoteIndex + 1) % notes.length;
    const newSequence = [...sequence];
    newSequence[index] = notes[nextNoteIndex].freq;
    setSequence(newSequence);
  };

  const getNoteLabel = (freq: number) => {
    const note = notes.find((n) => n.freq === freq);
    return note?.label ?? '?';
  };

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Step Sequencer</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={24} align="flex-end">
              <PlayButton isPlaying={isPlaying} onClick={handlePlayToggle} />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={180}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
              </HStack>

              {/* Sequence grid */}
              <VStack gap={8}>
                <HStack gap={4} style={{ flexWrap: 'wrap' }}>
                  {sequence.map((freq, i) => (
                    <button
                      key={i}
                      onClick={() => cycleNote(i)}
                      style={{
                        width: 36,
                        height: 48,
                        padding: 0,
                        border: `1px solid ${currentStep === i ? colors.accent : colors.border}`,
                        borderRadius: 4,
                        background:
                          freq > 0
                            ? currentStep === i
                              ? colors.accent
                              : colors.accentAlt
                            : currentStep === i
                              ? colors.surfaceAlt
                              : colors.surface,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: fonts.mono,
                        fontSize: 11,
                        fontWeight: 500,
                        color: freq > 0 ? '#fff' : colors.textMuted,
                      }}
                    >
                      {getNoteLabel(freq)}
                    </button>
                  ))}
                </HStack>
                <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                  Click steps to cycle through notes
                </div>
              </VStack>
            </VStack>
          </Card>

          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, lineHeight: 1.6 }}>
            Use <span style={{ color: colors.text }}>stepSequencer([440, 523, ...], clock)</span> for melodic
            sequences.
          </div>
        </VStack>
    </StoryContainer>
  );
};

/**
 * Drum Machine - Multi-track pattern sequencer
 */
export const DrumMachine: Story = () => {
  const { state, start, render } = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(110);
  const [currentStep, setCurrentStep] = useState(0);
  const [patterns, setPatterns] = useState({
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    perc: [false, false, true, false, false, false, true, false, false, true, false, false, false, false, true, false],
  });

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

  const tracks = [
    { key: 'kick' as const, label: 'Kick', freq: 60, color: colors.accent },
    { key: 'snare' as const, label: 'Snare', freq: 200, color: colors.accentBlue },
    { key: 'hihat' as const, label: 'HiHat', freq: 8000, color: colors.accentAlt },
    { key: 'perc' as const, label: 'Perc', freq: 400, color: '#9966ff' },
  ];

  useEffect(() => {
    if (!state.isReady) return;

    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: isPlaying ? 1 : 0 }),
    });

    // Create drum sounds for each track
    const kickSeq = el.seq2(
      { key: 'kick-seq', seq: patterns.kick.map((v) => (v ? 1 : 0)), hold: true, loop: true },
      transport.clock16th,
      0
    );
    const kickEnv = el.adsr(0.001, 0.15, 0, 0.001, el.mul(transport.clock16th, kickSeq));
    const kickPitch = el.mul(el.add(60, el.mul(kickEnv, 100)), kickEnv);
    const kick = el.mul(el.cycle(kickPitch), kickEnv);

    const snareSeq = el.seq2(
      { key: 'snare-seq', seq: patterns.snare.map((v) => (v ? 1 : 0)), hold: true, loop: true },
      transport.clock16th,
      0
    );
    const snareEnv = el.adsr(0.001, 0.1, 0, 0.001, el.mul(transport.clock16th, snareSeq));
    const snare = el.mul(el.add(el.mul(el.noise(), 0.5), el.mul(el.cycle(200), 0.3)), snareEnv);

    const hihatSeq = el.seq2(
      { key: 'hihat-seq', seq: patterns.hihat.map((v) => (v ? 1 : 0)), hold: true, loop: true },
      transport.clock16th,
      0
    );
    const hihatTrig = el.mul(transport.clock16th, hihatSeq);
    // Short, tight envelope to differentiate from snare
    const hihatEnv = el.adsr(0.001, 0.025, 0, 0.001, hihatTrig);
    const hihat = el.mul(el.noise(), hihatEnv);

    const percSeq = el.seq2(
      { key: 'perc-seq', seq: patterns.perc.map((v) => (v ? 1 : 0)), hold: true, loop: true },
      transport.clock16th,
      0
    );
    const percEnv = el.adsr(0.001, 0.08, 0, 0.001, el.mul(transport.clock16th, percSeq));
    const perc = el.mul(el.cycle(400), percEnv);

    const mix = el.add(
      el.mul(kick, 0.8),
      el.add(el.mul(snare, 0.5), el.add(el.mul(hihat, 0.35), el.mul(perc, 0.3)))
    );
    const output = el.mul(mix, 0.4);

    render(output, output);
  }, [state.isReady, bpm, isPlaying, patterns, render]);

  useEffect(() => {
    if (!state.isReady || !isPlaying) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = ((60 / bpm) * 1000) / 4;
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % 16);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, isPlaying, bpm]);

  const toggleStep = (track: keyof typeof patterns, index: number) => {
    setPatterns((prev) => ({
      ...prev,
      [track]: prev[track].map((v, i) => (i === index ? !v : v)),
    }));
  };

  return (
    <StoryContainer>
      <VStack gap={32}>
        <SectionTitle>Drum Machine</SectionTitle>

        <Card>
          <VStack gap={24}>
            <HStack gap={24} align="flex-end">
              <PlayButton isPlaying={isPlaying} onClick={handlePlayToggle} />
                <SmallKnob
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={160}
                  step={1}
                  sensitivity={200}
                  label="BPM"
                />
              </HStack>

              {/* Pattern grid */}
              <VStack gap={12}>
                {tracks.map(({ key, label, color }) => (
                  <HStack key={key} gap={8} align="center">
                    <div
                      style={{
                        width: 48,
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        color: colors.textMuted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </div>
                    <HStack gap={2}>
                      {patterns[key].map((active, i) => (
                        <button
                          key={i}
                          onClick={() => toggleStep(key, i)}
                          style={{
                            width: 24,
                            height: 24,
                            padding: 0,
                            border: `1px solid ${currentStep === i ? color : colors.border}`,
                            borderRadius: 2,
                            background: active
                              ? currentStep === i
                                ? color
                                : `${color}99`
                              : currentStep === i
                                ? colors.surfaceAlt
                                : i % 4 === 0
                                  ? colors.surfaceAlt
                                  : colors.surface,
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </HStack>
                  </HStack>
                ))}
              </VStack>

              {/* Beat markers */}
              <HStack gap={8} style={{ marginLeft: 56 }}>
                {[1, 2, 3, 4].map((beat) => (
                  <div
                    key={beat}
                    style={{
                      width: 24 * 4 + 2 * 3,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      color: colors.textMuted,
                      textAlign: 'center',
                    }}
                  >
                    {beat}
                  </div>
                ))}
              </HStack>
            </VStack>
          </Card>

          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, lineHeight: 1.6 }}>
            Use <span style={{ color: colors.text }}>triggerPattern()</span> for each drum track.
            <br />
            Click steps to toggle them on/off.
          </div>
        </VStack>
    </StoryContainer>
  );
};
