import { useRef, useState, type FormEvent } from 'react'
import { useLang, useT } from '../i18n'
import { ApiError, sendContact, useSite } from '../api'
import { Menu, MenuAnchor, MenuButton } from '../components/Menu'
import { Loading, LoadError } from '../components/Status'
import './Contact.css'

type Status = 'idle' | 'sending' | 'sent' | 'tooMany' | 'error'
type Fields = { name: string; email: string; message: string }
const empty: Fields = { name: '', email: '', message: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Menú ACT del juego: cada opción es una forma de contactarme
export default function Contact() {
  const lang = useLang()
  const t = useT()
  const { data: site, error } = useSite(lang)
  const [notice, setNotice] = useState<string | null>(null)
  const [fields, setFields] = useState<Fields>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [status, setStatus] = useState<Status>('idle')
  const honeypot = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  if (error) return <LoadError />
  if (!site) return <Loading />

  const { profile } = site
  const whatsAppNumber = profile.whatsApp?.replace(/\D/g, '')

  const copyEmail = async () => {
    if (!profile.email) return
    if (await copyText(profile.email)) setNotice(t.emailCopied)
    else window.location.href = `mailto:${profile.email}`
  }

  const validate = (values: Fields) => {
    const result: Partial<Record<keyof Fields, string>> = {}
    if (!values.name.trim()) result.name = t.required
    if (!values.email.trim()) result.email = t.required
    else if (!emailPattern.test(values.email.trim())) result.email = t.invalidEmail
    if (!values.message.trim()) result.message = t.required
    return result
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validate(fields)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus()
      return
    }

    setStatus('sending')
    try {
      await sendContact({ ...fields, language: lang, website: honeypot.current?.value ?? '' })
      setStatus('sent')
      setFields(empty)
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        // El servidor revalida: mostrar sus mensajes en los campos
        setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])))
        setStatus('idle')
      } else {
        setStatus(e instanceof ApiError && e.status === 429 ? 'tooMany' : 'error')
      }
    }
  }

  const update = (key: keyof Fields) => (event: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: event.target.value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  return (
    <div className="page contact">
      <h1 className="page-title">{t.contact}</h1>

      {profile.availableForWork && profile.availability && (
        <p className="contact-available">
          <span aria-hidden="true">★ </span>
          {profile.availability}
        </p>
      )}

      <div className="contact-layout">
        <section className="box contact-act" aria-labelledby="act-title">
          <h2 id="act-title" className="box-title contact-act-title">{t.actMenu}</h2>
          <Menu className="contact-act-menu" label={t.actMenu}>
            {profile.email && (
              <MenuButton onClick={copyEmail} className="soul-inside">
                <span className="soul-slot">* {t.actEmail}</span>
                <span className="contact-act-detail">
                  {/* Si no cabe, que corte después de la @ y no en medio de una palabra */}
                  {profile.email.split('@')[0]}@<wbr />
                  {profile.email.split('@')[1]}
                </span>
              </MenuButton>
            )}
            {profile.linkedInUrl && <MenuAnchor href={profile.linkedInUrl}>* {t.actLinkedIn}</MenuAnchor>}
            {whatsAppNumber && (
              <MenuAnchor href={`https://wa.me/${whatsAppNumber}`} className="soul-inside">
                <span className="soul-slot">* {t.actWhatsApp}</span>
                <span className="contact-act-detail">{profile.whatsApp}</span>
              </MenuAnchor>
            )}
            {profile.gitHubUrl && <MenuAnchor href={profile.gitHubUrl}>* {t.actGitHub}</MenuAnchor>}
            <MenuButton onClick={() => nameRef.current?.focus()}>* {t.actWrite}</MenuButton>
          </Menu>
          <p className="contact-notice" role="status">
            {notice}
          </p>
        </section>

        <section className="box contact-form-box" aria-labelledby="write-title">
          <h2 id="write-title" className="box-title">{t.writeTitle}</h2>

          {status === 'sent' ? (
            <div className="contact-sent">
              <p role="status">{t.sent}</p>
              <Menu label={t.sendAnother}>
                <MenuButton onClick={() => setStatus('idle')}>{t.sendAnother}</MenuButton>
              </Menu>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit} noValidate>
              <Field id="contact-name" label={t.nameLabel} error={errors.name}>
                <input
                  ref={nameRef}
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  value={fields.name}
                  onChange={update('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                />
              </Field>
              <Field id="contact-email" label={t.emailLabel} error={errors.email}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  value={fields.email}
                  onChange={update('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                />
              </Field>
              <Field id="contact-message" label={t.messageLabel} error={errors.message}>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  maxLength={3000}
                  value={fields.message}
                  onChange={update('message')}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
              </Field>

              {/* Campo trampa para bots: oculto para personas y lectores de pantalla */}
              <input ref={honeypot} className="contact-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

              {(status === 'tooMany' || status === 'error') && (
                <p className="contact-error" role="alert">
                  {status === 'tooMany' ? t.tooMany : t.sendError}
                </p>
              )}

              <Menu label={t.send}>
                <MenuButton type="submit" disabled={status === 'sending'} className="contact-submit">
                  {status === 'sending' ? t.sending : t.send}
                </MenuButton>
              </Menu>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

// El portapapeles moderno solo existe en https; si no está, se usa el método clásico
async function copyText(text: string) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Sin permiso: probar el método clásico
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  return ok
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="contact-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="contact-field-error">
          {error}
        </p>
      )}
    </div>
  )
}
