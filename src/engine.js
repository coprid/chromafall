// Pure, framework-free Tetris logic. No DOM, no React, no side effects.

export const COLS = 10;
export const ROWS = 20;
export const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
export const COLORS = {
  I: '#1ec9ff', O: '#f5c518', T: '#e83bb0', S: '#34d058',
  Z: '#f0444a', J: '#3b82f6', L: '#f5821f',
};
export const SPAWN_X = { I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };
export const SPAWN_Y = 0;
export const LOCK_DELAY = 500;     // ms before a grounded piece locks
export const MAX_RESETS = 15;      // move / rotate resets of the lock timer
export const CLEAR_MS = 560;       // line-clear animation duration
export const PREVIEW = 3;          // how many next pieces to show
const LINE_SCORE = [0, 100, 300, 500, 800];

// SRS-inspired wall kicks: always try in-place first, then side / up nudges.
const KICKS = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1],
  [-2, 0], [2, 0], [0, -2], [2, -1], [-2, -1],
];

// ---- shape generation: canonical matrices rotated into 4 states ----
const BASE = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};
const rotateCW = (m) => {
  const N = m.length;
  const r = Array.from({ length: N }, () => Array(N).fill(0));
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) r[j][N - 1 - i] = m[i][j];
  return r;
};
const toCells = (m) => {
  const c = [];
  for (let i = 0; i < m.length; i++) for (let j = 0; j < m[i].length; j++) if (m[i][j]) c.push([i, j]);
  return c;
};
export const SHAPES = {};
for (const t of TYPES) {
  const states = [BASE[t]];
  for (let s = 1; s < 4; s++) states.push(rotateCW(states[s - 1]));
  SHAPES[t] = states.map(toCells);
}

// ---- helpers ----
export const emptyRow = () => Array(COLS).fill(null);
const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [x[i], x[j]] = [x[j], x[i]]; } return x; };
const refill = (queue, bag, n) => { while (queue.length < n) { if (!bag.length) bag.push(...shuffle(TYPES)); queue.push(bag.shift()); } };
export const cellsOf = (p) => SHAPES[p.type][p.rot].map(([r, c]) => [r + p.y, c + p.x]);
export const collide = (board, p) => {
  for (const [r, c] of cellsOf(p)) {
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && board[r][c]) return true;
  }
  return false;
};
export const ghostOf = (g) => {
  let p = g.current;
  while (!collide(g.board, { ...p, y: p.y + 1 })) p = { ...p, y: p.y + 1 };
  return p;
};
export const gravityMs = (level) =>
  Math.max(50, Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000);
const fullRows = (b) => b.reduce((acc, row, i) => (row.every((c) => c) ? [...acc, i] : acc), []);

// ---- state transitions (each returns a NEW game object) ----

export const spawn = (g) => {
  const type = g.queue[0];
  const queue = g.queue.slice(1);
  const bag = g.bag.slice();
  refill(queue, bag, PREVIEW);
  const piece = { type, rot: 0, x: SPAWN_X[type], y: SPAWN_Y };
  const over = collide(g.board, piece);
  return {
    ...g, current: piece, queue, bag, canHold: true,
    lockTimer: 0, resets: 0, dropCounter: 0,
    status: over ? 'over' : g.status,
    ...(over ? sfx(g, 'over') : {}),
  };
};

export const createGame = () => {
  const bag = shuffle(TYPES);
  const queue = [];
  refill(queue, bag, PREVIEW + 1);
  const type = queue.shift();
  return {
    board: Array.from({ length: ROWS }, emptyRow),
    current: { type, rot: 0, x: SPAWN_X[type], y: SPAWN_Y },
    queue, bag, held: null, canHold: true,
    score: 0, lines: 0, level: 1, status: 'playing',
    clearing: null, dropCounter: 0, lockTimer: 0, resets: 0,
    _sfx: null, _sfxId: 0,
  };
};

const sfx = (g, name) => ({ _sfx: name, _sfxId: g._sfxId + 1 });

