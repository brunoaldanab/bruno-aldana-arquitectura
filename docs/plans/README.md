# Planes

Carpeta de planes de trabajo del proyecto. Cada archivo es autocontenido: describe el problema con archivo y línea, el resultado exacto que se busca, los pasos, los límites y cómo verificar que quedó bien. Están escritos para que los pueda ejecutar cualquiera —incluida una sesión nueva sin contexto— sin tener que adivinar.

## Planes de movimiento y polish (auditoría del 28/08/2026)

Salieron de una auditoría de animación sobre el commit `8919019`, contrastando el código contra el catálogo de reglas de la skill `improve-animations`.

**Contexto que explica las prioridades:** la ficha de entrevista se usa en una tablet, en la casa del cliente, con el cliente mirando. Por eso los hallazgos de rendimiento pesan más que los de estética: en una notebook no se notan, y ahí sí.

| # | Plan | Gravedad | Estado |
|---|---|---|---|
| 001 | [El cambio de paso deja de pelear consigo mismo](001-cambio-de-paso-deja-de-pelear.md) | ALTA | TODO |
| 002 | [El motor de escena escribe en el elemento que consume](002-motor-de-escena-escribe-en-el-consumidor.md) | MEDIA | TODO |
| 003 | [Un solo vocabulario de movimiento](003-un-solo-vocabulario-de-movimiento.md) | MEDIA | TODO |
| 004 | [El pase de fotos responde al gesto](004-el-pase-de-fotos-responde-al-gesto.md) | MEDIA | TODO |
| 005 | [Duraciones dentro del presupuesto](005-duraciones-dentro-del-presupuesto.md) | BAJA | TODO |
| 006 | [El chip deja de animar su ancho, y dos momentos ganan el suyo](006-el-chip-y-los-momentos-que-importan.md) | ALTA / BAJA | TODO |

## Orden recomendado

```
001  →  006  →  002  →  004  →  005  →  003
```

1. **001** primero: es el que más se nota. Cuatro animaciones que se estorban en cada cambio de paso, dos de ellas moviendo el layout.
2. **006** segundo: su parte 6a arregla el control más usado de toda la app. Los chips animan su propio ancho, que es la operación más cara que existe, y el cliente los toca decenas de veces por entrevista.
3. **002**: baja el costo del scroll y del parallax. No cambia nada visible.
4. **004**: el pase de fotos empieza a responder a la fuerza del gesto.
5. **005**: dos duraciones que se pasan del presupuesto.
6. **003 último, obligatorio**: es un barrido que unifica las curvas escritas a mano. Los planes 001, 004 y 005 ya eliminan varias de ellas por el camino, así que correrlo antes genera conflictos sobre las mismas líneas.

## Dependencias

- **003 depende de 001, 004 y 005.** Es la única dependencia dura. Está anotada dentro del propio plan.
- Los demás son independientes entre sí y se pueden ejecutar sueltos o en otro orden, salvo por lo anterior.
- Cada plan lista en su sección **Límites** los archivos y líneas que pertenecen a otro plan, para que dos ejecuciones no se pisen.

## Si se ejecutan por separado

Cada plan trae su propia sección de verificación con dos partes: la mecánica (`npx tsc --noEmit`, `npm run lint`) y el *feel check*, que es mirar la interfaz y confirmar cosas concretas. **El feel check no es opcional**: el movimiento puede estar mecánicamente correcto y sentirse mal igual, y varios de estos planes tienen un punto donde el resultado hay que juzgarlo con el ojo (el radio achatado de la barra de progreso en 001, el ancho del ✓ en 006).

Nota sobre `npx tsc --noEmit`: si no se corrió `next dev` o `next build` antes, reporta `Cannot find name 'LayoutProps'` en `src/app/layout.tsx:26`. Es un tipo que genera Next al arrancar, no un error del código.

## Otros planes

| Plan | Estado |
|---|---|
| [Sistema de contactos y cotizaciones](2026-08-27-sistema-contactos-cotizaciones.md) | Implementado |
