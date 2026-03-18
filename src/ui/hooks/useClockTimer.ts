import { useCallback, useRef, useState } from 'react';
import { useMountEffect } from './useMountEffect';

export interface UseClockTimerOptions {
  /** Tempo in BPM */
  tempo: number;
  /** Total number of steps in the loop */
  totalSteps: number;
  /** Steps per beat (default: 4 for 16th notes) */
  subdivision?: number;
  /** Called on each step (for triggering notes/clicks) */
  onStep?: (step: number) => void;
}

/**
 * Clock-corrected playback timer with smooth visual playhead.
 *
 * Imperative API: call start() / stop() from event handlers.
 * No useEffect — mount effect only for cleanup.
 */
export function useClockTimer(options: UseClockTimerOptions): {
  currentStep: number;
  playheadPosition: number;
  start: () => void;
  stop: () => void;
  isRunning: boolean;
} {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [currentStep, setCurrentStep] = useState(-1);
  const [playheadPosition, setPlayheadPosition] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentStepRef = useRef(-1);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setCurrentStep(-1);
    setPlayheadPosition(-1);
    currentStepRef.current = -1;
    setIsRunning(false);
  }, [cleanup]);

  const start = useCallback(() => {
    cleanup();

    const { tempo, subdivision = 4, onStep } = optionsRef.current;
    const intervalMs = (60 / tempo / subdivision) * 1000;
    const startTime = performance.now();
    let tickCount = 0;
    let lastTriggeredStep = 0;

    currentStepRef.current = 0;
    setCurrentStep(0);
    setIsRunning(true);
    onStep?.(0);

    // Audio: clock-corrected setTimeout
    function audioTick() {
      tickCount++;
      const { totalSteps: ts, onStep: stepCb } = optionsRef.current;
      const step = tickCount % ts;
      currentStepRef.current = step;
      lastTriggeredStep = step;
      stepCb?.(step);

      const expected = startTime + tickCount * intervalMs;
      const drift = performance.now() - expected;
      const nextDelay = Math.max(0, intervalMs - drift);
      timeoutRef.current = setTimeout(audioTick, nextDelay);
    }
    timeoutRef.current = setTimeout(audioTick, intervalMs);

    // Visual: rAF for smooth playhead
    function animate() {
      const elapsed = performance.now() - startTime;
      const { totalSteps: ts } = optionsRef.current;
      const fracStep = (elapsed / intervalMs) % ts;
      setPlayheadPosition(fracStep);
      setCurrentStep(lastTriggeredStep);
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [cleanup]);

  // Cleanup on unmount only
  useMountEffect(() => cleanup);

  return { currentStep, playheadPosition, start, stop, isRunning };
}
