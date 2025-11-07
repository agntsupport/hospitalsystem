# Backend Dockerfile para Sistema Hospitalario
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache postgresql-client

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de package
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Generar cliente de Prisma
RUN npx prisma generate

# Exponer puerto
EXPOSE 3001

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicio - usa db push para primer deploy
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node server-modular.js"]