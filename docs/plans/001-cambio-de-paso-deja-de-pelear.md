# 001 — El cambio de paso deja de pelear consigo mismo

- **Status**: DONE — ejecutado el 28/08/2026 sobre `fe67783`. Verificación mecánica en verde (`tsc` sin errores, `lint` limpio) y *feel check* aprobado por Bruno. El redondeo de los segmentos escalados no se percibe achatado, así que no hizo falta la alternativa.
- **Commit**: 8919019
- **Severity**: HIGH
- **Category**: Rendimiento · Duración · Cohesión
- **Estimated scope**: 3 archivos, ~25 líneas

## Problema

Cada vez que se cambia de paso en la entrevista corren **cuatro animaciones simultáneas que se estorban**. Dos animan propiedades de layout (obligan al navegador a recalcular la página en cada cuadro) y una anima un desenfoque a pantalla completa. El wizard se usa en tablet delante del cliente: es exactamente el contexto donde se caen los cuadros.

Además el mismo evento está contado a dos velocidades: el contenido tarda 240 ms y la foto de arriba 720 ms.

### 1a — La barra de progreso anima `height` en 16 segmentos a la vez

`src/components/entrevista/ProgresoCapitulos.tsx:80-91` — actual:

```tsx
<motion.div
  key={s.id}
  animate={{
    height: esActual ? 10 : 4,
    opacity: esActual ? 1 : hecho ? 0.85 : 0.28,
  }}
  transition={reduceMotion ? { duration: 0.12 } : RESORTE}
  style={{ flex: esActual ? 2.2 : 1 }}
  className={`rounded-full ${
    esActual || hecho ? "bg-neutral-900" : "bg-neutral-900"
  }`}
/>
```

`height` dispara layout + paint + composite. Un resorte lo anima ~400 ms, o sea layout en cada cuadro, por 16 elementos. Peor: la barra es un control de arrastre (`onPointerMove` en la línea 56 llama a `onIr` en cada cruce de segmento), así que esto se dispara continuamente mientras el dedo recorre la pista — el momento donde un cuadro perdido más se nota.

Nota aparte: el ternario del `className` tiene **las dos ramas idénticas** (`bg-neutral-900` en ambas). Es código muerto.

### 1b — El corte de escena dura 720 ms y el contenido 240 ms

`src/components/EscenaCinematica.tsx:55` — actual:

```tsx
const corte = { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };
```

`src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:234` — actual:

```tsx
transition={{ duration: 0.24, ease: SALIDA }}
```

Es el mismo evento a 3× de diferencia. El texto ya se acomodó y la foto todavía está entrando. El presupuesto de interfaz es menos de 300 ms, y esto ocurre unas 15 veces por entrevista — frecuencia "decenas de veces al día", donde la regla es reducir drásticamente.

### 1c — Desenfoque de 16 px animado sobre la foto a pantalla completa

`src/components/EscenaCinematica.tsx:67-82` — actual:

```tsx
initial={
  reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 1.14, filter: "blur(16px) brightness(0.6)" }
}
animate={
  reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }
}
exit={
  reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 1.06, filter: "blur(10px) brightness(0.5)" }
}
transition={corte}
```

Dos problemas: el desenfoque en tiempo de transición debe quedar por debajo de 20 px y acá está en 16 px sobre el elemento más grande de la pantalla durante 720 ms; y `scale` es un atajo de Motion que **no** corre en la placa de video — corre en el hilo principal. El resto del proyecto ya usa la cadena `transform` completa (ver `EntrevistaWizard.tsx:230`).

### 1d — Se anima `max-width` del contenedor del paso

`src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:211` — actual:

```tsx
className={`mx-auto px-4 transition-[max-width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
  esPasoVisual ? "max-w-6xl" : "max-w-3xl"
}`}
```

`max-width` es propiedad de layout: recalcula la página en cada cuadro durante 300 ms, encima de la animación de entrada del propio paso (que ya mueve `transform` + `filter`). Los dos hijos reflowan al mismo tiempo.

## Objetivo

### 1a — `transform: scaleY()` en vez de `height`

```tsx
/* target — src/components/entrevista/ProgresoCapitulos.tsx:80-91 */
<motion.div
  key={s.id}
  animate={{
    transform: `scaleY(${esActual ? 1 : 0.4})`,
    opacity: esActual ? 1 : hecho ? 0.85 : 0.28,
  }}
  transition={reduceMotion ? { duration: 0.12 } : RESORTE}
  style={{ flex: esActual ? 2.2 : 1, height: 10, transformOrigin: "bottom" }}
  className="rounded-full bg-neutral-900"
/>
```

Por qué `0.4`: los valores actuales son 10 px activo y 4 px inactivo; 4/10 = 0.4. La caja pasa a medir 10 px fijos y la escala hace el resto, en la placa de video y sin tocar el layout.

Por qué `transformOrigin: "bottom"`: la pista es `items-end` (línea 72), los segmentos se alinean abajo. Con origen al centro parecerían flotar.

El `flex` **se conserva tal cual**: el ensanchamiento del segmento activo es una decisión de diseño documentada en el comentario de la línea 16 de ese archivo, y al no estar animado cuesta una sola pasada de layout por cambio de paso, no una por cuadro.

