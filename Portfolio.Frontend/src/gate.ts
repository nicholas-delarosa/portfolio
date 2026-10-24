import { useSyncExternalStore } from 'react'

// Pantalla de advertencia al entrar: el navegador no deja sonar nada hasta el primer clic o tecla,
// así que se pide uno antes de empezar (y de paso se avisa que el sitio tiene sonido)
let passed = false
const listeners = new Set<() => void>()

export const isGatePassed = () => passed

export function passGate() {
  if (passed) return
  passed = true
  listeners.forEach((listener) => listener())
}

export function onGatePassed(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useGatePassed = () => useSyncExternalStore(onGatePassed, isGatePassed, () => false)
