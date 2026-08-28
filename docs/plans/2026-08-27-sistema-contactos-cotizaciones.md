# Sistema de Contactos y Cotizaciones — Plan de diseño

Estudio de arquitectura/diseño de interiores de Bruno (Bolivia). Sistema propio
de gestión de clientes, no una herramienta no-code. Basado en el brief
original en `GESTION DE CLIENTES/brief ba.txt`.

## Punto de partida

`GESTION DE CLIENTES/Entrevista_Diseno_Interiores_v2_5.html` es un wizard de
entrevista a clientes ya construido (tipo de proyecto, estilo, paleta,
materiales, ambiente por ambiente, presupuesto, plazos). Hoy vive 100% en el
navegador, sin persistencia. Su función `getSteps()` arma dinámicamente la
lista de pasos según `state.proyecto.tipoProyecto`
(`oficina` / `ambiente-unico` / vivienda por defecto); esa lógica de
ramificación se preserva 1:1 al portarla a componentes React que leen/escriben
el mismo estado compartido.

## Alcance del MVP

**Sí:**
- Login único (admin = Bruno)
- CRUD de Contactos
- CRUD de Cotizaciones, ligadas a un contacto
- Ficha de Entrevista portada al sistema, ligada a un contacto, con
  autoguardado en base de datos

**No (explícitamente fuera de alcance):**
- Seguimiento de obra/proyecto post-aprobación
- Desglose de ítems de precio en la cotización (monto total a mano)
- Multi-usuario / roles
- Portal de cliente con link de solo lectura (se deja el modelo de datos
  abierto para esto, no se construye ahora)
- i18n (la app es en español únicamente)

## Modelos de datos

**Contacto:** nombre, teléfono, email, dirección del proyecto, notas libres,
origen (Instagram, referido, web, etc.)

**Cotización:** ligada a un contacto. título/label, monto total (Decimal,
opcional), moneda (BOB | USD, default BOB), estado
(BORRADOR → ENVIADA → APROBADA / RECHAZADA), notas, sentAt, decidedAt.

**Entrevista:** ligada a un contacto. `data` (JSON) con el estado completo del
wizard, autoguardado.

## Stack

Next.js (App Router) + TypeScript estricto + Prisma + PostgreSQL vía Neon
(Vercel Storage/Marketplace) + Tailwind CSS. Deploy en Vercel (plan Hobby).
Auth casera: bcryptjs + cookie httpOnly firmada con `jose` (JWT), verificada
en `middleware.ts` (Edge runtime).

Se descartó no-code (Notion/Airtable) porque el sistema tiene que poder crecer
con el tiempo. Se descartó NextAuth/Auth.js porque un solo usuario admin no lo
justifica; se puede migrar el día que sumen colaboradores.

## Gotchas técnicos a aplicar desde el arranque

Ver el detalle completo en `GESTION DE CLIENTES/brief ba.txt`, sección 4:
versión de Prisma fijada (no el tag `latest`), conexión movida a
`prisma.config.ts` (Prisma 7), import del cliente generado desde subpath,
adapter de Neon con URL *pooled* en runtime (URL directa solo para
CLI/migraciones), override de `deepmerge-ts` para `npm audit`, script de
build de Vercel con `prisma generate && prisma migrate deploy`, apagar el
toggle "Auth" de Neon al crear la base, permisos de la GitHub App de Vercel
por repo, y traer env vars locales con `vercel env pull` en vez de copiarlas
a mano.

## Orden de trabajo

"Online cuanto antes": cada pieza se despliega a Vercel apenas está lista, en
vez de construir todo local y desplegar al final. Commits chicos y
descriptivos. Secuencia completa (17 pasos) en el brief original; resumen:

1. git init + este doc (hecho)
2. Escafoldar Next.js sin pisar `GESTION DE CLIENTES/`
3. Repo privado en GitHub (acción de Bruno) → conectar remoto → push
4. Conectar Vercel, primer deploy
5. Postgres (Neon) vía Vercel Storage, plan Free, Auth apagado
6. Traer env vars, configurar Prisma con los gotchas ya resueltos
7. `schema.prisma` (Admin, Contacto, Cotizacion, Entrevista) + migración
8. `SESSION_SECRET`, login casero, middleware
9. Seed del usuario Admin (Bruno da email/contraseña)
10. CRUD de Contactos → CRUD de Cotizaciones → portar ficha de Entrevista
11. Verificación final: `tsc --noEmit`, `npm run build`, prueba real en
    navegador (local y producción)
