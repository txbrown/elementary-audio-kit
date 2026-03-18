import { useState } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';

import { useAudioContext } from './useAudioContext';
import { StoryContainer, SectionTitle } from './StoryComponents';
import { PianoKeys } from '../ui/PianoKeys';
import { StartButton } from '../ui/StartButton';
import { VStack } from '../ui/VStack';
import { Card } from '../ui/Card';
import { colors, fonts } from '../ui/tokens';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

/**
 * Interactive piano keyboard with simple sine synthesis.
 */
export const Default: Story = () => {
  const { state, start, render } = useAudioContext();
  const [activeNote, setActiveNote] = useState<number | null>(null);

  const handleNoteOn = (midiNote: number) => {
    setActiveNote(midiNote);

    if (!state.isReady) return;

    const freq = midiToFreq(midiNote);
    const osc = el.cycle(el.const({ key: 'piano-freq', value: freq }));
    const env = el.mul(osc, el.const({ key: 'piano-amp', value: 0.2 }));
    render(env, env);
  };

  const handleNoteOff = (midiNote: number) => {
    if (activeNote === midiNote) {
      setActiveNote(null);
    }

    if (!state.isReady) return;
    // Render silence on release
    const silence = el.const({ key: 'piano-amp', value: 0 });
    render(silence, silence);
  };

  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Piano Keys</SectionTitle>

        <StartButton onClick={start} isReady={state.isReady} />

        <Card>
          <PianoKeys
            octaves={2}
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
          />
        </Card>

        {activeNote !== null && (
          <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
            Playing: {midiToName(activeNote)} (MIDI {activeNote})
          </div>
        )}
      </VStack>
    </StoryContainer>
  );
};
Default.meta = {
  title: 'Instruments/PianoKeys',
};

/**
 * Piano with highlighted chord notes (C major).
 */
export const ChordHighlight: Story = () => {
  const [notesPlayed, setNotesPlayed] = useState<Set<number>>(new Set());

  // C major chord across 2 octaves: C4, E4, G4, C5, E5, G5
  const highlighted = [60, 64, 67, 72, 76, 79];

  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Piano Keys — C Major Chord</SectionTitle>

        <Card>
          <PianoKeys
            octaves={2}
            highlightedNotes={highlighted}
            onNoteOn={(midi) => setNotesPlayed((prev) => new Set(prev).add(midi))}
            onNoteOff={() => {}}
            defaultKeyboardEnabled={true}
          />
        </Card>

        <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
          Notes played: {notesPlayed.size} | Highlighted: C, E, G
        </div>
      </VStack>
    </StoryContainer>
  );
};
ChordHighlight.meta = {
  title: 'Instruments/PianoKeys/Chord Highlight',
};

/**
 * Three octaves starting from C3.
 */
export const ThreeOctaves: Story = () => {
  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Piano Keys — 3 Octaves from C3</SectionTitle>

        <Card>
          <PianoKeys
            octaves={3}
            startNote={48}
            onNoteOn={() => {}}
            onNoteOff={() => {}}
            defaultKeyboardEnabled={true}
            defaultKeyboardOctave={3}
          />
        </Card>
      </VStack>
    </StoryContainer>
  );
};
ThreeOctaves.meta = {
  title: 'Instruments/PianoKeys/Three Octaves',
};
