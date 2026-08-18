import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/russo-one/400.css';
import '@fontsource/play/400.css';
import '@fontsource/play/700.css';
import './index.css';

// StrictMode is intentionally OFF: it double-invokes state updaters, which
// would corrupt the 7-bag RNG and the rAF game loop. Standard practice for games.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);