import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import LanguageSelect from './pages/LanguageSelect'
import Layout from './components/Layout'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LanguageSelect />} />
        {/* /es, /es/proyectos, /en/projects... (el Layout decide la página o muestra el 404) */}
        <Route path="/:lang/:section?" element={<Layout />} />
        <Route path="*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
