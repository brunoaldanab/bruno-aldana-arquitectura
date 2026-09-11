// src/lib/visita/almacen.ts
import type { Relevamiento } from "@/lib/plano/modelo";
import type { ContactoLocal, Operacion } from "./contactos";
import { fusionarRelevamientos, type RelevamientoLocal, type RelevamientoRemoto } from "./relevamientos";

export interface AlmacenVisita {
  listarContactos(): Promise<ContactoLocal[]>;
  guardarContactos(contactos: ContactoLocal[]): Promise<void>;
  encolar(op: Operacion): Promise<void>;
  leerCola(): Promise<{ claves: number[]; operaciones: Operacion[] }>;
  quitarDeCola(claves: number[]): Promise<void>;
  leerMeta(clave: "ultimaSync"): Promise<string | null>;
  guardarMeta(clave: "ultimaSync", valor: string): Promise<void>;
  leerRelevamiento(contactoId: string): Promise<RelevamientoLocal | null>;
  /**
   * Guarda el relevamiento como pendiente y lo encola, en un solo paso: conserva la
   * `versionBase` que ya tenía y reemplaza en la cola la versión anterior del mismo
   * contacto. Un relevamiento pesa: la cola no crece con cada toque.
   */
  guardarYEncolarRelevamiento(contactoId: string, data: Relevamiento, guardadoEn: string): Promise<void>;
  /** Después de subir: anota la versión del servidor. Sigue pendiente si en la cola hay una versión más nueva. */
  marcarRelevamientoSubido(contactoId: string, version: number): Promise<void>;
  /** Aplica lo que bajó del servidor sin pisar lo pendiente. Devuelve los contactos cuyo relevamiento cambió. */
  fusionarRelevamientosRemotos(remotos: RelevamientoRemoto[], ahora: string): Promise<string[]>;
}

const BASE = "ba-visita";
const VERSION = 2;

/**
 * IndexedDB `ba-visita`: contactos, relevamientos, la cola de lo que falta subir y
 * la fecha de la última sincronización. La versión 2 suma `relevamientos`; al
 * actualizar solo se crea lo que falta, así lo guardado en la versión 1 sigue ahí.
 */
function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, VERSION);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains("contactos")) db.createObjectStore("contactos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("cola")) db.createObjectStore("cola", { autoIncrement: true });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if (!db.objectStoreNames.contains("relevamientos")) db.createObjectStore("relevamientos", { keyPath: "contactoId" });
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

/** Recorre la cola; `alTerminar` corre dentro del mismo evento, con la transacción todavía viva. */
function recorrerCola(
  tabla: IDBObjectStore,
  visitar: (op: Operacion, cursor: IDBCursorWithValue) => void,
  alTerminar: () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const pedido = tabla.openCursor();
    pedido.onsuccess = () => {
      const cursor = pedido.result;
      if (!cursor) {
        alTerminar();
        return resolve();
      }
      visitar(cursor.value as Operacion, cursor);
      cursor.continue();
    };
    pedido.onerror = () => reject(pedido.error);
  });
}

const esDe = (op: Operacion, contactoId: string) => op.tipo === "relevamiento" && op.contactoId === contactoId;

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
    leerRelevamiento: (contactoId) =>
      transaccion(["relevamientos"], "readonly", async (tx) =>
        (await esperar(tx.objectStore("relevamientos").get(contactoId) as IDBRequest<RelevamientoLocal | undefined>)) ?? null,
      ),
    guardarYEncolarRelevamiento: (contactoId, data, guardadoEn) =>
      transaccion(["relevamientos", "cola"], "readwrite", async (tx) => {
        const tabla = tx.objectStore("relevamientos");
        const cola = tx.objectStore("cola");
        const actual = await esperar(tabla.get(contactoId) as IDBRequest<RelevamientoLocal | undefined>);
        const versionBase = actual?.versionBase ?? 0;
        tabla.put({ contactoId, data, versionBase, pendiente: true, guardadoEn } satisfies RelevamientoLocal);
        await recorrerCola(
          cola,
          (op, cursor) => {
            if (esDe(op, contactoId)) cursor.delete();
          },
          () => cola.add({ tipo: "relevamiento", contactoId, data, versionBase } satisfies Operacion),
        );
      }),
    marcarRelevamientoSubido: (contactoId, version) =>
      transaccion(["relevamientos", "cola"], "readwrite", async (tx) => {
        const tabla = tx.objectStore("relevamientos");
        const actual = await esperar(tabla.get(contactoId) as IDBRequest<RelevamientoLocal | undefined>);
        if (!actual) return;
        let sigue = false;
        await recorrerCola(
          tx.objectStore("cola"),
          (op) => {
            if (esDe(op, contactoId)) sigue = true;
          },
          () => tabla.put({ ...actual, versionBase: Math.max(actual.versionBase, version), pendiente: sigue }),
        );
      }),
    fusionarRelevamientosRemotos: (remotos, ahora) =>
      transaccion(["relevamientos"], "readwrite", async (tx) => {
        if (remotos.length === 0) return [];
        const tabla = tx.objectStore("relevamientos");
        const locales = await esperar(tabla.getAll() as IDBRequest<RelevamientoLocal[]>);
        const { lista, cambiados } = fusionarRelevamientos(locales, remotos, ahora);
        lista.filter((r) => cambiados.includes(r.contactoId)).forEach((r) => tabla.put(r));
        return cambiados;
      }),
  };
}

/** Le pide al navegador que no borre estos datos. Safari decide solo. */
export async function pedirPersistencia(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  return navigator.storage.persist().catch(() => false);
}
