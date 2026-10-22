import { useMemo, useState } from 'react'
import { adminApi, toUpdate, type AdminProject, type Association, type ProjectUpdate } from './adminApi'
import { Field, NoticeBox, TextArea, TextInput, formatDate, useAction, useAdminData } from './ui'

type Filter = 'all' | 'visible' | 'hidden' | 'new' | 'removed'

const relationLabels = {
  Owner: 'Mío',
  Organization: 'Organización',
  Contributor: 'Contribución',
  Manual: 'Manual'
}

// Un proyecto nunca editado y oculto es "nuevo": llegó solo desde GitHub y espera tu revisión
const isNew = (p: AdminProject) =>
  !p.isVisible && !p.titleEs && !p.titleEn && !p.descriptionEs && !p.descriptionEn && !p.demoUrl && p.technologies.length === 0

// Mismo orden que ve el visitante: destacados, orden manual, actividad reciente
const publicOrder = (a: AdminProject, b: AdminProject) =>
  Number(b.isFeatured) - Number(a.isFeatured) ||
  a.sortOrder - b.sortOrder ||
  (b.gitHubPushedAt ?? '').localeCompare(a.gitHubPushedAt ?? '')

export default function ProjectsAdmin() {
  const { data: projects, setData: setProjects, error } = useAdminData(adminApi.projects)
  const { data: associations } = useAdminData(adminApi.associations)
  const { busy, notice, run } = useAction()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const replace = (updated: AdminProject) =>
    setProjects((list) => list?.map((p) => (p.id === updated.id ? updated : p)))

  const visibleList = useMemo(() => (projects ?? []).filter((p) => p.isVisible && !p.removedFromGitHub).sort(publicOrder), [projects])

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase()
    const base = filter === 'visible' ? visibleList : (projects ?? []).filter((p) =>
      filter === 'all' ? true
        : filter === 'hidden' ? !p.isVisible
        : filter === 'new' ? isNew(p)
        : p.removedFromGitHub)
    return base.filter((p) => !term || p.fullName.toLowerCase().includes(term) || p.displayTitle.toLowerCase().includes(term))
  }, [projects, visibleList, filter, search])

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!projects) return <p>* Cargando proyectos...</p>

  const counts = {
    all: projects.length,
    visible: visibleList.length,
    hidden: projects.filter((p) => !p.isVisible).length,
    new: projects.filter(isNew).length,
    removed: projects.filter((p) => p.removedFromGitHub).length
  }

  const save = (project: AdminProject, changes: Partial<ProjectUpdate>, success?: string) =>
    run(async () => replace(await adminApi.updateProject(project.id, { ...toUpdate(project), ...changes })), success)

  const setVisibility = async (ids: number[], isVisible: boolean) => {
    const ok = await run(() => adminApi.setVisibility(ids, isVisible).then(() => true), isVisible ? 'Proyectos visibles.' : 'Proyectos ocultos.')
    if (ok) {
      setProjects((list) => list?.map((p) => (ids.includes(p.id) ? { ...p, isVisible } : p)))
      setSelected(new Set())
    }
  }

  // Sube o baja un proyecto en el orden público y guarda el orden completo
  const move = (project: AdminProject, step: -1 | 1) => {
    const order = [...visibleList]
    const index = order.findIndex((p) => p.id === project.id)
    const target = index + step
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    const ids = order.map((p) => p.id)
    setProjects((list) => list?.map((p) => (ids.includes(p.id) ? { ...p, sortOrder: ids.indexOf(p.id) } : p)))
    run(() => adminApi.saveOrder(ids))
  }

  const toggleSelected = (id: number) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <h1>Proyectos</h1>
      <p className="admin-intro">
        Los proyectos llegan solos desde GitHub y aparecen <b>ocultos</b>. Marca "Visible" en los que quieras mostrar,
        ordénalos con ↑↓ y edita su información. Lo que cambies aquí nunca lo sobrescribe la sincronización.
      </p>

      <div className="admin-toolbar">
        <input type="search" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar proyectos" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filtrar">
          <option value="all">Todos ({counts.all})</option>
          <option value="visible">Visibles, en orden público ({counts.visible})</option>
          <option value="hidden">Ocultos ({counts.hidden})</option>
          <option value="new">Nuevos sin revisar ({counts.new})</option>
          <option value="removed">Ya no están en GitHub ({counts.removed})</option>
        </select>
        <button type="button" className="admin-button" disabled={selected.size === 0 || busy} onClick={() => setVisibility([...selected], true)}>
          Mostrar seleccionados
        </button>
        <button type="button" className="admin-button" disabled={selected.size === 0 || busy} onClick={() => setVisibility([...selected], false)}>
          Ocultar seleccionados
        </button>
        <button type="button" className="admin-button" onClick={() => setCreating((c) => !c)}>
          {creating ? 'Cancelar' : 'Agregar proyecto manual'}
        </button>
        <span className="admin-count">{shown.length} en la lista</span>
      </div>

      <NoticeBox notice={notice} />

      {creating && (
        <ManualProject
          associations={associations ?? []}
          onCreated={(p) => {
            setProjects((list) => [p, ...(list ?? [])])
            setCreating(false)
            setEditing(p.id)
          }}
        />
      )}

      <div className="admin-list">
        {shown.map((project) => {
          const position = visibleList.findIndex((p) => p.id === project.id)
          return (
            <article key={project.id} className={`admin-row ${project.isVisible ? '' : 'admin-row-hidden'}`}>
              <div className="admin-row-main">
                <input
                  type="checkbox"
                  checked={selected.has(project.id)}
                  onChange={() => toggleSelected(project.id)}
                  aria-label={`Seleccionar ${project.displayTitle}`}
                />
                <img
                  className="admin-thumb"
                  src={project.imageUrl ?? (project.gitHubId ? `https://opengraph.githubassets.com/1/${project.fullName}` : '/soul.png')}
                  alt=""
                  loading="lazy"
                />
                <div>
                  <p className="admin-row-title">{project.displayTitle}</p>
                  <p className="admin-row-meta">
                    <span>{project.fullName}</span>
                    <span>{relationLabels[project.relation]}</span>
                    {project.primaryLanguage && <span>{project.primaryLanguage}</span>}
                    {project.association && <span style={{ color: project.association.color }}>{project.association.name}</span>}
                    {project.gitHubPushedAt && <span>Actividad: {formatDate(project.gitHubPushedAt)}</span>}
                    {isNew(project) && <span className="admin-pill admin-pill-new">Nuevo</span>}
                    {project.removedFromGitHub && <span className="admin-pill admin-pill-removed">Ya no está en GitHub</span>}
                    {project.imageError && <span className="admin-pill admin-pill-error" title={project.imageError}>Falló la captura</span>}
                  </p>
                </div>
                <div className="admin-row-controls">
                  {project.isVisible && (
                    <>
                      <button type="button" className="admin-icon-button" disabled={position <= 0 || busy} onClick={() => move(project, -1)} aria-label="Subir">↑</button>
                      <button type="button" className="admin-icon-button" disabled={position === visibleList.length - 1 || busy} onClick={() => move(project, 1)} aria-label="Bajar">↓</button>
                    </>
                  )}
                  <button
                    type="button"
                    className="admin-icon-button admin-star"
                    aria-pressed={project.isFeatured}
                    title="Destacado (sale en el inicio)"
                    onClick={() => save(project, { isFeatured: !project.isFeatured })}
                  >
                    ★
                  </button>
                  <label className="admin-check">
                    <input type="checkbox" checked={project.isVisible} onChange={() => save(project, { isVisible: !project.isVisible })} />
                    Visible
                  </label>
                  <button type="button" className="admin-button" onClick={() => setEditing(editing === project.id ? null : project.id)} aria-expanded={editing === project.id}>
                    {editing === project.id ? 'Cerrar' : 'Editar'}
                  </button>
                </div>
              </div>

              {editing === project.id && (
                <ProjectEditor
                  key={project.id}
                  project={project}
                  associations={associations ?? []}
                  onSaved={replace}
                  onDeleted={() => {
                    setProjects((list) => list?.filter((p) => p.id !== project.id))
                    setEditing(null)
                  }}
                />
              )}
            </article>
          )
        })}
        {shown.length === 0 && <p className="muted">* No hay proyectos con ese filtro.</p>}
      </div>
    </>
  )
}

