# Basado en el ejemplo oficial de Next.js "with-docker" (output: standalone).
# Node 22 = la version usada en desarrollo y en @types/node.
ARG NODE_VERSION=22-slim

# ---- 1. Dependencias (incluye las de desarrollo: hacen falta para test y build)
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- 2. Tests + build
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Si la suite falla, la imagen no se construye. Va ANTES de NODE_ENV=production:
# los tests del aviso de desarrollo necesitan el NODE_ENV de test.
RUN npm test
ENV NODE_ENV=production
RUN npm run build

# ---- 3. Imagen final: solo el servidor standalone y los assets estaticos
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Cache de prerender escribible por el usuario sin privilegios.
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
