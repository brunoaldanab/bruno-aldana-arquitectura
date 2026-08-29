"use client";

import {
  mobiliarioCardsBase,
  officePaletteCombos,
  paletteDefs,
  styleCards,
} from "@/lib/entrevista/data";
import { matchRoomProfile } from "@/lib/entrevista/roomProfiles";
import { campeonGuardado } from "@/lib/entrevista/duelo";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import type { EntrevistaState } from "@/lib/entrevista/types";

/**
 * El resumen de la reunión dentro de la propuesta.
 *
 * Es la entrevista entera pasada a texto. Va antes del precio a propósito:
 * cuando el cliente llega al número, ya leyó varias páginas de evidencia de que
 * lo escuchamos, y el precio deja de ser un costo para pasar a ser el precio de
 * eso. Es lo único de este documento que ningún competidor puede copiar, porque
 * para tenerlo hay que haber hecho la entrevista.
 *
 * El mapeo de campos es el mismo que el del paso de Resumen de la ficha
 * (`steps/ResumenStep.tsx`): si allá se agrega una pregunta, acá también.
 */

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bloque">
      <h3>{titulo}</h3>
      <div className="grilla-resumen">{children}</div>
    </div>
  );
}

/** Una fila del resumen. Se omite sola cuando el cliente no contestó eso. */
function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  if (!valor || !valor.trim()) return null;
  return (
    <>
      <div className="fila-k">{etiqueta}</div>
      <div className="fila-v">{valor}</div>
    </>
  );
}

const TIPO_LABEL: Record<string, string> = {
  vivienda: "Vivienda completa",
  oficina: "Oficina / local comercial",
  "ambiente-unico": "Un solo ambiente",
  construccion: "Diseño y construcción",
};

export function useResumenReunion(state: EntrevistaState, galeria: GaleriaData) {
  const esOficina = state.proyecto.tipoProyecto === "oficina";

  const estiloCards = [
    ...styleCards.map((c) => ({ k: c.k, t: c.t })),
    ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo })),
  ];
  const estiloNombres = state.estilo.seleccion.map(
    (k) => estiloCards.find((c) => c.k === k)?.t || k
  );

  const mobCards = [
    ...mobiliarioCardsBase.map((c) => ({ k: c.k, t: c.t })),
    ...galeria.mobiliarioCustom.map((c) => ({ k: c.key, t: c.titulo })),
  ];
  const mobNombres = state.mobiliarioGaleria.seleccion.map(
    (k) => mobCards.find((c) => c.k === k)?.t || k
  );

  const officePalettes = [
    ...officePaletteCombos.map((p) => ({ key: p.key, nombre: p.nombre })),
    ...galeria.paletaOficinaCustom.map((p) => ({ key: p.key, nombre: p.nombre })),
  ];
  const paletteNombres = esOficina
    ? state.paletaOficina.seleccion.map(
        (k) => officePalettes.find((p) => p.key === k)?.nombre || k
      )
    : state.paleta.seleccion.map((k) => paletteDefs.find((p) => p.key === k)?.nombre || k);

  const favorita = campeonGuardado(state.duelo, galeria.estiloFotos);

  return { esOficina, estiloNombres, mobNombres, paletteNombres, favorita };
}

