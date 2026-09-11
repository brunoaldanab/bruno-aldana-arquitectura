// src/app/visita/plano/PantallaPlano.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { contarPendientes } from "@/lib/plano/controles";
import { agregarNivel, codigosDeOtrosNiveles, reemplazarNivel } from "@/lib/plano/edicion";
import {
  aplicarArrastre,
  aplicarToque,
  iniciarArrastre,
  seleccionVigente,
  type Arrastre,
  type EstadoToque,
  type Herramienta,
  type Modo,
  type Trazo,
} from "@/lib/plano/herramientas";
import { aplicar, crearHistorial, deshacer, puedeDeshacer, puedeRehacer, rehacer, type Historial } from "@/lib/plano/historial";
import { relevamientoVacio, type Nivel, type Relevamiento } from "@/lib/plano/modelo";
import { resolverNivel } from "@/lib/plano/resolver";
import type { Seleccion } from "@/lib/plano/toque";
import type { Punto } from "@/lib/plano/vector";
import type { ContactoLocal } from "@/lib/visita/contactos";
import type { EstadoSync, SincronizadorVisita } from "@/lib/visita/sincronizador";
import { BarraPlano } from "./BarraPlano";
import { DibujoPlanta } from "./DibujoPlanta";
import { DibujoTecho } from "./DibujoTecho";
import { HojaAbertura } from "./HojaAbertura";
import { HojaAmbiente } from "./HojaAmbiente";
import { HojaMuro } from "./HojaMuro";
import { HojaColumna, HojaMoldura, HojaViga, HojaZonaTecho } from "./HojasElementos";
import { Herramientas } from "./Herramientas";
import { LienzoPlano } from "./LienzoPlano";
import { PlanoImpresion } from "./PlanoImpresion";

const GRAFITO = { "--plano-tinta": "#E9E7E4", "--plano-fondo": "#0F1113", "--plano-gris": "#888E92" } as CSSProperties;

/** Fecha local del teléfono, en el formato del archivo (año-mes-día). */
const hoy = () => new Date().toLocaleDateString("sv-SE");

function textoAviso(noCierra: boolean, pendientes: number): { texto: string; error: boolean } {
  if (noCierra) return { texto: "No cierra", error: true };
  if (pendientes === 0) return { texto: "Todo medido", error: false };
  return { texto: pendientes === 1 ? "1 cota sin medir" : `${pendientes} cotas sin medir`, error: false };
}

/**
 * La pantalla del relevamiento. El estado es el historial del motor: cada cambio
 * suma un paso, se guarda en el teléfono al instante y se encola para subir.
 * Mientras se arrastra, el dibujo usa un borrador que se guarda al soltar.
 */
