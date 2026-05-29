# ── Etapa 1: dependencias ─────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Etapa 2: build ────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Variables necesarias solo en build time
ARG NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_TELEMETRY_DISABLED=1

# build incluye npx tsx sql/migrate.ts (definido en package.json scripts.build)
# Para producción se corre la migración por separado con db:migrate:prod
# Aquí solo compilamos Next.js
RUN npx next build

# ── Etapa 3: runner ───────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copiar artefactos del build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar scripts de migración (se corren al iniciar el contenedor)
COPY --from=builder /app/sql ./sql
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Directorio de uploads persistente (se monta como volumen)
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
