---
name: sileo-avisos
description: >-
  Integrar Sileo (la librería de toasts de React con morph y botón de acción)
  como capa de avisos de una app, sobre todo en tablas y paneles de
  administración: Deshacer optimista en vez de confirm(), sileo.promise para
  operaciones asíncronas y avisos en vivo. Trae los once ajustes que Sileo
  necesita de fábrica, medidos (z-index 50 que queda bajo drawers y modales,
  título en capitalize, movimiento reducido que no aplica, Deshacer que
  desaparece a los 4 s, botón inalcanzable con teclado, SVG que ensucian el
  lector de pantalla, tonos sin contraste en tema oscuro), un componente listo
  para copiar, un sonido de notificación propio y nueve sondas Playwright.
  Úsala con "agrega Sileo", "pon toasts", "sonido de notificación",
  "avisos con deshacer", "sileo.promise", "el toast sale detrás del drawer",
  "notificaciones en vivo".
---

# Avisos con Sileo

Sileo (`npm i sileo`, docs en sileo.aaryan.design/docs) es la capa de avisos
de la casa. Toda confirmación de una mutación, todo Deshacer y toda operación
asíncrona pasan por aquí. No lo uses como un clon de sonner: su fuerte es el
**botón de acción** y el **cambio de estado dentro del mismo aviso**
(`sileo.promise`).

De fábrica trae **once cosas que corregir**: seis lo dejan inservible o
inaccesible y cinco le dan contraste y legibilidad. Todas están medidas y
tienen su arreglo en `referencia/`. Integrarlo sin ellas deja avisos tapados
por el drawer, títulos con mayúsculas raras y animación para quien pidió que
no la haya.

Todo está **medido contra `sileo@0.1.5`** (tipos en
`node_modules/sileo/dist/index.d.ts`; su CSS vive dentro de `index.mjs`). Si la
versión cambia, corre `referencia/sileo.mjs` antes de fiarte de esta lista.

---

## 1. Integrar

1. `npm i sileo`
2. Copia `referencia/avisos.ts` (la capa que fija duración, guarda y atajo) y
   `referencia/AvisosToaster.tsx` (el `<Toaster>` con sus ajustes y el
   `<InterruptorSonido />`). Ajusta el import `@/lib/avisos` a tu alias, y
   copia `referencia/sileo-gota.mp3` a `public/sonidos/`.
3. Pega `referencia/sileo.css` en tu CSS global. **No** en un CSS Module: son
   selectores de atributo globales.
4. Monta `<AvisosToaster />` **una vez** en la raíz del cliente, y usa:

```tsx
import { avisar, avisarEnVivo } from '@/lib/avisos'
import { sileo } from 'sileo'

// Mutación reversible: aviso con Deshacer (10 s, ⌘Z, idempotente)
avisar({ titulo: '1 factura eliminada', deshacer: () => restaurar(previas) })

// Aviso simple
avisar({ titulo: `Folio ${folio} copiado` })

// Evento que no disparó la persona: suena (si no lo apagó) y lleva al registro
avisarEnVivo({ titulo: `Pago recibido: ${folio}`, descripcion: cliente, ver: { label: 'Ver factura', fn: () => abrir(id) } })

// Operación asíncrona: un solo aviso que cambia de estado
await sileo.promise(guardar(datos), {
  loading: { title: 'Guardando…' },
  success: { title: 'Cambios guardados' },
  error: (e) => ({ title: 'No se pudo guardar', description: e instanceof Error ? e.message : String(e) }),
}).catch(() => {}) // el aviso ya contó el error
```

5. Corre `referencia/sileo.mjs` adaptando el bloque `APP` de arriba (cómo se
   dispara cada tipo de aviso en tu app). Las nueve sondas deben quedar en verde.

## 2. API (verificada contra el paquete)