export function PantallaPlano({
  contacto,
  sinc,
  estado,
  recarga,
  onVolver,
}: {
  contacto: ContactoLocal;
  sinc: SincronizadorVisita;
  estado: EstadoSync | null;
  recarga: number;
  onVolver: () => void;
}) {
  const [historial, setHistorial] = useState<Historial<Relevamiento> | null>(null);
  const [nivelId, setNivelId] = useState("nivel-1");
  const [modo, setModo] = useState<Modo>("planta");
  const [herramienta, setHerramienta] = useState<Herramienta>("tocar");
  const [trazo, setTrazo] = useState<Trazo>(null);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [enfocar, setEnfocar] = useState(false);
  const [borrador, setBorrador] = useState<Nivel | null>(null);
  const [imprimir, setImprimir] = useState(false);
  const [centrar, setCentrar] = useState(0);
  const arrastre = useRef<Arrastre | null>(null);

  // Se lee lo del teléfono al abrir y cuando baja una versión más nueva del servidor.
  // Solo depende del id: si cambia el nombre del contacto no hay que perder el historial.
  useEffect(() => {
    let vivo = true;
    void sinc.leerRelevamiento(contacto.id).then((local) => {
      if (!vivo) return;
      const inicial =
        local?.data ??
        relevamientoVacio({ contactoId: contacto.id, nombre: contacto.nombre, direccion: contacto.direccionProyecto ?? "", fechaRelevamiento: hoy() });
      setHistorial(crearHistorial(inicial));
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinc, contacto.id, recarga]);

  const r = historial?.presente ?? null;
  const nivelGuardado = r ? (r.niveles.find((n) => n.id === nivelId) ?? r.niveles[0]) : null;
  const nivel = borrador ?? nivelGuardado;
  const cierres = useMemo(() => (nivel ? resolverNivel(nivel).cierres : []), [nivel]);
  const pendientes = useMemo(() => (nivelGuardado ? contarPendientes(nivelGuardado) : 0), [nivelGuardado]);

  if (!historial || !r || !nivelGuardado || !nivel) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-neutral-950">
        <p className="dato text-neutral-500">Abriendo el plano…</p>
      </div>
    );
  }

  if (imprimir) return <PlanoImpresion relevamiento={r} onVolver={() => setImprimir(false)} />;

  function guardar(h: Historial<Relevamiento>) {
    setHistorial(h);
    void sinc.guardarRelevamiento(contacto.id, h.presente);
  }

  function cambiarRelevamiento(nuevo: Relevamiento) {
    if (nuevo !== historial!.presente) guardar(aplicar(historial!, nuevo));
  }

  function cambiarNivel(cambio: (n: Nivel) => Nivel) {
    const nuevo = cambio(nivelGuardado!);
    if (nuevo !== nivelGuardado) cambiarRelevamiento(reemplazarNivel(r!, nuevo));
  }

  const estadoToque = (): EstadoToque => ({
    nivel: nivelGuardado,
    modo,
    herramienta,
    trazo,
    codigosOtros: codigosDeOtrosNiveles(r, nivelGuardado.id),
  });

  function alTocar(p: Punto, radio: number, cota: string | null) {
    const res = aplicarToque(estadoToque(), p, radio, cota);
    cambiarNivel(() => res.nivel);
    setSeleccion(res.seleccion);
    setTrazo(res.trazo);
    setHerramienta(res.herramienta);
    setEnfocar(cota !== null && res.seleccion?.tipo === "muro");
  }

  function alIniciarArrastre(p: Punto, radio: number) {
    const a = iniciarArrastre(estadoToque(), p, radio);
    arrastre.current = a;
    if (a) setSeleccion({ tipo: a.tipo, id: a.id });
    return a !== null;
  }

  function alSoltar(p: Punto) {
    const a = arrastre.current;
    arrastre.current = null;
    setBorrador(null);
    if (a) cambiarNivel((n) => aplicarArrastre(n, a, p, true));
  }

  const cerrar = () => {
    setSeleccion(null);
    setEnfocar(false);
  };
  const sel = borrador ? null : seleccionVigente(nivelGuardado, seleccion);
  const codigosOtros = codigosDeOtrosNiveles(r, nivelGuardado.id);
  const comun = { nivel: nivelGuardado, onNivel: cambiarNivel, onCerrar: cerrar, onBorrado: cerrar };

  let hoja: ReactNode = null;
  if (sel?.tipo === "muro") {
    hoja = <HojaMuro key={`${sel.id}:${sel.indice}`} {...comun} sel={sel} enfocar={enfocar} onSeleccion={setSeleccion} />;
  } else if (sel?.tipo === "abertura") {
    const a = nivelGuardado.aberturas.find((x) => x.id === sel.id)!;
    hoja = <HojaAbertura key={a.id} {...comun} abertura={a} codigosOtros={codigosOtros} onBorrada={cerrar} />;
  } else if (sel?.tipo === "ambiente") {
    hoja = <HojaAmbiente key={sel.id} {...comun} ambienteId={sel.id} />;
  } else if (sel?.tipo === "columna") {
    hoja = <HojaColumna key={sel.id} {...comun} elemento={nivelGuardado.columnas.find((x) => x.id === sel.id)!} />;
  } else if (sel?.tipo === "techo") {
    hoja = <HojaZonaTecho key={sel.id} {...comun} elemento={nivelGuardado.techos.find((x) => x.id === sel.id)!} />;
  } else if (sel?.tipo === "moldura") {
    hoja = <HojaMoldura key={sel.id} {...comun} elemento={nivelGuardado.molduras.find((x) => x.id === sel.id)!} />;
  } else if (sel?.tipo === "viga") {
    hoja = <HojaViga key={sel.id} {...comun} elemento={nivelGuardado.vigas.find((x) => x.id === sel.id)!} />;
  }

  const limpiar = () => {
    setTrazo(null);
    setSeleccion(null);
    setEnfocar(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950 text-neutral-100" style={GRAFITO}>
      <BarraPlano
        nombre={contacto.nombre}
        estado={estado}
        modo={modo}
        onModo={(m) => {
          setModo(m);
          setHerramienta("tocar");
          limpiar();
        }}
        niveles={r.niveles}
        nivelId={nivelGuardado.id}
        onNivel={(id) => {
          setNivelId(id);
          limpiar();
        }}
        onNuevoNivel={() => {
          const nuevo = agregarNivel(r);
          cambiarRelevamiento(nuevo.relevamiento);
          setNivelId(nuevo.nivelId);
          limpiar();
        }}
        aviso={textoAviso(cierres.some((c) => c.estado === "abierto"), pendientes)}
        onVolver={onVolver}
        onImprimir={() => setImprimir(true)}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <LienzoPlano
          nivel={nivel}
          claveEncuadre={`${nivelGuardado.id}:${centrar}`}
          dibujar={(escala) =>
            modo === "planta" ? (
              <DibujoPlanta nivel={nivel} escala={escala} seleccion={sel} cierres={cierres} trazo={trazo?.punto ?? null} mostrarNodos={herramienta === "muro"} />
            ) : (
              <DibujoTecho nivel={nivel} escala={escala} seleccion={sel} trazo={trazo?.punto ?? null} />
            )
          }
          onToque={alTocar}
          onIniciarArrastre={alIniciarArrastre}
          onArrastrar={(p) => arrastre.current && setBorrador(aplicarArrastre(nivelGuardado, arrastre.current, p, false))}
          onSoltar={alSoltar}
          onCancelarArrastre={() => {
            arrastre.current = null;
            setBorrador(null);
          }}
        />
        <Herramientas
          modo={modo}
          herramienta={herramienta}
          onHerramienta={(h) => {
            setHerramienta(h);
            limpiar();
          }}
          trazoActivo={trazo !== null}
          onTerminar={() => setTrazo(null)}
          puedeDeshacer={puedeDeshacer(historial)}
          puedeRehacer={puedeRehacer(historial)}
          onDeshacer={() => {
            if (puedeDeshacer(historial)) guardar(deshacer(historial));
            setTrazo(null);
          }}
          onRehacer={() => {
            if (puedeRehacer(historial)) guardar(rehacer(historial));
            setTrazo(null);
          }}
          onCentrar={() => setCentrar((c) => c + 1)}
        />
        {hoja && <div className="absolute inset-x-0 bottom-0 z-10">{hoja}</div>}
      </div>
    </div>
  );
}
