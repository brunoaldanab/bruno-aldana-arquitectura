# Relevamiento BIM y modo visita sin señal — Diseño

**Fecha:** 10/09/2026 · **Estado:** aprobado por Bruno, parte por parte, el mismo día.
**Reemplaza** a `2026-09-10-modulo-relevamiento.md` en todo lo que se contradiga. La etapa 1 que
salió de aquel diseño (rama `modulo-relevamiento`, 12 commits) se probó en el iPhone y Bruno la
descartó como forma de trabajo: *"para ser la primera fase estuvo bien, pero no es lo que quiero"*.

**Documentos relacionados**
- Lo que dijo Bruno, con sus palabras: `../../../proceso/proceso-de-bruno.md`, sección de requisitos
  del módulo de relevamiento.
- Investigación de código abierto y de la API de Revit: `../../../proceso/investigacion-relevamiento-bim.md`.
- Boceto aprobado de las pantallas: <https://claude.ai/code/artifact/d7f4b205-33b6-4b6c-a7e5-7f04a2db0912>.

---

## 1. Qué pidió Bruno

1. **Sin internet desde el primer momento**, no "abrirlo antes con señal": *"literalmente funcione
   sin internet desde siempre"*. Incluye la entrevista y crear clientes, no solo el relevamiento.
2. **Pensado como Revit:** *"un sistema BIM, que tenga la información necesaria básica: el muro, las
   ventanas, puertas, pisos, techos"*, porque esa información va a pasar a Revit.
3. **Manejo sobre el dibujo, como un plano:** tocar un muro para cambiarle la cota, editar una pared
   del medio sin borrar las demás, arrastrar puertas y ventanas al muro, apertura en punteado.
4. **Fuera** las alturas por punto y las diagonales: *"muy malo"*.
5. **Techos con distintas alturas:** cielo falso, desniveles, molduras.
6. **Precisión al centímetro:** *"esto es para construir, necesito al centímetro"*. El escaneo
   queda solo para pruebas.
7. **Referencia de manejo:** el dibujo manual de OpenPlan3D, *"si ves mejoras o innovaciones, las
   aplicás"*.

## 2. Alcance

**Entra en este diseño:**
- El **modo visita**: una sección de la app que funciona sin señal desde la instalación, con la
  lista de contactos, crear y editar clientes, y el relevamiento.
- El **plano táctil BIM** del relevamiento: niveles, muros, puertas, ventanas, vanos, columnas,
  ambientes con su piso, zonas de techo, molduras y vigas.
- El **archivo para Revit** (formato `ba-relevamiento` versión 2) y el plano para imprimir.
- El **botón de pyRevit** que convierte ese archivo en elementos nativos. Tiene su propio plan.

**No entra:** la entrevista sin señal (etapa siguiente, con su propio diseño), fotos dentro del
relevamiento, escaneo o Apple RoomPlan, muros curvos, escaleras, muebles, vista 3D, varios usuarios.

**Se construye en cuatro pasos, cada uno con su plan y su prueba:**

| Paso | Qué | Prueba que lo cierra |
|---|---|---|
| 1 | Base sin señal: modo visita, contactos, crear clientes, sincronización | Primer abrir en modo avión, crear un cliente, ver que sube al volver la señal |
| 2 | Motor del plano: modelo, medidas, cierre, ambientes, techos, archivo para Revit | Pruebas automáticas con el cuarto de Bruno y una casa de ejemplo |
| 3 | Pantalla táctil del boceto | Bruno releva su cuarto en el iPhone en modo avión |
| 4 | Botón de pyRevit | El archivo del cuarto se convierte en Revit 2024 y se revisa dentro de Revit |

---

## 3. El modo visita: arquitectura sin señal

### 3.1 Una sola página guardada en el teléfono

