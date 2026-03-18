import { useState, useCallback } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';

import { useAudioContext } from './useAudioContext';
import { StoryContainer, SectionTitle } from './StoryComponents';
import { PianoRoll, type NoteData, type RowConfig } from '../ui/PianoRoll';
import { StartButton } from '../ui/StartButton';
import { VStack } from '../ui/VStack';
import { Card } from '../ui/Card';
import { colors, fonts } from '../ui/tokens';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Default drum kit rows
const DRUM_ROWS: RowConfig[] = [
  { noteNumber: 36, label: 'Kick' },
  { noteNumber: 38, label: 'Snare' },
  { noteNumber: 42, label: 'Hi-Hat' },
  { noteNumber: 51, label: 'Ride' },
];

// Pre-filled 4-on-the-floor pattern
const DEFAULT_NOTES: NoteData[] = [
  { noteNumber: 36, velocity: 110, position: 0, duration: 0.25 },
  { noteNumber: 36, velocity: 110, position: 1, duration: 0.25 },
  { noteNumber: 36, velocity: 110, position: 2, duration: 0.25 },
  { noteNumber: 36, velocity: 110, position: 3, duration: 0.25 },
  { noteNumber: 38, velocity: 110, position: 1, duration: 0.25 },
  { noteNumber: 38, velocity: 110, position: 3, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 0, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 0.5, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 1, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 1.5, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 2, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 2.5, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 3, duration: 0.25 },
  { noteNumber: 42, velocity: 100, position: 3.5, duration: 0.25 },
  { noteNumber: 51, velocity: 100, position: 0.5, duration: 0.25 },
  { noteNumber: 51, velocity: 100, position: 1.5, duration: 0.25 },
  { noteNumber: 51, velocity: 100, position: 2.5, duration: 0.25 },
  { noteNumber: 51, velocity: 100, position: 3.5, duration: 0.25 },
];

/**
 * Read-only drum pattern with playback.
 */
export const DrumPattern: Story = () => {
  const { state, start, render } = useAudioContext();

  const handleNotePlay = useCallback(
    (noteNumber: number) => {
      if (!state.isReady) return;
      const freq = noteNumber === 36 ? 60 : noteNumber === 38 ? 200 : noteNumber === 42 ? 6000 : 3000;
      const osc = noteNumber >= 42
        ? el.mul(el.noise(), el.const({ key: 'pr-amp', value: 0.15 }))
        : el.mul(
            el.cycle(el.const({ key: 'pr-freq', value: freq })),
            el.const({ key: 'pr-amp', value: 0.2 })
          );
      render(osc, osc);
    },
    [state.isReady, render]
  );

  const handleMetronome = useCallback(() => {
    if (!state.isReady) return;
    const click = el.mul(
      el.cycle(el.const({ key: 'click-freq', value: 1000 })),
      el.const({ key: 'click-amp', value: 0.1 })
    );
    render(click, click);
  }, [state.isReady, render]);

  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Piano Roll — Drum Pattern</SectionTitle>

        <StartButton onClick={start} isReady={state.isReady} />

        <Card>
          <PianoRoll
            notes={DEFAULT_NOTES}
            rows={DRUM_ROWS}
            lengthInBars={1}
            defaultTempo={120}
            onNotePlay={handleNotePlay}
            onMetronomeTick={handleMetronome}
            defaultMetronomeOn={true}
          />
        </Card>
      </VStack>
    </StoryContainer>
  );
};
DrumPattern.meta = {
  title: 'Instruments/PianoRoll',
};

// Melodic rows
const MELODY_ROWS: RowConfig[] = [
  { noteNumber: 60, label: 'C4' },
  { noteNumber: 62, label: 'D4' },
  { noteNumber: 64, label: 'E4' },
  { noteNumber: 65, label: 'F4' },
  { noteNumber: 67, label: 'G4' },
];

const MELODY_NOTES: NoteData[] = [
  { noteNumber: 60, velocity: 100, position: 0, duration: 0.5 },
  { noteNumber: 64, velocity: 100, position: 0.5, duration: 0.5 },
  { noteNumber: 67, velocity: 100, position: 1, duration: 1 },
  { noteNumber: 65, velocity: 100, position: 2, duration: 0.5 },
  { noteNumber: 64, velocity: 100, position: 2.5, duration: 0.5 },
  { noteNumber: 62, velocity: 100, position: 3, duration: 1 },
];

/**
 * Editable melodic piano roll.
 */
export const EditableMelody: Story = () => {
  const { state, start, render } = useAudioContext();
  const [notes, setNotes] = useState<NoteData[]>(MELODY_NOTES);

  const handleNotePlay = useCallback(
    (noteNumber: number) => {
      if (!state.isReady) return;
      const freq = midiToFreq(noteNumber);
      const osc = el.mul(
        el.cycle(el.const({ key: 'mel-freq', value: freq })),
        el.const({ key: 'mel-amp', value: 0.2 })
      );
      render(osc, osc);
    },
    [state.isReady, render]
  );

  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Piano Roll — Editable Melody</SectionTitle>

        <StartButton onClick={start} isReady={state.isReady} />

        <Card>
          <PianoRoll
            notes={notes}
            rows={MELODY_ROWS}
            lengthInBars={1}
            editable={true}
            defaultTempo={100}
            onNotesChange={setNotes}
            onNotePlay={handleNotePlay}
            showMetronome={true}
          />
        </Card>

        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
          Click grid to add notes | Click note to delete | Drag to move | Drag right edge to resize
        </div>
      </VStack>
    </StoryContainer>
  );
};
EditableMelody.meta = {
  title: 'Instruments/PianoRoll/Editable Melody',
};
