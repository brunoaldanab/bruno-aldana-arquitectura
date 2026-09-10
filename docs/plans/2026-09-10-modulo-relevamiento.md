# Módulo de relevamiento — Diseño

Aprobado por Bruno el 10/09/2026. Diseño de base: los detalles finos que Bruno tiene en
mente se suman después, sin cambiar esta estructura.

## El problema

Bruno mide en la visita con láser y croquis a mano, y le pasan dos cosas: **no entiende su
propio croquis** si no lo pasa a Revit en el momento, y **siempre le falta alguna medida**,
sobre todo de puertas, ventanas, antepechos, alturas y objetos. En el croquis de su cuarto
(10/09/2026) las cotas del lado izquierdo sumaban 5,97 m sobre un largo real de 4,56 m.

El módulo lleva el relevamiento a la app de entrevistas: la medida queda digital desde el
primer segundo, la app controla que cierre antes de irse, y el resultado alimenta un botón
de pyRevit que arma el modelo base.

**Referencias:** el protocolo de relevamiento del estudio
(`BA_ARQUITECTURA/proceso/protocolo-de-relevamiento.md`) y el flujo de Leica DISTO Plan
(*Sketch Plan*). El protocolo manda: croquis primero, cotas acumuladas desde la esquina,
diagonales, siete datos por abertura y control de cierre.

## Decisiones tomadas con Bruno

| Tema | Decisión |
|---|---|
| Dispositivo | iPhone (12 Pro, con LiDAR), app instalada en pantalla de inicio |
| Sin internet | Debe funcionar sin datos y subir cuando haya señal |
| Unidad | Una casa se releva **completa en un solo relevamiento**. Ambientes en lugares distintos son proyectos distintos |
| Dibujo | Las tres formas: **recorrido dictado**, **con el dedo** y **formas rápidas** |
| Carga de medidas | **Teclado, voz y láser con modo teclado**, en el mismo campo. Láser actual: Bosch GLM165-40, sin Bluetooth |
| Fotos | Dentro de la app, atadas a pared o elemento. Se descargan en la computadora y se borran de la app |
| Salidas | Plano PDF con cotas, archivo para Revit, fotos por pared |

## Etapas

Cada etapa es usable de verdad y se prueba en un caso real.

| Etapa | Alcance | Prueba |
|---|---|---|
| **1** | Un nivel, ambientes sueltos. Formas rápidas (rectángulo, L, U) y recorrido con giros de 90°. Puertas y ventanas con sus siete datos. Tres alturas y dos diagonales por ambiente. Control de cierre. Sin internet y sincronización. Plano PDF y archivo para Revit | Cuarto de Bruno (proyecto 2026-00) |
| **2** | Varios niveles y ambientes unidos por sus puertas, con control de medidas exteriores. Vigas, columnas, muebles fijos, luminarias, tomas, llaves, aire acondicionado y muebles existentes. Fotos y su descarga | Un proyecto real de vivienda |
| **3** | Dibujo con el dedo con triangulación por diagonal. Paredes en ángulo libre. Paredes curvas por cuerda y flecha | Una casa irregular |

El **botón de pyRevit "Relevamiento a Revit"** es un subproyecto aparte, fuera de esta app, y
arranca al cerrar la etapa 1: consume el archivo de salida.

**Fuera de alcance:** Bluetooth directo desde la web (Safari en iOS no lo soporta y Apple no
planea hacerlo), escaneo LiDAR dentro de la app, modelado 3D, varios usuarios.

## Modelo de datos

Dos modelos nuevos en `prisma/schema.prisma`, siguiendo el patrón de `Entrevista`: el
contenido va en JSON para poder evolucionar sin migraciones por cada campo.

```prisma
model Relevamiento {
  id         String   @id @default(cuid())
  contactoId String   @unique
  contacto   Contacto @relation(fields: [contactoId], references: [id])
  data       Json     // formato "ba-relevamiento", ver abajo
  version    Int      @default(1) // para detectar que el teléfono y el servidor divergieron
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// Etapa 2
model RelevamientoFoto {
  id             String   @id            // uuid generado en el teléfono, así la foto existe offline
  relevamientoId String
  elementoRef    String                  // "amb-1/pared-2", "amb-1/P1"
  dataUrl        String                  // comprimida con imageFileToDataUrl
  createdAt      DateTime @default(now())
  @@index([relevamientoId])
}
```

`contactoId` es único: un proyecto tiene un solo relevamiento, que puede contener toda la
casa. Prisma exige la relación de los dos lados, así que `Contacto` suma el campo
`relevamiento Relevamiento?`. Las fotos se borran de la base después de descargarlas, para no llenar el plan gratuito
de Neon.