/** Hoja 1 del resumen: de qué proyecto se trata y quiénes lo usan. */
export function ResumenProyecto({
  state,
  galeria,
}: {
  state: EntrevistaState;
  galeria: GaleriaData;
}) {
  const { esOficina } = useResumenReunion(state, galeria);

  return (
    <>
      <Bloque titulo="El proyecto">
        <Fila etiqueta="Tipo de proyecto" valor={TIPO_LABEL[state.proyecto.tipoProyecto] || ""} />
        <Fila etiqueta="Tipo de vivienda / local" valor={state.proyecto.tipo} />
        <Fila etiqueta="Dirección" valor={state.proyecto.direccion} />
        <Fila etiqueta="Fecha de la reunión" valor={state.proyecto.fecha} />
        <Fila etiqueta="Superficie" valor={state.proyecto.m2} />
        <Fila etiqueta="Integrantes / usuarios" valor={state.proyecto.integrantes} />
      </Bloque>

      {state.ambientesSeleccion.length > 0 && (
        <Bloque titulo="Ambientes a intervenir">
          <Fila etiqueta="Ambientes" valor={state.ambientesSeleccion.join(" · ")} />
        </Bloque>
      )}

      {esOficina && (
        <Bloque titulo="Cómo se trabaja acá">
          <Fila etiqueta="Personas / puestos" valor={state.oficina.personas} />
          <Fila etiqueta="Horario" valor={state.oficina.horario} />
          <Fila etiqueta="Modalidad" valor={state.oficina.modalidad} />
          <Fila etiqueta="Sala de reuniones" valor={state.oficina.salaReuniones} />
          <Fila etiqueta="Visitas" valor={state.oficina.visitas} />
          <Fila etiqueta="Acústica" valor={state.oficina.acustica} />
          <Fila etiqueta="Identidad de marca" valor={state.oficina.identidadMarca} />
          <Fila etiqueta="Tecnología" valor={state.oficina.tecnologia} />
          <Fila
            etiqueta="Auditoría funcional"
            valor={state.oficina.funcional.length ? state.oficina.funcional.join(" · ") : ""}
          />
        </Bloque>
      )}

      {esOficina &&
        state.roles.map((rol, i) => (
          <Bloque key={rol.id} titulo={`Rol — ${rol.nombre || `sin nombre ${i + 1}`}`}>
            <Fila etiqueta="Función" valor={rol.funcion} />
            <Fila etiqueta="Recibe clientes" valor={rol.recibeClientes} />
            <Fila etiqueta="Recorrido" valor={rol.recorrido} />
            <Fila etiqueta="Mobiliario" valor={rol.mobiliario.join(" · ")} />
            <Fila etiqueta="Equipo" valor={rol.equipo.join(" · ")} />
            <Fila etiqueta="Instalaciones" valor={rol.instalaciones.join(" · ")} />
            <Fila etiqueta="Almacenamiento" valor={rol.almacenamiento.join(" · ")} />
            <Fila etiqueta="Organización" valor={rol.organizacion} />
            <Fila etiqueta="Tecnología" valor={rol.tecnologia.join(" · ")} />
            <Fila etiqueta="Se conecta con" valor={rol.conectaCon.join(" · ")} />
            <Fila etiqueta="Detalle de la conexión" valor={rol.conexionDetalle} />
            <Fila etiqueta="Cruces a evitar" valor={rol.cruces} />
            <Fila etiqueta="Confort" valor={rol.confort.join(" · ")} />
            <Fila etiqueta="Notas" valor={rol.notas} />
          </Bloque>
        ))}
    </>
  );
}

/** Hoja 2 del resumen: el gusto del cliente. */
export function ResumenGustos({
  state,
  galeria,
}: {
  state: EntrevistaState;
  galeria: GaleriaData;
}) {
  const { esOficina, estiloNombres, mobNombres, paletteNombres, favorita } = useResumenReunion(
    state,
    galeria
  );

  const colores = state.paleta.seleccion.flatMap((clave) => {
    const def = paletteDefs.find((p) => p.key === clave);
    return def ? def.colores : [];
  });

  return (
    <>
      {(state.cierre.palabra || state.cierre.evitar) && (
        <Bloque titulo="En sus palabras">
          <Fila etiqueta="Busca un espacio" valor={state.cierre.palabra} />
          <Fila etiqueta="Quiere evitar" valor={state.cierre.evitar} />
        </Bloque>
      )}

      <Bloque titulo="Estilo">
        <Fila etiqueta="Estilos elegidos" valor={estiloNombres.join(" · ")} />
        {favorita && <Fila etiqueta="Su favorita absoluta" valor={favorita.styleName} />}
        <Fila etiqueta="Atemporalidad" valor={`${state.estilo.atemporalidad}/10`} />
        <Fila etiqueta="Densidad" valor={state.estilo.densidad} />
        <Fila etiqueta="Referencias" valor={state.estilo.refs} />
      </Bloque>

      {mobNombres.length > 0 && (
        <Bloque titulo="Tipo de mobiliario">
          <Fila etiqueta="Elegidos" valor={mobNombres.join(" · ")} />
        </Bloque>
      )}

      <Bloque titulo={esOficina ? "Paleta de color de oficina" : "Paleta de color"}>
        <Fila etiqueta="Paletas elegidas" valor={paletteNombres.join(" · ")} />
        {!esOficina && <Fila etiqueta="Tono frío – cálido" valor={`${state.paleta.calidoFrio}/10`} />}
        {!esOficina && <Fila etiqueta="Colores base" valor={state.paleta.base.join(" · ")} />}
        {!esOficina && <Fila etiqueta="Colores a evitar" valor={state.paleta.evitar.join(" · ")} />}
        <Fila etiqueta="Notas de color" valor={state.paleta.notas} />
      </Bloque>

      {colores.length > 0 && (
        <div className="paleta">
          {colores.map((c) => (
            <div key={c.h + c.n} className="color">
              <div className="color-muestra" style={{ background: c.h }} />
              <span className="color-nombre">{c.n}</span>
            </div>
          ))}
        </div>
      )}

      <Bloque titulo="Materiales">
        <Fila etiqueta="Materiales elegidos" valor={state.materiales.seleccion.join(" · ")} />
        <Fila etiqueta="Notas de materiales" valor={state.materiales.notas} />
      </Bloque>
    </>
  );
}

