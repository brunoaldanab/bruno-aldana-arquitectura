// src/app/visita/plano/LienzoPlano.tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Nivel } from "@/lib/plano/modelo";
import { distancia, type Punto } from "@/lib/plano/vector";
import { cajaDeNivel, desplazar, encuadrar, pantallaAPlano, pellizcar, type Vista } from "@/lib/plano/vista";

/** El tamaño del dedo, en píxeles: se pasa a centímetros con la escala del momento. */
const RADIO_PX = 22;
/** Hasta acá un dedo que se mueve sigue siendo un toque. */
const UMBRAL_PX = 6;

type Gesto =
  | { tipo: "nada" }
  | { tipo: "uno"; inicio: Punto; ultimo: Punto; movido: boolean; arrastrando: boolean; cota: string | null }
  | { tipo: "dos" };

/**
 * El lienzo SVG en centímetros. Un dedo toca, arrastra nodos y aberturas o
 * desplaza el plano; dos dedos pellizcan. No anima nada: cada gesto dibuja la
 * vista nueva de una.
 */
export function LienzoPlano({
  nivel,
  claveEncuadre,
  dibujar,
  onToque,
  onIniciarArrastre,
  onArrastrar,
  onSoltar,
  onCancelarArrastre,
}: {
  nivel: Nivel;
  claveEncuadre: string;
  dibujar: (escala: number) => ReactNode;
  onToque: (p: Punto, radio: number, cota: string | null) => void;
  onIniciarArrastre: (p: Punto, radio: number) => boolean;
  onArrastrar: (p: Punto) => void;
  onSoltar: (p: Punto) => void;
  onCancelarArrastre: () => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const punteros = useRef(new Map<number, Punto>());
  const gesto = useRef<Gesto>({ tipo: "nada" });
  const [tamano, setTamano] = useState<{ w: number; h: number } | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const [claveVista, setClaveVista] = useState<string | null>(null);
  const [tamanoVista, setTamanoVista] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => setTamano({ w: e.contentRect.width, h: e.contentRect.height }));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Se encuadra al abrir, al cambiar de nivel y al pedir "centrar"; si cambia el tamaño, se conserva el centro.
  if (tamano && (claveVista !== claveEncuadre || !vista)) {
    setClaveVista(claveEncuadre);
    setTamanoVista(tamano);
    setVista(encuadrar(cajaDeNivel(nivel), tamano.w, tamano.h));
  } else if (tamano && vista && tamanoVista && (tamano.w !== tamanoVista.w || tamano.h !== tamanoVista.h)) {
    setTamanoVista(tamano);
    setVista(desplazar(vista, (tamano.w - tamanoVista.w) / 2, (tamano.h - tamanoVista.h) / 2));
  }

  const local = (e: React.PointerEvent): Punto => {
    const r = caja.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function abajo(e: React.PointerEvent<SVGSVGElement>) {
    if (!vista) return;
    const cota = (e.target as Element).closest?.("[data-cota]")?.getAttribute("data-cota") ?? null;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    punteros.current.set(e.pointerId, p);
    if (punteros.current.size === 1) {
      gesto.current = { tipo: "uno", inicio: p, ultimo: p, movido: false, arrastrando: false, cota };
    } else {
      if (gesto.current.tipo === "uno" && gesto.current.arrastrando) onCancelarArrastre();
      gesto.current = { tipo: "dos" };
    }
  }

  function mover(e: React.PointerEvent<SVGSVGElement>) {
    if (!vista || !punteros.current.has(e.pointerId)) return;
    const p = local(e);
    const antes = [...punteros.current.values()];
    const previo = punteros.current.get(e.pointerId)!;
    punteros.current.set(e.pointerId, p);
    const g = gesto.current;
    if (g.tipo === "dos") {
      if (punteros.current.size === 2) {
        const despues = [...punteros.current.values()];
        setVista((v) => v && pellizcar(v, [antes[0], antes[1]], [despues[0], despues[1]]));
      }
      return;
    }
    if (g.tipo !== "uno") return;
    g.ultimo = p;
    if (!g.movido && distancia(p, g.inicio) < UMBRAL_PX) return;
    if (!g.movido) {
      g.movido = true;
      g.arrastrando = onIniciarArrastre(pantallaAPlano(vista, g.inicio), RADIO_PX / vista.escala);
    }
    if (g.arrastrando) onArrastrar(pantallaAPlano(vista, p));
    else setVista((v) => v && desplazar(v, p.x - previo.x, p.y - previo.y));
  }

  function arriba(e: React.PointerEvent<SVGSVGElement>) {
    if (!punteros.current.has(e.pointerId)) return;
    punteros.current.delete(e.pointerId);
    const g = gesto.current;
    if (g.tipo === "uno" && vista) {
      if (g.arrastrando) onSoltar(pantallaAPlano(vista, g.ultimo));
      else if (!g.movido) onToque(pantallaAPlano(vista, g.inicio), RADIO_PX / vista.escala, g.cota);
    }
    if (punteros.current.size === 0) gesto.current = { tipo: "nada" };
  }

  function cancelar(e: React.PointerEvent<SVGSVGElement>) {
    punteros.current.delete(e.pointerId);
    if (gesto.current.tipo === "uno" && gesto.current.arrastrando) onCancelarArrastre();
    if (punteros.current.size === 0) gesto.current = { tipo: "nada" };
  }

  return (
    <div ref={caja} className="relative min-h-0 flex-1 overflow-hidden">
      {vista && (
        <svg
          aria-label="Plano del relevamiento"
          className="absolute inset-0 h-full w-full select-none"
          style={{ touchAction: "none", WebkitTouchCallout: "none" }}
          onPointerDown={abajo}
          onPointerMove={mover}
          onPointerUp={arriba}
          onPointerCancel={cancelar}
        >
          <g transform={`translate(${vista.x} ${vista.y}) scale(${vista.escala})`}>{dibujar(vista.escala)}</g>
        </svg>
      )}
    </div>
  );
}