| Llamada | Devuelve | Para qué |
|---|---|---|
| `sileo.success / error / warning / info / action(opts)` | id (`string`) | un aviso con ese estado |
| `sileo.show(opts)` | id | genérico (`type` elige el estado; por defecto success) |
| `sileo.promise(promesa \| () => promesa, { loading, success, error, action?, position? })` | la misma promesa | aviso que pasa de «cargando» a éxito o error; `success`/`error` aceptan función `(data)`/`(err)` |
| `sileo.dismiss(id)` · `sileo.clear(position?)` | — | quitar uno / todos |

`opts`: `title`, `description` (ReactNode), `position`, `duration` (ms, **6000**;
`null` = no se va), `icon`, `fill` (**`#FFFFFF`**), `styles` (`{ title,
description, badge, button }` = clases), `roundness` (16), `autopilot`
(`true` | `false` | `{ expand, collapse }` en ms), `button: { title, onClick }`.

`<Toaster>` (una vez, en la raíz): `position` (`top-right` por defecto;
`top|bottom` × `left|center|right`), `offset` (número o `{ top, right, … }`),
`options` (defaults para todos) y `theme` (`light` | `dark` | `system`).

No hay `update(id)`: para un aviso que cambia de estado, usa `sileo.promise`.

## 3. Las trampas (cada una medida y con su arreglo)

Su CSS **se inyecta en runtime con un `<style>` al final del `<head>`**, después
del de tu app. A igual especificidad gana él: cada ajuste lleva `html` delante y
las variables van en `html:root`, no en `:root`. Sin eso, los arreglos «no
hacen nada» y parece que el selector está mal.

| # | Qué pasa de fábrica | Cómo se vio | Arreglo |
|---|---|---|---|
| 1 | `[data-sileo-viewport]{z-index:50}`: el aviso queda **debajo** de drawers (~200) y modales | hit-test: «tapado por Drawer…fondo» (S1) | `html [data-sileo-viewport] { z-index: 300; }` |
| 2 | `[data-sileo-title]{text-transform:capitalize}`: «1 factura eliminada» se ve **«1 Factura Eliminada»** | `innerText` ≠ `textContent` (S2) | `html [data-sileo-title] { text-transform: none; }` |
| 3 | Trae regla de `prefers-reduced-motion`, pero **pierde contra sus propias reglas** más específicas: siguen 0.4–0.6 s de transición y el desenfoque del título | `transitionDuration` con `reducedMotion: 'reduce'` (S5) | bloque `@media (prefers-reduced-motion: reduce)` con `transition-duration: 0s !important; animation-duration: 0s !important` sobre `html [data-sileo-viewport] *` |
| 4 | El colapso automático está **fijo en 4000 ms** (`6000 − 2000`), sin mirar `duration`: en un Deshacer de 10 s, el botón **desaparece** a los 4 s y el aviso sigue ahí | hit-test del botón a 6 y 8.5 s (S7) | `autopilot: { expand: 150, collapse: duracion }` en cada aviso con botón |
| 5 | El botón es un **`<a href="#">` dentro del `<button>`** del aviso (el propio código lo admite en un comentario), el aviso vive al **principio** del `<body>` y en el código sólo pausa con `onMouseEnter`, no con el foco | S3: el enlace recibe foco y Enter funciona, pero llegar con Tab desde el contenido antes de que expire no es realista | **atajo ⌘Z / Ctrl+Z** que deshace la última acción mientras su aviso viva (fuera de inputs, donde ⌘Z es del campo), con una guarda para que botón + atajo no deshagan dos veces |
| 6 | Sus SVG traen `<title>`: el lector lee **«Sileo Notification Check 1 factura eliminada…»** | `ariaSnapshot()` del viewport (S4) | `MutationObserver` que pone `aria-hidden="true"` a los `svg` del viewport |
| 7 | `fill` va a un atributo SVG, pero **sí acepta `var(--token)`** (medido en Chromium y WebKit) | `getComputedStyle(rect).fill` | dos caminos: `theme="system"` invierte la superficie respecto a la página (página clara → aviso `#1a1a1a`; oscura → `#f2f2f2`) y marca `data-theme`, que ajusta la descripción; o `options={{ fill: 'var(--ink)' }}` para seguir tus tokens, y entonces el color de la descripción lo pones tú |
| 8 | Los tonos de estado son saturados y **los mismos en los dos temas**: el verde da 7.63:1 sobre el aviso oscuro pero **2.04:1** sobre el claro | contraste título/fondo (S6) | `--sileo-state-*` por tema en `html:root`: tonos **claros** en tema claro (aviso oscuro) y **oscuros** en tema oscuro. Con los de `sileo.css`: 11.07:1 y 5.82:1 |
| 9 | Con `theme="dark"`, la descripción va a `rgba(0,0,0,.5)` sobre `#f2f2f2`: 3.89:1 | contraste calculado sobre el color resultante (0.68 → 7.55:1) | `html [data-sileo-viewport][data-theme='dark'] [data-sileo-description] { color: rgb(0 0 0 / .68); }` |
| 10 | El botón hereda el subrayado de `<a>` | captura | `html [data-sileo-button] { text-decoration: none; }` |
| 11 | `styles` espera **clases** (los ejemplos de la documentación son de Tailwind con `!`) | — | sin Tailwind, estiliza por `[data-sileo-title]`, `[data-sileo-description]`, `[data-sileo-badge]` y `[data-sileo-button]` con `html` delante |

