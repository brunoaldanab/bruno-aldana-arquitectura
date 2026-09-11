// src/app/visita/plano/HojaAbertura.tsx
import { posicionNodo } from "@/lib/plano/caras";
import { nombresPuntas } from "@/lib/plano/dibujo";
import { borrarElemento, cargarMedidaElemento, editarAbertura, hastaEsquina, type CamposMedida } from "@/lib/plano/elementos";
import type { Abertura, Medida, Nivel, NombreCara, TipoAbertura } from "@/lib/plano/modelo";
import { ambienteDeCara } from "@/lib/plano/toque";
import { CampoMedida } from "./CampoMedida";
import { Accion, Acciones, claseTexto, Dato, Dos, Grupo, Hoja } from "./Hoja";
import { Segmentado } from "./Segmentado";

type Apertura = NonNullable<Abertura["apertura"]>;

export const NOMBRE_ABERTURA: Record<TipoAbertura, string> = { puerta: "Puerta", ventana: "Ventana", vano: "Vano" };

export const NOMBRE_APERTURA: Record<Apertura, string> = {
  batiente: "Batiente",
  corrediza: "Corrediza",
  doble: "Doble",
  pivotante: "Pivotante",
  plegable: "Plegable",
  fija: "Fija",
  proyectante: "Proyectante",
};

const APERTURAS: Record<TipoAbertura, Apertura[]> = {
  puerta: ["batiente", "corrediza", "doble", "pivotante"],
  ventana: ["corrediza", "batiente", "proyectante", "fija"],
  vano: [],
};

const tomada = (m: Medida) => (m.tomada ? m.valor : null);

export function HojaAbertura({
  nivel,
  abertura: a,
  codigosOtros,
  onNivel,
  onBorrada,
  onCerrar,
}: {
  nivel: Nivel;
  abertura: Abertura;
  codigosOtros: string[];
  onNivel: (cambio: (n: Nivel) => Nivel) => void;
  onBorrada: () => void;
  onCerrar: () => void;
}) {
  const medir = (campo: CamposMedida["abertura"]) => (cm: number | null) => {
    if (cm !== null) onNivel((n) => cargarMedidaElemento(n, "abertura", a.id, campo, cm));
  };
  const muro = nivel.muros.find((m) => m.id === a.muroId)!;
  const otra: NombreCara = a.cara === "izquierda" ? "derecha" : "izquierda";
  const nombreLado = (c: NombreCara) => nivel.ambientes.find((x) => x.id === ambienteDeCara(nivel, a.muroId, c))?.nombre ?? "Afuera";
  const puntas = nombresPuntas({ inicio: posicionNodo(nivel, muro.desde), fin: posicionNodo(nivel, muro.hasta) });
  const faltan = [a.ancho, a.alto, a.desde, ...(a.tipo === "ventana" ? [a.antepecho] : [])].filter((m) => !m.tomada).length;
  const hasta = hastaEsquina(nivel, a);

  return (
    <Hoja titulo={`${a.codigo} · ${NOMBRE_ABERTURA[a.tipo]}`} estado={faltan === 0 ? "Completa" : `${faltan} sin medir`} onCerrar={onCerrar}>
      <Grupo etiqueta="Tipo">
        <Segmentado
          etiqueta="Tipo"
          opciones={(["puerta", "ventana", "vano"] as const).map((t) => ({ valor: t, texto: NOMBRE_ABERTURA[t] }))}
          valor={a.tipo}
          onCambio={(tipo) => onNivel((n) => editarAbertura(n, a.id, { tipo }, codigosOtros))}
        />
      </Grupo>
      {APERTURAS[a.tipo].length > 0 && (
        <Grupo etiqueta="Apertura">
          <Segmentado
            etiqueta="Apertura"
            opciones={APERTURAS[a.tipo].map((v) => ({ valor: v, texto: NOMBRE_APERTURA[v] }))}
            valor={a.apertura}
            onCambio={(apertura) => onNivel((n) => editarAbertura(n, a.id, { apertura }))}
          />
        </Grupo>
      )}
      <Dos>
        <CampoMedida id="ab-ancho" etiqueta="Ancho" valor={tomada(a.ancho)} dibujado={a.ancho.valor} onCambio={medir("ancho")} />
        <CampoMedida id="ab-alto" etiqueta="Alto" valor={tomada(a.alto)} dibujado={a.alto.valor} onCambio={medir("alto")} />
      </Dos>
      {a.tipo === "ventana" && (
        <Dos>
          <CampoMedida id="ab-antepecho" etiqueta="Antepecho" valor={tomada(a.antepecho)} dibujado={a.antepecho.valor} onCambio={medir("antepecho")} />
          <span />
        </Dos>
      )}
      <Dos>
        <CampoMedida id="ab-desde" etiqueta="Desde esquina" valor={tomada(a.desde)} dibujado={a.desde.valor} onCambio={medir("desde")} />
        <Dato etiqueta="Hasta esquina">
          {a.desde.tomada && a.ancho.tomada ? "" : "≈ "}
          {String(hasta).replace(".", ",")} cm
        </Dato>
      </Dos>
      {a.tipo === "puerta" && (
        <Dos>
          <Grupo etiqueta="Abre hacia">
            <Segmentado
              etiqueta="Abre hacia"
              opciones={[{ valor: a.cara, texto: nombreLado(a.cara) }, { valor: otra, texto: nombreLado(otra) }]}
              valor={a.abreHacia ?? a.cara}
              onCambio={(abreHacia) => onNivel((n) => editarAbertura(n, a.id, { abreHacia }))}
            />
          </Grupo>
          <Grupo etiqueta="Bisagra">
            <Segmentado
              etiqueta="Bisagra"
              opciones={[{ valor: "inicio", texto: puntas.inicio }, { valor: "fin", texto: puntas.fin }]}
              valor={a.bisagra ?? "inicio"}
              onCambio={(bisagra) => onNivel((n) => editarAbertura(n, a.id, { bisagra }))}
            />
          </Grupo>
        </Dos>
      )}
      <label className="grid gap-1.5">
        <span className="rotulo text-neutral-500">Notas</span>
        <textarea
          key={`${a.id}:${a.notas}`}
          defaultValue={a.notas}
          rows={2}
          onBlur={(e) => {
            if (e.target.value !== a.notas) onNivel((n) => editarAbertura(n, a.id, { notas: e.target.value }));
          }}
          className={claseTexto}
        />
      </label>
      <Acciones>
        <Accion
          peligro
          onClick={() => {
            onNivel((n) => borrarElemento(n, "abertura", a.id));
            onBorrada();
          }}
        >
          Borrar
        </Accion>
      </Acciones>
    </Hoja>
  );
}
