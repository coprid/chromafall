import { useCallback, useRef } from 'react';
// Tiny WebAudio synth — no asset files. AudioContext starts on first gesture.
// v2: master chain (gain -> lowpass -> out) + feedback delay for space,
// layered voices, softer attacks, noise thud on hard drop.
export default function useAudio(enabled) {
const ctxRef = useRef(null);
const outRef = useRef(null);
const ensure = useCallback(() => {
let ctx = ctxRef.current;
if (!ctx) {
ctx = new (window.AudioContext || window.webkitAudioContext)();
ctxRef.current = ctx;
const master = ctx.createGain();
master.gain.value = 0.9;
const lp = ctx.createBiquadFilter();
lp.type = 'lowpass'; lp.frequency.value = 9500; lp.Q.value = 0.4;
master.connect(lp); lp.connect(ctx.destination);
const delay = ctx.createDelay(0.6); delay.delayTime.value = 0.17;
const fb = ctx.createGain(); fb.gain.value = 0.24;
const wet = ctx.createGain(); wet.gain.value = 0.16;
delay.connect(fb); fb.connect(delay);
master.connect(delay); delay.connect(wet); wet.connect(lp);
outRef.current = master;
}
if (ctx.state === 'suspended') ctx.resume();
return ctx;
}, []);
const tone = useCallback((ctx, freq, start, dur, type = 'triangle', gain = 0.07, detune = 0) => {
const out = outRef.current;
const t0 = ctx.currentTime + start;
const g = ctx.createGain();
g.gain.setValueAtTime(0, t0);
g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
const o = ctx.createOscillator();
o.type = type; o.frequency.value = freq;
o.connect(g);
if (detune) {
const o2 = ctx.createOscillator();
o2.type = type; o2.frequency.value = freq; o2.detune.value = detune;
const g2 = ctx.createGain(); g2.gain.value = 0.5;
o2.connect(g2); g2.connect(g);
o2.start(t0); o2.stop(t0 + dur + 0.02);
}
g.connect(out);
o.start(t0); o.stop(t0 + dur + 0.02);
}, []);
const thud = useCallback((ctx, start = 0, dur = 0.09) => {
const out = outRef.current;
const t0 = ctx.currentTime + start;
const len = Math.ceil(ctx.sampleRate * dur);
const buf = ctx.createBuffer(1, len, ctx.sampleRate);
const data = buf.getChannelData(0);
for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
const src = ctx.createBufferSource(); src.buffer = buf;
const f = ctx.createBiquadFilter(); f.type = 'lowpass';
f.frequency.setValueAtTime(1200, t0);
f.frequency.exponentialRampToValueAtTime(200, t0 + dur);
const g = ctx.createGain();
g.gain.setValueAtTime(0.12, t0);
g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
src.connect(f); f.connect(g); g.connect(out);
src.start(t0);
}, []);
const sweep = useCallback((ctx, f0, f1, start, dur) => {
const out = outRef.current;
const o = ctx.createOscillator(); const g = ctx.createGain();
o.type = 'sawtooth'; const t0 = ctx.currentTime + start;
o.frequency.setValueAtTime(f0, t0);
o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
g.gain.setValueAtTime(0.09, t0);
g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
o.connect(g); g.connect(out);
o.start(t0); o.stop(t0 + dur + 0.02);
}, []);
const play = useCallback((name, lvl = 0) => {
if (!enabled) return;
const ctx = ensure();
const pitch = Math.pow(2, Math.min(Math.max(lvl - 1, 0), 7) / 12);
switch (name) {
case 'move':   tone(ctx, 240, 0, 0.045, 'triangle', 0.028); break;
case 'rotate': tone(ctx, 340, 0, 0.06, 'triangle', 0.045, 8); break;
case 'soft':   tone(ctx, 190, 0, 0.035, 'triangle', 0.022); break;
case 'hold':   tone(ctx, 440, 0, 0.06, 'triangle', 0.045); tone(ctx, 560, 0.06, 0.07, 'triangle', 0.04); break;
case 'hard':   sweep(ctx, 150, 60, 0, 0.11); thud(ctx, 0, 0.1); break;
case 'clear':  [523, 659, 784].forEach((f, i) => {
tone(ctx, f * pitch, i * 0.08, 0.22, 'triangle', 0.055, 6);
tone(ctx, f * pitch * 2, i * 0.08, 0.14, 'sine', 0.02);
});
tone(ctx, 1568 * pitch, 0.24, 0.25, 'sine', 0.018); break;
case 'tetris': [523, 659, 784, 1046].forEach((f, i) => {
tone(ctx, f * pitch, i * 0.07, 0.22, 'triangle', 0.06, 8);
tone(ctx, f * pitch * 2, i * 0.07, 0.12, 'sine', 0.022);
});
tone(ctx, 2093, 0.3, 0.25, 'sine', 0.02); break;
case 'over':   [392, 330, 262, 196].forEach((f, i) => tone(ctx, f, i * 0.18, 0.5, 'sawtooth', 0.05));
tone(ctx, 131, 0.72, 0.5, 'sine', 0.05); break;
default: break;
}
}, [enabled, ensure, tone, thud, sweep]);
return { play };
}