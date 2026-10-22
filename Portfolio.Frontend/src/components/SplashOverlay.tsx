import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { isSoundEnabled } from '../sound'
import { BACK_EVENT } from '../useGameKeys'
import './SplashOverlay.css'

const videos = [
  'https://res.cloudinary.com/dw2auacau/video/upload/v1758726511/Queen_Splash.mp4',
  'https://res.cloudinary.com/dw2auacau/video/upload/v1758726492/Tenna_Splash.mp4',
  'https://res.cloudinary.com/dw2auacau/video/upload/v1758726527/Legend_Splash.mp4'
]

const SEEN_KEY = 'portfolio.splashSeen'

const alreadySeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

// Video de entrada a Proyectos: uno al azar, una vez por visita, y se puede saltar
export default function SplashOverlay() {
  const t = useT()
  const [visible, setVisible] = useState(
    () => !alreadySeen() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [src] = useState(() => videos[Math.floor(Math.random() * videos.length)])
  const rootRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const fallbackRef = useRef<number | undefined>(undefined)

  const close = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Sin almacenamiento: puede volver a salir, no es grave
    }
  }

  useEffect(() => {
    if (!visible) return
    const root = rootRef.current
    skipRef.current?.focus({ preventScroll: true })

    // X/Esc/Shift (vía useGameKeys) saltan el video en vez de salir de la página
    const onBack = (event: Event) => {
      event.preventDefault()
      close()
    }
    // Z/Enter/Espacio también lo saltan; en captura para que no lleguen al menú de detrás
    const onKey = (event: KeyboardEvent) => {
      if (['z', 'enter', ' '].includes(event.key.toLowerCase())) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }
    root?.addEventListener(BACK_EVENT, onBack)
    window.addEventListener('keydown', onKey, true)
    // Si el video no arranca en 8 s, no dejar la pantalla en negro
    fallbackRef.current = window.setTimeout(close, 8000)
    return () => {
      root?.removeEventListener(BACK_EVENT, onBack)
      window.removeEventListener('keydown', onKey, true)
      window.clearTimeout(fallbackRef.current)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div ref={rootRef} className="splash" role="dialog" aria-modal="true" aria-label={t.loading} onClick={close}>
      <video
        className="splash-video"
        src={src}
        autoPlay
        playsInline
        muted={!isSoundEnabled()}
        onEnded={close}
        onError={close}
        // El video arrancó: ya no hace falta el plan B, dura lo que dure
        onPlaying={() => window.clearTimeout(fallbackRef.current)}
      />
      <button ref={skipRef} type="button" className="splash-skip menu-item" onClick={close}>
        {t.skip}
      </button>
    </div>
  )
}
