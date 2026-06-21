@AGENTS.md

# App de Administración de Créditos

Aplicación Next.js 16 (App Router) para gestión de créditos en COP. UI en español.

## Arquitectura

- **BD**: Prisma 7 con SQLite (dev) vía driver adapter `@prisma/adapter-better-sqlite3`.
  El cliente se genera en `generated/prisma` y se importa desde `@/generated/prisma/client`.
  Cliente singleton en `lib/db.ts`. Esquema portable a PostgreSQL (sin enums nativos
  ni Decimal; dinero en pesos enteros con `Float`, validación de valores con Zod).
- **Auth**: Auth.js v5. `auth.config.ts` (edge-safe, usado por `proxy.ts`),
  `auth.ts` (provider de credenciales con bcrypt). Helpers en `lib/auth.ts`
  (`requireUser`, `requireRol`, `puedeEscribir`, `esAdmin`). Roles: ADMIN, COBRADOR, CONSULTA.
- **Lógica financiera**: `lib/finanzas/` (funciones puras, con tests en
  `lib/finanzas/finanzas.test.ts`): `calcularPlanPagos` (SIMPLE/CUOTA_FIJA/PLANO),
  `distribuirAbono` (orden multa→interés→capital), `calcularMora`,
  `calcularResumenCredito`, `generarMensajeCobro`.
- **Mutaciones**: Server Actions en `app/(panel)/*/actions.ts`, validadas con Zod
  (`lib/validaciones.ts`), patrón `FormState` (`lib/forms.ts`). Toda escritura
  registra auditoría (`lib/auditoria.ts`).
- **Recálculo de mora/estados**: `lib/jobs/actualizarEstados.ts`, expuesto en
  `app/api/cron/recalcular` (token `CRON_SECRET` o sesión ADMIN).
- **UI**: componentes en `components/ui/` y `components/panel/`. Formato en `lib/format.ts`
  (`formatCOP`, `formatFecha`). Constantes/etiquetas en `lib/constantes.ts`.

## Convenciones importantes

- El dinero se maneja en **pesos enteros**; redondear con `redondearPesos` (decimal.js).
- `tasaInteres` se almacena como **fracción** (0.10 = 10%); el formulario pide porcentaje.
- Las rutas del panel viven en `app/(panel)/` y están protegidas por `proxy.ts` + `requireUser`.
- Next 16 usa `proxy.ts` (no `middleware.ts`).

## Comandos

`npm run dev` · `npm test` · `npm run db:seed` · `npm run build`