`/visita` es **una página cliente estática** que no le pide nada al servidor para dibujarse. Adentro
se navega por estado y parámetros de la dirección (`/visita?contacto=<id>&vista=relevamiento`), nunca
con rutas de Next: cada ruta de Next pide datos al servidor al navegar y falla sin señal.

- El manifiesto abre la app instalada en `start_url: "/visita"`.
- En la computadora siguen las páginas de siempre (ficha, propuesta, cotizaciones). El botón
  *Relevamiento* de la ficha lleva a `/visita?contacto=<id>&vista=relevamiento`, y la ruta vieja
  `/contactos/[id]/relevamiento` redirige ahí.
- `/visita` queda **fuera del control de login del `proxy`**, porque no contiene datos: los datos
  viven en el teléfono y viajan por la API, que sí controla la sesión (3.4).

### 3.2 El service worker guarda la app entera al instalarse

- **Se sirve desde un Route Handler** en `/sw.js` que escribe la versión de la publicación dentro del
  código (`VERCEL_GIT_COMMIT_SHA`, o la marca de compilación en local). Cada publicación nueva es un
  service worker nuevo, y el anterior se descarta al activarse. Es el mismo enfoque de
  `@serwist/turbopack`, sin la dependencia.
- **Al instalarse**, pide el HTML de `/visita`, saca de ahí todas las direcciones de
  `/_next/static/...` (programas y hojas de estilo), lee las hojas de estilo para sumar las
  tipografías que referencian, y guarda todo junto con el HTML, el manifiesto y el ícono. Si falta
  una sola pieza, la instalación falla y se reintenta: nunca queda una copia a medias.
- **Al pedir `/visita` sin señal**, entrega el HTML guardado. Con señal, pide la red primero y
  actualiza la copia.
- **No guarda** respuestas de la API ni de otras páginas.
- **Actualización:** silenciosa. La versión nueva queda lista y se usa al próximo abrir.

### 3.3 Los datos viven en el teléfono

IndexedDB, base `ba-visita`, con cuatro tablas:

| Tabla | Qué guarda |
|---|---|
| `contactos` | Los contactos con sus campos básicos (nombre, teléfono, correo, dirección, notas, origen), `updatedAt` y si tienen cambios sin subir |
| `relevamientos` | Un relevamiento por contacto, con `versionBase` y si tiene cambios sin subir |
| `cola` | Las operaciones pendientes de subir, en orden |
| `meta` | Última sincronización, estado de la sesión, versión del formato |

- **Los identificadores nacen en el teléfono** (`crypto.randomUUID()`). El servidor acepta ese `id` al
  crear el contacto: `Contacto.id` es texto, así que no hace falta cambiar la tabla.
- Se pide persistencia con `navigator.storage.persist()`. Las apps agregadas a la pantalla de inicio
  de iOS no entran en el borrado de datos a los 7 días de Safari; se verifica en la prueba del paso 1.

### 3.4 Sincronización por API, no por Server Actions

**Se usan Route Handlers con direcciones fijas** (`/api/visita/...`) y no Server Actions. Los
identificadores de las Server Actions cambian con cada publicación: un teléfono con la app vieja
guardada no podría subir nada después de un deploy.

| Ruta | Qué hace |
|---|---|
| `POST /api/visita/subir` | Recibe la cola en orden. Cada operación es idempotente por `id`: crear o actualizar contacto, guardar relevamiento con `versionBase`. Devuelve el resultado de cada una |
| `GET /api/visita/cambios?desde=<fecha>` | Contactos y relevamientos cambiados desde la última sincronización |

- Cada ruta **verifica la sesión por su cuenta** y responde `401` en JSON si no hay sesión. El `proxy`
  las deja pasar sin redirigir: una redirección al login rompería la respuesta.
- **Flujo:** al abrir y cada vez que vuelve la señal, primero se sube la cola y después se bajan los
  cambios. Cada cambio local se guarda al instante y la subida se programa 1,5 s después del último.
