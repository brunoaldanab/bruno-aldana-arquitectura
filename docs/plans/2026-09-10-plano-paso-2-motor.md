# Plano BIM, paso 2: el motor — Plan de implementación

> **Para quien lo ejecute:** SUB-SKILL REQUERIDA: superpowers:executing-plans (sin agentes por tarea, para cuidar el gasto). Los pasos usan casillas (`- [ ]`).

**Objetivo:** la lógica pura del plano táctil BIM: el formato `ba-relevamiento` versión 2, las caras y esquinas de los muros, la detección de ambientes, "las medidas mandan" con el control de cierre, las operaciones de edición con deshacer, los controles y el archivo para Revit. Sin pantallas.

**Arquitectura:** carpeta nueva `src/lib/plano/`, un archivo por responsabilidad. Todo es función pura: recibe un `Nivel` y devuelve un `Nivel` nuevo, sin mutar el anterior, para que el historial de deshacer sea una lista de estados. El eje de los muros es la geometría guardada; las cotas son interiores y se calculan con los espesores.

**Stack:** TypeScript · zod 4 · vitest 4 (entorno `node`, sin DOM).

**Diseño:** `docs/plans/2026-09-10-relevamiento-bim-diseno.md`, secciones 4, 5, 7 (solo el archivo) y 10. La sección 6 (pantalla) es el paso 3: las funciones de este plan están pensadas para que esa pantalla las llame.

## Restricciones globales

