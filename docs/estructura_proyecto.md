# Estructura del Proyecto - Sistema de Gestión Hospitalaria

## Stack Tecnológico

### Backend
- **Framework**: Node.js con Express.js
- **Base de datos**: PostgreSQL 14.18
- **ORM**: Prisma ORM
- **Autenticación**: JWT + bcrypt
- **Validación**: Custom middleware + Yup (frontend)
- **Auditoría**: Sistema completo de trazabilidad
- **Testing**: Jest + Supertest (449 tests backend)

### Frontend
- **Framework**: React 18 con TypeScript
- **UI Library**: Material-UI v5.14.5
- **Estado**: Redux Toolkit + RTK Query
- **Formularios**: React Hook Form + Yup
- **Routing**: React Router v6
- **Gráficos**: Recharts
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library (940 tests frontend)
- **E2E Testing**: Playwright (55 tests)

### DevOps y Despliegue
- **Hosting**: VPS con EasyPanel
- **Containerización**: Docker (via EasyPanel)
- **SSL**: Automático via EasyPanel
- **CI/CD**: GitHub Actions
- **Base de datos**: PostgreSQL en contenedor

## Estructura de Directorios

```
agntsystemsc/
├── docs/                           # Documentación
│   ├── DEPLOYMENT_EASYPANEL.md     # Guía de deployment VPS
│   ├── hospital_erd_completo.md    # Diseño de BD
│   ├── sistema_roles_permisos.md   # Matriz de permisos
│   └── estructura_proyecto.md      # Este archivo
│
├── backend/                        # API REST
│   ├── server-modular.js           # Servidor principal
│   ├── routes/                     # 15 rutas modulares
│   ├── middleware/                 # Auth, auditoría, logging
│   ├── utils/                      # Helpers y utilidades
│   ├── prisma/
│   │   ├── schema.prisma           # 37 modelos/entidades
│   │   └── seed.js                 # Datos de prueba
│   └── tests/                      # Tests backend (449)
│
├── frontend/                       # React App
│   ├── src/
│   │   ├── components/             # Componentes reutilizables
│   │   ├── pages/                  # 14 páginas principales
│   │   ├── services/               # Servicios API
│   │   ├── store/                  # Redux store
│   │   ├── types/                  # TypeScript types
│   │   └── hooks/                  # Custom hooks
│   ├── e2e/                        # Tests Playwright (55)
│   └── src/__tests__/              # Tests unitarios (940)
│
├── .github/workflows/              # GitHub Actions CI/CD
├── CLAUDE.md                       # Instrucciones desarrollo
└── README.md                       # Documentación principal
```

## Configuración de Base de Datos

### Variables de Entorno Backend (.env)
```bash
DATABASE_URL="postgresql://user@localhost:5432/hospital_management?schema=public"
PORT=3001
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Variables de Entorno Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
```

### Puertos del Sistema
| Servicio | Puerto |
|----------|--------|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| PostgreSQL | localhost:5432 |
| Prisma Studio | http://localhost:5555 |

## Scripts de Desarrollo

### Comando Principal
```bash
npm run dev  # Inicia backend y frontend juntos
```

### Scripts Backend
```bash
cd backend && npm run dev      # Server-modular.js puerto 3001
cd backend && npm test         # 449 tests backend
cd backend && npx prisma studio # Interface BD puerto 5555
cd backend && npx prisma db seed # Resetear datos
```

### Scripts Frontend
```bash
cd frontend && npm run dev     # Vite puerto 3000
cd frontend && npm test        # 940 tests frontend
cd frontend && npm run build   # Build producción
cd frontend && npm run typecheck # Verificar TypeScript
cd frontend && npm run test:e2e  # Tests Playwright
```

## Estado del Sistema (Noviembre 2025)

### Métricas Técnicas
- **14/14 Módulos Core** completamente funcionales
- **37 modelos/entidades BD** con Prisma ORM
- **123 endpoints API** con validaciones robustas
- **7 roles especializados** con permisos granulares
- **Sistema de auditoría** completo implementado

### Estado de Tests
| Categoría | Tests | Pass Rate |
|-----------|-------|-----------|
| Frontend | 927/940 | 98.6% |
| Backend | 395/449 | 88.0% |
| E2E Auth | 7/7 | 100% |
| **Total** | **1,444** | **~92%** |

### URLs de Producción
- **Frontend**: `https://hospital-management-system-frontend.1nse3e.easypanel.host`
- **Backend**: `https://hospital-management-system-backend-jgqx.1nse3e.easypanel.host`

---
**🏥 Sistema de Gestión Hospitalaria Integral**
**Desarrollado por:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Teléfono:** 443 104 7479
**Última actualización:** 28 de noviembre de 2025
