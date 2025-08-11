# Estructura del Proyecto - Sistema de Gestión Hospitalaria

## Stack Tecnológico Seleccionado

### Backend
- **Framework**: Node.js con Express.js
- **Base de datos**: PostgreSQL 15+
- **ORM**: Prisma (para manejo de migraciones y queries)
- **Autenticación**: JWT + bcrypt
- **Validación**: Joi o Zod
- **Logs**: Winston
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 con TypeScript
- **UI Library**: Material-UI (MUI) o Tailwind CSS + Headless UI
- **Estado**: Redux Toolkit + RTK Query
- **Formularios**: React Hook Form + Yup
- **Tablas**: TanStack Table (React Table v8)
- **Gráficos**: Chart.js o Recharts
- **Testing**: Jest + React Testing Library

### DevOps y Despliegue
- **Containerización**: Docker + Docker Compose
- **Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **CI/CD**: GitHub Actions
- **Base de datos**: PostgreSQL en contenedor
- **Backup**: pg_dump automatizado

## Estructura de Directorios

```
agntsystemsc/
├── docs/                           # Documentación
│   ├── hospital_erd_completo.md
│   ├── sistema_roles_permisos.md
│   └── api_documentation.md
│
├── backend/                        # API REST
│   ├── src/
│   │   ├── config/                 # Configuraciones
│   │   │   ├── database.js
│   │   │   ├── jwt.js
│   │   │   └── environment.js
│   │   │
│   │   ├── controllers/            # Controladores por módulo
│   │   │   ├── auth.controller.js
│   │   │   ├── patients.controller.js
│   │   │   ├── employees.controller.js
│   │   │   ├── rooms.controller.js
│   │   │   ├── inventory.controller.js
│   │   │   ├── pos.controller.js
│   │   │   ├── hospitalization.controller.js
│   │   │   └── reports.controller.js
│   │   │
│   │   ├── models/                 # Modelos de Prisma
│   │   │   └── schema.prisma
│   │   │
│   │   ├── routes/                 # Rutas API
│   │   │   ├── auth.routes.js
│   │   │   ├── patients.routes.js
│   │   │   ├── employees.routes.js
│   │   │   ├── rooms.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── pos.routes.js
│   │   │   ├── hospitalization.routes.js
│   │   │   └── reports.routes.js
│   │   │
│   │   ├── middleware/             # Middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── roles.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── audit.middleware.js
│   │   │   └── error.middleware.js
│   │   │
│   │   ├── services/               # Lógica de negocio
│   │   │   ├── auth.service.js
│   │   │   ├── patients.service.js
│   │   │   ├── employees.service.js
│   │   │   ├── rooms.service.js
│   │   │   ├── inventory.service.js
│   │   │   ├── pos.service.js
│   │   │   ├── hospitalization.service.js
│   │   │   ├── reports.service.js
│   │   │   └── email.service.js
│   │   │
│   │   ├── utils/                  # Utilidades
│   │   │   ├── logger.js
│   │   │   ├── validators.js
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── tests/                  # Tests unitarios e integración
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   │
│   │   └── app.js                  # Aplicación principal
│   │
│   ├── prisma/                     # Migraciones y seeds
│   │   ├── migrations/
│   │   ├── seed.js
│   │   └── schema.prisma
│   │
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   ├── .gitignore
│   └── server.js                   # Punto de entrada
│
├── frontend/                       # Aplicación React
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/             # Componentes reutilizables
│   │   │   ├── common/             # Componentes generales
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── DataTable.tsx
│   │   │   │
│   │   │   ├── forms/              # Formularios específicos
│   │   │   │   ├── PatientForm.tsx
│   │   │   │   ├── EmployeeForm.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   └── OrderForm.tsx
│   │   │   │
│   │   │   └── charts/             # Componentes de gráficos
│   │   │       ├── RevenueChart.tsx
│   │   │       └── OccupancyChart.tsx
│   │   │
│   │   ├── pages/                  # Páginas por módulo
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── ChangePassword.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.tsx
│   │   │   │
│   │   │   ├── patients/           # Módulo CRM
│   │   │   │   ├── PatientsList.tsx
│   │   │   │   ├── PatientDetail.tsx
│   │   │   │   └── PatientHistory.tsx
│   │   │   │
│   │   │   ├── employees/
│   │   │   │   ├── EmployeesList.tsx
│   │   │   │   └── EmployeeDetail.tsx
│   │   │   │
│   │   │   ├── rooms/
│   │   │   │   ├── RoomsList.tsx
│   │   │   │   └── RoomStatus.tsx
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   ├── ProductsList.tsx
│   │   │   │   ├── ProvidersList.tsx
│   │   │   │   └── StockReport.tsx
│   │   │   │
│   │   │   ├── pos/                # Punto de venta
│   │   │   │   ├── NewSale.tsx
│   │   │   │   ├── OpenAccounts.tsx
│   │   │   │   └── AccountDetail.tsx
│   │   │   │
│   │   │   ├── hospitalization/
│   │   │   │   ├── PatientAdmission.tsx
│   │   │   │   ├── MedicalOrders.tsx
│   │   │   │   ├── EvolutionNotes.tsx
│   │   │   │   └── MedicationAdmin.tsx
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── DailyReports.tsx
│   │   │       ├── MonthlyReports.tsx
│   │   │       └── CustomReports.tsx
│   │   │
│   │   ├── store/                  # Redux store
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── patientsSlice.ts
│   │   │   │   ├── employeesSlice.ts
│   │   │   │   ├── inventorySlice.ts
│   │   │   │   └── uiSlice.ts
│   │   │   │
│   │   │   ├── api/                # RTK Query APIs
│   │   │   │   ├── authApi.ts
│   │   │   │   ├── patientsApi.ts
│   │   │   │   ├── employeesApi.ts
│   │   │   │   ├── inventoryApi.ts
│   │   │   │   └── reportsApi.ts
│   │   │   │
│   │   │   └── store.ts
│   │   │
│   │   ├── hooks/                  # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── useDebounce.ts
│   │   │
│   │   ├── utils/                  # Utilidades frontend
│   │   │   ├── constants.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── permissions.ts
│   │   │
│   │   ├── types/                  # Tipos TypeScript
│   │   │   ├── auth.types.ts
│   │   │   ├── patient.types.ts
│   │   │   ├── employee.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   ├── styles/                 # Estilos globales
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   │
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── routes.tsx              # Configuración de rutas
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
│
├── deployment/                     # Configuración de despliegue
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── Dockerfile.nginx
│   │
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── default.conf
│   │
│   ├── scripts/
│   │   ├── deploy.sh
│   │   ├── backup.sh
│   │   └── restore.sh
│   │
│   └── docker-compose.yml
│
├── .github/                        # GitHub Actions
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── README.md
├── .gitignore
└── package.json                    # Scripts globales
```

