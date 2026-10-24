import { useEffect, useMemo } from 'react'
import { useGameKeys } from '../useGameKeys'
import { useLocation, useNavigate, useParams } from 'react-router'
import { isLang, LangContext, pathFor, rememberLang, sectionFromSlug, strings, type Lang, type Section } from '../i18n'
import { setSoundEnabled, useSoundEnabled } from '../sound'
import { setMusicEnabled, setPlaylist, useMusicEnabled, useNowPlaying } from '../music'
import type { Playlist } from '../musicLibrary'
import SecretRoom, { visitRoom } from './SecretRoom'
import SplashOverlay, { type SplashVideo } from './SplashOverlay'
import { Menu, MenuButton, MenuLink } from './Menu'
import Home from '../pages/Home'
import Projects from '../pages/Projects'
import About from '../pages/About'
import Contact from '../pages/Contact'
import NotFound from '../pages/NotFound'
import './Layout.css'

const pages: Record<Section, () => React.JSX.Element> = { home: Home, projects: Projects, about: About, contact: Contact }

// Lista de música de cada sección: el inicio es el "menú"; el resto, canciones del juego
const playlists: Record<Section, Playlist> = { home: 'menu', projects: 'game', about: 'game', contact: 'game' }

// Video de entrada de cada sección (sale cada vez que se entra)
const splashes: Partial<Record<Section, SplashVideo>> = { projects: 'queen', about: 'tenna', contact: 'legend' }

// Probabilidad de caer en la habitación secreta al entrar a una página
const ROOM_CHANCE = 1 / 50

export default function Layout() {
  const { lang, section: slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const soundOn = useSoundEnabled()
  const musicOn = useMusicEnabled()
  const nowPlaying = useNowPlaying()

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

  // Se tira el dado al cambiar de página (no al elegir un proyecto, que solo cambia ?p=).
  // Al salir de la habitación se vuelve con fromRoom para no caer de nuevo enseguida
  const fromRoom = (location.state as { fromRoom?: boolean } | null)?.fromRoom === true
  // null = página normal; si no, qué canción suena en la habitación y qué escena se ve
  const room = useMemo(
    () => {
      if (fromRoom) return null
      // Solo en desarrollo: ?room fuerza la habitación (?room=man_nes una canción, &scene=tree|black la escena)
      const params = new URLSearchParams(location.search)
      if (import.meta.env.DEV && params.has('room')) return visitRoom(params.get('room'), params.get('scene'))
      return Math.random() < ROOM_CHANCE ? visitRoom() : null
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname, location.state]
  )
  const inRoom = room !== null
  const leaveRoom = () => navigate(pathFor(currentLang, 'home'), { state: { fromRoom: true } })

  useEffect(() => {
    if (!section) return
    if (room) setPlaylist('room', room.track.file)
    else setPlaylist(playlists[section])
  }, [section, room])

  useGameKeys(() => (inRoom ? leaveRoom() : navigate(section === 'home' ? '/' : pathFor(currentLang, 'home'))))

  if (!valid || !section) return <NotFound />

  if (room) {
    return (
      <LangContext.Provider value={currentLang}>
        <SecretRoom scene={room.scene} onLeave={leaveRoom} />
      </LangContext.Provider>
    )
  }

  const otherLang: Lang = currentLang === 'es' ? 'en' : 'es'
  const Page = pages[section]
  const splash = splashes[section]

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
            <MenuButton onClick={() => setMusicEnabled(!musicOn)} aria-pressed={musicOn}>
              {t.music}: {musicOn ? t.on : t.off}
            </MenuButton>
            {nowPlaying && (
              <span className="layout-now" aria-live="polite">
                ♪ {nowPlaying}
              </span>
            )}
          </Menu>
        </header>

        <main className="layout-main">
          {/* key: al cambiar de sección el video vuelve a empezar. Se monta antes que la página para
              que pause la música antes de que arranque la de la sección */}
          {splash && <SplashOverlay key={section} video={splash} />}
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
