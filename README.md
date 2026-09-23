# sileo-avisos

Skill de Claude Code para integrar **[Sileo](https://sileo.aaryan.design/docs)**
como la capa de avisos de una app React: Deshacer optimista en vez de
`confirm()`, `sileo.promise` para lo asíncrono y avisos en vivo en paneles de
administración.

Sileo es precioso de fábrica, pero **no está listo de fábrica**. La skill trae
lo que le falta, medido en el navegador contra `sileo@0.1.5`.

## Instalar

```bash
git clone https://github.com/xgael/sileo-avisos ~/.claude/skills/sileo-avisos
```

Se activa cuando pides toasts, avisos con deshacer o `sileo.promise`, o cuando
un aviso sale detrás de un drawer.

## Lo que corrige

| De fábrica | Con la skill |
|---|---|
| `z-index: 50`: el aviso y su «Deshacer» quedan **debajo** de cualquier drawer o modal | encima (300), verificado con hit-test |
| El título va en `capitalize`: «1 factura eliminada» se ve «1 Factura Eliminada» | el texto tal cual |
| Su regla de movimiento reducido **pierde contra sus propias reglas**: sigue animando 0.4–0.6 s | 0 s de verdad |
| El colapso está fijo en 4 s: en un aviso de 10 s, **el botón Deshacer desaparece a los 4** | visible toda la vida del aviso |
| El botón es un `<a>` dentro de un `<button>`, al principio de la página: con teclado no se llega a tiempo | atajo ⌘Z / Ctrl+Z, sin deshacer dos veces |
| El lector de pantalla lee «Sileo Notification Check…» antes del mensaje | sólo el mensaje |
| El verde de éxito da 2.04:1 sobre el aviso claro del tema oscuro | 11.07:1 y 5.82:1 |

Y la razón de fondo, que es la que hace fallar los arreglos a medias: su CSS se
inyecta **al final del `<head>`**, así que un override con la misma
especificidad pierde. Por eso cada ajuste va con `html` delante.

## Contenido

```
SKILL.md                 la skill: integración, API, las once trampas, cómo usarlo
referencia/
  AvisosToaster.tsx      <Toaster> con los ajustes (observador a11y + atajo ⌘Z)
  avisos.ts              avisar({ titulo, deshacer }): duración, guarda, autopilot
  sileo.css              los ajustes de CSS, cada uno con su porqué
  sileo.mjs              8 sondas Playwright; adapta el bloque APP a tu app
```

`referencia/` sale de una tabla de facturas de referencia construida con la
skill [data-table](https://github.com/xgael/data-table).

## Licencia

MIT
