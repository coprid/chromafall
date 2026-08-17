import React, { useRef, useState } from 'react';
import useSettings from './useSettings';
import useAudio from './useAudio';
import useTetris from './useTetris';
import { Board, TopBar, TouchControls, SettingsModal, Overlay, PreviewRow } from './components';

export default function App() {
  const { settings, set, t } = useSettings();
  const audio = useAudio(settings.sound);
  const uiRef = useRef({ modal: false });
  const { g, best, actions } = useTetris(settings, audio, uiRef);

  const [modalOpen, setModalOpen] = useState(false);
  const wasPlaying = useRef(false);

  const openSettings = () => {
    wasPlaying.current = g.status === 'playing';
    if (wasPlaying.current) actions.togglePause();
    uiRef.current.modal = true;
    setModalOpen(true);
  };
  const closeSettings = () => {
    uiRef.current.modal = false;
    setModalOpen(false);
    if (wasPlaying.current && g.status === 'paused') actions.togglePause();
  };

  return (
    <div className="phone">
      <header>
        <h1>CHROMAFALL</h1>
        <div className="sub">{t('sub')}</div>
      </header>

      <TopBar g={g} best={best} t={t}
        soundOn={settings.sound}
        onToggleSound={() => set({ sound: !settings.sound })}
        onSettings={openSettings} />
      <PreviewRow g={g} settings={settings} t={t} />
      <Board g={g} settings={settings} />
      <TouchControls actions={actions} settings={settings} t={t} />
      <div className="actions">
        <button className="btn ghost" onClick={actions.togglePause}>{t('pause')}</button>
        <div className="meters">
          <div className="meter">
            <span className="k">{t('level')}</span>
            <span className="v">{String(g.level).padStart(2, '0')}</span>
          </div>
          <div className="meter">
            <span className="k">{t('lines')}</span>
            <span className="v">{g.lines}</span>
          </div>
        </div>
        <button className="btn primary" onClick={actions.newGame}>{t('newgame')}</button>
      </div>
      <Overlay g={g} best={best} t={t} actions={actions} />
      <SettingsModal open={modalOpen} settings={settings} set={set} t={t} onClose={closeSettings} />
    </div>
  );
}