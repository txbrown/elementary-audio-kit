# Music Markdown Specification

A syntax for embedding interactive music in any markdown document.

One block type: ` ```music `. The variant goes on the fence line. Configuration is YAML. Note data follows a `---` separator.

## Block types

### `drums` — Interactive pad grid

```
```music drums
kit: 808
pads: 16
```
```

Renders a tappable drum pad grid. Built-in synthesis when no samples are loaded.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `kit` | string | `synth` | Sound source (`synth`, `808`, or custom sample pack URL) |
| `pads` | number | `16` | Number of pads (4, 8, or 16) |
| `labels` | string[] | GM names | Custom pad labels |
| `highlight` | number[] | — | Pad indices to visually highlight |

### `keys` — Interactive piano keyboard

```
```music keys
octaves: 2
start: C4
sound: piano
```
```

Renders a playable piano keyboard with computer keyboard mapping.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `octaves` | number | `2` | Number of octaves to display |
| `start` | note | `C4` | Starting note |
| `sound` | string | `synth` | Sound source (`synth`, `piano`, `organ`, or sample pack URL) |
| `highlight` | note[] | — | Notes to visually highlight (e.g. `[C4, E4, G4]`) |
| `color` | string | `#00FF9E` | Highlight color |

### `sequence` — Note pattern with playback

```
```music sequence
tempo: 120
sound: piano
---
C4  0  4
E4  0  4
G4  0  4
```
```

Renders a piano roll grid with playback controls and a smooth playhead.

**Configuration (above `---`):**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | — | Named reference for use in `score` blocks |
| `tempo` | number | `120` | BPM |
| `sound` | string | `synth` | Sound source |
| `bars` | number | `1` | Length in bars |
| `editable` | boolean | `false` | Allow note editing |
| `metronome` | boolean | `false` | Metronome on by default |

**Note data (below `---`):**

Each line is a note:

```
<pitch>  <position>  <duration>  [velocity]
```

- `pitch` — MIDI note name (`C4`, `F#3`, `Bb5`) or number (`60`)
- `position` — start time in beats (quarter notes)
- `duration` — length in beats
- `velocity` — 0–127, optional (default: 100)

```
C4   0    1        ← C4 at beat 0, 1 beat long
E4   0.5  0.5  80  ← E4 at beat 0.5, half beat, velocity 80
G4   1    2        ← G4 at beat 1, 2 beats long
```

### `pattern` — Step pattern (drum machine)

```
```music pattern
name: basic-beat
tempo: 120
steps: 16
---
kick   x . . . x . . . x . . . x . . .
snare  . . . . x . . . . . . . x . . .
hihat  x . x . x . x . x . x . x . x .
```
```

Renders a step sequencer grid with per-row labels and toggleable steps.

**Configuration:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | — | Named reference |
| `tempo` | number | `120` | BPM |
| `steps` | number | `16` | Steps per bar |
| `kit` | string | `synth` | Sound source for all rows |
| `editable` | boolean | `false` | Allow step toggling |

**Pattern data:**

Each line is a track:

```
<label>  <steps>
```

- `x` = hit
- `.` = rest
- `o` = ghost note (lower velocity)
- Spaces between characters are optional (but improve readability)

### `score` — Arrangement (multiple tracks)

```
```music score
tempo: 140
time: 4/4
bars: 4
---
drums   808       basic-beat
bass    synth     C2 0 4 | E2 4 4 | G2 8 4 | C3 12 4
keys    piano     melody
```
```

Combines multiple tracks into a playable arrangement with a shared transport.

**Configuration:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tempo` | number | `120` | BPM |
| `time` | string | `4/4` | Time signature |
| `bars` | number | `1` | Total length in bars |

**Track data:**

Each line is a track:

```
<label>  <sound>  <content>
```

Content can be:
- A `name` reference to a `pattern` or `sequence` block defined elsewhere in the document
- Inline notes separated by `|` (same format as `sequence`)

### `transport` — Standalone transport controls

```
```music transport
tempo: 120
time: 4/4
loop: true
```
```

Renders play/stop, tempo display, and beat indicator dots.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tempo` | number | `120` | BPM |
| `time` | string | `4/4` | Time signature |
| `loop` | boolean | `true` | Loop indicator |

## Note format

Notes use standard pitch notation:

| Format | Example | Description |
|--------|---------|-------------|
| Letter + octave | `C4` | Middle C |
| Sharp | `F#3` | F sharp, octave 3 |
| Flat | `Bb5` | B flat, octave 5 |
| MIDI number | `60` | Equivalent to C4 |

## Named references

Blocks with a `name` property can be referenced by other blocks:

```
```music pattern
name: verse-drums
tempo: 120
steps: 16
---
kick   x . . . x . . . x . . . x . . .
snare  . . . . x . . . . . . . x . . .
hihat  x . x . x . x . x . x . x . x .
```

```music score
tempo: 120
bars: 4
---
drums  808    verse-drums
bass   synth  E2 0 4 | G2 4 4 | A2 8 4 | B2 12 4
```
```

The `score` block references `verse-drums` by name. The renderer resolves the reference to the pattern data defined above.

## Sound sources

The `sound` and `kit` properties accept:

| Value | Description |
|-------|-------------|
| `synth` | Built-in synthesis (always available, no download) |
| `808` | Classic drum machine (built-in) |
| `piano` | Acoustic piano (built-in) |
| A URL | Custom sample pack (fetched and decoded) |

Built-in sounds use programmatic synthesis — they work offline with zero configuration.

## Extension points

The base spec is intentionally minimal. Platform-specific features are added as extra properties that the renderer can choose to support:

```
```music keys
octaves: 2
sound: piano

# Midicircuit extensions (ignored by generic renderers)
soundbank: argon-8-rhode-keys
validation: chord
expected: [C4, E4, G4]
```
```

Unknown properties are ignored by renderers that don't support them. This allows lesson platforms, DAWs, and other tools to extend the format without breaking compatibility.
