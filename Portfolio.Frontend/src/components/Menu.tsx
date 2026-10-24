import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { Link, type LinkProps } from 'react-router'
import { play, type Effect } from '../sound'

// Opciones de menú con el alma y sonidos. Las flechas del teclado recorren los [data-menu]

const isTyping = () => !!document.activeElement?.closest('input, textarea, select, [contenteditable="true"]')

// El mouse mueve la misma alma que el teclado: así nunca hay dos almas en pantalla
const moveSoul = <E extends HTMLElement>(handler?: (event: MouseEvent<E>) => void) =>
  (event: MouseEvent<E>) => {
    if (!isTyping() && document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true })
    handler?.(event)
  }

// sound: el efecto al confirmar ('select' por defecto). null = la página decide qué suena (ej. copiar el correo)
const withSound = <E,>(handler: ((event: E) => void) | undefined, effect: Effect | null) =>
  (event: E) => {
    if (effect) play(effect)
    handler?.(event)
  }

type SoundProp = { sound?: Effect | null }

export function MenuLink({ className = '', onClick, onMouseEnter, onFocus, sound = 'select', ...props }: LinkProps & SoundProp & { ref?: Ref<HTMLAnchorElement> }) {
  return (
    <Link
      {...props}
      className={`menu-item ${className}`}
      onClick={withSound(onClick, sound)}
      onMouseEnter={moveSoul(onMouseEnter)}
      onFocus={withSound(onFocus, 'move')}
    />
  )
}

export function MenuAnchor({ className = '', onClick, onMouseEnter, onFocus, sound = 'select', ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & SoundProp & { ref?: Ref<HTMLAnchorElement> }) {
  const external = props.href?.startsWith('http')
  return (
    <a
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
      className={`menu-item ${className}`}
      onClick={withSound(onClick, sound)}
      onMouseEnter={moveSoul(onMouseEnter)}
      onFocus={withSound(onFocus, 'move')}
    />
  )
}

export function MenuButton({ className = '', onClick, onMouseEnter, onFocus, type = 'button', sound = 'select', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & SoundProp & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      {...props}
      type={type}
      className={`menu-item ${className}`}
      onClick={withSound(onClick, sound)}
      onMouseEnter={moveSoul(onMouseEnter)}
      onFocus={withSound(onFocus, 'move')}
    />
  )
}

/*
  Grupo de opciones.
  - direction: "column" se recorre con ↑↓ y "row" con ←→ (y da la vuelta al llegar al final).
  - trap: submenú. Sus opciones no se alcanzan con flechas desde fuera: se entra con Z/Enter.
    Estando dentro, las flechas no salen de él.
  - back: selector de la opción a la que vuelve el alma con X/Shift (el menú "padre").
*/
export function Menu({ children, direction = 'column', className = '', label, trap = false, back, start = false }: {
  children: ReactNode
  direction?: 'column' | 'row'
  className?: string
  label?: string
  trap?: boolean
  back?: string
  start?: boolean // la primera flecha de la página pone el alma aquí
}) {
  return (
    <nav
      data-menu={direction}
      data-menu-trap={trap || undefined}
      data-menu-back={back}
      data-menu-start={start || undefined}
      className={className}
      aria-label={label}
    >
      {children}
    </nav>
  )
}

// Para saber si un clic vino del teclado (Z/Enter) o del mouse
export const fromKeyboard = (event: MouseEvent) => event.detail === 0
