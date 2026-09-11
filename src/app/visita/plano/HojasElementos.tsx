// src/app/visita/plano/HojasElementos.tsx
import { editarZonaTecho } from "@/lib/plano/edicion";
import { borrarElemento, cargarMedidaElemento, type CamposMedida, type TipoElemento } from "@/lib/plano/elementos";
import type { Columna, Medida, Moldura, Nivel, Viga, ZonaTecho } from "@/lib/plano/modelo";
import { CampoMedida } from "./CampoMedida";
import { NOMBRE_TECHO } from "./DibujoTecho";
import { Accion, Acciones, claseTexto, Dos, Grupo, Hoja } from "./Hoja";
import { Segmentado } from "./Segmentado";

/** Las hojas chicas: columna, zona de techo, moldura y viga. Solo medidas y borrar. */

type Props<T> = {
  nivel: Nivel;
  elemento: T;
  onNivel: (cambio: (n: Nivel) => Nivel) => void;
  onBorrado: () => void;
  onCerrar: () => void;
};

const tomada = (m: Medida) => (m.tomada ? m.valor : null);
const faltan = (ms: (Medida | null)[]) => {
  const n = ms.filter((m) => m && !m.tomada).length;
  return n === 0 ? "Completa" : `${n} sin medir`;
};

function usarMedidor<T extends TipoElemento>(tipo: T, id: string, onNivel: Props<unknown>["onNivel"]) {
  return (campo: CamposMedida[T], permitirVacio = false) =>
    (cm: number | null) => {
      if (cm !== null || permitirVacio) onNivel((n) => cargarMedidaElemento(n, tipo, id, campo, cm));
    };
}

function Borrar<T extends TipoElemento>({ tipo, id, onNivel, onBorrado }: { tipo: T; id: string } & Pick<Props<unknown>, "onNivel" | "onBorrado">) {
  return (
    <Acciones>
      <Accion
        peligro
        onClick={() => {
          onNivel((n) => borrarElemento(n, tipo, id));
          onBorrado();
        }}
      >
        Borrar
      </Accion>
    </Acciones>
  );
}

export function HojaColumna({ nivel, elemento: c, onNivel, onBorrado, onCerrar }: Props<Columna>) {
  const medir = usarMedidor("columna", c.id, onNivel);
  return (
    <Hoja titulo={`Columna ${c.id.slice(1)}`} estado={faltan([c.ancho, c.profundidad, c.altura])} onCerrar={onCerrar}>
      <Dos>
        <CampoMedida id="col-ancho" etiqueta="Ancho" valor={tomada(c.ancho)} dibujado={c.ancho.valor} onCambio={medir("ancho")} />
        <CampoMedida id="col-prof" etiqueta="Profundidad" valor={tomada(c.profundidad)} dibujado={c.profundidad.valor} onCambio={medir("profundidad")} />
      </Dos>
      <Dos>
        <CampoMedida id="col-altura" etiqueta="Altura" valor={c.altura?.valor ?? null} dibujado={nivel.alturaGeneral.valor} onCambio={medir("altura", true)} />
        <label className="grid min-w-0 gap-1.5">
          <span className="rotulo text-neutral-500">Rotación · grados</span>
          <input
            key={`${c.id}:${c.rotacion}`}
            defaultValue={c.rotacion}
            inputMode="decimal"
            autoComplete="off"
            onBlur={(e) => {
              const grados = Number(e.target.value.replace(",", "."));
              if (Number.isFinite(grados) && grados !== c.rotacion)
                onNivel((n) => ({ ...n, columnas: n.columnas.map((x) => (x.id === c.id ? { ...x, rotacion: grados } : x)) }));
            }}
            className={`${claseTexto} font-mono tabular-nums`}
          />
        </label>
      </Dos>
      <Borrar tipo="columna" id={c.id} onNivel={onNivel} onBorrado={onBorrado} />
    </Hoja>
  );
}

export function HojaZonaTecho({ elemento: t, onNivel, onBorrado, onCerrar }: Props<ZonaTecho>) {
  const medir = usarMedidor("techo", t.id, onNivel);
  return (
    <Hoja titulo={`Techo · ${NOMBRE_TECHO[t.tipo]}`} estado={faltan([t.altura])} onCerrar={onCerrar}>
      <Grupo etiqueta="Tipo">
        <Segmentado
          etiqueta="Tipo de techo"
          opciones={(["losa", "cielo-falso", "cajon"] as const).map((v) => ({ valor: v, texto: NOMBRE_TECHO[v] }))}
          valor={t.tipo}
          onCambio={(tipo) => onNivel((n) => editarZonaTecho(n, t.id, tipo))}
        />
      </Grupo>
      <Dos>
        <CampoMedida id="techo-altura" etiqueta="Altura" valor={tomada(t.altura)} dibujado={t.altura.valor} onCambio={medir("altura")} />
        <span />
      </Dos>
      <Borrar tipo="techo" id={t.id} onNivel={onNivel} onBorrado={onBorrado} />
    </Hoja>
  );
}

export function HojaMoldura({ elemento: m, onNivel, onBorrado, onCerrar }: Props<Moldura>) {
  const medir = usarMedidor("moldura", m.id, onNivel);
  return (
    <Hoja titulo="Moldura" estado={faltan([m.ancho, m.caida])} onCerrar={onCerrar}>
      <Dos>
        <CampoMedida id="mol-ancho" etiqueta="Ancho" valor={tomada(m.ancho)} dibujado={m.ancho.valor} onCambio={medir("ancho")} />
        <CampoMedida id="mol-caida" etiqueta="Caída" valor={tomada(m.caida)} dibujado={m.caida.valor} onCambio={medir("caida")} />
      </Dos>
      <Borrar tipo="moldura" id={m.id} onNivel={onNivel} onBorrado={onBorrado} />
    </Hoja>
  );
}

export function HojaViga({ elemento: v, onNivel, onBorrado, onCerrar }: Props<Viga>) {
  const medir = usarMedidor("viga", v.id, onNivel);
  return (
    <Hoja titulo={`Viga ${v.id.slice(1)}`} estado={faltan([v.ancho, v.peralte])} onCerrar={onCerrar}>
      <Dos>
        <CampoMedida id="viga-ancho" etiqueta="Ancho" valor={tomada(v.ancho)} dibujado={v.ancho.valor} onCambio={medir("ancho")} />
        <CampoMedida id="viga-peralte" etiqueta="Peralte" valor={tomada(v.peralte)} dibujado={v.peralte.valor} onCambio={medir("peralte")} />
      </Dos>
      <Borrar tipo="viga" id={v.id} onNivel={onNivel} onBorrado={onBorrado} />
    </Hoja>
  );
}
