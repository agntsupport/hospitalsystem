# Guía de Deployment en EasyPanel

**Sistema de Gestión Hospitalaria Integral**
**Desarrollado por:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial

---

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener:

1. Una cuenta en EasyPanel
2. Un proyecto creado en EasyPanel
3. Acceso a git con tu repositorio
4. Los dominios asignados por EasyPanel para tus servicios

---

## 🏗️ Arquitectura en EasyPanel

Este sistema requiere **3 servicios separados** en EasyPanel:

1. **PostgreSQL** - Base de datos
2. **Backend** - API Node.js/Express (puerto 3001)
3. **Frontend** - React SPA con Nginx (puerto 80)

---

## 📝 Pasos de Deployment

### 1. Crear el Servicio de PostgreSQL

1. En EasyPanel, crea un nuevo servicio de tipo **PostgreSQL**
2. Configura las siguientes variables de entorno:
   ```
   POSTGRES_DB=hospital_management
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=[genera-una-contraseña-segura]
   ```
3. Anota el nombre del servicio (lo necesitarás para el backend)
4. El puerto por defecto es 5432

### 2. Crear el Servicio del Backend

1. Crea un nuevo servicio de tipo **App** (Git)
2. Conecta tu repositorio
3. Configura el **Build**:
   - **Dockerfile path**: `backend/Dockerfile`
   - **Build context**: `backend`

4. Configura las **Variables de Entorno**:
   ```bash
   # Base de datos
   DATABASE_URL=postgresql://postgres:[POSTGRES_PASSWORD]@[POSTGRES_SERVICE_NAME]:5432/hospital_management?schema=public

   # Node
   NODE_ENV=production
   PORT=3001

   # Seguridad
   JWT_SECRET=[genera-con: openssl rand -base64 32]
   TRUST_PROXY=true
   ```

5. Configura el **Puerto**: `3001`

6. **IMPORTANTE**: Anota el dominio que EasyPanel asigna al backend
   - Ejemplo: `https://hospital-management-system-app.1nse3e.easypanel.host`

### 3. Crear el Servicio del Frontend

1. Crea un nuevo servicio de tipo **App** (Git)
2. Conecta tu repositorio
3. Configura el **Build**:
   - **Dockerfile path**: `frontend/Dockerfile`
   - **Build context**: `frontend`
   - **Build arguments** (muy importante):
     ```
     VITE_API_URL=https://[TU-DOMINIO-BACKEND].easypanel.host/api
     ```
     ⚠️ **NOTA CRÍTICA**: La URL DEBE incluir `/api` al final

4. Configura el **Puerto**: `80`

5. **IMPORTANTE**: Anota el dominio que EasyPanel asigna al frontend
   - Ejemplo: `https://hospital-management-system-frontend.1nse3e.easypanel.host`

### 4. Configurar CORS en el Backend

El backend ya tiene configurado CORS, pero **debes verificar** que el dominio del frontend esté en la lista de orígenes permitidos.

