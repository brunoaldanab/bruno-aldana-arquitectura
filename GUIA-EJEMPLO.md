# Rehacer la propuesta de ejemplo de la landing

La landing publica un PDF de muestra en `landing/public/propuesta-ejemplo.pdf`, con su
portada en `landing/public/propuesta-portada.jpg`. Los dos salen de esta aplicación.

**Hay que rehacerlos cada vez que cambie una condición comercial** —la tarifa, el
anticipo, el plazo, las rondas incluidas— porque el documento publicado deja de decir
la verdad. También conviene rehacerlos si cambia el diseño de la propuesta.

## Cómo se rehace

Con la aplicación corriendo (`npm run dev`), desde esta carpeta:

```
node generar-ejemplo.mjs
```

Devuelve el `id` del contacto de ejemplo y un `token` de sesión. Con eso:

1. Se abre `http://localhost:3000/contactos/<id>/propuesta` con la cookie `session`
   puesta en ese token.
2. Se imprime a PDF en tamaño A4, con fondos, sobre `landing/public/propuesta-ejemplo.pdf`.
3. Se recorta el elemento `.hoja-portada` y se guarda como
   `landing/public/propuesta-portada.jpg`, 900 px de ancho.
4. **Se borra el contacto**: `node generar-ejemplo.mjs --borrar <id>`.

## Por qué está armado así

- **Los datos son inventados.** El documento se publica en internet: no puede llevar
  información de un cliente real. El contacto se llama "Familia Rojas Vargas (ejemplo)"
  y se borra apenas el PDF está impreso, para no ensuciar la lista de clientes.
- **El ejemplo es un departamento de 70 m² en cinco ambientes.** 70 m² es el proyecto
  promedio de Bruno, así que la muestra representa el caso típico y no uno extremo.
- **La portada va sin foto, a propósito.** La portada sale de la referencia de estilo
  mejor puntuada, y esas referencias son fotos de terceros que Bruno juntó para la
  entrevista. Mostrárselas a un cliente en una reunión es una cosa; publicarlas en un
  PDF descargable desde la web es otra, y ahí sí hay un problema de derechos. Si algún
  día la portada lleva imagen, tiene que ser un render propio.
- **La sesión se firma con `SESSION_SECRET`** en vez de pedirle la contraseña a Bruno.
  Es su propio sistema y su propio secreto, y así el proceso no depende de que él esté
  presente.
- **Va por SQL directo y no por Prisma.** El cliente de Prisma 7 se genera en TypeScript
  dentro de `src/`, y hacerlo andar desde un script suelto pide más andamiaje del que
  justifica insertar dos filas.