- **Conflictos, con un solo usuario:** lo del teléfono gana. Para los relevamientos se mantiene la
  regla de la etapa 1 (`versionBase`: si el servidor avanzó, se guarda igual y se avisa). Para los
  contactos, un cambio que baja del servidor no pisa un contacto con cambios locales sin subir.
- **Sesión vencida:** se sigue trabajando. El estado dice "Iniciá sesión para subir", con un link al
  login que vuelve a `/visita`.
- **Estados visibles:** "Guardado en el teléfono", "Subiendo…", "Todo subido", "Sin señal · guardado
  en el teléfono", "Iniciá sesión para subir", "Subido · reemplazó una versión más nueva".

---

## 4. El modelo BIM: formato `ba-relevamiento` versión 2

### 4.1 Reglas generales

- **Unidades:** centímetros. Las medidas son enteros. Las coordenadas del dibujo pueden tener un
  decimal, porque un muro en ángulo no cae en centímetros enteros.
- **Coordenadas de pantalla**, como SVG: `x` hacia la derecha, `y` hacia abajo.
- **Cada magnitud medible es una `Medida`:** `{ valor: entero, tomada: booleano }`. `tomada: false`
  es un valor dibujado a ojo: se muestra en gris con ≈ y cuenta como pendiente. `tomada: true` es
  una medida de láser: se muestra en blanco.
- **Los muros son un grafo:** los muros unen **nodos**. Mover un nodo mueve todos los muros que llegan
  a él, y partir un muro es insertar un nodo. OpenPlan3D une los muros por coincidencia de puntas;
  el grafo es más robusto para editar una pared del medio sin romper el resto.
- **El eje del muro es la geometría guardada.** Las cotas que ve y carga Bruno son **interiores, de
  cara a cara**, porque así mide el láser. El motor convierte entre las dos con los espesores.

### 4.2 Estructura

```ts
Relevamiento {
  formato: "ba-relevamiento"; version: 2; unidades: "cm";
  proyecto: { contactoId; nombre; direccion; fechaRelevamiento };  // fecha AAAA-MM-DD
  niveles: Nivel[];
}

Nivel {
  id; nombre; cotaPiso: entero; alturaGeneral: Medida;
  nodos: Nodo[]; muros: Muro[]; aberturas: Abertura[]; columnas: Columna[];
  ambientes: Ambiente[]; techos: ZonaTecho[]; molduras: Moldura[]; vigas: Viga[];
}

Nodo { id; x: número; y: número }                     // eje de los muros

Muro {
  id; desde: nodoId; hasta: nodoId;
  espesor: Medida; altura: Medida | null;              // null = altura general del nivel
  caras: { izquierda: Medida | null; derecha: Medida | null };
}                                                      // largo interior de cada cara, mirando de "desde" a "hasta"

Abertura {
  id; codigo;                                          // P1, V1, A1: únicos en todo el relevamiento
  tipo: "puerta" | "ventana" | "vano";
  muroId; cara: "izquierda" | "derecha";               // la cara desde la que se midió
  desde: Medida;                                       // desde la esquina interior donde empieza esa cara
  ancho: Medida; alto: Medida; antepecho: Medida;      // puertas y vanos: antepecho 0
  apertura: "batiente" | "doble" | "corrediza" | "pivotante" | "plegable"
          | "fija" | "proyectante" | null;             // vano: null
  abreHacia: "izquierda" | "derecha" | null;           // lado del muro hacia el que barre la hoja
  bisagra: "inicio" | "fin" | null;                    // extremo de la abertura donde va la bisagra
  notas: texto;
}

Columna { id; x; y; ancho: Medida; profundidad: Medida; rotacion: grados; altura: Medida | null }

Ambiente {
  id; nombre;
  contorno: { muroId; cara }[];                        // caras en orden, detectadas por el motor
  desnivelPiso: entero;                                // cm respecto de la cota del nivel; negativo = más bajo
}

ZonaTecho {
  id; ambienteId; tipo: "losa" | "cielo-falso" | "cajon";
  contorno: { x; y }[];                                // polígono cerrado sobre la planta
  altura: Medida;                                      // desde el piso del ambiente
}

Moldura { id; ambienteId; caras: { muroId; cara }[]; ancho: Medida; caida: Medida }

Viga { id; inicio: { x; y }; fin: { x; y }; ancho: Medida; peralte: Medida }
```

