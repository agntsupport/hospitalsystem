# 🚀 GUÍA DE DEPLOYMENT EN EASYPANEL
## Sistema de Gestión Hospitalaria Integral

**Última actualización:** 28 de Noviembre 2025
**Desarrollado por:** Alfredo Manuel Reyes - AGNT

---

## 🖥️ INFRAESTRUCTURA DE PRODUCCIÓN

Este sistema está diseñado para ejecutarse en un **VPS (Virtual Private Server)** con **EasyPanel** como plataforma de gestión de contenedores Docker.

### Arquitectura de Infraestructura

```
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Servidor Virtual)                    │
│              (Hetzner, DigitalOcean, Linode, etc.)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    EasyPanel                            │ │
│  │         (Plataforma de Gestión de Contenedores)        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │  Frontend   │  │   Backend   │  │ PostgreSQL  │    │ │
│  │  │   (Nginx)   │  │  (Node.js)  │  │  (Database) │    │ │
│  │  │   :80/443   │  │   :3001     │  │   :5432     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Especificaciones Recomendadas del VPS

| Recurso | Mínimo | Recomendado | Producción Alta |
|---------|--------|-------------|-----------------|
| **CPU** | 2 vCPU | 4 vCPU | 8 vCPU |
| **RAM** | 4 GB | 8 GB | 16 GB |
| **Disco** | 40 GB SSD | 80 GB SSD | 160 GB SSD |
| **Ancho de Banda** | 1 TB | 2 TB | Ilimitado |
| **Sistema Operativo** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Proveedores de VPS Recomendados

| Proveedor | Plan Recomendado | Precio Aprox. | Notas |
|-----------|------------------|---------------|-------|
| **Hetzner** | CX31 (4 vCPU, 8GB RAM) | ~€15/mes | Mejor relación precio/rendimiento |
| **DigitalOcean** | Droplet 4GB | ~$24/mes | Fácil de usar, buena documentación |
| **Linode** | Linode 4GB | ~$24/mes | Buen rendimiento |
| **Vultr** | High Frequency 4GB | ~$24/mes | Alta disponibilidad |
| **Contabo** | VPS M (6 vCPU, 16GB) | ~€10/mes | Económico, recursos generosos |

---

## 📋 PRE-REQUISITOS

### Para VPS Propio (Recomendado)
✅ VPS con Ubuntu 22.04 LTS (mínimo 4GB RAM, 2 vCPU)
✅ Acceso SSH al servidor (root o usuario con sudo)
✅ Dominio apuntando al VPS (opcional pero recomendado)
✅ Repositorio GitHub con el código
✅ Archivos Docker preparados (✅ completados)

### Para EasyPanel Cloud (Alternativa)
✅ Cuenta en EasyPanel Cloud: https://easypanel.io
✅ Repositorio GitHub con el código
✅ Archivos Docker preparados (✅ completados)

---

## 🔧 PASO 0: INSTALAR EASYPANEL EN VPS (Solo para VPS Propio)

### 0.1 Conectar al VPS por SSH

```bash
ssh root@tu-ip-del-vps
# O si usas usuario no-root:
ssh usuario@tu-ip-del-vps
```

### 0.2 Actualizar el Sistema

```bash
apt update && apt upgrade -y
```

### 0.3 Instalar EasyPanel (Un solo comando)

```bash
curl -sSL https://get.easypanel.io | sh
```

Este comando:
- Instala Docker si no está instalado
- Configura Docker Swarm
- Descarga e instala EasyPanel
- Configura SSL automático con Let's Encrypt

### 0.4 Acceder a EasyPanel

Una vez instalado, accede a:
```
https://tu-ip-del-vps:3000
```

**Primera vez:**
1. Crea tu cuenta de administrador
2. Configura tu email para notificaciones
3. (Opcional) Configura dominio personalizado para EasyPanel

### 0.5 Configurar Dominio (Recomendado)

Si tienes un dominio, configura estos registros DNS:

```
Tipo    Nombre              Valor
A       @                   [IP-DEL-VPS]
A       *.apps              [IP-DEL-VPS]
CNAME   hospital            apps.tudominio.com
CNAME   hospital-api        apps.tudominio.com
```

Esto permitirá:
- `hospital.tudominio.com` → Frontend
- `hospital-api.tudominio.com` → Backend

---

## 🏗️ ARQUITECTURA DEL DEPLOYMENT

```
┌─────────────────────────────────────────────┐
│           EasyPanel Platform                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │   Frontend   │  │   Backend    │       │
│  │  React+Nginx │  │ Node.js+API  │       │
│  │   (Port 80)  │  │  (Port 3001) │       │
│  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                │
│         └─────────┬────────┘                │
│                   │                         │
│          ┌────────▼────────┐               │
│          │   PostgreSQL    │               │
│          │   Database      │               │
│          └─────────────────┘               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📝 PASO 1: PREPARAR VARIABLES DE ENTORNO

