# 🚀 Deployment en Easypanel - Sistema Hospitalario

## 📋 **Pasos para Deploy Completo**

### **Paso 1: Preparar el Código**

1. **Commitear los archivos Docker:**
```bash
git add backend/Dockerfile frontend/Dockerfile frontend/nginx.conf docker-compose.yml .env.example DEPLOYMENT_EASYPANEL.md
git commit -m "Add: Archivos Docker y configuración para Easypanel deployment"
git push origin master:main
```

### **Paso 2: Configurar en Easypanel**

#### **A) Acceder a Easypanel**
1. Iniciar sesión en tu panel de Easypanel
2. Ir a **"Services"** → **"Create Service"**

#### **B) Crear Servicio desde GitHub**
1. Seleccionar **"From Source Code"**
2. Conectar repositorio: `https://github.com/agntsupport/hospitalsystem`
3. Branch: `main`
4. Build Method: **Docker Compose**

#### **C) Configurar Variables de Entorno**
En el panel de Easypanel, agregar estas variables:

```env
# Base de datos
POSTGRES_DB=hospital_management
POSTGRES_USER=hospital_admin
POSTGRES_PASSWORD=[GENERAR_PASSWORD_SEGURO]

# Backend
JWT_SECRET=[GENERAR_JWT_SECRET_SEGURO]
NODE_ENV=production
PORT=3001

# Frontend  
FRONTEND_API_URL=https://tu-dominio.easypanel.host
VITE_API_URL=https://tu-dominio.easypanel.host

# Dominio
DOMAIN=tu-dominio.easypanel.host
```

#### **D) Configurar Dominio**
1. En **"Domains"** agregar tu dominio
2. Easypanel configurará SSL automáticamente
3. Apuntar DNS a la IP de Easypanel

### **Paso 3: Deploy y Verificación**

#### **A) Iniciar Deploy**
1. Click en **"Deploy"**
2. Easypanel construirá los contenedores
3. Tiempo estimado: 5-10 minutos

#### **B) Monitorear el Deploy**
1. Ver logs en tiempo real
2. Verificar que todos los servicios inicien:
   - ✅ PostgreSQL (puerto 5432)
   - ✅ Backend (puerto 3001)  
   - ✅ Frontend (puerto 80)

#### **C) Verificar Funcionamiento**
```bash
# Health check del backend
curl https://tu-dominio.easypanel.host/api/health

# Verificar frontend
curl https://tu-dominio.easypanel.host
```

### **Paso 4: Configuración Post-Deploy**

#### **A) Inicializar Base de Datos**
El backend automáticamente:
1. Ejecuta migraciones de Prisma
2. Ejecuta el seed con datos iniciales
3. Crea usuarios por defecto

#### **B) Credenciales de Acceso**
```bash
# Administrador
Usuario: admin
Password: admin123

# Otros usuarios disponibles
cajero1 / cajero123
enfermero1 / enfermero123
especialista1 / medico123
almacen1 / almacen123
```

## 🔧 **Configuraciones Avanzadas**

### **SSL/HTTPS**
- Easypanel configura SSL automáticamente
- Certificados Let's Encrypt renovados automáticamente
- Redirección HTTP → HTTPS habilitada

### **Backup Automático**
```bash
# Script de backup (ejecutar en Easypanel terminal)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### **Scaling**
- Backend: Puede escalar horizontalmente
- Frontend: Servido por Nginx (alta performance)
- BD: PostgreSQL con conexiones pooled

### **Monitoreo**
- Logs disponibles en Easypanel dashboard
- Health checks automáticos
- Reinicio automático en caso de falla

## 🚨 **Troubleshooting**

### **Error: Base de datos no conecta**
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Verificar que PostgreSQL esté corriendo
pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
```

### **Error: Backend no inicia**
```bash
# Ver logs del contenedor
docker logs hospital-backend

# Verificar migraciones
npx prisma migrate status
```

### **Error: Frontend no carga**
```bash
# Verificar build de frontend
docker logs hospital-frontend

# Verificar configuración de Nginx
nginx -t
```

### **Error: CORS**
- Verificar que `FRONTEND_API_URL` esté correctamente configurado
- Comprobar que el dominio coincida en frontend y backend

## 📊 **Arquitectura en Producción**

```
Internet
    ↓
[Easypanel Load Balancer + SSL]
    ↓
[Nginx Frontend Container :80]
    ↓ (proxy /api/*)
[Backend Node.js Container :3001]
    ↓
[PostgreSQL Container :5432]
    ↓
[Volumes: postgres_data, backend_uploads]
```

## 🔄 **Actualización y Mantenimiento**

### **Deploy de Actualizaciones**
1. Push cambios a GitHub
2. En Easypanel: **"Redeploy"**
3. Easypanel reconstruirá automáticamente

### **Backup Regular**
```bash
# Backup mensual recomendado
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m).sql.gz
```

### **Monitoreo de Performance**
- CPU/RAM usage en dashboard de Easypanel  
- Logs de acceso de Nginx
- Métricas de base de datos

## ✅ **Checklist Final**

- [ ] Código en GitHub actualizado
- [ ] Variables de entorno configuradas
- [ ] Dominio configurado y DNS apuntando
- [ ] Deploy exitoso (todos los servicios UP)
- [ ] Health check del backend funcionando
- [ ] Frontend carga correctamente
- [ ] Login con credenciales admin funciona
- [ ] Base de datos inicializada con datos

## 🎉 **¡Sistema en Producción!**

Tu Sistema de Gestión Hospitalaria está ahora corriendo en producción con:

- ✅ **Alta disponibilidad** con reinicio automático
- ✅ **SSL/HTTPS** configurado automáticamente  
- ✅ **Escalabilidad** horizontal ready
- ✅ **Backup** manual disponible
- ✅ **Monitoreo** en tiempo real
- ✅ **Dominio personalizado** funcional

**URL del Sistema:** https://tu-dominio.easypanel.host

---
*Desarrollado por agnt_ Software Development Company*