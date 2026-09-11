# Modo visita, paso 1: la base sin señal — Plan de implementación

> **Para quien lo ejecute:** SUB-SKILL REQUERIDA: superpowers:executing-plans (Bruno eligió ejecutar sin agentes por tarea, para cuidar el gasto). Los pasos usan casillas (`- [ ]`).

**Objetivo:** que la app instalada en el iPhone abra en `/visita` sin señal desde el primer momento, muestre los contactos, permita crear y editar clientes, y suba todo solo cuando vuelve la conexión.

**Arquitectura:** `/visita` es una página cliente estática que lee y escribe en IndexedDB y navega por parámetros de la dirección. Un service worker servido por un Route Handler guarda la app entera al instalarse. La sincronización va por dos Route Handlers con direcciones fijas (`/api/visita/subir` y `/api/visita/cambios`) que verifican la sesión por su cuenta.

**Stack:** Next.js 16.3.3 (App Router, Turbopack) · React 19 · TypeScript · Prisma 7 + Neon · zod 4 · Tailwind 4 · vitest 4.

**Diseño:** `docs/plans/2026-09-10-relevamiento-bim-diseno.md`, secciones 2, 3, 9, 10 y 11. Leerlo antes de empezar.

## Restricciones globales

- **Idioma:** español de Bolivia, sin españolismos, sin capa de traducción. Textos de estado exactos del diseño: "Guardado en el teléfono", "Subiendo…", "Todo subido", "Sin señal · guardado en el teléfono", "Iniciá sesión para subir".
- **Marca:** grafito, Archivo y JetBrains Mono, sin acento. Reusar `inputClass`, `labelClass`, `errorClass` y `Button`. **No** reusar `EmptyState`: trae la animación `animate-rise-in`. Números y teléfonos en la clase `dato`, etiquetas en `rotulo`.
- **Movimiento:** nada animado en `/visita`, salvo la respuesta al toque de `Button`.
- **Next 16:** `AGENTS.md` exige leer la guía de `node_modules/next/dist/docs/` antes de tocar una convención. Ya leídas para este plan: `route.md`, `page.md` (searchParams en páginas cliente con `use`), `env.md`, `progressive-web-apps.md`, `offline-support.md`.
- **La base es la de producción.** Este plan **no cambia el esquema**. Ninguna tarea escribe en la base salvo la verificación de la Tarea 7, que crea un contacto de prueba y lo borra.
- **Pruebas:** `vitest` en entorno `node`, sin DOM. Solo lógica pura, archivos `src/**/*.test.ts`. Antes del plan hay **103 pruebas** en verde.
- **Commits** en la rama `modulo-relevamiento`, mensajes en español que describen el resultado, terminados con:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017Z39Na11ACrJdxTJDcCYRJ
  ```
- **No publicar ni subir** sin pedírselo a Bruno.

## Un cambio respecto del diseño

El diseño (3.2) decía que `/visita` con señal pide la red primero. **Este plan la sirve primero desde la copia guardada.** En una obra con señal débil, "red primero" deja la pantalla en blanco varios segundos esperando una respuesta que no llega. La copia guardada siempre es coherente con sus propios archivos, y la versión nueva llega igual: cada publicación trae un service worker nuevo que guarda la página nueva al instalarse.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/destino.ts` | Validar adónde volver después del login |
| `src/app/login/actions.ts`, `src/app/login/page.tsx` | Volver a `/visita` después de iniciar sesión |
| `src/lib/visita/contactos.ts` | Tipos y esquemas del contacto de visita, formulario, fusión de cambios, compactar la cola |
| `src/lib/visita/servidor.ts` | Fila de Prisma → contacto de visita |
| `src/lib/sesionApi.ts` | Sesión dentro de un Route Handler |
| `src/app/api/visita/cambios/route.ts` | Bajar contactos cambiados |
| `src/app/api/visita/subir/route.ts` | Subir la cola de operaciones |
| `src/proxy.ts` | Dejar pasar `/visita` y `/api/visita` sin redirigir |
| `src/lib/visita/almacen.ts` | IndexedDB `ba-visita` |
| `src/lib/visita/api.ts` | Llamadas a la API con errores tipados |
| `src/lib/visita/sincronizador.ts` | Subir la cola y bajar cambios, con estados |
| `src/lib/visita/navegacion.ts` | Dirección ↔ vista interna |
| `src/app/visita/page.tsx`, `src/app/visita/VisitaApp.tsx` | La página y su navegación |
| `src/app/visita/ListaContactos.tsx`, `FormularioContacto.tsx`, `FichaContacto.tsx`, `IndicadorSync.tsx` | Las pantallas |
| `src/lib/visita/recursos.ts` | Sacar del HTML y del CSS la lista de archivos a guardar |
| `src/app/sw.js/route.ts` | El service worker, con la versión escrita adentro |
| `public/sw.js` | **Se borra** |
| `next.config.ts`, `src/app/manifest.ts`, `src/components/AppHeader.tsx` | Versión de la publicación, `start_url`, enlace a Visita |

---

### Tarea 1: Volver a la visita después del login

**Archivos:**
- Crear: `src/lib/destino.ts`
- Prueba: `src/lib/destino.test.ts`
- Modificar: `src/app/login/actions.ts`, `src/app/login/page.tsx`

**Interfaces:**
- Consume: nada.
- Produce: `destinoSeguro(valor: unknown): string`; `/login?volver=/visita` vuelve a `/visita` al iniciar sesión.

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/destino.test.ts
import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino";

