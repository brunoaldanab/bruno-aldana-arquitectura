// src/lib/relevamiento/voz.ts

export type ResultadoVoz =
  | { tipo: "medida"; cm: number }
  | { tipo: "ambiguo"; opciones: number[] }
  | { tipo: "invalido" };

const VALORES: Record<string, number> = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

const SEPARADORES = new Set(["con", "coma", "punto", "metro", "metros"]);
const SUFIJO_CM = new Set(["cm", "centimetro", "centimetros"]);
const SUFIJO_MM = new Set(["mm", "milimetro", "milimetros"]);

const medida = (cm: number): ResultadoVoz => ({ tipo: "medida", cm });
const INVALIDO: ResultadoVoz = { tipo: "invalido" };

function normalizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9,. ]/g, " ")
    .replace(/(\d)\s*m\b/g, "$1 metros")
    .split(/\s+/)
    .map((t) => t.replace(/^[.,]+|[.,]+$/g, ""))
    .filter(Boolean);
}

const esDigito = (t: string) => t in VALORES && VALORES[t] <= 9;

/** Palabras en español a número entero: "mil ochocientos veinte" → 1820. */
function palabrasANumero(tokens: string[]): number | null {
  const utiles = tokens.filter((t) => t !== "y");
  if (utiles.length === 0) return null;
  let total = 0;
  let actual = 0;
  for (const t of utiles) {
    if (t === "mil") {
      total += (actual || 1) * 1000;
      actual = 0;
    } else if (t in VALORES) {
      actual += VALORES[t];
    } else {
      return null;
    }
  }
  return total + actual;
}

/** "cero cinco" → 5 leído como cifras; "cincuenta y seis" → 56 leído como número. */
function numeroOCifras(tokens: string[]): { valor: number; cifras: number } | null {
  if (tokens.length >= 2 && tokens.every(esDigito)) {
    return { valor: Number(tokens.map((t) => VALORES[t]).join("")), cifras: tokens.length };
  }
  const n = palabrasANumero(tokens);
  return n === null ? null : { valor: n, cifras: n >= 10 ? 2 : 1 };
}

function entero(n: number): ResultadoVoz {
  return n < 10 ? { tipo: "ambiguo", opciones: [n * 100, n] } : medida(n);
}

export function parsearMedida(texto: string): ResultadoVoz {
  let tokens = normalizar(texto);
  if (tokens.length === 0) return INVALIDO;

  // El láser en modo teclado escribe cifras con unidad: "4.050 m", "4050 mm".
  const ultimo = tokens[tokens.length - 1];
  if (tokens.length === 2 && /^\d+([.,]\d+)?$/.test(tokens[0])) {
    if (SUFIJO_MM.has(ultimo)) return medida(Math.round(Number(tokens[0].replace(",", ".")) / 10));
    if (ultimo === "metros") {
      const metros = Number(tokens[0].replace(",", "."));
      return Number.isFinite(metros) ? medida(Math.round(metros * 100)) : INVALIDO;
    }
  }

  const enCm = SUFIJO_CM.has(ultimo);
  if (enCm) tokens = tokens.slice(0, -1);

  // Cifras escritas: "405", "4,05", "15 cm"
  if (tokens.length === 1 && /^\d+([.,]\d+)?$/.test(tokens[0])) {
    const [ent, dec] = tokens[0].split(/[.,]/);
    if (enCm) return medida(Number(ent));
    if (dec === undefined) return entero(Number(ent));
    const cmDec = dec.length === 1 ? Number(dec) * 10 : Math.round(Number(`0.${dec}`) * 100);
    return medida(Number(ent) * 100 + cmDec);
  }

  if (enCm) {
    const n = palabrasANumero(tokens);
    return n === null ? INVALIDO : medida(n);
  }

  // Metros y centímetros separados: "cuatro con cincuenta", "cuatro metros"
  const sep = tokens.findIndex((t) => SEPARADORES.has(t));
  if (sep > 0) {
    const m = palabrasANumero(tokens.slice(0, sep));
    if (m === null) return INVALIDO;
    const resto = tokens.slice(sep + 1);
    if (resto.length === 0) return medida(m * 100);
    const dec = numeroOCifras(resto);
    if (dec === null || dec.valor > 99) return INVALIDO;
    if (dec.cifras === 1) return { tipo: "ambiguo", opciones: [m * 100 + dec.valor, m * 100 + dec.valor * 10] };
    return medida(m * 100 + dec.valor);
  }

  // Cifras sueltas: "cuatro cero cinco"
  if (tokens.length >= 2 && tokens.every(esDigito)) {
    return medida(Number(tokens.map((t) => VALORES[t]).join("")));
  }

  // Metros y centímetros sin separador: "dos sesenta y tres"
  if (tokens.length >= 2 && esDigito(tokens[0]) && VALORES[tokens[0]] > 0) {
    const cmResto = palabrasANumero(tokens.slice(1));
    if (cmResto !== null && cmResto >= 10 && cmResto <= 99) return medida(VALORES[tokens[0]] * 100 + cmResto);
  }

  const n = palabrasANumero(tokens);
  return n === null ? INVALIDO : entero(n);
}
