# Contexto de Sesión: Reportes Gerenciales para Junta Directiva

**Fecha de inicio:** 28 de noviembre de 2025
**Solicitante:** Junta Directiva
**Estado:** En planificación

---

## 🎯 OBJETIVO

Implementar reportes gerenciales completos para la junta directiva:
1. Médicos que más hospitalizan
2. Ingresos por médico (cuenta completa + desglose productos/servicios)
3. Utilidades netas (costo vs precio público)
4. Costos de nómina
5. Costos operativos por servicio

---

## 📊 ANÁLISIS REALIZADO

### Estado Actual del Módulo de Reportes

**Endpoints existentes (15):**
- `/reports/financial` - Ingresos totales, ventas rápidas
- `/reports/operational` - Pacientes, inventario, ocupación
- `/reports/executive` - Tendencias 30 días
- `/reports/inventory` - Productos, bajo stock
- `/reports/patients` - Distribución género/edad
- `/reports/hospitalization` - Estados, estancia promedio
- `/reports/revenue` - Por período/servicio
- `/reports/rooms-occupancy` - Ocupación habitaciones
- `/reports/managerial/executive-summary` - KPIs gerenciales
- `/reports/managerial/kpis` - 8 indicadores clave

**Limitaciones identificadas:**
- Utilidad neta es ESTIMADA (25% fijo) - NO REAL
- No hay reportes por médico
- Servicios NO tienen campo de costo
- No hay modelo de costos operativos

### Datos Disponibles en BD

✅ **Disponible:**
- `Hospitalizacion.medicoEspecialistaId` → hospitalizaciones por médico
- `CuentaPaciente.medicoTratanteId` → cuentas por médico
- `TransaccionCuenta.subtotal` → ingresos desglosados
- `Producto.precioCompra` → costo de productos
- `Producto.precioVenta` → precio venta productos
- `Empleado.salario` → nómina por empleado

❌ **Faltante:**
- `Servicio.costo` → costo operativo de servicios
- `CostoOperativo` → gastos generales (luz, agua, mantenimiento)

---

## 🏗️ PLAN DE IMPLEMENTACIÓN

### FASE 1: Modificaciones de Base de Datos

**1.1 Agregar campo `costo` a Servicio:**
```prisma
model Servicio {
  // campos existentes...
  costo       Decimal?   @db.Decimal(8, 2)  // NUEVO
}
```

**1.2 Crear modelo CostoOperativo:**
```prisma
model CostoOperativo {
  id          Int      @id @default(autoincrement())
  categoria   CategoriaCosto
  concepto    String
  descripcion String?
  monto       Decimal  @db.Decimal(12, 2)
  periodo     DateTime @db.Date  // Mes/Año
  recurrente  Boolean  @default(true)
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum CategoriaCosto {
  nomina
  servicios_publicos    // luz, agua, gas
  mantenimiento
  insumos_generales
  renta_inmueble
  seguros
  depreciacion
  otros
}
```

**1.3 Crear modelo ConfiguracionReportes:**
```prisma
model ConfiguracionReportes {
  id                    Int     @id @default(autoincrement())
  porcentajeCostoServicio Decimal @default(60) @db.Decimal(5, 2)  // % por defecto
  usarCostosReales      Boolean @default(false)
  // configuraciones adicionales...
}
```

### FASE 2: Nuevos Endpoints Backend

**2.1 Reportes de Médicos:**
```
GET /api/reports/doctors/rankings
  ?periodo=mes|trimestre|año|custom
  &fechaInicio=2025-01-01
  &fechaFin=2025-12-31
  &ordenarPor=hospitalizaciones|ingresos|utilidad
  &limite=10

Respuesta:
{
  medicos: [
    {
      id: 12,
      nombre: "Dr. García López",
      especialidad: "Cirugía General",
      hospitalizaciones: 45,
      ingresos: {
        total: 385000,
        productos: 120000,
        servicios: 265000
      },
      utilidad: 154000,
      margen: 40,
      pacientes: 89
    }
  ],
  totales: {
    hospitalizaciones: 200,
    ingresos: 1500000,
    utilidad: 600000
  }
}
```

