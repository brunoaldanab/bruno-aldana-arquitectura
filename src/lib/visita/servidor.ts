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
