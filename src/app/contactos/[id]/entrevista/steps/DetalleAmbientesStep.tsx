"use client";

import { useState } from "react";
import { matchRoomProfile } from "@/lib/entrevista/roomProfiles";
import type { AmbienteDetalle, EntrevistaState } from "@/lib/entrevista/types";
import { ChipMulti } from "@/components/entrevista/ChipMulti";
import { inputClass } from "@/components/ui/field";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

function emptyDetalle(): AmbienteDetalle {
  return { mobiliario: [], iluminacion: [], comprarNotas: "", respuestas: {}, funcional: [] };
}

export function DetalleAmbientesStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const rooms = state.ambientesSeleccion;
  const esUnico = state.proyecto.tipoProyecto === "ambiente-unico";
  const [openRoom, setOpenRoom] = useState<string | null>(rooms[0] ?? null);

  function updateRoom(room: string, patch: Partial<AmbienteDetalle>) {
    setState((s) => {
      const current = s.ambientesDetalle[room] || emptyDetalle();
      return { ...s, ambientesDetalle: { ...s.ambientesDetalle, [room]: { ...current, ...patch } } };
    });
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">{esUnico ? "Preguntas clave del ambiente" : "Funcionalidad por ambiente"}</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        Cada ambiente tiene su propio set de preguntas — mobiliario, iluminación, y auditoría ergonómica/técnica específica de ese
        espacio en particular.
      </p>

      {rooms.length === 0 ? (
        <p className="text-sm text-neutral-500">Volvé al paso anterior y seleccioná al menos un ambiente.</p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const profile = matchRoomProfile(room);
            const det = state.ambientesDetalle[room] || emptyDetalle();
            const open = openRoom === room;
            return (
              <div key={room} className="rounded-lg border border-white/10 bg-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setOpenRoom(open ? null : room)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-100"
                >
                  <span>{room}</span>
                  <span className={`transition ${open ? "rotate-90" : ""}`}>›</span>
                </button>
                {open && (
                  <div className="space-y-4 border-t border-white/10 px-4 py-4">
                    <div className="space-y-1">
                      {profile.tips.map((t) => (
                        <p key={t} className="rounded-md bg-white/[0.09] p-2 text-xs text-neutral-400">
                          {t}
                        </p>
                      ))}
                    </div>

                    <div>
                      <span className={labelClass}>Mobiliario necesario</span>
                      <ChipMulti
                        options={profile.mobiliario}
                        values={det.mobiliario}
                        onToggle={(v) => {
                          const has = det.mobiliario.includes(v);
                          updateRoom(room, { mobiliario: has ? det.mobiliario.filter((x) => x !== v) : [...det.mobiliario, v] });
                        }}
                        small
                      />
                    </div>

                    <div>
                      <span className={labelClass}>Iluminación</span>
                      <ChipMulti
                        options={profile.iluminacion}
                        values={det.iluminacion}
                        onToggle={(v) => {
                          const has = det.iluminacion.includes(v);
                          updateRoom(room, { iluminacion: has ? det.iluminacion.filter((x) => x !== v) : [...det.iluminacion, v] });
                        }}
                        small
                      />
                    </div>

                    <label className="block">
                      <span className={labelClass}>¿Qué compran nuevo y qué reutilizan en este ambiente?</span>
                      <textarea
                        rows={2}
                        value={det.comprarNotas}
                        onChange={(e) => updateRoom(room, { comprarNotas: e.target.value })}
                        placeholder="Ej: quieren comprar sofá nuevo pero mantener la mesa de centro..."
                        className={inputClass}
                      />
                    </label>

                    <p className="rounded-md bg-white/[0.09] p-2 text-xs text-neutral-400">
                      Colorimetría: revisá con la paleta elegida en el paso &quot;Paleta de color&quot; — acá solo anotá si este ambiente
                      puntual necesita un tratamiento de color distinto al resto.
                    </p>

                    {profile.preguntas.map((q) => (
                      <label key={q.id} className="block">
                        <span className={labelClass}>{q.label}</span>
                        <textarea
                          rows={2}
                          value={det.respuestas[q.id] || ""}
                          onChange={(e) => updateRoom(room, { respuestas: { ...det.respuestas, [q.id]: e.target.value } })}
                          placeholder={q.placeholder}
                          className={inputClass}
                        />
                      </label>
                    ))}

                    <div>
                      <h4 className="text-sm font-medium text-neutral-100">Auditoría funcional y ergonómica</h4>
                      <p className="mb-2 text-xs text-neutral-500">Puntos técnicos que definen si el ambiente funciona bien, más allá del gusto.</p>
                      <div className="space-y-3">
                        {profile.funcional.map((g) => (
                          <div key={g.categoria}>
                            <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">{g.categoria}</p>
                            <ChipMulti
                              options={g.items}
                              values={det.funcional}
                              onToggle={(v) => {
                                const has = det.funcional.includes(v);
                                updateRoom(room, { funcional: has ? det.funcional.filter((x) => x !== v) : [...det.funcional, v] });
                              }}
                              small
                            />
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">{det.funcional.length} ítems marcados como relevantes para este ambiente</p>
                    </div>
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
