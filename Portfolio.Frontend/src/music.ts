import { useSyncExternalStore } from 'react'
import { isGatePassed, onGatePassed } from './gate'
import { library, weightedPick, type MusicTrack, type Playlist } from './musicLibrary'

// Música de fondo aleatoria. Cada página pide una lista (menú, juego o la habitación secreta) y se van
// encadenando canciones al azar. Se puede apagar desde la cabecera.
const STORAGE_KEY = 'portfolio.music'
const VOLUME = 0.5
const FADE_S = 0.7
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
let current: { playlist: Playlist; track: MusicTrack; player: Player } | null = null
const recent: string[] = []

// Última canción que empezó (para el cartel "♪~Título"). Solo cambia al empezar otra, no al pausar
export type SongStart = { id: number; title: string; playlist: Playlist }
let lastSong: SongStart | null = null

const isPaused = () => pauses > 0
const notify = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const isMusicEnabled = () => enabled
export const useMusicEnabled = () => useSyncExternalStore(subscribe, isMusicEnabled, () => false)

// Título de lo que está sonando ahora (null si está en silencio)
export const nowPlaying = () => (current && enabled && !isPaused() ? current.track.title : null)
export const useNowPlaying = () => useSyncExternalStore(subscribe, nowPlaying, () => null)
export const useSongStart = () => useSyncExternalStore(subscribe, () => lastSong, () => null)

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

// Siguiente canción: la pareja si la tiene (Field -> Garden), en la habitación secreta según su peso,
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

function sync() {
  if (typeof window === 'undefined') return
  const target = enabled && isGatePassed() ? wanted : null

  if (!target) {
    stopCurrent()
  } else if (current?.playlist === target) {
    // Misma lista (ej. de Proyectos a Contacto): la canción sigue, solo se pausa o reanuda
    if (isPaused()) current.player.pause()
    else current.player.resume()
  } else {
    stopCurrent()
    if (!isPaused()) play(target, forcedTrack(target) ?? pickNext(target))
  }
  notify()
}

// Solo en desarrollo: ?song=archivo fuerza la primera canción (para escuchar una en particular)
function forcedTrack(playlist: Playlist) {
  if (!import.meta.env.DEV) return undefined
  const file = new URLSearchParams(window.location.search).get('song')
  return library[playlist].find((t) => t.file === file)
}

function stopCurrent() {
  current?.player.stop()
  current = null
}

function play(playlist: Playlist, track: MusicTrack) {
  const next = () => {
    if (current?.track === track) play(playlist, pickNext(playlist, track))
  }
  // La habitación secreta repite su canción; en las demás listas, al terminar suena otra.
  // Si una canción no carga, se pasa a otra en vez de quedarse en silencio
  const player = track.intro
    ? new IntroPlayer(track.intro, track.url, next)
    : new ElementPlayer(track.url, playlist === 'room', next)

  current?.player.stop()
  recent.push(track.file)
  if (recent.length > RECENT_LIMIT) recent.shift()
  current = { playlist, track, player }
  lastSong = { id: (lastSong?.id ?? 0) + 1, title: track.title, playlist }
  player.start()
  notify()
}

// Si el navegador aún no deja sonar, se reintenta con la siguiente interacción
function onNextInteraction(action: () => void) {
  window.addEventListener('pointerdown', action, { once: true })
  window.addEventListener('keydown', action, { once: true })
}

interface Player {
  start(): void
  pause(): void
  resume(): void
  stop(): void
}

// Canción normal: un <audio> que se descarga a medida que suena
class ElementPlayer implements Player {
  private audio: HTMLAudioElement
  private stopped = false

  constructor(url: string, loop: boolean, private onDone: () => void) {
    this.audio = new Audio(url)
    this.audio.loop = loop
    this.audio.volume = 0
    this.audio.addEventListener('ended', onDone)
    this.audio.addEventListener('error', onDone)
  }

  start() {
    this.audio.play().then(
      () => this.fade(VOLUME),
      () => onNextInteraction(() => !this.stopped && !isPaused() && this.start())
    )
  }

  pause() {
    this.fade(0, () => this.audio.pause())
  }

  resume() {
    if (this.audio.paused || this.audio.volume < VOLUME) this.start()
  }

  stop() {
    this.stopped = true
    this.audio.removeEventListener('ended', this.onDone)
    this.audio.removeEventListener('error', this.onDone)
    this.fade(0, () => this.audio.pause())
  }

  private fade(to: number, done?: () => void) {
    const audio = this.audio
    const from = audio.volume
    const begin = performance.now()
    const step = (now: number) => {
      // El reloj de requestAnimationFrame puede ir unos ms detrás de performance.now(): se limita a [0, 1]
      const t = Math.min(Math.max((now - begin) / (FADE_S * 1000), 0), 1)
      audio.volume = Math.min(Math.max(from + (to - from) * t, 0), 1)
      if (t < 1) requestAnimationFrame(step)
      else done?.()
    }
    requestAnimationFrame(step)
  }
}

// Intro + parte principal sin corte (ej. Garden of Hopes and Dreams): la parte principal, ya decodificada,
// arranca en la muestra exacta en que termina la intro. Al terminar, pasa a la siguiente canción como las demás.
// Usa Web Audio porque <audio> deja un hueco audible entre dos archivos
class IntroPlayer implements Player {
  private context = new AudioContext()
  private gain = this.context.createGain()
  private stopped = false

  constructor(private introUrl: string, private mainUrl: string, private onDone: () => void) {
    this.gain.gain.value = 0
    this.gain.connect(this.context.destination)
  }

  start() {
    const decode = (url: string) =>
      fetch(url).then((r) => r.arrayBuffer()).then((data) => this.context.decodeAudioData(data))
    const intro = decode(this.introUrl)
    const main = decode(this.mainUrl) // se carga mientras suena la intro

    intro
      .then((introBuffer) => {
        if (this.stopped) return
        const introSource = this.context.createBufferSource()
        introSource.buffer = introBuffer
        introSource.connect(this.gain)
        const startAt = this.context.currentTime + 0.05
        introSource.start(startAt)
        this.fadeTo(VOLUME)
        return main.then((mainBuffer) => {
          if (this.stopped) return
          const mainSource = this.context.createBufferSource()
          mainSource.buffer = mainBuffer
          mainSource.connect(this.gain)
          mainSource.onended = () => !this.stopped && this.onDone()
          // Justo al terminar la intro (o ya mismo si la parte principal tardó más en cargar)
          mainSource.start(Math.max(startAt + introBuffer.duration, this.context.currentTime))
        })
      })
      // Si no se pudo cargar, se pasa a otra canción en vez de quedarse en silencio
      .catch(() => !this.stopped && this.onDone())

    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => onNextInteraction(() => !this.stopped && this.context.resume()))
    }
  }

  pause() {
    this.fadeTo(0)
    setTimeout(() => !this.stopped && isPaused() && this.context.suspend(), FADE_S * 1000)
  }

  resume() {
    this.context.resume().then(() => this.fadeTo(VOLUME)).catch(() => {})
  }

  stop() {
    this.stopped = true
    this.fadeTo(0)
    setTimeout(() => this.context.close().catch(() => {}), FADE_S * 1000 + 50)
  }

  private fadeTo(value: number) {
    const now = this.context.currentTime
    this.gain.gain.cancelScheduledValues(now)
    this.gain.gain.setValueAtTime(this.gain.gain.value, now)
    this.gain.gain.linearRampToValueAtTime(value, now + FADE_S)
  }
}

onGatePassed(sync)