- **Unidades:** centímetros. Las medidas son enteros; las coordenadas de los nodos se redondean a un decimal.
- **Coordenadas de pantalla**, como SVG: `x` hacia la derecha, `y` hacia abajo. "Izquierda" y "derecha" de un muro se miran de `desde` a `hasta`, tal como se ve en pantalla.
- **`TOLERANCIA_CM = 2`.** Hasta 2 cm se reparte y se avisa; más de 2 cm queda abierto y en error.
- **Las medidas tomadas nunca se modifican** por el motor: ni al compensar, ni al mover nodos, ni al partir.
- **Pruebas:** `vitest` en entorno `node`, archivos `src/lib/plano/*.test.ts`. Antes del plan hay **126 pruebas** en verde; ninguna puede romperse.
- **No se toca:** `src/lib/relevamiento/` (solo se importa `nombreDeArchivo`), `src/lib/visita/`, `src/app/visita/`, la pantalla vieja del relevamiento. **Nada de base de datos.** No se publica ni se hace `git push`.
- **Comentarios** en español, explicando el porqué. Archivos chicos.
- **Commits** en la rama `modulo-relevamiento`, un commit por tarea, mensajes en español que describen el resultado, terminados con:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017Z39Na11ACrJdxTJDcCYRJ
  ```

## Ajustes respecto del diseño

1. **La cota es por lado del ambiente, no por muro.** Cuando un muro se parte, o cuando otro muro llega en T al medio de una pared, esa pared queda hecha de dos caras seguidas en la misma línea. Bruno la mide de esquina a esquina con una sola cota: el láser no sabe dónde está la unión del otro lado. Por eso el motor agrupa las caras seguidas y alineadas de un ambiente en un **lado**, y la medida del lado se guarda en `caras` de la **primera cara del lado** (en el orden del contorno). Las demás caras del lado quedan en `null`. Así el formato de la sección 4.2 no cambia. Los nodos del medio de un lado se ubican en la misma proporción que tenían en el dibujo y no quedan fijos, para que otro ambiente los pueda medir.
2. **Partir un muro no borra la medida del lado.** El diseño (5.5) decía que las caras del muro partido pasan a `tomada: false`. Con la regla del lado, partir no cambia el largo del lado y la medida sigue siendo cierta, así que se conserva. Una medida pasa a dibujada solo cuando el lado cambia de verdad (otro muro llega al medio, o se borra un muro que lo cortaba).
3. **Las caras dibujadas absorben la diferencia antes de medir el cierre.** Si en un ambiente dibujado a ojo se carga un solo lado, el recorrido no cierra por la diferencia con el dibujo. Esa diferencia no es un error de medición: la absorben los lados que siguen dibujados (el reparto de norma mínima, que cambia lo menos posible cada lado dibujado). El error de cierre que se compara con los 2 cm es el que queda entre las medidas **tomadas**.
4. **`desde` de una abertura** se mide desde la esquina de la cara que está del lado del nodo `desde` del muro, en las dos caras. La pantalla muestra además "hasta esquina" con `hastaEsquina`.
5. **Partir un muro se pide en centímetros de cara** (`distancia` desde la esquina de inicio de una cara), no en un punto suelto: así el `desde` de las aberturas del segundo tramo queda entero y exacto. La pantalla convierte el toque con `distanciaEnCara`.
6. **Una abertura que queda cortada por el punto de partición** va al tramo que contiene su centro, y el control la marca como error ("se sale de su cara").
7. **El archivo lleva un bloque `calculado`** con la geometría que resuelve el motor: puntas de cada muro, centro de cada abertura sobre el eje, contorno interior, superficie, perímetro y un punto interior de cada ambiente. El botón de pyRevit (paso 4) lo lee directo y no vuelve a calcular esquinas: el motor queda como única fuente de la geometría. El resto del archivo es exactamente la sección 4.2, y `calculado` es opcional al leer.
8. **Pendientes:** toda `Medida` con `tomada: false` del nivel, salvo el antepecho de puertas y vanos (que es 0 por definición): altura general, espesores, alturas de muro, lados de ambiente, `desde`, anchos, altos, antepechos de ventana, columnas, alturas de techo, molduras y vigas. El diseño nombraba solo algunos; todos los necesita Revit.
9. **"Ambiente sin puertas"** cuenta también los vanos como acceso.
10. **Zona de techo fuera de su ambiente:** se controla que los vértices de la zona estén dentro del ambiente (o sobre su borde) y que ningún vértice del ambiente quede estrictamente adentro de la zona. Cubre los casos de L y U sin un algoritmo de recorte de polígonos.
11. **Los identificadores** los arma el motor: `n1`, `m1`, `a1`, `c1`, `amb1`, `t1`, `mol1`, `v1`, con el número siguiente al mayor que ya existe. Son deterministas (las pruebas no dependen del azar) y únicos dentro del nivel. Los niveles se llaman `nivel-1`, `nivel-2`.
12. **Estado del cierre:** `cerrado` si el error es menor a 0,5 cm; `ajustado` hasta 2 cm; `abierto` si pasa de 2 cm.
13. **La compensación reparte en el largo de los lados, no moviendo esquinas** (agregado al programar). El diseño (5.3) nombraba la compensación de la topografía, que corre cada esquina en proporción al largo acumulado. Eso gira los muros un poco, y la siguiente resolución toma esas direcciones giradas como dibujo: el plano se iría deformando con cada edición. En cambio, los hasta 2 cm se reparten entre los largos de los lados del tramo, en proporción a su largo y sin girar ningún muro. Las medidas cargadas no cambian y resolver dos veces da el mismo plano.
14. **Un ambiente abierto no se mueve** (agregado al programar). Si se aplicara el recorrido, el último muro tendría que girar para llegar a la esquina de partida, y la resolución siguiente mediría un error menor: el error se escondería solo. Por eso el ambiente abierto conserva su dibujo, y su `Cierre` trae el recorrido con las medidas cargadas (`recorrido`, `esquina`, `finRecorrido`) para dibujar el hueco en rojo.
15. **Orden de resolución** (agregado al programar). No hay registro de cuándo se midió cada ambiente. Se resuelven primero los ambientes con al menos un lado tomado, en el orden de la lista (que `actualizarAmbientes` conserva y que suma los nuevos al final), y después los demás, que solo absorben lo que ya quedó fijo. Solo quedan fijas las esquinas de un ambiente cerrado o ajustado.
16. **`desde` de una abertura admite negativos** (agregado al programar). Si al partir un muro una abertura queda cortada, pasa al tramo de su centro (ajuste 6) y su `desde` desde la esquina nueva da negativo. Recortarlo cambiaría la posición medida; por eso el esquema acepta enteros negativos solo en ese campo, y el control lo marca como error "se sale de su cara".
17. **Una cara que no encierra ningún ambiente pierde su medida al partir su muro** (agregado al programar). Sin un lado que la agrupe, no hay forma de saber a qué tramo corresponde. Las caras de ambiente conservan la suya por el ajuste 2.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/plano/modelo.ts` | Esquema zod v2, tipos, relevamiento vacío, `medida`, ids |
| `src/lib/plano/vector.ts` | Operaciones con puntos: suma, resta, largo, normales, intersección de rectas |
| `src/lib/plano/caras.ts` | Grafo de muros: vecinos en cada nodo, esquinas interiores, largo de cada cara, distancia sobre una cara |
| `src/lib/plano/ambientes.ts` | Ciclos mínimos de caras, lados, conservar id y nombre, medidas por lado |
| `src/lib/plano/superficie.ts` | Contorno interior, superficie, perímetro, punto interior, ambiente en un punto |
| `src/lib/plano/resolver.ts` | Las medidas mandan: recorrido, absorción, compensación, cierre |
| `src/lib/plano/operaciones.ts` | Dibujar con ajuste, cargar medidas, mover nodo, partir y borrar muros |
| `src/lib/plano/elementos.ts` | Aberturas, columnas, zonas de techo, molduras y vigas |
| `src/lib/plano/historial.ts` | Deshacer y rehacer, hasta 100 pasos |
| `src/lib/plano/controles.ts` | Errores, pendientes y avisos |
| `src/lib/plano/archivo.ts` | El archivo para Revit: `calculado`, JSON, lectura, descarga y compartir |
| `src/lib/plano/prueba-casos.ts` | Los casos de referencia armados una vez para todas las pruebas: el cuarto de Bruno, la casa, la L y la U |

