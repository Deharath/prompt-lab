import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { preloadTokenizer } from './utils/tokenCounter.js';

// Preload tokenizer to avoid loading delays during interaction
preloadTokenizer(['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
