# Propuesta comercial — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que al terminar una entrevista se pueda generar un PDF de cuatro páginas con el resumen de la reunión y el precio del diseño, escribiendo únicamente los m².

**Architecture:** Toda la lógica de negocio (precio, plazo, vencimiento, armado de datos) vive en funciones puras bajo `src/lib/propuesta/`, testeadas con Vitest y sin ninguna dependencia de React. La página `/contactos/[id]/propuesta` es una ruta de servidor que arma los datos y los pasa a un componente de presentación. El PDF sale de la impresión del navegador sobre una hoja de estilos A4: sin biblioteca de PDF, sin dependencias nuevas en tiempo de ejecución.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma 7, Tailwind 4, Vitest (nuevo, solo desarrollo).

**Spec:** `docs/propuesta-comercial.md`

## Global Constraints

- **Idioma:** todo en español boliviano, sin españolismos. No hay capa de traducción y no se debe agregar.
- **Moneda:** boliviano. Formato `Bs 4.620` — punto como separador de miles, sin decimales.
- **Fechas:** `dd/mm/aaaa`.
- **Los números del negocio van en un único archivo** (`src/lib/propuesta/constantes.ts`). Nunca escribir 60, 1000, 0.3 ni 10 sueltos en un componente.
- **Tarifa:** 60 Bs/m². **Mínimo por ambiente:** 1.000 Bs. **Anticipo:** 30 %. **Validez:** 10 días corridos. **Plazo:** 1 día hábil cada 10 m², mínimo 5. **Supervisión de obra:** 10 %.
- **Precio = el mayor entre** (m² × 60) y (cantidad de ambientes × 1.000).
- **El 70 % se cobra a la entrega del proyecto final**, nunca "a la aprobación".
- **El ejemplo del 10 % usa Bs 20.000 → Bs 2.000.** Nunca 200.000.
- **La lista de entregables se mantiene deliberadamente poco específica**, con lo visual primero y los planos al final sin detallar. Es una decisión comercial de Bruno: un entregable muy detallado se lleva a un carpintero más barato. No agregar detalle.
- **No agregar dependencias de runtime.** Vitest y sus tipos van en `devDependencies`.
- **Comentarios en español**, explicando el porqué y no el qué, como el resto del repo.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `vitest.config.ts` | Configuración de pruebas (nuevo) |
| `src/lib/propuesta/constantes.ts` | Los números del negocio, un solo lugar |
| `src/lib/propuesta/calculo.ts` | Precio, plazo, reparto, fechas, formatos. Puro. |
| `src/lib/propuesta/calculo.test.ts` | Pruebas de lo anterior |
| `src/lib/entrevista/duelo.ts` | Reconstruir el campeón guardado y elegir la foto de portada. Puro. |
| `src/lib/entrevista/duelo.test.ts` | Pruebas de lo anterior |
| `src/lib/propuesta/tipos.ts` | `PropuestaData` — el objeto que consume la página |
| `src/lib/propuesta/datos.ts` | Arma `PropuestaData` desde contacto + entrevista + galería. Puro. |
| `src/lib/propuesta/datos.test.ts` | Pruebas de lo anterior |
| `src/lib/propuesta/textos.ts` | Los textos fijos del documento |
| `src/app/contactos/[id]/propuesta/page.tsx` | Ruta de servidor: carga y arma |
| `src/app/contactos/[id]/propuesta/Propuesta.tsx` | Las cuatro páginas |
| `src/app/contactos/[id]/propuesta/propuesta.css` | Hoja A4 y estilos de impresión |
| `src/lib/entrevista/types.ts` | **Modificar:** agregar `duelo` |
| `src/app/contactos/[id]/entrevista/steps/DueloStep.tsx` | **Modificar:** guardar y restaurar el campeón |
| `src/app/contactos/[id]/page.tsx` | **Modificar:** botón "Generar propuesta" |

---

### Task 1: Herramienta de pruebas y las fórmulas del negocio

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/propuesta/constantes.ts`
- Create: `src/lib/propuesta/calculo.ts`
- Test: `src/lib/propuesta/calculo.test.ts`
- Modify: `package.json` (scripts y devDependencies)

**Interfaces:**
- Consumes: nada.
- Produces: `parsearM2(texto: string): number | null`, `precioDiseno(m2: number, cantidadAmbientes: number): number`, `plazoDiasHabiles(m2: number): number`, `reparto(precio: number): { anticipo: number; saldo: number }`, `fechaVencimiento(emision: Date): Date`, `formatearBs(monto: number): string`, `formatearFecha(fecha: Date): string`.

- [ ] **Step 1: Instalar Vitest**

```bash
npm install --save-dev vitest
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Las pruebas son de lógica pura: no necesitan DOM ni navegador. El alias
// replica el "@/" del tsconfig para que los imports se vean igual que en la app.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 3: Agregar los scripts a `package.json`**

En el bloque `"scripts"`, junto a los existentes:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: Escribir las pruebas que fallan**

Crear `src/lib/propuesta/calculo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  fechaVencimiento,
  formatearBs,
  formatearFecha,
  parsearM2,
  plazoDiasHabiles,
  precioDiseno,
  reparto,
} from "./calculo";

describe("precioDiseno", () => {
  it("cobra por superficie cuando los m² mandan", () => {
    expect(precioDiseno(150, 6)).toBe(9000);
  });

  it("cobra el mínimo por ambiente cuando son varios ambientes chicos", () => {
    expect(precioDiseno(35, 4)).toBe(4000);
  });

  it("aplica el mínimo a un solo ambiente chico", () => {
    expect(precioDiseno(4, 1)).toBe(1000);
  });

  it("toma el mayor de los dos en la oficina de 77 m² con 5 ambientes", () => {
    expect(precioDiseno(77, 5)).toBe(5000);
  });

  it("funciona aunque todavía no se hayan elegido ambientes", () => {
    expect(precioDiseno(70, 0)).toBe(4200);
  });
});

describe("plazoDiasHabiles", () => {
  it("da 7 días para 70 m², que es el dato real del estudio", () => {
    expect(plazoDiasHabiles(70)).toBe(7);
  });

  it("nunca baja del mínimo de 5 días", () => {
    expect(plazoDiasHabiles(38)).toBe(5);
  });

  it("escala en proyectos grandes", () => {
    expect(plazoDiasHabiles(150)).toBe(15);
  });
});

describe("reparto", () => {
  it("parte 30/70", () => {
    expect(reparto(4620)).toEqual({ anticipo: 1386, saldo: 3234 });
  });

  it("las dos partes siempre suman el precio, aunque haya redondeo", () => {
    const precio = 2351;
    const { anticipo, saldo } = reparto(precio);
    expect(anticipo + saldo).toBe(precio);
  });
});

describe("parsearM2", () => {
  it("lee un número suelto", () => {
    expect(parsearM2("77")).toBe(77);
  });

  it("ignora la unidad escrita a mano", () => {
    expect(parsearM2("77 m2")).toBe(77);
  });

  it("acepta la coma decimal", () => {
    expect(parsearM2("77,5")).toBe(77.5);
  });

  it("devuelve null con el campo vacío", () => {
    expect(parsearM2("")).toBeNull();
  });

  it("devuelve null si no hay ningún número", () => {
    expect(parsearM2("por definir")).toBeNull();
  });
});

describe("formatearBs", () => {
  it("usa el punto como separador de miles", () => {
    expect(formatearBs(4620)).toBe("Bs 4.620");
  });

  it("no pone separador abajo de mil", () => {
    expect(formatearBs(240)).toBe("Bs 240");
  });
});

describe("fechas", () => {
  it("vence a los 10 días corridos, cruzando el fin de mes", () => {
    expect(formatearFecha(fechaVencimiento(new Date(2026, 7, 28)))).toBe("07/09/2026");
  });

  it("formatea en día/mes/año", () => {
    expect(formatearFecha(new Date(2026, 0, 5))).toBe("05/01/2026");
  });
});
```

