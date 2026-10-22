import { useCallback, useEffect, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { describeError } from './adminApi'

// Piezas compartidas del panel de admin

export function Field({ label, hint, children, wide = false }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`admin-field ${wide ? 'admin-field-wide' : ''}`}>
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && <span className="admin-field-hint">{hint}</span>}
    </label>
  )
}

type TextProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string | null
  onChange: (value: string | null) => void
}

// Campo de texto donde vacío significa "sin valor" (null)
export function TextInput({ value, onChange, ...props }: TextProps) {
  return <input {...props} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />
}

type AreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string | null
  onChange: (value: string | null) => void
}

export function TextArea({ value, onChange, ...props }: AreaProps) {
  return <textarea rows={4} {...props} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />
}

export function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <span className="admin-color">
      <input type="color" value={value.slice(0, 7)} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label="Elegir color" />
      <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={9} spellCheck={false} />
      <span className="tag" style={{ '--tag-color': value } as React.CSSProperties}>Vista previa</span>
    </span>
  )
}

export type Notice = { kind: 'ok' | 'error'; text: string } | null

export function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null
  return (
    <p className={`admin-notice admin-notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      {notice.kind === 'ok' ? '* ' : '* Error: '}
      {notice.text}
    </p>
  )
}

// Ejecuta una acción mostrando "guardando..." y el resultado; el aviso de éxito se borra solo
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    if (notice?.kind !== 'ok') return
    const timer = window.setTimeout(() => setNotice(null), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const run = useCallback(async <T,>(action: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setBusy(true)
    setNotice(null)
    try {
      const result = await action()
      if (success) setNotice({ kind: 'ok', text: success })
      return result
    } catch (error) {
      setNotice({ kind: 'error', text: describeError(error) })
      return undefined
    } finally {
      setBusy(false)
    }
  }, [])

  return { busy, notice, setNotice, run }
}

// Carga datos del admin una vez (y permite recargarlos)
export function useAdminData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    load().then(setData).catch((e) => setError(describeError(e)))
  }, [load])

  useEffect(reload, [reload])
  return { data, setData, error, reload }
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
