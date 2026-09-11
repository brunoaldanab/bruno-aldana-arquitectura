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
