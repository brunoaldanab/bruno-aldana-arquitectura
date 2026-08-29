# 005 — Duraciones dentro del presupuesto

- **Status**: TODO
- **Commit**: 8919019
- **Severity**: LOW
- **Category**: Duración
- **Estimated scope**: 2 archivos, ~4 líneas

## Problema

El presupuesto para animaciones de interfaz es **menos de 300 ms**. Dos animaciones lo pasan.

### 5a — La entrada de las listas dura 500 ms

`src/app/globals.css:84-86` — actual:

```css
.animate-rise-in {
  animation: rise-in 0.5s cubic-bezier(0.23, 1, 0.32, 1) both;
}
```

500 ms para que aparezca un elemento de lista es casi el doble del presupuesto. Se nota especialmente porque va escalonado: en `src/app/contactos/page.tsx:41` cada fila suma `Math.min(i, 8) * 45ms` de retraso, así que la novena fila termina de aparecer a los 860 ms. La lista de contactos es lo primero que se abre al entrar a la app.

El escalonado de 45 ms está bien (el rango correcto es 30-80 ms) y **no se toca**.

Sobre el uso de `@keyframes` en vez de una transición: acá es correcto. La regla de preferir transiciones aplica a lo que se dispara rápido o se revierte a mitad de camino; esto corre una sola vez al montar y nada lo vuelve a disparar. Se deja como está.

### 5b — El fondo del login tarda 1,1 segundos en asentarse

`src/components/FondoCinematico.tsx:51` — actual:

```tsx
transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
```

Es la pantalla de login y la portada del estudio: la primera impresión, y muchas veces con el cliente al lado mirando la pantalla. Un segundo y pico es tiempo suficiente para que se lea como que la página está cargando lenta, en vez de como una entrada deliberada.

Además usa `[0.22, 1, 0.36, 1]`, la curva huérfana que no existe en el vocabulario del sistema (la del sistema es `SALIDA`, `[0.23, 1, 0.32, 1]`).

Un fondo a pantalla completa puede pasarse del presupuesto de 300 ms —no es un control de interfaz, es escenografía— pero no por tanto.

## Objetivo

### 5a — Entrada de lista a 260 ms

```css
/* target — src/app/globals.css:84-86 */
.animate-rise-in {
  animation: rise-in 0.26s var(--ease-salida) both;
}
```

Si el plan 003 todavía no se ejecutó, el token `--ease-salida` no existe: en ese caso dejar `cubic-bezier(0.23, 1, 0.32, 1)` literal y que 003 lo reemplace después.

### 5b — Fondo a 700 ms con la curva del sistema

```tsx
/* target — src/components/FondoCinematico.tsx:51 */
transition={{ duration: 0.7, ease: SALIDA }}
```

## Convenciones del repo a respetar

- `src/lib/movimiento.ts` es la fuente del vocabulario en JavaScript: `SALIDA = [0.23, 1, 0.32, 1]`.
- Ejemplar a imitar: `src/components/entrevista/NavegadorPasos.tsx:6` importa `SALIDA` y lo usa sin literales.
- El componente ya ramifica por `reduceMotion` (`FondoCinematico.tsx:49-50`): con movimiento reducido queda solo el fundido, sin la apertura de escala. No tocar esa lógica.

## Pasos

1. `src/app/globals.css:85` — cambiar `0.5s` por `0.26s`. Si el plan 003 ya corrió, la curva ya dirá `var(--ease-salida)` y solo hay que tocar el número.
2. `src/components/FondoCinematico.tsx` — agregar `import { SALIDA } from "@/lib/movimiento";` junto a los imports existentes.
3. `src/components/FondoCinematico.tsx:51` — reemplazar la transición por el objetivo 5b.

## Límites

- NO tocar el escalonado de `src/app/contactos/page.tsx:41` (`Math.min(i, 8) * 45ms`): está en el rango correcto.
- NO tocar los `@keyframes rise-in` (globals.css:73-82): el desplazamiento de 10 px está bien.
- NO tocar `.icono-trazo` (globals.css:278-284), que dura 700 ms: es un dibujo de trazo en estados vacíos, que se ven rara vez. Ese es justamente el caso donde el presupuesto de deleite está permitido.
- NO tocar `src/components/EscenaCinematica.tsx` — es del plan 001.
- NO cambiar la escala de entrada del fondo (`1.08`).
- NO agregar dependencias.
- Si algún paso no coincide con el código que encontrás, PARÁ y reportá.

## Verificación

- **Mecánica**: `npm run dev` una vez, después `npx tsc --noEmit` y `npm run lint`. Sin errores ni advertencias nuevas.
- **Feel check**:
  - Abrir `/contactos` con varias filas cargadas. La lista tiene que terminar de aparecer claramente más rápido, sin que se pierda la sensación de que las filas entran una atrás de otra. **Si el escalonado dejó de percibirse**, reportarlo: significa que 260 ms quedó corto contra un retraso de 45 ms y habría que subir el escalonado a 60 ms en vez de alargar la animación.
  - Abrir el login con la caché de red vacía (DevTools › Network › Disable cache). El fondo tiene que asentarse rápido y sentirse deliberado, no lento.
  - Forzar `prefers-reduced-motion: reduce` y confirmar que la lista aparece sin animación y el fondo entra con un fundido simple.
- **Done when**: `globals.css:85` dice `0.26s`, `FondoCinematico.tsx:51` dice `duration: 0.7` con `SALIDA`, y no queda ningún `[0.22, 1, 0.36, 1]` en ese archivo.
