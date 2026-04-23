FROM node:20-alpine AS base
WORKDIR /app

# ── Development (hot reload via volume mounts) ─────────────────────────────
FROM base AS development
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=apps/api"]

# ── Builder ────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
RUN npm ci
COPY . .
RUN npm run build --workspace=apps/api

# ── Production ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
RUN npm ci --omit=dev
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/src ./packages/types/src
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
