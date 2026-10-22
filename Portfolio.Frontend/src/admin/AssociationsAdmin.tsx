import { useState } from 'react'
import { adminApi, type Association, type AssociationInput } from './adminApi'
import { ColorInput, Field, NoticeBox, TextArea, TextInput, useAction, useAdminData } from './ui'

const empty: AssociationInput = {
  name: '', gitHubLogin: null, color: '#FF77C8', websiteUrl: null, logoUrl: null, descriptionEs: null, descriptionEn: null
}

const toInput = ({ name, gitHubLogin, color, websiteUrl, logoUrl, descriptionEs, descriptionEn }: Association): AssociationInput =>
  ({ name, gitHubLogin, color, websiteUrl, logoUrl, descriptionEs, descriptionEn })

export default function AssociationsAdmin() {
  const { data: associations, setData, error } = useAdminData(adminApi.associations)
  const [creating, setCreating] = useState(false)

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!associations) return <p>* Cargando asociaciones...</p>

  return (
    <>
      <h1>Asociaciones</h1>
      <p className="admin-intro">
        Organizaciones o grupos con los que haces proyectos. Si pones su usuario de GitHub, la sincronización le asigna sola
        los repos de esa organización (y crea asociaciones nuevas cuando encuentra otra). El color es el de su etiqueta.
      </p>

      <div className="admin-actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <button type="button" className="admin-button" onClick={() => setCreating((c) => !c)}>
          {creating ? 'Cancelar' : 'Nueva asociación'}
        </button>
      </div>

      {creating && (
        <AssociationForm
          title="Nueva asociación"
          initial={empty}
          submitLabel="Crear asociación"
          onSubmit={(input) => adminApi.createAssociation(input)}
          onDone={(created) => {
            setData((list) => [...(list ?? []), created])
            setCreating(false)
          }}
        />
      )}

      <div className="admin-list">
        {associations.map((a) => (
          <AssociationForm
            key={a.id}
            title={`${a.name} · ${a.projectCount} ${a.projectCount === 1 ? 'proyecto' : 'proyectos'}`}
            initial={toInput(a)}
            submitLabel="Guardar"
            onSubmit={(input) => adminApi.updateAssociation(a.id, input)}
            onDone={(saved) => setData((list) => list?.map((x) => (x.id === saved.id ? saved : x)))}
            onDelete={async () => {
              if (!window.confirm(`¿Borrar "${a.name}"? Sus proyectos quedan sin asociación (no se borran).`)) return false
              await adminApi.deleteAssociation(a.id)
              setData((list) => list?.filter((x) => x.id !== a.id))
              return true
            }}
          />
        ))}
      </div>
    </>
  )
}

function AssociationForm({ title, initial, submitLabel, onSubmit, onDone, onDelete }: {
  title: string
  initial: AssociationInput
  submitLabel: string
  onSubmit: (input: AssociationInput) => Promise<Association>
  onDone: (a: Association) => void
  onDelete?: () => Promise<boolean>
}) {
  const [form, setForm] = useState(initial)
  const { busy, notice, run } = useAction()
  const set = <K extends keyof AssociationInput>(key: K) => (value: AssociationInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2 className="admin-row-title">{title}</h2>
        <span className="tag" style={{ '--tag-color': form.color } as React.CSSProperties}>
          Hecho con {form.name || '...'}
        </span>
      </div>
      <div className="admin-grid">
        <Field label="Nombre"><input value={form.name} onChange={(e) => set('name')(e.target.value)} maxLength={80} /></Field>
        <Field label="Usuario u organización en GitHub" hint="Ej. Esthercita-Factory (para asignarla sola)">
          <TextInput value={form.gitHubLogin} onChange={set('gitHubLogin')} />
        </Field>
        <Field label="Color de la etiqueta"><ColorInput value={form.color} onChange={set('color')} /></Field>
        <Field label="Sitio web"><TextInput type="url" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." /></Field>
        <Field label="Logo (URL de imagen)"><TextInput type="url" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." /></Field>
        <Field label="Descripción en español" wide><TextArea rows={2} value={form.descriptionEs} onChange={set('descriptionEs')} maxLength={500} /></Field>
        <Field label="Descripción en inglés" wide><TextArea rows={2} value={form.descriptionEn} onChange={set('descriptionEn')} maxLength={500} /></Field>
      </div>
      <div className="admin-actions">
        <button
          type="button"
          className="admin-button admin-button-primary"
          disabled={busy}
          onClick={async () => {
            const saved = await run(() => onSubmit(form), 'Guardado.')
            if (saved) onDone(saved)
          }}
        >
          {submitLabel}
        </button>
        {onDelete && (
          <button type="button" className="admin-button admin-button-danger" disabled={busy} onClick={() => run(onDelete)}>
            Borrar
          </button>
        )}
      </div>
      <NoticeBox notice={notice} />
    </section>
  )
}
