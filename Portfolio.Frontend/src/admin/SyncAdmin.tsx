import { useEffect } from 'react'
import { adminApi } from './adminApi'
import { NoticeBox, formatDate, useAction, useAdminData } from './ui'

const statusLabels = { Running: 'En curso', Succeeded: 'Bien', Failed: 'Falló' }

export default function SyncAdmin() {
  const { data: status, error, reload } = useAdminData(adminApi.syncStatus)
  const { busy, notice, run } = useAction()

  // Mientras sincroniza, refrescar el estado cada 3 segundos
  useEffect(() => {
    if (!status?.isRunning) return
    const timer = window.setInterval(reload, 3000)
    return () => window.clearInterval(timer)
  }, [status?.isRunning, reload])

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!status) return <p>* Cargando...</p>

  const checks = [
    { ok: status.gitHubConfigured, label: 'Token de GitHub (para leer tus repos)' },
    { ok: status.cloudinaryConfigured, label: 'Cloudinary (imágenes y capturas)' },
    { ok: status.screenshotsConfigured, label: 'Servicio de capturas (Playwright)' },
    { ok: status.emailConfigured, label: 'Resend (avisos de mensajes por correo)' }
  ]

  return (
    <>
      <h1>Sincronización</h1>
      <p className="admin-intro">
        Cada 6 horas se revisa GitHub: proyectos nuevos (llegan ocultos), cambios en los que ya tienes y capturas de los demos.
        Si acabas de subir algo, sincroniza ahora.
      </p>

      <section className="admin-section">
        <h2>Configuración</h2>
        <ul className="admin-checklist">
          {checks.map((c) => (
            <li key={c.label} className={c.ok ? 'admin-ok' : 'admin-missing'}>
              {c.ok ? '✓' : '✕'} {c.label}
            </li>
          ))}
        </ul>
      </section>

      <div className="admin-actions">
        <button
          type="button"
          className="admin-button admin-button-primary"
          disabled={busy || status.isRunning || !status.gitHubConfigured}
          onClick={async () => {
            await run(adminApi.syncNow, 'Sincronización iniciada.')
            reload()
          }}
        >
          {status.isRunning ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
      </div>
      <NoticeBox notice={notice} />

      <section className="admin-section" style={{ marginTop: 20 }}>
        <h2>Últimas sincronizaciones</h2>
        <table className="admin-table">
          <thead>
            <tr><th>Inicio</th><th>Origen</th><th>Estado</th><th>Nuevos</th><th>Actualizados</th><th>Detalle</th></tr>
          </thead>
          <tbody>
            {status.runs.map((r) => (
              <tr key={r.id}>
                <td>{formatDate(r.startedAt)}</td>
                <td>{r.trigger === 'Manual' ? 'Botón' : 'Automática'}</td>
                <td className={r.status === 'Failed' ? 'admin-missing' : r.status === 'Succeeded' ? 'admin-ok' : ''}>{statusLabels[r.status]}</td>
                <td>{r.added}</td>
                <td>{r.updated}</td>
                <td className="muted">{r.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {status.runs.length === 0 && <p className="muted">* Todavía no hay sincronizaciones.</p>}
      </section>
    </>
  )
}