/** Hoja 3 del resumen: ambiente por ambiente. */
export function ResumenAmbientes({ state }: { state: EntrevistaState }) {
  return (
    <>
      {state.ambientesSeleccion.map((ambiente) => {
        const det = state.ambientesDetalle[ambiente];
        if (!det) return null;
        const perfil = matchRoomProfile(ambiente);
        return (
          <Bloque key={ambiente} titulo={ambiente}>
            <Fila etiqueta="Mobiliario" valor={det.mobiliario.join(" · ")} />
            <Fila etiqueta="Iluminación" valor={det.iluminacion.join(" · ")} />
            <Fila etiqueta="Compran / reutilizan" valor={det.comprarNotas} />
            {perfil.preguntas.map((q) => (
              <Fila key={q.id} etiqueta={q.label} valor={det.respuestas[q.id] || ""} />
            ))}
            <Fila
              etiqueta="Auditoría funcional"
              valor={det.funcional.length ? det.funcional.join(" · ") : ""}
            />
          </Bloque>
        );
      })}

      <Bloque titulo="Mobiliario que ya está">
        <Fila etiqueta="Se reutiliza" valor={state.mobiliario.reutilizar} />
        <Fila etiqueta="No negociables" valor={state.mobiliario.noNegociables} />
        <Fila etiqueta="Electrodomésticos" valor={state.mobiliario.electrodomesticos} />
        <Fila etiqueta="Arte y objetos" valor={state.mobiliario.arte} />
      </Bloque>
    </>
  );
}

/** Hoja 4 del resumen: lo acordado sobre plata, tiempos y pendientes. */
export function ResumenAcuerdos({ state }: { state: EntrevistaState }) {
  return (
    <>
      <Bloque titulo="Marco económico">
        <Fila etiqueta="Presupuesto previsto" valor={state.presupuesto.monto} />
        <Fila etiqueta="Dónde poner la plata" valor={state.presupuesto.distribucion} />
        <Fila etiqueta="Incluye obra" valor={state.presupuesto.incluyeObra} />
        <Fila etiqueta="Flexibilidad" valor={state.presupuesto.flexible} />
      </Bloque>

      <Bloque titulo="Plazos">
        <Fila etiqueta="Fecha objetivo" valor={state.plazos.fecha} />
        <Fila etiqueta="Motivo de la fecha" valor={state.plazos.motivo} />
        <Fila etiqueta="Etapas" valor={state.plazos.etapas} />
      </Bloque>

      <Bloque titulo="Cierre">
        <Fila etiqueta="A evitar" valor={state.cierre.evitar} />
        <Fila etiqueta="Palabra clave" valor={state.cierre.palabra} />
        <Fila etiqueta="Pendientes" valor={state.cierre.pendientes} />
      </Bloque>
    </>
  );
}
