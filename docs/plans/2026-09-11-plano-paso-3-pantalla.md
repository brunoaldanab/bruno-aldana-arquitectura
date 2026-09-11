# Plano BIM, paso 3: la pantalla táctil — Plan de implementación

> **Para quien lo ejecute:** sin agentes por tarea, para cuidar el gasto. El plan no lleva código: cada tarea trae archivos, firmas y casos de prueba; el código se escribe una sola vez, en el archivo.

**Objetivo:** el relevamiento se dibuja y se mide en el teléfono, dentro del modo visita, sin señal, y viaja al servidor igual que los contactos.

**Arquitectura:** la vista `relevamiento` de la página estática `/visita`. El estado es un `Historial<Relevamiento>` del motor (`src/lib/plano/`). Cada cambio se guarda en IndexedDB y se encola; el sincronizador del paso 1 sube contactos y relevamientos por `/api/visita/*`. La lógica de pantalla que se puede probar (vista y pellizco, qué elemento se tocó, cotas, dibujo, ediciones de la pantalla) va en funciones puras con `vitest`; los componentes solo dibujan y llaman.

**Diseño:** `2026-09-10-relevamiento-bim-diseno.md`, secciones 3.3, 3.4, 6, 7, 8 y 10. Motor: `2026-09-10-plano-paso-2-motor.md`. Lo visual: el boceto aprobado `boceto-plano-tactil.html`.

## Restricciones

