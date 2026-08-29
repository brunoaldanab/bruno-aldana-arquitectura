# 006 — El chip deja de animar su ancho, y dos momentos ganan el suyo

- **Status**: TODO
- **Commit**: 8919019
- **Severity**: HIGH (6a) · LOW (6b, 6c)
- **Category**: Rendimiento · Oportunidades perdidas
- **Estimated scope**: 3 archivos, ~40 líneas

## Problema

### 6a — El chip anima su propio ancho (esto es lo importante de este plan)

`src/components/entrevista/ChipMulti.tsx:44-51` — actual:

```tsx
<motion.span
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, width: 0 }}
  animate={{ opacity: 1, scale: 1, width: "auto" }}
  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, width: 0 }}
  transition={
    reduceMotion ? { duration: 0.12 } : { type: "spring", bounce: 0.25, duration: 0.32 }
  }
  className="overflow-hidden text-[0.85em]"
>
  ✓
</motion.span>
```

`width` es propiedad de layout, y animar hasta `"auto"` es el caso más caro que hay: Motion tiene que **medir el elemento en cada cuadro** para saber a dónde va. Y el `<span>` vive dentro de un `<button>` que vive dentro de un contenedor `flex flex-wrap` (línea 29), así que cada cuadro puede reacomodar todo el grupo de chips y hasta cambiar de renglón las opciones siguientes.

`ChipMulti` se usa en 5 archivos de pasos distintos. Marcar ambientes, materiales, instalaciones, equipamiento: el cliente toca estos chips **decenas de veces por entrevista**. Es el control más usado de toda la aplicación, y es el que hace el trabajo más caro.

Además `scale` es el atajo de Motion, que no corre en la placa de video. El resto del proyecto usa la cadena `transform` completa.

> Corrección a la auditoría original: ahí se dijo que elegir un chip "solo cambia el color de fondo" y que le faltaba movimiento. Es al revés — `ChipMulti` ya tiene un ✓ que entra con resorte, y está bien pensado (el comentario de las líneas 8-11 explica por qué el ✓ importa). Lo que hay que arreglar no es que falte movimiento, sino que el que hay mueve la propiedad equivocada. `ChipSingle` sí es puramente CSS, y ahí está bien así: es una elección única, el relleno negro alcanza.

### 6b — El campeón del duelo no tiene su momento

`src/app/contactos/[id]/entrevista/steps/DueloStep.tsx:217-221` — actual:

```tsx
<motion.div
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.96)" }}
  animate={{ opacity: 1, transform: "scale(1)" }}
  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
  className="relative aspect-[16/9] overflow-hidden rounded-2xl"
>
```

Esto revela la **"★ Favorita absoluta de la reunión"**: el resultado del torneo de fotos, el momento en que el cliente descubre cuál es su estilo. Es el pico emocional de toda la entrevista y el argumento de venta del método de Bruno — la app le dice al cliente algo sobre sí mismo que no sabía.

Lo resuelve con el mismo fundido de 350 ms que usa cualquier otra cosa. Los momentos raros y de alta carga emocional son exactamente donde está permitido gastar presupuesto de deleite, y acá está sin usar.

### 6c — El estado de guardado se teletransporta

`src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:197-199` — actual:

```tsx
<span className="font-mono text-[11px] text-neutral-300">
  {saveStatus === "saving" ? "Guardando…" : saveStatus === "saved" ? "Guardado ✓" : ""}
</span>
```

"Guardando…" salta a "Guardado ✓" de golpe, sin transición. Está sobre la foto, arriba a la derecha, en el campo visual del cliente. Un cambio de estado que aparece de la nada se lee como un parpadeo; el mismo cambio con 180 ms de transición se lee como una confirmación.

## Objetivo

### 6a — Ancho discreto, movimiento solo en `transform` y `opacity`

```tsx
/* target — src/components/entrevista/ChipMulti.tsx:44-55 */
<motion.span
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.6)" }}
  animate={{ opacity: 1, transform: "scale(1)" }}
  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.6)" }}
  transition={
    reduceMotion ? { duration: 0.12 } : { type: "spring", bounce: 0.25, duration: 0.32 }
  }
  className="inline-block w-[0.85em] shrink-0 text-center text-[0.85em]"
>
  ✓
</motion.span>
```

