'use client'

// Avisos con Sileo. Esta capa fija lo que se repite en toda la app: cuánto vive
// un Deshacer, que no se ejecute dos veces y el atajo de teclado.
import { sileo } from 'sileo'

export const DURACION_DESHACER = 10_000

let ultimo: { id: string; fn: () => void; vence: number } | null = null

export function avisar({ titulo, descripcion, deshacer }: { titulo: string; descripcion?: string; deshacer?: () => void }) {
  if (!deshacer) return sileo.success({ title: titulo, description: descripcion })
  let usado = false
  const fn = () => {
    if (usado) return // botón + atajo, o dos clics: una sola vez
    usado = true
    if (ultimo?.fn === fn) ultimo = null
    deshacer()
  }
  const id = sileo.success({
    title: titulo,
    description: descripcion,
    duration: DURACION_DESHACER,
    // Sileo colapsa a los 4000 ms FIJOS (6000 − 2000), sin mirar `duration`: el
    // botón desaparecía a mitad de la vida del aviso. El colapso va con la duración.
    autopilot: { expand: 150, collapse: DURACION_DESHACER },
    button: { title: 'Deshacer', onClick: fn },
  })
  ultimo = { id, fn, vence: Date.now() + DURACION_DESHACER }
  return id
}

/** Deshace la última acción mientras su aviso siga vivo. Para el atajo ⌘Z / Ctrl+Z. */
export function deshacerUltimo(): boolean {
  if (!ultimo || Date.now() > ultimo.vence) return false
  const u = ultimo
  u.fn()
  sileo.dismiss(u.id)
  return true
}

// ── Avisos en vivo: lo que llega sin que la persona haga nada (un pago recibido,
// una cita nueva). Son los ÚNICOS que suenan: en sus propias acciones ya ve el
// aviso, y un sonido ahí es ruido.
const SONIDO_URL = '/sonidos/sileo-gota.mp3' // copia referencia/sileo-gota.mp3 a public/sonidos/
const VOLUMEN = 0.4
const CLAVE_SONIDO = 'avisos:sonido'
const DURACION_EN_VIVO = 8_000
const suscriptores = new Set<() => void>()
let audio: HTMLAudioElement | null = null

/** Preferencia por persona (localStorage). Si el almacenamiento falla, suena. */
export function sonidoActivo(): boolean {
  try { return localStorage.getItem(CLAVE_SONIDO) !== 'no' } catch { return true }
}
export function setSonidoActivo(activo: boolean) {
  try { localStorage.setItem(CLAVE_SONIDO, activo ? 'si' : 'no') } catch { /* sin almacenamiento: dura esta sesión */ }
  suscriptores.forEach((fn) => fn())
}
export function suscribirSonido(fn: () => void) {
  suscriptores.add(fn)
  return () => { suscriptores.delete(fn) }
}

function sonar() {
  if (!sonidoActivo()) return
  audio ??= Object.assign(new Audio(SONIDO_URL), { volume: VOLUMEN, preload: 'auto' })
  audio.currentTime = 0
  // Sin una interacción previa con la página el navegador bloquea el audio:
  // el aviso visual basta, no es un error.
  audio.play().catch(() => {})
}

export function avisarEnVivo({ titulo, descripcion, ver }: { titulo: string; descripcion?: string; ver?: { label: string; fn: () => void } }) {
  sonar()
  return sileo.info({
    title: titulo,
    description: descripcion,
    duration: DURACION_EN_VIVO,
    autopilot: ver ? { expand: 150, collapse: DURACION_EN_VIVO } : undefined, // mismo motivo que el Deshacer
    button: ver ? { title: ver.label, onClick: ver.fn } : undefined,
  })
}
