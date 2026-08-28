"use client";

import { mobiliarioCardsBase, officePaletteCombos, paletteDefs, styleCards } from "@/lib/entrevista/data";
import { matchRoomProfile } from "@/lib/entrevista/roomProfiles";
import type { EntrevistaState } from "@/lib/entrevista/types";

const sumGrid = "grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2";
const k = "font-mono text-[10px] uppercase tracking-wide text-neutral-400 pt-2";
const v = "pb-1 text-neutral-900";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-dashed border-neutral-200 pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className={sumGrid}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className={k}>{label}</div>
      <div className={v}>{value || "—"}</div>
    </>
  );
}

const TIPO_LABEL: Record<string, string> = {
  vivienda: "Vivienda completa",
  oficina: "Oficina / local comercial",
  "ambiente-unico": "Un solo ambiente",
};

export function ResumenStep({ state }: { state: EntrevistaState; setState: React.Dispatch<React.SetStateAction<EntrevistaState>> }) {
  const esOficina = state.proyecto.tipoProyecto === "oficina";

  const estiloCards = [...styleCards, ...(state.estilosPersonalizados.proyecto || [])];
  const estiloNombres = state.estilo.seleccion.map((k) => estiloCards.find((c) => c.k === k)?.t || k);

  const mobCards = [...mobiliarioCardsBase, ...(state.mobiliarioTiposPersonalizados.proyecto || [])];
  const mobNombres = state.mobiliarioGaleria.seleccion.map((k) => mobCards.find((c) => c.k === k)?.t || k);

  const paletteNombres = esOficina
    ? state.paletaOficina.seleccion.map((k) => [...officePaletteCombos, ...state.paletaOficina.personalizadas].find((p) => p.key === k)?.nombre || k)
    : state.paleta.seleccion.map((k) => paletteDefs.find((p) => p.key === k)?.nombre || k);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Resumen de la entrevista</h2>
      <p className="mb-6 text-sm text-neutral-500">Esto es lo que se guardó hasta ahora en toda la entrevista.</p>

      <div className="space-y-5">
        <Block title="Proyecto">
          <Row label="Tipo de proyecto" value={TIPO_LABEL[state.proyecto.tipoProyecto] || "—"} />
          <Row label="Cliente" value={state.proyecto.cliente} />
          <Row label="Dirección" value={state.proyecto.direccion} />
          <Row label="Fecha de reunión" value={state.proyecto.fecha} />
          <Row label="Superficie" value={state.proyecto.m2} />
          <Row label="Integrantes / usuarios" value={state.proyecto.integrantes} />
          <Row label="Contacto" value={state.proyecto.contacto} />
        </Block>

        <Block title="Ambientes seleccionados">
          <Row label="Ambientes" value={state.ambientesSeleccion.join(", ")} />
        </Block>

        {esOficina && (
          <Block title="Sobre la oficina">
            <Row label="Personas / puestos" value={state.oficina.personas} />
            <Row label="Horario" value={state.oficina.horario} />
            <Row label="Modalidad" value={state.oficina.modalidad} />
            <Row label="Sala de reuniones" value={state.oficina.salaReuniones} />
            <Row label="Visitas" value={state.oficina.visitas} />
            <Row label="Acústica" value={state.oficina.acustica} />
            <Row label="Identidad de marca" value={state.oficina.identidadMarca} />
            <Row label="Tecnología" value={state.oficina.tecnologia} />
            <Row label="Auditoría funcional" value={`${state.oficina.funcional.length} ítems marcados`} />
          </Block>
        )}

        {esOficina && state.roles.length > 0 && (
          <Block title="Roles y flujo de trabajo">
            <Row label="Roles cargados" value={state.roles.map((r) => r.nombre || "(sin nombre)").join(", ")} />
          </Block>
        )}

        <Block title="Estilo y mobiliario elegidos">
          <Row label="Estilos elegidos" value={estiloNombres.join(", ")} />
          <Row label="Tipos de mobiliario elegidos" value={mobNombres.join(", ")} />
        </Block>

        <Block title={esOficina ? "Paleta de color de oficina" : "Paleta de color"}>
          <Row label="Paletas elegidas" value={paletteNombres.join(", ")} />
          <Row label="Tono (frío-cálido)" value={`${state.paleta.calidoFrio}/10`} />
          {!esOficina && <Row label="Colores que evitar" value={state.paleta.evitar.join(", ")} />}
          <Row label="Notas de color" value={state.paleta.notas} />
        </Block>

        <Block title="Materiales">
          <Row label="Materiales elegidos" value={state.materiales.seleccion.join(", ")} />
          <Row label="Notas de materiales" value={state.materiales.notas} />
        </Block>

        {state.ambientesSeleccion.map((room) => {
          const det = state.ambientesDetalle[room];
          if (!det) return null;
          const profile = matchRoomProfile(room);
          return (
            <Block key={room} title={`Detalle — ${room}`}>
              <Row label="Mobiliario" value={det.mobiliario.join(", ")} />
              <Row label="Iluminación" value={det.iluminacion.join(", ")} />
              <Row label="Compran / reutilizan" value={det.comprarNotas} />
              {profile.preguntas.map((q) => (
                <Row key={q.id} label={q.label} value={det.respuestas[q.id] || ""} />
              ))}
              <Row label="Auditoría funcional" value={`${det.funcional.length} ítems marcados`} />
            </Block>
          );
        })}

        <Block title="Mobiliario existente">
          <Row label="Reutilizar" value={state.mobiliario.reutilizar} />
          <Row label="No negociables" value={state.mobiliario.noNegociables} />
          <Row label="Electrodomésticos" value={state.mobiliario.electrodomesticos} />
          <Row label="Arte / objetos" value={state.mobiliario.arte} />
        </Block>

        <Block title="Presupuesto">
          <Row label="Monto" value={state.presupuesto.monto} />
          <Row label="Prioridad" value={state.presupuesto.distribucion} />
          <Row label="Incluye obra" value={state.presupuesto.incluyeObra} />
          <Row label="Flexibilidad" value={state.presupuesto.flexible} />
        </Block>

        <Block title="Plazos">
          <Row label="Fecha objetivo" value={state.plazos.fecha} />
          <Row label="Motivo" value={state.plazos.motivo} />
          <Row label="Etapas" value={state.plazos.etapas} />
        </Block>

        <Block title="Cierre">
          <Row label="A evitar" value={state.cierre.evitar} />
          <Row label="Palabra clave" value={state.cierre.palabra} />
          <Row label="Pendientes" value={state.cierre.pendientes} />
        </Block>
      </div>
    </div>
  );
}