Todo se valida con zod al guardar, al subir y al leer del servidor. Un relevamiento con formato
versión 1 (solo existen los de prueba de la etapa 1) no se convierte: la pantalla avisa que es del
formato anterior y arranca uno nuevo.

---

## 5. El motor geométrico

Funciones puras, sin DOM, probadas con `vitest`.

### 5.1 Dibujo

- El muro se dibuja tocando punto por punto: cada toque agrega un nodo encadenado, y tocar el primer
  nodo cierra. La dirección se ajusta a 0°, 45° y 90° cuando pasa cerca, como `angleSnap` de
  OpenPlan3D. El ajuste se puede desactivar para ángulos libres.
- Un toque cerca de un nodo existente se engancha a él (`magneticSnap`).
- El espesor por defecto es 15 cm, editable por muro.
- Todo lo dibujado nace con `tomada: false`.

### 5.2 Caras y esquinas

La cara de un muro es la línea del eje desplazada `espesor / 2` hacia cada lado. La esquina interior
de un ambiente es la intersección de las caras de los dos muros que llegan al nodo. El largo interior
de una cara es la distancia entre sus dos esquinas.

### 5.3 Las medidas mandan

Cuando se carga o se corrige una medida, el motor rehace las posiciones:

1. **Por ambiente**, recorre sus caras en orden desde una esquina fija: la primera esquina del primer
   ambiente medido, o un nodo ya resuelto por otro ambiente. Usa la dirección de cada muro tomada del
   dibujo y el largo de cada cara: la medida tomada si existe, la dibujada si no.
2. **El error de cierre** es la distancia entre el punto donde termina el recorrido y la esquina de
   partida.
3. **Si es de 2 cm o menos** (`TOLERANCIA_CM = 2`), se reparte entre los nodos libres del recorrido en
   proporción al largo acumulado: la compensación de poligonal de la topografía. Las medidas cargadas
   no cambian; el plano avisa en gris "ajustado N cm".
4. **Si es mayor**, no se reparte. El recorrido queda abierto, y el hueco se dibuja en rojo con
   "No cierra · faltan N cm" en la esquina donde falla.
5. **Una casa se resuelve ambiente por ambiente, en el orden en que se midieron.** Los nodos de un
   ambiente ya resuelto quedan fijos para los siguientes. Si un ambiente nuevo contradice lo ya
   resuelto, el error se marca en ese ambiente.
6. Los nodos que no pertenecen a ningún ambiente cerrado siguen la posición dibujada.

### 5.4 Ambientes

Se detectan solos como los ciclos mínimos del grafo de caras: en cada nodo se toma la cara siguiente
que gira más a la derecha. Un ambiente conserva su `id` y su nombre mientras siga cerrado por los
mismos muros, aunque cambien las medidas. Si se parte uno de sus muros, sigue siendo el mismo ambiente.
Si OpenPlan3D resuelve la detección de una forma reutilizable, se adapta su código con su nota de
licencia MIT.

### 5.5 Operaciones

- **Partir un muro** en un punto: inserta un nodo. Las aberturas pasan al tramo que las contiene, con
  su `desde` recalculado. Las medidas de cara del muro original pasan a `tomada: false` en los dos
  tramos, porque ya no corresponden.
- **Mover un nodo** con el dedo: cambia las medidas dibujadas, nunca las tomadas. Si el nodo tiene
  caras medidas, el motor las vuelve a imponer al soltar.