const lock = (g) => {
  const board = g.board.map((r) => r.slice());
  for (const [r, c] of cellsOf(g.current)) if (r >= 0 && r < ROWS) board[r][c] = g.current.type;
  const rows = fullRows(board);
  if (rows.length) {
    return { ...g, board, clearing: rows, current: null, ...sfx(g, rows.length === 4 ? 'tetris' : 'clear') };
  }
  return spawn({ ...g, board, current: null });
};

export const applyClear = (g) => {
  const rows = g.clearing;
  const board = g.board.filter((_, i) => !rows.includes(i));
  while (board.length < ROWS) board.unshift(emptyRow());
  const n = rows.length;
  const lines = g.lines + n;
  return spawn({
    ...g, board, clearing: null,
    score: g.score + LINE_SCORE[n] * g.level,
    lines, level: Math.floor(lines / 10) + 1,
  });
};

const grounded = (g, p) => collide(g.board, { ...p, y: p.y + 1 });

const resetLock = (g, p) => {
  if (grounded(g, p)) {
    if (g.resets < MAX_RESETS) return { lockTimer: 0, resets: g.resets + 1 };
    return { lockTimer: g.lockTimer, resets: g.resets };
  }
  return { lockTimer: 0, resets: g.resets };
};

const live = (g) => g.status === 'playing' && !g.clearing && g.current;

export const move = (g, dx) => {
  if (!live(g)) return g;
  const np = { ...g.current, x: g.current.x + dx };
  if (collide(g.board, np)) return g;
  return { ...g, current: np, ...resetLock(g, np), ...sfx(g, 'move') };
};

export const rotate = (g, dir, useKicks) => {
  if (!live(g)) return g;
  const nr = (g.current.rot + dir + 4) % 4;
  const list = useKicks ? KICKS : [[0, 0]];
  for (const [kx, ky] of list) {
    const np = { ...g.current, rot: nr, x: g.current.x + kx, y: g.current.y + ky };
    if (!collide(g.board, np)) return { ...g, current: np, ...resetLock(g, np), ...sfx(g, 'rotate') };
  }
  return g;
};

export const softDrop = (g) => {
  if (!live(g)) return g;
  const np = { ...g.current, y: g.current.y + 1 };
  if (collide(g.board, np)) return g;
  return { ...g, current: np, score: g.score + 1, dropCounter: 0, ...sfx(g, 'soft') };
};

export const hardDrop = (g) => {
  if (!live(g)) return g;
  let p = g.current, d = 0;
  while (!collide(g.board, { ...p, y: p.y + 1 })) { p = { ...p, y: p.y + 1 }; d++; }
  return lock({ ...g, current: p, score: g.score + d * 2, ...sfx(g, 'hard') });
};

export const hold = (g, useHold) => {
  if (!useHold || !live(g) || !g.canHold) return g;
  const cur = g.current.type;
  if (g.held) {
    const np = { type: g.held, rot: 0, x: SPAWN_X[g.held], y: SPAWN_Y };
    if (collide(g.board, np)) return g;
    return { ...g, current: np, held: cur, canHold: false, lockTimer: 0, resets: 0, ...sfx(g, 'hold') };
  }
  const type = g.queue[0];
  const queue = g.queue.slice(1);
  const bag = g.bag.slice();
  refill(queue, bag, PREVIEW);
  return {
    ...g, current: { type, rot: 0, x: SPAWN_X[type], y: SPAWN_Y },
    held: cur, canHold: false, queue, bag, lockTimer: 0, resets: 0, ...sfx(g, 'hold'),
  };
};

export const tick = (g, dt) => {
  if (g.status !== 'playing' || g.clearing || !g.current) return g;
  const gr = grounded(g, g.current);
  let lockTimer = g.lockTimer, resets = g.resets, drop = g.dropCounter;
  if (gr) {
    lockTimer += dt;
    if (lockTimer >= LOCK_DELAY || resets > MAX_RESETS) return lock(g);
    drop = 0;
    return { ...g, lockTimer, resets, dropCounter: drop };
  }
  lockTimer = 0;
  drop += dt;
  if (drop >= gravityMs(g.level)) {
    return { ...g, current: { ...g.current, y: g.current.y + 1 }, dropCounter: 0, lockTimer, resets };
  }
  return { ...g, dropCounter: drop, lockTimer, resets };
};