## 4. Cómo se usa

- **Posición: la esquina contraria al drawer.** Si el drawer abre a la derecha,
  `bottom-left`: a la derecha el aviso tapa el pie del drawer, que es donde
  están sus acciones. En Next, mueve el indicador de desarrollo
  (`devIndicators: { position: 'bottom-right' }` en `next.config`): si no,
  tapa el ícono del aviso mientras revisas.
- **Mutación reversible → aviso con Deshacer**, nunca `confirm()`: borrar,
  pagar, cancelar, importar N filas. La mutación se aplica ya (optimista) y el
  Deshacer la revierte. `avisar({ deshacer })` fija 10 s, el autopilot ligado a
  la duración, ⌘Z y un `onClick` idempotente.
- **Lo que no se puede deshacer** (un envío real, un correo, un cobro) no va con
  Deshacer: va con confirmación explícita antes, y el aviso sólo informa.
- **Operación asíncrona → `sileo.promise`**: generar un archivo, guardar en la
  API. Un solo aviso que pasa de «Generando…» a «Listo» o al error con
  `description: err.message`.
- **Títulos cortos** (el encabezado es `nowrap` en 350 px): «Factura F-0138
  creada», «12 facturas importadas». El detalle, en `description`.
- **Lo que no va en un aviso**: errores de validación de un formulario (van
  junto al campo), el estado vacío o el error de carga de una tabla (van en la
  tabla) y cualquier cosa que la persona tenga que leer después de 10 s.
- **Un aviso por acción.** Si una acción masiva toca 40 filas, es un aviso
  («40 facturas pagadas») con un Deshacer que revierte las 40, no 40 avisos.

### Sonido: sólo en avisos en vivo

`referencia/sileo-gota.mp3` es el sonido de la casa: **una nota suave tipo
marimba**, 0.56 s, 7.6 KB, pico −15.8 dBFS, sin energía arriba de 4 kHz (nada
agudo ni punzante), con entrada y salida suaves para que no haga clic.

- Suena **sólo** con `avisarEnVivo()`: eventos que no disparó la persona. En sus
  propias acciones ya ve el aviso; un sonido ahí es ruido.
- Volumen 0.4 y **`<InterruptorSonido />`** (en `AvisosToaster.tsx`) para
  apagarlo; la preferencia se guarda por persona en `localStorage` y, si el
  almacenamiento falla, suena.
