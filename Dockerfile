# ==========================================
# CareConnect Production Dockerfile
# ==========================================

# 1. Build Client Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Build Server & Final Production Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy server code
COPY server/ ./

# Copy built frontend assets from client-builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 5000

CMD ["node", "server.js"]