### 1.1 Generar JWT_SECRET seguro

```bash
# Ejecuta en tu terminal local:
openssl rand -base64 32
```

Guarda el resultado, lo usarás en EasyPanel.

### 1.2 Preparar valores para EasyPanel

Necesitarás estos valores:

| Variable | Valor Ejemplo | Descripción |
|----------|---------------|-------------|
| `POSTGRES_DB` | `hospital_management` | Nombre de la BD |
| `POSTGRES_USER` | `postgres` | Usuario PostgreSQL |
| `POSTGRES_PASSWORD` | `[seguro123]` | Password BD (generado por EasyPanel) |
| `JWT_SECRET` | `[tu_secret_generado]` | Del paso 1.1 |
| `NODE_ENV` | `production` | Ambiente |
| `BACKEND_PORT` | `3001` | Puerto backend |
| `FRONTEND_PORT` | `80` | Puerto frontend |
| `VITE_API_URL` | `https://hospital-api.easypanel.host` | URL del backend |

---

## 🚀 PASO 2: CREAR PROYECTO EN EASYPANEL

### 2.1 Login en EasyPanel
1. Ve a https://easypanel.io
2. Inicia sesión o crea cuenta
3. Click en **"New Project"**

### 2.2 Configurar Proyecto
- **Nombre:** `hospital-management-system`
- **Description:** Sistema de Gestión Hospitalaria Integral

---

## 🗄️ PASO 3: CREAR BASE DE DATOS POSTGRESQL

### 3.1 Agregar Servicio PostgreSQL
1. En tu proyecto, click **"Add Service"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Configurar:
   - **Name:** `hospital-db`
   - **Version:** `14` o `15`
   - **Database:** `hospital_management`
   - **User:** `postgres`
   - **Password:** (genera uno seguro o usa el generado automáticamente)

4. Click **"Create"**

### 3.2 Verificar PostgreSQL
- Espera a que el estado sea **"Running"** (verde)
- Anota la **Connection String** que aparece en los detalles del servicio

---

## 🔧 PASO 4: DESPLEGAR BACKEND

### 4.1 Agregar Servicio Backend
1. Click **"Add Service"** → **"App"**
2. Configurar:
   - **Name:** `hospital-backend`
   - **Source:** **GitHub Repository**
   - **Repository:** `tu-usuario/agntsystemsc` (o tu repo)
   - **Branch:** `master`
   - **Build Context:** `./backend`
   - **Dockerfile:** `./backend/Dockerfile`

### 4.2 Configurar Variables de Entorno

Click en **"Environment Variables"** y agrega:

```env
DATABASE_URL=postgresql://postgres:[password]@hospital-db:5432/hospital_management?schema=public
PORT=3001
NODE_ENV=production
JWT_SECRET=[tu_jwt_secret_del_paso_1.1]
TRUST_PROXY=true
```

**IMPORTANTE:** Reemplaza `[password]` con el password de PostgreSQL del Paso 3.1

### 4.3 Configurar Puertos
- **Internal Port:** `3001`
- **External Port:** Asignar automáticamente
- **Enable HTTPS:** ✅ Sí

### 4.4 Configurar Dominio
EasyPanel te asignará un dominio automáticamente:
- Ejemplo: `https://hospital-backend-abc123.easypanel.host`
- Anota este dominio, lo usarás para el frontend

