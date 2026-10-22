import './LanguageBar.css'

// Barra apilada de lenguajes con los colores oficiales de GitHub
export default function LanguageBar({ languages, label }: {
  languages: { name: string; color: string | null; percent: number }[]
  label: string
}) {
  if (languages.length === 0) return null

  return (
    <figure className="language-bar">
      <div className="language-bar-track" role="img" aria-label={`${label}: ${languages.map((l) => `${l.name} ${l.percent}%`).join(', ')}`}>
        {languages.map((l) => (
          <span key={l.name} style={{ flexGrow: l.percent, background: l.color ?? 'var(--gray)' }} />
        ))}
      </div>
      <figcaption>
        <ul className="language-bar-legend">
          {languages.map((l) => (
            <li key={l.name}>
              <span className="language-bar-dot" style={{ background: l.color ?? 'var(--gray)' }} />
              {l.name} <span className="muted">{l.percent}%</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
