/**
 * Design tokens for audio UI components.
 *
 * Dark theme with orange/green accents, matching professional audio tool aesthetics.
 */

export const colors = {
  bg: '#1a1a1a',
  surface: '#242424',
  surfaceAlt: '#2a2a2a',
  border: '#333',
  text: '#fff',
  textMuted: '#808080',
  accent: '#ff5500',
  accentAlt: '#00d084',
  accentBlue: '#00aaff',

  // Piano-specific
  whiteKey: '#f7f7f7',
  whiteKeyActive: '#d0d0d0',
  blackKey: '#1a1a1a',
  blackKeyActive: '#555',
  noteColor: 'rgba(0, 255, 158, 0.65)',
  noteColorActive: 'rgba(0, 255, 158, 0.95)',
} as const;

export const fonts = {
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
} as const;

export type Colors = typeof colors;
export type Fonts = typeof fonts;
