# Plan de Testing End-to-End (E2E)
**Sistema de Gestión Hospitalaria Integral**
**Fecha Original:** 13 de agosto de 2025
**Actualización:** 29 de octubre de 2025

---

## ✅ ESTADO ACTUAL: IMPLEMENTADO CON PLAYWRIGHT

**Fecha de Implementación:** 29 de octubre de 2025

Este documento es **HISTÓRICO** y muestra el plan original que proponía Cypress.

**✅ IMPLEMENTACIÓN REAL:**
- **Framework elegido:** Playwright (en lugar de Cypress)
- **19 tests E2E implementados:** 6 tests ITEM 3 + 13 tests ITEM 4
- **Documentación actualizada:** Ver `frontend/e2e/README.md`
- **Script automatizado:** `test-e2e-full.sh`
- **Configuración:** `frontend/playwright.config.ts`

**Para información actualizada sobre tests E2E, consultar:**
- `frontend/e2e/README.md` - Documentación completa E2E
- `frontend/e2e/item3-patient-form-validation.spec.ts` - Tests validación
- `frontend/e2e/item4-skip-links-wcag.spec.ts` - Tests accesibilidad

---

## 🎯 Objetivo Original (Agosto 2025)

Crear un plan completo de testing E2E que integre la base de datos PostgreSQL con el frontend React, asegurando que el sistema funcione correctamente en escenarios reales de usuario.

## 📋 Estado Actual

### ✅ Completado
- **Tests Backend** - 7 tests core pasando con BD real PostgreSQL
- **Tests Frontend** - 9 tests automatizados con mocks configurados
- **Infraestructura de Testing** - Jest, setupTests, configuración de BD de pruebas
- **Total Tests Implementados** - 16 tests funcionales

### 🚀 Tests E2E - Propuesta de Implementación

## 🛠️ Herramientas Recomendadas

### Opción 1: Cypress (Recomendada)
```bash
npm install --save-dev cypress @cypress/code-coverage
```

### Opción 2: Playwright
```bash
npm install --save-dev @playwright/test
```

### Opción 3: Puppeteer + Jest
```bash
npm install --save-dev puppeteer jest-puppeteer
```

## 📁 Estructura de Archivos E2E

```
tests/
├── e2e/
│   ├── cypress/
│   │   ├── fixtures/          # Datos de prueba
│   │   ├── integration/       # Tests E2E
│   │   │   ├── auth/
│   │   │   │   ├── login.cy.js
│   │   │   │   └── logout.cy.js
│   │   │   ├── patients/
│   │   │   │   ├── patient-crud.cy.js
│   │   │   │   ├── patient-search.cy.js
│   │   │   │   └── patient-form.cy.js
│   │   │   ├── inventory/
│   │   │   │   ├── products-crud.cy.js
│   │   │   │   ├── suppliers-crud.cy.js
│   │   │   │   └── movements.cy.js
│   │   │   ├── quirofanos/
│   │   │   │   ├── quirofano-crud.cy.js
│   │   │   │   └── cirugias.cy.js
│   │   │   └── reports/
│   │   │       ├── financial-reports.cy.js
│   │   │       └── operational-reports.cy.js
│   │   ├── plugins/
│   │   └── support/
│   │       ├── commands.js     # Custom commands
│   │       ├── database.js     # DB helpers
│   │       └── index.js
│   ├── setup/
│   │   ├── e2e-setup.js       # Setup global E2E
│   │   └── database-reset.js  # Reset BD entre tests
│   └── config/
│       ├── cypress.config.js
│       └── environment.js
```

## 🎭 Escenarios de Testing E2E

### 1. Flujo de Autenticación
```javascript
describe('Authentication Flow', () => {
  it('should complete full login/logout cycle', () => {
    cy.visit('/login')
    cy.login('admin', 'admin123')
    cy.url().should('include', '/dashboard')
    cy.logout()
    cy.url().should('include', '/login')
  })
})
```

