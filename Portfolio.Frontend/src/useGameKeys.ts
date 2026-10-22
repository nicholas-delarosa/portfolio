import { useEffect, useRef } from 'react'
import { play } from './sound'

type Direction = 'up' | 'down' | 'left' | 'right'

// Evento que recibe una ventana encima ([aria-modal]) cuando se presiona X/Esc/Shift
export const BACK_EVENT = 'gameback'

const arrows: Record<string, Direction> = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' }

const isVisible = (el: HTMLElement) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed'
const menuItems = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>('.menu-item:not(:disabled)')).filter(isVisible)

// Si hay una ventana encima (video, panel del celular), solo se navega dentro de ella
const activeRoot = (): ParentNode =>
  Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]')).filter(isVisible).at(-1) ?? document

const focusItem = (el: HTMLElement) => {
  el.focus({ preventScroll: true })
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

// Elige la opción más cercana en esa dirección según su posición en pantalla
function nearest(from: HTMLElement, direction: Direction, candidates: HTMLElement[]) {
  const a = from.getBoundingClientRect()
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  let best: HTMLElement | null = null
  let bestScore = Infinity

  for (const el of candidates) {
    if (el === from) continue
    const b = el.getBoundingClientRect()
    const bx = b.left + b.width / 2
    const by = b.top + b.height / 2
    let primary: number
    let offset: number
    switch (direction) {
      case 'down':
        if (b.top < a.bottom - 4) continue
        primary = b.top - a.bottom
        offset = Math.abs(bx - ax)
        break
      case 'up':
        if (b.bottom > a.top + 4) continue
        primary = a.top - b.bottom
        offset = Math.abs(bx - ax)
        break
      case 'right':
        if (b.left < a.right - 4) continue
        primary = b.left - a.right
        offset = Math.abs(by - ay)
        break
      case 'left':
        if (b.right > a.left + 4) continue
        primary = a.left - b.right
        offset = Math.abs(by - ay)
        break
    }
    // Moverse en línea recta pesa más que la distancia
    const score = primary + offset * 3
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}

/*
  Controles estilo Deltarune:
  - Flechas: mueven el alma a la opción más cercana en esa dirección (cabecera, menú, botones...).
  - Z o Enter: confirma. X, Esc o Shift (solo): vuelve al menú anterior.
*/
export function useGameKeys(onBack?: () => void) {
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    // Shift sirve para "volver" solo si se suelta sin haber presionado otra tecla (Shift+Tab sigue funcionando)
    let shiftAlone = false

    const goBack = (target: HTMLElement) => {
      // Una ventana encima (video, panel) decide primero qué significa "volver": normalmente cerrarse
      const modal = activeRoot()
      if (modal instanceof HTMLElement) {
        const event = new CustomEvent(BACK_EVENT, { cancelable: true })
        modal.dispatchEvent(event)
        if (event.defaultPrevented) {
          play('click')
          return true
        }
      }

      const backSelector = target.closest<HTMLElement>('[data-menu-back]')?.dataset.menuBack
      const parent = backSelector ? document.querySelector<HTMLElement>(backSelector) : null
      if (parent && isVisible(parent)) {
        play('click')
        focusItem(parent)
        return true
      }
      if (onBackRef.current) {
        play('click')
        onBackRef.current()
        return true
      }
      return false
    }

    const ignore = (event: KeyboardEvent) =>
      event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey ||
      !!(event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftAlone = !event.repeat
        return
      }
      shiftAlone = false
      if (ignore(event)) return

      const target = event.target as HTMLElement
      const key = event.key.toLowerCase()

      if (key === 'x' || key === 'escape') {
        if (goBack(target)) event.preventDefault()
        return
      }
      // Enter ya activa botones y links por sí solo; Z hace lo mismo
      if (key === 'z' && target.matches('a, button')) {
        event.preventDefault()
        target.click()
        return
      }

      const direction = arrows[key]
      if (!direction) return
      event.preventDefault()

      const root = activeRoot()
      const current = target.closest('.menu-item') ? target : null
      const menu = current?.closest<HTMLElement>('[data-menu]')

      // Dentro de un submenú las flechas no salen de él
      const trap = current?.closest<HTMLElement>('[data-menu-trap]')
      const candidates = trap
        ? menuItems(trap)
        : menuItems(root).filter((el) => !el.closest('[data-menu-trap]') || el === current)

      if (!current) {
        // Nada elegido todavía: la primera flecha pone el alma en la primera opción del contenido
        // Una página puede marcar con [data-menu-start] por dónde empezar (ej. los filtros de Proyectos)
        const main = root === document ? document.querySelector('main') : root
        const start = main?.querySelector('[data-menu-start]')
        const first =
          candidates.find((el) => start?.contains(el)) ?? candidates.find((el) => main?.contains(el)) ?? candidates[0]
        if (first) focusItem(first)
        return
      }

      const next = nearest(current, direction, candidates)
      if (next) {
        focusItem(next)
        return
      }

      // Al final de una lista se da la vuelta, como en el juego
      const axis = menu?.dataset.menu === 'row' ? ['left', 'right'] : ['up', 'down']
      if (menu && axis.includes(direction)) {
        const items = menuItems(menu)
        const wrapped = direction === 'down' || direction === 'right' ? items[0] : items.at(-1)
        if (wrapped && wrapped !== current) focusItem(wrapped)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' || !shiftAlone) return
      shiftAlone = false
      if (ignore(event)) return
      goBack(event.target as HTMLElement)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])
}
