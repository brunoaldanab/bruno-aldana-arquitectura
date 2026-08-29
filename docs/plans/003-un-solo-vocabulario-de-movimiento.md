# 003 — Un solo vocabulario de movimiento

- **Status**: TODO
- **Commit**: 8919019
- **Severity**: MEDIUM
- **Category**: Cohesión y tokens
- **Estimated scope**: 9 archivos, ~20 líneas
- **Depende de**: 001, 004 y 005. Ejecutar este plan **último**: los otros tres ya eliminan algunas de las curvas listadas acá, y hacerlo antes provoca conflictos sobre las mismas líneas.

## Problema

El proyecto tiene un vocabulario de movimiento bien definido en `src/lib/movimiento.ts`, con las curvas correctas y comentadas. **Solo 4 archivos lo importan.** Los otros escriben la curva a mano: hay 21 apariciones de una `cubic-bezier` literal repartidas en 11 archivos.

Consecuencias concretas:

1. **Conviven dos curvas casi idénticas.** `SALIDA` es `[0.23, 1, 0.32, 1]`, pero `EscenaCinematica.tsx:55` y `FondoCinematico.tsx:51` usan `[0.22, 1, 0.36, 1]`. Nadie percibe la diferencia mirando; lo que se percibe es que el sistema dejó de ser un sistema.
2. **Cambiar la personalidad del movimiento requiere 21 ediciones** en vez de una. El archivo `movimiento.ts` fue escrito justamente para que fuera una.
3. **Los resortes también se escriben a mano.** `DueloStep.tsx:197` usa `{ type: "spring", duration: 0.4, bounce: 0.3 }` cuando ya existe `RESORTE_GESTO = { type: "spring", bounce: 0.2, duration: 0.4 }`.

Y en el mismo lugar, un problema de rendimiento del mismo origen:

`src/app/contactos/[id]/entrevista/steps/DueloStep.tsx:193-197` — actual:

```tsx
<motion.span
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.5, opacity: 0 }}
  transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
```

`scale` es el atajo de Motion: **no** corre en la placa de video. El mismo archivo, doce líneas más arriba (`DueloStep.tsx:169`), ya usa la cadena `transform` completa. Es inconsistente consigo mismo.

### Inventario de curvas escritas a mano

En archivos `.tsx` / `.ts` (arreglos de Motion):

| Archivo:línea | Valor | Reemplazo |
|---|---|---|
| `steps/DueloStep.tsx:171` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `steps/DueloStep.tsx:220` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `steps/DueloStep.tsx:289` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `steps/GalleryStep.tsx:430` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `steps/GalleryStep.tsx:466` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `steps/MaterialesStep.tsx:71` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `steps/PaletaStep.tsx:153` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `app/page.tsx:17` | `[0.23, 1, 0.32, 1]` | `SALIDA` |
| `components/EscenaCinematica.tsx:112` | `[0.23, 1, 0.32, 1]` | `SALIDA` |

En clases de Tailwind y en CSS:

| Archivo:línea | Valor |
|---|---|
| `steps/MaterialesStep.tsx:83` | `ease-[cubic-bezier(0.23,1,0.32,1)]` |
| `components/ui/Button.tsx:33` | `ease-[cubic-bezier(0.23,1,0.32,1)]` |
| `components/ui/field.ts:14` | `ease-[cubic-bezier(0.23,1,0.32,1)]` |
| `app/globals.css:115` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `app/globals.css:148` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `app/globals.css:241` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `app/globals.css:282` | `cubic-bezier(0.23, 1, 0.32, 1)` |

## Objetivo

### 3a — Tokens de curva en el tema de Tailwind

Una constante de TypeScript no se puede importar desde CSS, así que el mismo vocabulario necesita existir de los dos lados. Tailwind v4 genera utilidades a partir de las claves `--ease-*` del bloque `@theme`.

```css
/* target — src/app/globals.css, dentro del bloque @theme que empieza en la línea 8,
   agregado al final del bloque, justo antes de las sombras */

  /* Vocabulario de movimiento. Es el mismo que vive en src/lib/movimiento.ts:
     ahí para los componentes que animan con Motion, acá para los que animan con
     CSS. Si se cambia una curva, se cambia en los dos lados. */
  --ease-salida: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-recorrido: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-cajon: cubic-bezier(0.32, 0.72, 0, 1);
```

Con eso Tailwind genera las utilidades `ease-salida`, `ease-recorrido` y `ease-cajon`, y el CSS plano puede usar `var(--ease-salida)`.

### 3b — Las clases de Tailwind usan la utilidad

```
/* target — reemplazo textual en los tres archivos */
ease-[cubic-bezier(0.23,1,0.32,1)]   →   ease-salida
```

Aplica a `steps/MaterialesStep.tsx:83`, `components/ui/Button.tsx:33` y `components/ui/field.ts:14`.

### 3c — El CSS plano usa la variable

```css
/* target — globals.css:115, :148, :241 y :282 */
cubic-bezier(0.23, 1, 0.32, 1)   →   var(--ease-salida)
```

### 3d — Los componentes de Motion importan el token

En cada archivo de la tabla de arriba, agregar el import si falta y reemplazar el literal:

```tsx
/* target — import a agregar donde no exista */
import { SALIDA } from "@/lib/movimiento";
```