- **Antes del plan:** 187 pruebas en verde y `tsc` limpio. Ninguna prueba del motor ni del paso 1 puede romperse; las que se borran en la limpieza se cuentan.
- **Base de datos:** sin migraciones. La tabla `Relevamiento` (`data` JSON, `version`) se usa tal cual. La única escritura directa son las filas de prueba de la verificación, creadas y borradas.
- **Marca:** grafito, Archivo y JetBrains Mono, sin acento. Rojo solo semántico (`--color-danger-600`). Números en `dato`, etiquetas en `rotulo`. Solo la hoja se anima (200 ms, `--ease-out`, apagada con `prefers-reduced-motion`).
- **Sin `git push` ni deploy.** Sin `import()` dinámicos en la visita: el service worker guarda lo que carga `/visita`.
- **Commits** en `modulo-relevamiento`, uno por tarea, en español, con las dos líneas de cierre de siempre.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/visita/relevamientos.ts` | Tipos `RelevamientoLocal` y `RelevamientoRemoto`, operación de relevamiento, `fusionarRelevamientos` |
| `src/lib/visita/contactos.ts` | `operacionSchema` pasa a unión por `tipo`; `compactarCola` por tipo e id |
| `src/lib/visita/almacen.ts` | IndexedDB versión 2 con la tabla `relevamientos` |
| `src/lib/visita/api.ts` | Respuestas nuevas de `subir` y `cambios` |
| `src/lib/visita/servidor.ts` | `ordenarOperaciones`, `hayConflicto`, `relevamientosV2` |
| `src/lib/visita/sincronizador.ts` | Sube y baja relevamientos; estado `subido-conflicto` |
| `src/app/api/visita/subir/route.ts`, `cambios/route.ts` | Contactos primero, después relevamientos |
| `src/lib/plano/vista.ts` | Vista del lienzo: plano ↔ pantalla, encuadre, pellizco |
| `src/lib/plano/toque.ts` | Qué elemento hay bajo un toque, en planta y en techo |
| `src/lib/plano/dibujo.ts` | Polígono de muro, hueco y hoja de abertura, cotas de cada lado, textos de superficie |
| `src/lib/plano/edicion.ts` | Ediciones que pide la pantalla: colocar abertura, arrastrar, lado con punta fija, tipo de techo, nuevo nivel |
| `src/app/visita/plano/*` | `PantallaPlano` (orquesta), `BarraPlano`, `LienzoPlano`, `DibujoPlanta`, `DibujoTecho`, `Herramientas`, `Hoja` y una hoja por elemento, `CampoMedida` (movido), `Segmentado`, `PlanoImpresion` |
| `src/app/contactos/[id]/relevamiento/page.tsx` | Solo redirige a la visita |

## Tareas

`P = { x, y }`. Casos del motor en `prueba-casos.ts`.

### Tarea A · Los relevamientos viajan igual que los contactos

- `relevamientos.ts`: `RelevamientoLocal = { contactoId, data: Relevamiento, versionBase, pendiente, guardadoEn }` · `RelevamientoRemoto = { contactoId, data, version }` · `operacionRelevamientoSchema = { tipo: "relevamiento", contactoId, data: relevamientoSchema, versionBase }` · `fusionarRelevamientos(locales, remotos): { lista; cambiados: string[] }`.
- `contactos.ts`: `operacionSchema` = unión discriminada · `claveOperacion(op)` · `compactarCola(ops)` por `tipo:id`.
- `almacen.ts`: versión 2 (`onupgradeneeded` solo crea lo que falta) · `listarRelevamientos()` · `leerRelevamiento(contactoId)` · `guardarRelevamientos(rs)` · `encolar` reemplaza en la misma transacción la operación de relevamiento anterior del mismo contacto (un relevamiento pesa; la cola no crece con cada toque).
- `servidor.ts`: `ordenarOperaciones(ops)` (contactos primero, orden estable) · `hayConflicto(versionServidor: number | null, versionBase)` · `relevamientosV2(filas)`.
- `api.ts`: `subir → { contactos, relevamientos: { contactoId, version, conflicto }[] }` · `cambios → { contactos, relevamientos: RelevamientoRemoto[], ahora }`.
- `sincronizador.ts`: `leerRelevamiento(contactoId)` · `guardarRelevamiento(contactoId, data)` · callback opcional `alCambiarRelevamientos(ids)` · estado `subido-conflicto` = "Subido · reemplazó una versión más nueva". Al subir se usa la `versionBase` del registro local, que se actualiza después de cada subida aunque siga pendiente.
- **Pruebas:** compacta `[r(a)1, c(a), r(a)2]` → `[c(a), r(a)2]` · ordenar pone contactos antes · `hayConflicto(null, 0)` → no; `(3, 2)` → sí; `(2, 2)` → no · `relevamientosV2` descarta formato 1 y JSON roto · fusionar no pisa uno pendiente y reporta los cambiados · sincronizador: guardar deja pendiente y en cola · sube, queda con la versión del servidor y sin pendiente · conflicto → último estado `subido-conflicto` · sin señal no se pierde · cambios bajan y no pisan lo pendiente · editado durante la subida sigue pendiente y la versión base avanza.

### Tarea B1 · Funciones puras de la pantalla

- `vista.ts`: `Vista = { x, y, escala }` (pantalla = plano · escala + desplazamiento) · `planoAPantalla(v, p)` · `pantallaAPlano(v, p)` · `cajaDeNivel(nivel)` · `encuadrar(caja, ancho, alto, margenPx)` · `pellizcar(v, antes: [P, P], despues: [P, P])` con escala entre `ESCALA_MIN` y `ESCALA_MAX` · `desplazar(v, dx, dy)`.
- `toque.ts`: `Seleccion` = nodo | muro (con cara, punto, ambiente e índice de lado) | abertura | columna | ambiente | techo | moldura | viga · `tocarPlanta(nivel, p, radioCm)` (prioridad nodo, abertura, columna, muro, ambiente) · `tocarTecho(nivel, p, radioCm)` (viga, moldura, zona más chica, ambiente) · `caraDelLado(nivel, muroId, p)`.
- `dibujo.ts`: `poligonoMuro(nivel, muroId)` · `geometriaAbertura(nivel, a)` (hueco, hoja y arco de puerta, líneas de ventana) · `cotasDeAmbiente(nivel, ambienteId, separacionCm)` (inicio, fin, texto, tomada, índice, adentro) · `textoSuperficie(nivel, ambienteId)` ("18,47 m²", con ≈ si falta medir algún lado) · `nombresPuntas(lado)` ("Arriba/Abajo" o "Izquierda/Derecha").
- `edicion.ts`: `colocarAbertura(nivel, tipo, toque, radioCm, codigosUsados)` · `arrastrarAbertura(nivel, id, p)` (de a 1 cm, sin salir de la cara, pasa a dibujada) · `cargarLadoConPunta(nivel, ambienteId, indice, valor, punta)` · `editarZonaTecho(nivel, id, tipo)` · `agregarNivel(r)` · `codigosDeOtrosNiveles(r, nivelId)`.
- **Pruebas (cuarto de Bruno):** ida y vuelta plano ↔ pantalla · encuadrar el cuarto en 390 × 600 lo deja entero y centrado · pellizcar al doble mantiene el punto medio · toque en `(202, -7)` → muro `m1`; en `(200, 200)` → ambiente `amb1`; a 5 cm de `n1` → nodo · muro `m1`: polígono de 4 puntos con `(0,0)` y `(-15,-15)` · cotas `[405, 456, 405, 456]` dibujadas adentro · superficie "≈ 18,47 m²" sin medir, "18,47 m²" medido · puerta colocada tocando `(300, 460)` → `P1` en `m3 derecha` · arrastrar la puerta a `(30, 460)` → desde 0 y a `(9999, 460)` → desde 315 · cargar 445 con punta fija en el inicio deja esa esquina en su lugar · zona a cielo falso · nuevo nivel `nivel-2` con cota de piso = altura general.

### Tarea B2 · La pantalla

- `navegacion.ts`: vista `relevamiento` (`/visita?contacto=<id>&vista=relevamiento`). Prueba: ida y vuelta.
- `FichaContacto` suma el botón **Relevamiento**; `VisitaApp` muestra `PantallaPlano` a pantalla completa.
- `PantallaPlano({ contacto, sinc, estado, onVolver })`: carga el local o arma `relevamientoVacio`; cada cambio → `aplicar` + `sinc.guardarRelevamiento`. Mientras se arrastra no se guarda: se guarda al soltar.
- `LienzoPlano`: `touch-action: none`, pointer events; un dedo toca, arrastra nodos y aberturas o desplaza; dos dedos pellizcan.
- Hojas (entran en 200 ms): Muro, Abertura, Columna, Ambiente (con altura general), Zona, Moldura, Viga. Tocar una cota abre la hoja del muro con el campo de largo enfocado.
- `CampoMedida` movido a `src/app/visita/plano/`, con valor dibujado como "≈ N", sin disparar cambios si el valor no cambió.
- `PlanoImpresion`: papel `#F2F1EE`, tinta grafito, cotas interiores, cuadro de aberturas y de techos; **Descargar archivo para Revit** y **Compartir**.

### Tarea C · Limpieza

- `/contactos/[id]/relevamiento` → `redirect`. Botón de la ficha de la computadora → la visita.
- Se borran `RelevamientoApp`, `PanelParedes`, `PanelAberturas`, `ControlCierre`, `PlanoSvg`, `VistaPlano`, `sincronizador.ts`, `actions.ts`, y de `src/lib/relevamiento/` `formato`, `geometria`, `controles`, `sincronizacion` y `almacen` con sus pruebas. Quedan `voz.ts` y `descarga.ts`.
- `next build` con `○ /visita`.

### Tarea D · Verificación sin Bruno

Playwright con iPhone emulado (390 × 844, táctil), servidor de producción en el puerto 3100, cookie de sesión de prueba. Flujo y comprobaciones del pedido; cuatro capturas; borrado de las filas de prueba.

## Ajustes

Se completan al programar.
