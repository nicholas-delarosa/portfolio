import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useSearchParams } from 'react-router'
import { adminApi, type Me } from './adminApi'
import ProjectsAdmin from './ProjectsAdmin'
import AssociationsAdmin from './AssociationsAdmin'
import ProfileAdmin from './ProfileAdmin'
import SkillsAdmin from './SkillsAdmin'
import TimelineAdmin from './TimelineAdmin'
import MessagesAdmin from './MessagesAdmin'
import SyncAdmin from './SyncAdmin'
import './Admin.css'

const sections = [
  { path: '', label: 'Proyectos' },
  { path: 'asociaciones', label: 'Asociaciones' },
  { path: 'perfil', label: 'Perfil y CV' },
  { path: 'habilidades', label: 'Habilidades' },
  { path: 'trayectoria', label: 'Trayectoria' },
  { path: 'mensajes', label: 'Mensajes' },
  { path: 'sincronizacion', label: 'Sincronización' }
]

// Panel privado: solo entra la cuenta de GitHub del dueño
export default function AdminApp() {
  const [me, setMe] = useState<Me | null>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    document.documentElement.lang = 'es'
    document.title = 'Admin · Portafolio'
    // Que los buscadores no indexen el panel
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    adminApi.me().then(setMe).catch(() => setMe({ isAdmin: false, login: null, name: null, avatarUrl: null }))
    return () => robots.remove()
  }, [])

  useEffect(() => {
    if (!me?.isAdmin) return
    adminApi.messages().then((m) => setUnread(m.filter((x) => !x.isRead).length)).catch(() => {})
  }, [me])

  if (!me) return <p className="admin-loading">* Cargando...</p>
  if (!me.isAdmin) return <Login />

  const logout = async () => {
    await adminApi.logout().catch(() => {})
    window.location.href = '/admin'
  }

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-user">
          {me.avatarUrl && <img src={me.avatarUrl} alt="" />}
          <div>
            <p className="admin-user-name">{me.name ?? me.login}</p>
            <p className="admin-user-login">@{me.login}</p>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Secciones del admin">
          {sections.map((s) => (
            <NavLink key={s.path} to={`/admin/${s.path}`} end className="menu-item admin-nav-link">
              {s.label}
              {s.path === 'mensajes' && unread > 0 && <span className="admin-badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a className="menu-item" href="/es" target="_blank" rel="noopener noreferrer">Ver sitio</a>
          <button type="button" className="menu-item" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<ProjectsAdmin />} />
          <Route path="asociaciones" element={<AssociationsAdmin />} />
          <Route path="perfil" element={<ProfileAdmin />} />
          <Route path="habilidades" element={<SkillsAdmin />} />
          <Route path="trayectoria" element={<TimelineAdmin />} />
          <Route path="mensajes" element={<MessagesAdmin onUnreadChange={setUnread} />} />
          <Route path="sincronizacion" element={<SyncAdmin />} />
          <Route path="login" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function Login() {
  const [params] = useSearchParams()
  const error = params.get('error')

  return (
    <main className="admin-login">
      <div className="box admin-login-box">
        <h1>Panel de admin</h1>
        <p>* Solo el dueño de este portafolio puede entrar.</p>
        {error === 'denied' && (
          <p className="admin-notice admin-notice-error" role="alert">
            * Esa cuenta de GitHub no tiene acceso. Entra con la cuenta del dueño.
          </p>
        )}
        {error === 'failed' && (
          <p className="admin-notice admin-notice-error" role="alert">
            * GitHub no completó el inicio de sesión. Inténtalo de nuevo.
          </p>
        )}
        <a className="menu-item admin-login-button" href="/api/auth/login?returnUrl=/admin">
          Entrar con GitHub
        </a>
        <a className="admin-login-back" href="/">Volver al portafolio</a>
      </div>
    </main>
  )
}
