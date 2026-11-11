# Imagen de desarrollo/QA de LabTrack (backend + frontend + pruebas)
FROM node:22-bookworm-slim

# Prisma necesita OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY qa/package.json qa/
COPY backend/prisma backend/prisma

# Evita descargar chromedriver y similares de qa/ en la imagen
RUN npm ci --ignore-scripts && npx --workspace backend prisma generate

COPY . .

EXPOSE 4000 5173
CMD ["sh", "-c", "npm run db:setup -w backend && npm run dev"]

