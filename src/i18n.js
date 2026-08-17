export const DICT = {
  ru: {
    sub: 'КЛАССИЧЕСКИЙ ТЕТРИС · 10×20', score: 'СЧЁТ', best: 'РЕКОРД', level: 'УРОВ.',
    next: 'СЛЕД.', lines: 'ЛИНИИ', hold: 'УДЕРЖ.', pause: 'ПАУЗА', resume: 'ПРОДОЛЖИТЬ',
    newgame: 'НОВАЯ ИГРА', settings: 'НАСТРОЙКИ', sound: 'ЗВУК', vibration: 'ВИБРАЦИЯ',
    holdOpt: 'УДЕРЖ. ФИГУРЫ', mode: 'РЕЖИМ', modern: 'СОВРЕМ.', retro: 'РЕТРО',
    language: 'ЯЗЫК', close: 'ЗАКРЫТЬ', paused: 'ПАУЗА', gameover: 'ИГРА ОКОНЧЕНА',
    final: 'СЧЁТ', tap: 'НАЖМИТЕ ДЛЯ СТАРТА',
  },
  en: {
    sub: 'CLASSIC TETRIS · 10×20', score: 'SCORE', best: 'BEST', level: 'LEVEL',
    next: 'NEXT', lines: 'LINES', hold: 'HOLD', pause: 'PAUSE', resume: 'RESUME',
    newgame: 'NEW GAME', settings: 'SETTINGS', sound: 'SOUND', vibration: 'VIBRATION',
    holdOpt: 'HOLD PIECE', mode: 'MODE', modern: 'MODERN', retro: 'RETRO',
    language: 'LANGUAGE', close: 'CLOSE', paused: 'PAUSED', gameover: 'GAME OVER',
    final: 'SCORE', tap: 'TAP TO START',
  },
};

export const makeT = (lang) => (k) => (DICT[lang] && DICT[lang][k]) || k;