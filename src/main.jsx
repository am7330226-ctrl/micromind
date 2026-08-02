import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for PWA Offline Capability
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  if (import.meta.env.DEV) {
    // Clear SW and Cache Storage in dev mode so stale JS bundles never linger
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('MicroMind PWA Service Worker registered:', reg.scope))
        .catch(err => console.error('PWA SW Registration Failed:', err));
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
