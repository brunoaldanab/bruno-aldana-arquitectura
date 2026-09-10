"use client";

import { Button } from "@/components/ui/Button";
import { formatearBs } from "@/lib/propuesta/calculo";
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

/**
 * Arma el nombre del archivo: "Propuesta - Nombre del cliente - 29-08-2026".
 *
 * Los caracteres que Windows y macOS no aceptan en un nombre de archivo se
 * sacan acá; si quedaran, el navegador descarta el nombre entero y vuelve al
 * suyo. Los acentos sí se conservan: son válidos y el documento está en español.
 */
function nombreDelArchivo(cliente: string, emision: string) {
  const limpio = (s: string) =>
    s
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  return `Propuesta - ${limpio(cliente)} - ${limpio(emision).replace(/\//g, "-")}`;
}

/**
 * La firma, en blanco sobre la banda de grafito.
 *
 * Va en todas las hojas: sin ella las páginas interiores no se leen como parte
 * del mismo documento que la portada.
 *
 * Es el vector de la firma con el texto ya convertido a curvas, no el logo más
 * el nombre tipeado que había antes. El manual lo pide explícitamente, y en un
 * documento que se imprime y se manda por correo la razón es práctica: un
 * nombre tipeado depende de que la fuente esté instalada en la máquina que lo
 * abra, y el vector no depende de nada.
 */
function Marca() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="marca-firma"
      src="/firma-horizontal-blanco.svg"
      alt="Bruno Aldana · Arquitectura"
    />
  );
}

/**
 * Una hoja interior.
 *
 * El tercio superior es una banda oscura con la misma foto de la portada, el
 * mismo grado y el título en tinta clara: es literalmente un pedazo de la
 * portada repetido en cada página. Como la foto cambia según el cliente, lo que
 * unifica el documento no es una imagen fija sino el tratamiento, y cada
 * propuesta termina teniendo su propio color sin dejar de ser el mismo formato.
 *
 * Debajo de la banda el papel es el claro de la marca, que es donde se lee
 * cómodo. El contraste entre las dos zonas ordena la página: arriba de qué se
 * trata, abajo el contenido.
 */
