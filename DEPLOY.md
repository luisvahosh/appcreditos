# Despliegue en Hostinger (Administrador de Docker)

Método elegido: **imagen publicada en un registro** + **acceso por IP:puerto**.
La base de datos PostgreSQL corre en **su propio contenedor**.

Resumen:
1. Construyes la imagen de la app en tu PC y la subes a un registro (Docker Hub).
2. En Hostinger creas un proyecto nuevo con **"Componer"** y pegas
   `docker-compose.hostinger.yml` (editando los valores).
3. Hostinger descarga la imagen, levanta Postgres + la app, aplica migraciones y
   crea los usuarios. Entras por `http://IP-DEL-VPS:3100`.

---

## Paso 1 — Construir y publicar la imagen (en tu PC, con Docker Desktop)

Crea una cuenta gratis en https://hub.docker.com (tu usuario será `TU_USUARIO`).

Desde la carpeta del proyecto:
```bash
docker login
docker build -t TU_USUARIO/appcreditos:latest .
docker push TU_USUARIO/appcreditos:latest
```
> Alternativa GHCR (GitHub): usa `ghcr.io/TU_USUARIO/appcreditos:latest` y
> `docker login ghcr.io`. Si el repositorio es privado, deberás dar acceso al VPS.

Cada vez que cambies el código, repite `build` + `push` (puedes versionar con
`:v2`, `:v3`, etc. en lugar de `latest`).

## Paso 2 — Crear el proyecto en Hostinger

1. Panel: **VPS → Administrador de Docker → Proyectos**.
2. Clic en **"Componer"** (arriba a la derecha).
3. Dale un nombre al proyecto (ej. `appcreditos`).
4. Pega el contenido de **`docker-compose.hostinger.yml`** y **edita los valores**:
   - `TU_USUARIO/appcreditos:latest` → tu imagen del Paso 1.
   - `CAMBIA_clave_postgres` → una clave fuerte (en los **dos** lugares donde aparece).
   - `CAMBIA_auth_secret` → genera uno: `npx auth secret` (o `openssl rand -base64 33`).
   - `CAMBIA_cron_secret` → un token aleatorio.
   - Deja `RUN_SEED: "true"` **solo en este primer despliegue**.
5. Despliega. Hostinger ejecutará `docker compose up -d`.

## Paso 3 — Verificar y entrar

- Revisa los logs del contenedor `app` desde el panel (botón **Terminal**/logs).
  Deberías ver: migraciones aplicadas → seed → app iniciada.
- Abre **`http://IP-DEL-VPS:3100`** (la IP aparece en el resumen del VPS).
  - El contenedor escucha internamente en 3000, pero se publica en el **3100** del
    host (el 3000 ya está ocupado en tu VPS). Para cambiarlo, edita el número de la
    izquierda en `ports: "3100:3000"`.
  - Si no carga, habilita el **puerto 3100** en el firewall del VPS (Hostinger →
    Seguridad / Firewall).

Usuarios iniciales (¡cámbialos al entrar!):
| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | admin@creditos.local | admin123 |
| Cobrador | cobrador@creditos.local | cobrador123 |
| Consulta | consulta@creditos.local | consulta123 |

## Paso 4 — Apagar el sembrado

Edita el proyecto en Hostinger, cambia `RUN_SEED: "true"` → `"false"` y vuelve a
desplegar. Así no intentará recrear los usuarios en cada reinicio.

---

## Actualizar a una nueva versión

```bash
# en tu PC
docker build -t TU_USUARIO/appcreditos:latest .
docker push TU_USUARIO/appcreditos:latest
```
En Hostinger: vuelve a desplegar el proyecto (hará `pull` de la nueva imagen).
Las migraciones nuevas se aplican solas al arrancar (`prisma migrate deploy`).

## Base de datos: respaldos

Desde la **Terminal** del VPS (o del contenedor `db`):
```bash
docker compose exec db pg_dump -U creditos creditos > backup_$(date +%F).sql
```
Los datos persisten en el volumen `pgdata` aunque reinicies o recrees los contenedores.

## Recálculo de mora automático (opcional)

Programa el endpoint con cron en el VPS (`crontab -e`), diario a la 1 a. m.:
```
0 1 * * * curl -s "http://localhost:3100/api/cron/recalcular?token=CAMBIA_cron_secret" >/dev/null
```

## Más adelante: dominio con HTTPS

Cuando quieras usar tu dominio con SSL, podemos integrarlo con el **Traefik** que ya
tienes en el VPS (añadiendo labels al servicio `app` y conectándolo a su red), y
quitar el puerto `3000` público. Avísame y lo configuramos.
