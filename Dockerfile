# Stage 1: Build stage
FROM node:16-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --ignore-scripts

COPY src ./src

RUN npm run build

# Stage 2: Production stage
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

COPY eng.traineddata ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

CMD ["node", "dist/server.js"]
