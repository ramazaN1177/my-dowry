# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set NODE_ENV to development for build (ensures devDependencies are installed)
ENV NODE_ENV=development

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies to prepare production node_modules
RUN npm prune --production && \
    rm -rf /root/.npm /tmp/* ~/.npm

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copy production node_modules from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]