## Cómo se ejecuta este plan

El plan no lleva código de implementación: dos intentos anteriores gastaron el límite escribiendo todo el código dos veces. Cada tarea trae sus archivos, las firmas públicas y los casos de prueba con números; el código se escribe una sola vez, en el archivo, con TDD (prueba que falla, implementación, prueba que pasa, `tsc`, suite completa, commit).

---

## Tareas

`P = { x, y }`. `RefCara = { muroId, cara: "izquierda" | "derecha" }`. Las coordenadas se comparan con `toBeCloseTo(v, 1)`.

**Geometría de los casos** (ejes de muro; la cara interior está a espesor/2):

- **Cuarto de Bruno:** nodos `n1(-7.5,-7.5)`, `n2(412.5,-7.5)`, `n3(412.5,463.5)`, `n4(-7.5,463.5)`; muros `m1 n1→n2` (arriba), `m2 n2→n3`, `m3 n3→n4` (abajo), `m4 n4→n1`, todos de 15. La cara interior es `derecha`. Interior 405 × 456, altura 263.
- **Casa:** exteriores de 15 y tabiques de 10. `A(-7.5,-7.5) E(305,-7.5) B(507.5,-7.5) H(507.5,255) C(507.5,407.5) F(305,407.5) D(-7.5,407.5) G(305,255)`; muros `A→E, E→B, B→H, H→C, C→F, F→D, D→A` (15) y `E→G, G→F, G→H` (10). Dormitorio 300 × 400, baño 190 × 250, pasillo 190 × 140. **A ojo:** los mismos muros con las columnas `x: -7.5→0, 305→320, 507.5→490` y las filas `y: 255→240, 407.5→420` (sigue ortogonal, con largos equivocados).
- **L:** interior `(0,0) (300,0) (300,200) (500,200) (500,400) (0,400)`, muros de 15: 16 m², 1800 cm.
- **U:** interior `(0,0) (200,0) (200,250) (400,250) (400,0) (600,0) (600,400) (0,400)`, muros de 15: 19 m², 2500 cm.

### Tarea 1 · `modelo.ts` + `vector.ts`

