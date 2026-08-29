# Cómo volver atrás

Guía para Bruno. Nada de lo que hay acá borra trabajo: el historial guarda todas
las versiones y siempre se puede ir a cualquiera de ellas y volver.

---

## Primero, tres palabras

- **Repositorio (repo)** = la carpeta del proyecto con todo su historial de
  cambios. Es `app-entrevistas`.
- **Commit** = una foto del proyecto entero en un momento dado, con un texto que
  explica qué cambió. El historial es la fila de esas fotos.
- **Rama (branch)** = una línea de trabajo paralela. Se puede saltar de una a
  otra sin perder nada de ninguna.

Todos los comandos se escriben en la terminal, parado dentro de
`E:\BRUNO_CLAUDE\BA_ARQUITECTURA\app-entrevistas`.

---

## El punto de rescate

Antes de aplicar el manual de marca se guardó una foto de la aplicación tal como
estaba, y se le puso un nombre para poder encontrarla sin memorizar códigos:

```
antes-de-marca
```

Ese nombre se llama **etiqueta (tag)**. Es un marcador pegado a un commit.

**Desde el 29/08/2026 el rediseño es la versión oficial:** está en `main`, la rama
principal, y es la que se publica en internet. Las dos ramas viejas quedaron
guardadas y no se tocan: `marca-visual` (donde se hizo el trabajo) y
`propuesta-comercial` (la aplicación como estaba antes del rediseño).


---

## Las tres formas de volver, de la más suave a la más brusca

### 1. Solo mirar cómo era antes (no cambia nada)

```bash
git stash
git checkout antes-de-marca
```

Ahí los archivos vuelven a como estaban. Se puede levantar la aplicación con
`npm run dev` y verla. Para volver al rediseño:

```bash
git checkout main
```

`git stash` guarda aparte lo que haya sin terminar; si no hay nada sin guardar,
avisa y no hace nada. Para recuperar eso después: `git stash pop`.

### 2. Volver del todo, pero dejando el rediseño guardado

Es la opción recomendada si el cambio no gusta. La rama `propuesta-comercial`
tiene la aplicación como estaba y no se tocó:

```bash
git checkout propuesta-comercial
```

El rediseño no se pierde: sigue entero en `main`, la rama principal, y se vuelve
a él cuando sea con `git checkout main`.

### 3. Deshacer un commit puntual

Si lo que molesta es un cambio específico y no todo el rediseño, se puede
deshacer solo ese. Primero se mira el historial:

```bash
git log --oneline
```

Sale una lista así, la más reciente arriba:

```
9d08648 Ajustes de contraste y de movimiento tras revisar la app en pantalla
66a0a65 La aplicación pasa al lenguaje visual del manual de marca
35cb1ea Punto de seguridad antes del rediseño de marca
```

Ese código de siete caracteres identifica el commit. Para deshacerlo:

```bash
git revert 9d08648
```

`revert` no borra nada: agrega un commit nuevo que hace lo contrario del
anterior. El historial queda completo y se puede volver a deshacer el revert.

---

## Lo que conviene no usar

`git reset --hard` **sí borra** trabajo sin guardar y sin preguntar. No hace
falta en ninguno de los casos de arriba. Si alguna vez parece la única salida,
mejor preguntar antes.

---

## Cómo saber dónde estoy parado

```bash
git status
```

La primera línea dice en qué rama se está. `git log --oneline -5` muestra las
últimas cinco fotos del historial.
