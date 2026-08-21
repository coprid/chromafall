import { useCallback, useEffect, useRef, useState } from 'react';
import * as E from './engine';

const BEST_KEY = 'chromafall_best';
const DAS = 170;    // hold ms before auto-repeat kicks in
const ARR = 40;     // ms between auto-repeat steps
const SOFT_MS = 45; // soft drop repeat interval

export default function useTetris(settings, audio, uiRef) {
  const [g, setG] = useState(() => E.createGame());
  const [best, setBest] = useState(() => +(localStorage.getItem(BEST_KEY) || 0));

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // read the latest play / vibration through refs so the sfx effect can depend
  // only on _sfxId (otherwise toggling sound would replay the last cue).
  const playRef = useRef(audio.play);
  playRef.current = audio.play;
  const vibRef = useRef(settings.vibration);
  vibRef.current = settings.vibration;

  // ---- game loop (rAF, dt clamped after a tab switch) ----
  useEffect(() => {
    let raf, last = performance.now();
    const frame = (t) => {
      const dt = Math.min(t - last, 250);
      last = t;
      setG((prev) => E.tick(prev, dt));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- line-clear flash -> apply after the animation ----
  const clearKey = (g.clearing || []).join(',');
  useEffect(() => {
    if (!g.clearing) return;
    const id = setTimeout(() => setG((prev) => (prev.clearing ? E.applyClear(prev) : prev)), E.CLEAR_MS);
    return () => clearTimeout(id);
  }, [clearKey]);

  // ---- sound + haptics from the transient _sfxId ----
  useEffect(() => {
    if (!g._sfx) return;
    playRef.current(g._sfx, g._sfxLvl || 0);
    const vib = { hard: [20], clear: [15, 30, 15], tetris: [20, 40, 20, 40, 40], over: [60, 40, 120], hold: [10] };
    const pat = vib[g._sfx];
    if (pat && vibRef.current && navigator.vibrate) navigator.vibrate(pat);
  }, [g._sfxId]);

  // ---- best score ----
  useEffect(() => {
    if (g.score > best) { setBest(g.score); localStorage.setItem(BEST_KEY, String(g.score)); }
  }, [g.score]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- actions ----
  const moveLeft  = useCallback(() => setG((p) => E.move(p, -1)), []);
  const moveRight = useCallback(() => setG((p) => E.move(p, 1)), []);
  const rot = useCallback((d) => setG((p) => E.rotate(p, d, settingsRef.current.mode === 'modern')), []);
  const rotateCW  = useCallback(() => rot(1), [rot]);
  const rotateCCW = useCallback(() => rot(-1), [rot]);
  const soft = useCallback(() => setG((p) => E.softDrop(p)), []);
  const hard = useCallback(() => setG((p) => E.hardDrop(p)), []);
  const doHold = useCallback(() => setG((p) => E.hold(p, settingsRef.current.hold)), []);
  const newGame = useCallback(() => setG(E.createGame()), []);
  const togglePause = useCallback(() => setG((p) => (
    p.status === 'playing' ? { ...p, status: 'paused' } :
    p.status === 'paused' ? { ...p, status: 'playing' } : p
  )), []);

// ---- auto-pause on focus loss (required by game portals) ----
useEffect(() => {
  const pause = () => setG((p) => (p.status === 'playing' ? { ...p, status: 'paused' } : p));
  const onVis = () => { if (document.hidden) pause(); };
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.removeEventListener('blur', pause);
    document.removeEventListener('visibilitychange', onVis);
  };
}, []);

// ---- keyboard with own DAS/ARR (independent of OS key repeat) ----
useEffect(() => {
const timers = { das: null, arr: null };
const stopAuto = () => { clearTimeout(timers.das); clearInterval(timers.arr); timers.das = timers.arr = null; };
const startAuto = (fn, delay, rate) => {
stopAuto();
if (delay > 0) timers.das = setTimeout(() => { timers.arr = setInterval(fn, rate); }, delay);
else timers.arr = setInterval(fn, rate);
};
const onKey = (e) => {
if (uiRef && uiRef.current && uiRef.current.modal) return;
if (e.repeat) return; // we handle repeats ourselves
const k = e.key.toLowerCase();
const map = {
arrowleft: moveLeft, a: moveLeft,
arrowright: moveRight, d: moveRight,
arrowdown: soft, s: soft,
arrowup: rotateCW, w: rotateCW, x: rotateCW,
z: rotateCCW, ' ': hard, c: doHold, shift: doHold, p: togglePause,
};
const fn = map[k];
if (!fn) return;
e.preventDefault();
fn(); // first step fires immediately
if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') startAuto(fn, DAS, ARR);
if (k === 'arrowdown' || k === 's') startAuto(fn, 0, SOFT_MS);
};
const onUp = (e) => {
const k = e.key.toLowerCase();
if (['arrowleft', 'a', 'arrowright', 'd', 'arrowdown', 's'].includes(k)) stopAuto();
};
const onBlur = () => stopAuto();
window.addEventListener('keydown', onKey);
window.addEventListener('keyup', onUp);
window.addEventListener('blur', onBlur);
return () => {
stopAuto();
window.removeEventListener('keydown', onKey);
window.removeEventListener('keyup', onUp);
window.removeEventListener('blur', onBlur);
};
}, [moveLeft, moveRight, soft, rotateCW, rotateCCW, hard, doHold, togglePause, uiRef]);

  return {
    g, best,
    actions: { moveLeft, moveRight, rotateCW, rotateCCW, soft, hard, hold: doHold, newGame, togglePause },
  };
}