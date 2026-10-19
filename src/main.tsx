/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { iniciarRegistroDeTela } from './lib/registro-tela'

// SPEC-206: registra as telas abertas (Central › Administração › Movimentação).
iniciarRegistroDeTela()

createRoot(document.getElementById('root')!).render(<App />)
