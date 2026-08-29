# 002 — El motor de escena escribe en el elemento que consume, no en el padre

- **Status**: TODO
- **Commit**: 8919019
- **Severity**: MEDIUM
- **Category**: Rendimiento · Accesibilidad
- **Estimated scope**: 2 archivos, ~20 líneas

## Problema

### 2a — Las variables CSS se escriben en el contenedor y las consume un nieto

`src/components/useMovimientoEscena.ts:69-74` — actual:

```ts
nodo!.style.setProperty("--mx", mouseX.toFixed(4));
nodo!.style.setProperty("--my", mouseY.toFixed(4));
nodo!.style.setProperty("--escena-y", `${scrub * -38}px`);
nodo!.style.setProperty("--escena-blur", `${scrub * 7}px`);
nodo!.style.setProperty("--escena-brillo", `${1 - scrub * 0.32}`);
nodo!.style.setProperty("--escena-velo", `${scrub * 0.45}`);
```

`nodo` es el contenedor `.escena-cinematica` (`EscenaCinematica.tsx:58`, `FondoCinematico.tsx:42`). Los que realmente usan esas variables son dos descendientes: `.escena-capa img` (globals.css:191) y `.escena-velo` (globals.css:216).

Cambiar una propiedad personalizada en un elemento **invalida el estilo de todo su subárbol**, porque el navegador no puede saber quién hereda qué. En este contenedor viven además la barra superior, el kicker, el título animado y todo el contenido del paso. En cada cuadro de scroll o de movimiento del puntero se recalcula el estilo de todo eso para actualizar dos nodos.

### 2b — Se escucha el puntero en dispositivos donde no hay puntero

`src/components/useMovimientoEscena.ts:83` — actual:

```ts
window.addEventListener("pointermove", onPointerMove, { passive: true });
```

El parallax de puntero solo tiene sentido con mouse. En la tablet —que es donde se usa la entrevista— `pointermove` igual se dispara durante cada arrastre táctil, así que el efecto corre y consume cuadros justo mientras el usuario está haciendo un gesto, sin aportar nada: el "puntero" es el propio dedo que ya está moviendo la pantalla.

El resto del proyecto ya resuelve esto: `globals.css:130`, `:154` y `:168` gatean todo el hover detrás de `(hover: hover) and (pointer: fine)`.

### 2c — `will-change` permanente sobre una imagen a pantalla completa

`src/app/globals.css:202` — actual:

```css
will-change: transform, filter;
```

`will-change: filter` obliga al navegador a mantener viva una capa de composición con un filtro sobre la imagen más grande de la pantalla, durante toda la vida de la página, se esté animando o no. Es memoria de GPU reservada de forma permanente.

## Objetivo

### 2a — Escribir cada variable en el nodo que la consume

```ts
/* target — src/components/useMovimientoEscena.ts, dentro del useEffect,
   antes de declarar frame() */
const capa = nodo.querySelector<HTMLElement>(".escena-capa img");
const velo = nodo.querySelector<HTMLElement>(".escena-velo");
```

```ts
/* target — reemplaza el bloque de setProperty de las líneas 69-74 */
if (capa) {
  capa.style.setProperty("--mx", mouseX.toFixed(4));
  capa.style.setProperty("--my", mouseY.toFixed(4));
  capa.style.setProperty("--escena-y", `${scrub * -38}px`);
  capa.style.setProperty("--escena-blur", `${scrub * 7}px`);
  capa.style.setProperty("--escena-brillo", `${1 - scrub * 0.32}`);
}
if (velo) velo.style.setProperty("--escena-velo", `${scrub * 0.45}`);
```

El CSS de `globals.css` **no cambia**: las mismas variables, los mismos nombres, consumidas por los mismos selectores. Lo único que cambia es en qué nodo se escriben, y con eso la invalidación de estilo deja de alcanzar al resto del subárbol.

Los valores numéricos (−38 px, 7 px, 0.32, 0.45) se conservan exactamente: este plan no cambia cómo se ve, solo cuánto cuesta.

**Nota importante para quien ejecute**: `EscenaCinematica` monta la capa dentro de un `AnimatePresence` con `key={claveEscena}` (`EscenaCinematica.tsx:62-64`), así que el `<img>` **se reemplaza cada vez que cambia el paso**. La referencia cacheada queda apuntando a un nodo muerto. Hay que re-consultar el nodo dentro de `frame()`, no una sola vez al montar:

```ts
/* target definitivo — dentro de frame(), reemplazando el bloque anterior */
const capa = nodo!.querySelector<HTMLElement>(".escena-capa img");
const velo = nodo!.querySelector<HTMLElement>(".escena-velo");
if (capa) {
  capa.style.setProperty("--mx", mouseX.toFixed(4));
  capa.style.setProperty("--my", mouseY.toFixed(4));
  capa.style.setProperty("--escena-y", `${scrub * -38}px`);
  capa.style.setProperty("--escena-blur", `${scrub * 7}px`);
  capa.style.setProperty("--escena-brillo", `${1 - scrub * 0.32}`);
}
if (velo) velo.style.setProperty("--escena-velo", `${scrub * 0.45}`);
```

