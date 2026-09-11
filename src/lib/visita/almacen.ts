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
