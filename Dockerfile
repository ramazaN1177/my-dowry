# -----------------------------
# Builder Stage
# -----------------------------
    FROM node:20 AS builder

    WORKDIR /app
    
    # Build için gerekli araçlar (sharp vs.)
    RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
    
    # package dosyalarını kopyala
    COPY package*.json ./
    
    # Dependencies yükle
    RUN npm install --no-audit --no-fund
    
    # Tüm kaynak kodu kopyala
    COPY . .
    
    # TypeScript build
    RUN npm run build
    
    # -----------------------------
    # Production Stage
    # -----------------------------
    FROM node:20 AS prod
    
    WORKDIR /app
    
    # Production dependencies yükle
    COPY package*.json ./
    RUN npm install --no-audit --no-fund --production
    
    # Build edilmiş dosyaları kopyala
    COPY --from=builder /app/dist ./dist
    
    # Port
    EXPOSE 3000
    
    # Start komutu
    CMD ["node", "dist/server.js"]
    