Dos `querySelector` por cuadro sobre un subárbol chico cuestan mucho menos que invalidar el subárbol entero, y es correcto frente al remontaje. Usar la versión de arriba.

### 2b — El parallax de puntero solo con mouse

```ts
/* target — src/components/useMovimientoEscena.ts, dentro del useEffect,
   junto a la guarda de reduceMotion */
const punteroFino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
```

```ts
/* target — el registro del listener pasa a ser condicional */
if (punteroFino) {
  window.addEventListener("pointermove", onPointerMove, { passive: true });
}
```

Y en la limpieza, quitarlo siempre (llamar `removeEventListener` sobre algo que nunca se registró es inofensivo, así que la limpieza puede quedar como está).

Con `punteroFino` en falso, `mouseX`/`mouseY` quedan en 0 y `--mx`/`--my` en su valor neutro: la foto sigue con su grado y su scrub de scroll, sin parallax. Es exactamente el comportamiento que ya tiene con `prefers-reduced-motion`.

### 2c — `will-change` solo sobre `transform`

```css
/* target — src/app/globals.css:202 */
will-change: transform;
```

## Convenciones del repo a respetar

- Las consultas por media query de puntero usan exactamente `(hover: hover) and (pointer: fine)`. Ejemplar: `src/app/globals.css:130`.
- El hook ya ramifica por `reduceMotion` y deja las variables en valores neutros en vez de apagar el componente (comentario en `useMovimientoEscena.ts:19-21`). Mantener ese criterio: degradar, no desaparecer.
- Los comentarios explican el porqué. El del encabezado del hook (líneas 8-22) describe las dos reglas de movimiento; si el parallax pasa a ser solo-mouse, agregarlo ahí en una línea.

## Pasos

1. `src/components/useMovimientoEscena.ts` — dentro del `useEffect`, después de la guarda `if (!nodo || reduceMotion) return;`, agregar la constante `punteroFino` del objetivo 2b.
2. `src/components/useMovimientoEscena.ts:69-74` — reemplazar el bloque de seis `setProperty` por la **versión definitiva** del objetivo 2a (la que re-consulta dentro de `frame()`).
3. `src/components/useMovimientoEscena.ts:83` — envolver el `addEventListener("pointermove", …)` en `if (punteroFino) { … }`.
4. `src/components/useMovimientoEscena.ts:8-22` — agregar al comentario del encabezado una línea aclarando que el parallax de puntero solo se engancha con mouse, porque en pantalla táctil el dedo ya es el que mueve la escena.
5. `src/app/globals.css:202` — cambiar `will-change: transform, filter;` por `will-change: transform;`.

## Límites

- NO cambiar ningún valor numérico del movimiento (−38, 7, 0.32, 0.45, los lerp de 0.12 y 0.14). Este plan es solo de costo, no de apariencia.
- NO cambiar los nombres de las variables CSS ni los selectores de `globals.css` fuera de la línea 202.
- NO tocar `EscenaCinematica.tsx` ni `FondoCinematico.tsx` — sus cambios están en los planes 001 y 005.
- NO reemplazar las variables CSS por escritura directa de `transform`/`filter` en JS: rompería la propiedad —documentada en `globals.css:174-181`— de que tocando cuatro valores se cambia la dirección visual de toda la app.
- NO agregar dependencias.
- Si algún paso no coincide con el código que encontrás (el repo cambió desde el commit 8919019), PARÁ y reportá.

## Verificación

- **Mecánica**: `npm run dev` una vez, después `npx tsc --noEmit` y `npm run lint`. Sin errores ni advertencias nuevas.
- **Feel check**:
  - Con mouse, abrir una entrevista y mover el puntero sobre la franja de la foto: el parallax tiene que seguir existiendo, con la misma inercia suave de antes.
  - Hacer scroll: la foto tiene que seguir subiendo, oscureciéndose y desenfocándose igual que antes.
  - **Cambiar de paso y después mover el mouse.** Si el parallax dejó de funcionar tras cambiar de paso, la re-consulta del nodo está mal hecha: es el punto que más fácil se rompe en este plan.
  - En DevTools › Performance, grabar 3 segundos de scroll sobre una entrevista. Comparar contra una grabación previa al cambio: el tiempo en *Recalculate Style* tiene que bajar.
  - En un celular o en DevTools con emulación táctil: arrastrar para cambiar de paso. No debería haber parallax de puntero peleando con el gesto.
  - Forzar `prefers-reduced-motion: reduce` y confirmar que la escena queda quieta pero conserva el grado de color (no debe quedar la foto sin tratar).
- **Done when**: no queda ningún `setProperty` sobre `nodo` en `useMovimientoEscena.ts`, el `pointermove` está detrás de `punteroFino`, y `globals.css:202` dice `will-change: transform;`.
