# La aplicación en internet

Guía para Bruno. Desde el 29/08/2026 la aplicación de entrevistas está publicada
y se abre desde cualquier dispositivo.

## 🔗 https://bruno-aldana-arquitectura.vercel.app

---

## Primero, cuatro palabras

- **Publicar (deploy)** = subir la versión de hoy a internet, para que el link
  la muestre. Mientras no se publica, los cambios existen solo en tu
  computadora.
- **Vercel** = la empresa donde vive la aplicación publicada. Es la que da ese
  link. La cuenta es la tuya (`brunoaldanab`).
- **Neon** = donde viven los datos: los contactos, las entrevistas, las
  cotizaciones. Es una base de datos en internet, aparte de la aplicación.
- **Producción** = la versión publicada, la de verdad, la que abre el link.

---

## Las dos aplicaciones y una sola base de datos

| | El link publicado | `http://localhost:3000` |
|---|---|---|
| Dónde vive | En internet | En tu computadora |
| Quién la abre | Vos, desde cualquier dispositivo | Vos, y solo en esa máquina |
| Cuándo anda | Siempre | Solo con `npm run dev` corriendo |
| Para qué | Usarla de verdad con el cliente | Probar cambios antes de publicarlos |

**Las dos leen y escriben la misma base de datos.** Un contacto cargado en el
celular durante una visita aparece después en tu computadora. No hay que copiar
nada de un lado al otro.

---

## Quién puede entrar

Pide correo y contraseña — los mismos que ya usás. Sin eso, el link no muestra
nada, ni siquiera la lista de contactos.

Esto importa más de lo que parece: adentro están los datos y las fotos de tus
clientes. **El link no se comparte con nadie.** No es una página de muestra: es
tu herramienta de trabajo.

---

## Tenerla a mano en el celular

Abrí el link en el navegador del celular y usá **"Agregar a pantalla de inicio"**
(en el botón de compartir). Queda un ícono como el de cualquier otra aplicación
y abre a pantalla completa, sin la barra del navegador. Es como conviene usarla
en la visita.

---

## Publicar un cambio nuevo

Los cambios no aparecen solos en el link. Se publican a propósito, cuando estás
conforme con lo que se probó en `localhost`. El comando, parado dentro de
`app-entrevistas`:

```bash
npx vercel --prod
```

Tarda menos de un minuto. Cuando termina, el link de siempre ya muestra la
versión nueva; no cambia de dirección.

**También se publica sola.** Vercel está conectada a GitHub, así que cada vez que
el código llega a la rama principal (`main`) se publica una versión nueva sin
que nadie escriba el comando. Por eso los cambios se guardan primero en una
rama aparte y recién pasan a `main` cuando vos estás conforme.

---

## Si algo sale mal en la versión publicada

Se vuelve a la versión anterior **desde la página de Vercel**, sin tocar la
terminal y sin perder nada:

1. Entrar a <https://vercel.com/ba-ed54/bruno-aldana-arquitectura>
2. Pestaña **Deployments**: es la lista de todas las versiones publicadas, la
   más nueva arriba.
3. En la que andaba bien, el botón **⋯** → **Promote to Production**
   ("promover a producción").

El link vuelve a esa versión en segundos. Las versiones anteriores no se borran:
siempre se puede ir y volver.

Esto es distinto de volver atrás en el código de tu computadora, que está
explicado en `como-volver-atras.md`. Acá se cambia lo que ve el link; allá, lo
que hay en tu carpeta.

---

## Lo que cuesta

Hoy nada: tanto Vercel como Neon tienen un plan gratuito y este uso entra
holgado. Si algún día el uso creciera, avisan antes de cobrar.