Qué cambia: el `<span>` pasa a tener un ancho fijo (`w-[0.85em]`, el mismo tamaño que su tipografía) en vez de crecer de 0 a automático. El chip sigue ensanchándose al elegirse —porque el ✓ se monta y ocupa lugar— pero eso ahora es **una sola pasada de layout al montar**, no una por cuadro durante 320 ms. El resorte solo mueve `transform` y `opacity`, las dos propiedades que corren en la placa de video.

Se saca `overflow-hidden` porque ya no hay nada que recortar, y se agrega `shrink-0` para que el flex del botón no aplaste el ✓.

La duración y el rebote (0.32 s / 0.25) **se conservan**: es un control de alta frecuencia y conviene que sea corto. Es una excepción deliberada al token `RESORTE_GESTO` (0.4 s), y merece quedar anotada en el comentario del encabezado del archivo.

### 6b — El campeón se revela

```tsx
/* target — src/app/contactos/[id]/entrevista/steps/DueloStep.tsx:217-221 */
<motion.div
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.98)" }}
  animate={{ opacity: 1, transform: "scale(1)" }}
  transition={{ duration: 0.45, ease: SALIDA }}
  className="relative aspect-[16/9] overflow-hidden rounded-2xl"
>
```

Y adentro, la foto se descubre de abajo hacia arriba en vez de aparecer entera:

```tsx
/* target — el <img> de DueloStep.tsx:224, envuelto */
<motion.div
  className="absolute inset-0"
  initial={reduceMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
  animate={{ clipPath: "inset(0% 0 0 0)" }}
  transition={{ duration: 0.6, ease: SALIDA }}
>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={duel.champion.dataUrl} alt="Foto ganadora" className="h-full w-full object-cover" />
</motion.div>
```

Y el texto entra escalonado detrás, en vez de estar ya puesto:

```tsx
/* target — DueloStep.tsx:228-237, cada una de las tres líneas de texto
   pasa de <p>/<h3> a su equivalente motion, con el mismo className */
const revelar = (delay: number) => ({
  initial: reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(12px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.3, delay, ease: SALIDA },
});

// kicker "★ Favorita absoluta de la reunión" → {...revelar(0.28)}
// h3 con el nombre del estilo                → {...revelar(0.36)}
// p con la calificación                      → {...revelar(0.44)}
```

Total: unos 740 ms de principio a fin. Se pasa del presupuesto de interfaz a propósito — esto ocurre **una vez por entrevista**, en el momento de mayor carga emocional, que es la única categoría donde el catálogo lo permite.

El escalonado de 80 ms entre líneas está en el borde superior del rango correcto (30-80 ms), y acá corresponde el borde superior: se quiere que se lea como una revelación, no como una lista cargando.

### 6c — El estado de guardado cruza de un texto al otro

```tsx
/* target — src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:197-199 */
<span className="font-mono text-[11px] text-neutral-300">
  <AnimatePresence mode="wait" initial={false}>
    {saveStatus !== "idle" && (
      <motion.span
        key={saveStatus}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(4px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-4px)" }}
        transition={{ duration: 0.18, ease: SALIDA }}
        className="inline-block"
      >
        {saveStatus === "saving" ? "Guardando…" : "Guardado ✓"}
      </motion.span>
    )}
  </AnimatePresence>
</span>
```

180 ms, dentro del presupuesto. `mode="wait"` hace que el texto viejo termine de salir antes de que entre el nuevo, así no se superponen dos frases en el mismo lugar.

## Convenciones del repo a respetar

- `src/lib/movimiento.ts` es la fuente del vocabulario: `SALIDA = [0.23, 1, 0.32, 1]`.
- Ejemplar a imitar para la cadena `transform` completa y la rama de `reduceMotion`: `src/app/contactos/[id]/entrevista/steps/DueloStep.tsx:163-171`.
- Ejemplar a imitar para `AnimatePresence mode="wait"`: `src/components/EscenaCinematica.tsx:106-117`.
- `EntrevistaWizard` ya tiene `reduceMotion` en alcance (línea 89). `DueloStep` también. No hace falta agregar el hook.
- Los comentarios van en español y explican el porqué.