### 2. Gestión de Pacientes - CRUD Completo
```javascript
describe('Patient Management E2E', () => {
  beforeEach(() => {
    cy.resetDatabase()
    cy.seedDatabase('patients')
    cy.login('admin', 'admin123')
  })

  it('should create, edit, and delete patient', () => {
    // Crear paciente
    cy.visit('/patients')
    cy.get('[data-cy=new-patient-btn]').click()
    cy.fillPatientForm({
      nombre: 'Juan Carlos',
      apellidoPaterno: 'Pérez',
      email: 'juan@test.com',
      telefono: '5551234567'
    })
    cy.get('[data-cy=save-btn]').click()
    
    // Verificar en BD
    cy.task('checkPatientInDB', { email: 'juan@test.com' })
      .should('exist')
    
    // Editar paciente
    cy.get('[data-cy=patient-row]').first().click()
    cy.get('[data-cy=edit-btn]').click()
    cy.get('[data-cy=telefono-input]').clear().type('5559876543')
    cy.get('[data-cy=save-btn]').click()
    
    // Verificar cambio en BD
    cy.task('getPatientFromDB', { email: 'juan@test.com' })
      .its('telefono').should('eq', '5559876543')
    
    // Eliminar paciente
    cy.get('[data-cy=delete-btn]').click()
    cy.get('[data-cy=confirm-delete]').click()
    
    // Verificar eliminación lógica en BD
    cy.task('getPatientFromDB', { email: 'juan@test.com' })
      .its('activo').should('eq', false)
  })
})
```

### 3. Inventario - Flujo Completo
```javascript
describe('Inventory Management E2E', () => {
  it('should handle complete inventory workflow', () => {
    cy.login('almacen1', 'almacen123')
    
    // Crear proveedor
    cy.visit('/inventory/suppliers')
    cy.createSupplier({
      nombre: 'Proveedor Test',
      contacto: 'contacto@proveedor.com'
    })
    
    // Crear producto
    cy.visit('/inventory/products')
    cy.createProduct({
      nombre: 'Medicamento Test',
      precio: 100.50,
      stock: 50
    })
    
    // Registrar movimiento
    cy.get('[data-cy=movements-tab]').click()
    cy.recordMovement({
      tipo: 'entrada',
      cantidad: 25,
      motivo: 'Reposición de stock'
    })
    
    // Verificar stock actualizado en BD
    cy.task('getProductStock', 'Medicamento Test')
      .should('eq', 75)
  })
})
```

### 4. Quirófanos - Programación de Cirugías
```javascript
describe('Surgery Scheduling E2E', () => {
  it('should schedule and manage surgeries', () => {
    cy.login('especialista1', 'medico123')
    
    // Verificar quirófanos disponibles
    cy.visit('/quirofanos')
    cy.get('[data-cy=available-rooms]').should('have.length.greaterThan', 0)
    
    // Programar cirugía
    cy.get('[data-cy=schedule-surgery-btn]').click()
    cy.scheduleSurgery({
      pacienteId: 1,
      quirofanoId: 1,
      fecha: '2025-08-15',
      hora: '09:00',
      tipo: 'Apendicectomía'
    })
    
    // Verificar en calendario
    cy.get('[data-cy=surgery-calendar]')
      .should('contain', 'Apendicectomía')
    
    // Verificar en BD
    cy.task('getSurgeryFromDB', { fecha: '2025-08-15' })
      .should('exist')
  })
})
```