- [ ] **Step 5: Correr las pruebas y verificar que fallan**

Run: `npm test`
Expected: FAIL — no existe `./calculo`.

- [ ] **Step 6: Crear `src/lib/propuesta/constantes.ts`**

```ts
/**
 * Los números del negocio, en un solo lugar.
 *
 * La fuente de verdad es `BA_ARQUITECTURA/CLAUDE.md`, sección "Condiciones de la
 * propuesta comercial". Si un número cambia allá, se cambia acá y en ningún otro
 * archivo: no debe haber un 60 ni un 1000 sueltos dentro de un componente.
 */

/** Tarifa del diseño, en bolivianos por metro cuadrado. */
export const TARIFA_M2 = 60;

/**
 * Piso por ambiente. Existe porque un baño de 4 m² no da menos trabajo que una
 * sala de 25 — da más detalle por metro. El cruce está en 16,67 m².
 */
export const MINIMO_POR_AMBIENTE = 1000;

/** Ritmo de entrega: un día hábil cada tantos metros cuadrados. */
export const M2_POR_DIA_HABIL = 10;

/** Piso del plazo: ningún proyecto se entrega en menos que esto. */
export const DIAS_HABILES_MINIMO = 5;

/**
 * Días corridos que vale la propuesta. Es corto a propósito: cada vencimiento
 * es una excusa legítima para volver a escribirle al cliente.
 */
export const VALIDEZ_DIAS = 10;

/** Anticipo para arrancar. El 70 % restante se cobra a la entrega. */
export const PORCENTAJE_ANTICIPO = 0.3;

/** Honorarios de dirección y supervisión sobre las partidas supervisadas. */
export const PORCENTAJE_SUPERVISION = 0.1;
```

- [ ] **Step 7: Crear `src/lib/propuesta/calculo.ts`**

```ts
import {
  DIAS_HABILES_MINIMO,
  M2_POR_DIA_HABIL,
  MINIMO_POR_AMBIENTE,
  PORCENTAJE_ANTICIPO,
  TARIFA_M2,
  VALIDEZ_DIAS,
} from "./constantes";

/**
 * Lee la superficie del campo de texto de la entrevista.
 *
 * El campo es libre y la gente escribe "77", "77 m2" o "77,5". Se toma el primer
 * número que aparezca: quitar los caracteres no numéricos no sirve, porque el
 * "2" de "m2" quedaría pegado al número.
 */
export function parsearM2(texto: string): number | null {
  const encontrado = texto.replace(",", ".").match(/\d+(\.\d+)?/);
  if (!encontrado) return null;
  const n = Number.parseFloat(encontrado[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Precio del diseño: el mayor entre cobrar por superficie y cobrar por ambiente. */
export function precioDiseno(m2: number, cantidadAmbientes: number): number {
  const porSuperficie = m2 * TARIFA_M2;
  const porAmbiente = cantidadAmbientes * MINIMO_POR_AMBIENTE;
  return Math.round(Math.max(porSuperficie, porAmbiente));
}

/** Plazo de entrega en días hábiles. */
export function plazoDiasHabiles(m2: number): number {
  return Math.max(DIAS_HABILES_MINIMO, Math.round(m2 / M2_POR_DIA_HABIL));
}

/**
 * Reparte el precio en anticipo y saldo.
 *
 * El saldo se calcula restando y no multiplicando por 0,7: si los dos se
 * redondearan por separado, podrían no sumar el total y el cliente vería una
 * cuenta que no cierra.
 */
export function reparto(precio: number): { anticipo: number; saldo: number } {
  const anticipo = Math.round(precio * PORCENTAJE_ANTICIPO);
  return { anticipo, saldo: precio - anticipo };
}

/** Hasta cuándo vale la propuesta, contando días corridos. */
export function fechaVencimiento(emision: Date): Date {
  const vence = new Date(emision);
  vence.setDate(vence.getDate() + VALIDEZ_DIAS);
  return vence;
}

/**
 * Formatea un monto en bolivianos.
 *
 * El separador se arma a mano en vez de usar `Intl`: así el resultado no depende
 * de qué datos de idioma tenga instalados el servidor donde corre.
 */
export function formatearBs(monto: number): string {
  const entero = Math.round(monto).toString();
  return `Bs ${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** Fecha en día/mes/año, que es el formato que se usa en Bolivia. */
export function formatearFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}
```

- [ ] **Step 8: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS — 18 pruebas en verde.

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/propuesta/
git commit -m "Fórmulas de precio y plazo de la propuesta, con pruebas"
```

---

### Task 2: Guardar el campeón del duelo

Arregla un error que existe hoy: el torneo vive solo en la memoria del componente, así que cambiar de paso lo borra y hay que rehacerlo delante del cliente. Además desbloquea la portada de la propuesta.

**Files:**
- Modify: `src/lib/entrevista/types.ts`
- Create: `src/lib/entrevista/duelo.ts`
- Test: `src/lib/entrevista/duelo.test.ts`
- Modify: `src/app/contactos/[id]/entrevista/steps/DueloStep.tsx`

**Interfaces:**
- Consumes: nada de la Task 1.
- Produces: la interfaz `DueloResultado`, el campo opcional `duelo` en `EntrevistaState`, `campeonGuardado(duelo, estiloFotos): FotoCampeon | null` y `fotoPortada(state, galeria): FotoCampeon | null`, donde `FotoCampeon = { fotoId: string; dataUrl: string; styleName: string; rating: number }`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/lib/entrevista/duelo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { campeonGuardado, fotoPortada } from "./duelo";
import { createInitialEntrevistaState } from "./types";
import type { GaleriaData } from "./galeria";

const galeriaVacia: GaleriaData = {
  estiloFotos: [],
  estiloCustom: [],
  mobiliarioFotos: [],
  mobiliarioCustom: [],
  paletaOficinaFotos: [],
  paletaOficinaCustom: [],
};

