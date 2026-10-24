import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import LanguageSelect from './pages/LanguageSelect'
import Layout from './components/Layout'
import WarningGate from './components/WarningGate'
import SongPopup from './components/SongPopup'
import './styles/global.css'

// El admin se descarga aparte: los visitantes nunca lo cargan
const AdminApp = lazy(() => import('./admin/AdminApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WarningGate />
      <SongPopup />
      <Routes>
        <Route path="/" element={<LanguageSelect />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<p className="admin-loading">* Cargando...</p>}>
              <AdminApp />
            </Suspense>
          }
        />
        {/* /es, /es/proyectos, /en/projects... (el Layout decide la página o muestra el 404) */}
        <Route path="/:lang/:section?" element={<Layout />} />
        <Route path="*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