function ProjectEditor({ project, associations, onSaved, onDeleted }: {
  project: AdminProject
  associations: Association[]
  onSaved: (p: AdminProject) => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState<ProjectUpdate>(() => toUpdate(project))
  const [technologies, setTechnologies] = useState(project.technologies.join(', '))
  const { busy, notice, run } = useAction()
  const set = <K extends keyof ProjectUpdate>(key: K) => (value: ProjectUpdate[K]) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async () => {
    const tech = technologies.split(',').map((t) => t.trim()).filter(Boolean)
    const saved = await run(() => adminApi.updateProject(project.id, { ...form, technologies: tech }), 'Cambios guardados.')
    if (saved) onSaved(saved)
  }

  const uploadImage = async (file: File | undefined) => {
    if (!file) return
    const saved = await run(() => adminApi.uploadProjectImage(project.id, file), 'Imagen subida.')
    if (saved) onSaved(saved)
  }

  const removeImage = async () => {
    const saved = await run(() => adminApi.removeProjectImage(project.id), 'Imagen quitada. Se usará la captura automática.')
    if (saved) onSaved(saved)
  }

  const retake = () =>
    run(() => adminApi.retakeScreenshot(project.id), 'Captura en cola. Recarga la página en unos segundos para verla.')

  const remove = async () => {
    const warning = project.gitHubId
      ? '¿Borrar este proyecto? Si sigue en GitHub, volverá (oculto) en la próxima sincronización. Para que no salga, mejor déjalo oculto.'
      : '¿Borrar este proyecto manual? No se puede deshacer.'
    if (!window.confirm(warning)) return
    const ok = await run(() => adminApi.deleteProject(project.id).then(() => true))
    if (ok) onDeleted()
  }

  return (
    <div className="admin-editor">
      <div className="admin-grid">
        <Field label="Título en español" hint={`Si lo dejas vacío: "${project.displayTitle}"`}>
          <TextInput value={form.titleEs} onChange={set('titleEs')} maxLength={100} />
        </Field>
        <Field label="Título en inglés" hint="Si lo dejas vacío se usa el de español">
          <TextInput value={form.titleEn} onChange={set('titleEn')} maxLength={100} />
        </Field>
        <Field label="Descripción en español" wide hint={project.gitHubDescription ? `En GitHub: "${project.gitHubDescription}"` : 'El repo no tiene descripción en GitHub'}>
          <TextArea value={form.descriptionEs} onChange={set('descriptionEs')} maxLength={1000} placeholder={project.gitHubDescription ?? ''} />
        </Field>
        <Field label="Descripción en inglés" wide>
          <TextArea value={form.descriptionEn} onChange={set('descriptionEn')} maxLength={1000} placeholder={project.gitHubDescription ?? ''} />
        </Field>
        <Field label="Link del demo" hint={project.gitHubHomepage ? `En GitHub: ${project.gitHubHomepage}` : 'Si tiene demo se toma una captura automática'}>
          <TextInput type="url" value={form.demoUrl} onChange={set('demoUrl')} placeholder={project.gitHubHomepage ?? 'https://...'} />
        </Field>
        <Field label="Tecnologías" hint={project.topics.length ? `Temas de GitHub: ${project.topics.join(', ')}` : 'Separadas por comas, ej. React, Docker'}>
          <input value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="React, .NET, PostgreSQL" />
        </Field>
        <Field label="Asociación">
          <select
            value={form.associationId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, associationId: e.target.value ? Number(e.target.value) : null, associationLocked: true }))}
          >
            <option value="">Ninguna</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Asignación de la asociación">
          <label className="admin-check">
            <input type="checkbox" checked={form.associationLocked} onChange={(e) => set('associationLocked')(e.target.checked)} />
            Fijarla a mano (la sincronización no la cambia)
          </label>
        </Field>
      </div>

      <div className="admin-actions">
        <button type="button" className="admin-button admin-button-primary" disabled={busy} onClick={submit}>
          {busy ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {project.htmlUrl && <a className="admin-button" href={project.htmlUrl} target="_blank" rel="noopener noreferrer">Ver en GitHub</a>}
        <button type="button" className="admin-button admin-button-danger" disabled={busy} onClick={remove}>Borrar</button>
      </div>
      <NoticeBox notice={notice} />

      <h3 className="admin-field-label" style={{ margin: '18px 0 8px' }}>Imagen</h3>
      <div className="admin-image-box">
        {project.imageUrl ? <img src={project.imageUrl} alt="" /> : <p className="muted">Sin imagen: se muestra la tarjeta de GitHub.</p>}
        <div className="admin-actions" style={{ marginTop: 0 }}>
          <label className="admin-button admin-file-label">
            Subir imagen propia
            <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} />
          </label>
          {project.imageLocked && <button type="button" className="admin-button" onClick={removeImage}>Quitar imagen propia</button>}
          {project.effectiveDemoUrl && (
            <button type="button" className="admin-button" onClick={retake}>Tomar captura del demo</button>
          )}
        </div>
        <p className="admin-field-hint" style={{ width: '100%' }}>
          {project.imageLocked ? 'Usando tu imagen subida.' : project.imageCapturedAt ? `Captura automática del ${formatDate(project.imageCapturedAt)}.` : ''}
          {project.imageError && ` Último error de captura: ${project.imageError}`}
        </p>
      </div>
    </div>
  )
}