### 4.5 Deploy Backend
1. Click **"Deploy"**
2. Espera a que el build termine (puede tomar 3-5 minutos)
3. Verifica que el estado sea **"Running"**

### 4.6 Verificar Backend
```bash
curl https://hospital-backend-abc123.easypanel.host/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Sistema Hospitalario API...",
  "database": "PostgreSQL con Prisma"
}
```

---

## 🎨 PASO 5: DESPLEGAR FRONTEND

### 5.1 Agregar Servicio Frontend
1. Click **"Add Service"** → **"App"**
2. Configurar:
   - **Name:** `hospital-frontend`
   - **Source:** **GitHub Repository**
   - **Repository:** `tu-usuario/agntsystemsc`
   - **Branch:** `master`
   - **Build Context:** `./frontend`
   - **Dockerfile:** `./frontend/Dockerfile`

### 5.2 Configurar Variables de Entorno

Click en **"Environment Variables"** y agrega:

```env
VITE_API_URL=https://hospital-backend-abc123.easypanel.host
```

**IMPORTANTE:** Usa el dominio del backend del Paso 4.4

### 5.3 Configurar Puertos
- **Internal Port:** `80`
- **External Port:** Asignar automáticamente
- **Enable HTTPS:** ✅ Sí

### 5.4 Deploy Frontend
1. Click **"Deploy"**
2. Espera a que el build termine (puede tomar 5-7 minutos)
3. Verifica que el estado sea **"Running"**

### 5.5 Obtener Dominio Frontend
EasyPanel te asignará un dominio automáticamente:
- Ejemplo: `https://hospital-frontend-xyz789.easypanel.host`

---

## 🌱 PASO 6: SEEDEAR BASE DE DATOS (OPCIONAL)

Si quieres cargar datos de prueba:

### 6.1 Acceder al Container del Backend
1. En EasyPanel, ve al servicio **hospital-backend**
2. Click en **"Console"** o **"Shell"**

### 6.2 Ejecutar Seed
```bash
# Dentro del container
npm run db:seed
```

---

## ✅ PASO 7: VERIFICACIÓN FINAL

### 7.1 Checklist de Verificación

- [ ] PostgreSQL corriendo (verde)
- [ ] Backend corriendo (verde)
- [ ] Frontend corriendo (verde)
- [ ] Health check del backend: `curl https://[tu-backend]/health`
- [ ] Frontend accesible: `https://[tu-frontend]`
- [ ] Login funciona con: `admin / admin123`

### 7.2 URLs Finales

Anota tus URLs de producción:

```
Frontend:  https://hospital-frontend-[tu-id].easypanel.host
Backend:   https://hospital-backend-[tu-id].easypanel.host
```

---

## 🔐 PASO 8: CONFIGURACIÓN DE SEGURIDAD POST-DEPLOYMENT

### 8.1 Cambiar Credenciales por Defecto

**CRÍTICO:** Una vez que el sistema esté funcionando, cambia las credenciales:

1. Login con `admin / admin123`
2. Ve a **Configuración** → **Usuarios**
3. Cambia el password del usuario `admin`

### 8.2 Variables de Entorno Sensibles

Verifica que estén configuradas:
- ✅ `JWT_SECRET` - único y seguro
- ✅ `POSTGRES_PASSWORD` - único y seguro
- ✅ `NODE_ENV=production`
- ✅ `TRUST_PROXY=true`

---

## 📊 MONITOREO Y LOGS

### Ver Logs en EasyPanel

1. **Backend Logs:**
   - Ve al servicio `hospital-backend`
   - Click en **"Logs"**
   - Filtra por errores: búsqueda `ERROR` o `error`

2. **Frontend Logs:**
   - Ve al servicio `hospital-frontend`
   - Click en **"Logs"**

3. **PostgreSQL Logs:**
   - Ve al servicio `hospital-db`
   - Click en **"Logs"**

---

## 🔄 ACTUALIZAR EL SISTEMA

### Deployments Automáticos

