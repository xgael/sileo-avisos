'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Toaster } from 'sileo'
import { deshacerUltimo, setSonidoActivo, sonidoActivo, suscribirSonido } from '@/lib/avisos'

/**
 * <Toaster> de Sileo con lo que le falta de fábrica (medido por sileo.mjs):
 * - El CSS de capa, mayúsculas, movimiento y tonos vive en sileo.css (pégalo en tu CSS global).
 * - Sus SVG llevan <title> ("Sileo Notification", "Check") que el lector de
 *   pantalla lee antes del mensaje: se marcan aria-hidden.
 * - Su «Deshacer» es un <a> dentro del <button> del aviso: con teclado no es
 *   confiable. ⌘Z / Ctrl+Z deshace la última acción mientras su aviso viva.
 */
export function AvisosToaster() {
  useEffect(() => {
    const limpiar = () =>
      document.querySelectorAll('[data-sileo-viewport] svg:not([aria-hidden])').forEach((s) => s.setAttribute('aria-hidden', 'true'))
    const obs = new MutationObserver(limpiar)
    obs.observe(document.body, { childList: true, subtree: true })

    const tecla = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return // ahí ⌘Z es del campo
      if (deshacerUltimo()) e.preventDefault()
    }
    document.addEventListener('keydown', tecla)
    return () => {
      obs.disconnect()
      document.removeEventListener('keydown', tecla)
    }
  }, [])

  // Abajo a la izquierda: el drawer abre a la derecha y su pie lleva acciones.
  // `theme="system"` invierte la superficie respecto a la página (página clara →
  // aviso oscuro): eso da el contraste. Los tonos se ajustan en sileo.css.
  return <Toaster position="bottom-left" theme="system" />
}

/** Interruptor del sonido de los avisos en vivo. Ponlo en el menú de la cuenta o
 *  en ajustes; la preferencia se recuerda por persona. */
export function InterruptorSonido({ className }: { className?: string }) {
  const activo = useSyncExternalStore(suscribirSonido, sonidoActivo, () => true)
  return (
    <label className={className}>
      <input type="checkbox" checked={activo} onChange={(e) => setSonidoActivo(e.target.checked)} /> Sonido de avisos
    </label>
  )
}
