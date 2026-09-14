# La plantilla BA ARQ

`F:\BA ARQUITECTURA\PLANTILLAS\BA ARQ 2024.rte`

La plantilla propia de Bruno Aldana - Arquitectura, hecha desde cero el
14/09/2026. No sale de la plantilla comprada a Gigi Arruda ni de ninguna otra:
arranca de un proyecto métrico en blanco de Revit y se le agrega solo lo que
Bruno usa.

**Por qué existe.** El botón que trae el relevamiento a Revit venía eligiendo
entre las familias y los tipos que hubiera en el proyecto abierto, y cada
plantilla distinta traía un error distinto: familias que no se dejaban voltear,
una losa de cimentación elegida como piso de ambiente, categorías vacías. Con
una plantilla propia, la aplicación y Revit comparten los mismos nombres y no
hay nada que adivinar.

---

## Qué tiene la versión 1

| | |
|---|---|
| **Unidades** | Centímetros, con un decimal. Áreas en m², volúmenes en m³ |
| **Niveles** | `PLANTA BAJA` a 0 y `PLANTA ALTA` a 300 cm |
| **Muros** | `BA Muro 7, 10, 12, 15, 18, 20, 25` — una sola capa, sin materiales |
| **Pisos** | `BA Piso 2, 10, 20` |
| **Cielos rasos** | `BA Cielo raso 2, 10` |
| **Familias** | `BA Puerta`, `BA Ventana` y `BA Punto electrico` con sus 22 tipos |

**Los muros no tienen material ni color a propósito.** Bruno lo pidió así: *"no
necesito que el muro tenga colores ni nada, simplemente que el muro sea de
quince, pero que esté preparado para cuando el muro sea de doce"*. El espesor es
lo único que define al tipo; el acabado se decide en el proyecto.

**Las familias son deliberadamente básicas y paramétricas.** Una sola puerta que
se estira a 80, 87 o 90 cm, en vez de un catálogo de puertas. Lo mismo la
ventana. El punto eléctrico es una sola familia hospedada en muro, con un tipo
por cada punto del catálogo de la aplicación.

## Qué falta

En el orden en que conviene hacerlo:

1. **Geometría de las familias.** Hoy la puerta abre el vano pero no tiene hoja
   dibujada, y el punto eléctrico es la caja base sin símbolo propio. Alcanza
   para relevar; no alcanza para un plano presentable.
2. **Luminarias paramétricas** — redonda o rectangular, simple o doble.
3. **Vistas y plantillas de vista**: planta de arquitectura, planta de cielo
   raso, plano eléctrico.
4. **Textos y cotas** con Arial, que es la tipografía sustituta de la marca en
   Revit y en planos.
5. **Mobiliario básico estirable** para la etapa de distribución: cama, sofá,
   sofá en L, poltrona, banco. Bruno los pidió *"súper básicos, cavernícolas"*,
   y sobre todo **que se estiren**.
6. Las piezas de la plantilla de Gigi que sí le sirven y quiere conservar: los
   nichos y el ropero hecho con muro cortina.

## Cómo se regenera

La receta está en `crear-plantilla-ba.cs`: es el código que se le mandó a Revit
para armarla, guardado tal cual se ejecutó. Se corre con el conector `revit`
encendido (*Revit MCP Switch*, en la pestaña Add-Ins) y **vuelve a escribir el
archivo desde cero**, así que lo que se haya agregado a mano en la plantilla se
pierde. Si algo se ajusta a mano adentro de Revit, hay que anotarlo acá.

Las familias propias viven aparte, en `pyrevit/familias/`, y se cargan solas en
cualquier proyecto que no las tenga.
