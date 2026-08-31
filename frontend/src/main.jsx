import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The service worker exists only to make the driver console installable as
// a PWA (see public/sw.js). It must stay scoped to /driver — registering it
// site-wide previously meant every page's HTML got cache-first'd, so a
// browser that had visited once would keep serving a stale app shell after
// every future deploy (old JS/CSS chunk hashes 404 against the new build).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (window.location.pathname.startsWith('/driver')) {
      navigator.serviceWorker.register('/sw.js', { scope: '/driver/' }).catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    } else {
      // Self-heal browsers stuck with the old site-wide registration from
      // before this fix, so they stop being served a stale cached shell.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          if (reg.scope === `${window.location.origin}/`) reg.unregister()
        })
      })
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
