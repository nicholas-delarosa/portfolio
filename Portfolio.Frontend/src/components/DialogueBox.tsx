import { useEffect, useState } from 'react'
import { blip } from '../sound'
import './DialogueBox.css'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Caja de diálogo del juego: el texto aparece letra por letra con su "blip". Clic para mostrarlo completo
export default function DialogueBox({ text, portrait, speed = 24 }: { text: string; portrait?: string | null; speed?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0))

  useEffect(() => {
    setShown(prefersReducedMotion() ? text.length : 0)
  }, [text])

  useEffect(() => {
    if (shown >= text.length) return
    const char = text[shown]
    // Pausas naturales después de la puntuación, como en el juego
    const delay = /[.,!?;:]/.test(char) ? speed * 6 : speed
    const timer = window.setTimeout(() => {
      if (shown % 2 === 0 && char.trim()) blip()
      setShown((n) => n + 1)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [shown, text, speed])

  const done = shown >= text.length

  return (
    <div className={`dialogue box ${portrait ? 'dialogue-with-portrait' : ''}`} onClick={() => setShown(text.length)}>
      {portrait && <img className="dialogue-portrait" src={portrait} alt="" />}
      <p className="dialogue-text">
        <span className="sr-only">{text}</span>
        <span aria-hidden="true">
          {text.slice(0, shown)}
          {/* Reserva el espacio del texto completo para que la caja no salte de tamaño */}
          <span className="dialogue-ghost">{text.slice(shown)}</span>
        </span>
      </p>
      {done && <span className="dialogue-next" aria-hidden="true" />}
    </div>
  )
}
