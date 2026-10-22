import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { formatMonth, pathFor, useLang, useT } from '../i18n'
import { useProjects, type Project } from '../api'
import { play } from '../sound'
import { BACK_EVENT } from '../useGameKeys'
import { fromKeyboard, Menu, MenuAnchor, MenuButton, MenuLink } from '../components/Menu'
import LanguageBar from '../components/LanguageBar'
import SplashOverlay from '../components/SplashOverlay'
import { Loading, LoadError } from '../components/Status'
import './Projects.css'

type Filter = 'all' | 'mine' | 'associations' | 'contributions'

const filters: Record<Filter, (p: Project) => boolean> = {
  all: () => true,
  mine: (p) => p.relation !== 'Contributor',
  associations: (p) => p.association !== null,
  contributions: (p) => p.relation === 'Contributor'
}

const isCompact = () => window.matchMedia('(max-width: 860px)').matches
const yearOf = (p: Project) => (p.createdAt ? new Date(p.createdAt).getUTCFullYear() : 0)
const openUrl = (url: string | null) => url && window.open(url, '_blank', 'noopener,noreferrer')

/*
  Menú de proyectos, como el selector de encuentros del juego:
  - Nivel 1: filtros (Todos, Propios...). Z/Enter entra a la lista.
  - Nivel 2: la lista. Moverse muestra la vista previa; Z abre el demo, C el código, X vuelve a los filtros.
*/
export default function Projects() {
  const lang = useLang()
  const t = useT()
  const { data: projects, error } = useProjects(lang)
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const listRef = useRef<HTMLElement>(null)
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const selectedId = Number(params.get('p')) || null
  const visible = useMemo(() => (projects ?? []).filter(filters[filter]), [projects, filter])
  const selected = visible.find((p) => p.id === selectedId) ?? null

  // Agrupados por año, como los capítulos del juego (dentro de cada año se respeta el orden del admin)
  const groups = useMemo(() => {
    const byYear = new Map<number, Project[]>()
    for (const p of visible) byYear.set(yearOf(p), [...(byYear.get(yearOf(p)) ?? []), p])
    return [...byYear.entries()].sort(([a], [b]) => b - a)
  }, [visible])

  const select = (id: number) => {
    if (id !== selectedId) setParams({ p: String(id) }, { replace: true, preventScrollReset: true })
  }

  const enterList = () => {
    // Se espera al siguiente pintado: la lista cambia al cambiar de filtro
    requestAnimationFrame(() => {
      const current = listRef.current?.querySelector<HTMLElement>('.projects-row[aria-current="true"]')
      const target = current ?? listRef.current?.querySelector<HTMLElement>('.projects-row')
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'nearest' })
    })
  }

  // C abre el código del proyecto elegido mientras el alma está en la lista
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'c' || event.ctrlKey || event.metaKey || event.altKey) return
      if (!listRef.current?.contains(document.activeElement) || !selected?.repoUrl) return
      event.preventDefault()
      play('click')
      openUrl(selected.repoUrl)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  // Si llegas con ?p= desde el inicio en el celular, abrir directamente el detalle
  const openedFromLink = useRef(false)
  useEffect(() => {
    if (openedFromLink.current || !projects) return
    openedFromLink.current = true
    if (selectedId && isCompact()) setSheetOpen(true)
  }, [projects, selectedId])

  if (error) return <LoadError />
  if (!projects) return <Loading />

  const filterLabels: Record<Filter, string> = {
    all: t.filterAll,
    mine: t.filterMine,
    associations: t.filterAssociations,
    contributions: t.filterContributions
  }
  const availableFilters = (Object.keys(filters) as Filter[]).filter((f) => f === 'all' || projects.some(filters[f]))

  return (
    <div className="page projects">
      <SplashOverlay />

      <section className="panel" aria-labelledby="projects-title">
        <header className="panel-tabs">
          <h1 id="projects-title" className="panel-tab">{t.projects}</h1>
          <Menu direction="row" className="panel-tab-links" label={t.backToMenu}>
            <MenuLink to={pathFor(lang, 'about')} className="panel-tab">{t.about}</MenuLink>
            <MenuLink to={pathFor(lang, 'contact')} className="panel-tab">{t.contact}</MenuLink>
          </Menu>
        </header>

        <Menu direction="row" className="projects-chips" label={t.filterAll} start>
          {availableFilters.map((f) => (
            <MenuButton
              key={f}
              className="projects-chip"
              aria-pressed={filter === f}
              onClick={(event) => {
                if (f !== filter) {
                  setFilter(f)
                  if (selected && !filters[f](selected)) setParams({}, { replace: true, preventScrollReset: true })
                }
                // Con el teclado, elegir un filtro entra a la lista; con el mouse solo filtra
                if (fromKeyboard(event) && !isCompact()) enterList()
              }}
            >
              {filterLabels[f]} <span className="projects-chip-count">{projects.filter(filters[f]).length}</span>
            </MenuButton>
          ))}
        </Menu>

        {visible.length === 0 ? (
          <p className="projects-empty">{t.noProjects}</p>
        ) : (
          <div className="projects-body">
            <nav
              ref={listRef}
              className="projects-list"
              data-menu="column"
              data-menu-trap
              data-menu-back=".projects-chip[aria-pressed='true']"
              aria-label={t.projects}
            >
              {groups.map(([year, items]) => (
                <div key={year} className="projects-group">
                  {year > 0 && <h2 className="projects-group-label">{year}</h2>}
                  {items.map((project) => (
                    <MenuButton
                      key={project.id}
                      className="projects-row"
                      aria-current={project.id === selected?.id}
                      onFocus={() => !isCompact() && select(project.id)}
                      onClick={(event) => {
                        select(project.id)
                        if (isCompact()) setSheetOpen(true)
                        else if (fromKeyboard(event)) openUrl(project.demoUrl ?? project.repoUrl)
                      }}
                    >
                      <span className="projects-row-title">{project.title}</span>
                      {project.isFeatured && <span className="projects-row-star" title={t.featuredMark}>★</span>}
                      <span className="projects-row-marks" aria-hidden="true">
                        {project.association && <span style={{ background: project.association.color }} />}
                        {project.contributor && <span style={{ background: project.contributor.color }} />}
                      </span>
                    </MenuButton>
                  ))}
                </div>
              ))}
            </nav>

            <figure className="projects-preview">
              {selected?.imageUrl ? (
                <img
                  key={selected.imageUrl}
                  className={selected.imageIsPlaceholder ? 'projects-preview-card' : ''}
                  src={cloudinarySized(selected.imageUrl, 720)}
                  alt={t.screenshotOf(selected.title)}
                />
              ) : (
                <img src="/soul.png" alt="" className="projects-preview-soul pixelated" />
              )}
              {selected && <LanguageBar languages={selected.languages} label={t.languages} />}
            </figure>
          </div>
        )}

        <div className="projects-description" aria-live="polite">
          {selected ? <Description project={selected} /> : <p>{t.selectProject}</p>}
        </div>

        <div className="projects-hints">
          <button type="button" className="projects-hint" disabled={!selected?.demoUrl} onClick={() => openUrl(selected?.demoUrl ?? null)}>
            <span className="key">Z</span> {selected && !selected.demoUrl ? t.noDemo : t.openDemo}
          </button>
          <button type="button" className="projects-hint" disabled={!selected?.repoUrl} onClick={() => openUrl(selected?.repoUrl ?? null)}>
            <span className="key">C</span> {t.openCode}
          </button>
          <span className="projects-hint">
            <span className="key">X</span> {t.goBack}
          </span>
          <span className="projects-hint projects-hint-count">{t.projectsCount(visible.length)}</span>
        </div>
      </section>

      {sheetOpen && selected && <ProjectSheet project={selected} onClose={closeSheet} />}
    </div>
  )
}