## Configuración de Base de Datos

### Variables de Entorno (.env)
```bash
# Base de datos
DATABASE_URL="postgresql://username:password@localhost:5432/hospital_db"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_db
DB_USER=hospital_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRES_IN=8h

# Servidor
PORT=3001
NODE_ENV=development

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/hospital.log

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Schema de Prisma (basado en nuestro ERD)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String   @map("password_hash")
  email        String?  @unique
  rol          Rol
  activo       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relaciones
  cuentasApertura CuentaPaciente[] @relation("CajeroApertura")
  cuentasCierre   CuentaPaciente[] @relation("CajeroCierre")
  transacciones   TransaccionCuenta[]
  movimientos     MovimientoInventario[]

  @@map("usuarios")
}

enum Rol {
  cajero
  enfermero
  almacenista
  administrador
  socio
}

// ... resto de modelos basados en el ERD
```

## Scripts de Desarrollo

### package.json (root)
```json
{
  "name": "hospital-management-system",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm start",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "deploy": "chmod +x deployment/scripts/deploy.sh && ./deployment/scripts/deploy.sh"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Este proyecto está estructurado para ser:
- **Escalable**: Arquitectura modular por características
- **Mantenible**: Separación clara de responsabilidades  
- **Testeable**: Estructura que facilita testing
- **Desplegable**: Configuración completa para VPS con Docker
- **Seguro**: Implementación de roles y permisos granular