## Pasos

1. `src/components/entrevista/ChipMulti.tsx:44-55` — aplicar el objetivo 6a.
2. `src/components/entrevista/ChipMulti.tsx:5-12` — agregar al comentario del encabezado una línea: el ✓ ocupa un ancho fijo a propósito, para que elegir un chip no anime el layout de todo el grupo.
3. `src/app/contactos/[id]/entrevista/steps/DueloStep.tsx` — agregar `SALIDA` al import desde `@/lib/movimiento` (crear la línea de import si el archivo no tiene ninguna).
4. `DueloStep.tsx:217-221` — aplicar la primera parte del objetivo 6b (el contenedor).
5. `DueloStep.tsx:223-226` — envolver el `<img>` del campeón según el objetivo 6b.
6. `DueloStep.tsx:227-237` — definir el helper `revelar` arriba del `return` del componente y aplicarlo a las tres líneas de texto, convirtiéndolas en `motion.p` / `motion.h3` y **conservando sus `className` tal cual están**.
7. `src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:197-199` — aplicar el objetivo 6c. `AnimatePresence` y `motion` ya están importados en la línea 5.

## Límites

- NO tocar `src/components/entrevista/ChipSingle.tsx`: es CSS puro y está bien así.
- NO cambiar la duración ni el rebote del ✓ del chip (0.32 s / 0.25): son una excepción deliberada por ser un control de alta frecuencia.
- NO tocar el bloque del duelo en sí (`DueloStep.tsx:152-210`, las dos fotos que compiten): ese movimiento está bien.
- NO tocar la curva literal de `DueloStep.tsx:171` ni `:289` — son del plan 003.
- NO cambiar ningún `className` de Tailwind salvo los que los objetivos indican explícitamente.
- NO cambiar textos, copy ni estructura de datos.
- NO agregar dependencias.
- Si algún paso no coincide con el código que encontrás, PARÁ y reportá.

## Verificación

- **Mecánica**: `npm run dev` una vez, después `npx tsc --noEmit` y `npm run lint`. Sin errores ni advertencias nuevas.
- **Feel check**:
  - **Chips (lo más importante)**: abrir un paso con muchos chips (por ejemplo Detalle por ambiente) y tocar diez opciones seguidas rápido. Antes el grupo entero se reacomodaba; ahora solo tiene que aparecer el ✓. En DevTools › Rendering › **Paint flashing**, tocar un chip: no debería repintarse todo el grupo.
  - Verificar que el ✓ sigue centrado dentro de su hueco y que el chip no quedó con un espacio raro. `w-[0.85em]` es una estimación del ancho del glifo ✓ — **si queda apretado o sobra aire, reportarlo** con el valor que sí funciona.
  - Tocar y destocar el mismo chip rápido, muchas veces: el resorte tiene que retomar desde donde está, sin saltos.
  - **Campeón**: completar un duelo hasta el final y mirar la revelación. Tiene que sentirse como que algo se descubre, no como que algo aparece. En DevTools › Animations a 10 %, confirmar que la foto se destapa de abajo hacia arriba y que las tres líneas de texto entran una atrás de otra, no juntas.
  - Confirmar que el `clip-path` no recorta los bordes redondeados del contenedor (`rounded-2xl`). Si se ven esquinas cuadradas durante la revelación, reportarlo.
  - **Guardado**: cambiar algo en un paso y mirar arriba a la derecha. "Guardando…" tiene que salir hacia arriba y "Guardado ✓" entrar desde abajo, sin que se pisen.
  - Forzar `prefers-reduced-motion: reduce` y confirmar las tres cosas: el ✓ del chip aparece sin escala, el campeón aparece con un fundido sin `clip-path` ni desplazamiento, y el estado de guardado cambia con un fundido simple.
- **Done when**: tocar un chip no repinta el grupo entero (verificable con Paint flashing), no queda ningún `width: 0` ni `width: "auto"` animado en `src/`, y la revelación del campeón se descubre progresivamente en vez de aparecer entera.