## El formato "ba-relevamiento"

Es a la vez lo que guarda la app y lo que lee el botón de pyRevit. Todo en **centímetros
enteros**. Se documenta con un esquema de `zod` que valida en los dos extremos.

```ts
{
  formato: "ba-relevamiento",
  version: 1,
  proyecto: { contactoId, nombre, direccion, fechaRelevamiento },
  niveles: [{
    id, nombre, cotaPiso,
    ambientes: [{
      id, nombre,
      metodo: "forma" | "recorrido" | "dedo",
      forma?: { tipo: "rectangulo" | "L" | "U", medidas: Record<string, number> },
      paredes: [{ id, largo, giro: "D" | "I" | number, espesor?, curva?: { flecha } }],
      alturas: [{ punto: "puerta" | "centro" | "opuesta", medida }],
      diagonales: [{ desdeVertice, hastaVertice, medida }],
      ubicacion?: { x, y, rotacion },          // etapa 2: calculada al unir ambientes
      elementos: [{
        id, codigo,                            // "P1", "V1", "R1", "L1"
        tipo: "puerta" | "ventana" | "viga" | "columna" | "mueble-fijo"
            | "luminaria" | "toma" | "llave" | "aire" | "mueble",
        pared?, desde?, hasta?,                // cotas acumuladas desde el inicio de la pared
        alto?, antepecho?, dintel?, espesorMuro?,
        apertura?: "corrediza" | "batiente" | "pivotante" | "fija",
        abreHacia?: "adentro" | "afuera", bisagra?: "inicio" | "fin",
        conectaCon?,                           // etapa 2: id de otro ambiente
        planta?: { x, y }, altura?,            // luminarias, muebles
        ancho?, largo?, notas?, fotos?: string[]
      }]
    }]
  }]
}
```

**Convención geométrica:** la pared *i* va del vértice *i* al *i+1*. El recorrido arranca en la
esquina junto a la puerta de entrada y avanza en sentido horario visto desde arriba, que es
como lo manda el protocolo. `desde` y `hasta` de un elemento se miden desde el vértice de
inicio de su pared.

## Motor geométrico

Funciones puras en `src/lib/relevamiento/`, sin React, con pruebas en `vitest` como el resto
del repositorio. Es la parte crítica y va con pruebas antes que la interfaz.

| Función | Etapa | Qué hace |
|---|---|---|
| `formaAPoligono` | 1 | Rectángulo, L o U con sus medidas → polígono |
| `recorridoAPoligono` | 1 | Paredes con largo y giro → polígono abierto o cerrado |
| `errorDeCierre` | 1 | Distancia entre el último punto y el primero, en cm |
| `controlarParedes` | 1 | Para cada pared: ¿las cotas de sus elementos entran y no se pisan? |
| `controlarDiagonales` | 1 | ¿Las diagonales medidas coinciden con las del polígono? Tolerancia 2 cm |
| `controlarAberturas` | 1 | ¿Cada puerta y ventana tiene sus siete datos? |
| `superficie`, `perimetro` | 1 | Para la ficha y para cobrar a 60 Bs/m² |
| `unirPorPuerta` | 2 | Ubica un ambiente respecto de otro por la puerta que comparten, descontando el muro |
| `triangularConDiagonal` | 3 | Resuelve una forma no rectangular a partir de lados y una diagonal |
| `arcoPorCuerdaYFlecha` | 3 | Dibuja una pared curva |

**El control de cierre** junta todo lo anterior en una lista con tres niveles: **error**
(no cierra, falta un dato obligatorio), **aviso** (diagonal fuera de tolerancia, altura
medida en menos de tres puntos) y **ok**. El botón *Terminar visita* muestra esa lista y
pide confirmación si hay errores.

## Carga de medidas por voz

`src/lib/relevamiento/voz.ts` convierte lo dictado en centímetros, con pruebas para cada
forma en que Bruno puede decirlo: "cuatro cero cinco", "cuatrocientos cinco", "cuatro con
cinco", "4,05", "cuatro metros cinco". Ante una frase ambigua **no adivina**: muestra la
interpretación y pide confirmar.

Se usa `webkitSpeechRecognition`. **Riesgo a probar primero en la etapa 1:** en modo app
instalada, iOS puede bloquear esa interfaz. Si pasa, la voz queda a cargo del micrófono del
teclado del iPhone, que dicta en cualquier campo de texto sin código propio.

