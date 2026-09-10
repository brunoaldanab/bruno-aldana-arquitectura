/**
 * Crea un contacto y una entrevista DE EJEMPLO para poder imprimir la propuesta
 * que se publica en la landing, y devuelve lo necesario para abrirla.
 *
 * Los datos son inventados a propósito: el documento se publica en internet y no
 * puede llevar información de un cliente real. El contacto se borra apenas el PDF
 * está impreso (`--borrar`).
 *
 * Va por SQL directo y no por Prisma: el cliente de Prisma 7 se genera en
 * TypeScript dentro de `src/`, y hacerlo andar desde un script suelto pide más
 * andamiaje del que justifica insertar dos filas.
 *
 * Uso:
 *   node generar-ejemplo.mjs
 *   node generar-ejemplo.mjs --borrar <idDelContacto>
 */

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { SignJWT } from "jose";

/* El script corre suelto, así que el archivo de configuración se lee a mano. */
for (const linea of readFileSync(new URL(".env.local", import.meta.url), "utf8").split("\n")) {
  const par = linea.match(/^([A-Z_]+)="?([^"]*)"?/);
  if (par) process.env[par[1]] = par[2];
}

const sql = neon(process.env.DATABASE_URL);

const NOMBRE = "Familia Rojas Vargas (ejemplo)";
const DIRECCION = "Av. Banzer, 3er anillo — Santa Cruz de la Sierra";

/* 70 m² es el proyecto promedio de Bruno y da 4.200 Bs, el mismo número que
   muestra la calculadora de la landing. Que los dos coincidan importa: si el
   PDF dijera otra cosa, la página se contradiría sola. */
const AMBIENTES = {
  "Living / Comedor": "30",
  Cocina: "12",
  "Dormitorio principal": "18",
  "Baño(s)": "6",
  "Home office": "4",
};

const ESTADO = {
  proyecto: {
    tipoProyecto: "vivienda",
    cliente: NOMBRE,
    tipo: "Departamento",
    direccion: DIRECCION,
    fecha: "",
    m2: "70",
    integrantes: "Dos adultos y una hija de seis años",
    contacto: "",
  },
  ambientesSeleccion: Object.keys(AMBIENTES),
  superficies: AMBIENTES,
  oficina: {
    personas: "", modalidad: "", salaReuniones: "", identidadMarca: "",
    tecnologia: "", acustica: "", visitas: "", horario: "", funcional: [],
  },
  roles: [],
  estilo: {
    seleccion: ["minimalista"],
    atemporalidad: 8,
    densidad: "equilibrado",
    refs: "Les gusta lo sobrio, pero no frío. Quieren madera a la vista.",
  },
  /* Se deja vacío a propósito, y por eso la portada va sin foto.
     La portada del documento sale de la referencia de estilo mejor puntuada, y
     esas referencias son fotos de terceros que Bruno juntó para la entrevista.
     Mostrárselas a un cliente en una reunión es una cosa; publicarlas en un PDF
     descargable desde la web es otra, y ahí sí hay un problema de derechos.
     Si algún día la portada lleva imagen, tiene que ser un render propio. */
  estiloDetalle: {},
  mobiliarioGaleria: { seleccion: [], detalle: {} },
  paleta: {
    seleccion: ["elegante-oscuro"],
    base: [],
    evitar: [],
    calidoFrio: 6,
    notas: "Nada de blanco puro en las paredes.",
    customColores: [],
    puntajes: { "elegante-oscuro": 5 },
  },
  paletaOficina: { seleccion: [], puntajes: {} },
  materiales: {
    seleccion: [],
    notas: "Piso porcelanato símil madera en todo el departamento.",
  },
  ambientesDetalle: {},
  mobiliario: {
    reutilizar: "La mesa de comedor de madera maciza, que era de la abuela.",
    noNegociables: "El sofá tiene que ser desenfundable: hay una nena.",
    electrodomesticos: "Cocina y heladera se compran nuevas.",
    arte: "",
  },
  presupuesto: {
    monto: "", distribucion: "", incluyeObra: "Sí, quieren que se ejecute.", flexible: "",
  },
  plazos: { fecha: "", motivo: "", etapas: "" },
  cierre: {
    evitar: "Que quede como un departamento de catálogo, igual a todos.",
    palabra: "Calma",
    pendientes: "",
  },
  duelo: null,
};

const nuevoId = (prefijo) =>
  `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function crear() {
  const [admin] = await sql`select id from "Admin" limit 1`;
  if (!admin) throw new Error("No hay ningún administrador en la base.");

  const idContacto = nuevoId("ejemplo");
  const ahora = new Date();

  await sql`
    insert into "Contacto" (id, nombre, "direccionProyecto", notas, origen, "createdAt", "updatedAt")
    values (${idContacto}, ${NOMBRE}, ${DIRECCION},
            ${"Contacto de ejemplo para la propuesta publicada en la landing. Se borra solo."},
            ${"ejemplo"}, ${ahora}, ${ahora})`;

  await sql`
    insert into "Entrevista" (id, "contactoId", data, "createdAt", "updatedAt")
    values (${nuevoId("ejemplo")}, ${idContacto}, ${JSON.stringify(ESTADO)}, ${ahora}, ${ahora})`;

  /* Se firma una sesión con el mismo secreto de la app en vez de pedirle la
     contraseña a Bruno: es su propio sistema y su propio secreto. */
  const token = await new SignJWT({ adminId: admin.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET));

  console.log(JSON.stringify({ id: idContacto, token }));
}

async function borrar(id) {
  await sql`delete from "Entrevista" where "contactoId" = ${id}`;
  const borradas = await sql`delete from "Contacto" where id = ${id} returning id`;
  console.log(borradas.length ? `borrado ${id}` : `no existía ${id}`);
}

const [orden, valor] = process.argv.slice(2);

if (orden === "--borrar") await borrar(valor);
else await crear();
