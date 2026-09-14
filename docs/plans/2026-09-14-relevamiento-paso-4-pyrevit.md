# Paso 4 · El botón de pyRevit — Plan

**Fecha:** 14/09/2026 · **Cierra** el paso 4 de `2026-09-10-relevamiento-bim-diseno.md` (§7).
**Prueba que lo cierra:** el archivo del cuarto de Bruno se convierte en Revit 2024 y se revisa
dentro de Revit, no solo en el informe del botón.

---

## 1. Qué hace

Un botón en la pestaña **BA** de Revit que lee un archivo `ba-relevamiento` v2 —el que sale del
teléfono— y crea los elementos nativos en el proyecto abierto: niveles, muros, puertas, ventanas,
vanos, columnas, ambientes con su piso, cielos falsos con sus bandejas, molduras, vigas y los
puntos eléctricos. Termina con un informe de lo creado y de lo que no pudo crear, con el motivo.

**No** exporta nada de vuelta al teléfono, **no** modifica elementos que ya existían y **no**
borra nada.

## 2. Dónde vive el código

La extensión vive **dentro del repositorio de la app**, en `pyrevit/BA.extension/`, porque el
formato que lee es el de `src/lib/plano/modelo.ts` y los dos tienen que cambiar juntos. pyRevit la
carga desde ahí: se agrega esa carpeta a `userextensions` de su configuración, junto a la que ya
tiene en `F:\BA ARQUITECTURA\pyRevitExtensions`.

```
pyrevit/
  BA.extension/
    BA.tab/Relevamiento.panel/TraerRelevamiento.pushbutton/{bundle.yaml, script.py}
    lib/barelevamiento/        # lo que se puede probar sin Revit
      lectura.py    valida el JSON y avisa en castellano qué le falta
      unidades.py   centímetros a pies, nombres de tipo, redondeos
      plan.py       el relevamiento convertido en una lista de órdenes
      informe.py    el texto del informe final
    lib/barevit/
      constructor.py  ejecuta las órdenes con la API de Revit
  pruebas/          fixtures y pruebas con unittest
```

**El motor de Python es CPython 3.12** (`#! python3`), el que ya trae su pyRevit: así las pruebas
corren con el Python de la computadora y el código es uno solo.

## 3. La idea de fondo: plan puro, ejecución tonta

Todo lo que se puede equivocar —unidades, coordenadas, hacia dónde abre una puerta, qué tipo
buscar— se resuelve en `plan.py`, que **no toca la API de Revit**: recibe el JSON y devuelve una
lista de órdenes con todo ya calculado en pies y en coordenadas de Revit. `constructor.py` solo
las ejecuta. Así el 90 % del riesgo se prueba con `unittest` en la computadora, sin abrir Revit.

**Las coordenadas:** el archivo viene en centímetros con `y` hacia abajo (como la pantalla); Revit
usa pies con `y` hacia arriba. La conversión es `(x/30.48, −y/30.48)`. Los vectores se transforman
igual que los puntos, así "cara izquierda" sigue cayendo del lado correcto sin tener que
razonarlo dos veces.

**La geometría no se vuelve a calcular:** el bloque `calculado` del archivo ya trae las esquinas
resueltas, el centro de cada abertura sobre el eje del muro y el contorno interior de cada
ambiente. El botón los usa tal cual (§4.1 del diseño: el motor es la única fuente).

## 4. Los tipos de Revit

Un muro, una puerta o una ventana necesitan **un tipo que exista en el proyecto**. Para cada uno:

| Elemento | Cómo busca el tipo | Si no está |
|---|---|---|
| Muro | El primero cuyo ancho coincide con el espesor (±0,5 cm) | Duplica un tipo básico de una sola capa y le pone el espesor. Lo llama `BA Muro 15` |
| Puerta | Familia cargada de puertas, la que mejor pega con el tipo de apertura | Duplica el tipo más parecido y le carga ancho y alto. Lo llama `BA 80 x 210` |
| Ventana | Igual, con las familias de ventanas | Igual, con antepecho aparte |
| Columna | Columna arquitectónica | Duplica y carga ancho y profundidad |
| Piso, techo, viga | El tipo por defecto de esa categoría | Si no hay ninguno, lo anota en el informe y sigue |
| Punto eléctrico | Familia de la categoría que corresponde al tipo | Si no hay ninguna cargada, lo anota y sigue |