function ManualProject({ associations, onCreated }: { associations: Association[]; onCreated: (p: AdminProject) => void }) {
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState<string | null>(null)
  const [demoUrl, setDemoUrl] = useState<string | null>(null)
  const [associationId, setAssociationId] = useState<number | null>(null)
  const { busy, notice, run } = useAction()

  const submit = async () => {
    const created = await run(() =>
      adminApi.createProject(name, repoUrl, {
        isVisible: false, isFeatured: false, sortOrder: 0,
        titleEs: null, titleEn: null, descriptionEs: null, descriptionEn: null,
        demoUrl, technologies: [], associationId, associationLocked: associationId !== null
      }), 'Proyecto creado (oculto). Complétalo y márcalo como visible.')
    if (created) onCreated(created)
  }

  return (
    <section className="admin-section">
      <h2>Proyecto manual</h2>
      <p className="admin-intro">Para proyectos que no están en GitHub (o si la sincronización no encuentra alguno).</p>
      <div className="admin-grid">
        <Field label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></Field>
        <Field label="Link del repositorio (opcional)"><TextInput type="url" value={repoUrl} onChange={setRepoUrl} /></Field>
        <Field label="Link del demo (opcional)"><TextInput type="url" value={demoUrl} onChange={setDemoUrl} /></Field>
        <Field label="Asociación">
          <select value={associationId ?? ''} onChange={(e) => setAssociationId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Ninguna</option>
            {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="admin-actions">
        <button type="button" className="admin-button admin-button-primary" disabled={busy || !name.trim()} onClick={submit}>Crear proyecto</button>
      </div>
      <NoticeBox notice={notice} />
    </section>
  )
}