- `modelo.ts`: esquemas zod de la sección 4.2 más `controlSchema` y `calculadoSchema` (opcional), con sus tipos. El nivel verifica que cada referencia exista y que los ids no se repitan.
  - `medida(valor: number, tomada = false): Medida` (redondea a entero)
  - `nivelVacio(id, nombre, cotaPiso = 0): Nivel` · `relevamientoVacio(proyecto): Relevamiento`
  - `siguienteId(ids: string[], prefijo: string): string` · `siguienteIdNivel(r): string` · `siguienteCodigo(codigos: string[], tipo): string`
  - `redondear(n, decimales = 1): number` · `TOLERANCIA_CM = 2`, `ESPESOR_POR_DEFECTO = 15`, `ALTURA_POR_DEFECTO = 260`
- `vector.ts`: `suma`, `resta`, `por(p, k)`, `productoEscalar`, `productoCruz`, `largo`, `distancia`, `unitario`, `normalIzquierda`, `normalDerecha`, `interseccion(p1, d1, p2, d2): P | null`, `redondearPunto(p)`, `areaConSigno(puntos): number`.
- **Pruebas:** `medida(262.6)` → `{ valor: 263, tomada: false }` · el relevamiento vacío valida y tiene `nivel-1` · rechaza `valor: 12.5`, `version: 1` y un muro con nodo inexistente · `siguienteId(["m1","m3","mol7"], "m")` → `m4` · `siguienteCodigo(["P1","V1","P2"], "puerta")` → `P3` · `normalIzquierda((1,0))` → `(0,-1)` · intersección de `x=300` con `y=250` → `(300,250)`; paralelas → `null` · área con signo de `(0,0)(0,10)(10,10)(10,0)` → `-100`.

### Tarea 2 · `caras.ts`

- `nodosDeCara(nivel, ref): { inicio, fin }` — el recorrido deja el ambiente a la izquierda: `izquierda` va de `desde` a `hasta`, `derecha` al revés.
- `siguienteCara(nivel, ref): RefCara` — en el nodo final, la cara que gira más a la izquierda en pantalla (vuelta en U solo si no hay otra).
- `esquinasCara(nivel, ref): { desde: P; hasta: P }` — esquinas en el nodo `desde` y en el nodo `hasta` del muro (ajuste 4). Caras paralelas o punta suelta: proyección del nodo.
- `largoCara(nivel, ref): number` · `direccionCara(nivel, ref): P` · `distanciaEnCara(nivel, ref, p): number` (desde la esquina del nodo `desde`, en el sentido del muro).
- **Pruebas:** cuarto: `siguienteCara(m1 derecha)` → `m4 derecha` · esquinas de `m1 derecha` → `(0,0)` y `(405,0)` · largos interiores 405 y 456, exteriores 435 y 486 · `distanciaEnCara(m3 derecha, (300,456))` → 105 · casa: cara del baño de `E→G` mide 250 y la del dormitorio de `G→F` 145 · muro suelto `(100,100)→(100,200)` de 15: caras de 100.

### Tarea 3 · `ambientes.ts` + `superficie.ts` + `prueba-casos.ts`

- `detectarContornos(nivel): RefCara[][]` — ciclos con área negativa en pantalla, sin las caras de muros sueltos, empezando por el lado cuya primera cara tiene el muro de número menor.
- `ladosDeContorno(nivel, contorno): Lado[]` · `ladosDeAmbiente(nivel, ambienteId): Lado[]` con `Lado = { caras, nodoInicio, nodoFin, nodosInternos, inicio: P, fin: P, direccion: P, largo, medida: Medida | null }`.
- `claveLado(lado): string` (`nodoInicio>nodoFin`) · `indiceLadoDeMuro(nivel, ambienteId, muroId): number`.
- `actualizarAmbientes(anterior: Nivel | null, nuevo: Nivel): Nivel` — conserva id, nombre y desnivel del ambiente anterior con más nodos en común (al menos la mitad); los nuevos van al final como `Ambiente N`. La medida tomada de un lado sigue solo si el lado conserva su clave (ajustes 1 y 2).
- `superficie.ts`: `contornoInterior(nivel, ambienteId): P[]` · `superficie(nivel, ambienteId): number` (m², 3 decimales) · `perimetro(nivel, ambienteId): number` (cm) · `puntoInterior(poligono): P` · `puntoEnPoligono(p, poligono): boolean` · `ambienteEnPunto(nivel, p): string | null`.
- `prueba-casos.ts`: `cuartoDeBruno({ medido?, aOjo? })` · `casaDeEjemplo({ medida?, aOjo? })` · `ambienteEnL()` · `ambienteEnU()` · `medirLado(nivel, ambienteId, muroId, valor)` · `nivelDesdePoligono(interior: P[], espesor)`.
- **Pruebas:** cuarto → 1 ambiente, lados `[405, 456, 405, 456]`, contorno `(405,0) (0,0) (0,456) (405,456)`, 18,468 m², 1722 cm · con un muro suelto adentro, lo mismo · casa → dormitorio, baño y pasillo de 12, 4,75 y 2,66 m²; el lado derecho del dormitorio es uno solo de 400 hecho de dos caras · L → 1 ambiente, 6 lados, 16 m², 1800 · U → 1 ambiente, 8 lados, 19 m², 2500 · el punto interior de la L y de la U cae adentro · `ambienteEnPunto(casa, (400,100))` → baño · renombrar y volver a detectar conserva id y nombre.

