// src/app/visita/plano/DibujoTecho.tsx
import { direccionCara, extremosCara } from "@/lib/plano/caras";
import { poligonoMuro } from "@/lib/plano/dibujo";
import type { Nivel, ZonaTecho } from "@/lib/plano/modelo";
import { contornoInterior, puntoInterior } from "@/lib/plano/superficie";
import type { Seleccion } from "@/lib/plano/toque";
import { normalIzquierda, por, resta, suma, unitario, type Punto } from "@/lib/plano/vector";
import { MONO, puntos } from "./DibujoPlanta";

export const NOMBRE_TECHO: Record<ZonaTecho["tipo"], string> = { losa: "Losa", "cielo-falso": "Cielo falso", cajon: "Cajón" };

const TINTA = "var(--plano-tinta)";
const FONDO = "var(--plano-fondo)";
const GRIS = "var(--plano-gris)";

const valor = (m: { valor: number; tomada: boolean }) => `${m.tomada ? "" : "≈ "}${m.valor}`;

/** Un rótulo sobre fondo grafito, para que se lea encima del rayado. */
function Etiqueta({ en, texto, k }: { en: Punto; texto: string; k: number }) {
  const ancho = (texto.length * 6.6 + 14) * k;
  return (
    <g>
      <rect x={en.x - ancho / 2} y={en.y - 10 * k} width={ancho} height={20 * k} rx={5 * k} fill={FONDO} />
      <text x={en.x} y={en.y} textAnchor="middle" dominantBaseline="central" fontSize={9.5 * k} fill={TINTA} style={{ ...MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {texto}
      </text>
    </g>
  );
}

/** La misma planta de fondo; encima, las zonas con su altura, las molduras y las vigas. */
export function DibujoTecho({ nivel, escala, seleccion, trazo }: { nivel: Nivel; escala: number; seleccion: Seleccion | null; trazo: Punto | null }) {
  const k = 1 / escala;
  const elegido = (tipo: Seleccion["tipo"], id: string) => seleccion?.tipo === tipo && seleccion.id === id;
  return (
    <>
      <defs>
        <pattern id="plano-rayado-cielo" width={12 * k} height={12 * k} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={12 * k} stroke={GRIS} strokeWidth={1.5 * k} />
        </pattern>
      </defs>
      <g opacity={0.2}>
        {nivel.muros.map((m) => (
          <polygon key={m.id} points={puntos(poligonoMuro(nivel, m.id))} fill={TINTA} />
        ))}
      </g>
      {nivel.ambientes.map((a) => {
        const contorno = contornoInterior(nivel, a.id);
        if (contorno.length < 3) return null;
        const c = puntoInterior(contorno);
        return (
          <g key={a.id}>
            {elegido("ambiente", a.id) && <polygon points={puntos(contorno)} fill="none" stroke={TINTA} strokeWidth={1.5 * k} />}
            <text x={c.x} y={c.y + 34 * k} textAnchor="middle" fontSize={9 * k} fill={GRIS} style={{ ...MONO, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Altura general
            </text>
            <text x={c.x} y={c.y + 54 * k} textAnchor="middle" fontSize={15 * k} fill={TINTA} style={{ ...MONO, fontWeight: 400 }}>
              {`${valor(nivel.alturaGeneral)} cm`}
            </text>
          </g>
        );
      })}
      {nivel.techos.map((t) => (
        <g key={t.id}>
          <polygon
            points={puntos(t.contorno)}
            fill={t.tipo === "losa" ? "none" : "url(#plano-rayado-cielo)"}
            stroke={TINTA}
            strokeWidth={(elegido("techo", t.id) ? 3 : 1.5) * k}
          />
          <Etiqueta en={puntoInterior(t.contorno)} texto={`${NOMBRE_TECHO[t.tipo]} · ${valor(t.altura)}`} k={k} />
        </g>
      ))}
      {nivel.molduras.map((m) => (
        <g key={m.id} opacity={elegido("moldura", m.id) ? 1 : 0.75}>
          {m.caras.map((c) => {
            const { inicio, fin } = extremosCara(nivel, c);
            const adentro = por(normalIzquierda(direccionCara(nivel, c)), m.ancho.valor);
            return (
              <polygon
                key={`${c.muroId}:${c.cara}`}
                points={puntos([inicio, fin, suma(fin, adentro), suma(inicio, adentro)])}
                fill={TINTA}
                fillOpacity={0.3}
                stroke={elegido("moldura", m.id) ? TINTA : "none"}
                strokeWidth={1.5 * k}
              />
            );
          })}
          {m.caras[0] && (() => {
            const { inicio, fin } = extremosCara(nivel, m.caras[0]);
            const adentro = normalIzquierda(direccionCara(nivel, m.caras[0]));
            const en = suma(por(suma(inicio, fin), 0.5), por(adentro, m.ancho.valor + 18 * k));
            return <Etiqueta en={en} texto={`Moldura ${valor(m.ancho)} × ${valor(m.caida)}`} k={k} />;
          })()}
        </g>
      ))}
      {nivel.vigas.map((v) => {
        const lado = por(normalIzquierda(unitario(resta(v.fin, v.inicio))), v.ancho.valor / 2);
        const medio = por(suma(v.inicio, v.fin), 0.5);
        return (
          <g key={v.id}>
            <polygon
              points={puntos([suma(v.inicio, lado), suma(v.fin, lado), resta(v.fin, lado), resta(v.inicio, lado)])}
              fill="none"
              stroke={TINTA}
              strokeWidth={(elegido("viga", v.id) ? 3 : 1.5) * k}
              strokeDasharray={`${6 * k} ${4 * k}`}
            />
            <Etiqueta en={suma(medio, por(unitario(lado), -(v.ancho.valor / 2 + 16 * k)))} texto={`Viga ${valor(v.ancho)} × ${valor(v.peralte)}`} k={k} />
          </g>
        );
      })}
      {trazo && <circle cx={trazo.x} cy={trazo.y} r={5 * k} fill={TINTA} />}
    </>
  );
}