- **Borrar un muro:** se borran sus aberturas y se vuelven a detectar los ambientes.
- **Deshacer y rehacer:** historial de estados completos del nivel, hasta 100 pasos.

### 5.6 Controles, en pantalla y en el archivo

| Nivel | Situación |
|---|---|
| Error | Ambiente que no cierra por más de 2 cm · abertura que se sale de su cara o se pisa con otra · zona de techo cuyo contorno se sale de su ambiente · abertura más alta que la altura del muro |
| Pendiente | Cualquier `Medida` con `tomada: false` que Revit necesita: caras de ambientes, espesores, anchos, altos, antepechos, alturas de techo |
| Aviso | Muro suelto que no cierra ningún ambiente · ambiente sin puertas · abertura a menos de 5 cm de una esquina · zona de techo más alta que la altura general (válido en una doble altura, pero conviene confirmarlo) |

El contador "N cotas sin medir" de la barra superior cuenta los pendientes del nivel.

---

## 6. La pantalla táctil

El boceto aprobado manda. Resumen de lo que construye el paso 3:

- **Barra superior:** volver, estado de sincronización, selector **Planta · Techo**, selector de
  nivel, y el contador de pendientes o el aviso de cierre.
- **Lienzo SVG** en coordenadas de centímetros, con `pointer events`. SVG y no canvas: una casa tiene
  unos cientos de elementos, y SVG resuelve el toque sobre cada uno sin cálculos propios. Un dedo
  selecciona y arrastra; dos dedos pellizcan y desplazan.
- **Herramientas en planta:** Tocar, Muro, Puerta, Ventana, Vano, Columna, Deshacer.
  **En techo:** Tocar, Zona, Moldura, Viga, Deshacer.
- **Hoja de datos del elemento tocado,** desde abajo y al alcance del pulgar:
  - **Muro:** largo de la cara (con la punta que queda fija), espesor, altura, *Partir aquí*,
    *Agregar columna*, *Borrar*.
  - **Puerta, ventana o vano:** tipo, ancho, alto, antepecho, *desde esquina* y *hasta esquina* (las
    dos a la vista; la segunda se calcula), hacia dónde abre, bisagra, notas.
  - **Columna:** ancho, profundidad, rotación, altura.
  - **Ambiente:** nombre, desnivel de piso, superficie y perímetro calculados.
  - **Zona de techo, moldura y viga:** sus medidas.
- **Cotas:** blancas si están tomadas, grises con ≈ si están dibujadas. Tocar una cota abre su campo.
- **Puertas y ventanas se arrastran** sobre su cara de a 1 cm. La apertura se dibuja en punteado y la
  ventana con su símbolo de plano.
- **Campo de medida:** el de la etapa 1 (teclado, dictado y láser en modo teclado), con `parsearMedida`.
- **Plano para imprimir:** la vista de impresión de la etapa 1, adaptada al modelo nuevo, con cotas
  interiores, cuadro de aberturas y cuadro de techos.
- **Movimiento:** casi nada. La hoja entra en 200 ms con `--ease-out`; el lienzo no anima.

---

## 7. El archivo para Revit y el botón de pyRevit

- **Descarga** del JSON `ba-relevamiento` v2 con `nombreDeArchivo`. En el iPhone se ofrece además
  compartir el archivo con `navigator.share`, cuando el sistema lo permite, para mandarlo a la
  computadora sin señal de por medio.
- **El botón de pyRevit (paso 4)** lee el archivo y crea elementos nativos en el proyecto abierto:

