import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { StoreProvider } from './store'
import { Toaster } from './ui'
import './styles.css'
import './motion.css'
import './photoOrigin'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
)
