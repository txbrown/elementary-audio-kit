import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { el } from '@elemaudio/core';
import type { Story } from '@ladle/react';
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

interface Note {
  pitch: number;      // MIDI note (0-127)
  start: number;      // Start time in steps (0-15)
  duration: number;   // Duration in steps
  velocity: number;   // 0-1
}

interface Clip {
  id: string;
  notes: Note[];
  color: string;
}

interface Track {
  id: string;
  name: string;
  type: 'drums' | 'melodic' | 'bass';
  color: string;
  clips: (Clip | null)[];  // One per scene, null = empty slot
  volume: number;
  muted: boolean;
}

// ============================================================================
// Sample Configuration - 90s MPC Sample Pack
// ============================================================================

const SAMPLE_PATHS = {
  // Drums
  'drums/kick': '/samples/drums/kick.wav',
  'drums/snare': '/samples/drums/snare.wav',
  'drums/hihat-closed': '/samples/drums/hihat-closed.wav',
  'drums/hihat-open': '/samples/drums/hihat-open.wav',
  'drums/shaker': '/samples/drums/shaker.wav',
  'drums/perc': '/samples/drums/perc.wav',
  // Bass - Moog Bass at C2
  'bass/bass-c2': '/samples/bass/bass-c2.wav',
  // Melodic - Synth
  'melodic/synth': '/samples/melodic/synth-c3.wav',
  'melodic/pluck': '/samples/melodic/pluck.wav',
};

// Base MIDI notes for pitch-shifted samples
const BASS_BASE_MIDI = 36;    // C2
const MELODIC_BASE_MIDI = 48; // C3

// Drum MIDI to sample key mapping
const DRUM_SAMPLE_MAP: Record<number, string> = {
  36: 'drums/kick',
  38: 'drums/snare',
  42: 'drums/hihat-closed',
  46: 'drums/hihat-open',
  39: 'drums/shaker',
  37: 'drums/perc',
};

// ============================================================================
// Constants & Defaults
// ============================================================================

const STEPS = 32; // 2 bars (16 steps per bar)
const OCTAVE_RANGE = 24; // 2 octaves

const TRACK_COLORS = {
  drums: colors.accentAlt,    // Green
  bass: colors.accentBlue,    // Blue
  melodic: colors.accent,     // Orange
};

const TRACK_ICONS = {
  drums: '\u{1F941}',    // drum
  bass: '\u{1F3B8}',     // guitar
  melodic: '\u{1F3B5}',  // music note
};

// ===================
// DRUMS - 90s Boom Bap (2-bar patterns, 32 steps)
// ===================

