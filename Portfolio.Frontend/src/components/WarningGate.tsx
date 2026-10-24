import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { storedLang } from '../i18n'
import { passGate, useGatePassed } from '../gate'
import './WarningGate.css'

const texts = {
  es: {
    title: '* ADVERTENCIA',
    lines: ['* Este sitio tiene música y efectos de sonido.', '* Puedes apagarlos arriba, en Sonido y Música.'],
    action: 'Haz clic en cualquier parte o presiona una tecla para continuar'
  },
  en: {
    title: '* WARNING',
    lines: ['* This site has music and sound effects.', '* You can turn them off at the top, in Sound and Music.'],
    action: 'Click anywhere or press any key to continue'
  }
}

// Aparece cada vez que se entra al sitio (no al navegar dentro de él). El clic "desbloquea" el audio del navegador
export default function WarningGate() {
  const passed = useGatePassed()
  const { pathname } = useLocation()
  const boxRef = useRef<HTMLDivElement>(null)
  const lang = pathname.startsWith('/en') ? 'en' : pathname.startsWith('/es') ? 'es'
    : storedLang() ?? (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en')
  const t = texts[lang]

  useEffect(() => {
    if (passed || pathname.startsWith('/admin')) return
    boxRef.current?.focus({ preventScroll: true })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // En captura: la tecla solo cierra la advertencia, no mueve nada del menú de detrás
    const onKey = (event: KeyboardEvent) => {
      if (['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return
      event.preventDefault()
      event.stopPropagation()
      passGate()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previousOverflow
    }
  }, [passed, pathname])

  // El admin no tiene música ni necesita advertencia
  if (passed || pathname.startsWith('/admin')) return null

  return (
    <div
      ref={boxRef}
      className="gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      tabIndex={-1}
      lang={lang}
      // Con el clic completo (no al presionar): así el "soltar" no cae sobre un link de detrás
      onClick={passGate}
    >
      <div className="gate-box">
        <h1 id="gate-title" className="gate-title">{t.title}</h1>
        {t.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="gate-action">{t.action}</p>
      </div>
    </div>
  )
}
