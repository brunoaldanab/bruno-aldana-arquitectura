// pyrevit/pruebas/generar.mts
/**
 * Arma los relevamientos de referencia con el mismo motor de la app y los
 * escribe como archivos "ba-relevamiento" v2 en pyrevit/pruebas/fixtures/.
 * Las pruebas de Python leen esos archivos, así que si el formato del motor
 * cambia y nadie regenera, las pruebas del botón lo acusan.
 *
 *   npx tsx pyrevit/pruebas/generar.mts
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { aJson } from "../../src/lib/plano/archivo";
import {
  agregarAbertura,
  agregarBandeja,
  agregarColumna,
  agregarMoldura,
  agregarViga,
  agregarZonaTecho,
  cargarMedidaElemento,
  editarAbertura,
} from "../../src/lib/plano/elementos";
import { agregarPuntoElectrico } from "../../src/lib/plano/electricos";
import { medida, type Nivel, type NombreCara, type Relevamiento } from "../../src/lib/plano/modelo";
import { casaDeEjemplo, cuartoDeBruno } from "../../src/lib/plano/prueba-casos";

const salida = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

/** La cara del muro que mira hacia adentro del ambiente. */
const caraInterior = (n: Nivel, ambienteId: string, muroId: string): NombreCara =>
  n.ambientes.find((a) => a.id === ambienteId)!.contorno.find((c) => c.muroId === muroId)!.cara;

function relevamiento(nivel: Nivel, proyecto: Relevamiento["proyecto"]): Relevamiento {
  return { formato: "ba-relevamiento", version: 2, unidades: "cm", proyecto, niveles: [nivel] };
}

/** El cuarto de Bruno, la prueba maestra: medido, con puerta, ventana, cielo falso y enchufes. */
function cuarto(): Relevamiento {
  let n = cuartoDeBruno({ medido: true });
  const amb = n.ambientes[0].id;
  const cara = (muroId: string) => caraInterior(n, amb, muroId);

  // Puerta batiente de 80 × 210 en el muro de arriba, a 30 cm de la esquina.
  const puerta = agregarAbertura(n, { tipo: "puerta", muroId: "m1", cara: cara("m1"), desde: 30, ancho: 80, alto: 210 });
  n = puerta.nivel;
  n = editarAbertura(n, puerta.id, { apertura: "batiente", abreHacia: cara("m1"), bisagra: "inicio" });
  for (const [campo, valor] of [["desde", 30], ["ancho", 80], ["alto", 210]] as const)
    n = cargarMedidaElemento(n, "abertura", puerta.id, campo, valor);

  // Ventana corrediza de 150 × 110 con antepecho de 100 en el muro de la derecha.
  const ventana = agregarAbertura(n, {
    tipo: "ventana",
    muroId: "m2",
    cara: cara("m2"),
    desde: 120,
    ancho: 150,
    alto: 110,
    antepecho: 100,
  });
  n = ventana.nivel;
  for (const [campo, valor] of [["desde", 120], ["ancho", 150], ["alto", 110], ["antepecho", 100]] as const)
    n = cargarMedidaElemento(n, "abertura", ventana.id, campo, valor);

  // Una columna de 30 × 30 metida en la esquina de abajo a la izquierda.
  const columna = agregarColumna(n, { x: 25, y: 430, ancho: 30, profundidad: 30 });
  n = columna.nivel;
  for (const [campo, valor] of [["ancho", 30], ["profundidad", 30]] as const)
    n = cargarMedidaElemento(n, "columna", columna.id, campo, valor);

  // Cielo falso a 240 con una bandeja de gola adentro, y moldura en todo el contorno.
  const techo = agregarZonaTecho(n, { ambienteId: amb, tipo: "cielo-falso", altura: 240 });
  n = techo.nivel;
  const bandeja = agregarBandeja(n, techo.id, 40);
  if (bandeja) n = bandeja.nivel;
  n = agregarMoldura(n, { ambienteId: amb, ancho: 10, caida: 10 }).nivel;

  // Los puntos que a Bruno siempre le faltaban.
  const puntos: [string, string, number][] = [
    ["int-simple", "m1", 120],
    ["toma-doble", "m4", 90],
    ["toma-doble", "m3", 200],
    ["datos-tv", "m3", 260],
    ["fuerza-aire", "m2", 60],
  ];
  for (const [tipo, muroId, desde] of puntos)
    n = agregarPuntoElectrico(n, { tipo: tipo as never, muroId, cara: cara(muroId), desde }).nivel;

  return relevamiento(n, {
    contactoId: "bruno",
    nombre: "Cuarto de Bruno",
    direccion: "Santa Cruz de la Sierra",
    fechaRelevamiento: "2026-09-14",
  });
}

