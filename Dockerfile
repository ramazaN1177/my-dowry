# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arg but always force development for build
ARG NODE_ENV=production
ENV NODE_ENV=development

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

RUN npm prune --production && \
    rm -rf /root/.npm /tmp/* ~/.npm


# ============================================
# Production Stage
# ============================================
FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

RUN mkdir -p uploads && \
    chmod -R 777 uploads

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