1. Ve a `backend/server-modular.js` línea 68-73
2. Verifica que tu dominio frontend esté en `allowedOrigins`:
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'http://localhost:3002',
     'http://localhost:5173',
     'https://hospital-management-system-frontend.1nse3e.easypanel.host' // ← Tu dominio
   ];
   ```
3. Si no está, agrégalo y haz commit/push

---

## 🔍 Verificación Post-Deployment

### Backend Health Check

```bash
curl https://[TU-DOMINIO-BACKEND].easypanel.host/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "timestamp": "2025-01-07T...",
  "uptime": 123.45,
  "database": "connected"
}
```

### Frontend Check

Abre en tu navegador:
```
https://[TU-DOMINIO-FRONTEND].easypanel.host
```

Deberías ver la página de login del sistema hospitalario.

### Test de API desde Frontend

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login con: `admin / admin123`
4. Verifica que las requests vayan a:
   ```
   https://[TU-DOMINIO-BACKEND].easypanel.host/api/auth/login
   ```
5. Si ves errores 404, verifica la configuración de `VITE_API_URL`

---

## 🐛 Troubleshooting

### Error 404 en `/auth/login`

**Problema**: El frontend está llamando al endpoint incorrecto.

**Causa**: `VITE_API_URL` no incluye `/api` al final.

**Solución**:
1. Reconstruye el frontend con el build argument correcto:
   ```
   VITE_API_URL=https://[BACKEND].easypanel.host/api
   ```

### CORS Error

**Problema**: Error de CORS en la consola del navegador.

**Causa**: El dominio del frontend no está en `allowedOrigins` del backend.

**Solución**:
1. Edita `backend/server-modular.js` línea 68-73
2. Agrega tu dominio frontend a `allowedOrigins`
3. Commit y push
4. EasyPanel reconstruirá automáticamente

### Backend no inicia

**Problema**: El contenedor del backend se reinicia constantemente.

**Causa posible 1**: Error de conexión a la base de datos.

**Solución**:
1. Verifica que `DATABASE_URL` tenga el nombre correcto del servicio PostgreSQL
2. Verifica que la contraseña sea correcta
3. Verifica que el servicio PostgreSQL esté corriendo

**Causa posible 2**: `JWT_SECRET` no está definido.

**Solución**:
1. Genera un JWT_SECRET: `openssl rand -base64 32`
2. Agrégalo a las variables de entorno del backend

### Redirect Loop (HTTPS)

**Problema**: El navegador entra en un loop de redirects infinitos.

**Causa**: El backend no tiene `TRUST_PROXY=true` configurado.

**Solución**:
1. Agrega `TRUST_PROXY=true` a las variables de entorno del backend
2. Reconstruye el servicio

---

## 📊 Monitoreo

### Logs del Backend

En EasyPanel, ve al servicio del backend y selecciona la pestaña **Logs**.

Busca estos mensajes al iniciar:
```
✅ Trust proxy enabled (behind reverse proxy)
✅ HTTPS enforcement enabled (production mode)
🚀 Servidor escuchando en puerto 3001
✅ Base de datos conectada exitosamente
```

### Logs del Frontend

En EasyPanel, ve al servicio del frontend y selecciona la pestaña **Logs**.

Deberías ver:
```
/docker-entrypoint.sh: Configuration complete; ready for start up
```

---

## 🔄 Redeploy

Para redesplegar después de cambios:

1. Haz commit y push de tus cambios
2. En EasyPanel, ve al servicio que quieres actualizar
3. Click en **Redeploy**
4. EasyPanel reconstruirá la imagen y reiniciará el servicio

**NOTA**: El backend tiene protección en el seed para no borrar datos existentes.

---

## 📌 Checklist de Deployment

- [ ] PostgreSQL creado y configurado
- [ ] Backend desplegado con todas las variables de entorno
- [ ] Frontend desplegado con `VITE_API_URL` correcto (con `/api`)
- [ ] Dominio del frontend agregado a CORS en backend
- [ ] Backend health check responde OK
- [ ] Frontend carga correctamente
- [ ] Login funciona (admin/admin123)
- [ ] Sin errores de CORS en consola
- [ ] Sin errores 404 en Network tab

---

## 🔐 Seguridad Post-Deployment

Después del primer deployment exitoso:

1. **Cambia las credenciales por defecto**:
   - Usuario: `admin / admin123` → Cambiar password inmediatamente

2. **Desactiva el seed automático** (opcional):
   - Si no quieres que el seed se ejecute en cada deploy
   - Edita `backend/Dockerfile` línea 33
   - Cambia: `CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node server-modular.js"]`
   - A: `CMD ["sh", "-c", "npx prisma db push && node server-modular.js"]`

3. **Configura backups de la base de datos**:
   - EasyPanel ofrece backups automáticos
   - Configúralo en la configuración del servicio PostgreSQL

---

## 🆘 Soporte

Si tienes problemas adicionales:

1. Revisa los logs en EasyPanel
2. Verifica la configuración de variables de entorno
3. Confirma que todos los servicios estén corriendo
4. Contacta: Alfredo Manuel Reyes - 443 104 7479

---

**© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial. Todos los derechos reservados.**
