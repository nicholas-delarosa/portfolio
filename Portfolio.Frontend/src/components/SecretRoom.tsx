import { useEffect, useRef } from 'react'
import { useT } from '../i18n'
import { MenuButton } from './Menu'
import { useGatePassed } from '../gate'
import './SecretRoom.css'

// Habitación secreta: 1 de cada 50 entradas a una página termina aquí. Solo oscuridad y un camino de vuelta
export default function SecretRoom({ onLeave }: { onLeave: () => void }) {
  const t = useT()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const gatePassed = useGatePassed()

  // Al cerrar la advertencia de entrada el alma queda en el botón (Z/Enter ya funcionan)
  useEffect(() => {
    if (gatePassed) buttonRef.current?.focus({ preventScroll: true })
  }, [gatePassed])

  return (
    <main className="secret-room">
      <h1 className="sr-only">{t.secretRoom}</h1>
      <MenuButton ref={buttonRef} className="secret-room-exit" onClick={onLeave}>
        {t.backToMainMenu}
      </MenuButton>
    </main>
  )
}
