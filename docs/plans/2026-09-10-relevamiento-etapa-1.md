# Relevamiento, etapa 1 — Plan de implementación

> **Para quien lo ejecute:** SUB-SKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementarlo tarea por tarea. Los pasos usan casillas (`- [ ]`) para marcar el avance.

**Objetivo:** que Bruno releve un ambiente desde el iPhone, sin internet, con formas rápidas o recorrido, cargue puertas y ventanas con sus siete datos, vea el control de cierre, y descargue el plano y el archivo "ba-relevamiento".

**Arquitectura:** un motor de funciones puras en `src/lib/relevamiento/` (formato, geometría, controles, voz, sincronización) probado con `vitest`; una sola página cliente en `/contactos/[id]/relevamiento` que guarda todo en IndexedDB y sincroniza con una Server Action; un service worker propio y un manifiesto para abrir sin señal.

**Stack:** Next.js 16.3.3 (App Router) · React 19 · TypeScript · Prisma 7 + Neon · zod 4 · Tailwind 4 · vitest 4.

**Diseño:** `docs/plans/2026-09-10-modulo-relevamiento.md`. Leerlo antes de empezar.

## Restricciones globales

- **Unidades:** todas las medidas del formato son centímetros enteros. En pantalla, coma decimal.
- **Idioma:** español de Bolivia, sin españolismos. Sin capa de traducción.
- **Marca:** grafito, Archivo y JetBrains Mono, sin color de acento. Reusar `Button`, `Card`, `Badge`, `inputClass`, `labelClass`.
- **Next 16:** antes de tocar `next.config.ts`, el manifiesto o el service worker, leer `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` y `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`. El `AGENTS.md` lo exige.
- **La base de datos es la de producción.** La app local y la publicada usan la misma base de Neon. Toda migración debe ser solo aditiva (crear tablas e índices), revisada a mano antes de aplicarse. Nunca `prisma migrate reset`, nunca `prisma db push`.
- **Pruebas:** `vitest` corre en entorno `node`, sin DOM; solo se prueba lógica pura. Archivos `src/**/*.test.ts`.
- **Commits:** en la rama `modulo-relevamiento`, mensajes en español que describen el resultado. Cada mensaje termina con:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB
  ```
- **No publicar.** Nada de `git push` ni de deploy: lo decide Bruno.

## Un cambio respecto del diseño

El diseño proponía una ruta por ambiente (`/relevamiento/[ambienteId]`) y otra para el plano. **Este plan usa una sola ruta** y cambia de ambiente y de vista dentro del estado del componente. Sin conexión, cada navegación entre rutas de Next pide datos al servidor y falla; una sola página cliente que lee IndexedDB sigue funcionando. La vista de impresión del plano es un modo de esa misma página.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/relevamiento/formato.ts` | Tipos y esquema zod del formato "ba-relevamiento"; crear un relevamiento vacío |
| `src/lib/relevamiento/geometria.ts` | Formas y recorrido a polígono; cierre, superficie, perímetro, diagonales |
| `src/lib/relevamiento/controles.ts` | Control de cierre: hallazgos de error, aviso y ok |
| `src/lib/relevamiento/voz.ts` | Frase dictada → centímetros |
| `src/lib/relevamiento/sincronizacion.ts` | Decidir qué hacer entre la copia del teléfono y la del servidor |
| `src/lib/relevamiento/almacen.ts` | Leer y escribir el relevamiento en IndexedDB |
| `src/lib/relevamiento/descarga.ts` | Nombre y descarga del archivo "ba-relevamiento" |
| `prisma/schema.prisma` + migración | Modelo `Relevamiento` |
| `src/app/contactos/[id]/relevamiento/actions.ts` | Server Action de guardado con control de versión |
| `src/app/contactos/[id]/relevamiento/page.tsx` | Carga inicial desde la base |
| `src/app/contactos/[id]/relevamiento/sincronizador.ts` | Guardar en el teléfono y subir al servidor, con reintentos |
| `src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx` | La pantalla: ambientes, plano, pestañas y estado de sincronización |
| `src/app/contactos/[id]/relevamiento/VistaPlano.tsx` | El plano limpio para imprimir o guardar como PDF |
| `src/app/contactos/[id]/relevamiento/PlanoSvg.tsx` | Dibujo del ambiente con cotas |
| `src/app/contactos/[id]/relevamiento/CampoMedida.tsx` | Campo de medida con teclado, voz y láser |
| `src/app/contactos/[id]/relevamiento/PanelParedes.tsx` | Carga por forma rápida o por recorrido |
| `src/app/contactos/[id]/relevamiento/PanelAberturas.tsx` | Puertas y ventanas con sus siete datos |
| `src/app/contactos/[id]/relevamiento/ControlCierre.tsx` | Lista del control de cierre |
| `src/app/manifest.ts`, `public/sw.js`, `src/components/RegistroServiceWorker.tsx` | Instalación y apertura sin señal |
| `next.config.ts`, `src/proxy.ts` | Encabezados del service worker; excluirlo del login |
| `src/app/contactos/[id]/page.tsx` | Botón *Relevamiento* en la ficha del contacto |

---

### Tarea 1: El formato "ba-relevamiento"

**Archivos:**
- Crear: `src/lib/relevamiento/formato.ts`
- Prueba: `src/lib/relevamiento/formato.test.ts`

**Interfaces:**
- Consume: nada.
- Produce: tipos `Relevamiento`, `Nivel`, `Ambiente`, `Pared`, `Elemento`, `Altura`, `Diagonal`, `Giro`; `relevamientoSchema` (zod); `crearRelevamientoVacio(entrada: { contactoId: string; nombre: string; direccion: string; ambientes: string[]; fecha: string }): Relevamiento`; `crearAmbiente(id: string, nombre: string): Ambiente`.

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/relevamiento/formato.test.ts
import { describe, expect, it } from "vitest";
import { crearRelevamientoVacio, relevamientoSchema } from "./formato";

const base = { contactoId: "c1", nombre: "Bruno", direccion: "Urubó", ambientes: ["Dormitorio", "Baño"], fecha: "2026-09-10" };

describe("formato ba-relevamiento", () => {
  it("un relevamiento vacío es válido y trae un ambiente por nombre", () => {
    const r = crearRelevamientoVacio(base);
    expect(relevamientoSchema.parse(r)).toEqual(r);
    expect(r.formato).toBe("ba-relevamiento");
    expect(r.niveles).toHaveLength(1);
    expect(r.niveles[0].ambientes.map((a) => a.nombre)).toEqual(["Dormitorio", "Baño"]);
  });

  it("sin ambientes de la entrevista, arranca con uno llamado Ambiente 1", () => {
    const r = crearRelevamientoVacio({ ...base, ambientes: [] });
    expect(r.niveles[0].ambientes.map((a) => a.nombre)).toEqual(["Ambiente 1"]);
  });

  it("rechaza medidas con decimales: todo va en centímetros enteros", () => {
    const r = crearRelevamientoVacio(base);
    r.niveles[0].ambientes[0].paredes.push({ id: "p1", largo: 405.5, giro: "D" });
    expect(relevamientoSchema.safeParse(r).success).toBe(false);
  });

  it("rechaza un archivo que no es ba-relevamiento", () => {
    const r = { ...crearRelevamientoVacio(base), formato: "otro" };
    expect(relevamientoSchema.safeParse(r).success).toBe(false);
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/relevamiento/formato.test.ts`
Esperado: FALLA con `Failed to resolve import "./formato"`.

- [ ] **Paso 3: escribir la implementación mínima**

```ts
// src/lib/relevamiento/formato.ts
import { z } from "zod";

/**
 * El formato "ba-relevamiento" es a la vez lo que guarda la app y lo que lee el
 * botón de pyRevit. Todo va en centímetros enteros: una medida con decimales es
 * un error de carga, no una precisión.
 *
 * `largo: null` significa "todavía no medida". Es lo que le permite al control
 * de cierre decir qué falta, en vez de tratar un cero como una medida.
 */
const cm = z.number().int().nonnegative();

export const giroSchema = z.enum(["D", "I"]);

export const paredSchema = z.object({
  id: z.string(),
  largo: cm.nullable(),
  giro: giroSchema,
  espesor: cm.nullable().optional(),
});

export const alturaSchema = z.object({
  punto: z.enum(["puerta", "centro", "opuesta"]),
  medida: cm.nullable(),
});

export const diagonalSchema = z.object({
  desdeVertice: z.number().int().nonnegative(),
  hastaVertice: z.number().int().nonnegative(),
  medida: cm.nullable(),
});

export const elementoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  tipo: z.enum(["puerta", "ventana", "viga", "columna", "mueble-fijo", "luminaria", "toma", "llave", "aire", "mueble"]),
  pared: z.string().optional(),
  desde: cm.nullable().optional(),
  hasta: cm.nullable().optional(),
  alto: cm.nullable().optional(),
  antepecho: cm.nullable().optional(),
  dintel: cm.nullable().optional(),
  espesorMuro: cm.nullable().optional(),
  apertura: z.enum(["corrediza", "batiente", "pivotante", "fija"]).nullable().optional(),
  abreHacia: z.enum(["adentro", "afuera"]).nullable().optional(),
  bisagra: z.enum(["inicio", "fin"]).nullable().optional(),
  notas: z.string().optional(),
});

export const formaSchema = z.object({
  tipo: z.enum(["rectangulo", "L", "U"]),
  medidas: z.record(z.string(), cm.nullable()),
});

export const ambienteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  metodo: z.enum(["forma", "recorrido"]),
  forma: formaSchema.optional(),
  paredes: z.array(paredSchema),
  alturas: z.array(alturaSchema),
  diagonales: z.array(diagonalSchema),
  elementos: z.array(elementoSchema),
});

export const nivelSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cotaPiso: z.number().int(),
  ambientes: z.array(ambienteSchema),
});

export const relevamientoSchema = z.object({
  formato: z.literal("ba-relevamiento"),
  version: z.literal(1),
  proyecto: z.object({
    contactoId: z.string(),
    nombre: z.string(),
    direccion: z.string(),
    fechaRelevamiento: z.string(),
  }),
  niveles: z.array(nivelSchema),
});

export type Giro = z.infer<typeof giroSchema>;
export type Pared = z.infer<typeof paredSchema>;
export type Altura = z.infer<typeof alturaSchema>;
export type Diagonal = z.infer<typeof diagonalSchema>;
export type Elemento = z.infer<typeof elementoSchema>;
export type Ambiente = z.infer<typeof ambienteSchema>;
export type Nivel = z.infer<typeof nivelSchema>;
export type Relevamiento = z.infer<typeof relevamientoSchema>;

/** Un ambiente recién creado: sin paredes, con los tres puntos de altura del protocolo. */
export function crearAmbiente(id: string, nombre: string): Ambiente {
  return {
    id,
    nombre,
    metodo: "forma",
    paredes: [],
    alturas: [
      { punto: "puerta", medida: null },
      { punto: "centro", medida: null },
      { punto: "opuesta", medida: null },
    ],
    diagonales: [],
    elementos: [],
  };
}

