# Administración de Créditos

Aplicación web para administrar créditos otorgados a personas: cartera, abonos,
multas por mora, tablero de control y mensajes de cobro. UI en español, moneda en
pesos colombianos (COP).

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Prisma 7** + **SQLite** (desarrollo) — portable a **PostgreSQL** (producción)
- **Auth.js (NextAuth v5)** — credenciales con roles (ADMIN, COBRADOR, CONSULTA)
- **Tailwind CSS v4**, validación con **Zod**, cálculos con **decimal.js**
- Exportación a **Excel** (exceljs) y **PDF** (@react-pdf/renderer)

## Puesta en marcha (desarrollo)

```bash
npm install
npx prisma migrate dev      # crea la base de datos SQLite
npm run db:seed             # crea usuarios y configuración inicial
npm run dev                 # http://localhost:3000
```

### Usuarios de prueba (creados por el seed)

| Rol         | Correo                   | Contraseña   |
|-------------|--------------------------|--------------|
| Administrador | admin@creditos.local   | admin123     |
| Cobrador    | cobrador@creditos.local  | cobrador123  |
| Consulta    | consulta@creditos.local  | consulta123  |

> Cambia estas credenciales antes de usar en un entorno real.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` / `npm start` — build y servidor de producción
- `npm test` — pruebas unitarias (Vitest) de la lógica financiera
- `npm run db:seed` — siembra usuarios y configuración de multa
- `npm run db:studio` — Prisma Studio
- `npm run db:reset` — reinicia la base de datos

## Funcionalidades

- **Tablero**: total prestado, recaudado, saldo por cobrar, créditos activos,
  vencidos, en mora, multas acumuladas y próximos vencimientos.
- **Deudores**: registro y administración de personas.
- **Créditos**: pago único o en cuotas; tres métodos de interés configurables por
  crédito: **simple** (sobre saldo), **cuota fija** (amortización francesa) y
  **plano** (sobre capital). Periodicidad diaria/semanal/quincenal/mensual/única.
- **Abonos**: pagos parciales o totales; se aplican en orden multa → interés →
  capital, con historial e identificación de quién registró cada pago.
- **Multas por mora**: configurables (porcentaje o valor fijo, días de gracia,
  por día de mora). Se recalculan con `/api/cron/recalcular` o desde Configuración.
- **Mensajes de cobro**: texto listo para copiar o enviar por WhatsApp.
- **Reportes**: exportación a Excel y PDF.
- **Auditoría**: registro de todas las operaciones.

## Recálculo de mora (cron)

El endpoint actualiza multas y estados de toda la cartera:

```
GET /api/cron/recalcular?token=<CRON_SECRET>
```

Programable con un cron externo (por ejemplo Vercel Cron) usando `CRON_SECRET`.
También puede ejecutarse desde **Configuración → Recalcular ahora** (ADMIN).

## Variables de entorno (`.env`)

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="..."     # genera uno con: npx auth secret
CRON_SECRET="..."     # token para el endpoint de recálculo
```

## Pasar a PostgreSQL (producción)

1. En `prisma/schema.prisma` cambia `datasource db { provider = "postgresql" }`.
2. Ajusta `DATABASE_URL` con la cadena de conexión de tu Postgres (Neon, Supabase, etc.).
3. Reemplaza el adaptador en `lib/db.ts` y `prisma/seed.ts` por
   `@prisma/adapter-pg` (`npm i @prisma/adapter-pg pg`).
4. Ejecuta `npx prisma migrate dev` para generar las migraciones de Postgres.

El esquema es portable: no usa enums nativos (se validan con Zod) y el dinero se
almacena en pesos enteros, por lo que la migración es directa.
