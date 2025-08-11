# 🏥 Sistema de Gestión Hospitalaria

**Sistema integral de gestión hospitalaria desarrollado con React + TypeScript + Node.js**

![Estado del Proyecto](https://img.shields.io/badge/Estado-95%25%20Completado-brightgreen)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Tests](https://img.shields.io/badge/Tests-29%20Pasando-success)
![Licencia](https://img.shields.io/badge/Licencia-MIT-yellow)

---

## 🎯 Estado Actual del Proyecto

### ✅ FASE 1 COMPLETADA - Sistema Core + Testing Framework (100%) ✅ ACTUALIZADO

**15/15 Módulos Core Completados:**
1. **Autenticación y Autorización** - Sistema completo de roles y permisos JWT ✅
2. **Gestión de Empleados** - CRUD completo para personal médico y administrativo ✅
3. **Gestión de Pacientes** - Registro completo con responsables e historial médico ✅
4. **Habitaciones y Consultorios** - Asignación y control de espacios hospitalarios ✅
5. **Punto de Venta (POS)** - Facturación de servicios y productos médicos ✅
6. **Inventario** - Control completo de stock, proveedores y productos ✅
7. **Integración POS-Inventario** - Actualización automática de stock en ventas ✅
8. **Facturación Completa** - Facturas automáticas, pagos, cuentas por cobrar ✅ **BUGS CORREGIDOS**
9. **Reportes Avanzados** - Financieros, operativos y ejecutivos con gráficos ✅ **BUGS CORREGIDOS**
10. **Hospitalización Avanzada** - Formularios SOAP, ingresos, altas integradas ✅
11. **Framework de Testing** - Jest + Testing Library + Supertest (26+ tests) ✅
12. **Base de Datos PostgreSQL** - Migración completa con Prisma ORM ✅ **COMPLETADO**
13. **Arquitectura Modular** - server-modular.js con rutas separadas ✅ **COMPLETADO**
14. **Servicio de Desarrollo Unificado** - npm run dev para ambos servicios ✅ **COMPLETADO**
15. **Corrección de Errores Críticos** - TypeErrors resueltos completamente ✅ **COMPLETADO**

### 🎯 Próximas Fases del Proyecto ✅ ACTUALIZADO

~~**FASE 2**: Migración a Base de Datos PostgreSQL~~ ✅ **COMPLETADO (Agosto 2025)**  
**FASE 3**: Funcionalidades Avanzadas - Dashboard tiempo real (Agosto-Septiembre 2025)  
**FASE 4**: Despliegue en Producción - Docker + CI/CD (Octubre 2025)

## ✨ Características Principales

### 🏥 Gestión Médica Avanzada
- **Hospitalización Completa** - Ingresos, notas médicas SOAP, altas integradas
- **Gestión de Pacientes** - CRM médico con historial completo
- **Habitaciones y Consultorios** - Control de ocupación en tiempo real
- **Personal Médico** - 7 roles especializados con permisos granulares

### 💰 Gestión Financiera Integral
- **Punto de Venta (POS)** - Integrado con inventario en tiempo real
- **Facturación Automática** - Conversión automática desde cuentas POS
- **Control de Pagos** - Pagos parciales, cuentas por cobrar, análisis
- **Reportes Financieros** - KPIs ejecutivos, tendencias, proyecciones

### 📊 Administración Inteligente
- **Dashboard Ejecutivo** - Métricas en tiempo real con gráficos SVG
- **Inventario Inteligente** - Alertas de stock, movimientos automáticos
- **Reportes Operativos** - Productividad, ocupación, análisis detallado
- **Testing Framework** - 29 tests automatizados para calidad garantizada

## 👥 Roles del Sistema

1. **Administrador**: Acceso completo al sistema
2. **Cajero**: POS, pacientes, habitaciones, facturación
3. **Enfermero**: Pacientes, habitaciones, inventario (lectura)
4. **Almacenista**: Inventario completo, control de stock
5. **Médico Residente**: Pacientes, habitaciones, atención médica
6. **Médico Especialista**: Pacientes, habitaciones, reportes médicos
7. **Socio**: Acceso de solo lectura a reportes financieros

## 🛠 Tecnologías Implementadas

### Frontend (React 18 Stack)
- **React 18** + **TypeScript** - Framework moderno con tipado estático
- **Material-UI (MUI)** - Componentes profesionales con tema personalizado
- **Redux Toolkit** - Gestión de estado predecible
- **React Router v6** - Navegación con rutas protegidas por roles
- **Vite** - Build tool optimizado para desarrollo rápido
- **Jest + Testing Library** - Framework de testing unitario ✅

### Backend (Node.js Stack)
- **Node.js 18** + **Express.js** - API REST robusta con 80+ endpoints
- **JWT** - Autenticación segura con roles granulares
- **CORS** + **Middleware** - Seguridad y validaciones
- **Mock Data** - Sistema completo en memoria (listo para BD)
- **Jest + Supertest** - Testing de integración para APIs ✅

### Testing Framework ✅ NUEVO
- **29 tests implementados** (26 frontend + 3 backend)
- **Jest configurado** con TypeScript y JSX support
- **Mocks avanzados** para import.meta.env, localStorage, APIs
- **CI/CD ready** para automatización de testing

### Próximas Implementaciones (Fase 2-4)
- **PostgreSQL + Prisma ORM** - Migración a base de datos relacional
- **Docker + Docker Compose** - Containerización completa
- **Nginx + SSL** - Servidor web con certificados automáticos
- **GitHub Actions** - Pipeline CI/CD con testing automatizado

## 📁 Estructura del Proyecto

```
agntsystemsc/
├── docs/                    # Documentación técnica
├── backend/                 # API REST
├── frontend/                # Aplicación React
├── deployment/              # Configuración Docker/Nginx
└── .github/workflows/       # CI/CD
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- **Node.js 18+** 
- **npm 9+**

### 🚀 Inicio Rápido

#### 🚀 COMANDO PRINCIPAL (RECOMENDADO) ✅ ACTUALIZADO

```bash
# Desde la raíz del proyecto
cd /Users/alfredo/agntsystemsc

# INICIAR DESARROLLO COMPLETO - Backend + Frontend
npm run dev
```

#### Comandos Alternativos (Manual)
```bash
# Backend solo (server-modular.js + nodemon)
cd backend && npm run dev

# Frontend solo (Vite dev server)
cd frontend && npm run dev
```

#### Acceder a la aplicación ✅ ACTUALIZADO
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:3001 (server-modular.js)  
- **Health Check**: http://localhost:3001/health
- **Database UI**: http://localhost:5555 (npx prisma studio)

#### Credenciales de desarrollo
- **admin** / **admin123** (Administrador completo)
- **enfermero1** / **enfermero123** (Enfermero + Hospitalización)
- **especialista1** / **medico123** (Médico Especialista + Reportes)
- **cajero1** / **cajero123** (Cajero + POS + Facturación)
- **almacen1** / **almacen123** (Almacenista + Inventario)
- **residente1** / **residente123** (Médico Residente)
- **socio1** / **socio123** (Socio + Reportes Financieros)

#### 🆘 Si tienes problemas
Ver: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 🔧 Comandos de Desarrollo

#### Frontend
```bash
npm run dev          # Servidor de desarrollo (localhost:3002)
npm run build        # Build de producción  
npm run typecheck    # Verificación de tipos TypeScript
npm run lint         # Linting y corrección de código
npm test             # Tests unitarios (26 tests)
npm run test:watch   # Tests en modo watch
npm run test:coverage # Coverage report
```

#### Backend
```bash
node simple-server.js  # Iniciar servidor (localhost:3001)
npm test              # Tests de integración (3 tests core)
npm run test:watch    # Tests en modo watch
```

## 🔧 Configuración

### Variables de Entorno (Backend)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db"
JWT_SECRET="your_super_secure_jwt_secret"
PORT=3001
NODE_ENV=development
```

### Variables de Entorno (Frontend)
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME="Sistema Hospitalario"
```

## 📊 Módulos del Sistema Implementados

### 1. Autenticación y Roles ✅
- **JWT completo** con 7 roles especializados
- **Rutas protegidas** por permisos granulares
- **Middleware de autorización** robusto

### 2. Gestión de Pacientes ✅
- **CRM médico completo** con datos demográficos
- **Historial médico** y contactos de emergencia
- **Búsqueda avanzada** y estadísticas

### 3. Punto de Venta (POS) ✅
- **Cuentas por paciente** con tipos de atención
- **Transacciones integradas** con inventario
- **Cierre automático** para facturación

### 4. Inventario Inteligente ✅
- **Control de stock** en tiempo real
- **Gestión de proveedores** y productos
- **Movimientos automáticos** desde POS
- **Alertas de bajo inventario**

### 5. Facturación Avanzada ✅
- **Conversión automática** desde cuentas POS
- **Control de pagos** parciales y totales
- **Cuentas por cobrar** con antigüedad
- **5 estados de factura** y métodos de pago

### 6. Hospitalización SOAP ✅
- **Formulario de ingreso** completo
- **Notas médicas SOAP** (Subjetivo, Objetivo, Análisis, Plan)
- **Proceso de alta** con recetas y recomendaciones
- **Integración automática** con facturación

### 7. Reportes Ejecutivos ✅
- **Dashboard financiero** con KPIs en tiempo real
- **Reportes operativos** de productividad y ocupación
- **Análisis ejecutivo** con tendencias y proyecciones
- **Gráficos SVG** personalizados

### 8. Testing Framework ✅
- **29 tests automatizados** (Frontend + Backend)
- **Jest + Testing Library** completamente configurado
- **CI/CD ready** para automatización

## 🏗️ Arquitectura de Datos

### Estado Actual: Mock Data en Memoria
El sistema utiliza **datos mock estructurados** que replican completamente el comportamiento de una base de datos:
- **80+ endpoints** API completamente funcionales
- **Validaciones** médicas y administrativas
- **Relaciones** entre entidades mantenidas
- **Transacciones** simuladas con consistencia

### Próximo: PostgreSQL + Prisma ORM (Fase 2)
Diseño de **19 tablas principales** listo para migración:
- **Usuarios y Roles**: Control de acceso granular
- **Pacientes y Responsables**: CRM médico completo
- **Empleados**: Médicos, residentes, enfermeros, administradores
- **Habitaciones y Consultorios**: Gestión de espacios hospitalarios
- **Inventario**: Productos, proveedores, movimientos de stock
- **Hospitalización**: Ingresos, notas SOAP, altas médicas
- **Facturación**: Cuentas, transacciones, pagos, reportes

### Ventajas del Diseño Actual
- **Desarrollo rápido** sin dependencias de BD
- **Testing sencillo** sin setup de base de datos
- **Migración directa** a PostgreSQL preparada
- **Backup simple** - todo el estado en archivos JSON

Ver documentación completa en `/docs/hospital_erd_completo.md`

## 🔐 Seguridad

- Autenticación JWT con expiración
- Autorización por roles granular
- Validación de entrada en frontend y backend
- Logs de auditoría completos
- Encriptación de contraseñas con bcrypt

## 🧪 Testing Framework Implementado

### ✅ Coverage Actual: 29 Tests Pasando
```bash
Frontend: 26 tests ✅
├── Login Component (14 tests)
├── Constants Module (12 tests)

Backend: 3 core tests ✅  
├── Authentication API
├── Patient API  
├── Error Handling
```

### Comandos de Testing
```bash
# Frontend - Tests unitarios
cd frontend
npm test                    # Todos los tests (26)
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Backend - Tests de integración
cd backend
npm test                   # Tests API (3 core)
npm run test:watch         # Watch mode

# Verificación completa del sistema
cd frontend && npm test && cd ../backend && npm test
```

### Testing Infrastructure
- **Jest + Testing Library** configurado con TypeScript
- **Supertest** para testing de APIs REST
- **Mocks avanzados** para import.meta.env, localStorage, servicios
- **Module mapping** para paths @/* resuelto
- **CI/CD ready** para automatización con GitHub Actions

## 🚢 Despliegue en VPS

### Despliegue Automático
```bash
# Configurar servidor remoto en deployment/scripts/deploy.sh
npm run deploy
```

### Despliegue Manual
```bash
# En el servidor VPS
git clone <repository-url>
cd agntsystemsc

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Configurar variables de entorno de producción
cp backend/.env.example backend/.env
# Editar con datos de producción

# Construir y ejecutar
docker-compose -f deployment/docker-compose.yml up -d

# Configurar SSL con Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

## 📈 Flujos de Trabajo Implementados

### Flujo de Consulta General ✅
1. **Cajero** registra paciente y abre cuenta POS
2. **Médico** atiende y registra diagnóstico en el sistema
3. **Cajero** agrega servicios/medicamentos (inventario se descuenta automáticamente)
4. **Sistema** cierra cuenta automáticamente y genera factura

### Flujo de Hospitalización Avanzada ✅
1. **Cajero** abre cuenta con anticipo y tipo "hospitalización"
2. **Especialista** completa formulario de ingreso hospitalario
3. **Personal médico** registra notas SOAP diarias
4. **Enfermeros/Residentes** aplican medicamentos y documentan evolución
5. **Especialista** procesa alta médica con recetas y recomendaciones  
6. **Sistema** genera facturación automática incluyendo honorarios

### Flujo de Facturación Integrada ✅
1. **POS** genera transacciones con descuento automático de inventario
2. **Sistema** convierte cuentas cerradas a facturas automáticamente
3. **Cajero** registra pagos (efectivo, tarjeta, transferencia, seguro)
4. **Administrador** monitorea cuentas por cobrar y vencimientos
5. **Reportes** automáticos de ingresos, productividad y análisis

### Flujo de Inventario Inteligente ✅
1. **Almacenista** registra productos y proveedores en el sistema
2. **POS** descuenta stock automáticamente en cada transacción
3. **Sistema** genera alertas cuando productos alcanzan stock mínimo
4. **Reportes** de rotación, productos más utilizados y análisis de costos

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo `LICENSE` para detalles.

## 🎉 Resumen de Logros

### ✅ Sistema Core Completado (95%)
- **11/11 módulos** implementados y funcionando
- **29 tests** automatizados (26 frontend + 3 backend)
- **80+ endpoints** API robustos con validaciones
- **7 roles de usuario** con permisos granulares
- **Integración completa** entre todos los módulos

### 🏆 Funcionalidades Destacadas
- **Hospitalización SOAP** - Formularios médicos profesionales
- **Facturación automática** - Desde POS a facturas sin intervención manual
- **Inventario inteligente** - Control de stock en tiempo real
- **Dashboard ejecutivo** - KPIs y métricas con gráficos SVG
- **Testing framework** - Calidad garantizada con automatización

### 📋 Roadmap 2025

#### 🎯 Fase 2: Base de Datos (Febrero)
- PostgreSQL + Prisma ORM
- Migración completa de mock data
- Optimización de consultas
- Backup automatizado

#### 🎯 Fase 3: Funcionalidades Avanzadas (Marzo)
- Dashboard tiempo real con WebSockets
- Sistema de citas médicas
- Portal de pacientes autoservicio
- Integración básica con laboratorio

#### 🎯 Fase 4: Producción (Abril)
- Docker + Docker Compose
- CI/CD Pipeline con GitHub Actions
- Deployment VPS con SSL
- Monitoring y alertas

---

## 📞 Soporte y Documentación

### 📚 Documentación Técnica
- **[CLAUDE.md](./CLAUDE.md)** - Instrucciones completas de desarrollo
- **[PROYECTO_STATUS.md](./PROYECTO_STATUS.md)** - Estado detallado del proyecto
- **[TESTING_PROGRESS_REPORT.md](./TESTING_PROGRESS_REPORT.md)** - Reporte de testing
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solución de problemas
- **[/docs/](./docs/)** - Documentación arquitectural

### 🔍 Verificación Rápida del Sistema
```bash
# Health check completo
curl http://localhost:3001/health

# Frontend funcionando
curl http://localhost:3002

# Tests pasando
cd frontend && npm test
cd backend && npm test
```

### 📧 Soporte Técnico
Para soporte técnico, crear un issue en el repositorio o contactar al equipo de desarrollo.

---

**🏥 Sistema de Gestión Hospitalaria v1.0.0**  
*Solución integral para centros médicos modernos*

*Desarrollado con ❤️ usando React 18 + TypeScript + Node.js + Material-UI*

---
*Última actualización: 31 de enero de 2025 - FASE 1 COMPLETADA ✅*