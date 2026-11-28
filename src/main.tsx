import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './donation.css';
import './gameplay.css';
import './menu.css';
import './menu2.css';
import './pause.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
