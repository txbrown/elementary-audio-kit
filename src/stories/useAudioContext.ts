import { useState, useCallback, useRef, useEffect } from 'react';
import WebRenderer from '@elemaudio/web-renderer';
import { el } from '@elemaudio/core';

export interface AudioContextState {
  isReady: boolean;
  isPlaying: boolean;
  sampleRate: number;
  error: string | null;
}

export interface UseAudioContextResult {
  state: AudioContextState;
  start: () => Promise<void>;
  stop: () => void;
  render: (left: any, right?: any) => void;
  core: WebRenderer | null;
}

/**
 * Hook for managing Web Audio context and Elementary renderer.
 *
 * Handles the user gesture requirement for starting audio.
 */
export function useAudioContext(): UseAudioContextResult {
  const [state, setState] = useState<AudioContextState>({
    isReady: false,
    isPlaying: false,
    sampleRate: 44100,
    error: null,
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const coreRef = useRef<WebRenderer | null>(null);

  const start = useCallback(async () => {
    if (state.isReady) return;

    try {
      // Create audio context
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      // Create and initialize renderer
      const core = new WebRenderer();
      coreRef.current = core;

      // Connect to audio context
      const node = await core.initialize(ctx, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });

      node.connect(ctx.destination);

      setState({
        isReady: true,
        isPlaying: true,
        sampleRate: ctx.sampleRate,
        error: null,
      });

      // Render silence initially
      core.render(el.const({ value: 0 }), el.const({ value: 0 }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to start audio',
      }));
    }
  }, [state.isReady]);

  const stop = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
      coreRef.current = null;
      setState({
        isReady: false,
        isPlaying: false,
        sampleRate: 44100,
        error: null,
      });
    }
  }, []);

  const render = useCallback((left: any, right?: any) => {
    if (coreRef.current && state.isReady) {
      coreRef.current.render(left, right ?? left);
    }
  }, [state.isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, []);

  return {
    state,
    start,
    stop,
    render,
    core: coreRef.current,
  };
}
