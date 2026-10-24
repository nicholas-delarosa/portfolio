import { useEffect, useState } from 'react'
import { useSongStart, type SongStart } from '../music'
import './SongPopup.css'

const VISIBLE_MS = 4500

// Cartel "♪~Título" como el del juego al empezar cada canción, arriba a la derecha (en la habitación secreta no sale)
export default function SongPopup() {
  const song = useSongStart()
  const [shown, setShown] = useState<SongStart | null>(null)

  useEffect(() => {
    if (!song || song.playlist === 'room') return
    setShown(song)
    const timer = window.setTimeout(() => setShown(null), VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [song])

  if (!shown) return null

  return (
    <div key={shown.id} className="song-popup" role="status" aria-live="polite">
      <span className="sr-only">Sonando: {shown.title}</span>
      {/* La nota ♪ también viene en la fuente, igual que en el juego */}
      <span aria-hidden="true">♪~{shown.title}</span>
    </div>
  )
}