El `className` pasa a ser cadena fija: las dos ramas del ternario eran iguales.

### 1b — Corte a 360 ms

```tsx
/* target — src/components/EscenaCinematica.tsx:55 */
const corte = { duration: 0.36, ease: SALIDA };
```

360 ms es el doble que el contenido (240 ms) en vez de 3×: la foto es mucho más grande y puede permitirse algo más de recorrido, pero deja de sentirse como otra animación.

Importa `SALIDA` desde `@/lib/movimiento` — es entrada/salida, y `SALIDA` es la curva del sistema para eso. Elimina de paso la curva huérfana `[0.22, 1, 0.36, 1]`.

### 1c — Desenfoque a la mitad y cadena `transform` completa

```tsx
/* target — src/components/EscenaCinematica.tsx:67-82 */
initial={
  reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, transform: "scale(1.14)", filter: "blur(8px) brightness(0.6)" }
}
animate={
  reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }
}
exit={
  reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, transform: "scale(1.06)", filter: "blur(6px) brightness(0.5)" }
}
transition={corte}
```

### 1d — El ancho cambia de golpe, sin animar

```tsx
/* target — src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:211 */
className={`mx-auto px-4 ${esPasoVisual ? "max-w-6xl" : "max-w-3xl"}`}
```

El cambio de ancho queda tapado por la animación de entrada del paso, que ya está corriendo. No se pierde nada visible y se gana toda la pasada de layout.

## Convenciones del repo a respetar

- El vocabulario de movimiento vive en `src/lib/movimiento.ts`. Importar de ahí, nunca escribir la curva a mano. `SALIDA = [0.23, 1, 0.32, 1]`, `RESORTE = { type: "spring", bounce: 0, duration: 0.4 }`.
- Ejemplar a imitar: `src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:229-235` — usa la cadena `transform` completa, importa `SALIDA`, ramifica por `reduceMotion`.
- Todo componente con movimiento usa `useReducedMotion()` de `motion/react` y ofrece una rama sin desplazamiento. No romper esas ramas.
- Los comentarios del proyecto están en español y explican el *porqué*, no el *qué*. Si un comentario deja de ser cierto tras el cambio, actualizarlo.

## Pasos

1. `src/components/entrevista/ProgresoCapitulos.tsx` — reemplazar el bloque `motion.div` de las líneas 80-91 por el objetivo de 1a. `RESORTE` ya está importado en la línea 6.
2. `src/components/EscenaCinematica.tsx` — agregar `import { SALIDA } from "@/lib/movimiento";` junto a los imports existentes.
3. `src/components/EscenaCinematica.tsx:55` — reemplazar la constante `corte` por el objetivo de 1b.
4. `src/components/EscenaCinematica.tsx:67-82` — reemplazar `initial`/`animate`/`exit` por el objetivo de 1c.
5. `src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:211` — reemplazar el `className` por el objetivo de 1d.

## Límites

- NO tocar `src/components/useMovimientoEscena.ts` — tiene su propio plan (002).
- NO tocar las curvas escritas a mano en los archivos de `steps/` — plan 003.
- NO tocar `src/components/FondoCinematico.tsx` — plan 005.
- NO cambiar marcado ni estructura: solo propiedades de movimiento, salvo el `style`/`className` que los pasos indican explícitamente.
- NO agregar dependencias.
- NO tocar el `flex` de `ProgresoCapitulos`: el ensanchamiento es una decisión de diseño documentada.
- Si algún paso no coincide con el código que encontrás (el repo cambió desde el commit 8919019), PARÁ y reportá en vez de improvisar.

## Verificación

- **Mecánica**: correr `npm run dev` una vez para que Next genere los tipos, después `npx tsc --noEmit`. Esperado: sin errores. (Ojo: sin haber corrido `next dev` o `next build` antes, `tsc` reporta `Cannot find name 'LayoutProps'` en `src/app/layout.tsx:26` — es un tipo que genera Next, no un error del cambio.) Después `npm run lint`, sin advertencias nuevas.
- **Feel check** — abrir una entrevista y:
  - Apretar siguiente varias veces seguidas. La foto y el contenido tienen que terminar juntos, no la foto medio segundo después.
  - **Arrastrar el dedo a lo largo de la barra de progreso de punta a punta.** Antes se sentía pesado; tiene que quedar fluido. Este es el chequeo que más importa.
  - Mirar los extremos redondeados de los segmentos inactivos: al escalarlos a 0.4 el radio se achata y podrían leerse como óvalos en vez de cápsulas. A 4 px de alto debería ser imperceptible — **si se nota, reportarlo**: la alternativa es volver a `height` fijo de 4 px y mover solo la opacidad.
  - En DevTools › Animations, bajar la velocidad a 10% y confirmar que el desenfoque ya no domina la transición.
  - En DevTools › Rendering, activar **Paint flashing** y cambiar de paso: la barra de progreso ya no debería repintarse entera.
  - En DevTools › Rendering, forzar `prefers-reduced-motion: reduce` y confirmar que el corte queda en fundido simple y la barra sigue indicando el paso actual.
- **Done when**: cambiar de paso no dispara layout en la barra de progreso (verificable con Paint flashing), el corte de escena mide 360 ms, y no queda ningún `[0.22, 1, 0.36, 1]` en `EscenaCinematica.tsx`.