```tsx
/* target — ejemplo, steps/DueloStep.tsx:171 */
transition={{ duration: 0.28, ease: SALIDA }}
```

Las duraciones **no cambian**: este plan solo unifica curvas. Cada `duration` se conserva tal como está.

### 3e — El sello del duelo usa el token de resorte y la cadena `transform`

```tsx
/* target — src/app/contactos/[id]/entrevista/steps/DueloStep.tsx:193-197 */
<motion.span
  initial={{ transform: "scale(0.5)", opacity: 0 }}
  animate={{ transform: "scale(1)", opacity: 1 }}
  exit={{ transform: "scale(0.5)", opacity: 0 }}
  transition={RESORTE_GESTO}
```

`RESORTE_GESTO` es `{ type: "spring", bounce: 0.2, duration: 0.4 }`. Baja el rebote de 0.3 a 0.2, que es el rango que el sistema reserva para el rebote visible.

## Convenciones del repo a respetar

- `src/lib/movimiento.ts` es la única fuente de verdad del movimiento en JavaScript. Exporta `SALIDA`, `RECORRIDO`, `CAJON`, `RESORTE`, `RESORTE_GESTO`, `HOJA`.
- Ejemplar a imitar: `src/components/entrevista/NavegadorPasos.tsx:6` — `import { HOJA, SALIDA } from "@/lib/movimiento";` y después los usa sin literales.
- El alias de importación del proyecto es `@/` hacia `src/` (`tsconfig.json`).
- Los comentarios van en español y explican el porqué.

## Pasos

1. `src/app/globals.css` — agregar los tres tokens `--ease-*` del objetivo 3a al final del bloque `@theme`.
2. `src/app/globals.css` — reemplazar la `cubic-bezier` literal por `var(--ease-salida)` en las líneas 115, 148, 241 y 282.
3. `src/components/ui/Button.tsx:33` — reemplazar `ease-[cubic-bezier(0.23,1,0.32,1)]` por `ease-salida`.
4. `src/components/ui/field.ts:14` — mismo reemplazo.
5. `src/app/contactos/[id]/entrevista/steps/MaterialesStep.tsx:83` — mismo reemplazo.
6. Para cada archivo de la primera tabla: agregar `import { SALIDA } from "@/lib/movimiento";` si no está, y reemplazar cada `ease: [0.23, 1, 0.32, 1]` (con o sin `as const`) por `ease: SALIDA`.
7. `src/app/contactos/[id]/entrevista/steps/DueloStep.tsx` — agregar `RESORTE_GESTO` al import y aplicar el objetivo 3e en las líneas 193-197.
8. Verificación final de barrido: `grep -rn "cubic-bezier\|0\.23, *1, *0\.32, *1\|0\.22, *1, *0\.36, *1" src --include=*.tsx --include=*.ts --include=*.css | grep -v generated | grep -v movimiento.ts | grep -v globals.css`. Tiene que devolver **cero resultados**. (`globals.css` queda excluido porque ahí viven ahora los tokens, y `movimiento.ts` porque es la fuente.)

## Límites

- NO cambiar ninguna `duration`. Este plan unifica curvas y el resorte del sello; nada más.
- NO tocar `src/app/contactos/[id]/entrevista/EntrevistaWizard.tsx:211`, `src/components/EscenaCinematica.tsx:55` ni `:67-82` — son del plan 001. Si ya se ejecutó, esas curvas ya no existen.
- NO tocar `src/app/contactos/[id]/entrevista/steps/GalleryStep.tsx:26` (`PASE`) — es del plan 004.
- NO tocar `src/components/FondoCinematico.tsx:51` ni `src/app/globals.css:85` — son del plan 005.
- NO cambiar `src/lib/movimiento.ts`: los valores que tiene son los correctos.
- NO agregar dependencias.
- Si algún número de línea no coincide con lo que encontrás, buscá el literal por contenido antes de darte por vencido — los planes 001, 004 y 005 corrieron antes y pueden haber corrido las líneas. Si el literal tampoco aparece, PARÁ y reportá.

## Verificación

- **Mecánica**:
  - `npm run dev` una vez, después `npx tsc --noEmit`: sin errores.
  - `npm run lint`: sin advertencias nuevas.
  - El grep del paso 8: cero resultados.
- **Feel check**: este plan **no debe cambiar nada visible**, salvo en un lugar. Es un refactor.
  - Recorrer la entrevista completa, la home y el login. Todo tiene que sentirse exactamente igual que antes.
  - **La excepción esperada**: el sello ✓ verde del duelo (`DueloStep`) va a rebotar un poco menos (0.3 → 0.2). Confirmar que sigue leyéndose como un acuse de recibo con carácter y no como algo apagado. Si quedó muerto, reportarlo antes de bajar más el rebote.
  - Comprobar que los botones (`Button.tsx`) siguen hundiéndose al apretarlos: si la utilidad `ease-salida` no se generó, Tailwind descarta la clase en silencio y la transición pasa a la curva por defecto del navegador. Este es el punto de falla silenciosa de este plan.
  - Comprobar lo mismo en los campos de formulario (`field.ts`): al enfocar, el fondo pasa a blanco con un aro negro; la transición tiene que seguir siendo suave.
- **Done when**: el grep del paso 8 devuelve cero, `npm run lint` pasa, y recorriendo la app no se percibe ninguna diferencia salvo el rebote del sello del duelo.
