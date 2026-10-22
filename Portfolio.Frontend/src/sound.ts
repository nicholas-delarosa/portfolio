import { useSyncExternalStore } from 'react'

// Sonidos del menú (hover/click) y el "blip" de la caja de diálogo, con un interruptor global
const STORAGE_KEY = 'portfolio.sound'
const listeners = new Set<() => void>()

let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
})()

export const isSoundEnabled = () => enabled

export function setSoundEnabled(value: boolean) {
  enabled = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    // Sin almacenamiento: el ajuste dura solo esta visita
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useSoundEnabled = () => useSyncExternalStore(subscribe, isSoundEnabled, () => true)

type Effect = 'hover' | 'click'
const volumes: Record<Effect, number> = { hover: 0.35, click: 0.6 }
const samples: Partial<Record<Effect, HTMLAudioElement>> = {}
let lastHover = 0

export function play(effect: Effect) {
  if (!enabled) return
  // Evita la ametralladora de sonidos al pasar el mouse rápido por una lista
  if (effect === 'hover') {
    const now = performance.now()
    if (now - lastHover < 70) return
    lastHover = now
  }
  samples[effect] ??= new Audio(`/sounds/${effect}.mp3`)
  const audio = samples[effect]!.cloneNode() as HTMLAudioElement
  audio.volume = volumes[effect]
  // El navegador bloquea el audio hasta la primera interacción: se ignora en silencio
  audio.play().catch(() => {})
}

let context: AudioContext | null = null

// Sonido de "texto escribiéndose", generado al vuelo (onda cuadrada corta, como en el juego)
export function blip() {
  // Antes del primer clic o tecla el navegador no deja sonar nada: ni lo intentamos
  if (!enabled || !navigator.userActivation?.hasBeenActive) return
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') {
      context.resume().catch(() => {})
      return
    }
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = 'square'
    oscillator.frequency.value = 480 + Math.random() * 40
    gain.gain.setValueAtTime(0.035, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.05)
  } catch {
    // Navegadores sin Web Audio: sin sonido
  }
}

// Atajos para usar en los elementos de menú
export const soundProps = {
  onMouseEnter: () => play('hover'),
  onFocus: () => play('hover'),
  onClick: () => play('click')
}
