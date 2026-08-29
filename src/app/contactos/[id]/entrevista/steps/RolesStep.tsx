"use client";

import { useState } from "react";
import {
  nuevoRol,
  rolAlmacenamientoOpciones,
  rolConfortOpciones,
  rolEquipoOpciones,
  rolInstalacionesOpciones,
  rolMobiliarioOpciones,
  rolTecnologiaOpciones,
} from "@/lib/entrevista/data";
import type { EntrevistaState, Rol } from "@/lib/entrevista/types";
import { ChipSingle } from "@/components/entrevista/ChipSingle";
import { ChipMulti } from "@/components/entrevista/ChipMulti";
import { inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/Button";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

type ListField = "mobiliario" | "equipo" | "instalaciones" | "almacenamiento" | "tecnologia" | "conectaCon" | "confort";

export function RolesStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [openId, setOpenId] = useState<string | null>(state.roles[0]?.id ?? null);

  function addRol() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    const rol = { ...nuevoRol(), nombre };
    setState((s) => ({ ...s, roles: [...s.roles, rol] }));
    setOpenId(rol.id);
    setNuevoNombre("");
  }

  function updateRol(id: string, patch: Partial<Rol>) {
    setState((s) => ({ ...s, roles: s.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  function toggleListField(id: string, field: ListField, value: string) {
    setState((s) => ({
      ...s,
      roles: s.roles.map((r) => {
        if (r.id !== id) return r;
        const has = r[field].includes(value);
        return { ...r, [field]: has ? r[field].filter((x) => x !== value) : [...r[field], value] };
      }),
    }));
  }

  function removeRol(id: string) {
    setState((s) => ({ ...s, roles: s.roles.filter((r) => r.id !== id) }));
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Roles y flujo de trabajo</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        Antes de decidir dónde va cada mueble, hay que entender cómo funciona realmente la empresa por dentro — quién hace qué, a quién
        recibe, y qué necesita a mano. Agregá cada puesto/rol que exista (Promotor, Secretaria, Gerente, Cajero...) y completá su ficha.
        Esto es investigación operativa, no gusto estético.
      </p>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRol()}
          placeholder="Ej: Promotor de ventas, Secretaria, Gerente..."
          className={inputClass}
        />
        <Button type="button" onClick={addRol} className="whitespace-nowrap">
          + Agregar rol
        </Button>
      </div>

      {state.roles.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no agregaste ningún rol. Empezá por el que más interactúa con clientes.</p>
      ) : (
        <div className="space-y-3">
          {state.roles.map((r) => {
            const otrosRoles = state.roles.filter((x) => x.id !== r.id);
            const open = openId === r.id;
            return (
              <div key={r.id} className="rounded-lg border border-neutral-200 bg-neutral-50">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-900"
                >
                  <span>{r.nombre || "(sin nombre)"}</span>
                  <span className={`transition ${open ? "rotate-90" : ""}`}>›</span>
                </button>
                {open && (
                  <div className="space-y-4 border-t border-neutral-200 px-4 py-4">
                    <label className="block">
                      <span className={labelClass}>Nombre del puesto / rol</span>
                      <input
                        type="text"
                        value={r.nombre}
                        onChange={(e) => updateRol(r.id, { nombre: e.target.value })}
                        placeholder="Ej: Promotor de ventas"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Función principal — ¿qué hace exactamente este puesto?</span>
                      <textarea
                        rows={2}
                        value={r.funcion}
                        onChange={(e) => updateRol(r.id, { funcion: e.target.value })}
                        placeholder="Ej: recibe al cliente, explica el proyecto, lo acompaña a la sala de ventas..."
                        className={inputClass}
                      />
                    </label>

                    <div>
                      <span className={labelClass}>¿Recibe clientes o visitas directamente?</span>
                      <ChipSingle
                        options={["Sí, todo el tiempo", "A veces", "No, trabajo interno"]}
                        value={r.recibeClientes}
                        onChange={(v) => updateRol(r.id, { recibeClientes: v })}
                        small
                      />
                    </div>

                    <label className="block">
                      <span className={labelClass}>
                        Recorrido del cliente (si aplica) — ¿por dónde entra, qué le muestra, a dónde lo lleva?
                      </span>
                      <textarea
                        rows={2}
                        value={r.recorrido}
                        onChange={(e) => updateRol(r.id, { recorrido: e.target.value })}
                        placeholder="Ej: entra por recepción, lo hacen esperar en sala de espera, luego pasa a sala de ventas a ver maqueta..."
                        className={inputClass}
                      />
                    </label>

                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">Mobiliario y equipamiento del puesto</h4>
                      <p className="mb-2 text-xs text-neutral-500">
                        Esto define medidas reales — no es decoración, es la base de todo el diseño del puesto.
                      </p>
                    </div>

                    <div>
                      <span className={labelClass}>Mobiliario</span>
                      <ChipMulti options={rolMobiliarioOpciones} values={r.mobiliario} onToggle={(v) => toggleListField(r.id, "mobiliario", v)} small />
                    </div>
                    <div>
                      <span className={labelClass}>Equipo que usa</span>
                      <ChipMulti options={rolEquipoOpciones} values={r.equipo} onToggle={(v) => toggleListField(r.id, "equipo", v)} small />
                    </div>
                    <div>
                      <span className={labelClass}>Instalaciones necesarias en su puesto</span>
                      <ChipMulti
                        options={rolInstalacionesOpciones}
                        values={r.instalaciones}
                        onToggle={(v) => toggleListField(r.id, "instalaciones", v)}
                        small
                      />
                    </div>
                    <div>
                      <span className={labelClass}>Almacenamiento que necesita</span>
                      <ChipMulti
                        options={rolAlmacenamientoOpciones}
                        values={r.almacenamiento}
                        onToggle={(v) => toggleListField(r.id, "almacenamiento", v)}
                        small
                      />
                    </div>

                    <label className="block">
                      <span className={labelClass}>Sistema de organización (siglas, rotulado, código de carpetas)</span>
                      <textarea
                        rows={2}
                        value={r.organizacion}
                        onChange={(e) => updateRol(r.id, { organizacion: e.target.value })}
                        placeholder="Ej: carpetas por lote con sigla del proyecto, archivador alfabético..."
                        className={inputClass}
                      />
                    </label>

                    <div>
                      <span className={labelClass}>Tecnología de seguridad / atención</span>
                      <ChipMulti
                        options={rolTecnologiaOpciones}
                        values={r.tecnologia}
                        onToggle={(v) => toggleListField(r.id, "tecnologia", v)}
                        small
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">Conexión con otras áreas o trabajadores</h4>
                      <p className="mb-2 text-xs text-neutral-500">
                        ¿Este puesto depende de otro, le pasa cosas a otro, o debe estar físicamente cerca de alguien?
                      </p>
                    </div>

                    {otrosRoles.length > 0 ? (
                      <div>
                        <span className={labelClass}>¿Con qué otros roles ya cargados se conecta?</span>
                        <ChipMulti
                          options={otrosRoles.map((o) => o.id)}
                          values={r.conectaCon}
                          onToggle={(v) => toggleListField(r.id, "conectaCon", v)}
                          small
                          labelFor={(id) => otrosRoles.find((o) => o.id === id)?.nombre || "(sin nombre)"}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Agregá más roles para poder vincularlos entre sí.</p>
                    )}

                    <label className="block">
                      <span className={labelClass}>¿Qué se comparte o transfiere en esa conexión?</span>
                      <textarea
                        rows={2}
                        value={r.conexionDetalle}
                        onChange={(e) => updateRol(r.id, { conexionDetalle: e.target.value })}
                        placeholder="Ej: le pasa los contratos firmados a la secretaria, debe estar a la vista de gerencia..."
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Cruces de circulación — ¿cómo evitar que choque con otros puestos?</span>
                      <textarea
                        rows={2}
                        value={r.cruces}
                        onChange={(e) => updateRol(r.id, { cruces: e.target.value })}
                        placeholder="Ej: no debe cruzarse con la fila de caja, necesita entrada independiente..."
                        className={inputClass}
                      />
                    </label>

                    <div>
                      <span className={labelClass}>Confort de su puesto</span>
                      <ChipMulti options={rolConfortOpciones} values={r.confort} onToggle={(v) => toggleListField(r.id, "confort", v)} small />
                    </div>

                    <label className="block">
                      <span className={labelClass}>Notas adicionales</span>
                      <textarea
                        rows={2}
                        value={r.notas}
                        onChange={(e) => updateRol(r.id, { notas: e.target.value })}
                        placeholder="Cualquier detalle puntual de este rol..."
                        className={inputClass}
                      />
                    </label>

                    <button type="button" onClick={() => removeRol(r.id)} className="text-sm font-medium text-danger-600 hover:text-danger-700 hover:underline">
                      Eliminar este rol
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