function Hoja({
  seccion,
  titulo,
  entradilla,
  foto,
  n,
  children,
}: {
  seccion: string;
  titulo: string;
  entradilla?: string;
  foto: string | null;
  n: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hoja">
      <header className="banda">
        {foto && (
          // La foto es un data URI en base64: next/image no le aporta nada acá,
          // igual que en DueloStep y GalleryStep.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="banda-foto" src={foto} alt="" />
        )}
        <div className="banda-velo" />
        <div className="banda-contenido">
          <div className="banda-cabecera">
            <Marca />
            <span className="rotulo rotulo-claro">{seccion}</span>
          </div>
          <h2 className="banda-titulo">{titulo}</h2>
        </div>
      </header>

      <div className="cuerpo">
        {entradilla && <p className="entradilla">{entradilla}</p>}
        {children}
      </div>

      <div className="pie-hoja">
        <span>{TEXTOS.pieDePagina}</span>
        <span>{n}</span>
      </div>
    </section>
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
  const foto = datos.portada?.dataUrl ?? null;
  const nombreArchivo = nombreDelArchivo(datos.nombreCliente, datos.emisionTexto);

  /**
   * Guardar el PDF con un nombre que sirva.
   *
   * El navegador propone como nombre de archivo el título de la pestaña, así que
   * se lo cambiamos justo antes de abrir el diálogo y lo devolvemos después. Sin
   * esto el cliente recibe un archivo llamado "Bruno Aldana · Arquitectura.pdf",
   * o directamente el nombre de la ruta, y en su carpeta de descargas no hay
   * forma de distinguir una propuesta de otra.
   */
  function descargar() {
    const titulo = document.title;
    document.title = nombreArchivo;
    window.print();
    document.title = titulo;
  }

  return (
    <div className="propuesta-raiz">
      <div className="no-imprimir mx-auto flex max-w-3xl flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-2">
        <div>
          <span className="rotulo block text-neutral-500">Entregable · 7 hojas A4</span>
          <p className="mt-2 text-sm text-neutral-400">
            Se guarda como{" "}
            <span className="dato text-neutral-200">{nombreArchivo}.pdf</span>
          </p>
        </div>
        <Button onClick={descargar}>Descargar PDF</Button>
      </div>

      <div className="propuesta">
        {/* ---------- Portada ---------- */}
        <section className="hoja hoja-portada">
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="portada-foto" src={foto} alt="" />
          )}
          <div className="portada-velo" />
          <div className="portada-contenido">
            <div className="portada-cabecera">
              <Marca />
              <span className="rotulo rotulo-claro">Propuesta de diseño</span>
            </div>

            <div>
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
          </div>
        </section>

        {/* ---------- Resumen de reunión: la entrevista completa ----------
            Cuatro hojas y no una: la entrevista entera no entra en una página, y
            partirla en secciones con nombre deja que cada hoja lleve su banda. */}
        <Hoja
          seccion="Resumen de reunión · 1 de 4"
          titulo="Resumen de reunión"
          entradilla="Esto es lo que hablamos en la visita, tal como quedó registrado. Antes de dibujar una sola línea queremos estar de acuerdo en esto."
          foto={foto}
          n="02"
        >
          <ResumenProyecto state={state} galeria={galeria} />
        </Hoja>

        <Hoja seccion="Resumen de reunión · 2 de 4" titulo="Su gusto" foto={foto} n="03">
          <ResumenGustos state={state} galeria={galeria} />
        </Hoja>

        <Hoja
          seccion="Resumen de reunión · 3 de 4"
          titulo="Ambiente por ambiente"
          foto={foto}
          n="04"
        >
          <ResumenAmbientes state={state} />
        </Hoja>

        <Hoja
          seccion="Resumen de reunión · 4 de 4"
          titulo="Presupuesto, plazos y cierre"
          foto={foto}
          n="05"
        >
          <ResumenAcuerdos state={state} />
        </Hoja>

        {/* ---------- La propuesta ---------- */}
        <Hoja
          seccion="Propuesta · Alcance"
          titulo="Propuesta de servicio"
          entradilla={TEXTOS.intro}
          foto={foto}
          n="06"
        >
          <div className="dos-columnas">
            <div>
              <h3>Alcance del diseño</h3>
              <ul>
                {TEXTOS.alcance.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Metodología</h3>
              {TEXTOS.metodologia.map((m) => (
                <p key={m.n} className="paso">
                  <strong>
                    {m.n} · {m.titulo}
                  </strong>
                  <br />
                  {m.texto}
                </p>
              ))}
            </div>
          </div>

          <div className="destacado">
            <h3>Qué recibís</h3>
            <ul>
              {TEXTOS.queRecibis.map((q) => (
                <li key={q}>{q}</li>
              ))}
              <li>
                Entrega en <strong>{datos.plazoDias} días hábiles</strong>.
              </li>
            </ul>
          </div>
        </Hoja>

        {/* ---------- Inversión ---------- */}
        <Hoja seccion="Inversión" titulo="Inversión en diseño" foto={foto} n="07">
          {/* Con el desglose cargado se cobra ambiente por ambiente, que es más
              justo: los grandes pagan por superficie y los chicos el mínimo.
              Mostrarlo abierto también le explica al cliente de dónde sale cada
              boliviano, en vez de darle un número y punto. */}
          <table className="tabla-inversion">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="num">Superficie</th>
                <th className="num">Tarifa</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {datos.lineas ? (
                datos.lineas.map((l) => (
                  <tr key={l.ambiente}>
                    <td>{l.ambiente}</td>
                    <td className="num">{String(l.m2).replace(".", ",")} m²</td>
                    <td className="num">{datos.tarifaTexto}</td>
                    <td className="num">{formatearBs(l.cobra)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{datos.titulo}</td>
                  <td className="num">{datos.m2Texto}</td>
                  <td className="num">{datos.tarifaTexto}</td>
                  <td className="num">{datos.precioTexto}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>Total del diseño</td>
                <td className="num">{datos.m2Texto}</td>
                <td className="num" />
                <td className="num total">{datos.precioTexto}</td>
              </tr>
            </tfoot>
          </table>

          <div className="franja-pago">
            <h3>Forma de pago</h3>
            <div className="dos-columnas">
              <p>
                <strong>30% · {datos.anticipoTexto}</strong>
                <br />
                Al inicio
              </p>
              <p>
                <strong>70% · {datos.saldoTexto}</strong>
                <br />
                A la entrega del proyecto final
              </p>
            </div>
          </div>

          <p className="vencimiento">
            Esta propuesta tiene validez hasta el <strong>{datos.venceTexto}</strong>.
          </p>

          <h3 className="titulo-bloque">Dirección, coordinación y supervisión · 10%</h3>
          <p>{TEXTOS.supervisionIntro}</p>

          <div className="dos-columnas">
            <div>
              <h3>Incluye</h3>
              <ul>
                {TEXTOS.supervisionIncluye.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>No forma parte de la base del 10%</h3>
              <ul>
                {TEXTOS.supervisionExcluye.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="ejemplo">
            <strong>Ejemplo.</strong> {TEXTOS.supervisionEjemplo}
          </p>

          <div className="destacado">
            <h3>Cómo arrancamos</h3>
            <p>{TEXTOS.inicio}</p>
          </div>
        </Hoja>
      </div>
    </div>
  );
}
