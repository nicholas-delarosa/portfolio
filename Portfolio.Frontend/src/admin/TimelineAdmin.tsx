import { useEffect, useState } from 'react'
import type { TimelineKind } from '../api'
import { adminApi, type TimelineEntry } from './adminApi'
import { Field, NoticeBox, TextArea, TextInput, useAction, useAdminData } from './ui'

const kinds: { value: TimelineKind; label: string }[] = [
  { value: 'Education', label: 'Formación' },
  { value: 'Work', label: 'Trabajo' },
  { value: 'Milestone', label: 'Logro (una sola fecha)' }
]

const today = () => new Date().toISOString().slice(0, 10)

export default function TimelineAdmin() {
  const { data: loaded, error } = useAdminData(adminApi.timeline)
  const [entries, setEntries] = useState<TimelineEntry[]>()
  const { busy, notice, run } = useAction()

  useEffect(() => {
    if (loaded) setEntries(loaded)
  }, [loaded])

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!entries) return <p>* Cargando trayectoria...</p>

  const update = (index: number, changes: Partial<TimelineEntry>) =>
    setEntries((list) => list?.map((e, i) => (i === index ? { ...e, ...changes } : e)))

  const add = () =>
    setEntries([
      { kind: 'Education', titleEs: '', titleEn: '', organization: null, descriptionEs: null, descriptionEn: null, startDate: today(), endDate: null, url: null },
      ...entries
    ])

  return (
    <>
      <h1>Trayectoria</h1>
      <p className="admin-intro">
        Los "puntos de guardado" de Información. Se muestran del más reciente al más antiguo según la fecha de inicio.
        Deja la fecha de fin vacía si sigue en curso ("Actualidad").
      </p>

      <div className="admin-actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <button type="button" className="admin-button" onClick={add}>Agregar punto de guardado</button>
      </div>

      <div className="admin-list">
        {entries.map((entry, i) => (
          <section key={i} className="admin-card">
            <div className="admin-card-head">
              <h2 className="admin-row-title">★ {entry.titleEs || 'Sin título'}</h2>
              <button type="button" className="admin-button admin-button-danger"
                onClick={() => setEntries(entries.filter((_, j) => j !== i))}>Quitar</button>
            </div>
            <div className="admin-grid">
              <Field label="Tipo">
                <select value={entry.kind} onChange={(e) => update(i, { kind: e.target.value as TimelineKind })}>
                  {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </Field>
              <Field label="Lugar u organización"><TextInput value={entry.organization} onChange={(v) => update(i, { organization: v })} /></Field>
              <Field label="Fecha de inicio">
                <input type="date" value={entry.startDate} onChange={(e) => update(i, { startDate: e.target.value || today() })} />
              </Field>
              {entry.kind !== 'Milestone' && (
                <Field label="Fecha de fin" hint="Vacía = sigue en curso">
                  <input type="date" value={entry.endDate ?? ''} onChange={(e) => update(i, { endDate: e.target.value || null })} />
                </Field>
              )}
              <Field label="Título en español"><input value={entry.titleEs} onChange={(e) => update(i, { titleEs: e.target.value })} /></Field>
              <Field label="Título en inglés"><input value={entry.titleEn} onChange={(e) => update(i, { titleEn: e.target.value })} /></Field>
              <Field label="Descripción en español" wide>
                <TextArea rows={2} value={entry.descriptionEs} onChange={(v) => update(i, { descriptionEs: v })} maxLength={600} />
              </Field>
              <Field label="Descripción en inglés" wide>
                <TextArea rows={2} value={entry.descriptionEn} onChange={(v) => update(i, { descriptionEn: v })} maxLength={600} />
              </Field>
              <Field label="Link (opcional)"><TextInput type="url" value={entry.url} onChange={(v) => update(i, { url: v })} /></Field>
            </div>
          </section>
        ))}
      </div>

      <div className="admin-actions">
        <button type="button" className="admin-button admin-button-primary" disabled={busy}
          onClick={async () => {
            const saved = await run(() => adminApi.saveTimeline(entries), 'Trayectoria guardada.')
            if (saved) setEntries(saved)
          }}>
          {busy ? 'Guardando...' : 'Guardar trayectoria'}
        </button>
      </div>
      <NoticeBox notice={notice} />
    </>
  )
}
