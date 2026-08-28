"use client";

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

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Resumen de la entrevista</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Esto es lo que se guardó hasta ahora. Las secciones de estilo, paleta, materiales y detalle por ambiente todavía no están
        portadas a esta versión — cuando lo estén, van a aparecer acá también.
      </p>

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
