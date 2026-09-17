import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useStore } from './state/store'

// Boot catch-up for the rent-automation job (idempotent; never throws into boot).
try {
  useStore.getState().runPaymentAutomation();
} catch (err) {
  console.error('[payments:auto] boot catch-up failed', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
