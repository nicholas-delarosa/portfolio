import { useEffect } from 'react'
import { useGameKeys } from '../useGameKeys'
import { useLocation, useNavigate, useParams } from 'react-router'
import { isLang, LangContext, pathFor, rememberLang, sectionFromSlug, strings, type Lang, type Section } from '../i18n'
import { setSoundEnabled, useSoundEnabled } from '../sound'
import { Menu, MenuButton, MenuLink } from './Menu'
import Home from '../pages/Home'
import Projects from '../pages/Projects'
import About from '../pages/About'
import Contact from '../pages/Contact'
import NotFound from '../pages/NotFound'
import './Layout.css'

const pages: Record<Section, () => React.JSX.Element> = { home: Home, projects: Projects, about: About, contact: Contact }

export default function Layout() {
  const { lang, section: slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const soundOn = useSoundEnabled()

  const valid = isLang(lang)
  const currentLang: Lang = valid ? lang : 'es'
  const section = valid ? sectionFromSlug(currentLang, slug) : null
  const t = strings[currentLang]

  useEffect(() => {
    if (!valid) return
    document.documentElement.lang = currentLang
    rememberLang(currentLang)
  }, [valid, currentLang])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useGameKeys(() => navigate(section === 'home' ? '/' : pathFor(currentLang, 'home')))

  if (!valid || !section) return <NotFound />

  const otherLang: Lang = currentLang === 'es' ? 'en' : 'es'
  const Page = pages[section]

  return (
    <LangContext.Provider value={currentLang}>
      <div className="layout">
        <header className="layout-header">
          <MenuLink to={pathFor(currentLang, 'home')} className="layout-logo" aria-label={t.backToMenu}>
            Nicholas De la Rosa
          </MenuLink>
          <Menu direction="row" className="layout-options" label={t.sound}>
            <MenuLink to={`${pathFor(otherLang, section)}${location.search}`} lang={otherLang}>
              {t.changeLanguage}
            </MenuLink>
            <MenuButton onClick={() => setSoundEnabled(!soundOn)} aria-pressed={soundOn}>
              {t.sound}: {soundOn ? t.on : t.off}
            </MenuButton>
          </Menu>
        </header>

        <main className="layout-main">
          <Page />
        </main>

        <footer className="layout-footer">
          <p className="layout-controls" aria-hidden="true">
            <span><span className="key">Z</span> <span className="key">Enter</span> {t.confirm}</span>
            <span><span className="key">X</span> <span className="key">Shift</span> {t.goBack}</span>
            <span><span className="key">↑↓←→</span> {t.move}</span>
          </p>
          <p>{t.credits}</p>
          <p>© {new Date().getFullYear()} Nicholas De la Rosa</p>
        </footer>
      </div>
    </LangContext.Provider>
  )
}
