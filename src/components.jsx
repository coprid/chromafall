import React, { useRef } from 'react';
import { COLORS, SHAPES, ghostOf } from './engine';

// ---- атомарные блоки ----

const Block = ({ type, layer, clearing, delay = 0 }) => (
  <div
    className={`b ${layer} ${clearing ? 'clearing' : ''}`}
    style={{ '--c': COLORS[type], animationDelay: clearing ? `${delay * 22}ms` : undefined }}
  />
);

const trim = (cells) => {
  if (!cells || !cells.length) return null;
  const rs = cells.map((c) => c[0]), cs = cells.map((c) => c[1]);
  const minR = Math.min(...rs), minC = Math.min(...cs);
  return {
    cells: cells.map(([r, c]) => [r - minR, c - minC]),
    rows: Math.max(...rs) - minR + 1,
    cols: Math.max(...cs) - minC + 1,
  };
};

export const Mini = ({ type }) => {
  if (!type) return null;
  const t = trim(SHAPES[type][0]);
  return (
    <div
      className="mini"
      style={{
        gridTemplateColumns: `repeat(${t.cols}, var(--mini))`,
        gridTemplateRows: `repeat(${t.rows}, var(--mini))`,
      }}
    >
      {t.cells.map(([r, c], i) => (
        <div key={i} style={{ gridColumn: c + 1, gridRow: r + 1 }}>
          <Block type={type} layer="locked" />
        </div>
      ))}
    </div>
  );
};

// ---- игровое поле ----