// Scene 1: Classic boom bap - simple and hard
const drumClip1 = (): Clip => ({
  id: 'drum-1',
  notes: [
    // Kick - classic pattern
    { pitch: 36, start: 0, duration: 1, velocity: 0.95 },
    { pitch: 36, start: 10, duration: 1, velocity: 0.8 },
    { pitch: 36, start: 16, duration: 1, velocity: 0.9 },
    { pitch: 36, start: 26, duration: 1, velocity: 0.75 },
    // Snare on 2 and 4
    { pitch: 38, start: 4, duration: 1, velocity: 0.9 },
    { pitch: 38, start: 12, duration: 1, velocity: 0.85 },
    { pitch: 38, start: 20, duration: 1, velocity: 0.9 },
    { pitch: 38, start: 28, duration: 1, velocity: 0.85 },
    // Hi-hats - 8ths with swing feel
    ...[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((s, i) => ({
      pitch: 42,
      start: s,
      duration: 1,
      velocity: s % 4 === 0 ? 0.5 : 0.35,
    })),
    // Open hat accent
    { pitch: 46, start: 14, duration: 1, velocity: 0.4 },
    { pitch: 46, start: 30, duration: 1, velocity: 0.4 },
  ],
  color: TRACK_COLORS.drums,
});

// Scene 2: Add ghost kicks
const drumClip2 = (): Clip => ({
  id: 'drum-2',
  notes: [
    // Kick with ghost notes
    { pitch: 36, start: 0, duration: 1, velocity: 0.95 },
    { pitch: 36, start: 7, duration: 1, velocity: 0.5 },   // Ghost
    { pitch: 36, start: 10, duration: 1, velocity: 0.85 },
    { pitch: 36, start: 16, duration: 1, velocity: 0.9 },
    { pitch: 36, start: 23, duration: 1, velocity: 0.5 },  // Ghost
    { pitch: 36, start: 26, duration: 1, velocity: 0.8 },
    // Snare
    { pitch: 38, start: 4, duration: 1, velocity: 0.9 },
    { pitch: 38, start: 12, duration: 1, velocity: 0.85 },
    { pitch: 38, start: 20, duration: 1, velocity: 0.9 },
    { pitch: 38, start: 28, duration: 1, velocity: 0.85 },
    // Hi-hats
    ...[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((s) => ({
      pitch: 42,
      start: s,
      duration: 1,
      velocity: s % 4 === 0 ? 0.5 : 0.3,
    })),
    { pitch: 46, start: 14, duration: 1, velocity: 0.45 },
    { pitch: 46, start: 30, duration: 1, velocity: 0.45 },
    // Shaker on upbeats
    { pitch: 39, start: 2, duration: 1, velocity: 0.25 },
    { pitch: 39, start: 18, duration: 1, velocity: 0.25 },
  ],
  color: TRACK_COLORS.drums,
});

// Scene 3: Breakdown - sparse
const drumClip3 = (): Clip => ({
  id: 'drum-3',
  notes: [
    { pitch: 36, start: 0, duration: 1, velocity: 0.9 },
    { pitch: 36, start: 16, duration: 1, velocity: 0.85 },
    { pitch: 38, start: 12, duration: 1, velocity: 0.7 },
    { pitch: 38, start: 28, duration: 1, velocity: 0.7 },
    // Just a few hats
    { pitch: 42, start: 0, duration: 1, velocity: 0.3 },
    { pitch: 42, start: 8, duration: 1, velocity: 0.25 },
    { pitch: 42, start: 16, duration: 1, velocity: 0.3 },
    { pitch: 42, start: 24, duration: 1, velocity: 0.25 },
    // Perc hit
    { pitch: 37, start: 6, duration: 1, velocity: 0.4 },
    { pitch: 37, start: 22, duration: 1, velocity: 0.35 },
  ],
  color: TRACK_COLORS.drums,
});

// Scene 4: Full energy with fills
const drumClip4 = (): Clip => ({
  id: 'drum-4',
  notes: [
    // Punchy kicks
    { pitch: 36, start: 0, duration: 1, velocity: 0.95 },
    { pitch: 36, start: 6, duration: 1, velocity: 0.6 },
    { pitch: 36, start: 10, duration: 1, velocity: 0.85 },
    { pitch: 36, start: 16, duration: 1, velocity: 0.9 },
    { pitch: 36, start: 22, duration: 1, velocity: 0.6 },
    { pitch: 36, start: 26, duration: 1, velocity: 0.8 },
    { pitch: 36, start: 30, duration: 1, velocity: 0.7 }, // Pickup
    // Snare with ghost
    { pitch: 38, start: 4, duration: 1, velocity: 0.9 },
    { pitch: 38, start: 11, duration: 1, velocity: 0.4 }, // Ghost
    { pitch: 38, start: 12, duration: 1, velocity: 0.85 },
    { pitch: 38, start: 20, duration: 1, velocity: 0.9 },
    { pitch: 38, start: 27, duration: 1, velocity: 0.4 }, // Ghost
    { pitch: 38, start: 28, duration: 1, velocity: 0.9 },
    // 16th note hats for energy
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((s) => ({
      pitch: 42,
      start: s,
      duration: 1,
      velocity: s % 4 === 0 ? 0.45 : s % 2 === 0 ? 0.3 : 0.2,
    })),
    { pitch: 46, start: 14, duration: 1, velocity: 0.5 },
    { pitch: 46, start: 30, duration: 1, velocity: 0.5 },
  ],
  color: TRACK_COLORS.drums,
});

// ===================
// BASS - 90s Moog Bass (2-bar patterns)
// Cm - Fm - Gm - Cm progression
// ===================

// Scene 1: Simple root notes
const bassClip1 = (): Clip => ({
  id: 'bass-1',
  notes: [
    // C - F
    { pitch: 36, start: 0, duration: 14, velocity: 0.85 },  // C2
    { pitch: 41, start: 16, duration: 14, velocity: 0.85 }, // F2
  ],
  color: TRACK_COLORS.bass,
});

// Scene 2: Add movement
const bassClip2 = (): Clip => ({
  id: 'bass-2',
  notes: [
    // C with octave
    { pitch: 36, start: 0, duration: 6, velocity: 0.85 },   // C2
    { pitch: 48, start: 6, duration: 2, velocity: 0.6 },    // C3
    { pitch: 36, start: 10, duration: 4, velocity: 0.8 },   // C2
    // F with movement
    { pitch: 41, start: 16, duration: 6, velocity: 0.85 },  // F2
    { pitch: 43, start: 22, duration: 2, velocity: 0.6 },   // G2
    { pitch: 41, start: 26, duration: 4, velocity: 0.8 },   // F2
  ],
  color: TRACK_COLORS.bass,
});

// Scene 3: G - C (variation)
const bassClip3 = (): Clip => ({
  id: 'bass-3',
  notes: [
    { pitch: 43, start: 0, duration: 14, velocity: 0.8 },   // G2
    { pitch: 36, start: 16, duration: 14, velocity: 0.85 }, // C2
  ],
  color: TRACK_COLORS.bass,
});

// Scene 4: Funky bass line
const bassClip4 = (): Clip => ({
  id: 'bass-4',
  notes: [
    // C groove
    { pitch: 36, start: 0, duration: 3, velocity: 0.9 },   // C2
    { pitch: 36, start: 6, duration: 2, velocity: 0.6 },   // C2
    { pitch: 39, start: 10, duration: 2, velocity: 0.7 },  // D#2
    { pitch: 36, start: 14, duration: 2, velocity: 0.8 },  // C2
    // F groove
    { pitch: 41, start: 16, duration: 3, velocity: 0.9 },  // F2
    { pitch: 41, start: 22, duration: 2, velocity: 0.6 },  // F2
    { pitch: 43, start: 26, duration: 2, velocity: 0.7 },  // G2
    { pitch: 41, start: 30, duration: 2, velocity: 0.8 },  // F2
  ],
  color: TRACK_COLORS.bass,
});

// ===================
// CHORDS - 90s Hip Hop Stabs (2-bar patterns)
// Cm7 - Fm7 - Gm7 - Cm7
// ===================

// Scene 1: Simple stabs
const chordsClip1 = (): Clip => ({
  id: 'chords-1',
  notes: [
    // Cm7 stab
    { pitch: 48, start: 0, duration: 2, velocity: 0.6 },   // C3
    { pitch: 55, start: 0, duration: 2, velocity: 0.55 },  // G3
    { pitch: 58, start: 0, duration: 2, velocity: 0.5 },   // Bb3
    { pitch: 63, start: 0, duration: 2, velocity: 0.5 },   // Eb4
    // Fm7 stab
    { pitch: 53, start: 16, duration: 2, velocity: 0.6 },  // F3
    { pitch: 60, start: 16, duration: 2, velocity: 0.55 }, // C4
    { pitch: 63, start: 16, duration: 2, velocity: 0.5 },  // Eb4
    { pitch: 68, start: 16, duration: 2, velocity: 0.5 },  // Ab4
  ],
  color: TRACK_COLORS.melodic,
});

// Scene 2: Rhythmic stabs
const chordsClip2 = (): Clip => ({
  id: 'chords-2',
  notes: [
    // Cm7 - hit, rest, hit
    { pitch: 48, start: 0, duration: 2, velocity: 0.6 },
    { pitch: 55, start: 0, duration: 2, velocity: 0.55 },
    { pitch: 58, start: 0, duration: 2, velocity: 0.5 },
    { pitch: 48, start: 6, duration: 2, velocity: 0.45 },
    { pitch: 55, start: 6, duration: 2, velocity: 0.4 },
    { pitch: 58, start: 6, duration: 2, velocity: 0.4 },
    // Fm7 - same rhythm
    { pitch: 53, start: 16, duration: 2, velocity: 0.6 },
    { pitch: 60, start: 16, duration: 2, velocity: 0.55 },
    { pitch: 63, start: 16, duration: 2, velocity: 0.5 },
    { pitch: 53, start: 22, duration: 2, velocity: 0.45 },
    { pitch: 60, start: 22, duration: 2, velocity: 0.4 },
    { pitch: 63, start: 22, duration: 2, velocity: 0.4 },
  ],
  color: TRACK_COLORS.melodic,
});

// Scene 3: Gm7 - Cm7 (B section)
const chordsClip3 = (): Clip => ({
  id: 'chords-3',
  notes: [
    // Gm7 stab
    { pitch: 55, start: 0, duration: 2, velocity: 0.55 },  // G3
    { pitch: 62, start: 0, duration: 2, velocity: 0.5 },   // D4
    { pitch: 65, start: 0, duration: 2, velocity: 0.5 },   // F4
    { pitch: 70, start: 0, duration: 2, velocity: 0.45 },  // Bb4
    // Cm7 stab
    { pitch: 48, start: 16, duration: 2, velocity: 0.6 },
    { pitch: 55, start: 16, duration: 2, velocity: 0.55 },
    { pitch: 58, start: 16, duration: 2, velocity: 0.5 },
    { pitch: 63, start: 16, duration: 2, velocity: 0.5 },
  ],
  color: TRACK_COLORS.melodic,
});

// Scene 4: Full stab pattern
const chordsClip4 = (): Clip => ({
  id: 'chords-4',
  notes: [
    // Cm7 - busy pattern
    { pitch: 48, start: 0, duration: 2, velocity: 0.65 },
    { pitch: 55, start: 0, duration: 2, velocity: 0.6 },
    { pitch: 58, start: 0, duration: 2, velocity: 0.55 },
    { pitch: 63, start: 0, duration: 2, velocity: 0.5 },
    { pitch: 48, start: 4, duration: 1, velocity: 0.4 },
    { pitch: 55, start: 4, duration: 1, velocity: 0.35 },
    { pitch: 48, start: 10, duration: 2, velocity: 0.5 },
    { pitch: 55, start: 10, duration: 2, velocity: 0.45 },
    // Fm7 - busy pattern
    { pitch: 53, start: 16, duration: 2, velocity: 0.65 },
    { pitch: 60, start: 16, duration: 2, velocity: 0.6 },
    { pitch: 63, start: 16, duration: 2, velocity: 0.55 },
    { pitch: 68, start: 16, duration: 2, velocity: 0.5 },
    { pitch: 53, start: 20, duration: 1, velocity: 0.4 },
    { pitch: 60, start: 20, duration: 1, velocity: 0.35 },
    { pitch: 53, start: 26, duration: 2, velocity: 0.5 },
    { pitch: 60, start: 26, duration: 2, velocity: 0.45 },
  ],
  color: TRACK_COLORS.melodic,
});

const DEFAULT_TRACKS: Track[] = [
  {
    id: 'drums',
    name: 'Drums',
    type: 'drums',
    color: TRACK_COLORS.drums,
    clips: [drumClip1(), drumClip2(), drumClip3(), drumClip4()],
    volume: 0.75,
    muted: false,
  },
  {
    id: 'bass',
    name: 'Bass',
    type: 'bass',
    color: TRACK_COLORS.bass,
    clips: [bassClip1(), bassClip2(), bassClip3(), bassClip4()],
    volume: 0.9,
    muted: false,
  },
  {
    id: 'melodic',
    name: 'Synth',
    type: 'melodic',
    color: TRACK_COLORS.melodic,
    clips: [chordsClip1(), chordsClip2(), chordsClip3(), chordsClip4()],
    volume: 0.55,
    muted: false,
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

function midiToRate(targetMidi: number, baseMidi: number): number {
  return Math.pow(2, (targetMidi - baseMidi) / 12);
}

function generateUUID(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================================================
// Sample Loading
// ============================================================================

async function loadSamples(
  core: any,
  audioContext: AudioContext,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const sampleEntries = Object.entries(SAMPLE_PATHS);
  let loaded = 0;

  for (const [key, path] of sampleEntries) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        console.warn(`Failed to load sample: ${path}`);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Extract channel data
      const channels: Float32Array[] = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }

      // Update VFS with sample data
      await core.updateVirtualFileSystem({
        [key]: channels.length === 1 ? channels[0] : channels,
      });

      loaded++;
      onProgress?.(loaded, sampleEntries.length);
    } catch (err) {
      console.warn(`Error loading sample ${path}:`, err);
    }
  }
}

// ============================================================================
// UI Components
// ============================================================================

// Transport Controls
const TransportBar = ({
  playing,
  bpm,
  currentScene,
  currentStep,
  onPlayToggle,
  onBpmChange,
}: {
  playing: boolean;
  bpm: number;
  currentScene: number;
  currentStep: number;
  onPlayToggle: () => void;
  onBpmChange: (bpm: number) => void;
}) => (
  <HStack
    gap={24}
    align="center"
    style={{
      padding: '12px 16px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
    }}
  >
    {/* Play/Stop */}
    <button
      onClick={onPlayToggle}
      style={{
        width: 48,
        height: 48,
        borderRadius: 4,
        border: 'none',
        background: playing ? colors.accent : colors.accentAlt,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {playing ? (
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

    {/* BPM */}
    <VStack gap={2} align="center">
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 24,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {bpm}
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
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
        onChange={(e) => onBpmChange(parseInt(e.target.value))}
        style={{ width: 80 }}
      />
    </VStack>

    <div style={{ width: 1, height: 40, background: colors.border }} />

    {/* Position display: Scene.Bar.Beat */}
    <VStack gap={2} align="center">
      <div style={{ fontFamily: fonts.mono, fontSize: 18, color: colors.text }}>
        {currentScene + 1}.{Math.floor(currentStep / 16) + 1}.{(Math.floor(currentStep / 4) % 4) + 1}
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: colors.textMuted,
        }}
      >
        Scene.Bar.Beat
      </div>
    </VStack>

    {/* Beat indicators (8 beats for 2 bars) */}
    <HStack gap={3}>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          style={{
            width: i % 4 === 0 ? 12 : 8,
            height: i % 4 === 0 ? 12 : 8,
            borderRadius: '50%',
            background: Math.floor(currentStep / 4) === i && playing ? colors.accent : colors.surfaceAlt,
            border: `1px solid ${Math.floor(currentStep / 4) === i && playing ? colors.accent : colors.border}`,
          }}
        />
      ))}
    </HStack>
  </HStack>
);

// Track Header Component
const TrackHeader = ({
  track,
  onMuteToggle,
  onVolumeChange,
}: {
  track: Track;
  onMuteToggle: () => void;
  onVolumeChange: (v: number) => void;
}) => (
  <HStack
    gap={8}
    align="center"
    style={{
      width: 140,
      padding: '8px 12px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 4,
    }}
  >
    <div style={{ fontSize: 18 }}>{TRACK_ICONS[track.type]}</div>
    <div
      style={{
        flex: 1,
        fontFamily: fonts.mono,
        fontSize: 11,
        fontWeight: 500,
        color: track.muted ? colors.textMuted : colors.text,
        textTransform: 'uppercase',
      }}
    >
      {track.name}
    </div>
    <button
      onClick={onMuteToggle}
      style={{
        width: 20,
        height: 20,
        borderRadius: 3,
        border: 'none',
        background: track.muted ? colors.accent : colors.surfaceAlt,
        cursor: 'pointer',
        fontFamily: fonts.mono,
        fontSize: 9,
        fontWeight: 600,
        color: track.muted ? '#fff' : colors.textMuted,
      }}
    >
      M
    </button>
    <input
      type="range"
      min={0}
      max={100}
      value={track.volume * 100}
      onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
      style={{ width: 40, height: 4, opacity: track.muted ? 0.4 : 1 }}
    />
  </HStack>
);

// Scene Header Component
const SceneHeader = ({
  sceneIndex,
  isCurrentScene,
  onClick,
}: {
  sceneIndex: number;
  isCurrentScene: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      height: 32,
      border: `1px solid ${isCurrentScene ? colors.accent : colors.border}`,
      borderRadius: 4,
      background: isCurrentScene ? `${colors.accent}33` : colors.surface,
      cursor: 'pointer',
      fontFamily: fonts.mono,
      fontSize: 11,
      fontWeight: 500,
      color: isCurrentScene ? colors.accent : colors.text,
    }}
  >
    Scene {sceneIndex + 1}
  </button>
);

