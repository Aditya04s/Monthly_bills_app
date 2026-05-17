import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerAppServiceWorker } from './services/pwa';
import { initializeStorage } from './storage';
import './styles/tailwind.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

registerAppServiceWorker();
void initializeStorage().catch(() => undefined);
