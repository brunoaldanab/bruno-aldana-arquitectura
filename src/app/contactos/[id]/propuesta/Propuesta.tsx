"use client";

import { TEXTOS } from "@/lib/propuesta/textos";
import type { PropuestaData } from "@/lib/propuesta/tipos";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import type { EntrevistaState } from "@/lib/entrevista/types";
import {
  ResumenAcuerdos,
  ResumenAmbientes,
  ResumenGustos,
  ResumenProyecto,
} from "./ResumenReunion";
import "./propuesta.css";

function PieHoja({ n }: { n: string }) {
  return (
    <div className="pie-hoja">
      <span>{TEXTOS.pieDePagina}</span>
      <span>{n}</span>
    </div>
  );
}

/**
 * El encabezado de cada hoja: el logo del estudio a la izquierda y la sección a
 * la derecha. El logo va en todas las hojas y no solo en la portada — sin él las
 * páginas interiores no se leen como parte del mismo documento.
 */
function CabeceraHoja({ seccion }: { seccion: string }) {
  return (
    <div className="cabecera-hoja">
      <div className="marca-hoja">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-hoja" src="/logo-ab.png" alt="" />
        <span className="marca-nombre">
          Bruno Aldana
          <em>Arquitectura</em>
        </span>
      </div>
      <span className="rotulo">{seccion}</span>
    </div>
  );
}

export function Propuesta({
  datos,
  state,
  galeria,
}: {
  datos: PropuestaData;
  state: EntrevistaState;
  galeria: GaleriaData;
}) {
  return (
    <div className="propuesta-raiz">
      <div className="no-imprimir mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <p className="text-sm text-neutral-500">
          Revisá el documento y guardalo como PDF desde el diálogo de impresión.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Guardar como PDF
        </button>
      </div>

      <div className="propuesta">
        {/* ---------- 01 · Portada ---------- */}
        <section className="hoja hoja-portada">
          {datos.portada && (
            // La foto es un data URI en base64: next/image no le aporta nada acá,
            // igual que en DueloStep y GalleryStep.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="portada-foto" src={datos.portada.dataUrl} alt="" />
          )}
          <div className="portada-velo" />
          <div className="portada-contenido">
            <span className="rotulo">Propuesta de diseño</span>
            <h1 className="titulo-portada">{datos.titulo}</h1>
            <div className="datos-portada">
              <div>
                <span className="dato-etiqueta">Cliente</span>
                <span className="dato-valor">{datos.nombreCliente}</span>
              </div>
              <div>
                <span className="dato-etiqueta">Superficie</span>
                <span className="dato-valor">{datos.m2Texto}</span>
              </div>
              <div>
                <span className="dato-etiqueta">Emitida</span>
                <span className="dato-valor">{datos.emisionTexto}</span>
              </div>
              <div>
                <span className="dato-etiqueta">Válida hasta</span>
                <span className="dato-valor">{datos.venceTexto}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Resumen de reunión: la entrevista completa ----------
            Son cuatro hojas y no una: la entrevista entera no entra en una
            página, y partirla en secciones con nombre deja que cada hoja lleve
            su encabezado con el logo en vez de quedar sin identidad. */}
        <section className="hoja">
          <CabeceraHoja seccion="Resumen de reunión · 1 de 4" />
          <h2 className="titulo-seccion">Resumen de reunión</h2>
          <p className="entradilla">
            Esto es lo que hablamos en la visita, tal como quedó registrado. Antes de
            dibujar una sola línea queremos estar de acuerdo en esto.
          </p>
          <ResumenProyecto state={state} galeria={galeria} />
          <PieHoja n="02" />
        </section>

        <section className="hoja">
          <CabeceraHoja seccion="Resumen de reunión · 2 de 4" />
          <h2 className="titulo-seccion">Su gusto</h2>
          <ResumenGustos state={state} galeria={galeria} />
          <PieHoja n="03" />
        </section>

        <section className="hoja">
          <CabeceraHoja seccion="Resumen de reunión · 3 de 4" />
          <h2 className="titulo-seccion">Ambiente por ambiente</h2>
          <ResumenAmbientes state={state} />
          <PieHoja n="04" />
        </section>

        <section className="hoja">
          <CabeceraHoja seccion="Resumen de reunión · 4 de 4" />
          <h2 className="titulo-seccion">Presupuesto, plazos y cierre</h2>
          <ResumenAcuerdos state={state} />
          <PieHoja n="05" />
        </section>

        {/* ---------- 03 · La propuesta ---------- */}
        <section className="hoja">
          <CabeceraHoja seccion="Propuesta · Alcance" />
          <h2 className="titulo-seccion">Propuesta de servicio</h2>
          <p>{TEXTOS.intro}</p>

          <div className="dos-columnas">
            <div>
              <h3>Alcance del diseño</h3>
              <ul>
                {TEXTOS.alcance.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
            <div>
              <h3>Metodología</h3>
              {TEXTOS.metodologia.map((m) => (
                <p key={m.n}>
                  <strong>{m.n} · {m.titulo}</strong>
                  <br />
                  {m.texto}
                </p>
              ))}
            </div>
          </div>

          <h3>Qué recibís</h3>
          <ul>
            {TEXTOS.queRecibis.map((q) => <li key={q}>{q}</li>)}
            <li>Entrega en <strong>{datos.plazoDias} días hábiles</strong>.</li>
          </ul>

          <PieHoja n="06" />
        </section>

        {/* ---------- 04 · Inversión ---------- */}
        <section className="hoja">
          <CabeceraHoja seccion="Inversión" />
          <h2 className="titulo-seccion">Inversión en diseño</h2>

          <table className="tabla-inversion">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="num">Superficie</th>
                <th className="num">Tarifa</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{datos.titulo}</td>
                <td className="num">{datos.m2Texto}</td>
                <td className="num">{datos.tarifaTexto}</td>
                <td className="num total">{datos.precioTexto}</td>
              </tr>
            </tbody>
          </table>

          <div className="franja-pago">
            <h3>Forma de pago</h3>
            <div className="dos-columnas">
              <p><strong>30% · {datos.anticipoTexto}</strong><br />Al inicio</p>
              <p><strong>70% · {datos.saldoTexto}</strong><br />A la entrega del proyecto final</p>
            </div>
          </div>

          <p className="vencimiento">
            Esta propuesta tiene validez hasta el <strong>{datos.venceTexto}</strong>.
          </p>

          <h2 className="titulo-seccion" style={{ marginTop: "8mm" }}>
            Dirección, coordinación y supervisión · 10%
          </h2>
          <p>{TEXTOS.supervisionIntro}</p>

          <div className="dos-columnas">
            <div>
              <h3>Incluye</h3>
              <ul>{TEXTOS.supervisionIncluye.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
            <div>
              <h3>No forma parte de la base del 10%</h3>
              <ul>{TEXTOS.supervisionExcluye.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          </div>

          <p className="ejemplo"><strong>Ejemplo.</strong> {TEXTOS.supervisionEjemplo}</p>

          <h3>Inicio</h3>
          <p>{TEXTOS.inicio}</p>

          <PieHoja n="07" />
        </section>
      </div>
    </div>
  );
}
