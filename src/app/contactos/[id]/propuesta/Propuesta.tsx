"use client";

import { TEXTOS } from "@/lib/propuesta/textos";
import type { PropuestaData } from "@/lib/propuesta/tipos";
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
 * El encabezado lleva solo la sección. La marca va una vez por hoja, en el pie:
 * en el PDF anterior aparecía tres veces en la misma página.
 */
function CabeceraHoja({ seccion }: { seccion: string }) {
  return (
    <div className="cabecera-hoja">
      <span className="rotulo">{seccion}</span>
    </div>
  );
}

export function Propuesta({ datos }: { datos: PropuestaData }) {
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

        {/* ---------- 02 · Lo que nos dijiste ---------- */}
        <section className="hoja">
          <CabeceraHoja seccion="Lo que nos dijiste" />
          <h2 className="titulo-seccion">Lo que nos dijiste</h2>

          {datos.palabra && (
            <p className="cita">«Buscás un espacio {datos.palabra}.»</p>
          )}

          {datos.evitar && (
            <>
              <h3>Lo que querés evitar</h3>
              <p>{datos.evitar}</p>
            </>
          )}

          {datos.estilos.length > 0 && (
            <>
              <h3>Tu estilo</h3>
              <div className="etiquetas">
                {datos.estilos.map((e) => (
                  <span key={e} className="etiqueta">{e}</span>
                ))}
              </div>
            </>
          )}

          {datos.paleta.length > 0 && (
            <>
              <h3>Tu paleta</h3>
              <div className="paleta">
                {datos.paleta.map((c) => (
                  <div key={c.hex} className="color">
                    <div className="color-muestra" style={{ background: c.hex }} />
                    <span className="color-nombre">{c.nombre}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {datos.materiales.length > 0 && (
            <>
              <h3>Materiales que te gustaron</h3>
              <div className="etiquetas">
                {datos.materiales.map((m) => (
                  <span key={m} className="etiqueta">{m}</span>
                ))}
              </div>
            </>
          )}

          {datos.ambientes.length > 0 && (
            <>
              <h3>Ambientes a intervenir</h3>
              <div className="etiquetas">
                {datos.ambientes.map((a) => (
                  <span key={a} className="etiqueta">{a}</span>
                ))}
              </div>
            </>
          )}

          <PieHoja n="02" />
        </section>
      </div>
    </div>
  );
}
