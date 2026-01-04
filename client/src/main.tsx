import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import App from './App.tsx'

// Initialize theme from localStorage before rendering to prevent flash
const savedTheme = localStorage.getItem('barangay-theme') || 'dark'
const rootElement = document.documentElement
if (savedTheme === 'dark') {
  rootElement.classList.add('dark')
} else {
  rootElement.classList.remove('dark')
}
rootElement.setAttribute('data-theme', savedTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
