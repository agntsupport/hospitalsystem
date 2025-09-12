# Dockerfile en la raíz para Easypanel
# Este archivo construye el frontend desde el subdirectorio

FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos del frontend desde el subdirectorio
COPY frontend/package*.json ./
RUN npm ci

# Copiar todo el código del frontend
COPY frontend/ ./

# Build de producción
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine

# Crear configuración de nginx inline
RUN echo 'events { worker_connections 1024; } \
http { \
    include /etc/nginx/mime.types; \
    default_type application/octet-stream; \
    server { \
        listen 80; \
        root /usr/share/nginx/html; \
        index index.html; \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
        location /api/ { \
            proxy_pass http://backend:3001/api/; \
            proxy_http_version 1.1; \
            proxy_set_header Host $host; \
        } \
    } \
}' > /etc/nginx/nginx.conf

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]