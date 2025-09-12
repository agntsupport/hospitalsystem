# Estructura del Proyecto - Sistema de Gestión Hospitalaria

## Stack Tecnológico Seleccionado

### Backend ✅ IMPLEMENTADO
- **Framework**: Node.js con Express.js ✅
- **Base de datos**: PostgreSQL 14.18 ✅
- **ORM**: Prisma ORM ✅
- **Autenticación**: JWT + bcrypt ✅
- **Validación**: Custom middleware + Yup (frontend) ✅
- **Auditoría**: Sistema completo de trazabilidad ✅
- **Testing**: Jest + Supertest ✅ (26 tests backend)

### Frontend ✅ IMPLEMENTADO
- **Framework**: React 18 con TypeScript ✅
- **UI Library**: Material-UI v5.14.5 ✅
- **Estado**: Redux Toolkit + RTK Query ✅
- **Formularios**: React Hook Form + Yup ✅
- **Routing**: React Router v6 ✅
- **Gráficos**: Recharts ✅
- **Build Tool**: Vite ✅
- **Testing**: Jest + React Testing Library ✅ (69 tests frontend)

### DevOps y Despliegue
- **Containerización**: Docker + Docker Compose
- **Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **CI/CD**: GitHub Actions
- **Base de datos**: PostgreSQL en contenedor
- **Backup**: pg_dump automatizado

## Estructura de Directorios

```
agntsystemsc/                      # ✅ ESTRUCTURA ACTUAL IMPLEMENTADA
├── docs/                           # Documentación
│   ├── hospital_erd_completo.md    ✅
│   ├── sistema_roles_permisos.md   ✅
│   └── estructura_proyecto.md      ✅
│
├── backend/                        # API REST ✅ IMPLEMENTADO
│   ├── server-modular.js           # 🚀 Servidor principal
│   ├── routes/                     # Rutas modulares
│   │   ├── auth.routes.js          ✅
│   │   ├── patients.routes.js      ✅
│   │   ├── employees.routes.js     ✅
│   │   ├── rooms.routes.js         ✅
│   │   ├── inventory.routes.js     ✅
│   │   ├── billing.routes.js       ✅
│   │   ├── hospitalization.routes.js ✅
│   │   ├── quirofanos.routes.js    ✅
│   │   └── reports.routes.js       ✅
│   │
│   ├── middleware/                 # Middleware personalizado
│   │   ├── auth.middleware.js      ✅
│   │   ├── audit.middleware.js     ✅
│   │   └── validation.middleware.js ✅
│   │
│   ├── utils/                      # Utilidades
│   │   ├── database.js             ✅
│   │   └── helpers.js              ✅
│   │
│   ├── prisma/                     # Configuración BD
│   │   ├── schema.prisma           ✅ 37 modelos/entidades
│   │   └── seed.js                 ✅
│   │
│   ├── tests/                      # Tests backend
│   │   └── *.test.js               ✅ 26 tests
│   │
│   └── package.json                ✅
│
├── frontend/                       # React App ✅ IMPLEMENTADO
│   ├── src/
│   │   ├── components/             # Componentes reutilizables
│   │   │   ├── common/             ✅ Sidebar, Layout, etc.
│   │   │   ├── forms/              ✅ FormDialog base
│   │   │   ├── billing/            ✅ Facturación
│   │   │   ├── pos/                ✅ Punto de venta
│   │   │   └── inventory/          ✅ Inventario
│   │   │
│   │   ├── pages/                  # Páginas principales
│   │   │   ├── auth/               ✅ Login
│   │   │   ├── dashboard/          ✅ Dashboard
│   │   │   ├── patients/           ✅ Gestión pacientes
│   │   │   ├── employees/          ✅ Personal
│   │   │   ├── rooms/              ✅ Habitaciones
│   │   │   ├── inventory/          ✅ Inventario
│   │   │   ├── pos/                ✅ POS
│   │   │   ├── hospitalization/    ✅ Hospitalización
│   │   │   ├── quirofanos/         ✅ Quirófanos
│   │   │   └── billing/            ✅ Facturación
│   │   │
│   │   ├── services/               # Servicios API
│   │   │   ├── api.ts              ✅ Configuración Axios
│   │   │   ├── authService.ts      ✅
│   │   │   ├── patientsService.ts  ✅
│   │   │   ├── hospitalizationService.ts ✅
│   │   │   └── [otros servicios]   ✅
│   │   │
│   │   ├── store/                  # Redux Store
│   │   │   ├── index.ts            ✅
│   │   │   ├── authSlice.ts        ✅
│   │   │   └── [otros slices]      ✅
│   │   │
│   │   ├── types/                  # Tipos TypeScript
│   │   │   ├── auth.types.ts       ✅
│   │   │   ├── hospitalization.types.ts ✅
│   │   │   └── [otros tipos]       ✅
│   │   │
│   │   ├── hooks/                  # Custom Hooks
│   │   │   └── useBaseFormDialog.ts ✅
│   │   │
│   │   ├── schemas/                # Validación Yup
│   │   │   ├── hospitalization.schemas.ts ✅
│   │   │   └── [otros schemas]     ✅
│   │   │
│   │   └── tests/                  # Tests frontend
│   │       └── *.test.tsx          ✅ 69 tests
│   │
│   ├── package.json                ✅
│   └── vite.config.ts              ✅
│
├── deployment/                     # Configuración despliegue (PENDIENTE)
│   ├── docker/                     # Dockerfiles
│   ├── nginx/                      # Configuración proxy
│   └── scripts/                    # Scripts despliegue
│
├── .github/                        # GitHub Actions (PENDIENTE)
│   └── workflows/                  # CI/CD workflows
│
├── CLAUDE.md                       ✅ Instrucciones desarrollo
├── README.md                       ✅ Documentación principal
├── TESTING_PLAN_E2E.md            ✅ Plan testing E2E
├── .gitignore                      ✅
└── package.json                    ✅ Scripts globales
```

