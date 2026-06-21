#!/bin/sh
set -e

echo "==> Aplicando migraciones de base de datos..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "==> Sembrando datos iniciales (usuarios y configuración)..."
  npm run db:seed || echo "Seed omitido (posiblemente ya existe)."
fi

echo "==> Iniciando la aplicación en el puerto ${PORT:-3000}..."
exec npm run start
