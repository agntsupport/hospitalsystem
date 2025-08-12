# Sistema de Gestión Hospitalaria Integral
**Desarrollado por:** Alfredo Manuel Reyes  
**Empresa:** agnt_ - Software Development Company  
**Tecnología:** Arquitectura Full-Stack con PostgreSQL + React + Node.js

## 🚀 Inicio Rápido

### Comando Principal
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

# Testing
cd frontend && npm test           # 26 tests
cd backend && npm test            # Tests API
```

## 📁 Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Material-UI + Redux Toolkit + Vite
- **Backend**: Node.js + Express + PostgreSQL 14.18 + Prisma ORM
- **Testing**: Jest + Testing Library + Supertest
- **Auth**: JWT + bcrypt

### Estructura Backend (Arquitectura Modular)
```
backend/
├── server-modular.js        # 🚀 Servidor principal
├── routes/                  # Rutas modulares
│   ├── auth.routes.js      
│   ├── patients.routes.js   
│   ├── inventory.routes.js  
│   ├── billing.routes.js    
│   ├── hospitalization.routes.js
│   ├── rooms.routes.js      
│   └── reports.routes.js    
├── middleware/              
├── utils/                   
├── prisma/
│   ├── schema.prisma       # 23+ tablas
│   └── seed.js             
└── .env                    
```

### Estructura Frontend
```
frontend/src/
├── components/     # Componentes reutilizables
├── pages/          # Páginas principales  
├── services/       # Servicios API
├── store/          # Redux store
├── types/          # TypeScript types
└── utils/          # Utilidades
```

## 🔑 Configuración

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

### Puertos
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432
- Prisma Studio: http://localhost:5555

## 📊 Módulos Completados

1. ✅ **Autenticación** - JWT, roles, permisos
2. ✅ **Empleados** - CRUD completo con roles
3. ✅ **Habitaciones** - Gestión y ocupación
4. ✅ **Pacientes** - Registro, búsqueda avanzada, edición
5. ✅ **POS** - Punto de venta integrado con inventario
6. ✅ **Inventario** - Productos, proveedores, movimientos
7. ✅ **Facturación** - Facturas, pagos, cuentas por cobrar
8. ✅ **Reportes** - Financieros, operativos, ejecutivos
9. ✅ **Hospitalización** - Ingresos, altas, notas SOAP
10. ✅ **Quirófanos** - Gestión completa y cirugías programadas con auditoría
11. ✅ **Testing** - 26 tests frontend + backend

## 🔐 Sistema de Roles

- `administrador` - Acceso completo
- `cajero` - POS, pacientes, habitaciones
- `enfermero` - Pacientes, habitaciones, inventario (lectura)
- `almacenista` - Inventario completo
- `medico_residente` - Pacientes, habitaciones
- `medico_especialista` - Pacientes, habitaciones, reportes
- `socio` - Reportes financieros

## 🔗 Endpoints API Principales

### Autenticación
- `POST /api/auth/login`
- `GET /api/auth/verify-token`
- `GET /api/auth/profile`

### Pacientes
- `GET /api/patients` - Lista con filtros
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/:id` - Actualizar
- `DELETE /api/patients/:id` - Soft delete
- `GET /api/patients/stats` - Estadísticas

### Inventario
- `GET /api/inventory/products` - Productos
- `POST /api/inventory/products` - Crear producto
- `PUT /api/inventory/products/:id` - Actualizar
- `DELETE /api/inventory/products/:id` - Eliminar
- `GET /api/inventory/movements` - Movimientos
- `POST /api/inventory/movements` - Registrar movimiento

### Facturación
- `GET /api/billing/invoices` - Facturas
- `POST /api/billing/invoices` - Crear factura
- `GET /api/billing/stats` - Estadísticas
- `GET /api/billing/accounts-receivable` - Cuentas por cobrar

### Hospitalización
- `GET /api/hospitalization/admissions` - Ingresos
- `POST /api/hospitalization/admissions` - Nuevo ingreso
- `PUT /api/hospitalization/admissions/:id/discharge` - Alta
- `POST /api/hospitalization/admissions/:id/notes` - Notas médicas

### Quirófanos y Cirugías
- `GET /api/quirofanos` - Lista de quirófanos con filtros
- `POST /api/quirofanos` - Crear quirófano
- `PUT /api/quirofanos/:id` - Actualizar quirófano
- `PUT /api/quirofanos/:id/estado` - Cambiar estado del quirófano
- `DELETE /api/quirofanos/:id` - Soft delete de quirófano
- `GET /api/quirofanos/stats` - Estadísticas de quirófanos
- `GET /api/quirofanos/disponibles/horario` - Quirófanos disponibles por horario
- `POST /api/quirofanos/cirugias` - Programar cirugía
- `GET /api/quirofanos/cirugias` - Lista de cirugías
- `GET /api/quirofanos/cirugias/:id` - Detalle de cirugía
- `PUT /api/quirofanos/cirugias/:id/estado` - Actualizar estado de cirugía
- `DELETE /api/quirofanos/cirugias/:id` - Cancelar cirugía

## 👤 Credenciales de Desarrollo

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

## 🛠️ Comandos de Verificación

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

## 🎯 Próximos Pasos

1. **Sistema de Citas Médicas** - Calendarios y horarios integrados
2. **Dashboard Tiempo Real** - WebSockets para actualizaciones en vivo
3. **Expediente Médico Completo** - Historia clínica digitalizada
4. **Tests End-to-End** - Cypress para flujos completos
5. **Containerización** - Docker + nginx para producción

## 🔧 Solución de Problemas Comunes

### Puerto ocupado
```bash
pkill -f "concurrently|nodemon|vite|server-modular.js"
npm run dev
```

### Base de datos no conecta
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Verificar conexión
psql -d hospital_management -c "SELECT 1;"
```

### TypeScript errors
- Usar optional chaining: `response.data?.items || []`
- Verificar imports: default vs named exports

## 📝 Notas Importantes

- **Arquitectura Modular**: El sistema usa `server-modular.js` con rutas separadas
- **Base de Datos**: PostgreSQL con 23+ tablas relacionales via Prisma ORM
- **Comando Unificado**: `npm run dev` inicia ambos servicios automáticamente
- **Testing**: Framework completo con Jest configurado
- **Visual**: Sistema con overflow protection, tooltips y responsive design

---
**🏥 Sistema de Gestión Hospitalaria Integral**  
**👨‍💻 Desarrollado por:** Alfredo Manuel Reyes  
**🏢 Empresa:** agnt_ - Software Development Company  
**📅 Última actualización:** 12 de agosto de 2025  
**✅ Estado:** Sistema 100% Funcional y Optimizado  

---
*© 2025 agnt_ Software Development Company. Todos los derechos reservados.*