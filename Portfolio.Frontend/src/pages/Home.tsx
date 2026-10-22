import { pathFor, useLang, useT } from '../i18n'
import { useSite } from '../api'
import { Menu, MenuLink } from '../components/Menu'
import { LoadError } from '../components/Status'
import './Home.css'

// Menú principal con la forma de los archivos de guardado del juego
export default function Home() {
  const lang = useLang()
  const t = useT()
  const { data: site, error } = useSite(lang)

  if (error) return <LoadError />

  const profile = site?.profile
  const files = [
    { to: pathFor(lang, 'projects'), title: t.projects, meta: site ? t.projectsCount(site.stats.projects) : '', hint: t.projectsHint },
    { to: pathFor(lang, 'about'), title: t.about, meta: profile ? `${t.level} ${profile.level}` : '', hint: t.aboutHint },
    { to: pathFor(lang, 'contact'), title: t.contact, meta: '', hint: t.contactHint }
  ]

  return (
    <div className="page home">
      <section className="home-intro">
        <h1 className="home-name">{profile?.displayName ?? 'Nicholas De la Rosa'}</h1>
        {profile && (
          <p className="home-role">
            {profile.role}
            {profile.location && <span className="muted"> — {profile.location}</span>}
          </p>
        )}
        {profile?.availableForWork && profile.availability && (
          <p className="home-available">
            <span className="star" aria-hidden="true">★ </span>
            {profile.availability}
          </p>
        )}
      </section>

      <h2 className="home-prompt">{t.menuPrompt}</h2>

      <Menu className="home-files" label={t.menuPrompt}>
        {files.map((file) => (
          <MenuLink key={file.to} to={file.to} className="home-file soul-inside">
            <span className="home-file-top">
              <span className="home-file-title soul-slot">{file.title}</span>
              <span className="home-file-meta">{file.meta}</span>
            </span>
            <span className="home-file-hint">{file.hint}</span>
          </MenuLink>
        ))}
      </Menu>

      {site?.featured && (
        <section className="home-featured box" aria-labelledby="featured-title">
          <h2 id="featured-title" className="home-featured-label">
            <span className="star" aria-hidden="true">★ </span>
            {t.featured}
          </h2>
          <div className="home-featured-body">
            {site.featured.imageUrl && (
              <img className="home-featured-image" src={site.featured.imageUrl} alt="" loading="lazy" />
            )}
            <div>
              <h3 className="home-featured-title">{site.featured.title}</h3>
              {site.featured.description && <p className="home-featured-text">{site.featured.description}</p>}
              <Menu label={t.featured}>
                <MenuLink to={`${pathFor(lang, 'projects')}?p=${site.featured.id}`}>{t.seeProject}</MenuLink>
              </Menu>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
