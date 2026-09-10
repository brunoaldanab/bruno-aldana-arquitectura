// src/app/contactos/[id]/relevamiento/PlanoSvg.tsx
import type { Ambiente } from "@/lib/relevamiento/formato";
import { errorDeCierre, recorridoAPoligono, type Punto } from "@/lib/relevamiento/geometria";
import { TOLERANCIA_CM } from "@/lib/relevamiento/controles";

const sobre = (a: Punto, b: Punto, t: number): Punto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function PlanoSvg({ ambiente, impresion = false }: { ambiente: Ambiente; impresion?: boolean }) {
  const { vertices, completo } = recorridoAPoligono(ambiente.paredes);
  if (vertices.length < 2) {
    return <p className="py-16 text-center text-sm text-neutral-500">Cargá la primera medida y el plano aparece acá.</p>;
  }

  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const ancho = Math.max(...xs) - Math.min(...xs);
  const alto = Math.max(...ys) - Math.min(...ys);
  const lado = Math.max(ancho, alto, 100);
  const margen = lado * 0.18;
  const texto = lado / 22;
  const trazo = lado / 120;
  const viewBox = `${Math.min(...xs) - margen} ${Math.min(...ys) - margen} ${ancho + margen * 2} ${alto + margen * 2}`;
  const cierre = completo ? errorDeCierre(ambiente.paredes) : null;
  const tinta = impresion ? "#0F1113" : "currentColor";

  const tramos = vertices.slice(0, -1).map((a, i) => {
    const b = vertices[i + 1];
    const largo = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const afuera = { x: (b.y - a.y) / largo, y: -(b.x - a.x) / largo };
    const medio = sobre(a, b, 0.5);
    return { a, b, largo, pared: ambiente.paredes[i], cota: { x: medio.x + afuera.x * texto * 1.4, y: medio.y + afuera.y * texto * 1.4 } };
  });

  return (
    <svg viewBox={viewBox} className={impresion ? "h-auto w-full" : "h-auto w-full text-neutral-100"} role="img" aria-label={`Plano de ${ambiente.nombre}`}>
      <polyline points={vertices.map((v) => `${v.x},${v.y}`).join(" ")} fill="none" stroke={tinta} strokeWidth={trazo * 4} strokeLinejoin="miter" />

      {ambiente.elementos
        .filter((e) => (e.tipo === "puerta" || e.tipo === "ventana") && e.desde != null && e.hasta != null)
        .map((e) => {
          const t = tramos.find((x) => x.pared?.id === e.pared);
          if (!t) return null;
          const p0 = sobre(t.a, t.b, (e.desde as number) / t.largo);
          const p1 = sobre(t.a, t.b, Math.min(e.hasta as number, t.largo) / t.largo);
          const medio = sobre(p0, p1, 0.5);
          return (
            <g key={e.id}>
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={impresion ? "#FFFFFF" : "#0F1113"} strokeWidth={trazo * 5} />
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={tinta} strokeWidth={trazo} strokeDasharray={e.tipo === "ventana" ? `${trazo * 3} ${trazo * 2}` : undefined} />
              <text x={medio.x} y={medio.y - texto * 0.6} fontSize={texto * 0.8} textAnchor="middle" fill={tinta} fontFamily="var(--font-jetbrains), monospace">{e.codigo}</text>
            </g>
          );
        })}

      {tramos.map((t, i) => (
        <text key={i} x={t.cota.x} y={t.cota.y} fontSize={texto} textAnchor="middle" dominantBaseline="middle" fill={tinta} fontFamily="var(--font-jetbrains), monospace">
          {t.pared?.largo}
        </text>
      ))}

      {cierre !== null && cierre > TOLERANCIA_CM && (
        <g>
          <line x1={vertices[vertices.length - 1].x} y1={vertices[vertices.length - 1].y} x2={vertices[0].x} y2={vertices[0].y} stroke="var(--color-danger-600)" strokeWidth={trazo * 2} strokeDasharray={`${trazo * 4} ${trazo * 3}`} />
          <text x={vertices[0].x} y={vertices[0].y - texto} fontSize={texto * 0.9} fill="var(--color-danger-600)">no cierra: {cierre} cm</text>
        </g>
      )}
    </svg>
  );
}