describe("destinoSeguro", () => {
  it("acepta rutas internas, con sus parámetros", () => {
    expect(destinoSeguro("/visita")).toBe("/visita");
    expect(destinoSeguro("/visita?contacto=abc")).toBe("/visita?contacto=abc");
  });

  it("nunca manda a otro sitio", () => {
    expect(destinoSeguro("https://otro.com")).toBe("/");
    expect(destinoSeguro("//otro.com")).toBe("/");
    expect(destinoSeguro("/\\otro.com")).toBe("/");
  });

  it("sin valor usable, vuelve al inicio", () => {
    expect(destinoSeguro(undefined)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
    expect(destinoSeguro(42)).toBe("/");
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/destino.test.ts`
Esperado: FALLA con `Failed to resolve import "./destino"`.

- [ ] **Paso 3: la implementación**

```ts
// src/lib/destino.ts

/** Adónde volver después del login. Solo rutas de esta app: un link armado no puede mandar a otro sitio. */
export function destinoSeguro(valor: unknown): string {
  if (typeof valor !== "string") return "/";
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return "/";
  return valor;
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/destino.test.ts`
Esperado: 3 pruebas en PASS.

- [ ] **Paso 5: el login usa el destino**

En `src/app/login/actions.ts`, agregar el import:

```ts
import { destinoSeguro } from "@/lib/destino";
```

y reemplazar la línea `  redirect("/");` de la función `login` (la de `logout` no se toca) por:

```ts
  redirect(destinoSeguro(formData.get("volver")));
```

En `src/app/login/page.tsx`:
1. Reemplazar `import { useActionState } from "react";` por `import { use, useActionState } from "react";`.
2. Reemplazar `export default function LoginPage() {` y la línea siguiente por:

```tsx
export default function LoginPage({ searchParams }: { searchParams: Promise<{ volver?: string | string[] }> }) {
  const { volver } = use(searchParams);
  const [state, formAction, pending] = useActionState(login, undefined);
```

3. Justo después de la línea `<form action={formAction} className="w-full max-w-sm">`, agregar:

```tsx
          <input type="hidden" name="volver" value={typeof volver === "string" ? volver : "/"} />
```

- [ ] **Paso 6: verificar tipos y pruebas**

Correr: `npx tsc --noEmit && npm test`
Esperado: `tsc` sin salida; 106 pruebas en PASS.

- [ ] **Paso 7: commit**

```bash
git add src/lib/destino.ts src/lib/destino.test.ts src/app/login/actions.ts src/app/login/page.tsx
git commit -m "Después de iniciar sesión se vuelve a la pantalla desde donde se pidió"
```
(con las dos líneas de firma de las Restricciones globales)

---

### Tarea 2: El contacto de visita y cómo se fusionan los cambios

**Archivos:**
- Crear: `src/lib/visita/contactos.ts`, `src/lib/visita/servidor.ts`
- Prueba: `src/lib/visita/contactos.test.ts`

**Interfaces:**
- Consume: nada.
- Produce:
  - `contactoVisitaSchema` (zod) y `type ContactoVisita = { id; nombre; telefono: string | null; email: string | null; direccionProyecto: string | null; notas: string | null; origen: string | null; createdAt: string; updatedAt: string }` (fechas ISO).
  - `interface ContactoLocal extends ContactoVisita { pendiente: boolean }`
  - `operacionSchema` y `type Operacion = { tipo: "contacto"; contacto: ContactoVisita }`
  - `type CamposContacto = { nombre: string; telefono: string; email: string; direccionProyecto: string; notas: string; origen: string }`
  - `leerFormularioContacto(campos: CamposContacto, base: { id: string; createdAt: string }, ahora: string): { ok: true; contacto: ContactoVisita } | { ok: false; error: string }`
  - `fusionarContactos(locales: ContactoLocal[], remotos: ContactoVisita[]): ContactoLocal[]` — ordenados por `createdAt`, el más nuevo primero.
  - `compactarCola(ops: Operacion[]): Operacion[]`
  - En `servidor.ts`: `aContactoVisita(fila: FilaContacto): ContactoVisita`, con `type FilaContacto = { id: string; nombre: string; telefono: string | null; email: string | null; direccionProyecto: string | null; notas: string | null; origen: string | null; createdAt: Date; updatedAt: Date }`.

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/visita/contactos.test.ts
import { describe, expect, it } from "vitest";
import { compactarCola, fusionarContactos, leerFormularioContacto, type ContactoLocal, type ContactoVisita } from "./contactos";
import { aContactoVisita } from "./servidor";

const contacto = (id: string, extra: Partial<ContactoVisita> = {}): ContactoVisita => ({
  id, nombre: `Cliente ${id}`, telefono: null, email: null, direccionProyecto: null, notas: null, origen: null,
  createdAt: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-01T10:00:00.000Z", ...extra,
});
const local = (id: string, pendiente: boolean, extra: Partial<ContactoVisita> = {}): ContactoLocal => ({ ...contacto(id, extra), pendiente });
const campos = { nombre: "Mara Castellón", telefono: " 77658864 ", email: "", direccionProyecto: "", notas: "", origen: "Instagram" };

describe("leerFormularioContacto", () => {
  it("recorta espacios y deja en null lo vacío", () => {
    const r = leerFormularioContacto(campos, { id: "c1", createdAt: "2026-09-10T12:00:00.000Z" }, "2026-09-10T12:00:00.000Z");
    expect(r).toEqual({ ok: true, contacto: { ...contacto("c1"), nombre: "Mara Castellón", telefono: "77658864", origen: "Instagram", createdAt: "2026-09-10T12:00:00.000Z", updatedAt: "2026-09-10T12:00:00.000Z" } });
  });

  it("sin nombre no se guarda", () => {
    expect(leerFormularioContacto({ ...campos, nombre: "  " }, { id: "c1", createdAt: "x" }, "x")).toEqual({ ok: false, error: "El nombre es obligatorio." });
  });

  it("un email mal escrito no se guarda", () => {
    expect(leerFormularioContacto({ ...campos, email: "mara@" }, { id: "c1", createdAt: "x" }, "x")).toEqual({ ok: false, error: "Email inválido." });
  });
});

describe("fusionarContactos", () => {
  it("lo que baja del servidor reemplaza a lo local sin cambios", () => {
    const r = fusionarContactos([local("a", false)], [contacto("a", { nombre: "Nuevo nombre" })]);
    expect(r).toEqual([{ ...contacto("a", { nombre: "Nuevo nombre" }), pendiente: false }]);
  });

  it("un contacto con cambios sin subir no se pisa", () => {
    const r = fusionarContactos([local("a", true, { nombre: "Cambiado en obra" })], [contacto("a", { nombre: "Del servidor" })]);
    expect(r[0].nombre).toBe("Cambiado en obra");
    expect(r[0].pendiente).toBe(true);
  });

  it("suma los nuevos y ordena del más nuevo al más viejo", () => {
    const r = fusionarContactos(
      [local("viejo", false, { createdAt: "2026-08-01T00:00:00.000Z" })],
      [contacto("nuevo", { createdAt: "2026-09-05T00:00:00.000Z" })],
    );
    expect(r.map((c) => c.id)).toEqual(["nuevo", "viejo"]);
  });
});

describe("compactarCola", () => {
  it("de cada contacto sube solo la última versión, en el orden de su último cambio", () => {
    const a1 = { tipo: "contacto" as const, contacto: contacto("a", { nombre: "A1" }) };
    const b1 = { tipo: "contacto" as const, contacto: contacto("b") };
    const a2 = { tipo: "contacto" as const, contacto: contacto("a", { nombre: "A2" }) };
    expect(compactarCola([a1, b1, a2])).toEqual([b1, a2]);
  });
});

describe("aContactoVisita", () => {
  it("pasa las fechas de la base a texto ISO", () => {
    const fila = { ...contacto("a"), createdAt: new Date("2026-09-01T10:00:00.000Z"), updatedAt: new Date("2026-09-02T10:00:00.000Z") };
    expect(aContactoVisita(fila)).toEqual(contacto("a", { updatedAt: "2026-09-02T10:00:00.000Z" }));
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/visita/contactos.test.ts`
Esperado: FALLA con `Failed to resolve import "./contactos"`.

- [ ] **Paso 3: la implementación**

```ts
// src/lib/visita/contactos.ts
import { z } from "zod";

/**
 * El contacto tal como viaja entre el teléfono y el servidor en el modo visita.
 * Las fechas van como texto ISO para que se guarden igual en IndexedDB y en JSON.
 */
const texto = z.string().max(5000).nullable();

export const contactoVisitaSchema = z.object({
  id: z.string().min(1).max(64),
  nombre: z.string().min(1).max(200),
  telefono: texto,
  email: z.string().email().nullable(),
  direccionProyecto: texto,
  notas: texto,
  origen: texto,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContactoVisita = z.infer<typeof contactoVisitaSchema>;

/** El contacto guardado en el teléfono. `pendiente` = tiene cambios que todavía no se subieron. */
export interface ContactoLocal extends ContactoVisita {
  pendiente: boolean;
}

export const operacionSchema = z.object({ tipo: z.literal("contacto"), contacto: contactoVisitaSchema });
export type Operacion = z.infer<typeof operacionSchema>;

export type CamposContacto = {
  nombre: string;
  telefono: string;
  email: string;
  direccionProyecto: string;
  notas: string;
  origen: string;
};

const vacioANull = (v: string) => (v.trim() === "" ? null : v.trim());

export function leerFormularioContacto(
  campos: CamposContacto,
  base: { id: string; createdAt: string },
  ahora: string,
): { ok: true; contacto: ContactoVisita } | { ok: false; error: string } {
  const nombre = campos.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  const email = vacioANull(campos.email);
  if (email !== null && !z.string().email().safeParse(email).success) return { ok: false, error: "Email inválido." };
  return {
    ok: true,
    contacto: {
      id: base.id,
      nombre,
      telefono: vacioANull(campos.telefono),
      email,
      direccionProyecto: vacioANull(campos.direccionProyecto),
      notas: vacioANull(campos.notas),
      origen: vacioANull(campos.origen),
      createdAt: base.createdAt,
      updatedAt: ahora,
    },
  };
}

/** Junta lo del teléfono con lo que bajó del servidor. Lo que se cambió en obra y no se subió nunca se pisa. */
export function fusionarContactos(locales: ContactoLocal[], remotos: ContactoVisita[]): ContactoLocal[] {
  const porId = new Map(locales.map((c) => [c.id, c]));
  for (const r of remotos) {
    const actual = porId.get(r.id);
    if (actual?.pendiente) continue;
    porId.set(r.id, { ...r, pendiente: false });
  }
  return [...porId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Si un contacto se editó varias veces sin señal, alcanza con subir su última versión. */
export function compactarCola(ops: Operacion[]): Operacion[] {
  const ultima = new Map<string, number>();
  ops.forEach((op, i) => ultima.set(op.contacto.id, i));
  return ops.filter((op, i) => ultima.get(op.contacto.id) === i);
}
```

```ts
// src/lib/visita/servidor.ts
import type { ContactoVisita } from "./contactos";

export type FilaContacto = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccionProyecto: string | null;
  notas: string | null;
  origen: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function aContactoVisita(fila: FilaContacto): ContactoVisita {
  return {
    id: fila.id,
    nombre: fila.nombre,
    telefono: fila.telefono,
    email: fila.email,
    direccionProyecto: fila.direccionProyecto,
    notas: fila.notas,
    origen: fila.origen,
    createdAt: fila.createdAt.toISOString(),
    updatedAt: fila.updatedAt.toISOString(),
  };
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/visita/contactos.test.ts`
Esperado: 8 pruebas en PASS.

- [ ] **Paso 5: commit**

```bash
git add src/lib/visita/contactos.ts src/lib/visita/servidor.ts src/lib/visita/contactos.test.ts
git commit -m "El contacto de visita se valida, y lo cambiado en obra nunca se pisa al sincronizar"
```

---

### Tarea 3: La API de la visita, con sesión propia

**Archivos:**
- Crear: `src/lib/sesionApi.ts`, `src/app/api/visita/cambios/route.ts`, `src/app/api/visita/subir/route.ts`
- Modificar: `src/proxy.ts` (el `matcher`)

**Interfaces:**
- Consume: `contactoVisitaSchema`, `operacionSchema`, `ContactoVisita` (Tarea 2); `aContactoVisita` (Tarea 2); `COOKIE_NAME`, `verifySessionToken` de `@/lib/session`.
- Produce:
  - `GET /api/visita/cambios?desde=<ISO>` → `200 { contactos: ContactoVisita[]; ahora: string }` · `401 { error: "sin-sesion" }`
  - `POST /api/visita/subir` con `{ operaciones: Operacion[] }` → `200 { contactos: ContactoVisita[] }` (lo guardado, en el mismo orden) · `400 { error: "formato-invalido" }` · `401 { error: "sin-sesion" }`

Sin prueba unitaria: estas rutas son Prisma y HTTP. La lógica que deciden ya está probada en la Tarea 2. Se verifican con `curl` en el paso 5 y con el flujo completo en la Tarea 7.

- [ ] **Paso 1: la sesión dentro de un Route Handler**

```ts
// src/lib/sesionApi.ts
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Las rutas de /api/visita quedan fuera del proxy: si el proxy las redirigiera al
 * login, el teléfono recibiría una página HTML en lugar de una respuesta que
 * entienda. Por eso cada ruta verifica la sesión por su cuenta.
 */
export async function sesionDePedido(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export const respuestaSinSesion = () => Response.json({ error: "sin-sesion" }, { status: 401 });
```

- [ ] **Paso 2: bajar cambios**

```ts
// src/app/api/visita/cambios/route.ts
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { respuestaSinSesion, sesionDePedido } from "@/lib/sesionApi";
import { aContactoVisita } from "@/lib/visita/servidor";

export async function GET(request: NextRequest) {
  if (!(await sesionDePedido(request))) return respuestaSinSesion();

  // La hora se toma antes de consultar: lo que cambie mientras tanto vuelve a bajar la próxima vez.
  const ahora = new Date();
  const desdeTexto = request.nextUrl.searchParams.get("desde");
  const desde = desdeTexto ? new Date(desdeTexto) : null;
  const filtro = desde && !Number.isNaN(desde.getTime()) ? { updatedAt: { gt: desde } } : {};

  const filas = await prisma.contacto.findMany({ where: filtro, orderBy: { createdAt: "desc" } });
  return Response.json(
    { contactos: filas.map(aContactoVisita), ahora: ahora.toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
```

- [ ] **Paso 3: subir la cola**

```ts
// src/app/api/visita/subir/route.ts
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { respuestaSinSesion, sesionDePedido } from "@/lib/sesionApi";
import { operacionSchema, type ContactoVisita } from "@/lib/visita/contactos";
import { aContactoVisita } from "@/lib/visita/servidor";

const cuerpoSchema = z.object({ operaciones: z.array(operacionSchema).max(500) });

/**
 * Cada operación es idempotente por id: si el teléfono reintenta porque se cortó la
 * señal a mitad de camino, el contacto se actualiza en lugar de duplicarse.
 */
export async function POST(request: NextRequest) {
  if (!(await sesionDePedido(request))) return respuestaSinSesion();

  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: "formato-invalido" }, { status: 400 });

  const contactos: ContactoVisita[] = [];
  for (const { contacto } of cuerpo.data.operaciones) {
    const { id, createdAt, updatedAt: _descartada, ...campos } = contacto;
    const fila = await prisma.contacto.upsert({
      where: { id },
      create: { id, ...campos, createdAt: new Date(createdAt) },
      update: campos,
    });
    contactos.push(aContactoVisita(fila));
  }
  return Response.json({ contactos }, { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Paso 4: el proxy deja pasar la visita**

En `src/proxy.ts`, reemplazar el bloque `export const config = { ... };` completo por:

```ts
export const config = {
  // Quedan fuera del login: la página de visita y el service worker, que no tienen
  // datos y tienen que abrir sin señal; el manifiesto, para instalar la app; y la
  // API de visita, que verifica la sesión por su cuenta (src/lib/sesionApi.ts).
  matcher: ["/((?!login|visita|api/visita|sw\\.js|manifest\\.webmanifest|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"],
};
```

- [ ] **Paso 5: verificar**

```bash
npx tsc --noEmit
npm test
```

Esperado: `tsc` sin salida; 114 pruebas en PASS.

Con `npm run dev` corriendo en segundo plano:

```bash
curl -s -w " %{http_code}\n" http://localhost:3000/api/visita/cambios
curl -s -w " %{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"operaciones":[]}' http://localhost:3000/api/visita/subir
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/contactos
```

Esperado: `{"error":"sin-sesion"} 401` dos veces, y `/contactos` sigue dando `307 http://localhost:3000/login`.

Con sesión, sin escribir en la base: generar un token local y pedir los cambios.

```bash
cat > src/token.tmp.mts <<'EOF'
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
const { createSessionToken } = await import("./lib/session.ts");
console.log(await createSessionToken("prueba-local"));
EOF
TOKEN=$(npx tsx --tsconfig tsconfig.json src/token.tmp.mts); rm -f src/token.tmp.mts
curl -s -H "Cookie: session=$TOKEN" http://localhost:3000/api/visita/cambios | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log("contactos:",r.contactos.length,"ahora:",r.ahora)})'
```

Esperado: `contactos: <cantidad actual, 4 o más> ahora: <fecha ISO>`. Detener el servidor de desarrollo.

- [ ] **Paso 6: commit**

```bash
git add src/lib/sesionApi.ts src/app/api/visita/cambios/route.ts src/app/api/visita/subir/route.ts src/proxy.ts
git commit -m "La visita sube y baja contactos por una API que verifica la sesión por su cuenta"
```

---

### Tarea 4: El teléfono guarda, encola y sincroniza

**Archivos:**
- Crear: `src/lib/visita/almacen.ts`, `src/lib/visita/api.ts`, `src/lib/visita/sincronizador.ts`
- Prueba: `src/lib/visita/sincronizador.test.ts`

**Interfaces:**
- Consume: `ContactoLocal`, `ContactoVisita`, `Operacion`, `contactoVisitaSchema`, `fusionarContactos`, `compactarCola` (Tarea 2); las rutas de la Tarea 3.
- Produce:
  - `interface AlmacenVisita { listarContactos(): Promise<ContactoLocal[]>; guardarContactos(c: ContactoLocal[]): Promise<void>; encolar(op: Operacion): Promise<void>; leerCola(): Promise<{ claves: number[]; operaciones: Operacion[] }>; quitarDeCola(claves: number[]): Promise<void>; leerMeta(clave: "ultimaSync"): Promise<string | null>; guardarMeta(clave: "ultimaSync", valor: string): Promise<void> }`
  - `crearAlmacenIndexedDB(): AlmacenVisita`; `pedirPersistencia(): Promise<boolean>`
  - `class ErrorSinSesion`, `class ErrorSinRed`; `interface ApiVisita { subir(ops: Operacion[]): Promise<ContactoVisita[]>; cambios(desde: string | null): Promise<{ contactos: ContactoVisita[]; ahora: string }> }`; `crearApiFetch(): ApiVisita`
  - `type EstadoSync = "local" | "subiendo" | "subido" | "sin-senal" | "sin-sesion" | "error"`; `TEXTO_ESTADO: Record<EstadoSync, string>`
  - `crearSincronizadorVisita(deps: { almacen: AlmacenVisita; api: ApiVisita; alCambiarEstado: (e: EstadoSync) => void; alCambiarContactos: (c: ContactoLocal[]) => void; demoraMs?: number }): { iniciar(): Promise<void>; sincronizar(): Promise<void>; guardarContacto(c: ContactoVisita): Promise<void> }`

**El flujo:** cada contacto guardado va al teléfono con `pendiente: true` y a la cola; 1,5 s después del último cambio se sincroniza. Sincronizar es: subir la cola compactada → quitar de la cola **solo lo que se subió** → marcar como subidos los contactos que no volvieron a cambiar mientras tanto → bajar los cambios desde `ultimaSync` → fusionar → guardar `ahora` del servidor como nueva `ultimaSync`. Si se pide sincronizar mientras ya corre, se vuelve a correr al terminar.

- [ ] **Paso 1: escribir la prueba que falla**

La prueba usa un almacén y una API falsos en memoria: el sincronizador no sabe que existen IndexedDB ni `fetch`.

```ts
// src/lib/visita/sincronizador.test.ts
import { describe, expect, it, vi } from "vitest";
import type { ContactoLocal, ContactoVisita, Operacion } from "./contactos";
import type { AlmacenVisita } from "./almacen";
import { ErrorSinRed, ErrorSinSesion, type ApiVisita } from "./api";
import { crearSincronizadorVisita, type EstadoSync } from "./sincronizador";

const contacto = (id: string, extra: Partial<ContactoVisita> = {}): ContactoVisita => ({
  id, nombre: `Cliente ${id}`, telefono: null, email: null, direccionProyecto: null, notas: null, origen: null,
  createdAt: "2026-09-10T10:00:00.000Z", updatedAt: "2026-09-10T10:00:00.000Z", ...extra,
});

function almacenEnMemoria() {
  const contactos = new Map<string, ContactoLocal>();
  const cola = new Map<number, Operacion>();
  const meta = new Map<string, string>();
  let siguiente = 1;
  const almacen: AlmacenVisita = {
    listarContactos: async () => [...contactos.values()],
    guardarContactos: async (cs) => { cs.forEach((c) => contactos.set(c.id, c)); },
    encolar: async (op) => { cola.set(siguiente++, op); },
    leerCola: async () => ({ claves: [...cola.keys()], operaciones: [...cola.values()] }),
    quitarDeCola: async (claves) => { claves.forEach((k) => cola.delete(k)); },
    leerMeta: async (k) => meta.get(k) ?? null,
    guardarMeta: async (k, v) => { meta.set(k, v); },
  };
  return { almacen, contactos, cola, meta };
}

function preparar(api: Partial<ApiVisita> = {}) {
  const mem = almacenEnMemoria();
  const estados: EstadoSync[] = [];
  const apiCompleta: ApiVisita = {
    subir: vi.fn(async (ops: Operacion[]) => ops.map((o) => o.contacto)),
    cambios: vi.fn(async () => ({ contactos: [], ahora: "2026-09-10T12:00:00.000Z" })),
    ...api,
  };
  const sinc = crearSincronizadorVisita({
    almacen: mem.almacen, api: apiCompleta, alCambiarEstado: (e) => estados.push(e), alCambiarContactos: () => {}, demoraMs: 60_000,
  });
  return { ...mem, estados, api: apiCompleta, sinc };
}

describe("sincronizador de visita", () => {
  it("un cliente nuevo queda guardado en el teléfono y en la cola", async () => {
    const t = preparar();
    await t.sinc.guardarContacto(contacto("a"));
    expect(t.contactos.get("a")?.pendiente).toBe(true);
    expect(t.cola.size).toBe(1);
    expect(t.estados.at(-1)).toBe("local");
  });

  it("con señal sube la cola, baja los cambios y queda todo subido", async () => {
    const t = preparar({ cambios: vi.fn(async () => ({ contactos: [contacto("b")], ahora: "2026-09-10T12:00:00.000Z" })) });
    await t.sinc.guardarContacto(contacto("a"));
    await t.sinc.sincronizar();
    expect(t.cola.size).toBe(0);
    expect(t.contactos.get("a")?.pendiente).toBe(false);
    expect(t.contactos.has("b")).toBe(true);
    expect(t.meta.get("ultimaSync")).toBe("2026-09-10T12:00:00.000Z");
    expect(t.estados).toContain("subiendo");
    expect(t.estados.at(-1)).toBe("subido");
  });

  it("sin señal no se pierde nada", async () => {
    const t = preparar({ subir: vi.fn(async () => { throw new ErrorSinRed(); }) });
    await t.sinc.guardarContacto(contacto("a"));
    await t.sinc.sincronizar();
    expect(t.cola.size).toBe(1);
    expect(t.contactos.get("a")?.pendiente).toBe(true);
    expect(t.estados.at(-1)).toBe("sin-senal");
  });

  it("con la sesión vencida pide iniciar sesión y conserva todo", async () => {
    const t = preparar({ subir: vi.fn(async () => { throw new ErrorSinSesion(); }) });
    await t.sinc.guardarContacto(contacto("a"));
    await t.sinc.sincronizar();
    expect(t.cola.size).toBe(1);
    expect(t.estados.at(-1)).toBe("sin-sesion");
  });

  it("la segunda vez pide solo lo cambiado desde la última sincronización", async () => {
    const t = preparar();
    await t.sinc.sincronizar();
    await t.sinc.sincronizar();
    expect(t.api.cambios).toHaveBeenNthCalledWith(1, null);
    expect(t.api.cambios).toHaveBeenNthCalledWith(2, "2026-09-10T12:00:00.000Z");
  });

  it("un cambio hecho mientras se subía sigue pendiente", async () => {
    const t = preparar();
    t.api.subir = vi.fn(async (ops: Operacion[]) => {
      await t.almacen.guardarContactos([{ ...contacto("a", { nombre: "Cambiado durante la subida" }), pendiente: true }]);
      await t.almacen.encolar({ tipo: "contacto", contacto: contacto("a", { nombre: "Cambiado durante la subida" }) });
      return ops.map((o) => o.contacto);
    });
    await t.sinc.guardarContacto(contacto("a"));
    await t.sinc.sincronizar();
    expect(t.cola.size).toBe(1);
    expect(t.contactos.get("a")?.nombre).toBe("Cambiado durante la subida");
    expect(t.contactos.get("a")?.pendiente).toBe(true);
    expect(t.estados.at(-1)).toBe("local");
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/visita/sincronizador.test.ts`
Esperado: FALLA con `Failed to resolve import "./almacen"` o `"./api"`.

- [ ] **Paso 3: el almacén del teléfono**

Sin prueba propia: IndexedDB no existe en el entorno `node`. La prueba del paso 1 cubre su contrato con el almacén en memoria, y la Tarea 7 lo prueba en un navegador real.

```ts
// src/lib/visita/almacen.ts
import type { ContactoLocal, Operacion } from "./contactos";

export interface AlmacenVisita {
  listarContactos(): Promise<ContactoLocal[]>;
  guardarContactos(contactos: ContactoLocal[]): Promise<void>;
  encolar(op: Operacion): Promise<void>;
  leerCola(): Promise<{ claves: number[]; operaciones: Operacion[] }>;
  quitarDeCola(claves: number[]): Promise<void>;
  leerMeta(clave: "ultimaSync"): Promise<string | null>;
  guardarMeta(clave: "ultimaSync", valor: string): Promise<void>;
}

const BASE = "ba-visita";
const VERSION = 1;

/**
 * IndexedDB `ba-visita`: los contactos, la cola de lo que falta subir y la fecha de
 * la última sincronización. La versión 2 sumará la tabla de relevamientos (paso 3).
 */
function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, VERSION);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains("contactos")) db.createObjectStore("contactos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("cola")) db.createObjectStore("cola", { autoIncrement: true });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

function esperar<T>(pedido: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function transaccion<T>(tablas: string[], modo: IDBTransactionMode, hacer: (tx: IDBTransaction) => Promise<T>): Promise<T> {
  const db = await abrir();
  try {
    const tx = db.transaction(tablas, modo);
    const terminada = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    const resultado = await hacer(tx);
    await terminada;
    return resultado;
  } finally {
    db.close();
  }
}

export function crearAlmacenIndexedDB(): AlmacenVisita {
  return {
    listarContactos: () =>
      transaccion(["contactos"], "readonly", (tx) => esperar(tx.objectStore("contactos").getAll() as IDBRequest<ContactoLocal[]>)),
    guardarContactos: (contactos) =>
      transaccion(["contactos"], "readwrite", async (tx) => {
        const tabla = tx.objectStore("contactos");
        contactos.forEach((c) => tabla.put(c));
      }),
    encolar: (op) =>
      transaccion(["cola"], "readwrite", async (tx) => {
        tx.objectStore("cola").add(op);
      }),
    leerCola: () =>
      transaccion(["cola"], "readonly", async (tx) => {
        const tabla = tx.objectStore("cola");
        const [claves, operaciones] = await Promise.all([
          esperar(tabla.getAllKeys() as IDBRequest<number[]>),
          esperar(tabla.getAll() as IDBRequest<Operacion[]>),
        ]);
        return { claves, operaciones };
      }),
    quitarDeCola: (claves) =>
      transaccion(["cola"], "readwrite", async (tx) => {
        const tabla = tx.objectStore("cola");
        claves.forEach((k) => tabla.delete(k));
      }),
    leerMeta: (clave) =>
      transaccion(["meta"], "readonly", async (tx) => (await esperar(tx.objectStore("meta").get(clave) as IDBRequest<string | undefined>)) ?? null),
    guardarMeta: (clave, valor) =>
      transaccion(["meta"], "readwrite", async (tx) => {
        tx.objectStore("meta").put(valor, clave);
      }),
  };
}

/** Le pide al navegador que no borre estos datos. Safari decide solo. */
export async function pedirPersistencia(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  return navigator.storage.persist().catch(() => false);
}
```

- [ ] **Paso 4: las llamadas a la API**

```ts
// src/lib/visita/api.ts
import { z } from "zod";
import { contactoVisitaSchema, type ContactoVisita, type Operacion } from "./contactos";

export class ErrorSinSesion extends Error {
  constructor() { super("La sesión venció"); }
}
export class ErrorSinRed extends Error {
  constructor() { super("Sin conexión"); }
}

export interface ApiVisita {
  subir(ops: Operacion[]): Promise<ContactoVisita[]>;
  cambios(desde: string | null): Promise<{ contactos: ContactoVisita[]; ahora: string }>;
}

const respuestaSubir = z.object({ contactos: z.array(contactoVisitaSchema) });
const respuestaCambios = z.object({ contactos: z.array(contactoVisitaSchema), ahora: z.string() });

async function pedir(url: string, init?: RequestInit): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { cache: "no-store", credentials: "same-origin", ...init });
  } catch {
    throw new ErrorSinRed();
  }
  if (respuesta.status === 401) throw new ErrorSinSesion();
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
  return respuesta.json();
}

export function crearApiFetch(): ApiVisita {
  return {
    async subir(ops) {
      const json = await pedir("/api/visita/subir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operaciones: ops }),
      });
      return respuestaSubir.parse(json).contactos;
    },
    async cambios(desde) {
      const url = desde ? `/api/visita/cambios?desde=${encodeURIComponent(desde)}` : "/api/visita/cambios";
      return respuestaCambios.parse(await pedir(url));
    },
  };
}
```

- [ ] **Paso 5: el sincronizador**

```ts
// src/lib/visita/sincronizador.ts
import type { AlmacenVisita } from "./almacen";
import { ErrorSinRed, ErrorSinSesion, type ApiVisita } from "./api";
import { compactarCola, fusionarContactos, type ContactoLocal, type ContactoVisita } from "./contactos";

export type EstadoSync = "local" | "subiendo" | "subido" | "sin-senal" | "sin-sesion" | "error";

export const TEXTO_ESTADO: Record<EstadoSync, string> = {
  local: "Guardado en el teléfono",
  subiendo: "Subiendo…",
  subido: "Todo subido",
  "sin-senal": "Sin señal · guardado en el teléfono",
  "sin-sesion": "Iniciá sesión para subir",
  error: "No se pudo subir · se reintenta",
};

/**
 * Un objeto creado una sola vez que guarda en el teléfono y sube cuando puede.
 * No lee el estado de React: la subida es asíncrona y trabajaría con copias viejas.
 */
export function crearSincronizadorVisita(deps: {
  almacen: AlmacenVisita;
  api: ApiVisita;
  alCambiarEstado: (e: EstadoSync) => void;
  alCambiarContactos: (c: ContactoLocal[]) => void;
  demoraMs?: number;
}) {
  const { almacen, api, alCambiarEstado, alCambiarContactos } = deps;
  const demoraMs = deps.demoraMs ?? 1500;
  let enCurso: Promise<void> | null = null;
  let repetir = false;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  const ordenados = async () => fusionarContactos(await almacen.listarContactos(), []);

  async function correr() {
    try {
      const { claves, operaciones } = await almacen.leerCola();
      if (operaciones.length > 0) {
        alCambiarEstado("subiendo");
        const guardados = await api.subir(compactarCola(operaciones));
        await almacen.quitarDeCola(claves);
        const siguenEnCola = new Set((await almacen.leerCola()).operaciones.map((o) => o.contacto.id));
        await almacen.guardarContactos(guardados.filter((c) => !siguenEnCola.has(c.id)).map((c) => ({ ...c, pendiente: false })));
      }
      const { contactos, ahora } = await api.cambios(await almacen.leerMeta("ultimaSync"));
      const fusion = fusionarContactos(await almacen.listarContactos(), contactos);
      await almacen.guardarContactos(fusion);
      await almacen.guardarMeta("ultimaSync", ahora);
      alCambiarContactos(fusion);
      alCambiarEstado((await almacen.leerCola()).operaciones.length > 0 ? "local" : "subido");
    } catch (e) {
      alCambiarEstado(e instanceof ErrorSinSesion ? "sin-sesion" : e instanceof ErrorSinRed ? "sin-senal" : "error");
    }
  }

  function sincronizar(): Promise<void> {
    if (enCurso) {
      repetir = true;
      return enCurso;
    }
    enCurso = correr().finally(() => {
      enCurso = null;
      if (repetir) {
        repetir = false;
        void sincronizar();
      }
    });
    return enCurso;
  }

  return {
    async iniciar() {
      alCambiarContactos(await ordenados());
      await sincronizar();
    },
    sincronizar,
    async guardarContacto(c: ContactoVisita) {
      await almacen.guardarContactos([{ ...c, pendiente: true }]);
      await almacen.encolar({ tipo: "contacto", contacto: c });
      alCambiarContactos(await ordenados());
      alCambiarEstado("local");
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(() => void sincronizar(), demoraMs);
    },
  };
}
```

- [ ] **Paso 6: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/visita/sincronizador.test.ts`
Esperado: 6 pruebas en PASS.

- [ ] **Paso 7: verificar tipos y todas las pruebas**

Correr: `npx tsc --noEmit && npm test`
Esperado: `tsc` sin salida; 120 pruebas en PASS.

- [ ] **Paso 8: commit**

```bash
git add src/lib/visita/almacen.ts src/lib/visita/api.ts src/lib/visita/sincronizador.ts src/lib/visita/sincronizador.test.ts
git commit -m "Lo cargado en la visita se guarda en el teléfono y sube solo cuando hay señal"
```

---

### Tarea 5: La pantalla de visita

**Archivos:**
- Crear: `src/lib/visita/navegacion.ts`
- Prueba: `src/lib/visita/navegacion.test.ts`
- Crear: `src/app/visita/page.tsx`, `src/app/visita/VisitaApp.tsx`, `src/app/visita/ListaContactos.tsx`, `src/app/visita/FormularioContacto.tsx`, `src/app/visita/FichaContacto.tsx`, `src/app/visita/IndicadorSync.tsx`
- Modificar: `src/components/AppHeader.tsx` (enlace a Visita)

**Interfaces:**
- Consume: `crearAlmacenIndexedDB`, `pedirPersistencia` (Tarea 4); `crearApiFetch` (Tarea 4); `crearSincronizadorVisita`, `EstadoSync`, `TEXTO_ESTADO` (Tarea 4); `ContactoLocal`, `ContactoVisita`, `CamposContacto`, `leerFormularioContacto` (Tarea 2); `Button` de `@/components/ui/Button`; `inputClass`, `labelClass`, `errorClass` de `@/components/ui/field`.
- Produce: `type Ruta = { vista: "contactos" } | { vista: "nuevo" } | { vista: "contacto"; id: string } | { vista: "editar"; id: string }`; `leerRuta(search: string): Ruta`; `rutaAUrl(r: Ruta): string`; la página estática `/visita`.

**Por qué la dirección se lee con `useSyncExternalStore` y no con `useSearchParams`:** `useSearchParams` obliga a envolver la página en `Suspense` y la vuelve dependiente de la petición; la página tiene que ser estática para poder guardarse entera. `useSyncExternalStore` lee `window.location.search` solo en el navegador, y en el prerenderizado devuelve `null`, que se muestra como "Abriendo…".

**Por qué no hay `next/link` adentro:** cada `Link` precarga su destino pidiéndole datos al servidor, y sin señal esos pedidos fallan. Adentro se navega con `history.pushState`.

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/visita/navegacion.test.ts
import { describe, expect, it } from "vitest";
import { leerRuta, rutaAUrl, type Ruta } from "./navegacion";

describe("navegación de la visita", () => {
  it("lee la vista desde la dirección", () => {
    expect(leerRuta("")).toEqual({ vista: "contactos" });
    expect(leerRuta("?vista=nuevo")).toEqual({ vista: "nuevo" });
    expect(leerRuta("?contacto=abc")).toEqual({ vista: "contacto", id: "abc" });
    expect(leerRuta("?contacto=abc&vista=editar")).toEqual({ vista: "editar", id: "abc" });
    expect(leerRuta("?vista=editar")).toEqual({ vista: "contactos" });
  });

  it("arma la dirección de cada vista", () => {
    expect(rutaAUrl({ vista: "contactos" })).toBe("/visita");
    expect(rutaAUrl({ vista: "nuevo" })).toBe("/visita?vista=nuevo");
    expect(rutaAUrl({ vista: "contacto", id: "a b" })).toBe("/visita?contacto=a%20b");
    expect(rutaAUrl({ vista: "editar", id: "abc" })).toBe("/visita?contacto=abc&vista=editar");
  });

  it("ida y vuelta sin perder nada", () => {
    const rutas: Ruta[] = [{ vista: "contactos" }, { vista: "nuevo" }, { vista: "contacto", id: "x-1" }, { vista: "editar", id: "x-1" }];
    for (const r of rutas) expect(leerRuta(rutaAUrl(r).replace("/visita", ""))).toEqual(r);
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/visita/navegacion.test.ts`
Esperado: FALLA con `Failed to resolve import "./navegacion"`.

- [ ] **Paso 3: la navegación**

```ts
// src/lib/visita/navegacion.ts

/**
 * La visita es una sola página guardada en el teléfono: las pantallas se eligen por
 * parámetros de la dirección, nunca por rutas de Next, que piden datos al servidor.
 * El paso 3 suma la vista "relevamiento".
 */
export type Ruta =
  | { vista: "contactos" }
  | { vista: "nuevo" }
  | { vista: "contacto"; id: string }
  | { vista: "editar"; id: string };

export function leerRuta(search: string): Ruta {
  const p = new URLSearchParams(search);
  const id = p.get("contacto");
  const vista = p.get("vista");
  if (vista === "nuevo") return { vista: "nuevo" };
  if (id && vista === "editar") return { vista: "editar", id };
  if (id) return { vista: "contacto", id };
  return { vista: "contactos" };
}

export function rutaAUrl(r: Ruta): string {
  switch (r.vista) {
    case "contactos":
      return "/visita";
    case "nuevo":
      return "/visita?vista=nuevo";
    case "contacto":
      return `/visita?contacto=${encodeURIComponent(r.id)}`;
    case "editar":
      return `/visita?contacto=${encodeURIComponent(r.id)}&vista=editar`;
  }
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/visita/navegacion.test.ts`
Esperado: 3 pruebas en PASS.

- [ ] **Paso 5: la página y la aplicación**

```tsx
// src/app/visita/page.tsx
import type { Metadata } from "next";
import { VisitaApp } from "./VisitaApp";

export const metadata: Metadata = { title: "Visita · Bruno Aldana · Arquitectura" };

/** Estática y sin datos: se guarda entera en el teléfono. Los datos viven en IndexedDB. */
export default function VisitaPage() {
  return <VisitaApp />;
}
```

```tsx
// src/app/visita/VisitaApp.tsx
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { crearAlmacenIndexedDB, pedirPersistencia } from "@/lib/visita/almacen";
import { crearApiFetch } from "@/lib/visita/api";
import type { ContactoLocal } from "@/lib/visita/contactos";
import { leerRuta, rutaAUrl, type Ruta } from "@/lib/visita/navegacion";
import { crearSincronizadorVisita, type EstadoSync } from "@/lib/visita/sincronizador";
import { FichaContacto } from "./FichaContacto";
import { FormularioContacto } from "./FormularioContacto";
import { IndicadorSync } from "./IndicadorSync";
import { ListaContactos } from "./ListaContactos";

const REINTENTO_MS = 60_000;

function suscribirDireccion(avisar: () => void) {
  window.addEventListener("popstate", avisar);
  return () => window.removeEventListener("popstate", avisar);
}

function ir(ruta: Ruta) {
  window.history.pushState(null, "", rutaAUrl(ruta));
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function VisitaApp() {
  const search = useSyncExternalStore(suscribirDireccion, () => window.location.search, () => null);
  const ruta = search === null ? null : leerRuta(search);
  const [contactos, setContactos] = useState<ContactoLocal[] | null>(null);
  const [estado, setEstado] = useState<EstadoSync | null>(null);
  const [sinc] = useState(() =>
    crearSincronizadorVisita({
      almacen: crearAlmacenIndexedDB(),
      api: crearApiFetch(),
      alCambiarEstado: setEstado,
      alCambiarContactos: setContactos,
    }),
  );

  useEffect(() => {
    void pedirPersistencia();
    void sinc.iniciar();
    // En la app instalada de iOS el evento "online" no siempre llega: por eso también
    // se reintenta al volver a la app y cada minuto.
    const reintentar = () => void sinc.sincronizar();
    const alVolver = () => {
      if (document.visibilityState === "visible") reintentar();
    };
    window.addEventListener("online", reintentar);
    document.addEventListener("visibilitychange", alVolver);
    const intervalo = window.setInterval(reintentar, REINTENTO_MS);
    return () => {
      window.removeEventListener("online", reintentar);
      document.removeEventListener("visibilitychange", alVolver);
      window.clearInterval(intervalo);
    };
  }, [sinc]);

  const contacto = ruta && "id" in ruta ? contactos?.find((c) => c.id === ruta.id) : undefined;

  let contenido: React.ReactNode;
  if (ruta === null || contactos === null) {
    contenido = <p className="text-sm text-neutral-500">Abriendo…</p>;
  } else if (ruta.vista === "contactos") {
    contenido = <ListaContactos contactos={contactos} onAbrir={(id) => ir({ vista: "contacto", id })} onNuevo={() => ir({ vista: "nuevo" })} />;
  } else if (ruta.vista === "nuevo") {
    contenido = (
      <FormularioContacto
        titulo="Nuevo cliente"
        etiquetaGuardar="Crear cliente"
        onGuardar={async (c) => {
          await sinc.guardarContacto(c);
          ir({ vista: "contacto", id: c.id });
        }}
        onCancelar={() => ir({ vista: "contactos" })}
      />
    );
  } else if (!contacto) {
    contenido = (
      <section className="flex flex-col items-start gap-4">
        <h1 className="font-display text-3xl font-extralight tracking-[-0.03em] text-neutral-100">Este cliente no está en el teléfono</h1>
        <p className="text-sm text-neutral-500">Puede que todavía no haya bajado del servidor. Con señal aparece solo.</p>
        <Button size="sm" onClick={() => ir({ vista: "contactos" })}>Ver contactos</Button>
      </section>
    );
  } else if (ruta.vista === "editar") {
    contenido = (
      <FormularioContacto
        contacto={contacto}
        titulo="Editar cliente"
        etiquetaGuardar="Guardar cambios"
        onGuardar={async (c) => {
          await sinc.guardarContacto(c);
          ir({ vista: "contacto", id: c.id });
        }}
        onCancelar={() => ir({ vista: "contacto", id: contacto.id })}
      />
    );
  } else {
    contenido = <FichaContacto contacto={contacto} onEditar={() => ir({ vista: "editar", id: contacto.id })} onVolver={() => ir({ vista: "contactos" })} />;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-950">
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/firma-horizontal-blanco.svg" alt="Bruno Aldana · Arquitectura" width={126} height={26} className="h-[26px] w-auto" />
          <IndicadorSync estado={estado} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-8">{contenido}</main>
    </div>
  );
}
```

- [ ] **Paso 6: las pantallas**

```tsx
// src/app/visita/IndicadorSync.tsx
import { TEXTO_ESTADO, type EstadoSync } from "@/lib/visita/sincronizador";

/** Con la sesión vencida el estado es un enlace al login que vuelve a la visita. Nada se anima. */
export function IndicadorSync({ estado }: { estado: EstadoSync | null }) {
  if (estado === null) return null;
  if (estado === "sin-sesion") {
    return (
      <a href="/login?volver=/visita" className="dato text-right text-neutral-100 underline underline-offset-4">
        {TEXTO_ESTADO[estado]}
      </a>
    );
  }
  return (
    <p className="dato text-right text-neutral-400" aria-live="polite">
      {TEXTO_ESTADO[estado]}
    </p>
  );
}
```

```tsx
// src/app/visita/ListaContactos.tsx
import { Button } from "@/components/ui/Button";
import type { ContactoLocal } from "@/lib/visita/contactos";

export function ListaContactos({ contactos, onAbrir, onNuevo }: {
  contactos: ContactoLocal[];
  onAbrir: (id: string) => void;
  onNuevo: () => void;
}) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="rotulo text-neutral-500">Visita · {String(contactos.length).padStart(2, "0")} en cartera</span>
          <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">Contactos</h1>
        </div>
        <Button size="sm" onClick={onNuevo}>Nuevo cliente</Button>
      </div>

      {contactos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/12 px-6 py-10 text-center text-sm text-neutral-500">
          Todavía no hay contactos en el teléfono. Con señal bajan solos; sin señal podés crear uno y se sube después.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/8 bg-neutral-900">
          {contactos.map((c, i) => (
            <li key={c.id} className={i > 0 ? "border-t border-white/8" : ""}>
              <button
                type="button"
                onClick={() => onAbrir(c.id)}
                className="flex w-full items-baseline justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-white/[0.04]"
              >
                <span className="text-neutral-100">{c.nombre}</span>
                <span className="dato shrink-0 text-neutral-500">{c.pendiente ? "Sin subir" : (c.telefono ?? "")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

```tsx
// src/app/visita/FormularioContacto.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { errorClass, inputClass, labelClass } from "@/components/ui/field";
import { leerFormularioContacto, type CamposContacto, type ContactoVisita } from "@/lib/visita/contactos";

export function FormularioContacto({ contacto, titulo, etiquetaGuardar, onGuardar, onCancelar }: {
  contacto?: ContactoVisita;
  titulo: string;
  etiquetaGuardar: string;
  onGuardar: (c: ContactoVisita) => Promise<void>;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // El id nace en el teléfono: un cliente creado sin señal ya tiene su identidad definitiva.
  const [base] = useState(() =>
    contacto ? { id: contacto.id, createdAt: contacto.createdAt } : { id: crypto.randomUUID(), createdAt: new Date().toISOString() },
  );

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const leer = (campo: keyof CamposContacto) => String(datos.get(campo) ?? "");
    const r = leerFormularioContacto(
      { nombre: leer("nombre"), telefono: leer("telefono"), email: leer("email"), direccionProyecto: leer("direccionProyecto"), notas: leer("notas"), origen: leer("origen") },
      base,
      new Date().toISOString(),
    );
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(r.contacto);
    } catch {
      setError("No se pudo guardar en el teléfono. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-8">
      <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">{titulo}</h1>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div>
          <label htmlFor="visita-nombre" className={labelClass}>Nombre *</label>
          <input id="visita-nombre" name="nombre" type="text" autoComplete="off" defaultValue={contacto?.nombre ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-telefono" className={labelClass}>Teléfono</label>
          <input id="visita-telefono" name="telefono" type="tel" inputMode="tel" defaultValue={contacto?.telefono ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-email" className={labelClass}>Email</label>
          <input id="visita-email" name="email" type="email" inputMode="email" defaultValue={contacto?.email ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-direccion" className={labelClass}>Dirección del proyecto</label>
          <input id="visita-direccion" name="direccionProyecto" type="text" defaultValue={contacto?.direccionProyecto ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-origen" className={labelClass}>Origen</label>
          <input id="visita-origen" name="origen" type="text" placeholder="Instagram, referido, web…" defaultValue={contacto?.origen ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-notas" className={labelClass}>Notas</label>
          <textarea id="visita-notas" name="notas" rows={4} defaultValue={contacto?.notas ?? ""} className={inputClass} />
        </div>
        {error && <p className={errorClass}>{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : etiquetaGuardar}</Button>
          <Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button>
        </div>
      </form>
    </section>
  );
}
```

```tsx
// src/app/visita/FichaContacto.tsx
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/field";
import type { ContactoLocal } from "@/lib/visita/contactos";

export function FichaContacto({ contacto: c, onEditar, onVolver }: {
  contacto: ContactoLocal;
  onEditar: () => void;
  onVolver: () => void;
}) {
  const datos: [string, string | null][] = [
    ["Teléfono", c.telefono],
    ["Email", c.email],
    ["Dirección del proyecto", c.direccionProyecto],
    ["Origen", c.origen],
    ["Notas", c.notas],
  ];

  return (
    <section className="flex flex-col gap-8">
      <button type="button" onClick={onVolver} className="rotulo self-start text-neutral-500 transition-colors duration-150 hover:text-neutral-200">
        ← Contactos
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">{c.nombre}</h1>
        <Button size="sm" variant="secondary" onClick={onEditar}>Editar</Button>
      </div>
      {c.pendiente && <p className="dato text-neutral-400">Con cambios sin subir</p>}
      <dl className="grid gap-5 rounded-2xl border border-white/8 bg-neutral-900 p-6">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt className={labelClass}>{etiqueta}</dt>
            <dd className={valor ? "whitespace-pre-line text-neutral-100" : "text-neutral-600"}>{valor ?? "Sin cargar"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Paso 7: el enlace en el encabezado de la computadora**

En `src/components/AppHeader.tsx`, reemplazar:

```ts
const NAV = [{ href: "/contactos", label: "Contactos" }];
```

por:

```ts
const NAV = [
  { href: "/contactos", label: "Contactos" },
  { href: "/visita", label: "Visita" },
];
```

- [ ] **Paso 8: verificar tipos, pruebas y compilación**

```bash
npx tsc --noEmit
npm test
npx next build
```

Esperado: `tsc` sin salida; 123 pruebas en PASS; la compilación termina y lista `○ /visita` (el círculo vacío significa estática). **Si aparece como `ƒ` (dinámica), parar**: algo en la página depende de la petición y no se va a poder guardar entera.

- [ ] **Paso 9: commit**

```bash
git add src/lib/visita/navegacion.ts src/lib/visita/navegacion.test.ts src/app/visita src/components/AppHeader.tsx
git commit -m "La visita tiene su pantalla: contactos, cliente nuevo y ficha, guardados en el teléfono"
```

---

### Tarea 6: El service worker guarda la app entera

**Archivos:**
- Crear: `src/lib/visita/recursos.ts`
- Prueba: `src/lib/visita/recursos.test.ts`
- Crear: `src/app/sw.js/route.ts`
- Borrar: `public/sw.js`
- Modificar: `next.config.ts`, `src/app/manifest.ts`

**Interfaces:**
- Consume: la página `/visita` (Tarea 5); `RegistroServiceWorker` ya montado en `src/app/layout.tsx` (registra `/sw.js` solo en producción).
- Produce: `extraerRecursos(html: string): string[]`; `extraerUrlsDeCss(css: string, urlCss: string): string[]`; `GET /sw.js` con la versión de la publicación escrita adentro; `process.env.VERSION_APP`.

**Qué hace el service worker:**

| Momento | Qué hace |
|---|---|
| Instalación | Baja `/visita`, saca de su HTML todos los archivos de `/_next/static/`, lee las hojas de estilo para sumar las tipografías, y guarda todo junto con el manifiesto, los íconos y la firma. Si falla una sola pieza, no se instala y se reintenta la próxima vez |
| Activación | Borra las copias de versiones anteriores, incluida la `relevamiento-v1` de la etapa 1 |
| Abrir `/visita`, con cualquier parámetro | Entrega la copia guardada; si no hay, pide la red |
| `/_next/static/*` y los archivos básicos | Copia guardada primero, ignorando parámetros como `?dpl=` que agrega Vercel |
| Todo lo demás, y todo lo que no sea `GET` | No lo toca |

- [ ] **Paso 1: escribir la prueba que falla**

```ts
// src/lib/visita/recursos.test.ts
import { describe, expect, it } from "vitest";
import { extraerRecursos, extraerUrlsDeCss } from "./recursos";

const html = `<!DOCTYPE html><html><head>
<link rel="preload" href="/_next/static/media/archivo-latin.woff2" as="font" crossorigin=""/>
<link rel="stylesheet" href="/_next/static/css/app.css?dpl=dpl_123" data-precedence="next"/>
<script src="/_next/static/chunks/webpack-abc.js" async=""></script>
<script src="/_next/static/chunks/webpack-abc.js" async=""></script>
</head><body><script>self.__next_f.push([1,"2:I[\\"/_next/static/chunks/app/visita/page-def.js\\"]"])</script>
<script>var base="/_next/static/";</script></body></html>`;

const css = `@font-face{font-family:Archivo;src:url(../media/archivo.woff2) format("woff2")}
@font-face{src:url("/_next/static/media/mono.woff2")}
.x{background:url(data:image/svg+xml;base64,AAAA)}
@import url(https://fonts.googleapis.com/css2?family=X);`;

describe("recursos que guarda el service worker", () => {
  it("saca del HTML cada archivo estático una sola vez, sin parámetros", () => {
    expect(extraerRecursos(html)).toEqual([
      "/_next/static/media/archivo-latin.woff2",
      "/_next/static/css/app.css",
      "/_next/static/chunks/webpack-abc.js",
      "/_next/static/chunks/app/visita/page-def.js",
    ]);
  });

  it("saca de la hoja de estilos las tipografías propias, resolviendo rutas relativas", () => {
    expect(extraerUrlsDeCss(css, "/_next/static/css/app.css")).toEqual([
      "/_next/static/media/archivo.woff2",
      "/_next/static/media/mono.woff2",
    ]);
  });

  it("se pueden copiar dentro del service worker porque no usan nada de afuera", () => {
    const copiaRecursos = new Function(`return ${extraerRecursos.toString()}`)();
    const copiaCss = new Function(`return ${extraerUrlsDeCss.toString()}`)();
    expect(copiaRecursos(html)).toEqual(extraerRecursos(html));
    expect(copiaCss(css, "/_next/static/css/app.css")).toEqual(extraerUrlsDeCss(css, "/_next/static/css/app.css"));
  });
});
```

- [ ] **Paso 2: correrla y verificar que falla**

Correr: `npx vitest run src/lib/visita/recursos.test.ts`
Esperado: FALLA con `Failed to resolve import "./recursos"`.

- [ ] **Paso 3: la implementación**

```ts
// src/lib/visita/recursos.ts

/*
 * Estas dos funciones se copian tal cual dentro del service worker
 * (src/app/sw.js/route.ts) con Function.prototype.toString. Por eso no pueden usar
 * nada de afuera: ni imports, ni otras funciones o constantes de este archivo.
 * La tercera prueba de recursos.test.ts lo controla.
 */

/** Los archivos de /_next/static/ que nombra el HTML, sin parámetros y sin repetir. */
export function extraerRecursos(html: string): string[] {
  const patron = /\/_next\/static\/[^"'\\\s<>)?]+?\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|ico)(?=[?"'\\\s<>)]|$)/g;
  return Array.from(new Set(html.match(patron) ?? []));
}

/** Las direcciones propias que nombra una hoja de estilos (tipografías), resueltas desde la hoja. */
export function extraerUrlsDeCss(css: string, urlCss: string): string[] {
  const base = "https://base.local";
  const patron = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  const salida: string[] = [];
  let encontrado: RegExpExecArray | null;
  while ((encontrado = patron.exec(css)) !== null) {
    const valor = encontrado[2].trim();
    if (valor.startsWith("data:")) continue;
    const absoluta = new URL(valor, base + urlCss);
    if (absoluta.origin === base) salida.push(absoluta.pathname);
  }
  return Array.from(new Set(salida));
}
```

- [ ] **Paso 4: correr la prueba y verificar que pasa**

Correr: `npx vitest run src/lib/visita/recursos.test.ts`
Esperado: 3 pruebas en PASS.

- [ ] **Paso 5: el service worker como Route Handler**

Borrar el de la etapa 1, que chocaría con la ruta nueva:

```bash
git rm public/sw.js
```

```ts
// src/app/sw.js/route.ts
import { extraerRecursos, extraerUrlsDeCss } from "@/lib/visita/recursos";

export const dynamic = "force-static";

/**
 * El service worker del modo visita. Se arma en la compilación con la versión de la
 * publicación escrita adentro: cada deploy es un service worker distinto, el teléfono
 * lo instala solo, guarda la app nueva y descarta la vieja.
 *
 * El código de adentro no usa comillas invertidas ni `${` propios: todo lo que se
 * interpola es de este archivo.
 */
const VERSION = process.env.VERSION_APP ?? "desarrollo";

const CODIGO = `/* Service worker del modo visita · versión ${VERSION} · generado por src/app/sw.js/route.ts */
const VERSION = ${JSON.stringify(VERSION)};
const CACHE = "visita-" + VERSION;
const ESTATICOS = ["/manifest.webmanifest", "/icon.png", "/apple-icon.png", "/firma-horizontal-blanco.svg"];
const extraerRecursos = ${extraerRecursos.toString()};
const extraerUrlsDeCss = ${extraerUrlsDeCss.toString()};

async function precargar() {
  const cache = await caches.open(CACHE);
  const pagina = await fetch("/visita", { cache: "no-store" });
  if (!pagina.ok || pagina.redirected) throw new Error("No se pudo bajar /visita");
  const recursos = extraerRecursos(await pagina.clone().text());
  const hojas = recursos.filter(function (r) { return r.endsWith(".css"); });
  const fuentes = [];
  for (const hoja of hojas) {
    const respuesta = await fetch(hoja);
    if (!respuesta.ok) throw new Error("No se pudo bajar " + hoja);
    fuentes.push(...extraerUrlsDeCss(await respuesta.text(), hoja));
  }
  await cache.addAll(Array.from(new Set(ESTATICOS.concat(recursos, fuentes))));
  await cache.put("/visita", pagina);
}

self.addEventListener("install", function (event) {
  event.waitUntil(precargar().then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (claves) { return Promise.all(claves.filter(function (c) { return c !== CACHE; }).map(function (c) { return caches.delete(c); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname === "/visita") {
    event.respondWith(
      caches.open(CACHE)
        .then(function (cache) { return cache.match("/visita"); })
        .then(function (guardada) { return guardada || fetch(request); })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ESTATICOS.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async function (cache) {
        const guardada = await cache.match(request, { ignoreSearch: true });
        if (guardada) return guardada;
        const respuesta = await fetch(request);
        if (respuesta.ok && url.pathname.startsWith("/_next/static/")) cache.put(request, respuesta.clone());
        return respuesta;
      })
    );
  }
});
`;

export function GET() {
  return new Response(CODIGO, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
```

- [ ] **Paso 6: la versión en `next.config.ts` y el inicio en `/visita`**

Reemplazar el contenido completo de `next.config.ts` por:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
  },
  // La versión de la publicación queda escrita dentro del service worker
  // (src/app/sw.js/route.ts): cada deploy instala uno nuevo, que guarda la app nueva
  // en el teléfono y descarta la copia vieja. Los encabezados de /sw.js los pone la ruta.
  env: {
    VERSION_APP: process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`,
  },
};

export default nextConfig;
```

En `src/app/manifest.ts`, reemplazar la línea `    start_url: "/contactos",` por:

```ts
    start_url: "/visita",
    scope: "/",
```

y la descripción `"Contactos, entrevistas y relevamiento del estudio."` por `"La visita a obra: contactos y relevamiento, también sin señal."`.

- [ ] **Paso 7: verificar tipos, pruebas y compilación**

```bash
npx tsc --noEmit
npm test
npx next build
```

Esperado: `tsc` sin salida; 126 pruebas en PASS; la compilación lista `○ /visita` y `○ /sw.js`.

- [ ] **Paso 8: verificar el service worker servido**

Con `npx next start -p 3100` corriendo en segundo plano:

```bash
curl -sI http://localhost:3100/sw.js | grep -iE "^HTTP|content-type|cache-control"
curl -s http://localhost:3100/sw.js -o /tmp/sw-visita.js && node --check /tmp/sw-visita.js && grep -o 'const VERSION = "[^"]*"' /tmp/sw-visita.js
curl -s -o /dev/null -w "visita: %{http_code}\n" http://localhost:3100/visita
curl -s http://localhost:3100/visita | grep -oE '/_next/static/[^"\\ ?]+\.(js|css|woff2)' | sort -u | wc -l
curl -s -o /dev/null -w "contactos: %{http_code} %{redirect_url}\n" http://localhost:3100/contactos
curl -s http://localhost:3100/manifest.webmanifest | grep -o '"start_url":"[^"]*"'
```

Esperado:
- `HTTP/1.1 200 OK`, `content-type: application/javascript; charset=utf-8`, `cache-control: no-cache, no-store, must-revalidate`
- `node --check` sin error y `const VERSION = "local-<número>"`
- `visita: 200` sin sesión, y más de 5 archivos estáticos nombrados en su HTML
- `contactos: 307 http://localhost:3100/login`
- `"start_url":"/visita"`

Dejar el servidor corriendo para la Tarea 7.

- [ ] **Paso 9: commit**

```bash
git add src/lib/visita/recursos.ts src/lib/visita/recursos.test.ts src/app/sw.js/route.ts next.config.ts src/app/manifest.ts
git commit -m "Al instalarse, la app guarda la visita entera en el teléfono y abre sin señal"
```

(`git rm` del paso 5 ya dejó preparado el borrado de `public/sw.js`.)

---

### Tarea 7: Verificación sin señal de verdad

**Archivos:**
- Modificar, fuera del repositorio y sin commit: `E:\BRUNO_CLAUDE\BA_ARQUITECTURA\proceso\estado-sesion-10-09.md`, la fila del relevamiento en `E:\BRUNO_CLAUDE\BA_ARQUITECTURA\CLAUDE.md`.

**Interfaces:**
- Consume: la app completa de las Tareas 1 a 6, compilada y corriendo con `npx next start -p 3100`.
- Produce: el paso 1 verificado en un navegador real sin conexión, y la prueba del iPhone lista para Bruno.

Esta tarea escribe en la base de producción: crea **un** contacto llamado `PRUEBA MODO VISITA · borrar` y lo borra al final. Nada más.

Se usa el servidor MCP de Playwright (`mcp__playwright__*`). Las operaciones del contexto del navegador —cookies y modo sin conexión— van con `browser_run_code_unsafe`, que recibe `async (page) => { … }`.

- [ ] **Paso 1: un token de sesión local**

```bash
cat > src/token.tmp.mts <<'EOF'
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
const { createSessionToken } = await import("./lib/session.ts");
console.log(await createSessionToken("prueba-local"));
EOF
npx tsx --tsconfig tsconfig.json src/token.tmp.mts; rm -f src/token.tmp.mts
```

Guardar el token que imprime.

- [ ] **Paso 2: instalar la app**

1. `browser_navigate` a `http://localhost:3100/visita`.
2. `browser_evaluate`:

```js
async () => {
  await navigator.serviceWorker.ready;
  const clave = (await caches.keys()).find((k) => k.startsWith("visita-"));
  const archivos = (await (await caches.open(clave)).keys()).map((q) => new URL(q.url).pathname);
  return { clave, total: archivos.length, archivos };
}
```

Esperado: `clave` = `visita-local-<número>`; `archivos` incluye `/visita`, `/manifest.webmanifest`, `/icon.png`, `/firma-horizontal-blanco.svg`, al menos un `.css`, al menos un `.woff2` y varios `.js`.

3. `browser_snapshot`. Esperado: la lista de contactos vacía y el estado **"Iniciá sesión para subir"** (todavía no hay sesión: prueba el camino del `401`).

- [ ] **Paso 3: con sesión, bajan los contactos**

1. `browser_run_code_unsafe`:

```js
async (page) => {
  await page.context().addCookies([{ name: "session", value: "<TOKEN>", domain: "localhost", path: "/" }]);
  await page.reload();
}
```

2. `browser_wait_for` el texto `Todo subido`.
3. `browser_snapshot`. Esperado: la lista con los contactos reales de la base (4 o más).

- [ ] **Paso 4: abrir en frío sin conexión**

1. `browser_run_code_unsafe`:

```js
async (page) => {
  await page.goto("about:blank");
  await page.context().setOffline(true);
  await page.goto("http://localhost:3100/visita");
  return page.locator("h1").first().textContent();
}
```

Esperado: devuelve `Contactos`. La página y todos sus archivos salieron de la copia guardada.

2. `browser_wait_for` el texto `Sin señal · guardado en el teléfono`. `browser_snapshot`: la lista sigue ahí, leída del teléfono.

- [ ] **Paso 5: crear un cliente sin conexión**

1. `browser_click` en **Nuevo cliente**.
2. `browser_fill_form`: *Nombre* = `PRUEBA MODO VISITA · borrar`, *Teléfono* = `70000000`.
3. `browser_click` en **Crear cliente**.
4. `browser_snapshot`. Esperado: la ficha con el nombre, el teléfono y **"Con cambios sin subir"**.
5. `browser_run_code_unsafe`: `async (page) => { await page.reload(); return page.url(); }`. Esperado: la dirección `/visita?contacto=<uuid>` vuelve a abrir la ficha sin conexión. Anotar el `<uuid>`.

- [ ] **Paso 6: vuelve la conexión y sube solo**

1. `browser_run_code_unsafe`: `async (page) => { await page.context().setOffline(false); }`
2. `browser_wait_for` el texto `Todo subido` (hasta 70 s: si el evento `online` no llega, el reintento de cada minuto lo cubre).
3. En la base:

```bash
cat > src/prueba.tmp.mts <<'EOF'
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
const { prisma } = await import("./lib/prisma.ts");
const filas = await prisma.contacto.findMany({
  where: { nombre: "PRUEBA MODO VISITA · borrar" },
  include: { entrevistas: true, cotizaciones: true, relevamiento: true },
});
console.log(JSON.stringify(filas.map((f) => ({ id: f.id, telefono: f.telefono, vinculados: f.entrevistas.length + f.cotizaciones.length + (f.relevamiento ? 1 : 0) }))));
if (process.argv.includes("--borrar")) {
  const ids = filas.filter((f) => f.entrevistas.length === 0 && f.cotizaciones.length === 0 && !f.relevamiento).map((f) => f.id);
  const r = await prisma.contacto.deleteMany({ where: { id: { in: ids } } });
  console.log("borrados:", r.count);
}
await prisma.$disconnect();
EOF
npx tsx --tsconfig tsconfig.json src/prueba.tmp.mts
```

Esperado: **una sola fila**, con el mismo `<uuid>` del paso 5, `telefono: "70000000"` y `vinculados: 0`. Si hay más de una fila, parar: la subida duplicó.

- [ ] **Paso 7: limpiar**

```bash
npx tsx --tsconfig tsconfig.json src/prueba.tmp.mts --borrar
rm -f src/prueba.tmp.mts
git status --short
```

Esperado: `borrados: 1`, y `git status` sin archivos temporales. Cerrar el navegador con `browser_close` y detener `next start`.

- [ ] **Paso 8: dejarlo escrito**

En `proceso/estado-sesion-10-09.md`, agregar debajo del documento de diseño una sección **"Paso 1, la base sin señal: terminado"** con la fecha, los commits de la rama y el resultado de los pasos 2 a 7. En `CLAUDE.md`, cambiar en la fila del relevamiento el próximo paso a: *probar el paso 1 en el iPhone y escribir el plan del paso 2*.

- [ ] **Paso 9: la prueba en el iPhone, con Bruno**

**Antes, pedirle permiso a Bruno** para subir la rama con `git push`. Vercel actualiza solo el link de prueba de la rama:
<https://bruno-aldana-arquitectura-git-modulo-relevamiento-ba-ed54.vercel.app>

Instrucciones para Bruno, en este orden:

1. Borrar de la pantalla de inicio la app de prueba que instaló antes, si la tiene.
2. **Con señal**, abrir el link en Safari, tocar *Compartir → Agregar a pantalla de inicio*, y **abrir una vez la app instalada con señal** (en iOS la app instalada guarda sus datos aparte de Safari: esa primera apertura es la instalación). Iniciar sesión adentro y esperar **"Todo subido"**.
3. Cerrar la app del todo y poner **modo avión**.
4. Abrir la app: tiene que mostrar los contactos y **"Sin señal · guardado en el teléfono"**.
5. Crear un cliente de prueba y editarlo.
6. Cerrar la app del todo, abrirla otra vez, todavía en modo avión: el cliente sigue ahí.
7. Sacar el modo avión y volver a la app: en menos de un minuto, **"Todo subido"**, y el cliente aparece en la computadora.
8. Dejar el teléfono sin abrir la app un par de días y abrirla en modo avión: los datos siguen (control del borrado de iOS).

Anotar el resultado de cada punto en `proceso/estado-sesion-10-09.md`. Lo que falle no se da por cerrado: se anota y se decide con Bruno.

---

## Fuera de este plan

- **Paso 2:** el motor del plano BIM (modelo `ba-relevamiento` v2, medidas, cierre, ambientes, techos, archivo para Revit). Plan propio.
- **Paso 3:** la pantalla táctil del boceto y la vista `relevamiento` dentro de `/visita`. Suma la tabla `relevamientos` a IndexedDB (versión 2) y redirige `/contactos/[id]/relevamiento`.
- **Paso 4:** el botón de pyRevit.
- **La entrevista sin señal:** diseño y plan propios, después del paso 4.
