# 🚀 INICIO RÁPIDO - Hospital Management System

**Fecha de actualización**: 8 de agosto de 2025  
**Estado**: ✅ Sistema 100% funcional con PostgreSQL + Arquitectura Modular

## 📋 COMANDO PRINCIPAL PARA INICIAR

```bash
# DESDE LA RAÍZ DEL PROYECTO
cd /Users/alfredo/agntsystemsc

# 🚀 INICIAR TODO EL SISTEMA (Backend + Frontend)
npm run dev
```

## 🌐 URLs DE ACCESO

Una vez que ejecutes `npm run dev`, accede a:

- **🖥️ Frontend**: http://localhost:3000
- **⚙️ Backend API**: http://localhost:3001  
- **🔍 Health Check**: http://localhost:3001/health
- **💾 Database UI**: http://localhost:5555 (ejecutar: `cd backend && npx prisma studio`)

## 🔑 CREDENCIALES DE PRUEBA

```bash
# Administrador completo
admin / admin123

# Personal médico
enfermero1 / enfermero123
especialista1 / medico123

# Personal operativo
cajero1 / cajero123
almacen1 / almacen123
```

## 🔧 COMANDOS DE VERIFICACIÓN

```bash
# Verificar backend funcionando
curl http://localhost:3001/health

# Verificar frontend funcionando  
curl -s http://localhost:3000 | grep -q "Hospital" && echo "Frontend ✅"

# Estado de base de datos
cd backend && npx prisma studio
```

## 🛑 SI ALGO NO FUNCIONA

### 1. Reiniciar Sistema Completo
```bash
# Parar todos los servicios
pkill -f "concurrently|nodemon|vite|server-modular.js"

# Reiniciar
npm run dev
```

### 2. Verificar PostgreSQL
```bash
# macOS
brew services start postgresql

# Verificar conexión
psql -d hospital_management -c "SELECT 1;"
```

### 3. Problemas de Dependencias
```bash
# Reinstalar dependencias raíz
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## ✅ ESTADO ACTUAL DEL SISTEMA

**Sistema Completamente Funcional:**
- ✅ Base de datos PostgreSQL con 23+ tablas
- ✅ Backend con arquitectura modular (server-modular.js)
- ✅ Frontend React + TypeScript + Vite
- ✅ Módulo de facturación sin errores críticos
- ✅ Tests funcionando (26+ tests)
- ✅ Servicio de desarrollo unificado

**Módulos 100% Funcionales:**
- ✅ Autenticación y roles
- ✅ Pacientes (CRUD + búsqueda avanzada)
- ✅ POS integrado con inventario
- ✅ Facturación completa con pagos
- ✅ Reportes financieros y operativos
- ✅ Hospitalización con notas SOAP
- ✅ Inventario con movimientos de stock

## 📖 DOCUMENTACIÓN COMPLETA

Para más detalles técnicos, consulta:
- **CLAUDE.md** - Instrucciones completas de desarrollo
- **README.md** - Documentación general del proyecto

## 🎯 PRÓXIMOS DESARROLLOS

1. Sistema de Citas Médicas
2. Dashboard en Tiempo Real
3. Expediente Médico Avanzado
4. Tests End-to-End
5. Containerización con Docker

---

**🏥 ¡Sistema listo para desarrollo continuo!** ✅