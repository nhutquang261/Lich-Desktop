import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WidgetApp } from './widget-ui/WidgetApp'
import './styles/index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <WidgetApp />
  </StrictMode>
)
