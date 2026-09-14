// src/app/visita/plano/HojaMuro.tsx
"use client";

import { useState } from "react";
import { ladosDeAmbiente } from "@/lib/plano/ambientes";
import { distanciaEnCara, largoCara } from "@/lib/plano/caras";
import { nombresPuntas } from "@/lib/plano/dibujo";
import { cargarLadoConPunta, proyectarEnEje } from "@/lib/plano/edicion";
import { agregarColumna } from "@/lib/plano/elementos";
import { COLUMNA_POR_DEFECTO } from "@/lib/plano/herramientas";
import type { Nivel } from "@/lib/plano/modelo";
import { borrarMuro, cargarAlturaMuro, cargarEspesor, partirMuro } from "@/lib/plano/operaciones";
import type { Seleccion } from "@/lib/plano/toque";
import { CampoMedida } from "./CampoMedida";
import { Accion, Acciones, Dos, Grupo, Hoja } from "./Hoja";
import { Segmentado } from "./Segmentado";

type SeleccionMuro = Extract<Seleccion, { tipo: "muro" }>;

export function HojaMuro({
  nivel,
  sel,
  enfocar,
  onNivel,
  onSeleccion,
  onEstirar,
  onCerrar,
}: {
  nivel: Nivel;
  sel: SeleccionMuro;
  enfocar: boolean;
  onNivel: (cambio: (n: Nivel) => Nivel) => void;
  onSeleccion: (s: Seleccion | null) => void;
  onEstirar: () => void;
  onCerrar: () => void;
}) {
  const [punta, setPunta] = useState<"inicio" | "fin">("inicio");
  const muro = nivel.muros.find((m) => m.id === sel.id)!;
  const ambiente = nivel.ambientes.find((a) => a.id === sel.ambienteId);
  const lado = ambiente && sel.indice !== null ? ladosDeAmbiente(nivel, ambiente.id)[sel.indice] : undefined;
  const puntas = lado ? nombresPuntas(lado) : null;
  const ref = { muroId: muro.id, cara: sel.cara };

  function partir() {
    const largo = largoCara(nivel, ref);
    const d = Math.min(largo - 1, Math.max(1, Math.round(distanciaEnCara(nivel, ref, sel.punto))));
    onNivel((n) => partirMuro(n, muro.id, sel.cara, d).nivel);
    onSeleccion(null);
  }

  function columna() {
    const r = agregarColumna(nivel, { ...proyectarEnEje(nivel, muro.id, sel.punto), ancho: COLUMNA_POR_DEFECTO, profundidad: COLUMNA_POR_DEFECTO });
    onNivel(() => r.nivel);
    onSeleccion({ tipo: "columna", id: r.id });
  }

  return (
    <Hoja
      titulo={`Muro ${muro.id.slice(1)}${ambiente ? ` · ${ambiente.nombre}` : ""}`}
      estado={lado ? (lado.medida?.tomada ? "Medida tomada" : "Sin medir") : undefined}
      onCerrar={onCerrar}
    >
      {lado && puntas && ambiente && sel.indice !== null ? (
        <>
          <CampoMedida
            id="muro-largo"
            etiqueta="Largo del lado"
            valor={lado.medida?.tomada ? lado.medida.valor : null}
            dibujado={Math.round(lado.largo)}
            autoFocus={enfocar}
            onCambio={(cm) => onNivel((n) => cargarLadoConPunta(n, ambiente.id, sel.indice!, cm, punta))}
          />
          <Grupo etiqueta="Punta que queda fija">
            <Segmentado
              etiqueta="Punta que queda fija"
              opciones={[{ valor: "inicio", texto: puntas.inicio }, { valor: "fin", texto: puntas.fin }]}
              valor={punta}
              onCambio={setPunta}
            />
          </Grupo>
        </>
      ) : (
        <p className="text-sm text-neutral-500">Este muro no cierra ningún ambiente: su largo se mide cuando lo cierre.</p>
      )}
      <Dos>
        <CampoMedida
          id="muro-espesor"
          etiqueta="Espesor"
          valor={muro.espesor.tomada ? muro.espesor.valor : null}
          dibujado={muro.espesor.valor}
          onCambio={(cm) => cm !== null && cm > 0 && onNivel((n) => cargarEspesor(n, muro.id, cm))}
        />
        <CampoMedida
          id="muro-altura"
          etiqueta="Altura"
          valor={muro.altura?.valor ?? null}
          dibujado={nivel.alturaGeneral.valor}
          onCambio={(cm) => onNivel((n) => cargarAlturaMuro(n, muro.id, cm))}
        />
      </Dos>
      <Acciones>
        <Accion onClick={partir}>Partir aquí</Accion>
        <Accion onClick={onEstirar}>Estirar hasta otro muro</Accion>
        <Accion onClick={columna}>Agregar columna</Accion>
        <Accion
          peligro
          onClick={() => {
            onNivel((n) => borrarMuro(n, muro.id));
            onSeleccion(null);
          }}
        >
          Borrar
        </Accion>
      </Acciones>
    </Hoja>
  );
}
