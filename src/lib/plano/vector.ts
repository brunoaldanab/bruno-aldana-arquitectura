// src/lib/plano/vector.ts
/**
 * Operaciones con puntos del plano. Las coordenadas son de pantalla, como en
 * SVG: x hacia la derecha e y hacia abajo. Por eso "izquierda" y "derecha" se
 * miran tal como se ven en la pantalla, no como en la geometría de libro.
 */
export type Punto = { x: number; y: number };

export const suma = (a: Punto, b: Punto): Punto => ({ x: a.x + b.x, y: a.y + b.y });
export const resta = (a: Punto, b: Punto): Punto => ({ x: a.x - b.x, y: a.y - b.y });
export const por = (a: Punto, k: number): Punto => ({ x: a.x * k, y: a.y * k });
export const productoEscalar = (a: Punto, b: Punto): number => a.x * b.x + a.y * b.y;
export const productoCruz = (a: Punto, b: Punto): number => a.x * b.y - a.y * b.x;
export const largo = (a: Punto): number => Math.hypot(a.x, a.y);
export const distancia = (a: Punto, b: Punto): number => largo(resta(a, b));

export function unitario(a: Punto): Punto {
  const l = largo(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l + 0, y: a.y / l + 0 };
}

// El "+ 0" evita los -0, que en las comparaciones de las pruebas no son 0.
export const normalIzquierda = (u: Punto): Punto => ({ x: u.y + 0, y: -u.x + 0 });
export const normalDerecha = (u: Punto): Punto => ({ x: -u.y + 0, y: u.x + 0 });

/** Punto donde se cortan dos rectas (punto y dirección). Null si son paralelas. */
export function interseccion(p1: Punto, d1: Punto, p2: Punto, d2: Punto): Punto | null {
  const c = productoCruz(d1, d2);
  // Por debajo de medio grado se tratan como paralelas: el corte quedaría lejísimos.
  if (Math.abs(c) < Math.sin((0.5 * Math.PI) / 180) * largo(d1) * largo(d2)) return null;
  const t = productoCruz(resta(p2, p1), d2) / c;
  return suma(p1, por(d1, t));
}

export const redondear = (n: number, decimales = 1): number => {
  const f = 10 ** decimales;
  return Math.round(n * f) / f + 0;
};

export const redondearPunto = (p: Punto): Punto => ({ x: redondear(p.x), y: redondear(p.y) });

/**
 * Área con signo (fórmula del cordón). Con y hacia abajo, un recorrido que en
 * pantalla va en sentido antihorario —el que deja el interior a la izquierda—
 * da un área negativa.
 */
export function areaConSigno(puntos: Punto[]): number {
  let s = 0;
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i];
    const b = puntos[(i + 1) % puntos.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}
