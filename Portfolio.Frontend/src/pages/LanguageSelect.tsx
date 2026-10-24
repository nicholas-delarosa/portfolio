import { useEffect, useRef } from 'react'
import { rememberLang, storedLang, type Lang } from '../i18n'
import { Menu, MenuLink } from '../components/Menu'
import { useGameKeys } from '../useGameKeys'
import { setPlaylist } from '../music'
import { useGatePassed } from '../gate'
import './LanguageSelect.css'

const options: { lang: Lang; label: string }[] = [
  { lang: 'es', label: 'Español' },
  { lang: 'en', label: 'English' }
]

// Primera pantalla, como el selector de idioma del juego
export default function LanguageSelect() {
  const preferred = storedLang() ?? (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en')
  const preferredRef = useRef<HTMLAnchorElement>(null)
  useGameKeys() // Es la primera pantalla: no hay a dónde volver
  const gatePassed = useGatePassed()

  useEffect(() => {
    setPlaylist('menu')
    document.documentElement.lang = preferred
    // Tras la advertencia de entrada, el alma empieza en el idioma preferido
    if (gatePassed) preferredRef.current?.focus({ preventScroll: true })
  }, [preferred, gatePassed])

  return (
    <main className="lang-select">
      <h1 className="sr-only">Nicholas De la Rosa</h1>
      <Menu direction="row" className="lang-select-options" label="Idioma / Language">
        {options.map(({ lang, label }) => (
          <MenuLink
            key={lang}
            ref={lang === preferred ? preferredRef : undefined}
            to={`/${lang}`}
            lang={lang}
            className="lang-select-option"
            onClick={() => rememberLang(lang)}
          >
            {label}
          </MenuLink>
        ))}
      </Menu>
      <p className="lang-select-hint" aria-hidden="true"><span className="key">←→</span> <span className="key">Z</span> <span className="key">Enter</span></p>
    </main>
  )
}
