# Elementary Audio Kit

Musical abstractions for [Elementary Audio](https://www.elementary.audio/) - timing, sequencing, and instruments.

> **Note**: This library is in early development. APIs may change.

## What is this?

Elementary Audio Kit provides higher-level building blocks for creating music applications with Elementary Audio. While Elementary gives you powerful DSP primitives, this library adds the musical concepts you need to build sequencers, drum machines, and synthesizers.

Think of it like this:
- **@elemaudio/core** → Low-level DSP primitives (like Core Audio)
- **@elementary-audio-kit/core** → Musical abstractions (like AudioKit)

## Installation

```bash
npm install @elementary-audio-kit/core @elemaudio/core
```

## Features

### Timing

Beat clocks, transport control, quantization, and groove utilities.

```typescript
import { createTransport, TimeSignatures } from '@elementary-audio-kit/core';
import { el } from '@elemaudio/core';

// Create a transport at 120 BPM in 4/4 time
const transport = createTransport({
  bpm: el.const({ key: 'bpm', value: 120 }),
  playing: el.const({ key: 'playing', value: 1 }),
  timeSignature: TimeSignatures.common,
});

// Use transport signals
transport.clock;      // Pulse on each beat
transport.clock16th;  // Pulse on each 16th note
transport.beat;       // Current beat count (0, 1, 2, ...)
transport.bar;        // Current bar count
transport.beatInBar;  // Beat within current bar (0-3 in 4/4)
```

### Sequencing

Step sequencers, trigger patterns, and Euclidean rhythms.

```typescript
import { euclideanTrigger, triggerPattern, patternFromString } from '@elementary-audio-kit/core';

// Euclidean rhythm - 5 hits distributed over 8 steps
const hihatTrigger = euclideanTrigger(5, 8, transport.clock);

// Manual trigger pattern
const kickTrigger = triggerPattern(
  [true, false, false, false, true, false, false, false],
  transport.clock
);

// String notation (x = hit, - = rest)
const snareTrigger = triggerPattern(
  patternFromString('----x-------x---'),
  transport.clock16th
);
```

### Putting it together

```typescript
import { createTransport, euclideanTrigger, triggerPattern } from '@elementary-audio-kit/core';
import { el } from '@elemaudio/core';

// Setup transport
const bpm = el.const({ key: 'bpm', value: 120 });
const playing = el.const({ key: 'playing', value: 1 });
const transport = createTransport({ bpm, playing });

// Create drum pattern
const kick = el.mul(
  el.sample({ path: 'kick', mode: 'trigger' },
    triggerPattern([true, false, false, false], transport.clock), 1),
  0.9
);

const hihat = el.mul(
  el.sample({ path: 'hihat', mode: 'trigger' },
    euclideanTrigger(5, 8, transport.clock), 1),
  0.4
);

// Mix and render
const mix = el.add(kick, hihat);
core.render(mix, mix);
```

## API Reference

### Timing Module

```typescript
import { ... } from '@elementary-audio-kit/core/timing';
```

| Function | Description |
|----------|-------------|
| `beatClock(bpm)` | Creates a pulse train at the given BPM |
| `subdivisionClock(bpm, subdivision)` | Creates a faster clock (2=8ths, 4=16ths) |
| `gatedClock(clock, gate)` | Clock that only ticks when gate is high |
| `beatCounter(clock)` | Counts beats from a clock signal |
| `barCounter(beats, beatsPerBar)` | Returns current bar number |
| `beatInBar(beats, beatsPerBar)` | Returns beat position within bar |
| `createTransport(config)` | Creates a complete transport with all signals |
| `quantize(value, gridSize)` | Snaps a value to the nearest grid point |
| `beatsToMs(beats, bpm)` | Converts beats to milliseconds |
| `swing(clock, amount)` | Adds swing to a clock signal |
| `accentPattern(clock, velocities)` | Creates a velocity accent pattern |

### Sequencing Module

```typescript
import { ... } from '@elementary-audio-kit/core/sequencing';
```

| Function | Description |
|----------|-------------|
| `stepSequencer(values, clock)` | Cycles through values on each clock tick |
| `triggerPattern(hits, clock)` | Creates a trigger pattern (1s and 0s) |
| `velocityPattern(velocities, clock)` | Creates a velocity pattern (0-1 values) |
| `euclidean(hits, steps)` | Generates a Euclidean rhythm pattern |
| `euclideanTrigger(hits, steps, clock)` | Creates an Elementary signal from Euclidean pattern |
| `presetTrigger(preset, clock)` | Creates a trigger from a named preset |
| `rotatePattern(pattern, steps)` | Rotates a pattern by N steps |
| `patternFromString(notation)` | Parses 'x--x--x-' notation to boolean array |

## Roadmap

- [ ] **Instruments**: Sampler, MonoSynth, PolySynth, DrumMachine
- [ ] **Effects**: Tempo-synced delay, reverb, chorus
- [ ] **MIDI**: Note scheduling, CC mapping
- [ ] **React hooks**: useTransport, useSequencer (separate package)

## Contributing

Contributions are welcome! This project aims to make Elementary Audio more accessible by providing musical building blocks that are missing from the core library.

## License

MIT
