/**
 * UI Components for audio applications.
 *
 * Atomic building blocks for interactive music interfaces.
 * All components use inline styles with design tokens — no CSS framework required.
 *
 * @packageDocumentation
 */

// Design tokens
export { colors, fonts, type Colors, type Fonts } from './tokens';

// Layout
export { HStack, type HStackProps } from './HStack';
export { VStack, type VStackProps } from './VStack';
export { Card, type CardProps } from './Card';

// Display
export { BeatLight, type BeatLightProps } from './BeatLight';
export { BeatRow, type BeatRowProps } from './BeatRow';
export { ParamDisplay, type ParamDisplayProps } from './ParamDisplay';
export { StepGrid, type StepGridProps } from './StepGrid';

// Controls
export { Knob, type KnobProps, type KnobRenderState } from './Knob';
export { PlayButton, type PlayButtonProps } from './PlayButton';
export { StartButton, type StartButtonProps } from './StartButton';

// Instruments
export { DrumPads, type DrumPadsProps } from './DrumPads';
export { PianoKeys, type PianoKeysProps } from './PianoKeys';
export { PianoRoll, type PianoRollProps, type NoteData, type RowConfig } from './PianoRoll';
export { Transport, type TransportProps } from './Transport';

// Hooks
export { useKnobDrag, type KnobDragOptions, type KnobDragResult } from './hooks/useKnobDrag';
export { useKeyboardMapping, type UseKeyboardMappingOptions } from './hooks/useKeyboardMapping';
export { useFlashState } from './hooks/useFlashState';
export { useClockTimer, type UseClockTimerOptions } from './hooks/useClockTimer';