const galeria: GaleriaData = {
  ...galeriaVacia,
  estiloFotos: [
    { id: "f1", cardKey: "industrial", dataUrl: "data:image/jpeg;base64,AAA", orden: 0 },
    { id: "f2", cardKey: "industrial", dataUrl: "data:image/jpeg;base64,BBB", orden: 1 },
    { id: "f3", cardKey: "nordico", dataUrl: "data:image/jpeg;base64,CCC", orden: 0 },
  ],
};

const resultado = {
  fotoId: "f2",
  styleKey: "industrial",
  styleName: "Industrial suave",
  rating: 9,
  reaction: "super",
  decididoEn: "2026-08-28T12:00:00.000Z",
};

describe("campeonGuardado", () => {
  it("reconstruye la foto ganadora desde la biblioteca", () => {
    expect(campeonGuardado(resultado, galeria.estiloFotos)).toEqual({
      fotoId: "f2",
      dataUrl: "data:image/jpeg;base64,BBB",
      styleName: "Industrial suave",
      rating: 9,
    });
  });

  it("devuelve null si no hay resultado guardado", () => {
    expect(campeonGuardado(undefined, galeria.estiloFotos)).toBeNull();
  });

  it("devuelve null si la foto fue borrada de la biblioteca", () => {
    expect(campeonGuardado(resultado, [])).toBeNull();
  });
});

