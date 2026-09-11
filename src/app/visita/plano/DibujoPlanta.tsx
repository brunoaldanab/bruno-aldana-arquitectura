// src/app/visita/plano/DibujoPlanta.tsx
import { cotasDeAmbiente, geometriaAbertura, poligonoMuro, textoSuperficie, type Cota } from "@/lib/plano/dibujo";
import type { Abertura, Nivel } from "@/lib/plano/modelo";
import type { Cierre } from "@/lib/plano/resolver";
import { contornoInterior, puntoInterior } from "@/lib/plano/superficie";
import type { Seleccion } from "@/lib/plano/toque";
import { distancia, unitario, type Punto } from "@/lib/plano/vector";

/**
 * La planta dibujada con los colores del contenedor (`--plano-tinta`,
 * `--plano-fondo`, `--plano-gris`): la misma pieza sirve para la pantalla
 * grafito y para el papel claro. Los tamaños van multiplicados por k (cm por
 * píxel) para que textos y trazos midan lo mismo con cualquier acercamiento.
 */

export const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace", fontWeight: 500 } as const;
const TINTA = "var(--plano-tinta)";
const FONDO = "var(--plano-fondo)";
const GRIS = "var(--plano-gris)";
const ROJO = "var(--color-danger-600)";

export const puntos = (ps: Punto[]) => ps.map((p) => `${p.x},${p.y}`).join(" ");

function CotaSvg({ cota, ambienteId, k, interactiva }: { cota: Cota; ambienteId: string; k: number; interactiva: boolean }) {
  const { inicio: a, fin: b, normal: n } = cota;
  const color = cota.tomada ? TINTA : GRIS;
  const u = unitario({ x: b.x - a.x, y: b.y - a.y });
  const marca = { x: (u.x + n.x) * 4 * k, y: (u.y + n.y) * 4 * k };
  const t = { x: (a.x + b.x) / 2 + n.x * 11 * k, y: (a.y + b.y) / 2 + n.y * 11 * k };
  let angulo = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  if (angulo > 90) angulo -= 180;
  if (angulo <= -90) angulo += 180;
  const giro = `rotate(${angulo} ${t.x} ${t.y})`;
  return (
    <g data-cota={interactiva ? `${ambienteId}:${cota.indice}` : undefined}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={k} strokeDasharray={cota.tomada ? undefined : `${4 * k} ${3 * k}`} />
      {[a, b].map((p, i) => (
        <line key={i} x1={p.x - marca.x} y1={p.y - marca.y} x2={p.x + marca.x} y2={p.y + marca.y} stroke={color} strokeWidth={1.2 * k} />
      ))}
      <text x={t.x} y={t.y} transform={giro} textAnchor="middle" dominantBaseline="central" fontSize={11 * k} fill={color} style={MONO}>
        {cota.texto}
      </text>
      {interactiva && <rect x={t.x - 28 * k} y={t.y - 15 * k} width={56 * k} height={30 * k} transform={giro} fill="transparent" />}
    </g>
  );
}

function AberturaSvg({ nivel, a, k }: { nivel: Nivel; a: Abertura; k: number }) {
  const g = geometriaAbertura(nivel, a);
  return (
    <g>
      <polygon points={puntos(g.hueco)} fill={FONDO} stroke={FONDO} strokeWidth={1.2 * k} />
      {g.lineas.map(([p, q], i) => (
        <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={TINTA} strokeWidth={1.2 * k} />
      ))}
      {g.hojas.map((h, i) => {
        const r = distancia(h.bisagra, h.extremo);
        return (
          <g key={i}>
            <line x1={h.bisagra.x} y1={h.bisagra.y} x2={h.extremo.x} y2={h.extremo.y} stroke={TINTA} strokeWidth={2.2 * k} strokeLinecap="round" />
            <path
              d={`M ${h.extremo.x} ${h.extremo.y} A ${r} ${r} 0 0 ${h.barrido} ${h.jamba.x} ${h.jamba.y}`}
              fill="none"
              stroke={TINTA}
              strokeWidth={k}
              strokeDasharray={`${4 * k} ${4 * k}`}
            />
          </g>
        );
      })}
      <text x={g.etiqueta.x} y={g.etiqueta.y} textAnchor="middle" dominantBaseline="central" fontSize={10 * k} fill={TINTA} style={MONO}>
        {a.codigo}
      </text>
    </g>
  );
}

function Muros({ nivel, k }: { nivel: Nivel; k: number }) {
  return (
    <>
      {nivel.muros.map((m) => (
        <polygon key={m.id} points={puntos(poligonoMuro(nivel, m.id))} fill={TINTA} stroke={TINTA} strokeWidth={0.6 * k} strokeLinejoin="round" />
      ))}
    </>
  );
}

