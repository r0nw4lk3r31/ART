import React from 'react';
import { createRoot } from 'react-dom/client';
import ArtDashboard from './components/art/ArtDashboard';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArtDashboard />
  </React.StrictMode>
);