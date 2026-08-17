import { useCallback, useRef } from 'react';

// Tiny WebAudio synth — no asset files. AudioContext starts on first gesture.
export default function useAudio(enabled) {
  const ctxRef = useRef(null);

  const tone = useCallback((ctx, freq, start, dur, type = 'square', gain = 0.08) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }, []);

  const sweep = useCallback((ctx, f0, f1, start, dur) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sawtooth'; const t0 = ctx.currentTime + start;
    o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.1, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }, []);

const play = useCallback((name, lvl = 0) => {
if (!enabled) return;
let ctx = ctxRef.current;
if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); ctxRef.current = ctx; }
if (ctx.state === 'suspended') ctx.resume();
const pitch = Math.pow(2, Math.min(Math.max(lvl - 1, 0), 7) / 12);
switch (name) {
case 'move':   tone(ctx, 220, 0, 0.04, 'square', 0.04); break;
case 'rotate': tone(ctx, 330, 0, 0.05, 'triangle', 0.05); break;
case 'soft':   tone(ctx, 180, 0, 0.03, 'square', 0.03); break;
case 'hold':   tone(ctx, 440, 0, 0.06, 'triangle', 0.05); break;
case 'hard':   sweep(ctx, 140, 60, 0, 0.12); break;
case 'clear':  [523, 659, 784].forEach((f, i) => tone(ctx, f * pitch, i * 0.06, 0.14, 'triangle', 0.07)); break;
case 'tetris': [523, 659, 784, 1046].forEach((f, i) => tone(ctx, f * pitch, i * 0.07, 0.2, 'square', 0.08)); break;
case 'over':   [392, 330, 262, 196].forEach((f, i) => tone(ctx, f, i * 0.12, 0.3, 'sawtooth', 0.07)); break;
default: break;
}
}, [enabled, tone, sweep]);

  return { play };
}