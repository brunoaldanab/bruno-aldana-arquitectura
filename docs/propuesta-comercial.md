# La propuesta comercial

Diseño del entregable que la aplicación genera al terminar una entrevista: un PDF de
cuatro páginas que Bruno le manda al cliente con el resumen de la reunión y el precio
del diseño.

**Decidido el 28/08/2026 con Bruno.** Lo que sigue es el diseño acordado, todavía sin
implementar.

## Por qué existe

Hoy Bruno termina la entrevista y no tiene nada para entregarle al cliente. La app
captura una hora de información riquísima —estilos, paleta, materiales, lo que el
cliente quiere evitar, la foto que eligió como favorita— y todo eso muere en una
pantalla de resumen que solo ve él.

El documento convierte esa información en el argumento de venta. Un presupuesto suelto
compite por precio. Un presupuesto precedido de dos páginas que le demuestran al cliente
que lo escucharon, no.

Esto ataca directo el problema que Bruno declara como su mayor freno comercial: que lo
lean como inexperto por su edad. No se discute con palabras, se discute mostrando el
método.

## Términos comerciales

**No se repiten acá.** Viven en `BA_ARQUITECTURA/CLAUDE.md`, sección "Condiciones de la
propuesta comercial", porque son decisiones de la empresa y no de esta aplicación.
Duplicarlos garantizaría que algún día digan cosas distintas.

Lo que sí vive acá es **cómo la aplicación los aplica**.

## Las dos fórmulas

Los valores (60 Bs/m², el mínimo, los 10 m² por día hábil) salen del `CLAUDE.md` de la
empresa. En el código van en un único archivo de constantes, no repartidos por los
componentes.

### Precio del diseño

Se cobra **ambiente por ambiente**, y el mínimo se aplica a cada espacio chico
por separado:

```
por cada ambiente:  cobra = el mayor entre (m² del ambiente × 60 Bs) y 1.000 Bs
precio = la suma de todos los ambientes
```

| Ambiente | Por m² | Cobra |
|---|---|---|
| Baño 4 m² | 240 | **1.000** (mínimo) |
| Cocina 9 m² | 540 | **1.000** (mínimo) |
| Dormitorio 12 m² | 720 | **1.000** (mínimo) |
| Living 25 m² | 1.500 | **1.500** |
| **Total** | | **4.500** |

**Por qué por ambiente y no sobre el total:** un baño de 4 m² no da menos trabajo
que una sala de 25 — da más detalle por metro. El cruce está en 16,67 m²
(1.000 ÷ 60): abajo de eso, un ambiente cobrado por m² factura menos que el piso.

Esto exige la superficie de **cada** ambiente, que se carga en el paso de
selección de ambientes de la entrevista. Si falta la de alguno, el desglose se
descarta entero y se cae en una aproximación sobre el total del proyecto —
`el mayor entre (m² totales × 60) y (cantidad de ambientes × 1.000)`. Un
desglose a medias cobraría de menos sin que se note.

El documento imprime el desglose abierto, una fila por ambiente, marcando cuáles
pagaron el mínimo. Le explica al cliente de dónde sale cada boliviano en vez de
darle un número y punto.

### Plazo de entrega

```
días hábiles = el mayor entre 5 y redondear(m² / 10)
```

70 m² → 7 días hábiles, que es el número que Bruno da hoy. 38 m² → 5 días. 150 m² → 15.

### Forma de pago y validez

