import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Could not find root element to mount to')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={250}>
      <App />
    </TooltipProvider>
  </React.StrictMode>
)
