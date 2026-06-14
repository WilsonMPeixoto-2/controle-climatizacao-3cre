import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Fontes auto-hospedadas (PR 6.1) — pesos efetivamente usados
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Fundação visual (PR 6.1) — importado DEPOIS do index.css: vence por ordem na cascata
import './styles/tokens.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/dossier.css';
import './styles/print-executive.css';

import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