// Mini note preview for clips
const ClipPreview = ({
  clip,
  trackType,
}: {
  clip: Clip;
  trackType: 'drums' | 'melodic' | 'bass';
}) => {
  const baseOctave = trackType === 'bass' ? 36 : trackType === 'drums' ? 36 : 48;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {clip.notes.map((note, i) => {
        const normalizedPitch = trackType === 'drums'
          ? (note.pitch - 35) / 12
          : (note.pitch - baseOctave) / 24;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(note.start / STEPS) * 100}%`,
              bottom: `${Math.min(Math.max(normalizedPitch * 100, 5), 95)}%`,
              width: trackType === 'drums' ? 4 : `${(note.duration / STEPS) * 100}%`,
              height: trackType === 'drums' ? 4 : 3,
              borderRadius: trackType === 'drums' ? '50%' : 1,
              background: clip.color,
              opacity: note.velocity,
            }}
          />
        );
      })}
    </div>
  );
};

// Clip Cell Component
const ClipCell = ({
  clip,
  trackType,
  trackColor,
  isCurrentScene,
  onClick,
}: {
  clip: Clip | null;
  trackType: 'drums' | 'melodic' | 'bass';
  trackColor: string;
  isCurrentScene: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      height: 48,
      border: `1px solid ${isCurrentScene ? colors.accent : clip ? trackColor : colors.border}`,
      borderRadius: 4,
      background: clip ? `${trackColor}22` : colors.surface,
      cursor: 'pointer',
      position: 'relative',
      padding: 4,
      overflow: 'hidden',
    }}
  >
    {clip ? (
      <>
        <ClipPreview clip={clip} trackType={trackType} />
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 14,
            height: 14,
            borderRadius: 2,
            background: `${colors.bg}cc`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
          }}
        >
          {'\u270F'}
        </div>
      </>
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textMuted,
          fontSize: 20,
          fontWeight: 300,
        }}
      >
        +
      </div>
    )}
  </button>
);

// Piano Roll Component
const PianoRoll = ({
  clip,
  trackType,
  onClose,
  onNotesChange,
}: {
  clip: Clip;
  trackType: 'drums' | 'melodic' | 'bass';
  onClose: () => void;
  onNotesChange: (notes: Note[]) => void;
}) => {
  const [notes, setNotes] = useState<Note[]>(clip.notes);

  const isDrums = trackType === 'drums';
  const noteRange = isDrums
    ? [36, 37, 38, 39, 42, 46]
    : Array.from({ length: OCTAVE_RANGE }, (_, i) => (trackType === 'bass' ? 36 : 48) + i);

  const noteLabels = isDrums
    ? ['Kick', 'Rim', 'Snare', 'Clap', 'HH-C', 'HH-O']
    : noteRange.map(midiToNoteName);

  const toggleNote = (pitch: number, step: number) => {
    const existingNoteIndex = notes.findIndex((n) => n.pitch === pitch && n.start === step);
    let newNotes: Note[];

    if (existingNoteIndex >= 0) {
      newNotes = notes.filter((_, i) => i !== existingNoteIndex);
    } else {
      newNotes = [...notes, { pitch, start: step, duration: isDrums ? 1 : 2, velocity: 0.8 }];
    }

    setNotes(newNotes);
    onNotesChange(newNotes);
  };

  const hasNote = (pitch: number, step: number) =>
    notes.some((n) => n.pitch === pitch && n.start <= step && step < n.start + n.duration);

  const isNoteStart = (pitch: number, step: number) =>
    notes.some((n) => n.pitch === pitch && n.start === step);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `${colors.bg}ee`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 20,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <VStack gap={16}>
          <HStack gap={16} align="center">
            <div style={{ fontFamily: fonts.mono, fontSize: 14, fontWeight: 600, color: colors.text }}>
              {isDrums ? 'Drum Editor' : 'Piano Roll'} - {trackType.toUpperCase()}
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
                cursor: 'pointer',
                fontFamily: fonts.mono,
                fontSize: 14,
                color: colors.text,
              }}
            >
              {'\u00D7'}
            </button>
          </HStack>

          <div style={{ display: 'flex', gap: 0 }}>
            <VStack gap={0}>
              {[...noteRange].reverse().map((pitch, i) => (
                <div
                  key={pitch}
                  style={{
                    width: 60,
                    height: 20,
                    background: !isDrums && [1, 3, 6, 8, 10].includes(pitch % 12) ? colors.surfaceAlt : colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRight: 'none',
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 4,
                    color: colors.textMuted,
                  }}
                >
                  {noteLabels[noteRange.length - 1 - i]}
                </div>
              ))}
            </VStack>

            <div style={{ display: 'flex' }}>
              {Array.from({ length: STEPS }, (_, step) => (
                <VStack key={step} gap={0}>
                  {[...noteRange].reverse().map((pitch) => {
                    const isActive = hasNote(pitch, step);
                    const isStart = isNoteStart(pitch, step);
                    const isDownbeat = step % 4 === 0;

                    return (
                      <button
                        key={pitch}
                        onClick={() => toggleNote(pitch, step)}
                        style={{
                          width: 28,
                          height: 20,
                          padding: 0,
                          border: `1px solid ${colors.border}`,
                          borderLeft: step === 0 ? `1px solid ${colors.border}` : 'none',
                          borderTop: 'none',
                          background: isActive
                            ? isStart ? clip.color : `${clip.color}88`
                            : isDownbeat ? colors.surfaceAlt : colors.surface,
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </VStack>
              ))}
            </div>
          </div>

          <HStack gap={0} style={{ marginLeft: 60 }}>
            {Array.from({ length: STEPS }, (_, i) => (
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

          <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
            Click to add/remove notes
          </div>
        </VStack>
      </div>
    </div>
  );
};

// ============================================================================
// Main Story Component
// ============================================================================

export const SessionView: Story = () => {
  const { state, start, render, core } = useAudioContext();

  // Sample loading state
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // DAW State
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [bpm, setBpm] = useState(92); // Classic 90s hip hop tempo
  const [playing, setPlaying] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false); // Play after samples load
  const [currentScene, setCurrentScene] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const totalScenes = 4;

  // Piano roll state
  const [editingClip, setEditingClip] = useState<{
    trackId: string;
    sceneIndex: number;
    clip: Clip;
  } | null>(null);

  // Load samples when audio is ready
  useEffect(() => {
    if (!state.isReady || !core || samplesLoaded || isLoading) return;

    setIsLoading(true);
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    loadSamples(core, ctx, (loaded, total) => {
      setLoadProgress(loaded / total);
    }).then(() => {
      setSamplesLoaded(true);
      setIsLoading(false);
      // Auto-play if user clicked play before samples were loaded
      if (pendingPlay) {
        setPlaying(true);
        setPendingPlay(false);
      }
    });

    return () => {
      ctx.close();
    };
  }, [state.isReady, core, samplesLoaded, isLoading, pendingPlay]);

  // Handle play toggle - initializes audio on first click
  const handlePlayToggle = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      return;
    }

    // If audio not ready, start it and set pending play
    if (!state.isReady) {
      setPendingPlay(true);
      await start();
      return;
    }

    // If samples not loaded yet, set pending play
    if (!samplesLoaded) {
      setPendingPlay(true);
      return;
    }

    setPlaying(true);
  }, [playing, state.isReady, samplesLoaded, start]);

  // Track actions
  const toggleMute = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)));
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, volume } : t)));
  }, []);

  // Clip actions
  const handleClipClick = useCallback(
    (trackId: string, sceneIndex: number) => {
      const track = tracks.find((t) => t.id === trackId);
      if (!track) return;

      const clip = track.clips[sceneIndex];

      if (clip) {
        setEditingClip({ trackId, sceneIndex, clip });
      } else {
        const newClip: Clip = { id: generateUUID(), notes: [], color: track.color };
        setTracks((prev) =>
          prev.map((t) =>
            t.id === trackId
              ? { ...t, clips: t.clips.map((c, i) => (i === sceneIndex ? newClip : c)) }
              : t
          )
        );
        setEditingClip({ trackId, sceneIndex, clip: newClip });
      }
    },
    [tracks]
  );

  const updateClipNotes = useCallback(
    (notes: Note[]) => {
      if (!editingClip) return;

      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingClip.trackId
            ? { ...t, clips: t.clips.map((c, i) => (i === editingClip.sceneIndex && c ? { ...c, notes } : c)) }
            : t
        )
      );

      setEditingClip((prev) => (prev ? { ...prev, clip: { ...prev.clip, notes } } : null));
    },
    [editingClip]
  );

  // Audio rendering with samples
  useEffect(() => {
    if (!state.isReady || !samplesLoaded) return;

    const transport = createTransport({
      bpm: el.const({ key: 'bpm', value: bpm }),
      playing: el.const({ key: 'playing', value: playing ? 1 : 0 }),
    });

    // Build audio for each track in the current scene
    const trackSignals = tracks.map((track) => {
      if (track.muted) return el.const({ value: 0 });

      const clip = track.clips[currentScene];
      if (!clip || clip.notes.length === 0) return el.const({ value: 0 });

      if (track.type === 'drums') {
        // Drums: trigger samples at original pitch
        const drumPitches = [36, 37, 38, 39, 42, 46];
        const drumSignals = drumPitches.map((pitch) => {
          const notesForPitch = clip.notes.filter((n) => n.pitch === pitch);
          if (notesForPitch.length === 0) return el.const({ value: 0 });

          const sampleKey = DRUM_SAMPLE_MAP[pitch];
          if (!sampleKey) return el.const({ value: 0 });

          // Create trigger pattern
          const pattern = Array(STEPS).fill(0);
          notesForPitch.forEach((n) => { pattern[n.start] = n.velocity; });

          const seq = el.seq2(
            { key: `${track.id}-${pitch}-seq`, seq: pattern, hold: true, loop: true },
            transport.clock16th,
            0
          );
          const trig = el.mul(transport.clock16th, seq);

          // Sample playback with trigger
          return el.mul(
            el.sample({ path: sampleKey, mode: 'trigger' }, trig, 1),
            el.const({ value: notesForPitch[0]?.velocity ?? 0.8 })
          );
        });

        let mix = drumSignals[0];
        for (let i = 1; i < drumSignals.length; i++) {
          mix = el.add(mix, drumSignals[i]);
        }
        return el.mul(mix, track.volume);
      } else {
        // Bass / Melodic: pitch-shifted sample playback
        const baseMidi = track.type === 'bass' ? BASS_BASE_MIDI : MELODIC_BASE_MIDI;
        const sampleKey = track.type === 'bass' ? 'bass/bass-c2' : 'melodic/synth';

        // Group notes by pitch and create layered playback
        const uniquePitches = [...new Set(clip.notes.map((n) => n.pitch))];

        const pitchSignals = uniquePitches.map((pitch) => {
          const notesForPitch = clip.notes.filter((n) => n.pitch === pitch);

          // Create trigger pattern for this pitch
          const pattern = Array(STEPS).fill(0);
          notesForPitch.forEach((n) => { pattern[n.start] = n.velocity; });

          const seq = el.seq2(
            { key: `${track.id}-${pitch}-seq`, seq: pattern, hold: true, loop: true },
            transport.clock16th,
            0
          );
          const trig = el.mul(transport.clock16th, seq);

          // Calculate playback rate for pitch shifting
          const rate = midiToRate(pitch, baseMidi);

          // Sample playback with pitch shift
          return el.mul(
            el.sample({ path: sampleKey, mode: 'trigger' }, trig, rate),
            el.const({ value: notesForPitch[0]?.velocity ?? 0.8 })
          );
        });

        if (pitchSignals.length === 0) return el.const({ value: 0 });

        let mix = pitchSignals[0];
        for (let i = 1; i < pitchSignals.length; i++) {
          mix = el.add(mix, pitchSignals[i]);
        }
        return el.mul(mix, track.volume);
      }
    });

    // Mix all tracks
    let mix = trackSignals[0];
    for (let i = 1; i < trackSignals.length; i++) {
      mix = el.add(mix, trackSignals[i]);
    }

    // Master output with soft limiter
    const output = el.mul(el.tanh(el.mul(mix, 1.5)), 0.5);
    render(output, output);
  }, [state.isReady, samplesLoaded, bpm, playing, tracks, currentScene, render]);

  // Step visualization timer
  useEffect(() => {
    if (!state.isReady || !playing) return;

    const stepInterval = ((60 / bpm) * 1000) / 4;
    let step = 0;

    const timer = setInterval(() => {
      setCurrentStep(step % STEPS);
      step++;
    }, stepInterval);

    return () => clearInterval(timer);
  }, [state.isReady, playing, bpm]);

  // Reset step on stop
  useEffect(() => {
    if (!playing) setCurrentStep(0);
  }, [playing]);

  // Determine UI state
  const isInitializing = pendingPlay && (!state.isReady || !samplesLoaded);

  return (
    <StoryContainer style={{ padding: 24 }}>
      <VStack gap={24}>
        <HStack gap={12} align="center">
          <div style={{ fontFamily: fonts.mono, fontSize: 16, fontWeight: 600, letterSpacing: '0.1em', color: colors.text }}>
            SESSION VIEW
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
            90s MPC Hip Hop
          </div>
          {isInitializing && (
            <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.accent }}>
              Loading... {Math.round(loadProgress * 100)}%
            </div>
          )}
        </HStack>

        <TransportBar
          playing={playing}
          bpm={bpm}
          currentScene={currentScene}
          currentStep={currentStep}
          onPlayToggle={handlePlayToggle}
          onBpmChange={setBpm}
        />

          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            {/* Grid layout for perfect alignment */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 24px repeat(4, 80px)',
                rowGap: 8,
                columnGap: 8,
              }}
            >
              {/* Scene headers row */}
              <div /> {/* Empty cell for track header column */}
              <div /> {/* Spacer column */}
              {Array.from({ length: totalScenes }, (_, i) => (
                <SceneHeader
                  key={i}
                  sceneIndex={i}
                  isCurrentScene={currentScene === i && playing}
                  onClick={() => setCurrentScene(i)}
                />
              ))}

              {/* Track rows */}
              {tracks.map((track) => (
                <Fragment key={track.id}>
                  <TrackHeader
                    track={track}
                    onMuteToggle={() => toggleMute(track.id)}
                    onVolumeChange={(v) => setTrackVolume(track.id, v)}
                  />
                  <div /> {/* Spacer column */}
                  {track.clips.map((clip, sceneIndex) => (
                    <ClipCell
                      key={sceneIndex}
                      clip={clip}
                      trackType={track.type}
                      trackColor={track.color}
                      isCurrentScene={currentScene === sceneIndex && playing}
                      onClick={() => handleClipClick(track.id, sceneIndex)}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, lineHeight: 1.6 }}>
            Click Play to start {'\u2022'} Click clip to edit in piano roll {'\u2022'} Click scene header to switch scenes
          </div>
        </VStack>

      {editingClip && (
        <PianoRoll
          clip={editingClip.clip}
          trackType={tracks.find((t) => t.id === editingClip.trackId)?.type || 'melodic'}
          onClose={() => setEditingClip(null)}
          onNotesChange={updateClipNotes}
        />
      )}
    </StoryContainer>
  );
};
