// src/app/visita/plano/HojaElectrico.tsx
"use client";

import { largoCara } from "@/lib/plano/caras";
import { editarPuntoElectrico, FAMILIAS, tipoDe, TIPOS } from "@/lib/plano/electricos";
import { borrarElemento, cargarMedidaElemento } from "@/lib/plano/elementos";
import type { Nivel, PuntoElectrico, TipoPunto } from "@/lib/plano/modelo";
import { CampoMedida } from "./CampoMedida";
import { Accion, Acciones, claseTexto, Dato, Dos, Grupo, Hoja } from "./Hoja";

/**
 * El enchufe, la llave de luz o la salida tocada. Lo que Bruno mide en el lugar
 * son dos números —a qué distancia de la esquina y a qué altura del piso—; el
 * tipo ya trae la altura que manda la norma, así que casi siempre alcanza con
 * confirmarla.
 */
export function HojaElectrico({
  nivel,
  punto: e,
  codigosOtros,
  onNivel,
  onBorrado,
  onCerrar,
}: {
  nivel: Nivel;
  punto: PuntoElectrico;
  codigosOtros: string[];
  onNivel: (cambio: (n: Nivel) => Nivel) => void;
  onBorrado: () => void;
  onCerrar: () => void;
}) {
  const tipo = tipoDe(e.tipo);
  const largo = Math.round(largoCara(nivel, { muroId: e.muroId, cara: e.cara }));
  const faltan = [e.desde, e.altura].filter((m) => !m.tomada).length;

  const medir = (campo: "desde" | "altura") => (cm: number | null) => {
    if (cm !== null) onNivel((n) => cargarMedidaElemento(n, "electrico", e.id, campo, cm));
  };

  return (
    <Hoja titulo={`${e.codigo} · ${tipo.nombre}`} estado={faltan === 0 ? "Completo" : `${faltan} sin medir`} onCerrar={onCerrar}>
      <Grupo etiqueta="Qué es">
        <select
          aria-label="Tipo de punto eléctrico"
          value={e.tipo}
          onChange={(ev) => onNivel((n) => editarPuntoElectrico(n, e.id, { tipo: ev.target.value as TipoPunto }, codigosOtros))}
          className={claseTexto}
        >
          {FAMILIAS.map((f) => (
            <optgroup key={f.clave} label={f.nombre}>
              {TIPOS.filter((t) => t.familia === f.clave).map((t) => (
                <option key={t.clave} value={t.clave}>{t.nombre}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Grupo>
      <Dos>
        <CampoMedida
          id="elec-desde"
          etiqueta="Desde la esquina"
          valor={e.desde.tomada ? e.desde.valor : null}
          dibujado={e.desde.valor}
          onCambio={medir("desde")}
        />
        <CampoMedida
          id="elec-altura"
          etiqueta="Altura desde el piso"
          valor={e.altura.tomada ? e.altura.valor : null}
          dibujado={e.altura.valor}
          onCambio={medir("altura")}
        />
      </Dos>
      <Dato etiqueta="Hasta la otra esquina">{`${Math.max(0, largo - e.desde.valor)} cm`}</Dato>
      <Grupo etiqueta="Nota">
        <input
          key={e.id}
          defaultValue={e.notas}
          autoComplete="off"
          placeholder="Queda detrás del ropero, hay que moverlo"
          onBlur={(ev) => {
            if (ev.target.value !== e.notas) onNivel((n) => editarPuntoElectrico(n, e.id, { notas: ev.target.value }));
          }}
          className={claseTexto}
        />
      </Grupo>
      <Acciones>
        <Accion
          peligro
          onClick={() => {
            onNivel((n) => borrarElemento(n, "electrico", e.id));
            onBorrado();
          }}
        >
          Borrar
        </Accion>
      </Acciones>
    </Hoja>
  );
}