EasyPanel puede configurarse para auto-deploy cuando haces push a GitHub:

1. Ve al servicio (backend o frontend)
2. Click en **"Settings"**
3. Habilita **"Auto Deploy"**
4. Selecciona la rama: `master`

Ahora, cada `git push origin master` desplegará automáticamente.

### Deploy Manual

Si prefieres control manual:

1. Ve al servicio
2. Click **"Deploy"** o **"Redeploy"**
3. EasyPanel hará pull del último código y rebuildeará

---

## 🐛 TROUBLESHOOTING

### Backend no arranca

**Error:** `Prisma: Can't connect to database`

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Verifica `DATABASE_URL` en variables de entorno del backend
3. El formato debe ser: `postgresql://user:password@hostname:5432/dbname?schema=public`
4. En EasyPanel, el hostname es el **nombre del servicio** de PostgreSQL: `hospital-db`

### Frontend muestra error de conexión API

**Error:** `Network Error` o `Failed to fetch`

**Solución:**
1. Verifica que `VITE_API_URL` apunte al dominio correcto del backend
2. Debe incluir `https://` (no `http://`)
3. NO debe tener trailing slash: ❌ `https://api.com/` → ✅ `https://api.com`
4. Rebuild del frontend después de cambiar `VITE_API_URL`

### Migrations no aplican

**Error:** `Prisma migrate failed`

**Solución:**
1. Accede a la consola del backend en EasyPanel
2. Ejecuta manualmente:
   ```bash
   npx prisma migrate deploy
   ```

### CORS Errors en el Frontend

**Error:** `Access-Control-Allow-Origin`

**Solución:**
Ya está configurado en el backend (`cors` habilitado), pero verifica:
1. Backend debe tener `TRUST_PROXY=true`
2. Frontend debe usar HTTPS (no HTTP)
3. Ambos servicios deben tener HTTPS habilitado en EasyPanel

---

## 📞 SOPORTE

**Desarrollado por:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Teléfono:** 443 104 7479

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

Después del deployment exitoso:

1. **Configurar Dominio Propio** (opcional):
   - Compra un dominio (ej: `hospitalsystem.com`)
   - En EasyPanel, ve a cada servicio → **"Domains"**
   - Agrega tu dominio personalizado
   - Configura DNS según instrucciones de EasyPanel

2. **Configurar Backups Automáticos**:
   - En PostgreSQL service → **"Backups"**
   - Habilita backups automáticos diarios
   - Guarda en almacenamiento externo (S3, etc.)

3. **Monitoreo y Alertas**:
   - Configura notificaciones de EasyPanel
   - Recibe alertas si algún servicio falla

4. **SSL/HTTPS**:
   - EasyPanel provee SSL automático con Let's Encrypt
   - Verifica que ambos servicios tengan el candado 🔒

---

## ✅ CHECKLIST FINAL DE DEPLOYMENT

```
PREPARACIÓN:
- [ ] JWT_SECRET generado (openssl rand -base64 32)
- [ ] Variables de entorno preparadas
- [ ] Archivos Docker creados (✅ ya están)

EASYPANEL SETUP:
- [ ] Proyecto creado en EasyPanel
- [ ] PostgreSQL desplegado y corriendo
- [ ] Backend desplegado y corriendo
- [ ] Frontend desplegado y corriendo

VERIFICACIÓN:
- [ ] Health check backend: /health retorna 200
- [ ] Frontend accesible y carga
- [ ] Login funciona (admin / admin123)
- [ ] Dashboard muestra datos
- [ ] Tabla de ocupación visible

SEGURIDAD:
- [ ] Password de admin cambiado
- [ ] JWT_SECRET único (no default)
- [ ] POSTGRES_PASSWORD seguro
- [ ] HTTPS habilitado en ambos servicios

POST-DEPLOYMENT:
- [ ] Backups automáticos configurados
- [ ] Monitoreo y alertas habilitados
- [ ] Dominio personalizado (opcional)
- [ ] Documentación entregada a cliente
```

---

**🏥 Sistema de Gestión Hospitalaria Integral**
**✅ Ready for Production Deployment**

*© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial*