**El láser con modo teclado** (Leica DISTO X3 y superiores) escribe en el campo con foco como
si fuera un teclado: no requiere código específico, solo que el campo acepte el formato que
envía el láser. Se prueba el día que haya un equipo.

## Interfaz

Pensada para iPhone, una mano ocupada con el láser.

- **`/contactos/[id]/relevamiento`** — el tablero del relevamiento: niveles, ambientes, estado
  de sincronización ("todo subido" / "3 cambios sin subir") y *Terminar visita*.
- **`/contactos/[id]/relevamiento/[ambienteId]`** — el editor: el plano en SVG arriba, que se
  redibuja con cada medida, y abajo el panel de carga. El panel muestra **qué dato sigue**
  según el protocolo, así la app guía el orden de medición.
- **`/contactos/[id]/relevamiento/plano`** — la planta limpia con cotas, preparada para
  imprimir. El PDF sale de la impresión del navegador: sin librerías de PDF.
- **Descarga** — un archivo `.json` con el formato "ba-relevamiento"; en la etapa 2, un
  paquete con el JSON, el PDF y las fotos.

La ficha del contacto suma un botón *Relevamiento* al lado de *Ficha de entrevista*. La
lista de ambientes se ofrece precargada desde la entrevista, si existe.

La identidad visual es la del manual de marca, igual que el resto de la app.

## Sin internet

1. **Todo cambio se guarda en IndexedDB al instante**, antes de intentar subirlo.
2. **Una cola de sincronización** sube el relevamiento completo cuando hay conexión, con el
   número de `version` para detectar si el servidor tiene algo más nuevo. Con un solo
   usuario, ante un conflicto gana el teléfono y se avisa.
3. **Un service worker propio** (`public/sw.js`) guarda la estructura de las pantallas de
   relevamiento, para que la app abra aunque se entre sin señal. La guía
   `experimental.useOffline` de Next 16 solo cubre navegaciones y Server Actions ya
   iniciadas; una apertura en frío sin red necesita el service worker, como dice la propia
   guía.
4. **`app/manifest.ts`** para que la app instalada abra a pantalla completa. Hoy no existe.
5. **La interfaz muestra siempre el estado**: guardado en el teléfono, subido, o con cambios
   pendientes.

**Límite del iPhone, verificado:** iOS puede borrar los datos de una app web que pasa días sin
abrirse y le da poco espacio. Por eso **lo local es un colchón y no un archivo**: se sube
apenas hay señal, y la app avisa si queda algo sin subir.

## Trampas a resolver desde el arranque

- **Leer antes de programar** las guías de Next 16 en `node_modules/next/dist/docs/01-app/02-guides/`:
  `progressive-web-apps.md`, `offline-support.md` y
  `03-api-reference/03-file-conventions/01-metadata/manifest.md`. El `AGENTS.md` del
  repositorio lo exige: esta versión de Next cambió convenciones.
- **`src/proxy.ts` redirige al login todo lo que no excluye su `matcher`.** Hay que excluir
  `sw.js` y el manifiesto, o el service worker nunca se instala.
- **`sw.js` necesita sus encabezados** (`Content-Type` de JavaScript y `Cache-Control:
  no-cache`) en `next.config.ts`, según la guía de PWA.
- **Las fotos en Neon:** el plan gratuito tiene poco espacio y hoy la app guarda imágenes como
  base64 en la base. En la etapa 2 se comprimen con `imageFileToDataUrl` y se borran tras la
  descarga.
- **Números en español:** coma decimal en la interfaz, enteros en centímetros en los datos.

## Cómo se verifica

- **Motor geométrico y voz:** pruebas unitarias en `vitest`, escritas antes de la
  implementación. Casos mínimos: el rectángulo del cuarto (405 × 456 → 18,47 m²), una L, un
  recorrido que no cierra por 11 cm, una pared con cotas que se pisan, una ventana sin
  antepecho, las diagonales de un ambiente torcido.
- **La prueba de campo de la etapa 1 es el cuarto de Bruno:** relevarlo con la app en el
  iPhone, en modo avión la mitad del tiempo, y comparar contra lo que ya se sabe (4,05 ×
  4,56 m, altura 2,63 m, 18,47 m² en Revit).
- **Tres cosas que se prueban en el iPhone real antes de dar la etapa por cerrada:** la voz
  en modo app instalada, abrir la app sin señal, y que los datos sobrevivan a cerrarla.

## Pendiente de definir con Bruno

Las ideas de detalle que mencionó el 10/09/2026 y que dejó para después.
