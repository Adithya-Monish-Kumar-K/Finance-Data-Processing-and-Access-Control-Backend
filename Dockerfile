# ── Build Stage ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# ── Production Stage ──────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client for production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built output and startup script
COPY --from=builder /app/dist ./dist/
COPY scripts ./scripts/
RUN chmod +x scripts/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/v1/health || exit 1

# Start with migration + seed + server
CMD ["bash", "scripts/start.sh"]
