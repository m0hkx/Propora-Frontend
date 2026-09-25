import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./auth/AuthContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div role="alert">
          <p>Something went wrong. Please reload the page.</p>
          {import.meta.env.DEV ? <pre>{getErrorMessage(error)}</pre> : null}
          <button type="button" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
