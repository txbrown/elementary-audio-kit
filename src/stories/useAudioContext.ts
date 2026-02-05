import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
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

// ============================================================================
// Module-level singleton for HMR resilience
// These persist across hot module reloads
// ============================================================================

interface AudioSingleton {
  ctx: AudioContext | null;
  core: WebRenderer | null;
  node: AudioWorkletNode | null;
  state: AudioContextState;
  listeners: Set<() => void>;
}

const singleton: AudioSingleton = {
  ctx: null,
  core: null,
  node: null,
  state: {
    isReady: false,
    isPlaying: false,
    sampleRate: 44100,
    error: null,
  },
  listeners: new Set(),
};

function notifyListeners() {
  singleton.listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  singleton.listeners.add(listener);
  return () => singleton.listeners.delete(listener);
}

function getSnapshot() {
  return singleton.state;
}

async function initAudio() {
  // Already initialized
  if (singleton.ctx && singleton.core && singleton.state.isReady) {
    // Resume if suspended (can happen after tab becomes inactive)
    if (singleton.ctx.state === 'suspended') {
      await singleton.ctx.resume();
    }
    return;
  }

  // Clean up any stale state
  if (singleton.ctx) {
    try {
      await singleton.ctx.close();
    } catch {
      // Ignore errors from already-closed context
    }
  }

  try {
    const ctx = new AudioContext();
    const core = new WebRenderer();

    const node = await core.initialize(ctx, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    node.connect(ctx.destination);

    singleton.ctx = ctx;
    singleton.core = core;
    singleton.node = node;
    singleton.state = {
      isReady: true,
      isPlaying: true,
      sampleRate: ctx.sampleRate,
      error: null,
    };

    // Render silence initially
    core.render(el.const({ value: 0 }), el.const({ value: 0 }));

    notifyListeners();
  } catch (err) {
    singleton.state = {
      ...singleton.state,
      error: err instanceof Error ? err.message : 'Failed to start audio',
    };
    notifyListeners();
  }
}

function stopAudio() {
  if (singleton.ctx) {
    singleton.ctx.close();
    singleton.ctx = null;
    singleton.core = null;
    singleton.node = null;
    singleton.state = {
      isReady: false,
      isPlaying: false,
      sampleRate: 44100,
      error: null,
    };
    notifyListeners();
  }
}

function renderAudio(left: any, right?: any) {
  if (singleton.core && singleton.state.isReady) {
    try {
      singleton.core.render(left, right ?? left);
    } catch (err) {
      console.warn('Render error:', err);
    }
  }
}

/**
 * Hook for managing Web Audio context and Elementary renderer.
 *
 * Uses a module-level singleton so audio survives HMR.
 * Still requires user gesture to start (browser requirement).
 */
export function useAudioContext(): UseAudioContextResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const start = useCallback(async () => {
    await initAudio();
  }, []);

  const stop = useCallback(() => {
    stopAudio();
  }, []);

  const render = useCallback((left: any, right?: any) => {
    renderAudio(left, right);
  }, []);

  // Resume audio context if it was suspended (tab went inactive)
  useEffect(() => {
    if (singleton.ctx && singleton.ctx.state === 'suspended') {
      singleton.ctx.resume();
    }
  }, []);

  return {
    state,
    start,
    stop,
    render,
    core: singleton.core,
  };
}
