# El botón de Revit — cómo se instala y cómo se usa

Acá vive el botón **Traer relevamiento**: el que agarra el archivo que sale del
teléfono y arma adentro de Revit los muros, las puertas, las ventanas, los
ambientes y todo lo demás.

Vive en el mismo repositorio (repo) que la app —la carpeta del proyecto con su
historial de cambios— y no en `F:\BA ARQUITECTURA\pyRevitExtensions`, porque lee
el mismo formato de archivo que escribe la app: los dos tienen que cambiar juntos
o el botón deja de entender lo que le mandan.

---

## Instalarlo una sola vez

1. Abrir Revit y entrar a la pestaña **pyRevit**.
2. Apretar **Settings** (la configuración).
3. En **Custom Extension Directories** apretar **Add Folder** y elegir esta carpeta:

   ```
   E:\BRUNO_CLAUDE\BA_ARQUITECTURA\app-entrevistas\pyrevit
   ```

4. Apretar **Save Settings and Reload**.

Aparece una pestaña nueva, **BA**, con el panel **Relevamiento** y el botón
adentro. La carpeta que ya estaba cargada (`pyRevitExtensions`, con AldanaFurniture
y ConsolaParametrica) sigue igual: esto se suma, no la reemplaza.

## Usarlo

1. Pasar el archivo del relevamiento del teléfono a la computadora (AirDrop,
   WhatsApp, o el botón de descargar de la app). Es un archivo `.json`.
2. Abrir en Revit **el proyecto donde se quiere traer** el relevamiento.
3. Pestaña **BA** → **Traer relevamiento** → elegir el archivo.
4. Aparece un cartel con lo que se va a crear. Si está bien, **Sí**.
5. Al terminar se abre el informe: qué entró, qué no pudo entrar y **qué medidas
   quedaron a ojo**.

**El botón nunca borra ni modifica nada de lo que ya estaba en el modelo.** Solo
agrega. Si algo sale mal, deshacer (Ctrl+Z) una vez alcanza: todo entra como un
solo movimiento.

Correrlo dos veces sobre el mismo proyecto **crea todo de nuevo**, duplicado. Si
hubo que corregir algo en el teléfono, conviene deshacer lo anterior antes de
volver a apretar el botón.

## Lo que crea

Niveles, muros con su espesor y su altura, puertas y ventanas con su tipo,
vanos, columnas, ambientes con su piso, cielos falsos con sus bandejas, vigas y
los puntos eléctricos con la altura de la norma NB 777.

Los tipos que el proyecto no tenga se crean solos, siempre con el prefijo `BA `
—`BA Muro 15`, `BA 80 x 210`—, así se distinguen de los de la plantilla de Gigi
y se pueden borrar juntos.

**Las molduras entran como líneas de modelo** a la altura del cielo, no como el
sólido de la gola: el perfil de cada moldura se define adentro de Revit y no hay
forma de adivinarlo desde el teléfono. La línea deja el recorrido exacto para
barrerlo ahí.

## Lo que queda afuera

Muros curvos, escaleras, muebles, materiales y acabados, vistas y láminas. Y
volver a leer un archivo ya traído para actualizar solo lo que cambió: por ahora
cada corrida crea elementos nuevos.

---

## Para el que toque el código

```
pyrevit/
  BA.extension/
    BA.tab/Relevamiento.panel/TraerRelevamiento.pushbutton/   el botón
    lib/barelevamiento/   lo que se prueba sin Revit
      lectura.py   valida el archivo y avisa en castellano qué le falta
      unidades.py  centímetros a pies, pantalla a Revit, nombres de tipo
      plan.py      el relevamiento convertido en una lista de órdenes
      informe.py   el texto final
    lib/barevit/    lo que necesita la API de Revit
      tipos.py       busca el tipo que hace falta, o lo fabrica
      constructor.py ejecuta las órdenes
  pruebas/          las pruebas y los archivos de ejemplo
```

La idea de fondo es **plan puro, ejecución tonta**: todo lo que se puede
equivocar —unidades, coordenadas, hacia dónde abre una puerta— se resuelve en
`plan.py`, que no toca Revit. El constructor solo ejecuta.

Las pruebas corren con el Python de la computadora, sin abrir Revit:

```
cd pyrevit/pruebas
python -m unittest discover
```

Los archivos de `pruebas/fixtures/` **no se editan a mano**: los escribe el motor
de verdad de la app. Si cambia el formato, se regeneran con

```
npx tsx pyrevit/pruebas/generar.mts
```

y las pruebas de Python acusan cualquier diferencia.
