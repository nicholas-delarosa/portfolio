import { useEffect, useState } from 'react'
import { adminApi, type Profile, type SpokenLanguage } from './adminApi'
import { ColorInput, Field, NoticeBox, TextArea, TextInput, useAction, useAdminData } from './ui'

export default function ProfileAdmin() {
  const { data: loaded, error } = useAdminData(adminApi.profile)
  const [form, setForm] = useState<Profile>()
  const { busy, notice, run } = useAction()
  const files = useAction()

  useEffect(() => {
    if (loaded) setForm(loaded)
  }, [loaded])

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!form) return <p>* Cargando perfil...</p>

  const set = <K extends keyof Profile>(key: K) => (value: Profile[K]) => setForm((f) => f && { ...f, [key]: value })
  // Las subidas devuelven el perfil completo: solo se toman los campos de archivos para no pisar lo que estás editando
  const applyFiles = (p: Profile | undefined) =>
    p && setForm((f) => f && { ...f, photoUrl: p.photoUrl, cvEsUrl: p.cvEsUrl, cvEnUrl: p.cvEnUrl })

  const setLanguage = (index: number, key: keyof SpokenLanguage, value: string) =>
    set('spokenLanguages')(form.spokenLanguages.map((l, i) => (i === index ? { ...l, [key]: value } : l)))

  return (
    <>
      <h1>Perfil y CV</h1>
      <p className="admin-intro">Lo que se muestra en Inicio, Información y Contacto, en los dos idiomas.</p>

      <section className="admin-section">
        <h2>Foto y CV</h2>
        <div className="admin-image-box">
          {form.photoUrl ? <img className="admin-photo" src={form.photoUrl} alt="Tu foto" /> : <p className="muted">Sin foto: se muestra el alma.</p>}
          <div className="admin-actions" style={{ marginTop: 0 }}>
            <label className="admin-button admin-file-label">
              {form.photoUrl ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) files.run(() => adminApi.uploadPhoto(file), 'Foto actualizada.').then(applyFiles)
              }} />
            </label>
            {form.photoUrl && (
              <button type="button" className="admin-button" onClick={() => files.run(adminApi.removePhoto, 'Foto quitada.').then(applyFiles)}>
                Quitar foto
              </button>
            )}
          </div>
        </div>

        {(['es', 'en'] as const).map((lang) => {
          const url = lang === 'es' ? form.cvEsUrl : form.cvEnUrl
          return (
            <div key={lang} className="admin-actions">
              <span className="admin-field-label" style={{ minWidth: 110 }}>CV {lang === 'es' ? 'en español' : 'en inglés'}</span>
              {url ? <a className="admin-button" href={url} target="_blank" rel="noopener noreferrer">Ver PDF actual</a> : <span className="muted">No subido</span>}
              <label className="admin-button admin-file-label">
                {url ? 'Reemplazar PDF' : 'Subir PDF'}
                <input type="file" accept="application/pdf" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) files.run(() => adminApi.uploadCv(lang, file), 'CV actualizado.').then(applyFiles)
                }} />
              </label>
              {url && (
                <button type="button" className="admin-button" onClick={() => files.run(() => adminApi.removeCv(lang), 'CV quitado.').then(applyFiles)}>
                  Quitar
                </button>
              )}
            </div>
          )
        })}
        <NoticeBox notice={files.notice} />
      </section>

      <section className="admin-section">
        <h2>Datos principales</h2>
        <div className="admin-grid">
          <Field label="Nombre"><input value={form.displayName} onChange={(e) => set('displayName')(e.target.value)} maxLength={80} /></Field>
          <Field label="Nivel (LV)" hint="El número que sale junto a tu nombre">
            <input type="number" min={1} max={99} value={form.level} onChange={(e) => set('level')(Number(e.target.value))} />
          </Field>
          <Field label="Cargo en español"><TextInput value={form.roleEs} onChange={set('roleEs')} /></Field>
          <Field label="Cargo en inglés"><TextInput value={form.roleEn} onChange={set('roleEn')} /></Field>
          <Field label="Ubicación en español"><TextInput value={form.locationEs} onChange={set('locationEs')} /></Field>
          <Field label="Ubicación en inglés"><TextInput value={form.locationEn} onChange={set('locationEn')} /></Field>
          <Field label="Frase de diálogo en español" wide hint='La primera línea de la caja de diálogo, ej. "* Nicholas está lleno de determinación."'>
            <TextInput value={form.dialogEs} onChange={set('dialogEs')} maxLength={300} />
          </Field>
          <Field label="Frase de diálogo en inglés" wide><TextInput value={form.dialogEn} onChange={set('dialogEn')} maxLength={300} /></Field>
          <Field label="Sobre mí en español" wide hint="Corto: los reclutadores leen menos de 100 palabras">
            <TextArea rows={5} value={form.bioEs} onChange={set('bioEs')} maxLength={1500} />
          </Field>
          <Field label="Sobre mí en inglés" wide><TextArea rows={5} value={form.bioEn} onChange={set('bioEn')} maxLength={1500} /></Field>
        </div>
      </section>

      <section className="admin-section">
        <h2>Contacto y disponibilidad</h2>
        <div className="admin-grid">
          <Field label="Correo" hint="También es a donde llegan los avisos de mensajes">
            <TextInput type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="LinkedIn"><TextInput type="url" value={form.linkedInUrl} onChange={set('linkedInUrl')} /></Field>
          <Field label="WhatsApp" hint="Con indicativo, ej. +57 304 428 3435"><TextInput value={form.whatsApp} onChange={set('whatsApp')} /></Field>
          <Field label="Usuario de GitHub"><TextInput value={form.gitHubLogin} onChange={set('gitHubLogin')} /></Field>
          <Field label="Disponibilidad">
            <label className="admin-check">
              <input type="checkbox" checked={form.availableForWork} onChange={(e) => set('availableForWork')(e.target.checked)} />
              Mostrar que estoy disponible para trabajar
            </label>
          </Field>
          <Field label="Texto de disponibilidad en español"><TextInput value={form.availabilityEs} onChange={set('availabilityEs')} /></Field>
          <Field label="Texto de disponibilidad en inglés"><TextInput value={form.availabilityEn} onChange={set('availabilityEn')} /></Field>
          <Field label='Color de la etiqueta "Trabajé en este proyecto"'>
            <ColorInput value={form.contributorTagColor} onChange={set('contributorTagColor')} />
          </Field>
        </div>
      </section>

      <section className="admin-section">
        <h2>Idiomas que hablas</h2>
        <table className="admin-table">
          <thead>
            <tr><th>En español</th><th>En inglés</th><th>Nivel</th><th /></tr>
          </thead>
          <tbody>
            {form.spokenLanguages.map((l, i) => (
              <tr key={i}>
                <td><input value={l.nameEs} onChange={(e) => setLanguage(i, 'nameEs', e.target.value)} aria-label="Idioma en español" /></td>
                <td><input value={l.nameEn} onChange={(e) => setLanguage(i, 'nameEn', e.target.value)} aria-label="Idioma en inglés" /></td>
                <td><input value={l.level} onChange={(e) => setLanguage(i, 'level', e.target.value)} aria-label="Nivel" /></td>
                <td className="admin-table-actions">
                  <button type="button" className="admin-icon-button" aria-label="Quitar idioma"
                    onClick={() => set('spokenLanguages')(form.spokenLanguages.filter((_, j) => j !== i))}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="admin-actions">
          <button type="button" className="admin-button"
            onClick={() => set('spokenLanguages')([...form.spokenLanguages, { nameEs: '', nameEn: '', level: '' }])}>
            Agregar idioma
          </button>
        </div>
      </section>

      <div className="admin-actions">
        <button type="button" className="admin-button admin-button-primary" disabled={busy}
          onClick={() => run(() => adminApi.saveProfile(form), 'Perfil guardado.')}>
          {busy ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
      <NoticeBox notice={notice} />
    </>
  )
}
