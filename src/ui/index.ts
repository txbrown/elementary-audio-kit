/**
 * UI Components for audio applications.
 *
 * Headless, accessible components for building audio interfaces.
 * All components follow WAI-ARIA patterns and provide render props
 * for complete styling freedom.
 *
 * @packageDocumentation
 */

// Components
export { Knob, type KnobProps, type KnobRenderState } from './Knob';

// Hooks
export { useKnobDrag, type KnobDragOptions, type KnobDragResult } from './hooks/useKnobDrag';
