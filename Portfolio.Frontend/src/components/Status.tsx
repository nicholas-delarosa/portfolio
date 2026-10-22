import { useT } from '../i18n'

// Mensajes de carga y error con la voz del juego
export function Loading() {
  const t = useT()
  return (
    <p className="page status-message" role="status">
      {t.loading}
    </p>
  )
}

export function LoadError() {
  const t = useT()
  return (
    <p className="page status-message" role="alert">
      {t.loadError}
    </p>
  )
}
