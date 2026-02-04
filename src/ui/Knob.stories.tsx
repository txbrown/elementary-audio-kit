import { useState } from 'react';
import { Knob } from './Knob';
import type { Story } from '@ladle/react';

// Design tokens (Ableton/TE inspired)
const colors = {
  bg: '#f5f5f5',
  surface: '#ffffff',
  border: '#e0e0e0',
  text: '#1a1a1a',
  textMuted: '#808080',
  accent: '#ff5500', // TE orange
  accentAlt: '#00d084',
};

const fonts = {
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

/**
 * Minimal knob - Ableton style
 */
export const Minimal: Story = () => {
  const [value, setValue] = useState(0.5);

  return (
    <div style={{ padding: 48, background: colors.bg, minHeight: '100vh' }}>
      <Knob value={value} onChange={setValue}>
        {({ rotation, normalizedValue }) => (
          <div style={{ width: 48, height: 48, position: 'relative' }}>
            {/* Track */}
            <svg width={48} height={48} style={{ position: 'absolute' }}>
              <circle
                cx={24}
                cy={24}
                r={20}
                fill="none"
                stroke={colors.border}
                strokeWidth={2}
              />
              <circle
                cx={24}
                cy={24}
                r={20}
                fill="none"
                stroke={colors.text}
                strokeWidth={2}
                strokeDasharray={`${normalizedValue * 125.6} 125.6`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>
            {/* Indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 48,
                height: 48,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 22,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  background: colors.text,
                }}
              />
            </div>
          </div>
        )}
      </Knob>
      <div
        style={{
          marginTop: 12,
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.textMuted,
        }}
      >
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  );
};

/**
 * OP-1 style knob - Teenage Engineering inspired
 */
export const OP1Style: Story = () => {
  const [value, setValue] = useState(0.65);

  return (
    <div
      style={{
        padding: 48,
        background: '#fafafa',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          background: colors.surface,
          padding: 24,
          borderRadius: 4,
          display: 'inline-block',
          border: `1px solid ${colors.border}`,
        }}
      >
        <Knob value={value} onChange={setValue}>
          {({ rotation }) => (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: colors.surface,
                border: `2px solid ${colors.text}`,
                position: 'relative',
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {/* Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  marginLeft: -1.5,
                  width: 3,
                  height: 10,
                  background: colors.accent,
                  borderRadius: 1.5,
                }}
              />
            </div>
          )}
        </Knob>
        <div
          style={{
            marginTop: 16,
            fontFamily: fonts.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            color: colors.textMuted,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Level
        </div>
      </div>
    </div>
  );
};

/**
 * Frequency control with logarithmic scaling
 */
export const Frequency: Story = () => {
  const [freq, setFreq] = useState(440);

  const formatFreq = (f: number) => {
    if (f >= 1000) return `${(f / 1000).toFixed(2)}k`;
    return f.toFixed(0);
  };

  return (
    <div style={{ padding: 48, background: colors.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <Knob
          value={freq}
          onChange={setFreq}
          min={20}
          max={20000}
          curve="logarithmic"
        >
          {({ rotation }) => (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: colors.surface,
                border: `1.5px solid ${colors.border}`,
                position: 'relative',
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: '50%',
                  marginLeft: -1,
                  width: 2,
                  height: 8,
                  background: colors.accent,
                }}
              />
            </div>
          )}
        </Knob>
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              color: colors.text,
              fontWeight: 500,
            }}
          >
            {formatFreq(freq)}
            <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 2 }}>
              Hz
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: fonts.mono,
          fontSize: 9,
          letterSpacing: '0.15em',
          color: colors.textMuted,
          textTransform: 'uppercase',
        }}
      >
        Frequency
      </div>
    </div>
  );
};

/**
 * Mixer channel strip
 */
export const ChannelStrip: Story = () => {
  const [values, setValues] = useState({
    gain: 0.8,
    pan: 0.5,
    send: 0.25,
  });

  const update = (key: keyof typeof values) => (v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const MiniKnob = ({
    value,
    onChange,
    label,
    bipolar = false,
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
    bipolar?: boolean;
  }) => (
    <div style={{ textAlign: 'center' }}>
      <Knob value={value} onChange={onChange}>
        {({ rotation, normalizedValue }) => (
          <div style={{ width: 32, height: 32, position: 'relative' }}>
            <svg width={32} height={32}>
              <circle
                cx={16}
                cy={16}
                r={13}
                fill="none"
                stroke={colors.border}
                strokeWidth={1.5}
              />
              {bipolar ? (
                <path
                  d={`M 16 3 A 13 13 0 ${normalizedValue > 0.5 ? 1 : 0} 1 ${
                    16 + 13 * Math.sin((normalizedValue - 0.5) * Math.PI * 1.5)
                  } ${16 - 13 * Math.cos((normalizedValue - 0.5) * Math.PI * 1.5)}`}
                  fill="none"
                  stroke={colors.text}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              ) : (
                <circle
                  cx={16}
                  cy={16}
                  r={13}
                  fill="none"
                  stroke={colors.text}
                  strokeWidth={1.5}
                  strokeDasharray={`${normalizedValue * 81.6} 81.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 16 16)"
                />
              )}
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 32,
                height: 32,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 14.5,
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: colors.text,
                }}
              />
            </div>
          </div>
        )}
      </Knob>
      <div
        style={{
          marginTop: 6,
          fontFamily: fonts.mono,
          fontSize: 8,
          letterSpacing: '0.1em',
          color: colors.textMuted,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 48, background: colors.bg, minHeight: '100vh' }}>
      <div
        style={{
          background: colors.surface,
          padding: 16,
          borderRadius: 2,
          display: 'inline-flex',
          flexDirection: 'column',
          gap: 16,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <MiniKnob value={values.gain} onChange={update('gain')} label="Gain" />
          <MiniKnob
            value={values.pan}
            onChange={update('pan')}
            label="Pan"
            bipolar
          />
          <MiniKnob value={values.send} onChange={update('send')} label="Send" />
        </div>
        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: 12,
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.text,
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          01
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple knobs - parameter bank
 */
export const ParameterBank: Story = () => {
  const [params, setParams] = useState({
    attack: 0.01,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
  });

  const update = (key: keyof typeof params) => (v: number) =>
    setParams((prev) => ({ ...prev, [key]: v }));

  return (
    <div style={{ padding: 48, background: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {(Object.keys(params) as Array<keyof typeof params>).map((key) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <Knob value={params[key]} onChange={update(key)}>
              {({ rotation, normalizedValue }) => (
                <div style={{ width: 44, height: 44, position: 'relative' }}>
                  <svg width={44} height={44}>
                    <circle
                      cx={22}
                      cy={22}
                      r={18}
                      fill="none"
                      stroke="#333"
                      strokeWidth={2}
                    />
                    <circle
                      cx={22}
                      cy={22}
                      r={18}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth={2}
                      strokeDasharray={`${normalizedValue * 113} 113`}
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#2a2a2a',
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: 8,
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        background: '#fff',
                      }}
                    />
                  </div>
                </div>
              )}
            </Knob>
            <div
              style={{
                marginTop: 8,
                fontFamily: fonts.mono,
                fontSize: 9,
                letterSpacing: '0.12em',
                color: '#666',
                textTransform: 'uppercase',
              }}
            >
              {key[0]}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 20,
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: '0.15em',
          color: '#555',
          textTransform: 'uppercase',
        }}
      >
        Envelope
      </div>
    </div>
  );
};
