# 004 — El pase de fotos responde al gesto

- **Status**: TODO
- **Commit**: 8919019
- **Severity**: MEDIUM
- **Category**: Interrumpibilidad · Curvas
- **Estimated scope**: 1 archivo, ~6 líneas

## Problema

El visor de fotos de la galería es la pantalla donde el cliente pasa más tiempo: es donde mira las referencias de estilo y de mobiliario y decide qué le gusta. Se maneja arrastrando con el dedo.

### 4a — El pase pierde la fuerza del gesto

`src/app/contactos/[id]/entrevista/steps/GalleryStep.tsx:26` — actual:

```tsx
const PASE = { duration: 0.25, ease: [0.77, 0, 0.175, 1] as const };
```

`[0.77, 0, 0.175, 1]` es la curva `RECORRIDO` del sistema: una *ease-in-out*, pensada para algo que se desplaza de un punto a otro de la pantalla. Tiene arranque lento a propósito.

Dos problemas con usarla acá:

1. **La foto entra y sale, no se desplaza.** Para entradas y salidas la regla es *ease-out*: arranca rápido, que es justo el instante que el ojo está mirando. Con arranque lento el pase se siente pesado.
2. **Es un tiempo fijo detrás de un gesto.** El movimiento que nace de la mano tiene que continuarse con un resorte, porque el resorte arrastra la velocidad con la que venía el dedo. Con una duración fija de 250 ms, un manotazo fuerte y un empujoncito suave producen exactamente la misma animación. El gesto del cliente no se refleja en la pantalla.

### 4b — La decisión de pasar no usa la proyección del sistema

`src/app/contactos/[id]/entrevista/steps/GalleryStep.tsx:305-309` — actual:

```tsx
onDragEnd={(_, info) => {
  const fuerza = info.offset.x + info.velocity.x * 0.2;
  if (fuerza < -80) pasar(1);
  else if (fuerza > 80) pasar(-1);
}}
```

El multiplicador `0.2` está inventado en el lugar. El proyecto ya tiene la función correcta —la misma fórmula de deceleración que usa Apple— en `src/lib/movimiento.ts:44`, y el wizard ya la usa en `EntrevistaWizard.tsx:243`:

```tsx
const destino = info.offset.x + proyectar(info.velocity.x) * 0.08;
```

Que dos gestos de arrastre horizontal, en la misma app, decidan con fórmulas distintas es exactamente lo que el archivo `movimiento.ts` existe para evitar.

## Objetivo

### 4a — Resorte de gesto en vez de tiempo fijo

```tsx
/* target — src/app/contactos/[id]/entrevista/steps/GalleryStep.tsx:25-26 */
/** El pase nace de la mano: un resorte arrastra la velocidad del gesto, un
 *  tiempo fijo la tira. */
const PASE = RESORTE_GESTO;
```

`RESORTE_GESTO` es `{ type: "spring", bounce: 0.2, duration: 0.4 }`, ya definido en `src/lib/movimiento.ts:32` y documentado ahí como "para cuando el movimiento vino de un gesto del usuario".

### 4b — Usar `proyectar()`

```tsx
/* target — src/app/contactos/[id]/entrevista/steps/GalleryStep.tsx:305-309 */
onDragEnd={(_, info) => {
  // Se proyecta adónde iba el gesto: un envión corto alcanza para pasar.
  const destino = info.offset.x + proyectar(info.velocity.x) * 0.08;
  if (destino < -80) pasar(1);
  else if (destino > 80) pasar(-1);
}}
```

El umbral de 80 px se conserva: el visor es más chico que la pantalla del wizard (que usa 90), así que pedirle menos recorrido es correcto.

## Convenciones del repo a respetar

- `src/lib/movimiento.ts` es la fuente del vocabulario de movimiento. Importar, no reescribir.
- Ejemplar a imitar: `src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:240-248` — el `onDragEnd` del wizard, que ya hace exactamente esto.
- El archivo ya ramifica por `reduceMotion` dentro de `variantes` (líneas 232-242): con movimiento reducido los transform quedan en `"none"` y solo queda el fundido. **No tocar esa lógica**: sigue funcionando igual con un resorte.
- Los comentarios van en español y explican el porqué.

## Pasos

1. `src/app/contactos/[id]/entrevista/steps/GalleryStep.tsx` — agregar `proyectar` y `RESORTE_GESTO` al import desde `@/lib/movimiento`. Si el archivo todavía no importa nada de ahí, crear la línea: `import { proyectar, RESORTE_GESTO } from "@/lib/movimiento";`
2. `GalleryStep.tsx:25-26` — reemplazar la constante `PASE` por el objetivo 4a, con su comentario.
3. `GalleryStep.tsx:305-309` — reemplazar el cuerpo del `onDragEnd` por el objetivo 4b.

## Límites

- NO tocar `VUELTA` (línea 28): `{ bounceStiffness: 320, bounceDamping: 34 }` gobierna la vuelta elástica cuando el arrastre no alcanza, y está bien como está.
- NO tocar el objeto `variantes` (líneas 232-242): los porcentajes de `translateX` y las escalas son correctos, y usa la cadena `transform` completa como corresponde.
- NO tocar `dragElastic` (0.18) ni `dragConstraints`.
- NO tocar las otras dos curvas literales del archivo (líneas 430 y 466) — son del plan 003.
- NO cambiar el atajo de teclado ni la función `pasar` (líneas 81-88, 103-104).
- NO agregar dependencias.
- Si algún paso no coincide con el código que encontrás, PARÁ y reportá.

## Verificación

- **Mecánica**: `npm run dev` una vez, después `npx tsc --noEmit` y `npm run lint`. Sin errores ni advertencias nuevas.

  Ojo con un detalle de tipos: `PASE` pasa de ser un objeto de tween a un objeto de spring. Si TypeScript se queja en el `transition={PASE}` de la línea 301, es señal de que el tipo estaba siendo inferido de forma demasiado estrecha — **no** resolverlo con `as any`; usar el tipo `Transition` de `motion/react`.

- **Feel check** — abrir un paso de galería (Estilo o Tipo de mobiliario) con al menos tres fotos cargadas:
  - **Pasar una foto de un manotazo fuerte y después de un empujoncito suave.** Tienen que verse distintas: es el punto entero de este plan. Si se ven iguales, el resorte no está recibiendo la velocidad.
  - Arrastrar hasta la mitad y soltar sin fuerza: la foto tiene que volver a su lugar con la elástica de `VUELTA`, como antes.
  - Pasar varias fotos rápido, una atrás de otra, sin esperar a que termine la animación. Un resorte retoma desde donde está; no debería verse ningún salto ni reinicio.
  - Pasar con las flechas del teclado: tiene que seguir andando, ahora con el resorte.
  - En DevTools › Animations a 10% de velocidad, mirar el pase: la foto que entra tiene que arrancar rápido y frenar suave, no arrancar lento.
  - Forzar `prefers-reduced-motion: reduce` y confirmar que el pase queda en fundido puro, sin desplazamiento.
- **Done when**: un manotazo fuerte y uno suave producen pases visiblemente distintos, no queda ningún literal `[0.77, 0, 0.175, 1]` en el archivo, y el multiplicador `0.2` fue reemplazado por `proyectar()`.