### Tarea 4 · `resolver.ts`

- `resolverNivel(nivel): { nivel: Nivel; cierres: Cierre[] }` con `Cierre = { ambienteId, medido, estado, error, esquina: P, finRecorrido: P, recorrido: P[] }`.
- `estadoCierre(error): "cerrado" | "ajustado" | "abierto"`.
- **Pruebas:** 0,4 → cerrado, 2 → ajustado, 2,1 → abierto · cuarto a ojo 400 × 450 con los cuatro lados medidos → 18,468 m², 1722 cm, cerrado · cuarto a ojo con solo arriba = 405 → abajo absorbe (405), los lados de 450 no cambian, cerrado · **cierre abierto:** medido completo con 445 a la derecha → error 11, abierto, nodos sin mover · **compensación:** derecha = 458 → error 2, ajustado, los dos lados verticales quedan de 457 en la geometría y las medidas siguen en 456 y 458 · resolver dos veces da los mismos nodos · **casa a ojo medida:** posiciones relativas a `A` iguales a las exactas y tres ambientes cerrados · la casa con el pasillo arriba = 195 → pasillo abierto con error 5; dormitorio y baño cerrados con los mismos nodos que sin el error.

### Tarea 5 · `operaciones.ts`

- `ajustarPunto(nivel, origen: P | null, toque: P, opciones?: { angulo?: boolean; radio?: number }): { punto: P; nodoId: string | null; muroId: string | null }`.
- `agregarMuro(nivel, desde: Extremo, hasta: Extremo, espesor = 15): { nivel; muroId; nodoHasta }` con `Extremo = { nodoId } | P`. Un extremo sobre el eje de otro muro lo parte (T).
- `recalcular(anterior, nuevo): Nivel` · `cargarMedidaLado(nivel, ambienteId, indice, valor: number | null)` · `cargarEspesor(nivel, muroId, valor)` · `cargarAlturaMuro(nivel, muroId, valor | null)` · `cargarAlturaGeneral(nivel, valor)`.
- `moverNodo(nivel, nodoId, p, resolver = true): Nivel` · `partirMuro(nivel, muroId, cara, distancia): { nivel; nodoId }` · `borrarMuro(nivel, muroId): Nivel` · `renombrarAmbiente(nivel, ambienteId, nombre)` · `cambiarDesnivel(nivel, ambienteId, cm)`.
- **Pruebas:** `ajustarPunto` de `(0,0)` a `(100,3)` → `(100,0)`; sin ajuste → `(100,3)`; a 10 cm de `n2` → `n2` · dibujar los cuatro muros del cuarto cerrando en `n1` → 1 ambiente de 18,468 · muro `(202.5,-7.5)→(202.5,463.5)` en el cuarto medido → 2 ambientes de 8,892 m², uno conserva `amb1`; arriba y abajo pasan a dibujados, izquierda y derecha siguen tomados · cuarto a ojo + cargar 405/456/405/456 → 18,468 · mover `n3` en el cuarto sin medir cambia el lado dibujado y no crea tomadas · **partir con abertura:** ventana en `m1 derecha` (desde 130, ancho 150), partir `m1 derecha` a 100 → la ventana pasa al tramo nuevo con desde 30, arriba sigue 405 tomado y la superficie no cambia · borrar el muro del medio → 1 ambiente `amb1` de 18,468 y sus aberturas borradas.