**2.2 Reporte de Utilidades Netas:**
```
GET /api/reports/profit/detailed
  ?periodo=mes|trimestre|año|custom
  &desglose=productos|servicios|todo

Respuesta:
{
  productos: {
    ingresos: 450000,
    costo: 280000,
    utilidad: 170000,
    margen: 37.8,
    items: [
      { nombre: "Paracetamol", vendidos: 500, ingreso: 5000, costo: 2500, margen: 50 }
    ]
  },
  servicios: {
    ingresos: 850000,
    costoEstimado: 510000,  // 60% por defecto
    costoReal: null,        // si no hay datos reales
    utilidad: 340000,
    margen: 40
  },
  operativos: {
    nomina: 150000,
    serviciosPublicos: 25000,
    mantenimiento: 15000,
    otros: 10000,
    total: 200000
  },
  resumen: {
    ingresosTotales: 1300000,
    costosTotales: 990000,
    utilidadBruta: 510000,
    utilidadNeta: 310000,  // menos operativos
    margenBruto: 39.2,
    margenNeto: 23.8
  }
}
```

**2.3 CRUD de Costos Operativos:**
```
GET    /api/costs/operational       - Listar costos
POST   /api/costs/operational       - Crear costo
PUT    /api/costs/operational/:id   - Actualizar costo
DELETE /api/costs/operational/:id   - Eliminar costo
GET    /api/costs/summary           - Resumen por categoría
```

**2.4 Gestión de Costos de Servicios:**
```
PUT /api/services/:id/cost          - Actualizar costo de servicio
GET /api/services/costs-summary     - Resumen de costos por servicio
```

### FASE 3: Componentes Frontend

**3.1 Nueva pestaña en ReportsPage:**
- Tab "Gerencial" con:
  - Ranking de médicos (tabla + gráfico)
  - Utilidades por producto/servicio
  - Costos operativos

**3.2 Nueva página de Configuración de Costos:**
- `/configuracion/costos`
- Solo accesible para administrador
- CRUD de costos operativos
- Edición de costos de servicios
- Configuración de % estimado

**3.3 Componentes nuevos:**
- `DoctorRankingTable.tsx`
- `DoctorRevenueChart.tsx`
- `ProfitMarginTable.tsx`
- `OperationalCostsManager.tsx`
- `ServiceCostEditor.tsx`

### FASE 4: Tests

**Backend:**
- `doctors-reports.test.js` - Rankings y detalles por médico
- `profit-reports.test.js` - Utilidades y márgenes
- `operational-costs.test.js` - CRUD de costos

**Frontend:**
- `DoctorRankingTable.test.tsx`
- `ProfitMarginTable.test.tsx`
- `OperationalCostsManager.test.tsx`

---

## 📋 DECISIONES TOMADAS

1. **Alcance:** Implementación completa (Fase A + B + C)
2. **Costos de servicios:** Campo `costo` editable por admin, con estimación del 60% por defecto
3. **Modelo de costos:** Nuevo modelo `CostoOperativo` con categorías predefinidas
4. **Acceso:** Solo roles `administrador` y `socio` para reportes financieros

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

### Backend
- `prisma/schema.prisma` - Agregar modelos
- `routes/reports.routes.js` - Nuevos endpoints
- `routes/costs.routes.js` - NUEVO: CRUD de costos
- `prisma/seed.js` - Datos de ejemplo

### Frontend
- `src/pages/reports/ReportsPage.tsx` - Nueva pestaña
- `src/pages/reports/ManagerialReportsTab.tsx` - NUEVO
- `src/pages/config/CostsConfigPage.tsx` - NUEVO
- `src/services/reportsService.ts` - Nuevos métodos
- `src/services/costsService.ts` - NUEVO
- `src/types/reports.types.ts` - Nuevos tipos

---

## ✅ PROGRESO

- [x] Análisis del módulo actual
- [x] Identificación de datos disponibles
- [x] Diseño de nuevos modelos de BD
- [x] Diseño de endpoints
- [ ] Implementación de schema Prisma
- [ ] Implementación de endpoints backend
- [ ] Implementación de frontend
- [ ] Tests
- [ ] Documentación

---

## 📝 NOTAS

- El campo `Empleado.salario` ya existe, por lo que la nómina se puede calcular
- Los productos ya tienen `precioCompra` y `precioVenta` - utilidades reales disponibles
- Los servicios necesitan el nuevo campo `costo` para utilidades reales
- El % estimado (60%) es configurable y editable por admin