describe("fotoPortada", () => {
  it("usa el campeón del duelo cuando existe", () => {
    const state = { ...createInitialEntrevistaState(), duelo: resultado };
    expect(fotoPortada(state, galeria)?.fotoId).toBe("f2");
  });

  it("cae en la foto mejor calificada cuando no hubo duelo", () => {
    const state = createInitialEntrevistaState();
    state.estiloDetalle = {
      industrial: {
        notas: "",
        reacciones: {
          f1: { reaction: "like", rating: 7, comment: "" },
          f2: { reaction: "super", rating: 10, comment: "" },
        },
      },
      nordico: {
        notas: "",
        reacciones: { f3: { reaction: "like", rating: 8, comment: "" } },
      },
    };
    expect(fotoPortada(state, galeria)?.fotoId).toBe("f2");
  });

  it("ignora las fotos que el cliente descartó", () => {
    const state = createInitialEntrevistaState();
    state.estiloDetalle = {
      industrial: {
        notas: "",
        reacciones: { f1: { reaction: "no", rating: 10, comment: "" } },
      },
      nordico: {
        notas: "",
        reacciones: { f3: { reaction: "like", rating: 6, comment: "" } },
      },
    };
    expect(fotoPortada(state, galeria)?.fotoId).toBe("f3");
  });

  it("devuelve null si no hay ninguna foto valorada", () => {
    expect(fotoPortada(createInitialEntrevistaState(), galeria)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npm test`
Expected: FAIL — no existe `./duelo`, y `duelo` no existe en `EntrevistaState`.

- [ ] **Step 3: Agregar el resultado del duelo al estado de la entrevista**

En `src/lib/entrevista/types.ts`, agregar antes de `EntrevistaState`:

```ts
/**
 * El resultado del torneo de fotos.
 *
 * Se guarda para que sobreviva al cambio de paso —antes vivía solo en la memoria
 * del componente y volver al duelo obligaba a rehacerlo entero, delante del
 * cliente— y para que la propuesta pueda usar la foto ganadora como portada.
 *
 * Se guarda el id de la foto y no la foto: la imagen ya vive en la biblioteca
 * compartida, y copiar su base64 acá inflaría el JSON de cada entrevista.
 */
export interface DueloResultado {
  fotoId: string;
  styleKey: string;
  styleName: string;
  rating: number;
  reaction: string;
  /** Cuándo se cerró el torneo, en ISO. */
  decididoEn: string;
}
```

Dentro de `EntrevistaState`, agregar como último campo:

```ts
  /**
   * Opcional a propósito: las entrevistas guardadas antes de que esto existiera
   * no tienen el campo, y `Entrevista.data` es una columna JSON sin migración.
   */
  duelo?: DueloResultado | null;
```

En `createInitialEntrevistaState()`, agregar al final del objeto que devuelve:

```ts
    duelo: null,
```

- [ ] **Step 4: Crear `src/lib/entrevista/duelo.ts`**

```ts
import { styleCards } from "./data";
import type { GaleriaData, GaleriaFotoDTO } from "./galeria";
import type { DueloResultado, EntrevistaState } from "./types";

/** La foto que representa el gusto del cliente, lista para mostrar. */
export interface FotoCampeon {
  fotoId: string;
  dataUrl: string;
  styleName: string;
  rating: number;
}

/** Reconstruye el campeón guardado buscando su foto en la biblioteca compartida. */
export function campeonGuardado(
  duelo: DueloResultado | null | undefined,
  estiloFotos: GaleriaFotoDTO[]
): FotoCampeon | null {
  if (!duelo) return null;
  const foto = estiloFotos.find((f) => f.id === duelo.fotoId);
  if (!foto) return null;
  return {
    fotoId: foto.id,
    dataUrl: foto.dataUrl,
    styleName: duelo.styleName,
    rating: duelo.rating,
  };
}

/**
 * La foto de portada de la propuesta.
 *
 * Primero el campeón del duelo, que es la elección explícita del cliente. Si esa
 * entrevista es anterior a que el duelo se guardara, se cae en la foto mejor
 * calificada: así el documento funciona con todos los clientes ya cargados y no
 * solo con los nuevos.
 */
export function fotoPortada(state: EntrevistaState, galeria: GaleriaData): FotoCampeon | null {
  const delDuelo = campeonGuardado(state.duelo, galeria.estiloFotos);
  if (delDuelo) return delDuelo;

  const nombrePorClave = new Map<string, string>([
    ...styleCards.map((c) => [c.k, c.t] as [string, string]),
    ...galeria.estiloCustom.map((c) => [c.key, c.titulo] as [string, string]),
  ]);

  let mejor: FotoCampeon | null = null;
  for (const foto of galeria.estiloFotos) {
    const reaccion = state.estiloDetalle[foto.cardKey]?.reacciones[foto.id];
    if (!reaccion) continue;
    if (reaccion.reaction !== "like" && reaccion.reaction !== "super") continue;
    if (mejor && reaccion.rating <= mejor.rating) continue;
    mejor = {
      fotoId: foto.id,
      dataUrl: foto.dataUrl,
      styleName: nombrePorClave.get(foto.cardKey) ?? foto.cardKey,
      rating: reaccion.rating,
    };
  }
  return mejor;
}
```

- [ ] **Step 5: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS — las 8 pruebas nuevas y las 18 de la Task 1.

- [ ] **Step 6: Hacer que el duelo se guarde y se restaure**

En `src/app/contactos/[id]/entrevista/steps/DueloStep.tsx`:

Cambiar el import de React (línea 3):

```tsx
import { useEffect, useMemo, useState } from "react";
```

Agregar junto a los otros imports:

```tsx
import { campeonGuardado } from "@/lib/entrevista/duelo";
```

Agregar `fotoId` a `DuelItem` (línea 10):

```tsx
interface DuelItem {
  fotoId: string;
  styleKey: string;
  styleName: string;
  dataUrl: string;
  rating: number;
  reaction: string;
}
```

En `buildPool`, el `pool.push` de la línea 39 pasa a llevar el id:

```tsx
        pool.push({ fotoId: f.id, styleKey: c.k, styleName: c.t, dataUrl: f.dataUrl, rating: r.rating, reaction: r.reaction });
```

Destructurar `setState` en las props del componente (línea 75):

```tsx
export function DueloStep({
  state,
  setState,
  galeria,
}: {
```

Después de la declaración de `pool` (línea 89), agregar:

```tsx
  // El campeón que quedó guardado de una sesión anterior, reconstruido desde la
  // biblioteca. Sin esto, volver al paso mostraba la pantalla de inicio y había
  // que rehacer el torneo entero.
  const guardado = useMemo(
    () => campeonGuardado(state.duelo, galeria.estiloFotos),
    [state.duelo, galeria.estiloFotos]
  );

  // Se guarda apenas se define el campeón. La guarda por fotoId evita volver a
  // escribir el mismo resultado en cada render.
  useEffect(() => {
    const c = duel?.champion;
    if (!c) return;
    setState((s) => {
      if (s.duelo?.fotoId === c.fotoId) return s;
      return {
        ...s,
        duelo: {
          fotoId: c.fotoId,
          styleKey: c.styleKey,
          styleName: c.styleName,
          rating: c.rating,
          reaction: c.reaction,
          decididoEn: new Date().toISOString(),
        },
      };
    });
  }, [duel?.champion, setState]);
```

- [ ] **Step 7: Mostrar el campeón guardado al volver al paso**

En el mismo archivo, el bloque de la línea 215 muestra hoy `duel?.champion`. Reemplazar la condición y las referencias para que también sirva al campeón guardado. Justo antes del `return` del componente, agregar:

```tsx
  // Da igual si el campeón se acaba de decidir o venía guardado: se muestra igual.
  const campeon = duel?.champion
    ? { dataUrl: duel.champion.dataUrl, styleName: duel.champion.styleName, rating: duel.champion.rating, reaction: duel.champion.reaction }
    : guardado
      ? { dataUrl: guardado.dataUrl, styleName: guardado.styleName, rating: guardado.rating, reaction: "super" }
      : null;
```

Y en el JSX, cambiar `{duel?.champion && (` por `{campeon && (`, y dentro de ese bloque reemplazar cada `duel.champion.` por `campeon.`.

- [ ] **Step 8: Verificar tipos y linter**

Run: `npm run dev` una vez para que Next genere los tipos, cortarlo, y después `npx tsc --noEmit` y `npm run lint`
Expected: sin errores ni advertencias nuevas.

- [ ] **Step 9: Commit**

```bash
git add src/lib/entrevista/ "src/app/contactos/[id]/entrevista/steps/DueloStep.tsx"
git commit -m "Guardar el resultado del duelo en la entrevista"
```

---

### Task 3: Armar los datos de la propuesta

**Files:**
- Create: `src/lib/propuesta/tipos.ts`
- Create: `src/lib/propuesta/datos.ts`
- Test: `src/lib/propuesta/datos.test.ts`

**Interfaces:**
- Consumes: todo lo de la Task 1 y `fotoPortada` de la Task 2.
- Produces: la interfaz `PropuestaData` y `armarPropuesta(entrada: EntradaPropuesta): PropuestaData | { falta: "m2" }`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/lib/propuesta/datos.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { armarPropuesta } from "./datos";
import { createInitialEntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";

const galeria: GaleriaData = {
  estiloFotos: [{ id: "f1", cardKey: "industrial", dataUrl: "data:image/jpeg;base64,AAA", orden: 0 }],
  estiloCustom: [],
  mobiliarioFotos: [],
  mobiliarioCustom: [],
  paletaOficinaFotos: [],
  paletaOficinaCustom: [],
};

function entradaBase() {
  const state = createInitialEntrevistaState();
  state.proyecto.tipoProyecto = "oficina";
  state.proyecto.m2 = "77";
  state.ambientesSeleccion = ["Recepción", "Sala de reuniones", "Área de trabajo", "Cocina", "Baño"];
  state.cierre.palabra = "ordenado";
  state.cierre.evitar = "los ambientes fríos de oficina";
  // El paso de materiales guarda el nombre visible, no una clave interna.
  state.materiales.seleccion = ["Madera clara", "Metal negro mate"];
  return { nombreCliente: "Estudio Vega", state, galeria, emision: new Date(2026, 7, 28) };
}

describe("armarPropuesta", () => {
  it("avisa cuando falta la superficie en vez de inventar un precio", () => {
    const entrada = entradaBase();
    entrada.state.proyecto.m2 = "";
    expect(armarPropuesta(entrada)).toEqual({ falta: "m2" });
  });

  it("calcula el precio tomando el mayor entre superficie y ambientes", () => {
    const p = armarPropuesta(entradaBase());
    expect("falta" in p).toBe(false);
    if ("falta" in p) return;
    expect(p.precio).toBe(5000);
    expect(p.precioTexto).toBe("Bs 5.000");
  });

  it("reparte el pago en 30 y 70", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.anticipoTexto).toBe("Bs 1.500");
    expect(p.saldoTexto).toBe("Bs 3.500");
  });

  it("pone la fecha de vencimiento a diez días", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.venceTexto).toBe("07/09/2026");
  });

  it("calcula el plazo según la superficie", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.plazoDias).toBe(8);
  });

  it("titula el proyecto según su tipo", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.titulo).toBe("Diseño integral de oficina");
  });

  it("arrastra lo que dijo el cliente en la entrevista", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.palabra).toBe("ordenado");
    expect(p.evitar).toBe("los ambientes fríos de oficina");
    expect(p.ambientes).toHaveLength(5);
    expect(p.materiales).toEqual(["Madera clara", "Metal negro mate"]);
  });
});
```

- [ ] **Step 2: Correr las pruebas y verificar que fallan**

Run: `npm test`
Expected: FAIL — no existe `./datos`.

- [ ] **Step 3: Crear `src/lib/propuesta/tipos.ts`**

```ts
import type { FotoCampeon } from "@/lib/entrevista/duelo";

/** Un color de la paleta elegida, listo para pintar un cuadradito. */
export interface ColorPaleta {
  nombre: string;
  hex: string;
}

/**
 * Todo lo que la propuesta necesita para renderizarse, ya calculado y formateado.
 *
 * La página no hace cuentas ni consulta la base: recibe esto y lo dibuja.
 */
export interface PropuestaData {
  /* Portada */
  nombreCliente: string;
  titulo: string;
  portada: FotoCampeon | null;
  emisionTexto: string;
  venceTexto: string;

  /* Lo que nos dijiste */
  palabra: string;
  evitar: string;
  estilos: string[];
  ambientes: string[];
  materiales: string[];
  paleta: ColorPaleta[];

  /* Inversión */
  m2: number;
  m2Texto: string;
  cantidadAmbientes: number;
  precio: number;
  precioTexto: string;
  tarifaTexto: string;
  anticipoTexto: string;
  saldoTexto: string;
  plazoDias: number;
}
```

- [ ] **Step 4: Crear `src/lib/propuesta/datos.ts`**

```ts
import { paletteDefs, styleCards } from "@/lib/entrevista/data";
import { fotoPortada } from "@/lib/entrevista/duelo";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import type { EntrevistaState, TipoProyecto } from "@/lib/entrevista/types";
import {
  fechaVencimiento,
  formatearBs,
  formatearFecha,
  parsearM2,
  plazoDiasHabiles,
  precioDiseno,
  reparto,
} from "./calculo";
import { TARIFA_M2 } from "./constantes";
import type { ColorPaleta, PropuestaData } from "./tipos";

export interface EntradaPropuesta {
  nombreCliente: string;
  state: EntrevistaState;
  galeria: GaleriaData;
  /** Se inyecta para que las pruebas no dependan del día en que corren. */
  emision: Date;
}

const TITULO_POR_TIPO: Record<TipoProyecto, string> = {
  "": "Propuesta de diseño",
  vivienda: "Diseño integral de vivienda",
  oficina: "Diseño integral de oficina",
  "ambiente-unico": "Diseño de ambiente",
  construccion: "Diseño y construcción",
};

/** Traduce claves internas a los nombres que ve el cliente. */
function nombresDe(claves: string[], catalogo: { k: string; t: string }[]): string[] {
  return claves.map((k) => catalogo.find((c) => c.k === k)?.t ?? k);
}

export function armarPropuesta(entrada: EntradaPropuesta): PropuestaData | { falta: "m2" } {
  const { nombreCliente, state, galeria, emision } = entrada;

  // Sin superficie no hay precio, y un precio inventado es peor que ninguno.
  const m2 = parsearM2(state.proyecto.m2);
  if (m2 === null) return { falta: "m2" };

  const cantidadAmbientes = state.ambientesSeleccion.length;
  const precio = precioDiseno(m2, cantidadAmbientes);
  const { anticipo, saldo } = reparto(precio);

  const estilosCatalogo = [
    ...styleCards.map((c) => ({ k: c.k, t: c.t })),
    ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo })),
  ];

  const paleta: ColorPaleta[] = state.paleta.seleccion.flatMap((clave) => {
    const def = paletteDefs.find((p) => p.key === clave);
    if (!def) return [];
    return def.colores.map((c) => ({ nombre: c.n, hex: c.h }));
  });

  return {
    nombreCliente,
    titulo: TITULO_POR_TIPO[state.proyecto.tipoProyecto],
    portada: fotoPortada(state, galeria),
    emisionTexto: formatearFecha(emision),
    venceTexto: formatearFecha(fechaVencimiento(emision)),

    palabra: state.cierre.palabra,
    evitar: state.cierre.evitar,
    estilos: nombresDe(state.estilo.seleccion, estilosCatalogo),
    ambientes: state.ambientesSeleccion,
    // El paso de materiales ya guarda el nombre visible ("Madera clara"), no una
    // clave: acá no hay nada que traducir.
    materiales: state.materiales.seleccion,
    paleta,

    m2,
    m2Texto: `${m2} m²`,
    cantidadAmbientes,
    precio,
    precioTexto: formatearBs(precio),
    tarifaTexto: `Bs ${TARIFA_M2}/m²`,
    anticipoTexto: formatearBs(anticipo),
    saldoTexto: formatearBs(saldo),
    plazoDias: plazoDiasHabiles(m2),
  };
}
```

Formas verificadas en `src/lib/entrevista/data.ts` sobre el commit `c70ae99`: `styleCards` usa `k`/`t`; `paletteDefs` usa `key`, `nombre` y `colores: { n, h }[]`; `materialCards` usa `n`/`css` y el paso guarda directamente el `n`, por eso no se importa acá.

- [ ] **Step 5: Correr las pruebas y verificar que pasan**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/propuesta/
git commit -m "Armado de los datos de la propuesta desde la entrevista"
```

---

### Task 4: Los textos fijos del documento

**Files:**
- Create: `src/lib/propuesta/textos.ts`

**Interfaces:**
- Consumes: `PORCENTAJE_SUPERVISION` de la Task 1.
- Produces: `TEXTOS`, un objeto con todo el copy fijo del documento.

- [ ] **Step 1: Crear `src/lib/propuesta/textos.ts`**

```ts
/**
 * Los textos que no cambian de una propuesta a otra.
 *
 * Viven acá y no dentro del componente para que se puedan revisar y corregir sin
 * tocar el maquetado, y para que quede claro qué es fijo y qué se calcula.
 */
export const TEXTOS = {
  intro:
    "Desarrollar un espacio moderno, funcional y profesional, optimizando la distribución y generando una propuesta coherente con la identidad y las necesidades del cliente.",

  alcance: [
    "Análisis y levantamiento de las condiciones actuales.",
    "Redistribución y optimización de los espacios.",
    "Diseño integral de interiores y mobiliario.",
    "Materiales, colores, acabados e iluminación.",
    "Ergonomía, funcionalidad e identidad visual.",
    "Planos de distribución, elevaciones, cortes y detalles.",
    "Visualizaciones 3D de los espacios principales.",
    "Reuniones de coordinación y revisión.",
  ],

  metodologia: [
    { n: "01", titulo: "Diseño", texto: "Análisis, distribución, interiorismo, mobiliario, materiales y visualización 3D." },
    { n: "02", titulo: "Presupuesto", texto: "Con el diseño aprobado se cotizan partidas, materiales, mano de obra y proveedores." },
    { n: "03", titulo: "Ejecución", texto: "Dirección y supervisión de los trabajos conforme al diseño y especificaciones aprobadas." },
  ],

  /**
   * El orden es deliberado: lo visual primero y los planos al final, sin detallar.
   * Un entregable muy especificado se lleva a un carpintero más barato, y además
   * se convierte después en una lista de reclamos. El alcance fino se conversa.
   */
  queRecibis: [
    "Visualizaciones arquitectónicas hiperrealistas de cada ambiente.",
    "Recorrido virtual interactivo: vas a caminar tu proyecto antes de que exista.",
    "Planos generales del proyecto.",
    "2 rondas de ajustes incluidas.",
  ],

  supervisionIntro:
    "Los honorarios profesionales por este servicio corresponden al 10% del costo total de las partidas de obra bajo nuestra dirección y supervisión.",

  supervisionIncluye: [
    "Obra civil y albañilería.",
    "Revestimientos, pisos, cielos falsos, pintura y acabados.",
    "Carpintería fija y mobiliario diseñado para el proyecto.",
    "Instalaciones eléctricas, iluminación y sanitarias incorporadas al alcance.",
    "Elementos arquitectónicos y de interiorismo.",
    "Coordinación de contratistas y proveedores.",
    "Seguimiento del avance y correcta ejecución.",
  ],

  supervisionExcluye: [
    "Computadoras y equipos tecnológicos.",
    "Equipos de oficina y electrodomésticos.",
    "Climatización adquirida como producto terminado.",
    "Mobiliario prefabricado adquirido directamente.",
    "Decoración, accesorios y otros bienes terminados.",
    "Bienes que no requieran dirección o supervisión directa.",
  ],

  /**
   * El ejemplo usa 20.000 y no 200.000: el número grande asustaba, y 20.000 es el
   * piso real de las ejecuciones de interiores del estudio. Un ejemplo
   * conservador resulta más creíble.
   */
  supervisionEjemplo:
    "Si las partidas bajo nuestra dirección y supervisión ascienden a Bs 20.000, los honorarios profesionales serían Bs 2.000.",

  inicio:
    "Una vez aceptada la propuesta y realizado el pago inicial, coordinamos el levantamiento de información y el comienzo del diseño.",

  pieDePagina: "Bruno Aldana · Arquitectura · Interiorismo · Diseño · Construcción",
} as const;
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/propuesta/textos.ts
git commit -m "Textos fijos de la propuesta comercial"
```

---

### Task 5: La hoja y las páginas 1 y 2

**Files:**
- Create: `src/app/contactos/[id]/propuesta/propuesta.css`
- Create: `src/app/contactos/[id]/propuesta/Propuesta.tsx`
- Create: `src/app/contactos/[id]/propuesta/page.tsx`

**Interfaces:**
- Consumes: `PropuestaData` (Task 3), `armarPropuesta` (Task 3), `TEXTOS` (Task 4).
- Produces: el componente `Propuesta({ datos }: { datos: PropuestaData })` y la ruta `/contactos/[id]/propuesta`.

- [ ] **Step 1: Crear `src/app/contactos/[id]/propuesta/propuesta.css`**

```css
/*
 * Hoja A4 para la propuesta.
 *
 * El PDF sale de la impresión del navegador: no hace falta ninguna biblioteca, y
 * lo que Bruno ve en pantalla es exactamente lo que se guarda. Al imprimir se
 * apaga todo el chrome de la aplicación y quedan solo las cuatro hojas.
 */

.propuesta {
  --hoja-ancho: 210mm;
  --hoja-alto: 297mm;
  --margen: 16mm;
  --tinta: #17191c;
  --tinta-suave: #565d66;
  --tenue: #9aa0a8;
  --linea: #dee1e5;
  --acento: #3d6bef;
  --papel: #ffffff;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12mm;
  padding: 12mm 0;
  background: #eef0f2;
}

.hoja {
  position: relative;
  width: var(--hoja-ancho);
  min-height: var(--hoja-alto);
  padding: var(--margen);
  background: var(--papel);
  color: var(--tinta);
  box-shadow: 0 2px 4px rgba(14, 15, 17, 0.08), 0 24px 48px -16px rgba(14, 15, 17, 0.28);
  overflow: hidden;
  break-inside: avoid;
}

/* El filo de acento, el mismo recurso que ya usaba el PDF anterior. */
.hoja::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3mm;
  background: var(--acento);
}

/* La portada es la única hoja oscura, y sangra la foto de punta a punta. */
.hoja-portada {
  padding: 0;
  background: #0e0f11;
  color: #f7f8f9;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.portada-foto {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* El mismo grado frío que usa la aplicación, para que la portada pertenezca
     al mismo sistema visual que la ficha de entrevista. */
  filter: saturate(0.5) contrast(1.1) brightness(0.62);
}

.portada-velo {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(14, 15, 17, 0.96) 20%, rgba(14, 15, 17, 0.35) 70%, rgba(14, 15, 17, 0.55));
}

.portada-contenido {
  position: relative;
  padding: var(--margen);
  display: flex;
  flex-direction: column;
  gap: 6mm;
}

.rotulo {
  font-family: var(--font-mono), monospace;
  font-size: 8pt;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--tenue);
}

.hoja-portada .rotulo { color: #c2c7cd; }

.titulo-portada {
  font-family: var(--font-display), sans-serif;
  font-weight: 300;
  font-size: 32pt;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0;
  text-wrap: balance;
}

.datos-portada {
  display: flex;
  flex-wrap: wrap;
  gap: 3mm 10mm;
  padding-top: 5mm;
  border-top: 1px solid rgba(247, 248, 249, 0.25);
}

.dato-etiqueta {
  font-family: var(--font-mono), monospace;
  font-size: 7pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9aa0a8;
  display: block;
  margin-bottom: 1mm;
}

.dato-valor { font-size: 11pt; font-weight: 500; }

/* --- Hojas de contenido --- */

.cabecera-hoja {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 4mm;
  margin-bottom: 8mm;
  border-bottom: 1px solid var(--linea);
}

.titulo-seccion {
  font-family: var(--font-display), sans-serif;
  font-weight: 400;
  font-size: 18pt;
  letter-spacing: -0.015em;
  margin: 0 0 5mm;
}

.propuesta h3 {
  font-family: var(--font-mono), monospace;
  font-size: 8pt;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tinta-suave);
  margin: 0 0 3mm;
  font-weight: 500;
}

.propuesta p { font-size: 10pt; line-height: 1.6; margin: 0 0 4mm; }
.propuesta ul { font-size: 10pt; line-height: 1.6; margin: 0 0 5mm; padding-left: 5mm; }
.propuesta li { margin-bottom: 1.5mm; }

.dos-columnas { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }

.cita {
  font-family: var(--font-display), sans-serif;
  font-weight: 300;
  font-size: 20pt;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0 0 6mm;
  text-wrap: balance;
}

.etiquetas { display: flex; flex-wrap: wrap; gap: 2mm; margin-bottom: 6mm; }

.etiqueta {
  font-size: 9pt;
  padding: 1.5mm 3.5mm;
  border-radius: 99px;
  background: #eef0f2;
  color: var(--tinta);
}

.paleta { display: flex; gap: 2mm; margin-bottom: 6mm; }
.color { flex: 1; }
.color-muestra { height: 14mm; border-radius: 2mm; border: 1px solid rgba(14, 15, 17, 0.08); }
.color-nombre { font-size: 7.5pt; color: var(--tinta-suave); margin-top: 1.5mm; display: block; }

.pie-hoja {
  position: absolute;
  left: var(--margen);
  right: var(--margen);
  bottom: 10mm;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono), monospace;
  font-size: 7pt;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--tenue);
  padding-top: 3mm;
  border-top: 1px solid var(--linea);
}

/* --- Impresión --- */

@page { size: A4; margin: 0; }

@media print {
  /* Fuera todo lo que no es la propuesta: encabezado de la app, botones, fondo. */
  body > *:not(.propuesta-raiz) { display: none !important; }
  .no-imprimir { display: none !important; }

  .propuesta { gap: 0; padding: 0; background: none; }
  .hoja {
    box-shadow: none;
    break-after: page;
    min-height: var(--hoja-alto);
  }
  .hoja:last-child { break-after: auto; }

  /* Sin esto el navegador descarta los fondos y la portada sale en blanco. */
  .hoja-portada, .portada-foto, .portada-velo, .etiqueta, .color-muestra {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

@media screen and (max-width: 230mm) {
  /* En el celular la hoja no entra: se deja escalar para poder revisarla. */
  .propuesta { padding: 4mm; }
  .hoja { width: 100%; min-height: auto; }
}
```

- [ ] **Step 2: Crear `src/app/contactos/[id]/propuesta/Propuesta.tsx` con las páginas 1 y 2**

```tsx
"use client";

import Image from "next/image";
import { TEXTOS } from "@/lib/propuesta/textos";
import type { PropuestaData } from "@/lib/propuesta/tipos";
import "./propuesta.css";

function PieHoja({ n }: { n: string }) {
  return (
    <div className="pie-hoja">
      <span>{TEXTOS.pieDePagina}</span>
      <span>{n}</span>
    </div>
  );
}

/**
 * El encabezado lleva solo la sección. La marca va una vez por hoja, en el pie:
 * en el PDF anterior aparecía tres veces en la misma página.
 */
function CabeceraHoja({ seccion }: { seccion: string }) {
  return (
    <div className="cabecera-hoja">
      <span className="rotulo">{seccion}</span>
    </div>
  );
}

export function Propuesta({ datos }: { datos: PropuestaData }) {
  return (
    <div className="propuesta-raiz">
      <div className="no-imprimir mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <p className="text-sm text-neutral-500">
          Revisá el documento y guardalo como PDF desde el diálogo de impresión.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Guardar como PDF
        </button>
      </div>

      <div className="propuesta">
        {/* ---------- 01 · Portada ---------- */}
        <section className="hoja hoja-portada">
          {datos.portada && (
            <Image
              className="portada-foto"
              src={datos.portada.dataUrl}
              alt=""
              fill
              unoptimized
              sizes="210mm"
            />
          )}
          <div className="portada-velo" />
          <div className="portada-contenido">
            <span className="rotulo">Propuesta de diseño</span>
            <h1 className="titulo-portada">{datos.titulo}</h1>
            <div className="datos-portada">
              <div>
                <span className="dato-etiqueta">Cliente</span>
                <span className="dato-valor">{datos.nombreCliente}</span>
              </div>
              <div>
                <span className="dato-etiqueta">Superficie</span>
                <span className="dato-valor">{datos.m2Texto}</span>
              </div>
              <div>
                <span className="dato-etiqueta">Emitida</span>
                <span className="dato-valor">{datos.emisionTexto}</span>
              </div>
              <div>
                <span className="dato-etiqueta">Válida hasta</span>
                <span className="dato-valor">{datos.venceTexto}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 02 · Lo que nos dijiste ---------- */}
        <section className="hoja">
          <CabeceraHoja seccion="Lo que nos dijiste" />
          <h2 className="titulo-seccion">Lo que nos dijiste</h2>

          {datos.palabra && (
            <p className="cita">«Buscás un espacio {datos.palabra}.»</p>
          )}

          {datos.evitar && (
            <>
              <h3>Lo que querés evitar</h3>
              <p>{datos.evitar}</p>
            </>
          )}

          {datos.estilos.length > 0 && (
            <>
              <h3>Tu estilo</h3>
              <div className="etiquetas">
                {datos.estilos.map((e) => (
                  <span key={e} className="etiqueta">{e}</span>
                ))}
              </div>
            </>
          )}

          {datos.paleta.length > 0 && (
            <>
              <h3>Tu paleta</h3>
              <div className="paleta">
                {datos.paleta.map((c) => (
                  <div key={c.hex} className="color">
                    <div className="color-muestra" style={{ background: c.hex }} />
                    <span className="color-nombre">{c.nombre}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {datos.materiales.length > 0 && (
            <>
              <h3>Materiales que te gustaron</h3>
              <div className="etiquetas">
                {datos.materiales.map((m) => (
                  <span key={m} className="etiqueta">{m}</span>
                ))}
              </div>
            </>
          )}

          {datos.ambientes.length > 0 && (
            <>
              <h3>Ambientes a intervenir</h3>
              <div className="etiquetas">
                {datos.ambientes.map((a) => (
                  <span key={a} className="etiqueta">{a}</span>
                ))}
              </div>
            </>
          )}

          <PieHoja n="02" />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/app/contactos/[id]/propuesta/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createInitialEntrevistaState, type EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { armarPropuesta } from "@/lib/propuesta/datos";
import { Propuesta } from "./Propuesta";

export default async function PropuestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  const entrevista = await prisma.entrevista.findFirst({
    where: { contactoId: id },
    orderBy: { createdAt: "desc" },
  });

  const [estiloFotos, estiloCustom] = await Promise.all([
    prisma.galeriaFoto.findMany({ where: { tipo: "ESTILO" }, orderBy: { orden: "asc" } }),
    prisma.galeriaCardCustom.findMany({ where: { tipo: "ESTILO" }, orderBy: { createdAt: "asc" } }),
  ]);

  // Solo hace falta la galería de estilo: es de donde salen la portada y los
  // nombres de los estilos elegidos.
  const galeria: GaleriaData = {
    estiloFotos: estiloFotos.map((f) => ({ id: f.id, cardKey: f.cardKey, dataUrl: f.dataUrl, orden: f.orden })),
    estiloCustom: estiloCustom.map((c) => ({
      id: c.id,
      key: c.key,
      titulo: c.titulo,
      mood: c.mood,
      descripcion: c.descripcion,
      facts: c.facts as unknown as { k: string; v: string }[],
    })),
    mobiliarioFotos: [],
    mobiliarioCustom: [],
    paletaOficinaFotos: [],
    paletaOficinaCustom: [],
  };

  const state = (entrevista?.data as unknown as EntrevistaState) ?? createInitialEntrevistaState();
  const datos = armarPropuesta({
    nombreCliente: contacto.nombre,
    state,
    galeria,
    emision: new Date(),
  });

  if ("falta" in datos) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display mb-3 text-2xl font-light text-neutral-900">
          Falta la superficie
        </h1>
        <p className="mb-6 text-neutral-500">
          Para calcular el precio hace falta cargar los metros cuadrados en el paso de
          Datos generales de la entrevista.
        </p>
        <Link
          href={`/contactos/${id}/entrevista`}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Ir a la entrevista
        </Link>
      </main>
    );
  }

  return <Propuesta datos={datos} />;
}
```

- [ ] **Step 4: Verificar en el navegador**

Run: `npm run dev`, abrir `/contactos/<id>/propuesta` de un contacto con entrevista y m² cargados.
Expected: se ven dos hojas A4; la portada con la foto ganadora y la página 2 con lo que dijo el cliente.

- [ ] **Step 5: Commit**

```bash
git add "src/app/contactos/[id]/propuesta/"
git commit -m "Propuesta: hoja A4, portada y la página del resumen de la entrevista"
```

---

### Task 6: Las páginas 3 y 4

**Files:**
- Modify: `src/app/contactos/[id]/propuesta/Propuesta.tsx`

**Interfaces:**
- Consumes: todo lo de la Task 5.
- Produces: nada nuevo.

- [ ] **Step 1: Agregar las dos hojas restantes**

En `Propuesta.tsx`, después de la sección de la página 02 y antes del `</div>` que cierra `.propuesta`:

```tsx
        {/* ---------- 03 · La propuesta ---------- */}
        <section className="hoja">
          <CabeceraHoja seccion="Propuesta · Alcance" />
          <h2 className="titulo-seccion">Propuesta de servicio</h2>
          <p>{TEXTOS.intro}</p>

          <div className="dos-columnas">
            <div>
              <h3>Alcance del diseño</h3>
              <ul>
                {TEXTOS.alcance.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
            <div>
              <h3>Metodología</h3>
              {TEXTOS.metodologia.map((m) => (
                <p key={m.n}>
                  <strong>{m.n} · {m.titulo}</strong>
                  <br />
                  {m.texto}
                </p>
              ))}
            </div>
          </div>

          <h3>Qué recibís</h3>
          <ul>
            {TEXTOS.queRecibis.map((q) => <li key={q}>{q}</li>)}
            <li>Entrega en <strong>{datos.plazoDias} días hábiles</strong>.</li>
          </ul>

          <PieHoja n="03" />
        </section>

        {/* ---------- 04 · Inversión ---------- */}
        <section className="hoja">
          <CabeceraHoja seccion="Inversión" />
          <h2 className="titulo-seccion">Inversión en diseño</h2>

          <table className="tabla-inversion">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="num">Superficie</th>
                <th className="num">Tarifa</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{datos.titulo}</td>
                <td className="num">{datos.m2Texto}</td>
                <td className="num">{datos.tarifaTexto}</td>
                <td className="num total">{datos.precioTexto}</td>
              </tr>
            </tbody>
          </table>

          <div className="franja-pago">
            <h3>Forma de pago</h3>
            <div className="dos-columnas">
              <p><strong>30% · {datos.anticipoTexto}</strong><br />Al inicio</p>
              <p><strong>70% · {datos.saldoTexto}</strong><br />A la entrega del proyecto final</p>
            </div>
          </div>

          <p className="vencimiento">
            Esta propuesta tiene validez hasta el <strong>{datos.venceTexto}</strong>.
          </p>

          <h2 className="titulo-seccion" style={{ marginTop: "8mm" }}>
            Dirección, coordinación y supervisión · 10%
          </h2>
          <p>{TEXTOS.supervisionIntro}</p>

          <div className="dos-columnas">
            <div>
              <h3>Incluye</h3>
              <ul>{TEXTOS.supervisionIncluye.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
            <div>
              <h3>No forma parte de la base del 10%</h3>
              <ul>{TEXTOS.supervisionExcluye.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          </div>

          <p className="ejemplo"><strong>Ejemplo.</strong> {TEXTOS.supervisionEjemplo}</p>

          <h3>Inicio</h3>
          <p>{TEXTOS.inicio}</p>

          <PieHoja n="04" />
        </section>
```

- [ ] **Step 2: Agregar los estilos de la página de inversión**

Al final de `propuesta.css`, antes del bloque `@page`:

```css
/* La inversión es lo primero que busca el ojo del cliente: se trata en grande,
   no como una nota al pie. En el PDF anterior era el título más chico. */
.tabla-inversion {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
  font-variant-numeric: tabular-nums;
  margin-bottom: 6mm;
}

.tabla-inversion th {
  font-family: var(--font-mono), monospace;
  font-size: 7pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--tinta-suave);
  text-align: left;
  font-weight: 500;
  padding-bottom: 2mm;
  border-bottom: 1px solid var(--tinta);
}

.tabla-inversion td { padding: 4mm 0; border-bottom: 1px solid var(--linea); }
.tabla-inversion .num { text-align: right; }
.tabla-inversion .total { font-size: 14pt; font-weight: 600; }

.franja-pago { background: #f7f8f9; padding: 5mm; border-radius: 2mm; margin-bottom: 5mm; }
.franja-pago p { margin: 0; }

.vencimiento {
  border-left: 2px solid var(--acento);
  padding-left: 4mm;
  color: var(--tinta-suave);
}

.ejemplo { background: #f7f8f9; padding: 4mm 5mm; border-radius: 2mm; font-size: 9.5pt; }
```

- [ ] **Step 3: Verificar la impresión**

Run: `npm run dev`, abrir la propuesta y apretar "Guardar como PDF".
Expected: cuatro hojas A4, una por página, sin cortes a mitad de sección y con la portada en negro con su foto.

- [ ] **Step 4: Commit**

```bash
git add "src/app/contactos/[id]/propuesta/"
git commit -m "Propuesta: páginas de alcance e inversión"
```

---

### Task 7: El botón para llegar a la propuesta

**Files:**
- Modify: `src/app/contactos/[id]/page.tsx`
- Modify: `src/app/contactos/[id]/entrevista/steps/DatosGeneralesStep.tsx`

**Interfaces:**
- Consumes: la ruta de la Task 5.
- Produces: nada.

- [ ] **Step 1: Agregar el botón en la ficha del contacto**

En `src/app/contactos/[id]/page.tsx`, en el grupo de botones que ya contiene "Ficha de entrevista", agregar antes de "Editar":

```tsx
            <Button href={`/contactos/${contacto.id}/propuesta`} size="sm">
              Generar propuesta
            </Button>
```

- [ ] **Step 2: Aclarar el campo de superficie en la entrevista**

En `src/app/contactos/[id]/entrevista/steps/DatosGeneralesStep.tsx`, buscar el campo de `m2` y agregar debajo del input:

```tsx
        <p className="mt-1.5 text-xs text-neutral-500">
          De acá sale el precio de la propuesta. Escribí solo el número.
        </p>
```

- [ ] **Step 3: Verificar el recorrido completo**

Run: `npm run dev`
Recorrido: abrir un contacto → "Ficha de entrevista" → cargar m² y elegir ambientes → volver al contacto → "Generar propuesta" → "Guardar como PDF".
Expected: el PDF sale con el precio correcto según la fórmula.

- [ ] **Step 4: Verificación final**

Run: `npm test` y después `npx tsc --noEmit` y `npm run lint`
Expected: todas las pruebas en verde, sin errores de tipos, sin advertencias nuevas.

- [ ] **Step 5: Commit**

```bash
git add "src/app/contactos/[id]/page.tsx" "src/app/contactos/[id]/entrevista/steps/DatosGeneralesStep.tsx"
git commit -m "Botón para generar la propuesta desde la ficha del contacto"
```

---

## Qué queda deliberadamente afuera

- La herramienta de relevamiento y el cálculo automático de superficie. Los m² se escriben a mano; cuando exista, se llena ese mismo campo y nada más cambia.
- El envío por WhatsApp y la página de solo lectura para el cliente.
- La edición de los textos variables desde la interfaz. Por ahora los textos fijos viven en `textos.ts` y se cambian ahí.
- El bot de WhatsApp y el CRM.