### 5. Cargos Automáticos - Habitaciones y Quirófanos ✨ NUEVO
```javascript
describe('Automatic Charges E2E', () => {
  it('should automatically charge room usage on discharge', () => {
    cy.login('cajero1', 'cajero123')
    
    // Crear ingreso hospitalario
    cy.visit('/hospitalization')
    cy.get('[data-cy=new-admission-btn]').click()
    cy.createAdmission({
      pacienteId: 1,
      habitacionId: 1, // Habitación con servicio HAB-001 asociado
      diagnostico: 'Observación post-cirugía'
    })
    
    // Verificar anticipo automático de $10,000
    cy.get('[data-cy=account-balance]').should('contain', '10,000')
    
    // Cambiar a médico para crear nota de alta
    cy.login('especialista1', 'medico123')
    cy.createDischargeNote({
      estado: 'Paciente estable para alta',
      planTratamiento: 'Seguimiento ambulatorio'
    })
    
    // Volver a cajero para cerrar cuenta
    cy.login('cajero1', 'cajero123')
    cy.visit('/pos')
    cy.get('[data-cy=close-account-btn]').click()
    
    // Verificar cargo automático de habitación
    cy.get('[data-cy=room-charge]').should('exist')
    cy.get('[data-cy=room-charge-amount]').should('not.equal', '0')
    
    // Verificar cálculo de días de estancia
    cy.get('[data-cy=stay-duration]').should('contain', 'día')
    
    // Verificar en BD que se creó el servicio automáticamente
    cy.task('getServiceFromDB', 'HAB-001').should('exist')
  })
  
  it('should create room services automatically when creating rooms', () => {
    cy.login('administrador', 'admin123')
    
    // Crear nueva habitación
    cy.visit('/rooms')
    cy.get('[data-cy=new-room-btn]').click()
    cy.createRoom({
      numero: '301',
      tipo: 'suite',
      precioPorDia: 3500
    })
    
    // Verificar que se creó el servicio automáticamente
    cy.task('getServiceFromDB', 'HAB-301').should('exist')
    cy.task('getServicePrice', 'HAB-301').should('eq', 3500)
  })
})
```

### 6. Reportes - Generación y Datos
```javascript
describe('Reports Generation E2E', () => {
  it('should generate reports with real data', () => {
    cy.login('administrador', 'admin123')
    
    // Generar reporte financiero
    cy.visit('/reports/financial')
    cy.selectDateRange('2025-08-01', '2025-08-13')
    cy.get('[data-cy=generate-report-btn]').click()
    
    // Verificar datos mostrados
    cy.get('[data-cy=total-income]').should('not.contain', '0')
    cy.get('[data-cy=report-table] tbody tr').should('have.length.greaterThan', 0)
    
    // Verificar descarga
    cy.get('[data-cy=download-pdf-btn]').click()
    cy.readFile('cypress/downloads/reporte-financiero.pdf').should('exist')
  })
})
```

## 🔧 Configuración de Cypress

### cypress.config.js
```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/cypress/support/index.js',
    fixturesFolder: 'tests/e2e/cypress/fixtures',
    specPattern: 'tests/e2e/cypress/integration/**/*.cy.js',
    videosFolder: 'tests/e2e/cypress/videos',
    screenshotsFolder: 'tests/e2e/cypress/screenshots',
    
    env: {
      apiUrl: 'http://localhost:3001',
      dbUrl: 'postgresql://alfredo@localhost:5432/hospital_management_test'
    },
    
    setupNodeEvents(on, config) {
      // Database tasks
      on('task', {
        async resetDatabase() {
          // Reset test database to clean state
          return null
        },
        
        async seedDatabase(type) {
          // Seed with test data
          return null
        },
        
        async checkPatientInDB(criteria) {
          // Check if patient exists
          return null
        },
        
        async getPatientFromDB(criteria) {
          // Get patient data
          return null
        },
        
        async getProductStock(productName) {
          // Get current stock
          return null
        },
        
        async getSurgeryFromDB(criteria) {
          // Get surgery data
          return null
        }
      })
    },
  },
})
```

