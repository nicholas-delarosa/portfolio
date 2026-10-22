import { useEffect } from 'react'
import { adminApi } from './adminApi'
import { NoticeBox, formatDate, useAction, useAdminData } from './ui'

export default function MessagesAdmin({ onUnreadChange }: { onUnreadChange: (count: number) => void }) {
  const { data: messages, setData, error } = useAdminData(adminApi.messages)
  const { notice, run } = useAction()

  useEffect(() => {
    if (messages) onUnreadChange(messages.filter((m) => !m.isRead).length)
  }, [messages, onUnreadChange])

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!messages) return <p>* Cargando mensajes...</p>

  const mark = (id: number, isRead: boolean) =>
    run(async () => {
      await adminApi.markMessage(id, isRead)
      setData((list) => list?.map((m) => (m.id === id ? { ...m, isRead } : m)))
    })

  const remove = (id: number) => {
    if (!window.confirm('¿Borrar este mensaje? No se puede deshacer.')) return
    run(async () => {
      await adminApi.deleteMessage(id)
      setData((list) => list?.filter((m) => m.id !== id))
    })
  }

  return (
    <>
      <h1>Mensajes</h1>
      <p className="admin-intro">
        Lo que te escriben desde Contacto. También te llega un aviso al correo (si Resend está configurado);
        "Responder" abre tu correo con la respuesta lista.
      </p>
      <NoticeBox notice={notice} />

      <div className="admin-list">
        {messages.length === 0 && <p className="muted">* Todavía no tienes mensajes.</p>}
        {messages.map((m) => (
          <article key={m.id} className={`admin-message ${m.isRead ? '' : 'admin-message-unread'}`}>
            <div className="admin-message-head">
              <p className="admin-message-from">
                {m.isRead ? '' : '★ '}{m.name} <span className="muted">&lt;{m.email}&gt;</span>
              </p>
              <p className="muted">
                {formatDate(m.createdAt)} · {m.language === 'en' ? 'en inglés' : 'en español'} · {m.emailNotified ? 'aviso enviado' : 'sin aviso por correo'}
              </p>
            </div>
            <p className="admin-message-body">{m.message}</p>
            <div className="admin-actions" style={{ marginTop: 0 }}>
              <a
                className="admin-button admin-button-primary"
                href={`mailto:${m.email}?subject=${encodeURIComponent(m.language === 'en' ? 'Re: your message on my portfolio' : 'Re: tu mensaje en mi portafolio')}`}
                onClick={() => !m.isRead && mark(m.id, true)}
              >
                Responder
              </a>
              <button type="button" className="admin-button" onClick={() => mark(m.id, !m.isRead)}>
                Marcar como {m.isRead ? 'no leído' : 'leído'}
              </button>
              <button type="button" className="admin-button admin-button-danger" onClick={() => remove(m.id)}>Borrar</button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
