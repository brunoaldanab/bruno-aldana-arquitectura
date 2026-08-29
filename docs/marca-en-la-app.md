# La marca dentro de la aplicación

Cómo se aplicó el manual de marca 1.0 a la app de entrevistas, y dónde tocar
cada cosa si mañana hay que cambiarla. El manual completo vive en
`marca/` y su versión operativa en la skill `/marca`.

---

## Dónde vive cada decisión

| Qué | Archivo |
|---|---|
| Paleta, tipografía, etiquetas, chips, escenas | `src/app/globals.css` |
| Carga de las dos fuentes y el favicon | `src/app/layout.tsx` |
| Curvas y duraciones de movimiento (JavaScript) | `src/lib/movimiento.ts` |
| Curvas de movimiento (CSS) | `src/app/globals.css`, bloque `:root` |
| El documento que se lleva el cliente | `src/app/contactos/[id]/propuesta/propuesta.css` |
| Vectores de la firma y del logo | `public/` |

**Regla:** ningún componente inventa un color, una fuente ni una curva. Todo
sale de esos dos archivos.

---

## La paleta

Los cinco valores del manual y ninguno más. Están cargados como la escala
`neutral` de Tailwind, conservando la dirección de siempre —50 lo más claro,
950 lo más oscuro— para que los velos sobre las fotos, que se apoyan en
`neutral-950`, sigan funcionando sin tocarlos.

| Clase | Valor | Rol en el manual |
|---|---|---|
| `neutral-950` | `#0F1113` | Grafito — fondo de todo |
| `neutral-900` | `#171A1C` | Bloque — tarjetas y tablas |
| `neutral-500` | `#888E92` | Secundario — texto de apoyo |
| `neutral-100` | `#E9E7E4` | Tinta — texto principal |
| `neutral-50` | `#F2F1EE` | Claro — impresión |

Los valores intermedios son puentes entre esos cinco; no son colores nuevos.

**No hay color de acento.** El azul que tenía la app antes se sacó entero. Si
una pantalla necesita color, lo pone el render del proyecto que se está
mostrando. Los semánticos (error, éxito, información) son la única excepción que
admite el manual y existen solo dentro de la app, nunca en el documento del
cliente.

### Cómo se construye la jerarquía sin color

Con luz, no con matiz. La acción principal es el único bloque claro de la
pantalla —relleno en tinta con el texto en grafito— y por eso se encuentra sola.
Lo secundario es luz al 7 % sobre grafito. Cuanto más se separa del fondo, más
importante es.

---

## La tipografía

**Archivo** y **JetBrains Mono**, las dos de Google Fonts, cargadas por
`next/font` (o sea que se sirven desde el propio dominio y no se pide nada a
Google en cada visita).

| Rol | Cómo se escribe |
|---|---|
| Título grande | `font-display text-4xl font-extralight tracking-[-0.03em]` |
| Texto | Por defecto — el `body` ya está en Archivo 300 con interlineado 1,65 |
| Etiqueta | La clase `rotulo` |
| Dato (teléfono, metros, precio, fecha) | La clase `dato` |

Las clases `rotulo` y `dato` están en `globals.css` y traen la fuente, el
tamaño, las mayúsculas y el interletrado de una sola vez.

**El peso 200 nunca va por debajo de 24 px.** Por eso `tracking-[-0.03em]` se
escribe título por título y no como regla global: si fuera global se aplicaría
también a los textos chicos, donde ese peso está prohibido.

**El énfasis se hace con tamaño y espacio, nunca con negrita.** No quedó ningún
`font-semibold` ni `font-bold` en la aplicación.

---

## La firma y el logo

En `public/` están los vectores que usa la app:

| Archivo | Dónde se usa |
|---|---|
| `firma-horizontal-blanco.svg` | Encabezado, ingreso, todas las hojas de la propuesta |
| `firma-vertical-blanco.svg` | Portada de la aplicación |
| `ab-cuadrado-negro.svg` | Favicon |

**La firma no se re-tipea nunca.** Antes el encabezado escribía "Bruno Aldana
Arquitectura" con la fuente de la interfaz; ahora entra el vector, que tiene el
texto convertido a curvas. En la propuesta la razón es todavía más concreta: el
documento se imprime y se manda por correo, y un nombre tipeado dependería de
que Archivo esté instalada en la máquina que lo abra.

**El logo no se anima.** Es regla explícita del manual.

---

## El movimiento

La regla de fondo del manual: **cuanto más veces al día se ve algo, menos se
mueve.** El presupuesto de animación se gasta en lo que se ve poco y tiene que
impresionar.

| Pantalla | Cuántas veces se ve | Qué se anima |
|---|---|---|
| Encabezado | Cien veces al día | **Nada.** Solo el color del enlace |
| Lista de contactos | Decenas de veces al día | Un fundido y nada más. Sin escalonar fila por fila |
| Wizard de entrevista | Unas pocas veces por semana, con el cliente al lado | Corte de plano entre pasos, arrastre con inercia, íconos que se dibujan |
| Portada | Una vez por sesión | Entrada escalonada de la firma y los botones |
| Propuesta | Una vez por cliente | **Nada.** Es un documento para leer, no para mirar entrar |

Solo se anima **opacidad y `transform`**. En esta pasada se sacaron los
desenfoques que animaban el paso del wizard y el navegador ⌘K: además de estar
fuera de la regla, obligaban al navegador a repintar el elemento más grande de
la pantalla en cada cuadro.

**La única excepción viva** es la escena cinematográfica
(`EscenaCinematica.tsx`), que sí anima un desenfoque al cambiar de plano. Es una
sola capa de imagen, es el momento de mayor impresión de la entrevista, y ahí el
desenfoque es el efecto, no un adorno. Queda anotada como excepción consciente.

`prefers-reduced-motion` se respeta en todos los casos y se implementa junto con
la animación, nunca después.

---

## El entregable

La propuesta se guarda como PDF desde el diálogo de impresión del navegador: no
hay ninguna biblioteca de por medio y lo que se ve en pantalla es exactamente lo
que se guarda.

- **La portada y las bandas** van en grafito con la foto del proyecto tratada
  con el mismo grado que el resto de la aplicación.
- **El papel de las hojas interiores** es el claro de la marca (`#F2F1EE`), con
  la tinta en `#111111` como manda el manual para fondo claro.
- **El nombre del archivo** sale como `Propuesta - Nombre del cliente - fecha`.
  El navegador propone como nombre el título de la pestaña, así que la app se lo
  cambia justo antes de abrir el diálogo y lo devuelve después. Sin eso todas
  las propuestas se descargaban con el mismo nombre.

---

## Volver atrás

El estado anterior al rediseño quedó marcado con la etiqueta `antes-de-marca`.
El procedimiento completo está en `docs/como-volver-atras.md`.