### Tarea 6 · `elementos.ts`

- `agregarAbertura(nivel, datos: { tipo, muroId, cara, desde, ancho, alto, antepecho? }, codigosUsados = []): { nivel; id; codigo }` · `editarAbertura(nivel, id, cambios)` · `hastaEsquina(nivel, abertura): number` · `centroAbertura(nivel, abertura): P`.
- `agregarColumna(nivel, { x, y, ancho, profundidad, rotacion? })` · `agregarZonaTecho(nivel, { ambienteId, tipo, contorno?, altura })` (sin contorno usa el del ambiente) · `agregarMoldura(nivel, { ambienteId, caras?, ancho, caida })` · `agregarViga(nivel, { inicio, fin, ancho, peralte })`, cada una `{ nivel; id }`.
- `cargarMedidaElemento(nivel, tipo, id, campo, valor): Nivel` · `borrarElemento(nivel, tipo, id): Nivel`.
- **Pruebas (cuarto):** puerta en `m3 derecha` a 60, ancho 90 → `P1`, antepecho 0, hasta esquina 255, centro `(300,463.5)` · ventana 150 × 120, antepecho 90, en `m1 derecha` a 130 → `V1`, hasta esquina 125 · con `["P1"]` de otro nivel la puerta nueva es `P2` · cargar una medida la pasa a tomada · la zona de techo sin contorno toma el del cuarto · borrar la puerta.

### Tarea 7 · `historial.ts`

- `crearHistorial<T>(inicial)` · `aplicar(h, estado)` · `deshacer(h)` · `rehacer(h)` · `puedeDeshacer(h)` · `puedeRehacer(h)` · `LIMITE_HISTORIAL = 100`.
- **Pruebas:** tres pasos; deshacer dos y rehacer uno devuelven exactamente los estados (misma referencia) · aplicar después de deshacer borra el futuro · con 150 pasos se deshacen 100 y el 101 no hace nada · aplicar el mismo estado no suma paso.

### Tarea 8 · `controles.ts`

- `revisarNivel(nivel): Control[]` · `contarPendientes(nivel): number` · `revisarRelevamiento(r): Control[]` con `Control = { tipo: "error" | "pendiente" | "aviso"; codigo; mensaje; nivelId?; elemento?: { tipo; id } }`.
- **Pruebas (cuarto):** sin medir → 9 pendientes (altura general, 4 espesores, 4 lados) · medido → 0 · con la puerta dibujada → 3 (el antepecho no cuenta) · 445 en un lado → error "No cierra · faltan 11 cm" · puerta a 350 con ancho 90 → error "se sale de su cara" · dos puertas pisadas → error · ventana de alto 200 con antepecho 90 y altura 263 → error · zona de techo de la L que tapa el hueco → error; adentro → nada · techo a 300 → aviso · muro suelto → aviso · sin puertas → aviso; con un vano → nada · puerta a 3 cm de la esquina → aviso · código repetido en dos niveles → error.

### Tarea 9 · `archivo.ts`

- `calcularGeometria(r): Calculado` · `conCalculado(r): Relevamiento` · `aJson(r): string` · `leerArchivo(texto): { ok: true; relevamiento } | { ok: false; motivo: "json" | "version-anterior" | "invalido"; mensaje }` · `nombreArchivo(r): string` · `descargarArchivo(r): void` · `compartirArchivo(r): Promise<boolean>`.
- **Pruebas (cuarto con puerta y ventana):** `m1` de `(-7.5,-7.5)` a `(412.5,-7.5)` · ambiente de 18,468 m², 1722 cm, 4 puntos, punto interior adentro · puerta con centro `(300,463.5)` · controles incluidos · `leerArchivo(aJson(r))` devuelve lo mismo · versión 1 → `version-anterior` · texto roto → `json` · nombre `relevamiento-cuarto-bruno-2026-09-10.json`.
