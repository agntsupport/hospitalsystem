# 🏥 Sistema de Gestión Hospitalaria Integral

**Desarrollado por:** Alfredo Manuel Reyes  
**Empresa:** agnt_ - Software Development Company  
**Tecnología:** Arquitectura Full-Stack con PostgreSQL + React + Node.js

![Estado del Proyecto](https://img.shields.io/badge/Estado-75%25%20Funcional-yellow)
![Versión](https://img.shields.io/badge/Versión-2.0.0--beta-blue)
![Tests Unit](https://img.shields.io/badge/Tests%20Unit-357%20(187%20Frontend%20+%20122%2F141%20Backend)-green)
![Backend Pass Rate](https://img.shields.io/badge/Backend%20Pass%20Rate-86.5%25%20(122%2F141)-green)
![Tests E2E](https://img.shields.io/badge/Tests%20E2E-19%20Playwright%20(ITEM%203%20%26%204)-green)
![Base de Datos](https://img.shields.io/badge/BD-PostgreSQL%2014.18-blue)
![Arquitectura](https://img.shields.io/badge/Arquitectura-Modular-green)
![Auditoría](https://img.shields.io/badge/Auditoría-Completa-purple)

---

## 🎯 Estado Actual del Proyecto

### ✅ SISTEMA FUNCIONAL (75% - Requiere Optimización)

**14/14 Módulos Core Implementados:**
1. **🔐 Autenticación JWT** - Sistema completo de roles y permisos ✅
2. **👥 Gestión de Empleados** - CRUD completo con roles especializados ✅
3. **🏥 Gestión de Pacientes** - Registro completo con búsqueda avanzada ✅
4. **🏠 Habitaciones y Consultorios** - Control de espacios hospitalarios ✅
5. **💰 Punto de Venta (POS)** - Integrado con inventario ✅
6. **📦 Inventario Completo** - Productos, proveedores, movimientos ✅
7. **💳 Facturación Integrada** - Automática desde POS ✅
8. **📊 Reportes Ejecutivos** - Financieros y operativos ✅
9. **🏥 Hospitalización Avanzada** - Ingresos con anticipo automático, notas médicas, control por roles ✅
10. **🏢 Quirófanos** - Gestión completa de quirófanos y cirugías ✅
11. **📋 Sistema de Auditoría** - Trazabilidad completa de operaciones ✅
12. **🧪 Framework de Testing** - 338 tests unit + 19 tests E2E Playwright (ITEM 3 & 4 validados) ✅
13. **⚡ Cargos Automáticos** - Habitaciones y quirófanos con servicios auto-generados ✅
14. **🔔 Notificaciones y Solicitudes** - Sistema de comunicación interna ✅

### 🚀 Próximos Desarrollos

**FASE 2**: Sistema de Citas Médicas - Calendarios y horarios  
**FASE 3**: Dashboard Tiempo Real - WebSockets y notificaciones  
**FASE 4**: Expediente Médico Completo - Historia clínica digital

## ✨ Características Principales

### 🏥 Gestión Médica Completa
- **🏥 Hospitalización Avanzada** - Ingresos automáticos con anticipo $10,000 MXN, notas médicas, control granular por roles
- **👥 Gestión de Pacientes** - CRM médico con búsqueda avanzada
- **🏠 Habitaciones y Consultorios** - Control de ocupación con **cargos automáticos por día**
- **🏢 Quirófanos** - Programación de cirugías con **cargos automáticos por hora** y control de equipamiento
- **👨‍⚕️ Personal Médico** - 7 roles especializados con permisos granulares

### 💰 Gestión Financiera Integral
- **💰 Punto de Venta (POS)** - Integrado con inventario en tiempo real
- **💳 Facturación Automática** - Conversión automática desde cuentas POS
- **💸 Control de Pagos** - Pagos parciales, cuentas por cobrar
- **📊 Reportes Financieros** - KPIs ejecutivos con gráficos

### 📦 Administración Operativa
- **📦 Inventario Inteligente** - Control de stock, alertas automáticas
- **📋 Sistema de Auditoría** - Trazabilidad completa de operaciones
- **📊 Reportes Operativos** - Productividad y análisis detallado
- **🧪 Testing Automatizado** - 338 tests unit + 19 tests E2E Playwright

## 👥 Roles del Sistema

1. **Administrador**: Acceso completo al sistema
2. **Cajero**: POS, pacientes, habitaciones, facturación
3. **Enfermero**: Pacientes, habitaciones, inventario (lectura)
4. **Almacenista**: Inventario completo, control de stock
5. **Médico Residente**: Pacientes, habitaciones, atención médica
6. **Médico Especialista**: Pacientes, habitaciones, reportes médicos
7. **Socio**: Acceso de solo lectura a reportes financieros

## 🛠 Stack Tecnológico

### Frontend (React 18 + TypeScript)
- **React 18** + **TypeScript** - Framework moderno con tipado estático
- **Material-UI (MUI)** - Componentes profesionales responsive
- **Redux Toolkit** - Gestión de estado predecible
- **React Router v6** - Navegación con rutas protegidas
- **Vite** - Build tool optimizado para desarrollo
- **React Hook Form + Yup** - Formularios con validación

### Backend (Node.js + PostgreSQL)
- **Node.js 18** + **Express.js** - API REST con 100+ endpoints
- **PostgreSQL 14.18** + **Prisma ORM** - Base de datos relacional
- **JWT + bcrypt** - Autenticación segura con roles
- **Middleware de Auditoría** - Trazabilidad completa
- **Validación Robusta** - Esquemas y middleware de validación

### Testing y Calidad
- **338 tests unit** - 187 frontend + 57/151 backend (38% pass rate)
- **19 tests E2E Playwright** - ITEM 3 (validación) + ITEM 4 (WCAG Skip Links)
- **Progreso Sprint 1** - 26 → 57 tests passing (+119% improvement)
- **Script automatizado** - test-e2e-full.sh ejecuta todo
- **TypeScript estricto** - Tipado completo del sistema
- **ESLint + Prettier** - Calidad de código automatizada
- **Arquitectura Modular** - Componentes reutilizables

### Base de Datos
- **PostgreSQL 14.18** - Motor de base de datos principal
- **Prisma ORM** - Migración y gestión de esquemas
- **37 modelos/entidades** - Diseño normalizado
- **Auditoría completa** - Logs de todas las operaciones

## 📁 Estructura del Proyecto

```
agntsystemsc/
├── docs/                    # Documentación técnica
├── backend/                 # API REST
├── frontend/                # Aplicación React
├── deployment/              # Configuración Docker/Nginx
└── .github/workflows/       # CI/CD
```

## 🚀 Inicio Rápido

### Prerrequisitos
- **Node.js 18+**
- **PostgreSQL 14+**
- **npm 9+**

### 🚀 Comando Principal

```bash
# Desde la raíz del proyecto - Inicia backend y frontend juntos
npm run dev
```

### Comandos Alternativos
```bash
# Backend solo
cd backend && npm run dev    # server-modular.js en puerto 3001

# Frontend solo  
cd frontend && npm run dev   # Vite en puerto 3000

# Base de datos
cd backend && npx prisma studio  # Interface BD
cd backend && npx prisma db seed  # Resetear datos

# Testing E2E (Playwright)
./test-e2e-full.sh                      # Script todo-en-uno (backend + tests)
cd frontend && npm run test:e2e         # Tests E2E (requiere backend corriendo)
cd frontend && npm run test:e2e:ui      # Tests con interfaz visual
```

### Puertos del Sistema
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Prisma Studio**: http://localhost:5555

### 👤 Credenciales de Desarrollo
```bash
# Administrador
admin / admin123

# Personal médico
enfermero1 / enfermero123
especialista1 / medico123

# Personal operativo
cajero1 / cajero123
almacen1 / almacen123
```

### 🔧 Comandos de Desarrollo

#### Frontend
```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run typecheck        # Verificación TypeScript
npm test                 # Tests unitarios (187 tests)
npm run test:e2e         # Tests E2E Playwright (19 tests)
npm run test:e2e:ui      # Tests E2E con interfaz visual
npm run test:e2e:debug   # Tests E2E en modo debug
```

#### Backend
```bash
npm run dev           # Servidor con nodemon
npm test              # Tests de integración
npx prisma generate   # Regenerar cliente Prisma
npx prisma migrate    # Aplicar migraciones
```

## 🔧 Configuración

### Variables de Entorno Backend (.env)
```bash
DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management?schema=public"
PORT=3001
JWT_SECRET=super_secure_jwt_secret_key_for_hospital_system_2024
NODE_ENV=development
```

### Variables de Entorno Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
```

## 📊 Módulos Implementados

### 🔐 1. Autenticación y Autorización
- **JWT con 7 roles** especializados
- **Middleware robusto** de autorización
- **Rutas protegidas** por permisos granulares

### 👥 2. Gestión de Empleados
- **CRUD completo** para personal médico
- **Roles especializados** (administrador, médicos, enfermeros, etc.)
- **Validación de datos** y formularios dinámicos

### 🏥 3. Gestión de Pacientes  
- **CRM médico** con búsqueda avanzada
- **Datos demográficos** completos
- **Contactos de emergencia** y responsables

### 🏠 4. Habitaciones y Consultorios
- **Control de ocupación** en tiempo real
- **Asignación automática** de espacios
- **Estados dinámicos** (disponible, ocupada, mantenimiento)

### 💰 5. Punto de Venta (POS)
- **Cuentas por paciente** con tipos de atención
- **Integración automática** con inventario
- **Cierre de cuentas** para facturación

### 📦 6. Inventario Completo
- **CRUD de productos** y proveedores
- **Control de stock** en tiempo real
- **Movimientos automáticos** desde ventas
- **Alertas de stock** bajo

### 💳 7. Facturación Integrada
- **Conversión automática** desde POS
- **Control de pagos** múltiples métodos
- **Cuentas por cobrar** con seguimiento

### 📊 8. Reportes Ejecutivos
- **Dashboard financiero** con KPIs
- **Reportes operativos** y análisis
- **Gráficos dinámicos** con datos en tiempo real

### 🏥 9. Hospitalización Avanzada
- **Ingresos hospitalarios** con anticipo automático de $10,000 MXN
- **Control de permisos granular** (cajero, médicos pueden crear; enfermeros consultan)
- **Notas médicas** completas con trazabilidad
- **Proceso de alta médica** con validaciones
- **UI adaptativa** según rol del usuario

### 🏢 10. Quirófanos
- **Gestión de quirófanos** y programación
- **Control de equipamiento** y capacidad
- **Validación de números** únicos

### 📋 11. Sistema de Auditoría
- **Trazabilidad completa** de operaciones
- **Logs detallados** de cambios
- **Middleware automático** de auditoría

### 🧪 12. Testing Framework
- **338 tests unit** (187 frontend + 151 backend, 52 backend failing por configuración)
- **19 tests E2E Playwright** (ITEM 3 & 4 validados)
- **Jest + Testing Library** configurado
- **Cobertura ~20%** (requiere expansión a 50%+)

## 🏗️ Arquitectura de Base de Datos

### PostgreSQL + Prisma ORM
El sistema utiliza **PostgreSQL 14.18** como motor de base de datos con **Prisma ORM**:
- **37 modelos/entidades** completamente normalizadas
- **110+ endpoints API** con validaciones robustas
- **Migraciones automáticas** y gestión de esquemas
- **Relaciones complejas** entre entidades médicas

### Tablas Principales
- **👥 Usuarios y Empleados**: Control de acceso y personal
- **🏥 Pacientes y Responsables**: CRM médico completo
- **🏠 Habitaciones y Consultorios**: Gestión de espacios
- **📦 Inventario**: Productos, proveedores, movimientos
- **💰 POS y Facturación**: Ventas y control financiero
- **🏥 Hospitalización**: Ingresos, notas SOAP, altas
- **🏢 Quirófanos**: Gestión de quirófanos y cirugías
- **📋 Auditoría**: Logs completos de operaciones

### Características Técnicas
- **Migraciones versionadas** con Prisma
- **Esquemas TypeScript** generados automáticamente
- **Conexiones optimizadas** con pool de conexiones
- **Backup automatizado** de datos críticos

Ver documentación completa en `/docs/hospital_erd_completo.md`

## 🔐 Seguridad y Auditoría

- **Autenticación JWT** con expiración automática
- **Autorización granular** por roles y permisos
- **Validación robusta** en frontend y backend
- **Sistema de auditoría** completo con trazabilidad
- **Encriptación bcrypt** para contraseñas
- **Middleware de seguridad** CORS y validaciones

## 🧪 Testing y Calidad

### Testing Framework: 338 Tests Implementados (~20% Cobertura Real)
```bash
Frontend: 187 tests ⚠️
├── Componentes de UI (parcial)
├── Servicios de pacientes ✅
├── Formularios (básicos)
└── Hooks (sin cobertura)

Backend: 141 tests ✅ (122 passing, 19 skipped) - MEJORADO +127%
├── Database Connectivity ✅
├── Auth endpoints: 10/10 ✅ (100%)
├── Patients endpoints: 13/16 ✅ (81%)
├── Simple tests: 18/19 ✅ (95%)
├── Inventory tests: 29/29 ✅ (100%)
├── Middleware tests: 26/26 ✅ (100%)
├── Quirofanos tests: 36/36 ✅ (100%)
└── Solicitudes tests: 15/15 ✅ (100%)

E2E: 19 tests Playwright ✅
├── ITEM 3: Validación formularios (6 tests)
└── ITEM 4: Skip Links WCAG 2.1 AA (13 tests)

⚠️ NOTA: Números anteriores (1,422 tests) eran inflados.
Requiere expansión a 500+ tests para 50% cobertura.
📈 FASE 0-3 COMPLETADAS: +127% mejora backend | TypeScript 0 errores | God Components refactorizados
```

### Comandos de Testing
```bash
# Frontend - Tests unitarios
cd frontend && npm test

# Verificación TypeScript
cd frontend && npm run typecheck

# Build de producción
cd frontend && npm run build
```

### Infraestructura de Calidad
- **Jest + Testing Library** con TypeScript
- **ESLint + Prettier** para código limpio
- **TypeScript estricto** en todo el proyecto
- **Validación de formularios** con Yup
- **Componentes reutilizables** estandarizados

## 🔧 Comandos de Verificación

```bash
# Health check del sistema
curl http://localhost:3001/health
curl -s http://localhost:3000 | grep -q "Hospital" && echo "Frontend ✅"

# Database check
psql -d hospital_management -c "SELECT COUNT(*) FROM usuarios;"

# TypeScript check
cd frontend && npm run typecheck

# Reinicio completo
pkill -f "concurrently|nodemon|vite|server-modular.js"
npm run dev
```

## 📈 Endpoints API Principales

### Autenticación
- `POST /api/auth/login`
- `GET /api/auth/verify-token`
- `GET /api/auth/profile`

### Pacientes  
- `GET /api/patients` - Lista con filtros
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/:id` - Actualizar
- `DELETE /api/patients/:id` - Soft delete

### Inventario
- `GET /api/inventory/products` - Productos
- `GET /api/inventory/suppliers` - Proveedores
- `POST /api/inventory/movements` - Movimientos de stock
- `GET /api/inventory/stats` - Estadísticas

### Facturación
- `GET /api/billing/invoices` - Facturas
- `POST /api/billing/invoices` - Crear factura
- `GET /api/billing/accounts-receivable` - Cuentas por cobrar

### Hospitalización
- `GET /api/hospitalization/admissions` - Ingresos
- `POST /api/hospitalization/admissions/:id/notes` - Notas SOAP
- `PUT /api/hospitalization/admissions/:id/discharge` - Alta médica

### Quirófanos
- `GET /api/quirofanos` - Lista de quirófanos
- `POST /api/quirofanos` - Crear quirófano
- `GET /api/quirofanos/available-numbers` - Números disponibles

## 📚 Documentación

- **[CLAUDE.md](./CLAUDE.md)** - Instrucciones completas de desarrollo
- **[/docs/](./docs/)** - Documentación técnica detallada

## 🏆 Resumen del Sistema

### ✅ Sistema Funcional (Requiere Optimización)
- **14/14 módulos** implementados (75% completitud real)
- **338 tests reales** automatizados (~20% cobertura, necesita expansión)
- **115 endpoints API** verificados con validaciones robustas
- **7 roles de usuario** con permisos granulares
- **Sistema de auditoría** completo
- **⚠️ Estado:** Requiere 6-8 semanas de optimización (ver ANALISIS_SISTEMA_COMPLETO_2025.md)

### 🎯 Próximos Desarrollos
**FASE 2**: Sistema de Citas Médicas  
**FASE 3**: Dashboard Tiempo Real  
**FASE 4**: Expediente Médico Digital

---

**🏥 Sistema de Gestión Hospitalaria Integral**
**👨‍💻 Desarrollado por:** Alfredo Manuel Reyes
**🏢 Empresa:** agnt_ - Software Development Company
**🚀 Stack:** React 18 + TypeScript + Node.js + PostgreSQL + Material-UI
**📅 Última actualización:** 31 de octubre de 2025 - FASE 3 Completada ✅
**✅ Estado:** Sistema Funcional (78%) - Tests 86.5% ✅ | TypeScript 0 errores | God Components refactorizados  

---
*© 2025 agnt_ Software Development Company. Todos los derechos reservados.*