import { useCallback, useEffect, useRef, useState } from 'react';

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
 * Uses setTimeout with drift compensation for accurate audio-step triggering,
 * and requestAnimationFrame for smooth sub-step playhead animation.
 */
export function useClockTimer(
  options: UseClockTimerOptions,
  isPlaying: boolean
): {
  currentStep: number;
  playheadPosition: number;
} {
  const { tempo, totalSteps, subdivision = 4, onStep } = options;

  const [currentStep, setCurrentStep] = useState(-1);
  const [playheadPosition, setPlayheadPosition] = useState(-1);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const clockStartRef = useRef(0);
  const currentStepRef = useRef(-1);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

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

  const startClock = useCallback(
    (fromStep = 0) => {
      cleanup();

      const intervalMs = (60 / tempo / subdivision) * 1000;
      const startTime = performance.now();
      let tickCount = 0;
      let lastTriggeredStep = fromStep;

      clockStartRef.current = startTime;
      currentStepRef.current = fromStep;
      setCurrentStep(fromStep);
      onStepRef.current?.(fromStep);

      // Audio: clock-corrected setTimeout
      function audioTick() {
        tickCount++;
        const step = (fromStep + tickCount) % totalSteps;
        currentStepRef.current = step;
        lastTriggeredStep = step;
        onStepRef.current?.(step);

        const expected = startTime + tickCount * intervalMs;
        const drift = performance.now() - expected;
        const nextDelay = Math.max(0, intervalMs - drift);
        timeoutRef.current = setTimeout(audioTick, nextDelay);
      }
      timeoutRef.current = setTimeout(audioTick, intervalMs);

      // Visual: rAF for smooth playhead
      function animate() {
        const elapsed = performance.now() - clockStartRef.current;
        const fracStep = (fromStep + elapsed / intervalMs) % totalSteps;
        setPlayheadPosition(fracStep);
        setCurrentStep(lastTriggeredStep);
        rafRef.current = requestAnimationFrame(animate);
      }
      rafRef.current = requestAnimationFrame(animate);
    },
    [tempo, totalSteps, subdivision, cleanup]
  );

  // Start/stop based on isPlaying
  useEffect(() => {
    if (isPlaying) {
      startClock(0);
    } else {
      cleanup();
      setCurrentStep(-1);
      setPlayheadPosition(-1);
      currentStepRef.current = -1;
    }
    return cleanup;
  }, [isPlaying, startClock, cleanup]);

  // Handle tempo changes while playing
  useEffect(() => {
    if (!isPlaying) return;
    const resumeStep = currentStepRef.current;
    if (resumeStep >= 0) {
      startClock(resumeStep);
    }
  }, [tempo]);

  return { currentStep, playheadPosition };
}
