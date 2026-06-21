# AppCreditos — Next.js 16 + Prisma 7 + PostgreSQL
FROM node:22-bookworm-slim

WORKDIR /app

# openssl es requerido por el motor de migraciones de Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Instala dependencias (incluye prisma CLI, tsx y dotenv para migraciones/seed).
# Se usa "npm install" (no "npm ci") para resolver los binarios nativos de Linux
# cuando el package-lock.json se generó en otro sistema operativo (Windows).
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copia el código y construye
COPY . .
# DATABASE_URL ficticio solo para que el build sea estable (no se conecta a la BD
# durante el build). En ejecución lo sobrescribe docker-compose.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "docker-entrypoint.sh"]