| Del archivo | En Revit |
|---|---|
| Nivel | `Level.Create` con su cota, o el nivel existente del mismo nombre |
| Muro | `Wall.Create` sobre el eje, con un tipo de muro `BA Muro <espesor>` que busca o duplica, y su altura |
| Puerta y ventana | `NewFamilyInstance` alojada en el muro, con un tipo `<ancho> x <alto>` que busca o duplica de la familia elegida por tipo de apertura; antepecho; volteo según `abreHacia` y `bisagra` |
| Vano | Abertura rectangular en el muro |
| Columna | Columna arquitectónica con un tipo `<ancho> x <profundidad>` |
| Ambiente | `NewRoom` con su nombre, y `Floor.Create` con su contorno interior y su desnivel |
| Zona de techo | `Ceiling.Create` con su contorno y su desfase de altura |
| Moldura | Techo en franja a `altura − caída`, a lo largo de las caras |
| Viga | Viga con tipo `<ancho> x <peralte>` a la altura del techo |

  Termina con un informe de lo creado y de lo que no pudo crear, con el motivo. Tiene su propio plan,
  y se verifica dentro de Revit 2024 con el cuarto de Bruno.

---

## 8. Qué se aprovecha de la etapa 1 y qué se descarta

| Se aprovecha | Se descarta o se reemplaza |
|---|---|
| `voz.ts` (`parsearMedida`) y `CampoMedida` | `geometria.ts` y `controles.ts` de la versión 1: los reemplaza el motor nuevo |
| El patrón de `almacen.ts` y de la decisión de sincronización | `PanelParedes`, `PanelAberturas`, `ControlCierre`, `RelevamientoApp` |
| `descarga.ts` | La Server Action `guardarRelevamiento`: la reemplaza la API |
| La tabla `Relevamiento` (`data` JSON y `version`), sin migración | El service worker de la etapa 1: lo reemplaza el de 3.2 |
| El manifiesto, con `start_url` cambiado a `/visita` | La página `/contactos/[id]/relevamiento`: pasa a redirigir |
| La vista de impresión, adaptada | Las alturas por punto y las diagonales |

---

## 9. Seguridad

- `/visita` y el service worker no contienen datos. Los datos viajan solo por `/api/visita/*`, que
  exige sesión.
- En el teléfono los datos quedan en el almacenamiento de la app, protegido por el bloqueo del iPhone.
- El service worker nunca guarda respuestas de la API.

## 10. Pruebas

- **Lógica pura con `vitest`:** validación del formato, grafo y caras, recorrido y compensación,
  detección de ambientes, partir y borrar, aberturas y sus controles, techos, contador de pendientes,
  cola de sincronización y fusión de cambios, extracción de la lista de archivos del HTML para el
  service worker.
- **Casos de referencia:** el cuarto de Bruno (405 × 456 cm interiores, muros de 15 cm, altura 263,
  18,47 m²) y una casa de ejemplo con tres ambientes que comparten muros.
- **Sin señal, de verdad:** con `next build` y `next start`, abrir `/visita` una vez con conexión para
  instalar, cortar la red, abrir en frío, crear un cliente, relevar, volver a conectar y verificar que
  todo llegó a la base. Se automatiza con Playwright en modo sin conexión antes de pasárselo a Bruno.
- **En el iPhone, por Bruno**, al cerrar los pasos 1 y 3: primer abrir en modo avión.
- **En Revit**, al cerrar el paso 4: los elementos se revisan dentro de Revit 2024, no solo en el
  informe del botón.

## 11. Riesgos y cómo se cubren

| Riesgo | Cómo se cubre |
|---|---|
| iOS borra los datos de la app | Persistencia pedida, subida apenas hay señal, prueba en el iPhone del paso 1 |
| El dictado de Safari no funciona sin señal | El micrófono del teclado del iPhone escribe en el mismo campo; se confirma en la prueba |
| Una publicación nueva deja al teléfono con la app vieja | API con direcciones fijas y formato versionado; el service worker nuevo se instala solo |
| El reparto del error esconde una medida mal tomada | Solo hasta 2 cm, siempre avisado, y las medidas cargadas nunca se tocan |
| La detección de ambientes falla en formas raras | Casos de prueba con L, U y ambientes que comparten muros; ángulos libres probados aparte |