/** La casa de tres ambientes, con una viga y medidas a ojo: el botón tiene que avisar. */
function casa(): Relevamiento {
  let n = casaDeEjemplo({ medida: true });
  const [dormitorio, bano, pasillo] = n.ambientes.map((a) => a.id);
  const cara = (ambienteId: string, muroId: string) => caraInterior(n, ambienteId, muroId);

  const puerta = agregarAbertura(n, {
    tipo: "puerta",
    muroId: "m8",
    cara: cara(dormitorio, "m8"),
    desde: 260,
    ancho: 80,
    alto: 200,
  });
  n = puerta.nivel;
  n = editarAbertura(n, puerta.id, { apertura: "batiente", abreHacia: cara(dormitorio, "m8"), bisagra: "fin" });

  const puertaBano = agregarAbertura(n, { tipo: "puerta", muroId: "m10", cara: cara(bano, "m10"), desde: 40, ancho: 70, alto: 200 });
  n = puertaBano.nivel;

  const vano = agregarAbertura(n, { tipo: "vano", muroId: "m9", cara: cara(pasillo, "m9"), desde: 20, ancho: 100, alto: 210 });
  n = vano.nivel;

  const ventana = agregarAbertura(n, {
    tipo: "ventana",
    muroId: "m7",
    cara: cara(dormitorio, "m7"),
    desde: 150,
    ancho: 120,
    alto: 120,
    antepecho: 90,
  });
  n = ventana.nivel;

  n = agregarViga(n, { inicio: { x: -7.5, y: 255 }, fin: { x: 305, y: 255 }, ancho: 15, peralte: 30 }).nivel;
  n = agregarZonaTecho(n, { ambienteId: dormitorio, tipo: "losa", altura: 250 }).nivel;
  n = agregarPuntoElectrico(n, { tipo: "int-doble", muroId: "m8", cara: cara(dormitorio, "m8"), desde: 350 }).nivel;
  n = { ...n, alturaGeneral: medida(250, true) };

  return relevamiento(n, {
    contactoId: "ejemplo",
    nombre: "Casa de ejemplo",
    direccion: "Santa Cruz de la Sierra",
    fechaRelevamiento: "2026-09-14",
  });
}

/** El mismo cuarto sin medir: todo dibujado a ojo, para probar el aviso del informe. */
function cuartoAOjo(): Relevamiento {
  const n = cuartoDeBruno({ aOjo: true });
  return relevamiento(n, {
    contactoId: "bruno",
    nombre: "Cuarto sin medir",
    direccion: "Santa Cruz de la Sierra",
    fechaRelevamiento: "2026-09-14",
  });
}

const archivos: [string, Relevamiento][] = [
  ["cuarto-de-bruno.json", cuarto()],
  ["casa-de-ejemplo.json", casa()],
  ["cuarto-sin-medir.json", cuartoAOjo()],
];

for (const [nombre, r] of archivos) {
  writeFileSync(join(salida, nombre), aJson(r), "utf8");
  console.log(`escrito ${nombre}`);
}
