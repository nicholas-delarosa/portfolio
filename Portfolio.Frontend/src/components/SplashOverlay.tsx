import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { isSoundEnabled } from '../sound'
import { BACK_EVENT } from '../useGameKeys'
import { useGatePassed } from '../gate'
import { pauseMusic, resumeMusic } from '../music'
import './SplashOverlay.css'

// Video de entrada de cada sección. Sale cada vez que se entra y se puede saltar
const videos = {
  queen: 'https://res.cloudinary.com/dw2auacau/video/upload/v1758726511/Queen_Splash.mp4',
  tenna: 'https://res.cloudinary.com/dw2auacau/video/upload/v1758726492/Tenna_Splash.mp4',
  legend: 'https://res.cloudinary.com/dw2auacau/video/upload/v1758726527/Legend_Splash.mp4'
}

export type SplashVideo = keyof typeof videos

export default function SplashOverlay({ video }: { video: SplashVideo }) {
  const t = useT()
  const gatePassed = useGatePassed()
  const [visible, setVisible] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const rootRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const fallbackRef = useRef<number | undefined>(undefined)

  const close = () => setVisible(false)
  // Se espera a la advertencia de entrada: antes de ese clic el navegador no dejaría sonar el video
  const showing = visible && gatePassed

  useEffect(() => {
    if (!showing) return
    const root = rootRef.current
    skipRef.current?.focus({ preventScroll: true })
    // La música se calla mientras suena el video y vuelve al terminar
    pauseMusic()

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
      resumeMusic()
    }
  }, [showing])

  if (!showing) return null

  return (
    <div ref={rootRef} className="splash" role="dialog" aria-modal="true" aria-label={t.loading} onClick={close}>
      <video
        className="splash-video"
        src={videos[video]}
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