## Configuración de Base de Datos

### Variables de Entorno Actuales ✅

**Backend (.env):**
```bash
DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management?schema=public"
PORT=3001
JWT_SECRET=super_secure_jwt_secret_key_for_hospital_system_2024
NODE_ENV=development
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3001
```

### Base de Datos PostgreSQL ✅
- **Motor**: PostgreSQL 14.18 
- **ORM**: Prisma con 37 modelos/entidades
- **Ubicación**: `backend/prisma/schema.prisma`
- **Seeds**: Sistema de datos de prueba en `backend/prisma/seed.js`
- **Migraciones**: Automáticas con Prisma
- **Conexión**: Pool de conexiones optimizado

Ver esquema completo en: `/docs/hospital_erd_completo.md`

## Scripts de Desarrollo

### Scripts Principales Implementados ✅

**Comando Principal:**
```bash
npm run dev  # Inicia backend y frontend juntos
```

**Scripts Backend:**
```bash
cd backend && npm run dev      # Server-modular.js puerto 3001
cd backend && npm test         # 26 tests backend + BD
cd backend && npx prisma studio # Interface BD puerto 5555  
cd backend && npx prisma db seed # Resetear datos
```

**Scripts Frontend:**
```bash
cd frontend && npm run dev     # Vite puerto 3000
cd frontend && npm test        # 69 tests frontend
cd frontend && npm run build   # Build producción
cd frontend && npm run typecheck # Verificar TypeScript
```

### Comandos de Verificación ✅
```bash
# Health check completo
curl http://localhost:3001/health
psql -d hospital_management -c "SELECT COUNT(*) FROM usuarios;"

# Reinicio completo
pkill -f "concurrently|nodemon|vite|server-modular.js"
npm run dev
```

## ✅ Estado Actual del Sistema

### Características Implementadas:
- **✅ Escalable**: Arquitectura modular con 12/12 módulos funcionales
- **✅ Mantenible**: Separación clara de responsabilidades entre frontend/backend  
- **✅ Testeable**: 16 tests implementados (9 frontend + 7 backend) + Plan E2E
- **✅ Seguro**: Sistema completo de roles, auditoría y JWT
- **⏳ Desplegable**: Configuración Docker/Nginx pendiente (FASE 6)

### Métricas Técnicas:
- **14/14 Módulos Core** completamente funcionales
- **37 modelos/entidades BD** con Prisma ORM
- **110+ endpoints API** con validaciones robustas
- **7 roles especializados** con permisos granulares
- **Sistema de auditoría** completo implementado

### Próximos Desarrollos:
- **FASE 2**: Sistema de Citas Médicas
- **FASE 3**: Dashboard Tiempo Real con WebSockets  
- **FASE 4**: Expediente Médico Digital Completo
- **FASE 5**: Implementación Testing E2E con Cypress
- **FASE 6**: Containerización y Despliegue

---
**🏥 Sistema 100% Funcional** - Desarrollado por Alfredo Manuel Reyes / agnt_ Software Development Company