export function crearRelevamientoVacio(entrada: {
  contactoId: string;
  nombre: string;
  direccion: string;
  ambientes: string[];
  fecha: string;
}): Relevamiento {
  const nombres = entrada.ambientes.length > 0 ? entrada.ambientes : ["Ambiente 1"];
  return {
    formato: "ba-relevamiento",
    version: 1,
    proyecto: {
      contactoId: entrada.contactoId,
      nombre: entrada.nombre,
      direccion: entrada.direccion,
      fechaRelevamiento: entrada.fecha,
    },
    niveles: [
      {
        id: "nivel-1",
        nombre: "Planta baja",
        cotaPiso: 0,
        ambientes: nombres.map((n, i) => crearAmbiente(`amb-${i + 1}`, n)),
      },
    ],
  };
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/relevamiento/formato.test.ts`
Esperado: 4 pruebas en PASS.

- [ ] **Paso 5: commit**

```bash
git add src/lib/relevamiento/formato.ts src/lib/relevamiento/formato.test.ts
git commit -m "El relevamiento tiene un formato propio, validado y en centímetros enteros

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 2: El motor geométrico

**Archivos:**
- Crear: `src/lib/relevamiento/geometria.ts`
- Prueba: `src/lib/relevamiento/geometria.test.ts`

**Interfaces:**
- Consume: `Pared`, `Giro` de `./formato` (Tarea 1).
- Produce: `type Punto = { x: number; y: number }`; `type TipoForma = "rectangulo" | "L" | "U"`; `CAMPOS_FORMA: Record<TipoForma, { clave: string; etiqueta: string }[]>`; `formaAParedes(tipo: TipoForma, medidas: Record<string, number | null>): Pared[]`; `recorridoAPoligono(paredes: Pared[]): { vertices: Punto[]; completo: boolean }`; `errorDeCierre(paredes: Pared[]): number | null`; `superficieM2(paredes: Pared[]): number | null`; `perimetroCm(paredes: Pared[]): number | null`; `diagonalCalculada(paredes: Pared[], desde: number, hasta: number): number | null`.

**Convención:** coordenadas de pantalla, igual que SVG: `x` hacia la derecha, `y` hacia abajo, origen en el vértice 0. La primera pared sale hacia la derecha. El `giro` de la pared *i* es el que se hace **al terminarla**, antes de la pared *i+1*. Recorriendo el ambiente en sentido horario, cada esquina es un giro a la derecha (`D`) y cada esquina entrante, uno a la izquierda (`I`).

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/relevamiento/geometria.test.ts
import { describe, expect, it } from "vitest";
import type { Pared } from "./formato";
import {
  diagonalCalculada,
  errorDeCierre,
  formaAParedes,
  perimetroCm,
  recorridoAPoligono,
  superficieM2,
} from "./geometria";

const p = (largo: number | null, giro: "D" | "I" = "D", id = "x"): Pared => ({ id, largo, giro });

describe("formas rápidas", () => {
  it("el rectángulo del cuarto de Bruno: 405 × 456 da 18,468 m² y cierra", () => {
    const paredes = formaAParedes("rectangulo", { ancho: 405, largo: 456 });
    expect(paredes.map((w) => w.largo)).toEqual([405, 456, 405, 456]);
    expect(errorDeCierre(paredes)).toBe(0);
    expect(superficieM2(paredes)).toBeCloseTo(18.468, 3);
    expect(perimetroCm(paredes)).toBe(1722);
  });

  it("una L de 400 × 500 con un recorte de 150 × 200 da 17 m² y cierra", () => {
    const paredes = formaAParedes("L", { anchoTotal: 400, largoTotal: 500, anchoRecorte: 150, largoRecorte: 200 });
    expect(paredes).toHaveLength(6);
    expect(errorDeCierre(paredes)).toBe(0);
    expect(superficieM2(paredes)).toBeCloseTo(17, 3);
  });

  it("una U de 600 × 500 con un hueco de 200 × 150 a 200 del borde da 27 m² y cierra", () => {
    const paredes = formaAParedes("U", { anchoTotal: 600, largoTotal: 500, anchoHueco: 200, largoHueco: 150, desdeHueco: 200 });
    expect(paredes).toHaveLength(8);
    expect(errorDeCierre(paredes)).toBe(0);
    expect(superficieM2(paredes)).toBeCloseTo(27, 3);
  });

  it("con una medida de la forma sin cargar, las paredes que dependen de ella quedan sin largo", () => {
    const paredes = formaAParedes("rectangulo", { ancho: 405, largo: null });
    expect(paredes.map((w) => w.largo)).toEqual([405, null, 405, null]);
    expect(superficieM2(paredes)).toBeNull();
  });
});

describe("recorrido", () => {
  it("dibuja los vértices en coordenadas de pantalla", () => {
    const { vertices, completo } = recorridoAPoligono([p(405), p(456), p(405), p(456)]);
    expect(completo).toBe(true);
    expect(vertices).toEqual([
      { x: 0, y: 0 },
      { x: 405, y: 0 },
      { x: 405, y: 456 },
      { x: 0, y: 456 },
      { x: 0, y: 0 },
    ]);
  });

  it("un recorrido que no cierra informa cuánto le falta: 11 cm", () => {
    expect(errorDeCierre([p(405), p(456), p(405), p(445)])).toBe(11);
  });

  it("se detiene en la primera pared sin medir", () => {
    const { vertices, completo } = recorridoAPoligono([p(405), p(null), p(405)]);
    expect(completo).toBe(false);
    expect(vertices).toHaveLength(2);
    expect(errorDeCierre([p(405), p(null)])).toBeNull();
  });

  it("calcula la diagonal entre dos vértices", () => {
    const paredes = [p(405), p(456), p(405), p(456)];
    expect(diagonalCalculada(paredes, 0, 2)).toBe(610);
    expect(diagonalCalculada([p(405), p(null)], 0, 2)).toBeNull();
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/relevamiento/geometria.test.ts`
Esperado: FALLA con `Failed to resolve import "./geometria"`.

- [ ] **Paso 3: escribir la implementación mínima**

```ts
// src/lib/relevamiento/geometria.ts
import type { Giro, Pared } from "./formato";

export type Punto = { x: number; y: number };
export type TipoForma = "rectangulo" | "L" | "U";

/** Qué medidas pide cada forma rápida, en el orden en que conviene tomarlas. */
export const CAMPOS_FORMA: Record<TipoForma, { clave: string; etiqueta: string }[]> = {
  rectangulo: [
    { clave: "ancho", etiqueta: "Ancho" },
    { clave: "largo", etiqueta: "Largo" },
  ],
  L: [
    { clave: "anchoTotal", etiqueta: "Ancho total" },
    { clave: "largoTotal", etiqueta: "Largo total" },
    { clave: "anchoRecorte", etiqueta: "Ancho del recorte" },
    { clave: "largoRecorte", etiqueta: "Largo del recorte" },
  ],
  U: [
    { clave: "anchoTotal", etiqueta: "Ancho total" },
    { clave: "largoTotal", etiqueta: "Largo total" },
    { clave: "anchoHueco", etiqueta: "Ancho del hueco" },
    { clave: "largoHueco", etiqueta: "Largo del hueco" },
    { clave: "desdeHueco", etiqueta: "Hueco desde el borde izquierdo" },
  ],
};

type M = number | null;

/** Resta encadenada que propaga el "sin medir": si falta un término, falta el resultado. */
function resta(primero: M, ...resto: M[]): M {
  if (primero === null || resto.some((x) => x === null)) return null;
  return resto.reduce<number>((s, x) => s - (x as number), primero);
}

/**
 * Convierte una forma rápida en paredes, así todo lo demás —dibujo, controles,
 * archivo para Revit— trabaja con una sola representación.
 *
 * La L tiene el recorte en la esquina de arriba a la derecha; la U tiene el hueco
 * sobre el borde de arriba. Cualquier otra orientación se resuelve con recorrido.
 */
export function formaAParedes(tipo: TipoForma, medidas: Record<string, M>): Pared[] {
  const m = (k: string): M => medidas[k] ?? null;
  let tramos: [M, Giro][];
  if (tipo === "rectangulo") {
    tramos = [[m("ancho"), "D"], [m("largo"), "D"], [m("ancho"), "D"], [m("largo"), "D"]];
  } else if (tipo === "L") {
    tramos = [
      [resta(m("anchoTotal"), m("anchoRecorte")), "D"],
      [m("largoRecorte"), "I"],
      [m("anchoRecorte"), "D"],
      [resta(m("largoTotal"), m("largoRecorte")), "D"],
      [m("anchoTotal"), "D"],
      [m("largoTotal"), "D"],
    ];
  } else {
    tramos = [
      [m("desdeHueco"), "D"],
      [m("largoHueco"), "I"],
      [m("anchoHueco"), "I"],
      [m("largoHueco"), "D"],
      [resta(m("anchoTotal"), m("desdeHueco"), m("anchoHueco")), "D"],
      [m("largoTotal"), "D"],
      [m("anchoTotal"), "D"],
      [m("largoTotal"), "D"],
    ];
  }
  return tramos.map(([largo, giro], i) => ({ id: `pared-${i + 1}`, largo, giro }));
}

/** Gira la dirección 90°. En coordenadas de pantalla, a la derecha es (dx, dy) → (−dy, dx). */
function girar(d: Punto, giro: Giro): Punto {
  return giro === "D" ? { x: -d.y, y: d.x } : { x: d.y, y: -d.x };
}

export function recorridoAPoligono(paredes: Pared[]): { vertices: Punto[]; completo: boolean } {
  const vertices: Punto[] = [{ x: 0, y: 0 }];
  let dir: Punto = { x: 1, y: 0 };
  for (const pared of paredes) {
    if (pared.largo === null) return { vertices, completo: false };
    const ult = vertices[vertices.length - 1];
    vertices.push({ x: ult.x + dir.x * pared.largo, y: ult.y + dir.y * pared.largo });
    dir = girar(dir, pared.giro);
  }
  return { vertices, completo: paredes.length > 0 };
}

const distancia = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y);

/** Cuántos centímetros separan el final del recorrido de su punto de partida. */
export function errorDeCierre(paredes: Pared[]): number | null {
  const { vertices, completo } = recorridoAPoligono(paredes);
  if (!completo) return null;
  return Math.round(distancia(vertices[0], vertices[vertices.length - 1]));
}

export function superficieM2(paredes: Pared[]): number | null {
  const { vertices, completo } = recorridoAPoligono(paredes);
  if (!completo) return null;
  let doble = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    doble += vertices[i].x * vertices[i + 1].y - vertices[i + 1].x * vertices[i].y;
  }
  return Math.abs(doble) / 2 / 10000;
}

export function perimetroCm(paredes: Pared[]): number | null {
  if (paredes.length === 0 || paredes.some((w) => w.largo === null)) return null;
  return paredes.reduce((s, w) => s + (w.largo as number), 0);
}

export function diagonalCalculada(paredes: Pared[], desde: number, hasta: number): number | null {
  const { vertices } = recorridoAPoligono(paredes);
  if (desde >= vertices.length || hasta >= vertices.length) return null;
  return Math.round(distancia(vertices[desde], vertices[hasta]));
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/relevamiento/geometria.test.ts`
Esperado: 8 pruebas en PASS.

- [ ] **Paso 5: commit**

```bash
git add src/lib/relevamiento/geometria.ts src/lib/relevamiento/geometria.test.ts
git commit -m "El plano se calcula solo a partir de las medidas: formas rápidas, recorrido y cierre

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 3: El control de cierre

**Archivos:**
- Crear: `src/lib/relevamiento/controles.ts`
- Prueba: `src/lib/relevamiento/controles.test.ts`

**Interfaces:**
- Consume: `Ambiente`, `Elemento`, `Relevamiento`, `crearAmbiente` de `./formato` (Tarea 1); `errorDeCierre`, `diagonalCalculada`, `formaAParedes` de `./geometria` (Tarea 2).
- Produce: `type NivelHallazgo = "error" | "aviso" | "ok"`; `interface Hallazgo { nivel: NivelHallazgo; ambienteId: string; ref?: string; mensaje: string }`; `TOLERANCIA_CM = 2`; `controlarAmbiente(ambiente: Ambiente): Hallazgo[]`; `controlarRelevamiento(r: Relevamiento): Hallazgo[]`; `datosFaltantes(e: Elemento): string[]`.

**Qué controla**, tomado del protocolo de relevamiento:

| Nivel | Situación |
|---|---|
| error | Ambiente sin paredes · pared sin medir · recorrido que no cierra por más de 2 cm · ninguna altura · abertura con datos faltantes · abertura que se sale de su pared o empieza después de terminar · dos aberturas que se pisan |
| aviso | Altura medida en menos de 3 puntos · sin diagonales · diagonal que difiere más de 2 cm de la calculada |
| ok | Ni errores ni avisos |

**Los siete datos de cada abertura:** dónde empieza (`desde`), dónde termina (`hasta`, de ahí sale el ancho), `alto`, `espesorMuro`, `apertura`; en ventanas además `antepecho`; en puertas batientes o pivotantes además `abreHacia` y `bisagra`. El dintel no se exige: se deduce de la altura del ambiente.

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/relevamiento/controles.test.ts
import { describe, expect, it } from "vitest";
import { crearAmbiente, type Ambiente, type Elemento } from "./formato";
import { formaAParedes } from "./geometria";
import { controlarAmbiente, datosFaltantes } from "./controles";

function cuarto(): Ambiente {
  const a = crearAmbiente("amb-1", "Dormitorio");
  a.paredes = formaAParedes("rectangulo", { ancho: 405, largo: 456 });
  a.alturas = a.alturas.map((h) => ({ ...h, medida: 263 }));
  a.diagonales = [{ desdeVertice: 0, hastaVertice: 2, medida: 610 }];
  return a;
}

const puerta = (extra: Partial<Elemento> = {}): Elemento => ({
  id: "e1", codigo: "P1", tipo: "puerta", pared: "pared-4",
  desde: 60, hasta: 150, alto: 210, espesorMuro: 15,
  apertura: "corrediza", ...extra,
});

const niveles = (a: Ambiente) => controlarAmbiente(a).map((h) => h.nivel);
const mensajes = (a: Ambiente) => controlarAmbiente(a).map((h) => h.mensaje).join(" | ");

describe("control de cierre", () => {
  it("el cuarto completo da un solo ok", () => {
    const a = cuarto();
    a.elementos = [puerta()];
    expect(controlarAmbiente(a)).toEqual([{ nivel: "ok", ambienteId: "amb-1", mensaje: "Todo cierra" }]);
  });

  it("un ambiente sin paredes es un error", () => {
    expect(niveles(crearAmbiente("amb-1", "Baño"))).toContain("error");
  });

  it("una pared sin medir es un error que dice cuál", () => {
    const a = cuarto();
    a.paredes[1] = { ...a.paredes[1], largo: null };
    expect(mensajes(a)).toContain("Pared 2 sin medir");
  });

  it("un recorrido que no cierra por 11 cm es un error con la cifra", () => {
    const a = cuarto();
    a.paredes[3] = { ...a.paredes[3], largo: 445 };
    expect(mensajes(a)).toContain("11 cm");
  });

  it("la altura en un solo punto es un aviso; sin ninguna, un error", () => {
    const a = cuarto();
    a.alturas = [{ punto: "centro", medida: 263 }, { punto: "puerta", medida: null }, { punto: "opuesta", medida: null }];
    expect(niveles(a)).toEqual(["aviso"]);
    a.alturas = a.alturas.map((h) => ({ ...h, medida: null }));
    expect(niveles(a)).toContain("error");
  });

  it("una diagonal que difiere de la calculada es un aviso", () => {
    const a = cuarto();
    a.diagonales = [{ desdeVertice: 0, hastaVertice: 2, medida: 598 }];
    expect(mensajes(a)).toContain("no está a escuadra");
  });

  it("sin diagonales es un aviso", () => {
    const a = cuarto();
    a.diagonales = [];
    expect(niveles(a)).toEqual(["aviso"]);
  });

  it("una ventana sin antepecho es un error que nombra el dato", () => {
    const a = cuarto();
    a.elementos = [puerta({ codigo: "V1", tipo: "ventana" })];
    expect(mensajes(a)).toContain("V1: falta antepecho");
  });

  it("una abertura que se sale de la pared es un error", () => {
    const a = cuarto();
    a.elementos = [puerta({ desde: 400, hasta: 480 })];
    expect(mensajes(a)).toContain("P1 termina en 480 pero la pared mide 456");
  });

  it("dos aberturas que se pisan en la misma pared son un error", () => {
    const a = cuarto();
    a.elementos = [puerta(), puerta({ id: "e2", codigo: "V1", tipo: "ventana", desde: 120, hasta: 250, antepecho: 90 })];
    expect(mensajes(a)).toContain("P1 y V1 se pisan");
  });

  it("una puerta batiente exige hacia dónde abre y de qué lado va la bisagra", () => {
    expect(datosFaltantes(puerta({ apertura: "batiente" }))).toEqual(["hacia dónde abre", "bisagra"]);
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/relevamiento/controles.test.ts`
Esperado: FALLA con `Failed to resolve import "./controles"`.

- [ ] **Paso 3: escribir la implementación mínima**

```ts
// src/lib/relevamiento/controles.ts
import type { Ambiente, Elemento, Relevamiento } from "./formato";
import { diagonalCalculada, errorDeCierre } from "./geometria";

export type NivelHallazgo = "error" | "aviso" | "ok";

export interface Hallazgo {
  nivel: NivelHallazgo;
  ambienteId: string;
  ref?: string;
  mensaje: string;
}

/** Diferencia aceptada entre lo medido y lo calculado: por debajo es error de láser, no de relevamiento. */
export const TOLERANCIA_CM = 2;

const vacio = (v: unknown) => v === null || v === undefined;

/**
 * Los datos que le faltan a una puerta o ventana, con el nombre con que Bruno los dice.
 * Es el control de "siete datos, siempre los siete" del protocolo.
 */
export function datosFaltantes(e: Elemento): string[] {
  if (e.tipo !== "puerta" && e.tipo !== "ventana") return [];
  const faltan: string[] = [];
  if (vacio(e.pared)) faltan.push("en qué pared");
  if (vacio(e.desde)) faltan.push("dónde empieza");
  if (vacio(e.hasta)) faltan.push("dónde termina");
  if (vacio(e.alto)) faltan.push("alto");
  if (e.tipo === "ventana" && vacio(e.antepecho)) faltan.push("antepecho");
  if (vacio(e.espesorMuro)) faltan.push("espesor de muro");
  if (vacio(e.apertura)) faltan.push("tipo de apertura");
  if (e.tipo === "puerta" && (e.apertura === "batiente" || e.apertura === "pivotante")) {
    if (vacio(e.abreHacia)) faltan.push("hacia dónde abre");
    if (vacio(e.bisagra)) faltan.push("bisagra");
  }
  return faltan;
}

export function controlarAmbiente(a: Ambiente): Hallazgo[] {
  const h: Hallazgo[] = [];
  const error = (mensaje: string, ref?: string) => h.push({ nivel: "error", ambienteId: a.id, ref, mensaje });
  const aviso = (mensaje: string, ref?: string) => h.push({ nivel: "aviso", ambienteId: a.id, ref, mensaje });

  if (a.paredes.length === 0) {
    error("El ambiente no tiene paredes");
  } else {
    a.paredes.forEach((p, i) => {
      if (p.largo === null) error(`Pared ${i + 1} sin medir`, p.id);
    });
    const cierre = errorDeCierre(a.paredes);
    if (cierre !== null && cierre > TOLERANCIA_CM) error(`El recorrido no cierra: faltan ${cierre} cm`);
  }

  const alturas = a.alturas.filter((x) => x.medida !== null).length;
  if (alturas === 0) error("Falta la altura del ambiente");
  else if (alturas < 3) aviso(`Altura medida en ${alturas} de 3 puntos`);

  const completas = a.paredes.length > 0 && a.paredes.every((p) => p.largo !== null);
  const medidas = a.diagonales.filter((d) => d.medida !== null);
  if (completas && medidas.length === 0) aviso("Sin diagonales: no se puede saber si el ambiente está a escuadra");
  for (const d of medidas) {
    const calculada = diagonalCalculada(a.paredes, d.desdeVertice, d.hastaVertice);
    if (calculada !== null && Math.abs(calculada - (d.medida as number)) > TOLERANCIA_CM) {
      aviso(`La diagonal mide ${d.medida} y el plano da ${calculada}: el ambiente no está a escuadra o hay una medida mal`);
    }
  }

  const aberturas = a.elementos.filter((e) => e.tipo === "puerta" || e.tipo === "ventana");
  for (const e of aberturas) {
    const faltan = datosFaltantes(e);
    if (faltan.length > 0) error(`${e.codigo}: falta ${faltan.join(", ")}`, e.id);
    const pared = a.paredes.find((p) => p.id === e.pared);
    if (!pared || vacio(e.desde) || vacio(e.hasta)) continue;
    if ((e.desde as number) >= (e.hasta as number)) error(`${e.codigo} empieza después de terminar`, e.id);
    if (pared.largo !== null && (e.hasta as number) > pared.largo) {
      error(`${e.codigo} termina en ${e.hasta} pero la pared mide ${pared.largo}`, e.id);
    }
  }
  for (let i = 0; i < aberturas.length; i++) {
    for (let j = i + 1; j < aberturas.length; j++) {
      const x = aberturas[i];
      const y = aberturas[j];
      if (x.pared !== y.pared || [x.desde, x.hasta, y.desde, y.hasta].some(vacio)) continue;
      if ((x.desde as number) < (y.hasta as number) && (y.desde as number) < (x.hasta as number)) {
        error(`${x.codigo} y ${y.codigo} se pisan en la misma pared`, x.id);
      }
    }
  }

  if (h.length === 0) h.push({ nivel: "ok", ambienteId: a.id, mensaje: "Todo cierra" });
  return h;
}

export function controlarRelevamiento(r: Relevamiento): Hallazgo[] {
  return r.niveles.flatMap((n) => n.ambientes.flatMap(controlarAmbiente));
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/relevamiento/controles.test.ts`
Esperado: 11 pruebas en PASS.

- [ ] **Paso 5: commit**

```bash
git add src/lib/relevamiento/controles.ts src/lib/relevamiento/controles.test.ts
git commit -m "La app controla que el relevamiento cierre antes de irse de la visita

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 4: De lo dictado a centímetros

**Archivos:**
- Crear: `src/lib/relevamiento/voz.ts`
- Prueba: `src/lib/relevamiento/voz.test.ts`

**Interfaces:**
- Consume: nada.
- Produce: `type ResultadoVoz = { tipo: "medida"; cm: number } | { tipo: "ambiguo"; opciones: number[] } | { tipo: "invalido" }`; `parsearMedida(texto: string): ResultadoVoz`.

**Reglas**, pensadas para cómo dicta Bruno. Ante la duda no adivina: devuelve `ambiguo` con las opciones, y la interfaz pregunta.

| Dicho | Resultado |
|---|---|
| "405", "cuatrocientos cinco", "cuatro cero cinco" | 405 |
| "4,05", "4.05", "cuatro con cero cinco" | 405 |
| "4,5", "cuatro con cincuenta", "cuatro metros cincuenta" | 450 |
| "cuatro metros" | 400 |
| "dos sesenta y tres" | 263 |
| "quince centímetros" | 15 |
| "cuatro con cinco", "cuatro metros cinco" | ambiguo: 405 o 450 |
| "tres" | ambiguo: 300 o 3 |
| "4.050 m", "4050 mm" (láser en modo teclado) | 405 |
| "hola" | inválido |

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/relevamiento/voz.test.ts
import { describe, expect, it } from "vitest";
import { parsearMedida } from "./voz";

const cm = (n: number) => ({ tipo: "medida", cm: n });

describe("parsearMedida", () => {
  it.each([
    ["405", 405],
    ["4,05", 405],
    ["4.05", 405],
    ["4,5", 450],
    ["cuatro cero cinco", 405],
    ["Cuatro cero cinco.", 405],
    ["cuatrocientos cinco", 405],
    ["cuatro con cero cinco", 405],
    ["cuatro con cincuenta", 450],
    ["cuatro metros cincuenta y seis", 456],
    ["cuatro metros", 400],
    ["dos sesenta y tres", 263],
    ["quince centímetros", 15],
    ["15 cm", 15],
    ["veintiuno", 21],
    ["mil ochocientos veinte", 1820],
    ["4.050", 405],
    ["4.050 m", 405],
    ["4050 mm", 405],
  ])("«%s» son %i cm", (texto, esperado) => {
    expect(parsearMedida(texto)).toEqual(cm(esperado));
  });

  it("«cuatro con cinco» no adivina: puede ser 405 o 450", () => {
    expect(parsearMedida("cuatro con cinco")).toEqual({ tipo: "ambiguo", opciones: [405, 450] });
    expect(parsearMedida("cuatro metros cinco")).toEqual({ tipo: "ambiguo", opciones: [405, 450] });
  });

  it("un número suelto menor que 10 puede ser metros o centímetros", () => {
    expect(parsearMedida("tres")).toEqual({ tipo: "ambiguo", opciones: [300, 3] });
    expect(parsearMedida("3")).toEqual({ tipo: "ambiguo", opciones: [300, 3] });
  });

  it("lo que no es una medida es inválido", () => {
    expect(parsearMedida("hola")).toEqual({ tipo: "invalido" });
    expect(parsearMedida("")).toEqual({ tipo: "invalido" });
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/relevamiento/voz.test.ts`
Esperado: FALLA con `Failed to resolve import "./voz"`.

- [ ] **Paso 3: escribir la implementación mínima**

```ts
// src/lib/relevamiento/voz.ts

export type ResultadoVoz =
  | { tipo: "medida"; cm: number }
  | { tipo: "ambiguo"; opciones: number[] }
  | { tipo: "invalido" };

const VALORES: Record<string, number> = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

const SEPARADORES = new Set(["con", "coma", "punto", "metro", "metros"]);
const SUFIJO_CM = new Set(["cm", "centimetro", "centimetros"]);
const SUFIJO_MM = new Set(["mm", "milimetro", "milimetros"]);

const medida = (cm: number): ResultadoVoz => ({ tipo: "medida", cm });
const INVALIDO: ResultadoVoz = { tipo: "invalido" };

function normalizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9,. ]/g, " ")
    .replace(/(\d)\s*m\b/g, "$1 metros")
    .split(/\s+/)
    .map((t) => t.replace(/^[.,]+|[.,]+$/g, ""))
    .filter(Boolean);
}

const esDigito = (t: string) => t in VALORES && VALORES[t] <= 9;

/** Palabras en español a número entero: "mil ochocientos veinte" → 1820. */
function palabrasANumero(tokens: string[]): number | null {
  const utiles = tokens.filter((t) => t !== "y");
  if (utiles.length === 0) return null;
  let total = 0;
  let actual = 0;
  for (const t of utiles) {
    if (t === "mil") {
      total += (actual || 1) * 1000;
      actual = 0;
    } else if (t in VALORES) {
      actual += VALORES[t];
    } else {
      return null;
    }
  }
  return total + actual;
}

/** "cero cinco" → 5 leído como cifras; "cincuenta y seis" → 56 leído como número. */
function numeroOCifras(tokens: string[]): { valor: number; cifras: number } | null {
  if (tokens.length >= 2 && tokens.every(esDigito)) {
    return { valor: Number(tokens.map((t) => VALORES[t]).join("")), cifras: tokens.length };
  }
  const n = palabrasANumero(tokens);
  return n === null ? null : { valor: n, cifras: n >= 10 ? 2 : 1 };
}

function entero(n: number): ResultadoVoz {
  return n < 10 ? { tipo: "ambiguo", opciones: [n * 100, n] } : medida(n);
}

export function parsearMedida(texto: string): ResultadoVoz {
  let tokens = normalizar(texto);
  if (tokens.length === 0) return INVALIDO;

  // El láser en modo teclado escribe cifras con unidad: "4.050 m", "4050 mm".
  const ultimo = tokens[tokens.length - 1];
  if (tokens.length === 2 && /^\d+([.,]\d+)?$/.test(tokens[0])) {
    if (SUFIJO_MM.has(ultimo)) return medida(Math.round(Number(tokens[0].replace(",", ".")) / 10));
    if (ultimo === "metros") {
      const metros = Number(tokens[0].replace(",", "."));
      return Number.isFinite(metros) ? medida(Math.round(metros * 100)) : INVALIDO;
    }
  }

  const enCm = SUFIJO_CM.has(ultimo);
  if (enCm) tokens = tokens.slice(0, -1);

  // Cifras escritas: "405", "4,05", "15 cm"
  if (tokens.length === 1 && /^\d+([.,]\d+)?$/.test(tokens[0])) {
    const [ent, dec] = tokens[0].split(/[.,]/);
    if (enCm) return medida(Number(ent));
    if (dec === undefined) return entero(Number(ent));
    const cmDec = dec.length === 1 ? Number(dec) * 10 : Math.round(Number(`0.${dec}`) * 100);
    return medida(Number(ent) * 100 + cmDec);
  }

  if (enCm) {
    const n = palabrasANumero(tokens);
    return n === null ? INVALIDO : medida(n);
  }

  // Metros y centímetros separados: "cuatro con cincuenta", "cuatro metros"
  const sep = tokens.findIndex((t) => SEPARADORES.has(t));
  if (sep > 0) {
    const m = palabrasANumero(tokens.slice(0, sep));
    if (m === null) return INVALIDO;
    const resto = tokens.slice(sep + 1);
    if (resto.length === 0) return medida(m * 100);
    const dec = numeroOCifras(resto);
    if (dec === null || dec.valor > 99) return INVALIDO;
    if (dec.cifras === 1) return { tipo: "ambiguo", opciones: [m * 100 + dec.valor, m * 100 + dec.valor * 10] };
    return medida(m * 100 + dec.valor);
  }

  // Cifras sueltas: "cuatro cero cinco"
  if (tokens.length >= 2 && tokens.every(esDigito)) {
    return medida(Number(tokens.map((t) => VALORES[t]).join("")));
  }

  // Metros y centímetros sin separador: "dos sesenta y tres"
  if (tokens.length >= 2 && esDigito(tokens[0]) && VALORES[tokens[0]] > 0) {
    const cmResto = palabrasANumero(tokens.slice(1));
    if (cmResto !== null && cmResto >= 10 && cmResto <= 99) return medida(VALORES[tokens[0]] * 100 + cmResto);
  }

  const n = palabrasANumero(tokens);
  return n === null ? INVALIDO : entero(n);
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/relevamiento/voz.test.ts`
Esperado: 22 pruebas en PASS.

- [ ] **Paso 5: commit**

```bash
git add src/lib/relevamiento/voz.ts src/lib/relevamiento/voz.test.ts
git commit -m "Las medidas dictadas se entienden como las dice Bruno, y lo dudoso se pregunta

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 5: La copia del teléfono y la del servidor

**Archivos:**
- Crear: `src/lib/relevamiento/sincronizacion.ts`
- Crear: `src/lib/relevamiento/almacen.ts`
- Prueba: `src/lib/relevamiento/sincronizacion.test.ts`

**Interfaces:**
- Consume: `Relevamiento`, `crearRelevamientoVacio` de `./formato` (Tarea 1).
- Produce:
  - `interface CopiaLocal { data: Relevamiento; versionBase: number; pendiente: boolean; guardadoEn: string }` — `versionBase` es la versión del servidor sobre la que se hicieron los cambios; `pendiente` indica cambios sin subir.
  - `interface CopiaRemota { data: Relevamiento; version: number }`
  - `type Decision = { accion: "crear" } | { accion: "usar-remoto" } | { accion: "subir-local" } | { accion: "conflicto-gana-local" } | { accion: "nada" }`
  - `decidirAlAbrir(local: CopiaLocal | null, remoto: CopiaRemota | null): Decision`
  - En `almacen.ts`: `leerLocal(contactoId: string): Promise<CopiaLocal | null>`, `guardarLocal(contactoId: string, copia: CopiaLocal): Promise<void>`, `pedirPersistencia(): Promise<boolean>`.

**La regla**, con un solo usuario: el teléfono es la fuente durante la visita. Si hay cambios sin subir, siempre ganan; si el servidor había avanzado, se avisa del conflicto pero se sube igual.

| Teléfono | Servidor | Decisión |
|---|---|---|
| Nada | Nada | `crear` |
| Nada | Tiene copia | `usar-remoto` |
| Con cambios pendientes | Nada | `subir-local` |
| Sin cambios pendientes | Versión más nueva | `usar-remoto` |
| Sin cambios pendientes | Misma versión | `nada` |
| Con cambios pendientes | Misma versión | `subir-local` |
| Con cambios pendientes | Versión más nueva | `conflicto-gana-local` |

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/relevamiento/sincronizacion.test.ts
import { describe, expect, it } from "vitest";
import { crearRelevamientoVacio } from "./formato";
import { decidirAlAbrir, type CopiaLocal, type CopiaRemota } from "./sincronizacion";

const data = crearRelevamientoVacio({ contactoId: "c1", nombre: "Bruno", direccion: "", ambientes: [], fecha: "2026-09-10" });
const local = (versionBase: number, pendiente: boolean): CopiaLocal => ({ data, versionBase, pendiente, guardadoEn: "2026-09-10T10:00:00Z" });
const remoto = (version: number): CopiaRemota => ({ data, version });

describe("decidirAlAbrir", () => {
  it("sin copia en ningún lado, se crea", () => {
    expect(decidirAlAbrir(null, null)).toEqual({ accion: "crear" });
  });
  it("si solo el servidor tiene copia, se usa la del servidor", () => {
    expect(decidirAlAbrir(null, remoto(3))).toEqual({ accion: "usar-remoto" });
  });
  it("si solo el teléfono tiene cambios, se suben", () => {
    expect(decidirAlAbrir(local(0, true), null)).toEqual({ accion: "subir-local" });
  });
  it("sin cambios en el teléfono y el servidor más nuevo, se usa el servidor", () => {
    expect(decidirAlAbrir(local(2, false), remoto(3))).toEqual({ accion: "usar-remoto" });
  });
  it("sin cambios y misma versión, no hay nada que hacer", () => {
    expect(decidirAlAbrir(local(3, false), remoto(3))).toEqual({ accion: "nada" });
  });
  it("con cambios sobre la misma versión, se suben", () => {
    expect(decidirAlAbrir(local(3, true), remoto(3))).toEqual({ accion: "subir-local" });
  });
  it("con cambios y el servidor más nuevo, gana el teléfono y se avisa", () => {
    expect(decidirAlAbrir(local(2, true), remoto(3))).toEqual({ accion: "conflicto-gana-local" });
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/relevamiento/sincronizacion.test.ts`
Esperado: FALLA con `Failed to resolve import "./sincronizacion"`.

- [ ] **Paso 3: escribir la implementación de la decisión**

```ts
// src/lib/relevamiento/sincronizacion.ts
import type { Relevamiento } from "./formato";

export interface CopiaLocal {
  data: Relevamiento;
  /** Versión del servidor sobre la que se hicieron los cambios del teléfono. */
  versionBase: number;
  /** Hay cambios guardados en el teléfono que todavía no se subieron. */
  pendiente: boolean;
  guardadoEn: string;
}

export interface CopiaRemota {
  data: Relevamiento;
  version: number;
}

export type Decision =
  | { accion: "crear" }
  | { accion: "usar-remoto" }
  | { accion: "subir-local" }
  | { accion: "conflicto-gana-local" }
  | { accion: "nada" };

/**
 * Qué hacer al abrir el relevamiento, con la copia del teléfono y la del servidor.
 *
 * Hay un solo usuario y la visita se hace en el teléfono, así que lo medido ahí
 * nunca se pisa: si el servidor avanzó mientras tanto, se avisa y se sube igual.
 */
export function decidirAlAbrir(local: CopiaLocal | null, remoto: CopiaRemota | null): Decision {
  if (!local && !remoto) return { accion: "crear" };
  if (!local) return { accion: "usar-remoto" };
  if (!remoto) return local.pendiente ? { accion: "subir-local" } : { accion: "nada" };
  if (!local.pendiente) return remoto.version > local.versionBase ? { accion: "usar-remoto" } : { accion: "nada" };
  return remoto.version > local.versionBase ? { accion: "conflicto-gana-local" } : { accion: "subir-local" };
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/relevamiento/sincronizacion.test.ts`
Esperado: 7 pruebas en PASS.

- [ ] **Paso 5: escribir el almacén del teléfono**

No lleva prueba: IndexedDB no existe en el entorno `node` de `vitest`. Se verifica con tipos en el paso 6 y en el iPhone en la Tarea 12.

```ts
// src/lib/relevamiento/almacen.ts
import type { CopiaLocal } from "./sincronizacion";

const BASE = "ba-relevamiento";
const TABLA = "copias";

/**
 * IndexedDB guarda cada relevamiento en el teléfono antes de intentar subirlo.
 * Es un colchón y no un archivo: iOS puede borrar datos de una app web que pasa
 * días sin abrirse, por eso la app sube apenas hay señal.
 */
function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(TABLA);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

function operar<T>(modo: IDBTransactionMode, hacer: (tabla: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(TABLA, modo);
        const pedido = hacer(tx.objectStore(TABLA));
        tx.oncomplete = () => {
          db.close();
          resolve(pedido.result);
        };
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function leerLocal(contactoId: string): Promise<CopiaLocal | null> {
  const copia = await operar<CopiaLocal | undefined>("readonly", (t) => t.get(contactoId));
  return copia ?? null;
}

export async function guardarLocal(contactoId: string, copia: CopiaLocal): Promise<void> {
  await operar("readwrite", (t) => t.put(copia, contactoId));
}

/** Le pide al navegador que no borre estos datos. Safari decide solo, sin preguntarle a Bruno. */
export async function pedirPersistencia(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  return navigator.storage.persist();
}
```

- [ ] **Paso 6: verificar tipos y pruebas**

Correr: `npx tsc --noEmit && npx vitest run src/lib/relevamiento`
Esperado: `tsc` sin salida; todas las pruebas de `src/lib/relevamiento` en PASS.

- [ ] **Paso 7: commit**

```bash
git add src/lib/relevamiento/sincronizacion.ts src/lib/relevamiento/sincronizacion.test.ts src/lib/relevamiento/almacen.ts
git commit -m "Lo medido se guarda en el teléfono y nunca se pisa al sincronizar

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 6: La tabla en la base y el guardado en el servidor

**Archivos:**
- Modificar: `prisma/schema.prisma` (modelo `Contacto` y modelo nuevo)
- Crear: `prisma/migrations/20260910120000_relevamiento/migration.sql`
- Crear: `src/app/contactos/[id]/relevamiento/actions.ts`

**Interfaces:**
- Consume: `relevamientoSchema`, `Relevamiento` de `@/lib/relevamiento/formato` (Tarea 1).
- Produce: modelo Prisma `Relevamiento { id, contactoId (único), data (Json), version (Int), createdAt, updatedAt }`; Server Action `guardarRelevamiento(contactoId: string, data: Relevamiento, versionBase: number): Promise<{ version: number; conflicto: boolean }>`.

**Cuidado:** la base es la de producción (ver Restricciones globales). La migración se genera comparando la base real contra el esquema, se lee línea por línea, y solo se aplica si crea cosas nuevas. **Si el SQL generado contiene `DROP`, o un `ALTER TABLE` sobre una tabla que ya existe, parar y avisar a Bruno: la base tiene diferencias que no son de esta tarea.**

Las fotos (`RelevamientoFoto`) son de la etapa 2 y no se crean ahora.

- [ ] **Paso 1: agregar el modelo al esquema**

En `prisma/schema.prisma`, dentro de `model Contacto`, debajo de `entrevistas  Entrevista[]`, agregar:

```prisma
  relevamiento Relevamiento?
```

Y al final del archivo:

```prisma
/// El relevamiento de la visita: toda la casa en un solo documento con formato
/// "ba-relevamiento" (src/lib/relevamiento/formato.ts). Uno por contacto.
/// `version` sube con cada guardado y permite detectar que el teléfono trabajó
/// sobre una copia vieja.
model Relevamiento {
  id         String   @id @default(cuid())
  contactoId String   @unique
  contacto   Contacto @relation(fields: [contactoId], references: [id])
  data       Json
  version    Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

- [ ] **Paso 2: generar el SQL sin tocar la base**

`migrate diff` es de solo lectura.

```bash
mkdir -p prisma/migrations/20260910120000_relevamiento
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script -o prisma/migrations/20260910120000_relevamiento/migration.sql
```

- [ ] **Paso 3: leer el SQL antes de aplicarlo**

Correr: `cat prisma/migrations/20260910120000_relevamiento/migration.sql`
Esperado, y nada más que esto:

```sql
-- CreateTable
CREATE TABLE "Relevamiento" (
    "id" TEXT NOT NULL,
    "contactoId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relevamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Relevamiento_contactoId_key" ON "Relevamiento"("contactoId");

-- AddForeignKey
ALTER TABLE "Relevamiento" ADD CONSTRAINT "Relevamiento_contactoId_fkey" FOREIGN KEY ("contactoId") REFERENCES "Contacto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

Si aparece cualquier otra instrucción, parar y avisar.

- [ ] **Paso 4: aplicar la migración y regenerar el cliente**

```bash
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
```

Esperado: `migrate deploy` informa `1 migration found` y la aplica; `migrate status` dice `Database schema is up to date!`.

- [ ] **Paso 5: escribir la Server Action**

```ts
// src/app/contactos/[id]/relevamiento/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { relevamientoSchema, type Relevamiento } from "@/lib/relevamiento/formato";

/**
 * Sube el relevamiento del teléfono. Lo del teléfono siempre se guarda: si el
 * servidor tenía una versión más nueva que la que el teléfono conocía, se guarda
 * igual y se devuelve `conflicto: true` para que la pantalla lo avise.
 */
export async function guardarRelevamiento(
  contactoId: string,
  data: Relevamiento,
  versionBase: number,
): Promise<{ version: number; conflicto: boolean }> {
  const json = relevamientoSchema.parse(data) as unknown as Prisma.InputJsonValue;
  const actual = await prisma.relevamiento.findUnique({ where: { contactoId }, select: { version: true } });

  if (!actual) {
    const creado = await prisma.relevamiento.create({ data: { contactoId, data: json } });
    return { version: creado.version, conflicto: false };
  }

  const guardado = await prisma.relevamiento.update({
    where: { contactoId },
    data: { data: json, version: { increment: 1 } },
  });
  return { version: guardado.version, conflicto: actual.version !== versionBase };
}
```

- [ ] **Paso 6: verificar tipos y pruebas**

Correr: `npx tsc --noEmit && npm test`
Esperado: `tsc` sin salida; todas las pruebas en PASS, incluidas las 49 que ya existían.

- [ ] **Paso 7: commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260910120000_relevamiento/migration.sql "src/app/contactos/[id]/relevamiento/actions.ts"
git commit -m "El relevamiento tiene su tabla y se guarda en el servidor con control de versión

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 7: Instalar la app y abrirla sin señal

**Archivos:**
- Crear: `src/app/manifest.ts`
- Crear: `public/sw.js`
- Crear: `src/components/RegistroServiceWorker.tsx`
- Modificar: `src/app/layout.tsx` (montar el registro)
- Modificar: `next.config.ts` (encabezados de `sw.js`)
- Modificar: `src/proxy.ts:17` (el `matcher`)

**Interfaces:**
- Consume: nada de tareas anteriores.
- Produce: `/manifest.webmanifest` y `/sw.js` accesibles sin sesión; componente `RegistroServiceWorker` (sin props).

**Antes de empezar**, leer `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` (secciones 1, 5 y 8) y `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`.

**Qué guarda el service worker, y qué no:**

| Pedido | Estrategia |
|---|---|
| `/_next/static/*` | Primero la copia guardada: son archivos inmutables con hash en el nombre |
| Abrir `/contactos/<id>/relevamiento` | Primero la red; sin red, la última copia guardada de esa página |
| Todo lo demás, y todo lo que no sea `GET` | No lo toca |

Las Server Actions son `POST` y nunca se guardan: sin red fallan, y la sincronización de la Tarea 10 reintenta.

- [ ] **Paso 1: el manifiesto**

```ts
// src/app/manifest.ts
import type { MetadataRoute } from "next";

/**
 * Lo que el iPhone lee al "Agregar a pantalla de inicio": abre a pantalla
 * completa y sobre grafito. El nombre corto es "Bruno Aldana" porque el manual
 * de marca pide el nombre completo y "BA" nunca como palabra.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bruno Aldana · Arquitectura",
    short_name: "Bruno Aldana",
    description: "Contactos, entrevistas y relevamiento del estudio.",
    start_url: "/contactos",
    display: "standalone",
    background_color: "#0F1113",
    theme_color: "#0F1113",
    icons: [{ src: "/icon.png", sizes: "4000x4000", type: "image/png" }],
  };
}
```

- [ ] **Paso 2: el service worker**

```js
// public/sw.js
/*
 * Service worker del relevamiento. Hace una sola cosa: que la página de
 * relevamiento abra sin señal en la visita. No toca nada más de la app.
 * Subir VERSION cuando cambie la estrategia, para descartar lo guardado antes.
 */
const VERSION = "relevamiento-v1";
const ES_RELEVAMIENTO = /^\/contactos\/[^/]+\/relevamiento\/?$/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const guardada = await cache.match(request);
        if (guardada) return guardada;
        const respuesta = await fetch(request);
        if (respuesta.ok) cache.put(request, respuesta.clone());
        return respuesta;
      }),
    );
    return;
  }

  if (request.mode === "navigate" && ES_RELEVAMIENTO.test(url.pathname)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        try {
          const respuesta = await fetch(request);
          if (respuesta.ok && !respuesta.redirected) cache.put(request, respuesta.clone());
          return respuesta;
        } catch {
          const guardada = await cache.match(request);
          if (guardada) return guardada;
          throw new Error("Sin señal y sin copia guardada de esta página");
        }
      }),
    );
  }
});
```

- [ ] **Paso 3: registrar el service worker**

```tsx
// src/components/RegistroServiceWorker.tsx
"use client";

import { useEffect } from "react";

/** Registra /sw.js una vez. En desarrollo no hace nada, para no guardar versiones viejas mientras se programa. */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
```

En `src/app/layout.tsx`, importar `import { RegistroServiceWorker } from "@/components/RegistroServiceWorker";` y reemplazar la línea del `body` por:

```tsx
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        {children}
        <RegistroServiceWorker />
      </body>
```

- [ ] **Paso 4: los encabezados de `sw.js`**

Reemplazar el contenido de `next.config.ts` por:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
  },
  // Según la guía de PWA de Next 16: el service worker nunca se guarda en caché,
  // así el iPhone recibe siempre la última versión.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Paso 5: excluir `sw.js` y el manifiesto del login**

En `src/proxy.ts`, reemplazar el `matcher`:

```ts
export const config = {
  // sw.js y el manifiesto quedan fuera: sin eso, el iPhone recibe la página de
  // login en lugar del service worker y la app nunca se puede instalar.
  matcher: ["/((?!login|sw\\.js|manifest\\.webmanifest|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"],
};
```

- [ ] **Paso 6: verificar sin sesión, con `curl`**

```bash
npx tsc --noEmit
npm run dev
```

Con el servidor andando, en otra terminal:

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/manifest.webmanifest
curl -s -I http://localhost:3000/sw.js | grep -iE "^HTTP|content-type|cache-control"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/contactos
```

Esperado:
- manifiesto: `200 application/manifest+json`
- `sw.js`: `HTTP/1.1 200`, `content-type: application/javascript; charset=utf-8`, `cache-control: no-cache, no-store, must-revalidate`
- `/contactos` sin sesión: `307 http://localhost:3000/login` (el login sigue protegiendo el resto)

Detener el servidor de desarrollo.

- [ ] **Paso 7: commit**

```bash
git add src/app/manifest.ts public/sw.js src/components/RegistroServiceWorker.tsx src/app/layout.tsx next.config.ts src/proxy.ts
git commit -m "La app se instala en el iPhone y la página de relevamiento abre sin señal

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 8: El campo de medida y el dibujo del plano

**Archivos:**
- Crear: `src/app/contactos/[id]/relevamiento/CampoMedida.tsx`
- Crear: `src/app/contactos/[id]/relevamiento/PlanoSvg.tsx`

**Interfaces:**
- Consume: `parsearMedida`, `ResultadoVoz` de `@/lib/relevamiento/voz` (Tarea 4); `Ambiente` de `@/lib/relevamiento/formato` (Tarea 1); `recorridoAPoligono`, `errorDeCierre`, `Punto` de `@/lib/relevamiento/geometria` (Tarea 2); `TOLERANCIA_CM` de `@/lib/relevamiento/controles` (Tarea 3); `inputClass`, `labelClass` de `@/components/ui/field`.
- Produce:
  - `CampoMedida({ id, etiqueta, valor, onCambio }: { id: string; etiqueta: string; valor: number | null; onCambio: (cm: number | null) => void })`
  - `PlanoSvg({ ambiente, impresion }: { ambiente: Ambiente; impresion?: boolean })`

Estos componentes no llevan prueba unitaria: `vitest` corre sin DOM. La lógica que deciden ya está probada en las Tareas 2 a 4; acá se verifican tipos, y en pantalla en la Tarea 10.

**El campo de medida acepta las tres formas en el mismo lugar:**
- **Teclado:** se escribe y se confirma con Enter o saliendo del campo.
- **Láser en modo teclado:** escribe en el campo con foco y manda Enter; entra por el mismo camino.
- **Voz:** el botón de micrófono usa el reconocimiento del navegador. Si no existe o falla —puede pasar en el iPhone con la app instalada—, avisa que se use el micrófono del teclado del iPhone, que dicta en el mismo campo.

Siempre muestra centímetros. Si lo dicho es ambiguo, muestra las opciones como botones y no guarda nada hasta que se elija.

- [ ] **Paso 1: el campo de medida**

```tsx
// src/app/contactos/[id]/relevamiento/CampoMedida.tsx
"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/ui/field";
import { parsearMedida } from "@/lib/relevamiento/voz";

type Reconocedor = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function crearReconocedor(): Reconocedor | null {
  const w = window as unknown as { SpeechRecognition?: new () => Reconocedor; webkitSpeechRecognition?: new () => Reconocedor };
  const Clase = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Clase ? new Clase() : null;
}

export function CampoMedida({
  id,
  etiqueta,
  valor,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: number | null;
  onCambio: (cm: number | null) => void;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : String(valor));
  const [opciones, setOpciones] = useState<number[]>([]);
  const [aviso, setAviso] = useState("");
  const [escuchando, setEscuchando] = useState(false);

  function elegir(cm: number | null) {
    setTexto(cm === null ? "" : String(cm));
    setOpciones([]);
    setAviso("");
    onCambio(cm);
  }

  function interpretar(dicho: string) {
    if (dicho.trim() === "") return elegir(null);
    const r = parsearMedida(dicho);
    if (r.tipo === "medida") return elegir(r.cm);
    if (r.tipo === "ambiguo") {
      setOpciones(r.opciones);
      setAviso(`«${dicho}» puede ser:`);
      return;
    }
    setAviso(`No entendí «${dicho}» como una medida`);
  }

  function dictar() {
    const rec = crearReconocedor();
    if (!rec) {
      setAviso("La voz no está disponible acá: usá el micrófono del teclado del iPhone");
      return;
    }
    rec.lang = "es-419";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => interpretar(e.results[0][0].transcript);
    rec.onerror = () => setAviso("No pude escuchar: probá de nuevo o usá el micrófono del teclado");
    rec.onend = () => setEscuchando(false);
    setEscuchando(true);
    rec.start();
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>{etiqueta}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => interpretar(texto)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                interpretar(texto);
              }
            }}
            className={`${inputClass} pr-12`}
          />
          <span className="dato pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-neutral-500">cm</span>
        </div>
        <button
          type="button"
          onClick={dictar}
          aria-label={`Dictar ${etiqueta}`}
          className={`rounded-xl px-4 text-sm transition-[background-color] duration-150 ${escuchando ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-200 hover:bg-white/[0.12]"}`}
        >
          {escuchando ? "Escuchando" : "Dictar"}
        </button>
      </div>
      {aviso && <p className="mt-2 text-sm text-neutral-400">{aviso}</p>}
      {opciones.length > 0 && (
        <div className="mt-2 flex gap-2">
          {opciones.map((cm) => (
            <button key={cm} type="button" onClick={() => elegir(cm)} className="dato rounded-full bg-white/[0.07] px-4 py-2 text-neutral-100 hover:bg-white/[0.12]">
              {cm} cm
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Paso 2: el dibujo del plano**

Coordenadas en centímetros dentro del `viewBox`, igual que el motor geométrico: el dibujo escala solo a la pantalla. Las cotas van del lado de afuera de cada pared, que en un recorrido horario es la izquierda de su dirección.

```tsx
// src/app/contactos/[id]/relevamiento/PlanoSvg.tsx
import type { Ambiente } from "@/lib/relevamiento/formato";
import { errorDeCierre, recorridoAPoligono, type Punto } from "@/lib/relevamiento/geometria";
import { TOLERANCIA_CM } from "@/lib/relevamiento/controles";

const sobre = (a: Punto, b: Punto, t: number): Punto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function PlanoSvg({ ambiente, impresion = false }: { ambiente: Ambiente; impresion?: boolean }) {
  const { vertices, completo } = recorridoAPoligono(ambiente.paredes);
  if (vertices.length < 2) {
    return <p className="py-16 text-center text-sm text-neutral-500">Cargá la primera medida y el plano aparece acá.</p>;
  }

  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const ancho = Math.max(...xs) - Math.min(...xs);
  const alto = Math.max(...ys) - Math.min(...ys);
  const lado = Math.max(ancho, alto, 100);
  const margen = lado * 0.18;
  const texto = lado / 22;
  const trazo = lado / 120;
  const viewBox = `${Math.min(...xs) - margen} ${Math.min(...ys) - margen} ${ancho + margen * 2} ${alto + margen * 2}`;
  const cierre = completo ? errorDeCierre(ambiente.paredes) : null;
  const tinta = impresion ? "#0F1113" : "currentColor";

  const tramos = vertices.slice(0, -1).map((a, i) => {
    const b = vertices[i + 1];
    const largo = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const afuera = { x: (b.y - a.y) / largo, y: -(b.x - a.x) / largo };
    const medio = sobre(a, b, 0.5);
    return { a, b, largo, pared: ambiente.paredes[i], cota: { x: medio.x + afuera.x * texto * 1.4, y: medio.y + afuera.y * texto * 1.4 } };
  });

  return (
    <svg viewBox={viewBox} className={impresion ? "h-auto w-full" : "h-auto w-full text-neutral-100"} role="img" aria-label={`Plano de ${ambiente.nombre}`}>
      <polyline points={vertices.map((v) => `${v.x},${v.y}`).join(" ")} fill="none" stroke={tinta} strokeWidth={trazo * 4} strokeLinejoin="miter" />

      {ambiente.elementos
        .filter((e) => (e.tipo === "puerta" || e.tipo === "ventana") && e.desde != null && e.hasta != null)
        .map((e) => {
          const t = tramos.find((x) => x.pared?.id === e.pared);
          if (!t) return null;
          const p0 = sobre(t.a, t.b, (e.desde as number) / t.largo);
          const p1 = sobre(t.a, t.b, Math.min(e.hasta as number, t.largo) / t.largo);
          const medio = sobre(p0, p1, 0.5);
          return (
            <g key={e.id}>
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={impresion ? "#FFFFFF" : "#0F1113"} strokeWidth={trazo * 5} />
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={tinta} strokeWidth={trazo} strokeDasharray={e.tipo === "ventana" ? `${trazo * 3} ${trazo * 2}` : undefined} />
              <text x={medio.x} y={medio.y - texto * 0.6} fontSize={texto * 0.8} textAnchor="middle" fill={tinta} fontFamily="var(--font-jetbrains), monospace">{e.codigo}</text>
            </g>
          );
        })}

      {tramos.map((t, i) => (
        <text key={i} x={t.cota.x} y={t.cota.y} fontSize={texto} textAnchor="middle" dominantBaseline="middle" fill={tinta} fontFamily="var(--font-jetbrains), monospace">
          {t.pared?.largo}
        </text>
      ))}

      {cierre !== null && cierre > TOLERANCIA_CM && (
        <g>
          <line x1={vertices[vertices.length - 1].x} y1={vertices[vertices.length - 1].y} x2={vertices[0].x} y2={vertices[0].y} stroke="var(--color-danger-600)" strokeWidth={trazo * 2} strokeDasharray={`${trazo * 4} ${trazo * 3}`} />
          <text x={vertices[0].x} y={vertices[0].y - texto} fontSize={texto * 0.9} fill="var(--color-danger-600)">no cierra: {cierre} cm</text>
        </g>
      )}
    </svg>
  );
}
```

- [ ] **Paso 3: verificar tipos**

Correr: `npx tsc --noEmit`
Esperado: sin salida.

- [ ] **Paso 4: commit**

```bash
git add "src/app/contactos/[id]/relevamiento/CampoMedida.tsx" "src/app/contactos/[id]/relevamiento/PlanoSvg.tsx"
git commit -m "La medida entra por teclado, voz o láser, y el plano se dibuja con sus cotas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 9: Paredes, alturas y diagonales

**Archivos:**
- Crear: `src/app/contactos/[id]/relevamiento/PanelParedes.tsx`

**Interfaces:**
- Consume: `Ambiente`, `Pared`, `Giro` de `@/lib/relevamiento/formato` (Tarea 1); `CAMPOS_FORMA`, `formaAParedes`, `errorDeCierre`, `TipoForma` de `@/lib/relevamiento/geometria` (Tarea 2); `CampoMedida` (Tarea 8); `labelClass` de `@/components/ui/field`.
- Produce: `PanelParedes({ ambiente, onCambio }: { ambiente: Ambiente; onCambio: (a: Ambiente) => void })`; `diagonalesDelProtocolo(cantidadParedes: number): { desdeVertice: number; hastaVertice: number }[]`.

**Cómo funciona:**
- **Forma rápida:** se elige rectángulo, L o U y se cargan sus medidas; las paredes se regeneran con cada medida. Los ids `pared-1`, `pared-2`… no cambian, así las aberturas siguen atadas a su pared.
- **Recorrido:** una fila por pared con su largo y su giro al terminarla. Arriba, en vivo, cuánto falta para cerrar.
- **Pasar de recorrido a forma rápida borra el recorrido**, así que pide un segundo toque para confirmar.
- **Alturas:** los tres puntos del protocolo.
- **Diagonales:** dos, entre esquinas opuestas. En un ambiente de *n* paredes: de la esquina 1 a la 1 + n/2, y de la 2 a la 2 + n/2.

Cada `CampoMedida` lleva una `key` que incluye el id del ambiente: al cambiar de ambiente se vuelve a montar y no arrastra el texto del anterior.

- [ ] **Paso 1: el panel**

```tsx
// src/app/contactos/[id]/relevamiento/PanelParedes.tsx
"use client";

import { useState } from "react";
import { labelClass } from "@/components/ui/field";
import type { Ambiente, Giro, Pared } from "@/lib/relevamiento/formato";
import { CAMPOS_FORMA, errorDeCierre, formaAParedes, type TipoForma } from "@/lib/relevamiento/geometria";
import { CampoMedida } from "./CampoMedida";

const NOMBRE_FORMA: Record<TipoForma, string> = { rectangulo: "Rectángulo", L: "L", U: "U" };
const NOMBRE_ALTURA = { puerta: "Altura junto a la puerta", centro: "Altura al centro", opuesta: "Altura en la esquina opuesta" };

/** Las dos diagonales entre esquinas opuestas que pide el protocolo. Vértices numerados desde 0. */
export function diagonalesDelProtocolo(cantidadParedes: number): { desdeVertice: number; hastaVertice: number }[] {
  if (cantidadParedes < 4) return [];
  const mitad = Math.floor(cantidadParedes / 2);
  return [
    { desdeVertice: 0, hastaVertice: mitad },
    { desdeVertice: 1, hastaVertice: 1 + mitad },
  ];
}

function conDiagonales(a: Ambiente, paredes: Pared[]): Ambiente {
  const diagonales = diagonalesDelProtocolo(paredes.length).map((d) => ({
    ...d,
    medida: a.diagonales.find((x) => x.desdeVertice === d.desdeVertice && x.hastaVertice === d.hastaVertice)?.medida ?? null,
  }));
  return { ...a, paredes, diagonales };
}

const opcion = (activo: boolean) =>
  `rounded-full px-4 py-2 text-sm transition-[background-color,color] duration-150 ${activo ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-300 hover:bg-white/[0.12]"}`;

export function PanelParedes({ ambiente: a, onCambio }: { ambiente: Ambiente; onCambio: (a: Ambiente) => void }) {
  const [confirmarForma, setConfirmarForma] = useState(false);
  const tipo: TipoForma = a.forma?.tipo ?? "rectangulo";
  const medidas = a.forma?.medidas ?? {};
  const cierre = errorDeCierre(a.paredes);

  function aplicarForma(nuevoTipo: TipoForma, nuevasMedidas: Record<string, number | null>) {
    const paredes = formaAParedes(nuevoTipo, nuevasMedidas);
    onCambio(conDiagonales({ ...a, metodo: "forma", forma: { tipo: nuevoTipo, medidas: nuevasMedidas } }, paredes));
  }

  function aRecorrido() {
    const paredes = a.paredes.length > 0 ? a.paredes : [{ id: "pared-1", largo: null, giro: "D" as Giro }];
    onCambio(conDiagonales({ ...a, metodo: "recorrido", forma: undefined }, paredes));
  }

  function aForma() {
    if (a.metodo === "recorrido" && a.paredes.some((p) => p.largo !== null) && !confirmarForma) {
      setConfirmarForma(true);
      return;
    }
    setConfirmarForma(false);
    aplicarForma("rectangulo", {});
  }

  function cambiarPared(i: number, patch: Partial<Pared>) {
    const paredes = a.paredes.map((p, j) => (j === i ? { ...p, ...patch } : p));
    onCambio(conDiagonales(a, paredes));
  }

  function agregarPared() {
    const paredes = [...a.paredes, { id: `pared-${a.paredes.length + 1}`, largo: null, giro: "D" as Giro }];
    onCambio(conDiagonales(a, paredes));
  }

  function quitarUltima() {
    const id = a.paredes[a.paredes.length - 1]?.id;
    const paredes = a.paredes.slice(0, -1);
    onCambio(conDiagonales({ ...a, elementos: a.elementos.filter((e) => e.pared !== id) }, paredes));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={opcion(a.metodo === "forma")} onClick={aForma}>Forma rápida</button>
        <button type="button" className={opcion(a.metodo === "recorrido")} onClick={aRecorrido}>Recorrido</button>
      </div>
      {confirmarForma && (
        <p className="text-sm text-neutral-300">
          Pasar a forma rápida borra el recorrido cargado.{" "}
          <button type="button" className="underline" onClick={aForma}>Tocá acá para confirmar</button>
        </p>
      )}

      {a.metodo === "forma" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(Object.keys(CAMPOS_FORMA) as TipoForma[]).map((t) => (
              <button key={t} type="button" className={opcion(t === tipo)} onClick={() => aplicarForma(t, {})}>
                {NOMBRE_FORMA[t]}
              </button>
            ))}
          </div>
          {CAMPOS_FORMA[tipo].map((c) => (
            <CampoMedida
              key={`${a.id}-${tipo}-${c.clave}`}
              id={`${a.id}-${c.clave}`}
              etiqueta={c.etiqueta}
              valor={medidas[c.clave] ?? null}
              onCambio={(cm) => aplicarForma(tipo, { ...medidas, [c.clave]: cm })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="dato text-neutral-400">
            {cierre === null ? "Faltan paredes por medir" : cierre === 0 ? "El recorrido cierra" : `Faltan ${cierre} cm para cerrar`}
          </p>
          {a.paredes.map((p, i) => (
            <div key={`${a.id}-${p.id}`} className="flex items-end gap-3">
              <div className="flex-1">
                <CampoMedida id={`${a.id}-${p.id}`} etiqueta={`Pared ${i + 1}`} valor={p.largo} onCambio={(cm) => cambiarPared(i, { largo: cm })} />
              </div>
              <div>
                <span className={labelClass}>Giro</span>
                <div className="flex gap-1">
                  <button type="button" className={opcion(p.giro === "I")} onClick={() => cambiarPared(i, { giro: "I" })}>Izq.</button>
                  <button type="button" className={opcion(p.giro === "D")} onClick={() => cambiarPared(i, { giro: "D" })}>Der.</button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className={opcion(false)} onClick={agregarPared}>Agregar pared</button>
            {a.paredes.length > 1 && <button type="button" className={opcion(false)} onClick={quitarUltima}>Quitar la última</button>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {a.alturas.map((h, i) => (
          <CampoMedida
            key={`${a.id}-altura-${h.punto}`}
            id={`${a.id}-altura-${h.punto}`}
            etiqueta={NOMBRE_ALTURA[h.punto]}
            valor={h.medida}
            onCambio={(cm) => onCambio({ ...a, alturas: a.alturas.map((x, j) => (j === i ? { ...x, medida: cm } : x)) })}
          />
        ))}
      </div>

      {a.diagonales.length > 0 && (
        <div className="space-y-4">
          {a.diagonales.map((d, i) => (
            <CampoMedida
              key={`${a.id}-diag-${d.desdeVertice}-${d.hastaVertice}`}
              id={`${a.id}-diag-${i}`}
              etiqueta={`Diagonal de la esquina ${d.desdeVertice + 1} a la ${d.hastaVertice + 1}`}
              valor={d.medida}
              onCambio={(cm) => onCambio({ ...a, diagonales: a.diagonales.map((x, j) => (j === i ? { ...x, medida: cm } : x)) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Paso 2: verificar tipos**

Correr: `npx tsc --noEmit`
Esperado: sin salida.

- [ ] **Paso 3: commit**

```bash
git add "src/app/contactos/[id]/relevamiento/PanelParedes.tsx"
git commit -m "Las paredes se cargan por forma rápida o por recorrido, con alturas y diagonales

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 10: Puertas, ventanas y el control de cierre en pantalla

**Archivos:**
- Crear: `src/app/contactos/[id]/relevamiento/PanelAberturas.tsx`
- Crear: `src/app/contactos/[id]/relevamiento/ControlCierre.tsx`

**Interfaces:**
- Consume: `Ambiente`, `Elemento` de `@/lib/relevamiento/formato` (Tarea 1); `datosFaltantes`, `Hallazgo` de `@/lib/relevamiento/controles` (Tarea 3); `CampoMedida` (Tarea 8); `Badge` de `@/components/ui/Badge`; `inputClass`, `labelClass` de `@/components/ui/field`.
- Produce:
  - `PanelAberturas({ ambiente, onCambio, codigoSiguiente }: { ambiente: Ambiente; onCambio: (a: Ambiente) => void; codigoSiguiente: (tipo: "puerta" | "ventana") => string })`
  - `ControlCierre({ hallazgos, nombres }: { hallazgos: Hallazgo[]; nombres: Record<string, string> })`

**Los códigos** (P1, P2, V1…) se numeran en todo el relevamiento y no por ambiente, para que en Revit no haya dos P1. Por eso los calcula la página (Tarea 11) y llegan por `codigoSiguiente`.

**Las cotas de cada abertura** se miden desde el vértice de inicio de su pared, como manda el protocolo: el campo dice "Empieza a" y "Termina a", no "ancho".

- [ ] **Paso 1: el panel de aberturas**

```tsx
// src/app/contactos/[id]/relevamiento/PanelAberturas.tsx
"use client";

import { inputClass, labelClass } from "@/components/ui/field";
import type { Ambiente, Elemento } from "@/lib/relevamiento/formato";
import { datosFaltantes } from "@/lib/relevamiento/controles";
import { CampoMedida } from "./CampoMedida";

const APERTURAS: [NonNullable<Elemento["apertura"]>, string][] = [
  ["corrediza", "Corrediza"],
  ["batiente", "Batiente"],
  ["pivotante", "Pivotante"],
  ["fija", "Fija"],
];

function Selector<T extends string>({ id, etiqueta, valor, opciones, onCambio }: {
  id: string;
  etiqueta: string;
  valor: T | null | undefined;
  opciones: [T, string][];
  onCambio: (v: T | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{etiqueta}</label>
      <select id={id} value={valor ?? ""} onChange={(e) => onCambio((e.target.value || null) as T | null)} className={inputClass}>
        <option value="">Elegir</option>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

export function PanelAberturas({ ambiente: a, onCambio, codigoSiguiente }: {
  ambiente: Ambiente;
  onCambio: (a: Ambiente) => void;
  codigoSiguiente: (tipo: "puerta" | "ventana") => string;
}) {
  const aberturas = a.elementos.filter((e) => e.tipo === "puerta" || e.tipo === "ventana");
  const paredes: [string, string][] = a.paredes.map((p, i) => [p.id, `Pared ${i + 1}${p.largo !== null ? ` · ${p.largo} cm` : ""}`]);

  function agregar(tipo: "puerta" | "ventana") {
    const nuevo: Elemento = {
      id: crypto.randomUUID(),
      codigo: codigoSiguiente(tipo),
      tipo,
      pared: a.paredes[0]?.id,
      desde: null,
      hasta: null,
      alto: null,
      ...(tipo === "ventana" ? { antepecho: null } : {}),
      espesorMuro: null,
      apertura: null,
    };
    onCambio({ ...a, elementos: [...a.elementos, nuevo] });
  }

  function cambiar(id: string, patch: Partial<Elemento>) {
    onCambio({ ...a, elementos: a.elementos.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }

  function quitar(id: string) {
    onCambio({ ...a, elementos: a.elementos.filter((e) => e.id !== id) });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button type="button" onClick={() => agregar("puerta")} className="rounded-full bg-white/[0.07] px-4 py-2 text-sm text-neutral-200 hover:bg-white/[0.12]">Agregar puerta</button>
        <button type="button" onClick={() => agregar("ventana")} className="rounded-full bg-white/[0.07] px-4 py-2 text-sm text-neutral-200 hover:bg-white/[0.12]">Agregar ventana</button>
      </div>

      {aberturas.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay puertas ni ventanas en este ambiente.</p>}

      {aberturas.map((e) => {
        const faltan = datosFaltantes(e);
        const k = (campo: string) => `${a.id}-${e.id}-${campo}`;
        return (
          <div key={e.id} className="space-y-4 rounded-2xl border border-white/8 bg-neutral-900 p-5">
            <div className="flex items-center justify-between">
              <p className="dato text-neutral-100">{e.codigo} · {e.tipo === "puerta" ? "Puerta" : "Ventana"}</p>
              <button type="button" onClick={() => quitar(e.id)} className="text-sm text-danger-600 hover:underline">Quitar</button>
            </div>
            <Selector id={k("pared")} etiqueta="En qué pared" valor={e.pared} opciones={paredes} onCambio={(v) => cambiar(e.id, { pared: v ?? undefined })} />
            <CampoMedida key={k("desde")} id={k("desde")} etiqueta="Empieza a (desde la esquina)" valor={e.desde ?? null} onCambio={(cm) => cambiar(e.id, { desde: cm })} />
            <CampoMedida key={k("hasta")} id={k("hasta")} etiqueta="Termina a (desde la esquina)" valor={e.hasta ?? null} onCambio={(cm) => cambiar(e.id, { hasta: cm })} />
            <CampoMedida key={k("alto")} id={k("alto")} etiqueta="Alto del vano" valor={e.alto ?? null} onCambio={(cm) => cambiar(e.id, { alto: cm })} />
            {e.tipo === "ventana" && (
              <CampoMedida key={k("antepecho")} id={k("antepecho")} etiqueta="Antepecho (del piso al borde inferior)" valor={e.antepecho ?? null} onCambio={(cm) => cambiar(e.id, { antepecho: cm })} />
            )}
            <CampoMedida key={k("muro")} id={k("muro")} etiqueta="Espesor de muro" valor={e.espesorMuro ?? null} onCambio={(cm) => cambiar(e.id, { espesorMuro: cm })} />
            <Selector id={k("apertura")} etiqueta="Tipo de apertura" valor={e.apertura} opciones={APERTURAS} onCambio={(v) => cambiar(e.id, { apertura: v })} />
            {e.tipo === "puerta" && (e.apertura === "batiente" || e.apertura === "pivotante") && (
              <>
                <Selector id={k("abre")} etiqueta="Hacia dónde abre" valor={e.abreHacia} opciones={[["adentro", "Hacia adentro"], ["afuera", "Hacia afuera"]]} onCambio={(v) => cambiar(e.id, { abreHacia: v })} />
                <Selector id={k("bisagra")} etiqueta="Bisagra" valor={e.bisagra} opciones={[["inicio", "Del lado donde empieza"], ["fin", "Del lado donde termina"]]} onCambio={(v) => cambiar(e.id, { bisagra: v })} />
              </>
            )}
            {faltan.length > 0 && <p className="text-sm text-danger-600">Falta: {faltan.join(", ")}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Paso 2: el control de cierre**

Los errores van primero, después los avisos. Cada línea nombra su ambiente, porque en la etapa 2 la lista cubre la casa entera.

```tsx
// src/app/contactos/[id]/relevamiento/ControlCierre.tsx
import { Badge } from "@/components/ui/Badge";
import type { Hallazgo } from "@/lib/relevamiento/controles";

const TONO = { error: "danger", aviso: "info", ok: "success" } as const;
const ETIQUETA = { error: "Error", aviso: "Aviso", ok: "Cierra" } as const;
const ORDEN = { error: 0, aviso: 1, ok: 2 } as const;

export function ControlCierre({ hallazgos, nombres }: { hallazgos: Hallazgo[]; nombres: Record<string, string> }) {
  const ordenados = [...hallazgos].sort((x, y) => ORDEN[x.nivel] - ORDEN[y.nivel]);
  return (
    <ul className="space-y-2">
      {ordenados.map((h, i) => (
        <li key={i} className="flex items-start gap-3">
          <Badge tone={TONO[h.nivel]}>{ETIQUETA[h.nivel]}</Badge>
          <p className="pt-1 text-sm text-neutral-200">
            <span className="text-neutral-500">{nombres[h.ambienteId] ?? h.ambienteId} · </span>
            {h.mensaje}
          </p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Paso 3: verificar tipos**

Correr: `npx tsc --noEmit`
Esperado: sin salida.

- [ ] **Paso 4: commit**

```bash
git add "src/app/contactos/[id]/relevamiento/PanelAberturas.tsx" "src/app/contactos/[id]/relevamiento/ControlCierre.tsx"
git commit -m "Cada puerta y ventana pide sus siete datos, y el control de cierre se ve en pantalla

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 11: La página que junta todo y sincroniza

**Archivos:**
- Crear: `src/app/contactos/[id]/relevamiento/sincronizador.ts`
- Crear: `src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx`
- Crear: `src/app/contactos/[id]/relevamiento/page.tsx`
- Modificar: `src/app/contactos/[id]/page.tsx` (botón en la ficha del contacto)

**Interfaces:**
- Consume: todo lo anterior. En particular `guardarRelevamiento` (Tarea 6), `leerLocal`, `guardarLocal`, `pedirPersistencia`, `decidirAlAbrir`, `CopiaRemota` (Tarea 5), `controlarAmbiente`, `controlarRelevamiento` (Tarea 3), `superficieM2`, `perimetroCm` (Tarea 2), `crearAmbiente`, `crearRelevamientoVacio`, `relevamientoSchema` (Tarea 1), y los componentes de las Tareas 8 a 10.
- Produce:
  - `type EstadoSync = "cargando" | "local" | "subiendo" | "subido" | "sin-senal" | "conflicto"`
  - `crearSincronizador(contactoId: string, alCambiarDatos: (r: Relevamiento) => void, alCambiarEstado: (e: EstadoSync) => void): { iniciar(inicial: Relevamiento, version: number, conCambios: boolean): void; cambiar(r: Relevamiento): void; reintentar(): void; datos(): Relevamiento | null }`
  - `RelevamientoApp({ contactoId, nombre, direccion, ambientesEntrevista, remoto })`
  - La ruta `/contactos/[id]/relevamiento`.

**Por qué un sincronizador aparte del componente:** la subida es asíncrona, se reintenta con un temporizador y vuelve a correr cuando vuelve la señal. Si esa lógica leyera el estado de React, trabajaría con copias viejas. Un objeto creado una sola vez, que guarda sus propios datos, no tiene ese problema y se entiende sin conocer React.

**El flujo de cada cambio:** se muestra en pantalla → se guarda en el teléfono al instante → un segundo y medio después de la última medida, se sube. Si al terminar de subir ya había otro cambio, se vuelve a programar.

- [ ] **Paso 1: el sincronizador**

```ts
// src/app/contactos/[id]/relevamiento/sincronizador.ts
import type { Relevamiento } from "@/lib/relevamiento/formato";
import { guardarLocal } from "@/lib/relevamiento/almacen";
import { guardarRelevamiento } from "./actions";

export type EstadoSync = "cargando" | "local" | "subiendo" | "subido" | "sin-senal" | "conflicto";

const ESPERA_MS = 1500;

export function crearSincronizador(
  contactoId: string,
  alCambiarDatos: (r: Relevamiento) => void,
  alCambiarEstado: (e: EstadoSync) => void,
) {
  let data: Relevamiento | null = null;
  let versionBase = 0;
  let pendiente = false;
  let cambios = 0;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  function persistir() {
    if (!data) return Promise.resolve();
    return guardarLocal(contactoId, { data, versionBase, pendiente, guardadoEn: new Date().toISOString() }).catch(() => {});
  }

  function programar() {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => void subir(), ESPERA_MS);
  }

  async function subir() {
    if (!data || !pendiente) return;
    if (!navigator.onLine) {
      alCambiarEstado("sin-senal");
      return;
    }
    const enviados = cambios;
    alCambiarEstado("subiendo");
    try {
      const r = await guardarRelevamiento(contactoId, data, versionBase);
      versionBase = r.version;
      if (cambios === enviados) pendiente = false;
      await persistir();
      if (pendiente) {
        alCambiarEstado("local");
        programar();
      } else {
        alCambiarEstado(r.conflicto ? "conflicto" : "subido");
      }
    } catch {
      alCambiarEstado("sin-senal");
    }
  }

  return {
    iniciar(inicial: Relevamiento, version: number, conCambios: boolean) {
      data = inicial;
      versionBase = version;
      pendiente = conCambios;
      alCambiarDatos(inicial);
      void persistir();
      if (conCambios) {
        alCambiarEstado("local");
        void subir();
      } else {
        alCambiarEstado("subido");
      }
    },
    cambiar(r: Relevamiento) {
      data = r;
      pendiente = true;
      cambios += 1;
      alCambiarDatos(r);
      alCambiarEstado("local");
      void persistir();
      programar();
    },
    reintentar() {
      if (pendiente) void subir();
    },
    datos() {
      return data;
    },
  };
}
```

- [ ] **Paso 2: la pantalla**

```tsx
// src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/field";
import { crearAmbiente, crearRelevamientoVacio, type Ambiente, type Relevamiento } from "@/lib/relevamiento/formato";
import { controlarAmbiente, controlarRelevamiento } from "@/lib/relevamiento/controles";
import { perimetroCm, superficieM2 } from "@/lib/relevamiento/geometria";
import { decidirAlAbrir, type CopiaRemota } from "@/lib/relevamiento/sincronizacion";
import { leerLocal, pedirPersistencia } from "@/lib/relevamiento/almacen";
import { crearSincronizador, type EstadoSync } from "./sincronizador";
import { PlanoSvg } from "./PlanoSvg";
import { PanelParedes } from "./PanelParedes";
import { PanelAberturas } from "./PanelAberturas";
import { ControlCierre } from "./ControlCierre";

const TEXTO_SYNC: Record<EstadoSync, string> = {
  cargando: "Abriendo…",
  local: "Guardado en el teléfono · falta subir",
  subiendo: "Subiendo…",
  subido: "Todo subido",
  "sin-senal": "Sin señal · guardado en el teléfono",
  conflicto: "Subido · reemplazó una versión más nueva del servidor",
};

type Pestana = "paredes" | "aberturas" | "control";

const opcion = (activo: boolean) =>
  `rounded-full px-4 py-2 text-sm transition-[background-color,color] duration-150 ${activo ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-300 hover:bg-white/[0.12]"}`;

export function RelevamientoApp({ contactoId, nombre, direccion, ambientesEntrevista, remoto }: {
  contactoId: string;
  nombre: string;
  direccion: string;
  ambientesEntrevista: string[];
  remoto: CopiaRemota | null;
}) {
  const [rel, setRel] = useState<Relevamiento | null>(null);
  const [sync, setSync] = useState<EstadoSync>("cargando");
  const [sinc] = useState(() => crearSincronizador(contactoId, setRel, setSync));
  const [elegido, setElegido] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("paredes");
  const [nuevoAmbiente, setNuevoAmbiente] = useState("");

  useEffect(() => {
    let vigente = true;
    void pedirPersistencia();
    leerLocal(contactoId)
      .catch(() => null)
      .then((local) => {
        if (!vigente) return;
        const d = decidirAlAbrir(local, remoto);
        if (d.accion === "crear") {
          const fecha = new Date().toISOString().slice(0, 10);
          sinc.iniciar(crearRelevamientoVacio({ contactoId, nombre, direccion, ambientes: ambientesEntrevista, fecha }), 0, true);
        } else if (d.accion === "usar-remoto" && remoto) {
          sinc.iniciar(remoto.data, remoto.version, false);
        } else if (local) {
          sinc.iniciar(local.data, local.versionBase, local.pendiente);
        }
      });
    const alVolverLaSenal = () => sinc.reintentar();
    window.addEventListener("online", alVolverLaSenal);
    return () => {
      vigente = false;
      window.removeEventListener("online", alVolverLaSenal);
    };
  }, [contactoId, nombre, direccion, ambientesEntrevista, remoto, sinc]);

  if (!rel) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-sm text-neutral-500">Abriendo el relevamiento…</p>
      </main>
    );
  }

  const actual = rel;
  const nivel = actual.niveles[0];
  const ambiente = nivel.ambientes.find((a) => a.id === elegido) ?? nivel.ambientes[0];
  const nombres = Object.fromEntries(nivel.ambientes.map((a) => [a.id, a.nombre]));
  const todos = controlarRelevamiento(actual);
  const errores = todos.filter((h) => h.nivel === "error").length;
  const superficie = superficieM2(ambiente.paredes);
  const perimetro = perimetroCm(ambiente.paredes);

  function cambiarAmbiente(a: Ambiente) {
    sinc.cambiar({
      ...actual,
      niveles: actual.niveles.map((n, i) => (i === 0 ? { ...n, ambientes: n.ambientes.map((x) => (x.id === a.id ? a : x)) } : n)),
    });
  }

  function agregarAmbiente() {
    const n = nuevoAmbiente.trim();
    if (!n) return;
    const id = `amb-${crypto.randomUUID().slice(0, 8)}`;
    sinc.cambiar({
      ...actual,
      niveles: actual.niveles.map((nv, i) => (i === 0 ? { ...nv, ambientes: [...nv.ambientes, crearAmbiente(id, n)] } : nv)),
    });
    setElegido(id);
    setNuevoAmbiente("");
  }

  /** P1, P2… y V1, V2… numerados en todo el relevamiento, para que en Revit no haya dos P1. */
  function codigoSiguiente(tipo: "puerta" | "ventana") {
    const letra = tipo === "puerta" ? "P" : "V";
    const patron = new RegExp(`^${letra}(\\d+)$`);
    const usados = actual.niveles
      .flatMap((nv) => nv.ambientes.flatMap((a) => a.elementos))
      .map((e) => Number(patron.exec(e.codigo)?.[1] ?? 0));
    return `${letra}${Math.max(0, ...usados) + 1}`;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href={`/contactos/${contactoId}`} className="rotulo text-neutral-500 transition-colors duration-150 hover:text-neutral-200">
        ← {nombre}
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">Relevamiento</h1>
        <p className="dato text-neutral-400" aria-live="polite">{TEXTO_SYNC[sync]}</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {nivel.ambientes.map((a) => (
          <button key={a.id} type="button" className={opcion(a.id === ambiente.id)} onClick={() => setElegido(a.id)}>
            {a.nombre}
          </button>
        ))}
      </div>
      <div className="mb-8 flex gap-2">
        <input
          value={nuevoAmbiente}
          onChange={(e) => setNuevoAmbiente(e.target.value)}
          placeholder="Nombre de otro ambiente"
          aria-label="Nombre del ambiente nuevo"
          className={inputClass}
        />
        <button type="button" className={opcion(false)} onClick={agregarAmbiente}>Agregar</button>
      </div>

      <Card className="p-4">
        <PlanoSvg ambiente={ambiente} />
      </Card>
      <p className="dato mt-3 text-neutral-400">
        {superficie !== null ? `${superficie.toLocaleString("es-BO", { maximumFractionDigits: 2 })} m²` : "La superficie aparece cuando el ambiente cierra"}
        {perimetro !== null ? ` · perímetro ${perimetro} cm` : ""}
      </p>

      <div className="mt-8 mb-6 flex flex-wrap gap-2">
        <button type="button" className={opcion(pestana === "paredes")} onClick={() => setPestana("paredes")}>Paredes</button>
        <button type="button" className={opcion(pestana === "aberturas")} onClick={() => setPestana("aberturas")}>Puertas y ventanas</button>
        <button type="button" className={opcion(pestana === "control")} onClick={() => setPestana("control")}>
          Terminar visita{errores > 0 ? ` · ${errores} ${errores === 1 ? "error" : "errores"}` : ""}
        </button>
      </div>

      {pestana === "paredes" && <PanelParedes key={ambiente.id} ambiente={ambiente} onCambio={cambiarAmbiente} />}
      {pestana === "aberturas" && (
        <PanelAberturas key={ambiente.id} ambiente={ambiente} onCambio={cambiarAmbiente} codigoSiguiente={codigoSiguiente} />
      )}
      {pestana === "control" && <ControlCierre hallazgos={todos} nombres={nombres} />}
      {pestana !== "control" && (
        <div className="mt-10">
          <ControlCierre hallazgos={controlarAmbiente(ambiente)} nombres={nombres} />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Paso 3: la página del servidor**

```tsx
// src/app/contactos/[id]/relevamiento/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import type { EntrevistaState } from "@/lib/entrevista/types";
import { relevamientoSchema } from "@/lib/relevamiento/formato";
import { RelevamientoApp } from "./RelevamientoApp";

export default async function RelevamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  const [guardado, entrevista] = await Promise.all([
    prisma.relevamiento.findUnique({ where: { contactoId: id } }),
    prisma.entrevista.findFirst({ where: { contactoId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  // Los ambientes que ya se eligieron en la entrevista arrancan cargados.
  const ambientes = (entrevista?.data as unknown as EntrevistaState | undefined)?.ambientesSeleccion ?? [];

  // Solo lo que valida entra a la pantalla: un JSON roto no debe romper la visita.
  const valido = guardado ? relevamientoSchema.safeParse(guardado.data) : null;
  const remoto = guardado && valido?.success ? { data: valido.data, version: guardado.version } : null;

  return (
    <>
      <AppHeader />
      <RelevamientoApp
        contactoId={id}
        nombre={contacto.nombre}
        direccion={contacto.direccionProyecto ?? ""}
        ambientesEntrevista={ambientes}
        remoto={remoto}
      />
    </>
  );
}
```

- [ ] **Paso 4: el botón en la ficha del contacto**

En `src/app/contactos/[id]/page.tsx`, justo después del botón *Ficha de entrevista*, agregar:

```tsx
            <Button href={`/contactos/${contacto.id}/relevamiento`} variant="secondary" size="sm">
              Relevamiento
            </Button>
```

- [ ] **Paso 5: verificar tipos, pruebas y compilación**

`npx next build` compila sin correr la migración del script `build`.

```bash
npx tsc --noEmit
npm test
npx next build
```

Esperado: `tsc` sin salida; todas las pruebas en PASS; la compilación termina y lista la ruta `/contactos/[id]/relevamiento`.

- [ ] **Paso 6: commit**

```bash
git add "src/app/contactos/[id]/relevamiento/sincronizador.ts" "src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx" "src/app/contactos/[id]/relevamiento/page.tsx" "src/app/contactos/[id]/page.tsx"
git commit -m "El relevamiento tiene su pantalla: plano en vivo, carga, control y sincronización

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 12: Lo que sale — el archivo para Revit y el plano impreso

**Archivos:**
- Crear: `src/lib/relevamiento/descarga.ts`
- Prueba: `src/lib/relevamiento/descarga.test.ts`
- Crear: `src/app/contactos/[id]/relevamiento/VistaPlano.tsx`
- Modificar: `src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx` (Tarea 11)
- Modificar: `src/app/contactos/[id]/relevamiento/page.tsx` (Tarea 11)
- Modificar: `src/app/globals.css` (al final)

**Interfaces:**
- Consume: `Relevamiento` (Tarea 1); `superficieM2`, `perimetroCm` (Tarea 2); `PlanoSvg` con `impresion` (Tarea 8); `RelevamientoApp` (Tarea 11).
- Produce: `nombreDeArchivo(nombre: string, fecha: string): string`; `descargarJson(r: Relevamiento): void`; `VistaPlano({ relevamiento, onVolver }: { relevamiento: Relevamiento; onVolver: () => void })`.

**El PDF sale de la impresión del navegador**, sin librerías: en el iPhone, *Compartir → Imprimir* y pellizcar la vista previa lo guarda como PDF; en la computadora, *Imprimir → Guardar como PDF*. La vista usa el Claro `#F2F1EE` y la tinta grafito del manual de marca, y lleva la firma completa.

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/relevamiento/descarga.test.ts
import { describe, expect, it } from "vitest";
import { nombreDeArchivo } from "./descarga";

describe("nombreDeArchivo", () => {
  it("usa el nombre del contacto sin tildes ni espacios", () => {
    expect(nombreDeArchivo("Mara Castellón", "2026-09-10")).toBe("relevamiento-mara-castellon-2026-09-10.json");
  });

  it("sin un nombre usable, no deja un archivo que empiece con guion", () => {
    expect(nombreDeArchivo("  ¡!  ", "2026-09-10")).toBe("relevamiento-sin-nombre-2026-09-10.json");
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/relevamiento/descarga.test.ts`
Esperado: FALLA con `Failed to resolve import "./descarga"`.

- [ ] **Paso 3: la descarga**

```ts
// src/lib/relevamiento/descarga.ts
import type { Relevamiento } from "./formato";

export function nombreDeArchivo(nombre: string, fecha: string): string {
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `relevamiento-${slug || "sin-nombre"}-${fecha}.json`;
}

/** Descarga el relevamiento con el formato "ba-relevamiento": es el archivo que lee el botón de pyRevit. */
export function descargarJson(r: Relevamiento): void {
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreDeArchivo(r.proyecto.nombre, r.proyecto.fechaRelevamiento);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/relevamiento/descarga.test.ts`
Esperado: 2 pruebas en PASS.

- [ ] **Paso 5: la vista del plano para imprimir**

```tsx
// src/app/contactos/[id]/relevamiento/VistaPlano.tsx
"use client";

import type { Relevamiento } from "@/lib/relevamiento/formato";
import { perimetroCm, superficieM2 } from "@/lib/relevamiento/geometria";
import { PlanoSvg } from "./PlanoSvg";

const APERTURA = { corrediza: "Corrediza", batiente: "Batiente", pivotante: "Pivotante", fija: "Fija" } as const;
const COLUMNAS = ["Código", "Pared", "Empieza", "Termina", "Alto", "Antepecho", "Muro", "Apertura"];

export function VistaPlano({ relevamiento: r, onVolver }: { relevamiento: Relevamiento; onVolver: () => void }) {
  const ambientes = r.niveles.flatMap((n) => n.ambientes);
  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#0F1113] print:bg-white">
      <div className="flex gap-2 p-4 print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded-full bg-[#0F1113] px-5 py-2.5 text-sm text-[#F2F1EE]">
          Imprimir o guardar PDF
        </button>
        <button type="button" onClick={onVolver} className="rounded-full px-5 py-2.5 text-sm underline">
          Volver
        </button>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-8">
        <header className="mb-8 border-b border-[#0F1113]/20 pb-4">
          <p className="rotulo">Bruno Aldana · Arquitectura</p>
          <h1 className="font-display mt-2 text-3xl font-extralight">Relevamiento · {r.proyecto.nombre}</h1>
          <p className="dato mt-1 text-[#0F1113]/60">
            {[r.proyecto.direccion, r.proyecto.fechaRelevamiento].filter(Boolean).join(" · ")} · medidas en centímetros
          </p>
        </header>

        {ambientes.map((a) => {
          const superficie = superficieM2(a.paredes);
          const perimetro = perimetroCm(a.paredes);
          const alturas = a.alturas.filter((h) => h.medida !== null).map((h) => h.medida);
          const aberturas = a.elementos.filter((e) => e.tipo === "puerta" || e.tipo === "ventana");
          return (
            <section key={a.id} className="mb-12 break-inside-avoid">
              <h2 className="font-display text-2xl font-light">{a.nombre}</h2>
              <p className="dato mt-1 text-[#0F1113]/60">
                {superficie !== null ? `${superficie.toLocaleString("es-BO", { maximumFractionDigits: 2 })} m²` : "Sin cerrar"}
                {perimetro !== null ? ` · perímetro ${perimetro}` : ""}
                {alturas.length > 0 ? ` · altura ${alturas.join(" / ")}` : ""}
              </p>
              <div className="my-4">
                <PlanoSvg ambiente={a} impresion />
              </div>
              {aberturas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="dato w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#0F1113]/20">
                        {COLUMNAS.map((c) => <th key={c} className="py-1 pr-3 font-normal">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {aberturas.map((e) => (
                        <tr key={e.id} className="border-b border-[#0F1113]/10">
                          <td className="py-1 pr-3">{e.codigo}</td>
                          <td className="py-1 pr-3">{a.paredes.findIndex((p) => p.id === e.pared) + 1 || "—"}</td>
                          <td className="py-1 pr-3">{e.desde ?? "—"}</td>
                          <td className="py-1 pr-3">{e.hasta ?? "—"}</td>
                          <td className="py-1 pr-3">{e.alto ?? "—"}</td>
                          <td className="py-1 pr-3">{e.antepecho ?? "—"}</td>
                          <td className="py-1 pr-3">{e.espesorMuro ?? "—"}</td>
                          <td className="py-1 pr-3">{e.apertura ? APERTURA[e.apertura] : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
```

- [ ] **Paso 6: conectar la vista y la descarga en la pantalla**

En `RelevamientoApp.tsx`:

1. Agregar a los imports:

```tsx
import { descargarJson } from "@/lib/relevamiento/descarga";
import { VistaPlano } from "./VistaPlano";
```

2. Debajo de `const [nuevoAmbiente, setNuevoAmbiente] = useState("");`, agregar:

```tsx
  const [vista, setVista] = useState<"editar" | "plano">("editar");
```

3. Reemplazar la línea `  const actual = rel;` por:

```tsx
  const actual = rel;
  if (vista === "plano") return <VistaPlano relevamiento={actual} onVolver={() => setVista("editar")} />;
```

4. Justo después del párrafo que muestra la superficie (el `</p>` que cierra `{perimetro !== null ? ... : ""}`), agregar:

```tsx
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={opcion(false)} onClick={() => setVista("plano")}>Ver plano para imprimir</button>
        <button type="button" className={opcion(false)} onClick={() => descargarJson(actual)}>Descargar archivo para Revit</button>
      </div>
```

En `page.tsx` de la ruta de relevamiento, reemplazar `      <AppHeader />` por:

```tsx
      <div className="print:hidden">
        <AppHeader />
      </div>
```

- [ ] **Paso 7: los estilos de impresión**

Al final de `src/app/globals.css`:

```css
/*
 * Impresión del plano del relevamiento. En pantalla la app es grafito; en el
 * papel va el fondo claro y la tinta grafito del manual de marca.
 */
@media print {
  @page {
    size: A4;
    margin: 15mm;
  }
  html,
  body {
    background: #ffffff !important;
    color: #0f1113 !important;
  }
}
```

- [ ] **Paso 8: verificar tipos, pruebas y compilación**

```bash
npx tsc --noEmit
npm test
npx next build
```

Esperado: `tsc` sin salida; todas las pruebas en PASS; la compilación termina.

- [ ] **Paso 9: commit**

```bash
git add src/lib/relevamiento/descarga.ts src/lib/relevamiento/descarga.test.ts "src/app/contactos/[id]/relevamiento/VistaPlano.tsx" "src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx" "src/app/contactos/[id]/relevamiento/page.tsx" src/app/globals.css
git commit -m "Del relevamiento salen el plano para imprimir y el archivo para Revit

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YAnMbgq949TFGSwSaf88vB"
```

---

### Tarea 13: Verificación final y prueba de campo en el cuarto de Bruno

**Archivos:**
- Modificar: `E:\BRUNO_CLAUDE\BA_ARQUITECTURA\proyectos\2026-00-cuarto-bruno\PROYECTO.md` (resultados de la prueba; está fuera del repositorio de la app y no se commitea)

**Interfaces:**
- Consume: la app completa de las Tareas 1 a 12.
- Produce: la etapa 1 verificada, o la lista de lo que falló en el iPhone.

Esta tarea tiene tres partes. **La primera la hace quien ejecuta el plan. La segunda y la tercera necesitan a Bruno**, porque requieren su sesión en la app y su iPhone.

- [ ] **Paso 1: la verificación completa del código**

```bash
npx tsc --noEmit
npm test
npx next build
```

Esperado: `tsc` sin salida; **103 pruebas en PASS** (49 que ya existían + 4 de formato + 8 de geometría + 11 de controles + 22 de voz + 7 de sincronización + 2 de descarga); la compilación termina y lista `/contactos/[id]/relevamiento` y `/manifest.webmanifest`.

Si el número de pruebas no coincide, revisar cuál falta antes de seguir.

- [ ] **Paso 2: recorrido en la computadora, con Bruno**

Bruno inicia sesión en `http://localhost:3000` con `npm run dev` corriendo, y crea un contacto **"Prueba maestra · cuarto"**. Desde su ficha entra a *Relevamiento* y verifica cada punto:

| # | Qué hacer | Qué tiene que pasar |
|---|---|---|
| 1 | Forma rápida → Rectángulo → ancho 405, largo 456 | El plano dibuja el rectángulo con sus cotas y dice **18,47 m² · perímetro 1722 cm** |
| 2 | Cargar las tres alturas en 263 | Desaparece el aviso de altura |
| 3 | Pasar a Recorrido, confirmar, cargar 405 D, 456 D, 405 D, 445 D | El plano muestra la línea roja punteada y **"Faltan 11 cm para cerrar"** |
| 4 | Corregir la última pared a 456 | **"El recorrido cierra"** |
| 5 | Puertas y ventanas → Agregar puerta, cargar solo "Empieza a" | Aparece **P1** y la lista **"Falta: dónde termina, alto…"** |
| 6 | Completar P1: pared 4, 60 a 150, alto 210, muro 15, corrediza | Desaparece el error de P1 y se dibuja en el plano |
| 7 | En el campo de una medida, escribir **"cuatro con cinco"** | Ofrece **405 cm** y **450 cm** y no guarda hasta elegir |
| 8 | *Terminar visita* | La lista del ambiente queda en **Cierra** o muestra solo avisos |
| 9 | *Descargar archivo para Revit* | Baja `relevamiento-prueba-maestra-cuarto-<fecha>.json` y el archivo abre como texto con `"formato": "ba-relevamiento"` |
| 10 | *Ver plano para imprimir* → *Imprimir o guardar PDF* | El PDF sale en fondo claro, con la firma **Bruno Aldana · Arquitectura**, el plano y la tabla de P1 |
| 11 | Recargar la página | Todo lo cargado sigue ahí y el estado dice **Todo subido** |

- [ ] **Paso 3: prueba de campo en el iPhone, con Bruno**

El service worker solo funciona con `https`, así que esta prueba necesita la app en un link de internet.

**Antes, pedirle autorización a Bruno** para subir la rama `modulo-relevamiento` a GitHub con `git push -u origin modulo-relevamiento`. Vercel crea sola un **link de prueba** (*preview*) para esa rama, distinto del link publicado: la app que Bruno usa con clientes no cambia. Si el link de prueba pide iniciar sesión en Vercel, Bruno entra con su cuenta.

Bruno abre el link de prueba en Safari, inicia sesión, usa *Compartir → Agregar a pantalla de inicio*, y releva su cuarto con el Bosch GLM165-40:

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Dictar una medida con el botón **Dictar**, desde la app instalada | La toma. Si avisa que la voz no está disponible, probar el micrófono del teclado del iPhone en el mismo campo |
| 2 | Abrir el relevamiento con señal, cerrar la app, poner **modo avión**, volver a abrirla | La pantalla de relevamiento abre y muestra lo cargado |
| 3 | En modo avión, cargar medidas | El estado dice **Sin señal · guardado en el teléfono** |
| 4 | Cerrar la app del todo y volver a abrirla, todavía en modo avión | Lo cargado sin señal sigue ahí |
| 5 | Quitar el modo avión | En segundos el estado pasa a **Todo subido** |
| 6 | Relevar el cuarto completo | **4,05 × 4,56 m, altura 2,63 m, 18,47 m²**, igual que el modelo de Revit del 10/09/2026 |

- [ ] **Paso 4: anotar los resultados**

Agregar al final de `proyectos/2026-00-cuarto-bruno/PROYECTO.md` una sección `## Prueba de campo del módulo de relevamiento, etapa 1` con la fecha, y para cada una de las seis pruebas del iPhone: si funcionó, y si no, qué pasó exactamente. **Lo que falle en el iPhone no se da por cerrado**: se anota y se decide con Bruno si se arregla antes de pasar a la etapa 2.

- [ ] **Paso 5: publicar, solo si Bruno lo decide**

Unir la rama a `main` y publicar es una decisión de Bruno, que se toma después de ver la prueba de campo. Este plan termina acá.

---

## Fuera de este plan

- **Etapa 2** (casa completa con ambientes unidos, niveles, luminarias, tomas, muebles, fotos) y **etapa 3** (dibujo con el dedo, paredes en ángulo y curvas): planes propios, después de la prueba de campo.
- **El botón de pyRevit "Relevamiento a Revit"**: subproyecto aparte, fuera de esta app. Arranca con el archivo `.json` que sale de la Tarea 12.
- **Quitar un ambiente**: la etapa 1 solo permite agregar. Se suma cuando haga falta.
