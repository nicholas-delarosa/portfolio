import { useSyncExternalStore } from 'react'
import { isGatePassed, onGatePassed } from './gate'
import { library, weightedPick, type MusicTrack, type Playlist } from './musicLibrary'

// Música de fondo aleatoria. Cada página pide una lista (menú, juego o la sala secreta) y se van
// encadenando canciones al azar. Se puede apagar desde la cabecera.
const STORAGE_KEY = 'portfolio.music'
const VOLUME = 0.5
const FADE_MS = 700
const RECENT_LIMIT = 4 // no repetir las últimas canciones
const listeners = new Set<() => void>()

let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
})()

let wanted: Playlist | null = null
let pauses = 0 // cuántos videos de entrada piden silencio ahora mismo
const isPaused = () => pauses > 0
let current: { playlist: Playlist; track: MusicTrack; audio: HTMLAudioElement } | null = null
const recent: string[] = []

export const isMusicEnabled = () => enabled

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useMusicEnabled = () => useSyncExternalStore(subscribe, isMusicEnabled, () => false)

// Título de lo que está sonando (para mostrarlo en pantalla)
export const nowPlaying = () => (current && enabled && !isPaused() ? current.track.title : null)
export const useNowPlaying = () => useSyncExternalStore(subscribe, nowPlaying, () => null)

const notify = () => listeners.forEach((listener) => listener())

export function setMusicEnabled(value: boolean) {
  enabled = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    // Sin almacenamiento: el ajuste dura solo esta visita
  }
  sync()
}

// La página dice qué lista le corresponde (null = silencio, ej. el admin)
export function setPlaylist(playlist: Playlist | null) {
  wanted = playlist
  sync()
}

export function pauseMusic() {
  pauses++
  sync()
}

// Se reanuda un instante después: si el video se vuelve a montar enseguida (React en desarrollo monta
// dos veces), la pausa se mantiene y la música no alcanza a sonar
export function resumeMusic() {
  pauses = Math.max(pauses - 1, 0)
  setTimeout(sync, 50)
}

// Siguiente canción: la pareja si la tiene (Field -> Garden), en la sala secreta según su peso,
// y si no, una al azar que no haya sonado hace poco
export function pickNext(playlist: Playlist, after?: MusicTrack, rand = Math.random): MusicTrack {
  const tracks = library[playlist]
  const partner = after?.next && tracks.find((t) => t.file === after.next)
  if (partner) return partner
  if (playlist === 'room') return weightedPick(tracks, rand)

  const fresh = tracks.filter((t) => !recent.includes(t.file) && t.file !== after?.file)
  const pool = fresh.length > 0 ? fresh : tracks
  return pool[Math.floor(rand() * pool.length)]
}

function fade(audio: HTMLAudioElement, to: number, done?: () => void) {
  const from = audio.volume
  const start = performance.now()
  const step = (now: number) => {
    // El reloj de requestAnimationFrame puede ir unos ms detrás de performance.now(): se limita a [0, 1]
    const t = Math.min(Math.max((now - start) / FADE_MS, 0), 1)
    audio.volume = Math.min(Math.max(from + (to - from) * t, 0), 1)
    if (t < 1) requestAnimationFrame(step)
    else done?.()
  }
  requestAnimationFrame(step)
}

function stop() {
  if (!current) return
  const { audio } = current
  current = null
  fade(audio, 0, () => audio.pause())
}

function sync() {
  if (typeof window === 'undefined') return
  const target = enabled && isGatePassed() ? wanted : null

  if (!target) {
    stop()
  } else if (current?.playlist === target) {
    // Misma lista (ej. de Proyectos a Contacto): la canción sigue, solo se pausa o reanuda
    if (isPaused()) fade(current.audio, 0, () => current?.audio.pause())
    else if (current.audio.paused || current.audio.volume < VOLUME) start(current.audio)
  } else {
    stop()
    if (!isPaused()) play(target, pickNext(target))
  }
  notify()
}

function play(playlist: Playlist, track: MusicTrack) {
  const audio = new Audio(track.url)
  audio.volume = 0
  // La sala secreta repite su canción; en las demás listas, al terminar suena otra
  audio.loop = playlist === 'room'
  audio.addEventListener('ended', () => {
    if (current?.audio === audio) play(playlist, pickNext(playlist, track))
  })
  // Si una canción no carga, pasar a otra en vez de quedarse en silencio
  audio.addEventListener('error', () => {
    if (current?.audio === audio) play(playlist, pickNext(playlist, track))
  })

  recent.push(track.file)
  if (recent.length > RECENT_LIMIT) recent.shift()
  current = { playlist, track, audio }
  start(audio)
  notify()
}

function start(audio: HTMLAudioElement) {
  audio.play().then(
    () => fade(audio, VOLUME),
    // Si el navegador aún no deja sonar, se reintenta con la siguiente interacción
    () => {
      const retry = () => current?.audio === audio && !isPaused() && start(audio)
      window.addEventListener('pointerdown', retry, { once: true })
      window.addEventListener('keydown', retry, { once: true })
    }
  )
}

onGatePassed(sync)
