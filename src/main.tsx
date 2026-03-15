import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'pixel-retroui/dist/index.css'
import 'pixel-retroui/dist/fonts.css'
import './index.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in document')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