export function DibujoPlanta({
  nivel,
  escala,
  seleccion,
  cierres,
  trazo,
  mostrarNodos = false,
  impresion = false,
}: {
  nivel: Nivel;
  escala: number;
  seleccion: Seleccion | null;
  cierres: Cierre[];
  trazo: Punto | null;
  mostrarNodos?: boolean;
  impresion?: boolean;
}) {
  const k = 1 / escala;
  const destacado = seleccion?.tipo === "muro" || seleccion?.tipo === "abertura" ? seleccion : null;

  const base = (
    <>
      {nivel.ambientes.map((amb) => {
        const contorno = contornoInterior(nivel, amb.id);
        if (contorno.length < 3) return null;
        const c = puntoInterior(contorno);
        return (
          <g key={amb.id}>
            {!impresion && seleccion?.tipo === "ambiente" && seleccion.id === amb.id && (
              <polygon points={puntos(contorno)} fill={TINTA} fillOpacity={0.06} stroke={TINTA} strokeWidth={1.5 * k} />
            )}
            <text x={c.x} y={c.y - 9 * k} textAnchor="middle" fontSize={9 * k} fill={GRIS} style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {amb.nombre}
            </text>
            <text x={c.x} y={c.y + 12 * k} textAnchor="middle" fontSize={15 * k} fill={TINTA} style={{ ...MONO, fontWeight: 400 }}>
              {textoSuperficie(nivel, amb.id)}
            </text>
          </g>
        );
      })}
      <Muros nivel={nivel} k={k} />
      {nivel.columnas.map((c) => (
        <rect
          key={c.id}
          x={c.x - c.ancho.valor / 2}
          y={c.y - c.profundidad.valor / 2}
          width={c.ancho.valor}
          height={c.profundidad.valor}
          transform={`rotate(${c.rotacion} ${c.x} ${c.y})`}
          fill={TINTA}
          stroke={!impresion && seleccion?.tipo === "columna" && seleccion.id === c.id ? GRIS : "none"}
          strokeWidth={4 * k}
        />
      ))}
      {nivel.aberturas.map((a) => (
        <AberturaSvg key={a.id} nivel={nivel} a={a} k={k} />
      ))}
      {nivel.ambientes.map((amb) =>
        cotasDeAmbiente(nivel, amb.id, 30 * k).map((cota) => (
          <CotaSvg key={`${amb.id}:${cota.indice}`} cota={cota} ambienteId={amb.id} k={k} interactiva={!impresion} />
        )),
      )}
    </>
  );

  return (
    <>
      {destacado ? <g opacity={0.32}>{base}</g> : base}
      {destacado?.tipo === "muro" && nivel.muros.some((m) => m.id === destacado.id) && (
        <polygon
          points={puntos(poligonoMuro(nivel, destacado.id))}
          fill={TINTA}
          stroke={TINTA}
          strokeOpacity={0.35}
          strokeWidth={12 * k}
          strokeLinejoin="round"
        />
      )}
      {destacado?.tipo === "abertura" &&
        nivel.aberturas
          .filter((a) => a.id === destacado.id)
          .map((a) => (
            <g key={a.id}>
              <Muros nivel={{ ...nivel, muros: nivel.muros.filter((m) => m.id === a.muroId) }} k={k} />
              <polygon points={puntos(geometriaAbertura(nivel, a).hueco)} fill="none" stroke={TINTA} strokeOpacity={0.35} strokeWidth={14 * k} />
              <AberturaSvg nivel={nivel} a={a} k={k} />
            </g>
          ))}
      {!impresion &&
        cierres
          .filter((c) => c.estado === "abierto")
          .map((c) => (
            <g key={c.ambienteId}>
              <line x1={c.finRecorrido.x} y1={c.finRecorrido.y} x2={c.esquina.x} y2={c.esquina.y} stroke={ROJO} strokeWidth={3 * k} strokeLinecap="round" />
              <circle cx={c.esquina.x} cy={c.esquina.y} r={16 * k} fill="none" stroke={ROJO} strokeWidth={1.5 * k} strokeDasharray={`${4 * k} ${3 * k}`} />
              <text
                x={c.esquina.x}
                y={c.esquina.y + 32 * k}
                textAnchor="middle"
                fontSize={10 * k}
                fill={ROJO}
                style={{ ...MONO, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {`No cierra · faltan ${String(c.error).replace(".", ",")} cm`}
              </text>
            </g>
          ))}
      {!impresion && mostrarNodos && nivel.nodos.map((n) => <circle key={n.id} cx={n.x} cy={n.y} r={3.5 * k} fill={GRIS} />)}
      {!impresion &&
        seleccion?.tipo === "nodo" &&
        nivel.nodos
          .filter((n) => n.id === seleccion.id)
          .map((n) => <circle key={n.id} cx={n.x} cy={n.y} r={8 * k} fill={FONDO} stroke={TINTA} strokeWidth={2.5 * k} />)}
      {trazo && (
        <g>
          <circle cx={trazo.x} cy={trazo.y} r={12 * k} fill="none" stroke={TINTA} strokeWidth={1.5 * k} />
          <circle cx={trazo.x} cy={trazo.y} r={4 * k} fill={TINTA} />
        </g>
      )}
    </>
  );
}
