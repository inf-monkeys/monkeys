import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './pages';

import 'normalize.css';
import '@/styles/index.scss';

ReactDOM.createRoot(document.getElementById('vines-ui')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
