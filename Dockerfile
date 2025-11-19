# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules (sharp için)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (dev + production) for building
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Prune dev dependencies (sadece production bağımlılıklarını bırak)
RUN npm prune --production

# Production stage
FROM node:20-alpine

# Install runtime dependencies for sharp
RUN apk add --no-cache vips

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production node_modules from builder (npm install yapmadan)
COPY --from=builder /app/node_modules ./node_modules

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]