import { useState } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';

import { useAudioContext } from './useAudioContext';
import { StoryContainer, SectionTitle } from './StoryComponents';
import { DrumPads } from '../ui/DrumPads';
import { StartButton } from '../ui/StartButton';
import { VStack } from '../ui/VStack';
import { HStack } from '../ui/HStack';
import { Card } from '../ui/Card';
import { colors, fonts } from '../ui/tokens';

// Simple synthesized drum sounds via Elementary
function drumVoice(freq: number, decay: number, gate: number, key: string) {
  const g = el.const({ key: `${key}-gate`, value: gate });
  const env = el.mul(
    el.sample(
      { path: `${key}-buf`, mode: 'trigger', key: `${key}-samp` },
      g,
      1
    ),
    g
  );
  return env;
}

/**
 * Interactive drum pads with synthesized sounds.
 */
export const Default: Story = () => {
  const { state, start, render } = useAudioContext();
  const [lastPad, setLastPad] = useState<number | null>(null);

  const handlePadTrigger = (padIndex: number) => {
    setLastPad(padIndex);

    if (!state.isReady) return;

    // Simple sine-based drum synthesis
    const freqs = [60, 200, 800, 1000, 6000, 3000, 500, 700, 150, 130, 110, 90, 300, 400, 600, 900];
    const decays = [8, 15, 60, 50, 60, 10, 20, 25, 10, 10, 10, 10, 6, 6, 6, 6];
    const freq = freqs[padIndex] ?? 440;
    const decay = decays[padIndex] ?? 15;

    // Quick and dirty: render a decaying sine
    const trigger = el.const({ key: 'drum-trig', value: Math.random() + 1 });
    const osc = el.cycle(el.const({ key: 'drum-freq', value: freq }));
    const env = el.mul(
      osc,
      el.mul(
        el.const({ key: 'drum-amp', value: 0.3 }),
        trigger
      )
    );
    render(env, env);
  };

  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Drum Pads</SectionTitle>

        <StartButton onClick={start} isReady={state.isReady} />

        <Card style={{ maxWidth: 360 }}>
          <DrumPads
            onPadTrigger={handlePadTrigger}
            defaultKeyboardEnabled={false}
          />
        </Card>

        {lastPad !== null && (
          <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
            Last triggered: Pad {lastPad}
          </div>
        )}
      </VStack>
    </StoryContainer>
  );
};
Default.meta = {
  title: 'Instruments/DrumPads',
};

/**
 * Drum pads with highlighted pads and custom labels.
 */
export const Highlighted: Story = () => {
  const [taps, setTaps] = useState(0);

  return (
    <StoryContainer>
      <VStack gap={24}>
        <SectionTitle>Drum Pads — Highlighted</SectionTitle>

        <Card style={{ maxWidth: 360 }}>
          <DrumPads
            onPadTrigger={() => setTaps((t) => t + 1)}
            highlightedPads={[0, 1, 4, 5]}
            defaultKeyboardEnabled={true}
          />
        </Card>

        <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
          Total taps: {taps} | Keyboard enabled by default
        </div>
      </VStack>
    </StoryContainer>
  );
};
Highlighted.meta = {
  title: 'Instruments/DrumPads/Highlighted',
};