// Caja de descripción con la voz del juego: "* TÍTULO — lenguajes" y "* descripción"
function Description({ project }: { project: Project }) {
  const lang = useLang()
  const t = useT()
  const mainLanguages = project.languages.slice(0, 3).map((l) => l.name).join(', ')

  return (
    <>
      <p className="projects-description-title">
        * {project.title.toUpperCase()}
        {mainLanguages && <span className="muted"> — {mainLanguages}</span>}
      </p>
      <p className={`justify ${project.description ? '' : 'muted'}`}>* {project.description ?? t.noDescription}</p>
      <p className="projects-description-meta">
        {project.contributor && <span style={{ color: project.contributor.color }}>{t.workedOn}</span>}
        {project.association && <span style={{ color: project.association.color }}>{t.madeFor(project.association.name)}</span>}
        {project.contributor && <span>{t.ownerLabel(project.contributor.owner)}</span>}
        {project.createdAt && <span>{t.created} {formatMonth(lang, project.createdAt)}</span>}
        {project.lastActivityAt && <span>{t.lastActivity} {formatMonth(lang, project.lastActivityAt)}</span>}
        {project.isArchived && <span>{t.archived}</span>}
      </p>
    </>
  )
}

// En el celular el detalle ocupa toda la pantalla; X, Esc, Shift o "Volver" lo cierran
function ProjectSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    const onBack = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    root?.addEventListener(BACK_EVENT, onBack)
    return () => {
      root?.removeEventListener(BACK_EVENT, onBack)
      document.body.style.overflow = ''
      previous?.focus({ preventScroll: true })
    }
  }, [onClose])

  return (
    <div ref={rootRef} className="projects-sheet" role="dialog" aria-modal="true" aria-label={project.title}>
      <Menu direction="row" label={project.title} className="projects-sheet-actions">
        <MenuButton ref={closeRef} onClick={onClose}>{t.back}</MenuButton>
        {project.demoUrl && <MenuAnchor href={project.demoUrl}>{t.viewDemo}</MenuAnchor>}
        {project.repoUrl && <MenuAnchor href={project.repoUrl}>{t.viewCode}</MenuAnchor>}
      </Menu>
      <figure className="projects-preview">
        {project.imageUrl && (
          <img
            className={project.imageIsPlaceholder ? 'projects-preview-card' : ''}
            src={cloudinarySized(project.imageUrl, 720)}
            alt={t.screenshotOf(project.title)}
          />
        )}
        <LanguageBar languages={project.languages} label={t.languages} />
      </figure>
      <div className="projects-description">
        <Description project={project} />
      </div>
    </div>
  )
}

// Pide a Cloudinary la imagen al tamaño justo y en el mejor formato para el navegador
function cloudinarySized(url: string, width: number) {
  return url.includes('res.cloudinary.com') ? url.replace('/upload/', `/upload/c_limit,w_${width},f_auto,q_auto/`) : url
}
