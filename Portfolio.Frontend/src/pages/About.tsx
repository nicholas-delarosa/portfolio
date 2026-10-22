import { formatMonth, useLang, useT } from '../i18n'
import { useSite, type SkillCategory } from '../api'
import DialogueBox from '../components/DialogueBox'
import { Menu, MenuAnchor } from '../components/Menu'
import { Loading, LoadError } from '../components/Status'
import './About.css'

// Cada categoría usa el color de un personaje del grupo
const categoryColors: Record<SkillCategory, string> = {
  Frontend: 'var(--kris)',
  Backend: 'var(--susie)',
  Database: 'var(--ralsei)',
  DevOps: 'var(--tp)',
  Tools: 'var(--white)'
}

const MAX_LEVEL = 5

// Pantalla de estado del personaje
export default function About() {
  const lang = useLang()
  const t = useT()
  const { data: site, error } = useSite(lang)

  if (error) return <LoadError />
  if (!site) return <Loading />

  const { profile } = site
  const categories = (Object.keys(categoryColors) as SkillCategory[]).filter((c) => site.skills.some((s) => s.category === c))
  const dialogue = [profile.dialog, profile.bio].filter(Boolean).join('\n\n')

  return (
    <div className="page about">
      <h1 className="page-title">{t.about}</h1>

      <section className="about-character box" aria-label={profile.displayName}>
        <div className="about-portrait">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.displayName} />
          ) : (
            <img src="/soul.png" alt="" className="pixelated about-portrait-soul" />
          )}
        </div>
        <div className="about-stats">
          <h2 className="about-name">{profile.displayName}</h2>
          <p className="about-level">
            {t.level} {profile.level} <span className="about-role">{profile.role}</span>
          </p>
          {profile.location && <p className="muted">{profile.location}</p>}
          {profile.availableForWork && profile.availability && (
            <p className="about-available">
              <span aria-hidden="true">★ </span>
              {profile.availability}
            </p>
          )}
          {profile.spokenLanguages.length > 0 && (
            <dl className="about-spoken" aria-label={t.spokenLanguages}>
              {profile.spokenLanguages.map((l) => (
                <div key={l.name}>
                  <dt>{l.name}</dt>
                  <dd>{l.level}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {dialogue && <DialogueBox text={dialogue} />}

      <div className="about-grid">
        {site.skills.length > 0 && (
          <section className="box" aria-labelledby="skills-title">
            <h2 id="skills-title" className="box-title">{t.skills}</h2>
            <div className="about-skill-groups">
              {categories.map((category) => (
                <div key={category} style={{ '--skill-color': categoryColors[category] } as React.CSSProperties}>
                  <h3 className="about-skill-category">{t.categories[category]}</h3>
                  <ul className="about-skills">
                    {site.skills
                      .filter((s) => s.category === category)
                      .map((skill) => (
                        <li key={skill.name} className="about-skill">
                          <span>{skill.name}</span>
                          {skill.level > 0 && (
                            <span
                              className="about-skill-bar"
                              role="meter"
                              aria-label={skill.name}
                              aria-valuemin={0}
                              aria-valuemax={MAX_LEVEL}
                              aria-valuenow={skill.level}
                            >
                              {Array.from({ length: MAX_LEVEL }, (_, i) => (
                                <span key={i} className={i < skill.level ? 'filled' : ''} />
                              ))}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {site.gitHubLanguages.length > 0 && (
          <section className="box" aria-labelledby="github-languages-title">
            <h2 id="github-languages-title" className="box-title">{t.githubLanguages}</h2>
            <p className="muted about-hint">{t.githubLanguagesHint}</p>
            <ul className="about-languages">
              {site.gitHubLanguages.map((l) => (
                <li key={l.name}>
                  <span className="about-language-name">
                    {l.name} <span className="muted">{t.repos(l.repos)}</span>
                  </span>
                  <span className="about-language-track">
                    <span style={{ width: `${Math.max(l.percent, 1)}%`, background: l.color ?? 'var(--white)' }} />
                  </span>
                  <span className="about-language-percent">{l.percent}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {site.timeline.length > 0 && (
        <section className="box about-timeline-box" aria-labelledby="timeline-title">
          <h2 id="timeline-title" className="box-title">{t.savePoints}</h2>
          <ol className="about-timeline">
            {site.timeline.map((entry) => (
              <li key={`${entry.title}-${entry.startDate}`} className="about-save">
                <span className="about-save-star" aria-hidden="true">★</span>
                <div>
                  <p className="about-save-date muted">
                    {formatMonth(lang, entry.startDate)}
                    {/* Un logro pasa en un momento; la formación y el trabajo duran un periodo */}
                    {entry.kind !== 'Milestone' && ` – ${entry.endDate ? formatMonth(lang, entry.endDate) : t.present}`}
                    <span className="sr-only">, {t.kinds[entry.kind]}</span>
                  </p>
                  <h3 className="about-save-title">
                    {entry.url ? (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.title}</a>
                    ) : (
                      entry.title
                    )}
                    {entry.organization && <span className="about-save-org"> — {entry.organization}</span>}
                  </h3>
                  {entry.description && <p className="about-save-text justify">{entry.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {profile.cvUrl && (
        <section className="box about-items" aria-labelledby="items-title">
          <h2 id="items-title" className="box-title">{t.items}</h2>
          <Menu direction="row" className="about-items-menu" label={t.items}>
            <MenuAnchor href={profile.cvUrl} download>
              {t.cvItem}
            </MenuAnchor>
            {profile.cvOtherLanguageUrl && profile.cvOtherLanguageUrl !== profile.cvUrl && (
              <MenuAnchor href={profile.cvOtherLanguageUrl} download>
                {t.cvOther}
              </MenuAnchor>
            )}
          </Menu>
          <p className="about-item-text">{t.cvDescription}</p>
        </section>
      )}
    </div>
  )
}
