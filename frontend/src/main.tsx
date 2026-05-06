import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig.js';
import { App } from './App.js';
import { DemoApp } from './DemoApp.js';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

if (isDemo) {
  createRoot(root).render(
    <StrictMode>
      <DemoApp />
    </StrictMode>
  );
} else {
  const msalInstance = new PublicClientApplication(msalConfig);
  createRoot(root).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>
  );
}
