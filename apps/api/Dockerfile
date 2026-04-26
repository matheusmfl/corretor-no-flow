FROM node:20-alpine AS base
WORKDIR /app

# ── Development (hot reload via volume mounts) ─────────────────────────────
FROM base AS development
# Copia TODOS os package.json dos workspaces — npm precisa de todos para
# resolver o grafo de dependências corretamente (workspaces: ["apps/*", "packages/*"])
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY apps/web/package*.json ./apps/web/
COPY packages/types/package*.json ./packages/types/
# Copia o schema antes do install para o prisma generate funcionar
COPY apps/api/prisma ./apps/api/prisma/
RUN npm install
# O script "dev" não roda prisma generate — faz aqui explicitamente
RUN npm run prisma:generate --workspace=apps/api
COPY . .
EXPOSE 3001
# Regenera o Prisma client ao iniciar — garante que o cliente está sempre
# alinhado com o schema.prisma que chega pelo volume mount em dev.
CMD ["sh", "-c", "npm run prisma:generate --workspace=apps/api && npm run dev --workspace=apps/api"]

# ── Builder ────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY apps/web/package*.json ./apps/web/
COPY packages/types/package*.json ./packages/types/
COPY apps/api/prisma ./apps/api/prisma/
RUN npm ci
COPY . .
# build já roda: prisma generate && nest build
RUN npm run build --workspace=apps/api

# ── Production ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY apps/web/package*.json ./apps/web/
COPY packages/types/package*.json ./packages/types/
COPY apps/api/prisma ./apps/api/prisma/
RUN npm ci --omit=dev
RUN npm run prisma:generate --workspace=apps/api
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/src ./packages/types/src
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