El 30% y el 70% se calculan sobre el precio. La fecha de vencimiento son 10 días
corridos desde la fecha de emisión, y se imprime como fecha concreta ("vence el
07/09/2026"), no como cantidad de días: una fecha obliga, un plazo se olvida.

## Estructura del documento

Cuatro páginas. La página 2 no existe en el PDF actual y es la que justifica todo esto.

### Página 1 — Portada

| Elemento | De dónde sale |
|---|---|
| Foto a sangre | **La foto ganadora del duelo** de esta entrevista |
| Logo y nombre del estudio | Fijo |
| "PROPUESTA DE DISEÑO" | Fijo |
| Título del proyecto | `proyecto.tipoProyecto` |
| Nombre del cliente | `Contacto.nombre` |
| Superficie | `proyecto.m2` |
| Fecha y validez | Calculadas |

**Por qué la foto ganadora del duelo y no un render:** la propuesta se manda antes de
diseñar, así que todavía no existe ningún render de ese proyecto. La foto ganadora es
automática, no cuesta trabajo, y es más fuerte: lo primero que ve el cliente al abrir su
propuesta es la imagen que él mismo eligió como su favorita.

Se puede reemplazar a mano por un render del portafolio cuando convenga.

### Página 2 — Lo que nos dijiste

La página nueva. Todo sale de la entrevista; Bruno no escribe nada.

| Bloque | De dónde sale |
|---|---|
| La palabra con la que describe lo que busca | `cierre.palabra` |
| Lo que pidió evitar | `cierre.evitar` |
| Estilo dominante y las fotos que eligió | `estilo.seleccion` + `estiloDetalle` |
| Su paleta | `paleta.seleccion` / `paletaOficina.seleccion` |
| Materiales que le gustaron | `materiales.seleccion` |
| Ambientes a intervenir | `ambientesSeleccion` |
| Tipo de mobiliario | `mobiliarioGaleria.seleccion` |

**Va antes del precio, no después.** Cuando el cliente llega al número, ya leyó dos
páginas de evidencia de que lo escucharon: el precio deja de ser un costo y pasa a ser
el precio de eso. Si fuera al revés, sería un presupuesto con un anexo simpático.

### Página 3 — La propuesta

Fija salvo el plazo. Se conserva casi tal cual del PDF actual, que ya estaba bien.

- **Alcance del diseño** — los nueve puntos actuales, sin cambios.
- **Metodología** — los tres pasos actuales (Diseño / Presupuesto / Ejecución).
- **Qué recibís** — bloque nuevo:

> - Visualizaciones arquitectónicas **hiperrealistas** de cada ambiente
> - **Recorrido virtual interactivo** — vas a caminar tu proyecto antes de que exista
> - Planos generales del proyecto
> - 2 rondas de ajustes incluidas
> - Entrega en **N días hábiles**

El orden es deliberado: lo visual adelante, los planos al final y sin detallar. Cuando el
entregable se especifica demasiado, el cliente puede llevarse los planos a un carpintero
o a una mano de obra más barata. El alcance fino se conversa en la reunión.

El **recorrido virtual interactivo** no figuraba en ninguna propuesta anterior. Es
probablemente lo más impresionante que ofrece Bruno y lo tenía escondido.

### Página 4 — Inversión

| Bloque | Estado |
|---|---|
| Tabla concepto / superficie / tarifa / total | Calculada |
| Forma de pago 30% – 70% con montos | Calculada |
| **Vence el DD/MM/AAAA** | Calculada |
| Dirección y supervisión · 10% | Fijo |
| Qué incluye / qué no incluye el 10% | Fijo |
| Ejemplo | Fijo, con **Bs 20.000 → Bs 2.000** |
| Cómo arrancar | Fijo |

**El ejemplo pasa de 200.000 a 20.000.** El número grande asustaba, y 20.000 es el piso
real de las ejecuciones de interiores de Bruno: un ejemplo conservador es más creíble.

**El 70% se cobra a la entrega del proyecto final, no a la aprobación.** El texto actual
dice "conclusión y aprobación del diseño", y la aprobación es una acción del cliente: era
el cliente quien decidía cuándo le pagaban a Bruno.

## Correcciones de diseño respecto del PDF actual

1. **El precio es hoy el título más chico de la página.** `01 | Propuesta de servicio`
   está tratado como el título importante, y `02 | Inversión` —que es lo primero que
   busca el ojo del cliente y lo que decide la venta— está tratado como una nota al pie.
   Los tres títulos deben pesar igual, o el de inversión más.
2. **La portada regala más de la mitad de la página.** En papel el vacío es elegante; en
   el celular, que es donde el cliente lo va a abrir, es scroll por la nada. Lo resuelve
   la foto a sangre.
3. **El texto gris chico sobre negro** está al límite de legible. Subir el contraste.
4. **La marca se repite tres veces en la página 2** (una vez en el encabezado, dos en el
   pie). Con una alcanza.
5. **El azul del filo superior** es la única nota de color y funciona. Además coincide
   con el acento azul de la aplicación (`--color-accent-500`). Esa continuidad ya está
   ganada; conservarla.

## Bloqueo encontrado: el duelo no se guarda

**Hay que resolver esto antes de la portada.**

El resultado del torneo de fotos vive únicamente en la memoria del componente
(`DueloStep.tsx:84`, un `useState`). No existe ningún campo `duelo` en `EntrevistaState`.

Dos consecuencias:

1. **Es un bug hoy, sin relación con la propuesta.** Si Bruno cambia de paso y vuelve al
   duelo, el torneo desapareció y hay que rehacerlo entero. Delante del cliente.
2. **La portada no puede usar la foto ganadora**, porque fuera de esa pantalla no existe.

El arreglo es chico: agregar un campo `duelo` a `EntrevistaState` con el campeón y el
ranking, y guardarlo cuando el torneo termina. Como `Entrevista.data` es una columna
`Json`, no hace falta migración de base de datos.

**Reserva para entrevistas viejas:** las que ya están cargadas no tienen campeón
guardado. Para esas, la portada usa la foto mejor calificada según `estiloDetalle`, que
es lo que ya calcula `computeRanking`. Así el documento funciona para todos los clientes
existentes, no solo para los nuevos.

## Qué edita Bruno y qué no

- **Escribe:** los m². Es el único dato obligatorio que no sale de la entrevista.
- **Puede editar antes de generar:** los textos que cambian según la reunión.
- **No toca nunca:** metodología, alcance, la sección del 10%, qué incluye y qué no.
  Van escritos en el código.
- **Se calcula solo:** precio, 30%, 70%, plazo, fecha de vencimiento.

Cuando exista la herramienta de relevamiento, los m² se llenan solos y nada más cambia.

## Fuera de alcance

Explícitamente **no** entra en este trabajo:

- La herramienta de relevamiento y el cálculo de superficie. Va después, es lo más
  grande de todo, y este documento funciona sin ella escribiendo los m² a mano.
- El envío por WhatsApp y la página de solo lectura para el cliente. Va después, y es
  chico una vez que el documento existe.
- El bot de WhatsApp y el CRM. Proyecto aparte, descartado por ahora.
- Cotización de ejecución con partidas y proveedores.

## Preguntas abiertas

- **El mínimo por ambiente.** Quedó en 1.000 Bs. Revisar después de las primeras
  propuestas reales: si los proyectos de varios ambientes chicos asustan, bajarlo a 700.
- **La fórmula del plazo** (1 día hábil cada 10 m², mínimo 5) sale de un solo dato: 70 m²
  en 7 días hábiles. Confirmar contra proyectos reales antes de darla por buena.
- **Formato de salida.** Falta decidir cómo se genera el PDF: impresión del navegador
  sobre una página preparada, o una biblioteca de generación. La primera es mucho más
  barata y suele alcanzar. Se decide al escribir el plan de implementación.
