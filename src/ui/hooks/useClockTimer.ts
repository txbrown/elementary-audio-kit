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
 * Reads tempo dynamically from options ref on each tick — BPM changes
 * take effect immediately without restarting the clock.
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
  const lastStepTimeRef = useRef(0);
  const lastTriggeredStepRef = useRef(0);

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

    const { onStep } = optionsRef.current;

    currentStepRef.current = 0;
    lastStepTimeRef.current = performance.now();
    lastTriggeredStepRef.current = 0;
    setCurrentStep(0);
    setIsRunning(true);
    onStep?.(0);

    // Audio: reads tempo dynamically on each tick
    function audioTick() {
      const { tempo, totalSteps, subdivision = 4, onStep: stepCb } = optionsRef.current;
      const intervalMs = (60 / tempo / subdivision) * 1000;

      const step = (lastTriggeredStepRef.current + 1) % totalSteps;
      currentStepRef.current = step;
      lastTriggeredStepRef.current = step;
      lastStepTimeRef.current = performance.now();
      stepCb?.(step);

      timeoutRef.current = setTimeout(audioTick, intervalMs);
    }

    // Schedule first tick at current tempo
    const { tempo, subdivision = 4 } = optionsRef.current;
    const firstInterval = (60 / tempo / subdivision) * 1000;
    timeoutRef.current = setTimeout(audioTick, firstInterval);

    // Visual: interpolate between last step and next using current tempo
    function animate() {
      const now = performance.now();
      const { tempo: t, subdivision: s = 4, totalSteps: ts } = optionsRef.current;
      const currentIntervalMs = (60 / t / s) * 1000;
      const elapsed = now - lastStepTimeRef.current;
      const fracInStep = Math.min(elapsed / currentIntervalMs, 1);
      const fracStep = (lastTriggeredStepRef.current + fracInStep) % ts;
      setPlayheadPosition(fracStep);
      setCurrentStep(lastTriggeredStepRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [cleanup]);

  // Cleanup on unmount only
  useMountEffect(() => cleanup);

  return { currentStep, playheadPosition, start, stop, isRunning };
}