export const Board = ({ g, settings }) => {
  const view = g.board.map((row) => row.map((c) => (c ? { t: c, layer: 'locked' } : null)));
  if (settings.mode === 'modern' && g.current && !g.clearing) {
    const gh = ghostOf(g);
    for (const [r, c] of SHAPES[gh.type][gh.rot].map(([dr, dc]) => [dr + gh.y, dc + gh.x]))
      if (r >= 0 && r < 20 && !view[r][c]) view[r][c] = { t: gh.type, layer: 'ghost' };
  }
  if (g.current && !g.clearing) {
    for (const [r, c] of SHAPES[g.current.type][g.current.rot].map(([dr, dc]) => [dr + g.current.y, dc + g.current.x]))
      if (r >= 0 && r < 20) view[r][c] = { t: g.current.type, layer: 'active' };
  }
  const clearingSet = new Set(g.clearing || []);
  return (
    <div className={`boardwrap ${g.clearing && g.clearing.length === 4 ? 'tetris' : ''}`}>
      <div className="board">
        {view.map((row, r) =>
          row.map((cell, c) => (
            <div className="cell" key={`${r}-${c}`}>
              {cell && (
                <Block
                  type={cell.t}
                  layer={cell.layer}
                  clearing={cell.layer === 'locked' && clearingSet.has(r)}
                  delay={c}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---- верхняя панель: звук + настройки + счёт ----

export const TopBar = ({ g, best, t, soundOn, onToggleSound, onSettings }) => (
  <div className="topbar">
    <button className="pill" onClick={onToggleSound} aria-label="sound">
      {soundOn ? (
        <svg viewBox="0 0 24 24">
          <path d="M11 5L6 9H3v6h3l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18 6a8.5 8.5 0 0 1 0 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M11 5L6 9H3v6h3l5 4V5z" />
          <path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      )}
    </button>
    <button className="pill" onClick={onSettings} aria-label="settings">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
    <div className="stat score">
      <span className="k">{t('score')}</span>
      <span className="v">{g.score}</span>
    </div>
    <div className="stat best">
      <span className="k">{t('best')}</span>
      <span className="v">{best}</span>
    </div>
  </div>
);

// ---- панель превью: HOLD + три следующие ----

export const PreviewRow = ({ g, settings }) => (
  <div className="preview">
    {settings.hold && (
      <div className="slot small"><Mini type={g.held} /></div>
    )}
    <div className="queue">
      {g.queue.slice(0, 3).map((type, i) => (
        <div key={`${i}-${type}`} className={i === 0 ? 'q0' : 'qdim'}>
          <Mini type={type} />
        </div>
      ))}
    </div>
  </div>
);

// ---- сенсорные кнопки ----

const RepeatBtn = ({ onAction, label, children }) => {
  const id = useRef(null);
  const start = (e) => { e.preventDefault(); onAction(); id.current = setInterval(onAction, 85); };
  const stop = () => clearInterval(id.current);
  return (
    <button className="tbtn" aria-label={label}
      onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}>
      {children}
    </button>
  );
};

const TapBtn = ({ onAction, label, children }) => (
  <button className="tbtn" aria-label={label} onPointerDown={(e) => { e.preventDefault(); onAction(); }}>
    {children}
  </button>
);

export const TouchControls = ({ actions, settings }) => (
  <div className="touch">
    <RepeatBtn onAction={actions.moveLeft} label="left">
      <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
    </RepeatBtn>
    <RepeatBtn onAction={actions.moveRight} label="right">
      <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
    </RepeatBtn>
    <TapBtn onAction={actions.rotateCW} label="rotate">
      <svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 1 1 2 4.9" /><path d="M5 19v-5h5" /></svg>
    </TapBtn>
    <RepeatBtn onAction={actions.soft} label="soft drop">
      <svg viewBox="0 0 24 24"><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /></svg>
    </RepeatBtn>
    <TapBtn onAction={actions.hard} label="hard drop">
      <svg viewBox="0 0 24 24"><path d="M12 3v9" /><path d="M7 7l5 5 5-5" /><path d="M6 18h12" /></svg>
    </TapBtn>
    {settings.hold && (
      <TapBtn onAction={actions.hold} label="hold">
        <svg viewBox="0 0 24 24"><path d="M7 8h11l-3-3M17 16H6l3 3" /></svg>
      </TapBtn>
    )}
  </div>
);

// ---- настройки ----

const Toggle = ({ on, onClick }) => (
  <div className={`tg ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on} />
);

const Seg = ({ value, options, onChange }) => (
  <div className="seg">
    {options.map(([v, label]) => (
      <button key={v} className={value === v ? 'active' : ''} onClick={() => onChange(v)}>{label}</button>
    ))}
  </div>
);

export const SettingsModal = ({ open, settings, set, t, onClose }) => (
  <div className={`modal ${open ? 'open' : ''}`} onClick={(e) => e.target.className.startsWith('modal') && onClose()}>
    <div className="panel" role="dialog" aria-modal="true">
      <h2>{t('settings')}</h2>
      <div className="row"><span className="name">{t('sound')}</span><Toggle on={settings.sound} onClick={() => set({ sound: !settings.sound })} /></div>
      <div className="row"><span className="name">{t('vibration')}</span><Toggle on={settings.vibration} onClick={() => set({ vibration: !settings.vibration })} /></div>
      <div className="row"><span className="name">{t('holdOpt')}</span><Toggle on={settings.hold} onClick={() => set({ hold: !settings.hold })} /></div>
      <div className="row"><span className="name">{t('mode')}</span><Seg value={settings.mode} options={[['modern', t('modern')], ['retro', t('retro')]]} onChange={(v) => set({ mode: v })} /></div>
      <div className="row"><span className="name">{t('language')}</span><Seg value={settings.lang} options={[['ru', 'RU'], ['en', 'EN']]} onChange={(v) => set({ lang: v })} /></div>
      <button className="btn primary close" onClick={onClose}>{t('close')}</button>
    </div>
  </div>
);

// ---- пауза / конец игры ----

export const Overlay = ({ g, best, t, actions }) => {
  if (g.status !== 'paused' && g.status !== 'over') return null;
  const over = g.status === 'over';
  return (
    <div className="overlay-screen">
      <div className="ov-card">
        <div className="ov-title">{over ? t('gameover') : t('paused')}</div>
        {over && <div className="ov-score"><span>{t('final')}</span><b>{g.score}</b></div>}
        {over && g.score > best && g.score > 0 && <div className="ov-record">★ NEW BEST ★</div>}
        <div className="ov-actions">
          {!over && <button className="btn primary" onClick={actions.togglePause}>{t('resume')}</button>}
          <button className={over ? 'btn primary' : 'btn ghost'} onClick={actions.newGame}>{t('newgame')}</button>
        </div>
      </div>
    </div>
  );
};