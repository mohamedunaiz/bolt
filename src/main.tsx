import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { registerServiceWorker } from './services/offlineSyncService';

// Initialize Service Worker for offline syllabus and timetable access
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary scope="app" label="BOLT">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
