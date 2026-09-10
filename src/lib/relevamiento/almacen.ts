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
