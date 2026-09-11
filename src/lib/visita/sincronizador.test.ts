// src/lib/visita/sincronizador.test.ts
import { describe, expect, it, vi } from "vitest";
import { relevamientoVacio } from "@/lib/plano/modelo";
import type { ContactoLocal, ContactoVisita, Operacion } from "./contactos";
import type { AlmacenVisita } from "./almacen";
import { ErrorSinRed, ErrorSinSesion, type ApiVisita } from "./api";
import { fusionarRelevamientos, type RelevamientoLocal } from "./relevamientos";
import { crearSincronizadorVisita, type EstadoSync } from "./sincronizador";

const contacto = (id: string, extra: Partial<ContactoVisita> = {}): ContactoVisita => ({
  id, nombre: `Cliente ${id}`, telefono: null, email: null, direccionProyecto: null, notas: null, origen: null,
  createdAt: "2026-09-10T10:00:00.000Z", updatedAt: "2026-09-10T10:00:00.000Z", ...extra,
});
const datos = (nombre: string) => relevamientoVacio({ contactoId: "a", nombre, direccion: "", fechaRelevamiento: "2026-09-11" });

/** El mismo contrato que IndexedDB, en memoria. */
function almacenEnMemoria() {
  const contactos = new Map<string, ContactoLocal>();
  const relevamientos = new Map<string, RelevamientoLocal>();
  const cola = new Map<number, Operacion>();
  const meta = new Map<string, string>();
  let siguiente = 1;
  const enCola = (id: string) => [...cola.values()].some((o) => o.tipo === "relevamiento" && o.contactoId === id);
  const almacen: AlmacenVisita = {
    listarContactos: async () => [...contactos.values()],
    guardarContactos: async (cs) => { cs.forEach((c) => contactos.set(c.id, c)); },
    encolar: async (op) => { cola.set(siguiente++, op); },
    leerCola: async () => ({ claves: [...cola.keys()], operaciones: [...cola.values()] }),
    quitarDeCola: async (claves) => { claves.forEach((k) => cola.delete(k)); },
    leerMeta: async (k) => meta.get(k) ?? null,
    guardarMeta: async (k, v) => { meta.set(k, v); },
    leerRelevamiento: async (id) => relevamientos.get(id) ?? null,
    guardarYEncolarRelevamiento: async (contactoId, data, guardadoEn) => {
      const versionBase = relevamientos.get(contactoId)?.versionBase ?? 0;
      relevamientos.set(contactoId, { contactoId, data, versionBase, pendiente: true, guardadoEn });
      for (const [k, o] of cola) if (o.tipo === "relevamiento" && o.contactoId === contactoId) cola.delete(k);
      cola.set(siguiente++, { tipo: "relevamiento", contactoId, data, versionBase });
    },
    marcarRelevamientoSubido: async (id, version) => {
      const r = relevamientos.get(id);
      if (r) relevamientos.set(id, { ...r, versionBase: Math.max(r.versionBase, version), pendiente: enCola(id) });
    },
    fusionarRelevamientosRemotos: async (remotos, ahora) => {
      const { lista, cambiados } = fusionarRelevamientos([...relevamientos.values()], remotos, ahora);
      lista.forEach((r) => relevamientos.set(r.contactoId, r));
      return cambiados;
    },
  };
  return { almacen, contactos, relevamientos, cola, meta };
}

const subirEco: ApiVisita["subir"] = async (ops) => ({
  contactos: ops.flatMap((o) => (o.tipo === "contacto" ? [o.contacto] : [])),
  relevamientos: ops.flatMap((o) => (o.tipo === "relevamiento" ? [{ contactoId: o.contactoId, version: o.versionBase + 1, conflicto: false }] : [])),
});

function preparar(api: Partial<ApiVisita> = {}) {
  const mem = almacenEnMemoria();
  const estados: EstadoSync[] = [];
  const recargados: string[][] = [];
  const apiCompleta: ApiVisita = {
    subir: vi.fn(subirEco),
    cambios: vi.fn(async () => ({ contactos: [], relevamientos: [], ahora: "2026-09-10T12:00:00.000Z" })),
    ...api,
  };
  const sinc = crearSincronizadorVisita({
    almacen: mem.almacen, api: apiCompleta, alCambiarEstado: (e) => estados.push(e), alCambiarContactos: () => {},
    alCambiarRelevamientos: (ids) => recargados.push(ids), demoraMs: 60_000,
  });
  return { ...mem, estados, recargados, api: apiCompleta, sinc };
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
    const t = preparar({ cambios: vi.fn(async () => ({ contactos: [contacto("b")], relevamientos: [], ahora: "2026-09-10T12:00:00.000Z" })) });
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
      return subirEco(ops);
    });
    await t.sinc.guardarContacto(contacto("a"));
    await t.sinc.sincronizar();
    expect(t.cola.size).toBe(1);
    expect(t.contactos.get("a")?.nombre).toBe("Cambiado durante la subida");
    expect(t.contactos.get("a")?.pendiente).toBe(true);
    expect(t.estados.at(-1)).toBe("local");
  });
});