- El navegador bloquea el audio hasta la primera interacción con la página: ese
  `play()` rechazado se ignora (el aviso visual basta). Pruébalo en una pestaña
  recién abierta.
- Copia el mp3 a `public/sonidos/` (o ajusta `SONIDO_URL`).

### Avisos en vivo (apps de administración)

Para eventos que llegan sin que la persona haga nada (una cita nueva, un pago
recibido, un ticket asignado):

- Un sondeo a un endpoint protegido cada ~45 s **y al volver a la pestaña**
  (`visibilitychange` / `focus`).
- **La primera lectura es la línea base**: no dispara avisos (si no, al cargar
  cae una lluvia de avisos de todo lo pendiente).
- Cada evento nuevo dispara **un** aviso con botón que lleva al registro
  (`avisarEnVivo({ titulo, ver: { label: 'Ver', fn: () => abrir(id) } })`,
  que además suena y liga el autopilot a la duración).
- Los eventos por tiempo («cita en menos de 30 min») guardan los ids ya
  avisados en una ref, para no repetirlos en cada sondeo.
- El mismo sondeo alimenta los contadores del menú (un almacén mínimo con
  suscripción), para que el aviso y el número digan lo mismo.

## 5. Verificación

`referencia/sileo.mjs`: adapta el bloque `APP` (URL, cómo se dispara cada tipo
de aviso en tu app) y córrelo con la app levantada. Nueve sondas:

| ID | Qué mide |
|---|---|
| S1 | aviso y botón clicables con el drawer abierto (hit-test, no z-index a ojo) |
| S2 | el título no cambia mayúsculas (`innerText === textContent`) |
| S3 | deshacer sin ratón: el enlace recibe foco y Enter funciona, y ⌘Z deshace |
| S4 | región viva `polite` y nombre accesible sin «Sileo Notification» |
| S5 | con movimiento reducido, transiciones y animaciones en 0 s |
| S6 | contraste título/fondo ≥ 4.5:1 en tema claro y oscuro, del aviso simple **y del de Deshacer** (convierte oklch a rgb pintando un píxel). Si el tema de la app es una clase elegida por el usuario, llena `APP.ponerTema`: el `colorScheme` del navegador no la cambia |
| S7 | el botón sigue clicable a 0.5 / 3 / 6 s y 1.5 s antes de expirar (ordenados, dentro de la vida del aviso) |
| S8 | `sileo.promise`: un solo aviso que pasa de «cargando» a «listo» |
| S9 | sonido: `play()` sólo en el aviso en vivo, con ese archivo (HTTP 200) y volumen 0.4; nunca en acciones propias ni con el sonido apagado, y apagado sigue apagado tras recargar |

Verificada en ambos sentidos: con los ajustes, **9/9**; quitando el CSS, el
observador y el autopilot, fallan **7** (S1, S2, S4, S5, S6, S7, S8). Si en tu
app algo pasa sin los ajustes, la sonda está mal adaptada, no la librería
arreglada.

Trampas de la propia sonda, cobradas en un proyecto real: la app puede tener
otras regiones `aria-live` (un conteo de tabla) → S4 lee la de Sileo; una regla
global de movimiento reducido suele usar 0.01 ms a propósito → S5 acepta < 1 ms;
y con una promesa, Sileo mantiene un momento la capa anterior del título → S6
lee la capa `current`. En aquel proyecto, S6 destapó que su paleta en `:root`
**nunca se había aplicado**: el Deshacer salía en el azul de fábrica.

El botón «Deshacer» es un `<a>`: en Playwright se busca con
`getByRole('link', { name: 'Deshacer' })`, no con `button`. Y hay que esperar
~150 ms a que el aviso se expanda antes del hit-test.

## Relación con otras skills

- **data-table**: construir y auditar tablas. Usa esta skill para la capa de
  avisos de la tabla (Deshacer de filas, acciones masivas, carga masiva).
