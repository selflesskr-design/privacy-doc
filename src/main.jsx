import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Redaction self-test, dev only. `import.meta.env.DEV` is a build-time constant,
// so this whole branch is dropped from the production bundle.
if (import.meta.env.DEV) {
  window.__redactSelfTest = async (opts) => {
    const { runRedactSelfTest } = await import('./lib/redact.selftest.js')
    return runRedactSelfTest(opts)
  }
}