describe("sincronizador de visita · relevamientos", () => {
  it("guardar deja el relevamiento pendiente y una sola entrada en la cola", async () => {
    const t = preparar();
    await t.sinc.guardarRelevamiento("a", datos("uno"));
    await t.sinc.guardarRelevamiento("a", datos("dos"));
    expect(t.relevamientos.get("a")).toMatchObject({ pendiente: true, versionBase: 0 });
    expect(t.cola.size).toBe(1);
    expect(t.estados.at(-1)).toBe("local");
  });

  it("sube, queda con la versión del servidor y sin pendiente", async () => {
    const t = preparar();
    await t.sinc.guardarContacto(contacto("a"));
    await t.sinc.guardarRelevamiento("a", datos("uno"));
    await t.sinc.sincronizar();
    expect(t.relevamientos.get("a")).toMatchObject({ pendiente: false, versionBase: 1 });
    expect(t.cola.size).toBe(0);
    expect(t.estados.at(-1)).toBe("subido");
  });

  it("si reemplazó una versión más nueva del servidor, lo avisa", async () => {
    const t = preparar({ subir: vi.fn(async () => ({ contactos: [], relevamientos: [{ contactoId: "a", version: 4, conflicto: true }] })) });
    await t.sinc.guardarRelevamiento("a", datos("uno"));
    await t.sinc.sincronizar();
    expect(t.relevamientos.get("a")?.versionBase).toBe(4);
    expect(t.estados.at(-1)).toBe("subido-conflicto");
  });

  it("sin señal el relevamiento sigue en el teléfono y en la cola", async () => {
    const t = preparar({ subir: vi.fn(async () => { throw new ErrorSinRed(); }) });
    await t.sinc.guardarRelevamiento("a", datos("uno"));
    await t.sinc.sincronizar();
    expect(t.relevamientos.get("a")?.pendiente).toBe(true);
    expect(t.cola.size).toBe(1);
    expect(t.estados.at(-1)).toBe("sin-senal");
  });

  it("lo que baja no pisa lo pendiente y recarga lo que cambió", async () => {
    const remotos = [
      { contactoId: "a", data: datos("remoto a"), version: 9 },
      { contactoId: "b", data: datos("remoto b"), version: 2 },
    ];
    const t = preparar({
      subir: vi.fn(async () => { throw new ErrorSinRed(); }),
      cambios: vi.fn(async () => ({ contactos: [], relevamientos: remotos, ahora: "x" })),
    });
    await t.sinc.guardarRelevamiento("a", datos("local a"));
    t.api.subir = vi.fn(async () => ({ contactos: [], relevamientos: [] }));
    t.cola.clear();
    await t.sinc.sincronizar();
    expect(t.relevamientos.get("a")?.data.proyecto.nombre).toBe("local a");
    expect(t.relevamientos.get("b")?.data.proyecto.nombre).toBe("remoto b");
    expect(t.recargados).toEqual([["b"]]);
  });

  it("editado durante la subida sigue pendiente y la versión base avanza", async () => {
    const t = preparar();
    t.api.subir = vi.fn(async (ops: Operacion[]) => {
      await t.sinc.guardarRelevamiento("a", datos("durante"));
      return subirEco(ops);
    });
    await t.sinc.guardarRelevamiento("a", datos("antes"));
    await t.sinc.sincronizar();
    expect(t.relevamientos.get("a")).toMatchObject({ pendiente: true, versionBase: 1 });
    expect(t.relevamientos.get("a")?.data.proyecto.nombre).toBe("durante");
    expect(t.cola.size).toBe(1);
    t.api.subir = vi.fn(subirEco);
    await t.sinc.sincronizar();
    expect(t.api.subir).toHaveBeenCalledWith([expect.objectContaining({ tipo: "relevamiento", versionBase: 1 })]);
    expect(t.relevamientos.get("a")).toMatchObject({ pendiente: false, versionBase: 2 });
  });
});
