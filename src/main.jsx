import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode is intentionally OFF: it double-invokes state updaters, which
// would corrupt the 7-bag RNG and the rAF game loop. Standard practice for games.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);