### Custom Commands (support/commands.js)
```javascript
// Login command
Cypress.Commands.add('login', (username, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { nombreUsuario: username, password }
  }).then((response) => {
    localStorage.setItem('hospital_token', response.body.token)
    localStorage.setItem('hospital_user', JSON.stringify(response.body.user))
  })
})

// Logout command
Cypress.Commands.add('logout', () => {
  localStorage.removeItem('hospital_token')
  localStorage.removeItem('hospital_user')
  cy.visit('/login')
})

// Fill patient form
Cypress.Commands.add('fillPatientForm', (patient) => {
  cy.get('[data-cy=nombre-input]').type(patient.nombre)
  cy.get('[data-cy=apellido-paterno-input]').type(patient.apellidoPaterno)
  cy.get('[data-cy=email-input]').type(patient.email)
  cy.get('[data-cy=telefono-input]').type(patient.telefono)
})

// Create supplier
Cypress.Commands.add('createSupplier', (supplier) => {
  cy.get('[data-cy=new-supplier-btn]').click()
  cy.get('[data-cy=supplier-nombre-input]').type(supplier.nombre)
  cy.get('[data-cy=supplier-contacto-input]').type(supplier.contacto)
  cy.get('[data-cy=save-supplier-btn]').click()
})

// Database helpers
Cypress.Commands.add('resetDatabase', () => {
  cy.task('resetDatabase')
})

Cypress.Commands.add('seedDatabase', (type) => {
  cy.task('seedDatabase', type)
})
```

## 🚀 Comandos de Ejecución

### Desarrollo
```bash
# Abrir Cypress Test Runner
npx cypress open

# Ejecutar tests en modo headless
npx cypress run

# Ejecutar tests específicos
npx cypress run --spec "tests/e2e/cypress/integration/patients/**"
```

### CI/CD
```bash
# Para GitHub Actions
npx cypress run --record --key <record-key>

# Generar reportes
npx cypress run --reporter mochawesome
```

## 📊 Métricas y Cobertura

### Objetivos de Cobertura E2E
- **Flujos Críticos**: 100% (Auth, Pacientes, Facturación)
- **Flujos Secundarios**: 80% (Reportes, Configuración)
- **Flujos Administrativos**: 60% (Usuarios, Permisos)

### Tests Prioritarios (Fase 1)
1. ✅ Autenticación completa
2. ✅ CRUD de Pacientes
3. ✅ Punto de Venta (POS)
4. ✅ Gestión de Inventario básica
5. ✅ Generación de reportes principales

### Tests Secundarios (Fase 2)
1. Quirófanos y cirugías
2. Hospitalización completa
3. Facturación avanzada
4. Auditoría y trazabilidad
5. Reportes avanzados

## ⚙️ Configuración del Entorno

### Variables de Entorno E2E
```bash
# .env.e2e
CYPRESS_baseUrl=http://localhost:3000
CYPRESS_apiUrl=http://localhost:3001
CYPRESS_dbUrl=postgresql://alfredo@localhost:5432/hospital_management_test
CYPRESS_RECORD_KEY=<cypress-record-key>
```

### Script de Setup
```bash
#!/bin/bash
# setup-e2e.sh

echo "🚀 Setting up E2E testing environment..."

# Start test database
echo "📊 Starting test database..."
psql -c "DROP DATABASE IF EXISTS hospital_management_e2e;"
psql -c "CREATE DATABASE hospital_management_e2e;"

# Run migrations
echo "🔄 Running migrations..."
DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management_e2e?schema=public" npx prisma migrate deploy

# Seed test data
echo "🌱 Seeding test data..."
DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management_e2e?schema=public" npx prisma db seed

# Start backend
echo "🖥️ Starting backend..."
DATABASE_URL="postgresql://alfredo@localhost:5432/hospital_management_e2e?schema=public" PORT=3001 npm run dev &
BACKEND_PID=$!

# Start frontend
echo "🌐 Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ E2E environment ready!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
```

## 🎯 Próximos Pasos

### Implementación Inmediata
1. **Instalar Cypress**: `npm install --save-dev cypress`
2. **Configurar estructura de archivos**
3. **Crear tests básicos de autenticación**
4. **Implementar helpers de base de datos**
5. **Configurar CI/CD pipeline**

### Beneficios Esperados
- **Confiabilidad**: Tests con datos reales
- **Detección Temprana**: Bugs encontrados antes de producción
- **Documentación Viva**: Tests como documentación del sistema
- **Regresión**: Prevenir bugs en funcionalidades existentes
- **Calidad**: Mayor confianza en releases

---
**📝 Plan creado por:** Claude Code  
**🏥 Sistema:** Gestión Hospitalaria Integral  
**⚡ Estado:** Listo para implementación  
**🔄 Próxima revisión:** Al completar Fase 1