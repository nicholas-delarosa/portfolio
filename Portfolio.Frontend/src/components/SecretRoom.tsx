import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { MenuButton } from './Menu'
import { useGatePassed } from '../gate'
import { library, weightedPick, type MusicTrack } from '../musicLibrary'
import './SecretRoom.css'

// tree = árbol con su suelo, tree-alone = solo el árbol sobre negro, retro = árbol de la versión NES, black = nada
export type RoomScene = 'black' | 'tree' | 'tree-alone' | 'retro'
export interface RoomVisit {
  track: MusicTrack
  scene: RoomScene
}

// Escenas. Las medidas son a 1x (la resolución del juego); los archivos están agrandados 4x píxel por píxel,
// así el navegador los reduce al tamaño de la pantalla y los píxeles quedan nítidos y parejos a cualquier escala
const scenes = {
  tree: { background: '/room/tree-bg.png', animation: '/room/tree.webp', width: 556, height: 448, at: [194, 61], size: [212, 182], fill: '#000000' },
  'tree-alone': { background: null, animation: '/room/tree.webp', width: 556, height: 448, at: [194, 61], size: [212, 182], fill: '#000000' },
  retro: { background: '/room/retro-bg.png', animation: '/room/tree-retro.webp', width: 640, height: 480, at: [230, 137], size: [212, 183], fill: '#78a873' }
} as const
const ASSET_SCALE = 4

// Al entrar: la canción según su peso (man 60 %, man_nes 17 %, man_2 17 %, piano 6 %) y, según la canción, la escena
export function visitRoom(file?: string | null, scene?: string | null): RoomVisit {
  const track = library.room.find((t) => t.file === file) ?? weightedPick(library.room)
  const forced = (['tree', 'tree-alone', 'black', 'retro'] as const).find((s) => s === scene) ?? null
  return { track, scene: forced ?? sceneFor(track.file) }
}

function sceneFor(file: string): RoomScene {
  switch (file) {
    case 'man':
      return Math.random() < 0.5 ? 'tree' : 'tree-alone' // la mitad con su suelo, la otra mitad solo el árbol en la oscuridad
    case 'deltarune_piano_collections_by_trevor_alan_gomes':
      return 'tree'
    case 'man_nes':
      return 'retro'
    default:
      return 'black' // man_2
  }
}

// Lo más grande que cabe en la pantalla manteniendo la proporción del juego
function useScale(width: number, height: number) {
  const compute = () => Math.min(window.innerWidth / width, window.innerHeight / height)
  const [scale, setScale] = useState(compute)
  useEffect(() => {
    const onResize = () => setScale(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])
  return scale
}

// Habitación secreta: 1 de cada 50 entradas a una página termina aquí. Oscuridad, a veces un árbol, y un camino de vuelta
export default function SecretRoom({ scene, onLeave }: { scene: RoomScene; onLeave: () => void }) {
  const t = useT()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const gatePassed = useGatePassed()
  const art = scene === 'black' ? null : scenes[scene]
  const scale = useScale(art?.width ?? 1, art?.height ?? 1)

  // Al cerrar la advertencia de entrada el alma queda en el botón (Z/Enter ya funcionan)
  useEffect(() => {
    if (gatePassed) buttonRef.current?.focus({ preventScroll: true })
  }, [gatePassed])

  return (
    <main className={`secret-room secret-room-${scene}`} style={{ background: art?.fill }}>
      <h1 className="sr-only">{t.secretRoom}</h1>
      {art && (
        <div
          className="secret-room-stage"
          // Hasta 4x el navegador reduce los archivos (nítido); más allá agranda sin suavizar
          style={{ width: art.width * scale, height: art.height * scale, imageRendering: scale > ASSET_SCALE ? 'pixelated' : 'auto' }}
          aria-hidden="true"
        >
          {/* Tamaños con decimales en estilos (los atributos width/height solo admiten enteros) */}
          {art.background && <img src={art.background} alt="" style={{ width: art.width * scale, height: art.height * scale }} />}
          <img
            className="secret-room-animation"
            src={art.animation}
            alt=""
            style={{
              left: art.at[0] * scale,
              top: art.at[1] * scale,
              width: art.size[0] * scale,
              height: art.size[1] * scale
            }}
          />
        </div>
      )}
      <MenuButton ref={buttonRef} className="secret-room-exit" onClick={onLeave}>
        {t.backToMainMenu}
      </MenuButton>
    </main>
  )
}
