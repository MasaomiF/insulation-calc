import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import InsulationCalc from './InsulationCalc'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InsulationCalc />
  </StrictMode>,
)