Los tipos creados llevan siempre el prefijo `BA `, así se distinguen de los de la plantilla de
Gigi y se pueden borrar juntos.

## 5. El orden y las transacciones

Una `TransactionGroup` con una transacción por etapa, en este orden: niveles → tipos → muros →
aberturas → vanos → columnas → ambientes y pisos → techos y bandejas → molduras → vigas →
eléctricos. Cada etapa depende de la anterior (una puerta necesita su muro creado y el documento
regenerado). **Un elemento que falla no tumba la etapa:** se anota el motivo y se sigue. Si falla
una etapa entera, las anteriores quedan.

## 6. El informe

Una ventana de pyRevit con: cuántos elementos de cada clase se crearon, la lista de los que no se
pudieron crear con su motivo, y **los controles que traía el archivo** —las cotas sin medir y los
ambientes que no cierran— porque un muro dibujado a ojo entra a Revit con la medida a ojo y Bruno
tiene que saber cuáles son.

## 7. Pruebas

- **Con `unittest`, sin Revit:** validación del archivo, conversión de unidades y coordenadas,
  nombres de tipo, el plan completo del cuarto de Bruno y de la casa de ejemplo, la orientación de
  las puertas, los contornos de piso y de techo, y el texto del informe.
- **Los fixtures salen del motor de verdad:** `pyrevit/pruebas/generar.mts` arma el cuarto de
  Bruno y la casa de ejemplo con el mismo código de la app y escribe los JSON. Si el formato
  cambia, se vuelven a generar y las pruebas de Python lo acusan.
- **En Revit 2024, por Bruno:** abrir un proyecto nuevo, apretar el botón, elegir el archivo del
  cuarto y revisar los elementos adentro de Revit.

## 8. Lo que queda afuera

Muros curvos, escaleras, muebles, materiales y acabados, vistas y láminas, y volver a leer un
archivo ya importado para actualizar lo que cambió (cada corrida crea elementos nuevos).

---

## 9. Lo que cambió al programarlo (14/09/2026)

Tres cosas salieron distintas del plan, todas anotadas acá para que el plan siga
siendo lo que de verdad hay:

1. **La búsqueda de tipos se separó en `lib/barevit/tipos.py`.** El constructor
   quedaba ilegible con la búsqueda mezclada con la creación. `tipos.py` es lo
   único que sabe duplicar un `WallType` o un `FamilySymbol`; `constructor.py`
   solo pide "dame el tipo que se llama así".
2. **El archivo ganó un dato: las esquinas de cada cara.** El bloque `calculado`
   traía el contorno del ambiente entero, pero una moldura que recorre solo dos
   paredes necesita saber dónde empieza y dónde termina cada cara. En vez de
   recalcularlo en Python —lo que rompía la regla de que el motor es la única
   fuente— se agregó `calculado.niveles[].caras` en `archivo.ts`. Los archivos
   guardados antes se abren igual: el campo tiene valor por defecto.
3. **Las molduras entran como líneas de modelo**, no como sólidos. El barrido
   necesita un perfil, y el perfil de cada gola se define adentro de Revit: no
   hay nada en el relevamiento de donde sacarlo. La línea a la altura del cielo
   deja el recorrido exacto para barrerlo ahí, y el informe lo avisa.

**Lo que quedó probado sin Revit:** 62 pruebas con `unittest` sobre los archivos
que escribe el motor de verdad de la app —el cuarto de Bruno, la casa de ejemplo
y el cuarto sin medir—. Cubren la validación, las unidades, las coordenadas, la
orientación de las puertas, los contornos, el catálogo eléctrico y el informe.

**Lo que no se puede probar hasta abrir Revit,** y es lo que cierra el paso 4:
que los tipos se dupliquen bien sobre la plantilla de Gigi (que está en
portugués), que la mano de las puertas caiga del lado correcto, y que las
familias de dispositivos eléctricos estén cargadas en el proyecto.
