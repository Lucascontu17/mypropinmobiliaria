import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'

// ═══════════════════════════════════════════════════════════════════
// PWA VERSION CONTROL & CACHE PURGE (V2.4)
// ═══════════════════════════════════════════════════════════════════
const APP_VERSION = 'V2.4.9';
const savedVersion = localStorage.getItem('app_version');

if (savedVersion !== APP_VERSION) {
  const purgeAndReload = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
    localStorage.setItem('app_version', APP_VERSION);
    window.location.reload();
  };
  purgeAndReload();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
