# 1. Node image seç (projende Node 20 ile uyumlu)
FROM node:20-alpine AS builder

# 2. Çalışma dizini
WORKDIR /app

# 3. package.json ve package-lock.json kopyala
COPY package*.json ./

# 4. Gerekli build araçlarını yükle (sharp için)
RUN apk add --no-cache python3 make g++ 

# 5. npm install
RUN npm install --no-audit --no-fund

# 6. Tüm kaynak kodu kopyala
COPY . .

# 7. TypeScript build
RUN npm run build

# --------------------------
# Prod image
FROM node:20-alpine AS prod

WORKDIR /app

# 8. Production dependencies kopyala
COPY package*.json ./
RUN npm install --no-audit --no-fund --production

# 9. Build dosyalarını kopyala
COPY --from=builder /app/dist ./dist

# 10. Port ve start komutu
EXPOSE 3000
CMD ["node", "dist/server.js"]
