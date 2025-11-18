# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Ensure NODE_ENV is not production during build
ENV NODE_ENV=development

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev
RUN rm -rf /root/.npm || true

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server.js"]