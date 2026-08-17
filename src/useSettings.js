import { useCallback, useState } from 'react';
import { makeT } from './i18n';

const KEY = 'chromafall_settings';
const DEFAULTS = { sound: true, vibration: true, hold: false, mode: 'modern', lang: 'ru' };

const load = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return DEFAULTS; }
};

export default function useSettings() {
  const [settings, setSettings] = useState(load);
  const set = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return { settings, set, t: makeT(settings.lang) };
}