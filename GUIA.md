# Guía de la aplicación — Administración de Créditos

Guía completa para usar y explicar la aplicación.

---

## 1. ¿Qué es?

Una aplicación web para **administrar créditos** otorgados a personas: registrar
deudores y préstamos, llevar el control de abonos, calcular intereses y multas por
mora, ver el estado de la cartera en un tablero y generar mensajes de cobro.
Todo en pesos colombianos (COP) y en español.

**Acceso:** `http://IP-DEL-VPS:3100`

---

## 2. Usuarios y roles

Hay tres perfiles de acceso:

| Rol | Qué puede hacer |
|-----|-----------------|
| **Administrador** | Todo: usuarios, configuración de multas, crear/editar/eliminar créditos, ver auditoría y reportes. |
| **Cobrador** | Registrar abonos, crear deudores y créditos, generar mensajes de cobro. No administra usuarios ni configuración. |
| **Consulta** | Solo ver (tablero, créditos, reportes). No modifica nada. |

**Usuarios de prueba (creados automáticamente):**
- Administrador → `admin@creditos.local` / `admin123`
- Cobrador → `cobrador@creditos.local` / `cobrador123`
- Consulta → `consulta@creditos.local` / `consulta123`

> 🔐 Cambia estas contraseñas o crea tus propios usuarios desde **Usuarios**.

---

## 3. Conceptos clave

### Métodos de interés (se elige al crear cada crédito)
- **Interés simple sobre saldo:** el interés de cada cuota se calcula sobre el saldo
  que falta. El capital se reparte en partes iguales; el interés baja con el tiempo.
- **Cuota fija (amortización):** todas las cuotas valen casi lo mismo (capital +
  interés), como en un crédito de banco.
- **Interés plano sobre capital:** el interés se calcula sobre el monto prestado
  original y se reparte por igual entre las cuotas.

### Periodicidad
Cada cuánto se paga: **diaria, semanal, quincenal, mensual** o **pago único**.

### Estados de un crédito
- **Activo:** al día, sin cuotas vencidas.
- **En mora:** tiene cuotas vencidas (genera multa).
- **Vencido:** pasó la fecha final de pago.
- **Cancelado:** pagado por completo.

### Multas por mora
Se configuran una sola vez (módulo **Configuración**):
- **Tipo:** porcentaje del saldo o valor fijo en pesos.
- **Días de gracia:** días de atraso permitidos antes de cobrar multa.
- **Por día de mora:** si la multa se multiplica por cada día de atraso.

La multa se aplica automáticamente al **recalcular** (ver sección 9).

---

## 4. El Tablero (pantalla principal)

Muestra el resumen de la cartera **del día**:
- **Total prestado**, **total recaudado**, **saldo por cobrar**, **multas acumuladas**.
- **Créditos activos**, **en mora**, **vencidos**.
- **Próximos vencimientos:** lista de las cuotas pendientes más cercanas.

---

## 5. Flujo típico de uso

1. **Crear el deudor** → menú **Deudores → Nuevo deudor** (nombre, documento, teléfono).
2. **Crear el crédito** → menú **Créditos → Nuevo crédito**:
   - Elige el deudor, el valor prestado, la **tasa de interés por período (%)**,
     el **método de interés**, la **periodicidad** y el **número de cuotas**.
   - Al guardar, el sistema genera automáticamente el **plan de cuotas**.
3. **Registrar abonos** → entra al crédito (botón **Ver**) y usa **Registrar abono**.
   - El abono se aplica en orden **multa → interés → capital**.
   - El saldo y el estado se actualizan solos. Queda guardado **quién** registró el abono.
4. **Cobrar** → en el detalle del crédito, sección **Mensaje de cobro**: copia el texto
   o ábrelo directo en **WhatsApp**.

---

## 6. Detalle de un crédito

Al entrar a un crédito ves:
- **Resumen:** valor prestado, saldo de capital, interés pendiente, multa.
- **Condiciones:** método, tasa, periodicidad, fechas, total a pagar hoy.
- **Plan de cuotas:** cada cuota con su valor, capital, interés, multa, saldo y estado.
- **Historial de pagos:** todos los abonos con fecha y quién los registró.
- **Registrar abono** y **Mensaje de cobro**.
- Acciones (según rol): **Editar**, **Cancelar crédito**, **Eliminar**.

---

## 7. Mensaje de cobro

El sistema arma un texto listo para enviar, por ejemplo:

> "Señor(a) Juan Pérez, le informamos que presenta un saldo pendiente de $1.250.000
> correspondiente al crédito otorgado el 15/05/2026. Su cuota venció el 15/06/2026 y
> actualmente registra 6 días de mora, generando una multa de $25.000. El valor total
> a cancelar es de $1.275.000."

Botones para **copiar** o **abrir en WhatsApp**.

---

## 8. Reportes, Configuración, Usuarios y Auditoría

- **Reportes:** exporta a **Excel** (créditos, pagos) y **PDF** (resumen de cartera).
- **Configuración (Admin):** reglas de multa y botón **Recalcular ahora**.
- **Usuarios (Admin):** crear/editar/activar usuarios y asignar roles.
- **Auditoría (Admin):** registro de todas las operaciones (quién hizo qué y cuándo).

---

## 9. Recálculo de mora

Las multas y los estados (en mora/vencido) se actualizan al **recalcular**:
- Manual: **Configuración → Recalcular ahora** (Administrador).
- Automático: programar el endpoint `/api/cron/recalcular` con un cron diario en el VPS.

---

## 10. Datos de demostración (para mostrar la app)

Para **cargar 8 créditos de ejemplo** (cubren los 3 métodos, todas las periodicidades
y los estados: al día, en mora, parcial, pagado), en la **Terminal del VPS**:

```bash
docker exec appcreditos-app-1 npm run db:demo
```

Para **borrar** esos datos de demostración después (no toca usuarios ni configuración):

```bash
docker exec appcreditos-app-1 npm run db:demo:clean
```

> Los datos de demo se identifican por el documento que empieza con `DEMO-`.

---

## 11. Mantenimiento

**Actualizar la app** (cuando hay cambios nuevos en el código):
```bash
cd /root/appcreditos
git pull
docker compose -p appcreditos up -d --build
```

**Apagar el sembrado de usuarios** tras el primer arranque:
```bash
cd /root/appcreditos
sed -i 's/RUN_SEED=true/RUN_SEED=false/' .env
docker compose -p appcreditos up -d
```

**Respaldo de la base de datos:**
```bash
docker exec appcreditos-db-1 pg_dump -U creditos creditos > respaldo_$(date +%F).sql
```

**Ver el estado / logs:**
```bash
docker compose -p appcreditos ps
docker logs appcreditos-app-1 --tail 40
```

---

## 12. Notas importantes

- El **dinero** se maneja en pesos enteros (sin centavos).
- La **tasa de interés** se ingresa como porcentaje por período (ej. `10` = 10%).
- Los **secretos** (clave de BD, AUTH_SECRET) viven en el archivo `.env` del VPS,
  nunca en el código.
- La app corre en **2 contenedores**: `appcreditos-app-1` (aplicación) y
  `appcreditos-db-1` (PostgreSQL), aislados del resto de proyectos del VPS.
