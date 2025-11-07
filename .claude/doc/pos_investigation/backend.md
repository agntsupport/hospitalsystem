# Investigación Sistema POS - Backend Research & Design

**Fecha:** 7 de noviembre de 2025
**Investigador:** Backend Research Specialist
**Solicitante:** Alfredo Manuel Reyes
**Problema Reportado:** Historial de transacciones POS muestra información incorrecta en cuentas

---

## 1. RESUMEN EJECUTIVO

### Problema Reportado
El usuario reporta que "el historial de transacciones POS sigue mostrando mal la cuenta", lo cual representa un problema CRÍTICO para la integridad financiera del hospital.

### Hallazgo Principal ✅
**El sistema YA FUE CORREGIDO el 6 de noviembre de 2025 (commit b293475)**. Se implementó un sistema de cálculo en tiempo real desde las transacciones para cuentas abiertas, manteniendo el snapshot histórico para cuentas cerradas.

### Estado Actual
- ✅ **3/3 endpoints POS** implementan cálculo correcto en tiempo real
- ✅ **Single source of truth:** Tabla `transacciones_cuenta`
- ✅ **Tests:** 26/26 tests POS passing (100%)
- ⚠️ **Requiere verificación:** ¿El problema persiste después de la corrección?

---

## 2. ANÁLISIS DEL ESQUEMA DE BASE DE DATOS

### 2.1 Modelo `CuentaPaciente` (schema.prisma líneas 430-468)

```prisma
model CuentaPaciente {
  id               Int          @id @default(autoincrement())
  pacienteId       Int          @map("paciente_id")
  tipoAtencion     TipoAtencion @map("tipo_atencion")
  estado           EstadoCuenta @default(abierta)

  // CAMPOS CALCULADOS (pueden estar desactualizados en cuentas abiertas)
  anticipo         Decimal      @default(0) @db.Decimal(10, 2)
  totalServicios   Decimal      @default(0) @map("total_servicios") @db.Decimal(10, 2)
  totalProductos   Decimal      @default(0) @map("total_productos") @db.Decimal(10, 2)
  totalCuenta      Decimal      @default(0) @map("total_cuenta") @db.Decimal(10, 2)
  saldoPendiente   Decimal      @default(0) @map("saldo_pendiente") @db.Decimal(10, 2)

  habitacionId     Int?         @map("habitacion_id")
  medicoTratanteId Int?         @map("medico_tratante_id")
  cajeroAperturaId Int          @map("cajero_apertura_id")
  cajeroCierreId   Int?         @map("cajero_cierre_id")
  fechaApertura    DateTime     @default(now()) @map("fecha_apertura")
  fechaCierre      DateTime?    @map("fecha_cierre")
  observaciones    String?

  // Relaciones
  transacciones    TransaccionCuenta[]
  // ... otras relaciones
}
```

**ANÁLISIS CRÍTICO:**

| Campo | Tipo | ¿Se almacena físicamente? | ¿Se calcula en tiempo real? |
|-------|------|---------------------------|------------------------------|
| `anticipo` | Decimal | ✅ Sí (al crear cuenta) | ❌ No (valor fijo) |
| `totalServicios` | Decimal | ✅ Sí (snapshot) | ✅ Sí (si cuenta abierta) |
| `totalProductos` | Decimal | ✅ Sí (snapshot) | ✅ Sí (si cuenta abierta) |
| `totalCuenta` | Decimal | ✅ Sí (snapshot) | ✅ Sí (si cuenta abierta) |
| `saldoPendiente` | Decimal | ✅ Sí (snapshot) | ✅ Sí (si cuenta abierta) |

**DISEÑO CONCEPTUAL:**
- **Cuentas ABIERTAS:** Los campos `totalServicios`, `totalProductos`, `totalCuenta` y `saldoPendiente` se recalculan en tiempo real desde `transacciones_cuenta`
- **Cuentas CERRADAS:** Se usa el snapshot almacenado (valores históricos al momento del cierre)

### 2.2 Modelo `TransaccionCuenta` (schema.prisma líneas 656-680)

```prisma
model TransaccionCuenta {
  id                      Int             @id @default(autoincrement())
  cuentaId                Int             @map("cuenta_id")
  tipo                    TipoTransaccion // servicio, producto, anticipo, pago
  concepto                String
  cantidad                Int             @default(1)
  precioUnitario          Decimal         @map("precio_unitario") @db.Decimal(8, 2)
  subtotal                Decimal         @db.Decimal(10, 2)
  servicioId              Int?            @map("servicio_id")
  productoId              Int?            @map("producto_id")
  aplicacionMedicamentoId Int?            @map("aplicacion_medicamento_id")
  empleadoCargoId         Int?            @map("empleado_cargo_id")
  fechaTransaccion        DateTime        @default(now()) @map("fecha_transaccion")
  observaciones           String?

  // Relaciones
  cuenta    CuentaPaciente @relation(fields: [cuentaId], references: [id])
  servicio  Servicio?      @relation(fields: [servicioId], references: [id])
  producto  Producto?      @relation(fields: [productoId], references: [id])
}
```

**SINGLE SOURCE OF TRUTH ✅**
Esta tabla es la **fuente única de verdad** para calcular los totales de una cuenta abierta.

**FÓRMULA CORRECTA:**
```javascript
totalServicios = SUM(subtotal WHERE tipo = 'servicio')
totalProductos = SUM(subtotal WHERE tipo = 'producto')
totalCuenta = totalServicios + totalProductos
saldoPendiente = anticipo - totalCuenta
```

---

## 3. ANÁLISIS DE ENDPOINTS BACKEND

### 3.1 Endpoint: `GET /api/pos/cuentas` (líneas 469-593)

**Propósito:** Obtener listado de cuentas de pacientes (abiertas o cerradas)

**Lógica de Cálculo de Totales:**

```javascript
// Líneas 523-570
const cuentasFormatted = await Promise.all(cuentas.map(async (cuenta) => {
  let totalServicios, totalProductos, totalCuenta, anticipo, saldoPendiente;

  if (cuenta.estado === 'abierta') {
    // Cuenta ABIERTA: calcular en tiempo real desde transacciones
    const [servicios, productos] = await Promise.all([
      prisma.transaccionCuenta.aggregate({
        where: { cuentaId: cuenta.id, tipo: 'servicio' },
        _sum: { subtotal: true }
      }),
      prisma.transaccionCuenta.aggregate({
        where: { cuentaId: cuenta.id, tipo: 'producto' },
        _sum: { subtotal: true }
      })
    ]);

    totalServicios = parseFloat(servicios._sum.subtotal || 0);
    totalProductos = parseFloat(productos._sum.subtotal || 0);
    totalCuenta = totalServicios + totalProductos;
    anticipo = parseFloat(cuenta.anticipo.toString());
    saldoPendiente = anticipo - totalCuenta; // ✅ FÓRMULA CORRECTA
  } else {
    // Cuenta CERRADA: usar valores almacenados (snapshot histórico)
    anticipo = parseFloat(cuenta.anticipo.toString());
    totalServicios = parseFloat(cuenta.totalServicios.toString());
    totalProductos = parseFloat(cuenta.totalProductos.toString());
    totalCuenta = parseFloat(cuenta.totalCuenta.toString());
    saldoPendiente = parseFloat(cuenta.saldoPendiente.toString());
  }

  return { /* ... */ };
}));
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Usa agregación de Prisma para sumar transacciones
- ✅ **CORRECTO:** Separa lógica para cuentas abiertas vs cerradas
- ✅ **CORRECTO:** Fórmula `saldoPendiente = anticipo - totalCuenta`
- ⚠️ **PERFORMANCE:** Hace N+1 queries (un `aggregate` por cada cuenta)

**RECOMENDACIÓN DE OPTIMIZACIÓN:**
```javascript
// Posible optimización con una sola query
const totalesPorCuenta = await prisma.transaccionCuenta.groupBy({
  by: ['cuentaId'],
  where: {
    cuentaId: { in: cuentasAbiertas.map(c => c.id) }
  },
  _sum: {
    subtotal: true
  }
});
```

### 3.2 Endpoint: `GET /api/pos/cuenta/:id` (líneas 596-740)

**Propósito:** Obtener detalles completos de una cuenta específica con transacciones

**Lógica de Cálculo (líneas 666-694):**

```javascript
if (cuenta.estado === 'abierta') {
  // Cuenta ABIERTA: calcular en tiempo real desde transacciones
  const [servicios, productos] = await Promise.all([
    prisma.transaccionCuenta.aggregate({
      where: { cuentaId: cuenta.id, tipo: 'servicio' },
      _sum: { subtotal: true }
    }),
    prisma.transaccionCuenta.aggregate({
      where: { cuentaId: cuenta.id, tipo: 'producto' },
      _sum: { subtotal: true }
    })
  ]);

  totalServicios = parseFloat(servicios._sum.subtotal || 0);
  totalProductos = parseFloat(productos._sum.subtotal || 0);
  totalCuenta = totalServicios + totalProductos;
  anticipo = parseFloat(cuenta.anticipo.toString());
  saldoPendiente = anticipo - totalCuenta; // ✅ CORRECTA
} else {
  // Cuenta CERRADA: usar valores almacenados (snapshot histórico al momento del cierre)
  anticipo = parseFloat(cuenta.anticipo.toString());
  totalServicios = parseFloat(cuenta.totalServicios.toString());
  totalProductos = parseFloat(cuenta.totalProductos.toString());
  totalCuenta = parseFloat(cuenta.totalCuenta.toString());
  saldoPendiente = parseFloat(cuenta.saldoPendiente.toString());
}
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Lógica idéntica a `/cuentas`
- ✅ **CORRECTO:** Respeta snapshot histórico para cuentas cerradas
- ✅ **INCLUYE:** Lista completa de transacciones con relaciones (producto, servicio)

### 3.3 Endpoint: `GET /api/pos/cuenta/:id/transacciones` (líneas 743-870)

**Propósito:** Obtener transacciones paginadas de una cuenta específica

**Lógica de Cálculo de Totales (líneas 824-838):**

```javascript
// Calcular totales actualizados de la cuenta
const [servicios, productos] = await Promise.all([
  prisma.transaccionCuenta.aggregate({
    where: { cuentaId: parseInt(id), tipo: 'servicio' },
    _sum: { subtotal: true }
  }),
  prisma.transaccionCuenta.aggregate({
    where: { cuentaId: parseInt(id), tipo: 'producto' },
    _sum: { subtotal: true }
  })
]);

const totalServicios = parseFloat(servicios._sum.subtotal || 0);
const totalProductos = parseFloat(productos._sum.subtotal || 0);
const totalCuenta = totalServicios + totalProductos;
const saldoPendiente = parseFloat(cuenta.anticipo) - totalCuenta; // ✅ CORRECTA
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Calcula totales en tiempo real **SIEMPRE** (no distingue abierta/cerrada)
- ⚠️ **INCONSISTENCIA MENOR:** No respeta snapshot para cuentas cerradas
- ✅ **INCLUYE:** Objeto `totales` en la respuesta con valores actualizados
- ✅ **PAGINACIÓN:** Implementa paginación correcta (skip/take)

**RECOMENDACIÓN:**
```javascript
// Debería respetar el snapshot para cuentas cerradas
if (cuenta.estado === 'cerrada') {
  // Usar valores almacenados
  const totales = {
    anticipo: parseFloat(cuenta.anticipo),
    totalServicios: parseFloat(cuenta.totalServicios),
    totalProductos: parseFloat(cuenta.totalProductos),
    totalCuenta: parseFloat(cuenta.totalCuenta),
    saldoPendiente: parseFloat(cuenta.saldoPendiente)
  };
}
```

### 3.4 Endpoint: `POST /api/pos/recalcular-cuentas` (líneas 873-970)

**Propósito:** Recalcular totales de todas las cuentas abiertas (solo administradores)

**Lógica:**

```javascript
for (const cuenta of cuentasAbiertas) {
  // Calcular totales por tipo de transacción
  const [servicios, productos] = await Promise.all([
    prisma.transaccionCuenta.aggregate({
      where: { cuentaId: cuenta.id, tipo: 'servicio' },
      _sum: { subtotal: true }
    }),
    prisma.transaccionCuenta.aggregate({
      where: { cuentaId: cuenta.id, tipo: 'producto' },
      _sum: { subtotal: true }
    })
  ]);

  const totalServicios = parseFloat(servicios._sum.subtotal || 0);
  const totalProductos = parseFloat(productos._sum.subtotal || 0);
  const totalCuenta = totalServicios + totalProductos;
  const saldoPendiente = parseFloat(cuenta.anticipo) - totalCuenta;

  // Verificar si hay cambios (tolerancia de 0.01 por redondeo)
  const cambios = (
    Math.abs(parseFloat(cuenta.totalServicios) - totalServicios) > 0.01 ||
    Math.abs(parseFloat(cuenta.totalProductos) - totalProductos) > 0.01 ||
    Math.abs(parseFloat(cuenta.totalCuenta) - totalCuenta) > 0.01 ||
    Math.abs(parseFloat(cuenta.saldoPendiente) - saldoPendiente) > 0.01
  );

  if (cambios) {
    await prisma.cuentaPaciente.update({
      where: { id: cuenta.id },
      data: {
        totalServicios,
        totalProductos,
        totalCuenta,
        saldoPendiente
      }
    });
  }
}
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Solo recalcula cuentas ABIERTAS
- ✅ **CORRECTO:** Usa tolerancia de 0.01 para comparaciones de decimales
- ✅ **ÚTIL:** Herramienta de mantenimiento para corregir inconsistencias
- ⚠️ **PERFORMANCE:** Puede ser lento con muchas cuentas (N+1 queries)
- ✅ **SEGURIDAD:** Solo accesible para administradores

---

## 4. ANÁLISIS DEL FRONTEND

### 4.1 Servicio: `posService.ts`

**Función Relevante:** `getAccountTransactions()` (líneas 136-175)

```typescript
async getAccountTransactions(accountId: number, filters: {
  page?: number;
  limit?: number;
  tipo?: string;
} = {}): Promise<ApiResponse<{
  transacciones: Array<{ /* ... */ }>;
  pagination: { /* ... */ };
}>> {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.tipo) queryParams.append('tipo', filters.tipo);

  const url = `/pos/cuenta/${accountId}/transacciones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return api.get(url);
}
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Llama directamente al endpoint sin transformaciones
- ✅ **CORRECTO:** Pasa filtros de paginación y tipo correctamente
- ❌ **NO HAY CÁLCULOS ADICIONALES:** No manipula los totales recibidos

### 4.2 Componente: `AccountDetailDialog.tsx`

**Estado de Totales (líneas 109-116):**

```typescript
const [totales, setTotales] = useState({
  anticipo: account?.anticipo || 0,
  totalServicios: account?.totalServicios || 0,
  totalProductos: account?.totalProductos || 0,
  totalCuenta: account?.totalCuenta || 0,
  saldoPendiente: account?.saldoPendiente || 0
});
```

**Actualización de Totales (líneas 136-143):**

```typescript
if (response.success && response.data) {
  setTransactions(response.data.transacciones);
  setTotalTransactions(response.data.pagination.total);

  // Actualizar totales con los valores actualizados del backend
  if (response.data.totales) {
    setTotales(response.data.totales); // ✅ USA TOTALES DEL BACKEND
  }
}
```

**Renderizado de Totales (líneas 262-303):**

```tsx
<Alert severity="info" sx={{ mb: 2 }}>
  <Typography variant="body2">
    <strong>Cálculo del saldo:</strong> Anticipo - Total de servicios y productos = Saldo{' '}
    {totales.saldoPendiente >= 0
      ? '(a favor del paciente)'
      : '(que debe el paciente)'
    }
  </Typography>
</Alert>
<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
  <Chip
    icon={<AccountIcon />}
    label={`Anticipo: ${formatCurrency(totales.anticipo)}`}
    color="success"
    variant="outlined"
  />
  <Chip
    icon={<MedicalIcon />}
    label={`Servicios: ${formatCurrency(totales.totalServicios)}`}
    color="primary"
    variant="outlined"
  />
  <Chip
    icon={<PharmacyIcon />}
    label={`Productos: ${formatCurrency(totales.totalProductos)}`}
    color="info"
    variant="outlined"
  />
  <Chip
    label={`Total: ${formatCurrency(totales.totalCuenta)}`}
    color="default"
    variant="filled"
  />
  <Chip
    label={totales.saldoPendiente >= 0
      ? `Saldo a Favor: +${formatCurrency(Math.abs(totales.saldoPendiente))}`
      : `Debe: ${formatCurrency(totales.saldoPendiente)}`
    }
    color={totales.saldoPendiente >= 0 ? 'success' : 'error'}
    variant="filled"
  />
</Box>
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Usa totales del backend (objeto `totales` en response)
- ✅ **CORRECTO:** Muestra fórmula explicativa al usuario
- ✅ **CORRECTO:** Distingue saldo a favor vs saldo debe
- ✅ **CORRECTO:** Se actualiza cada vez que se cargan transacciones

### 4.3 Componente: `OpenAccountsList.tsx`

**Renderizado de Totales (líneas 216-252):**

```tsx
<TableCell align="right">
  <Typography variant="body2" fontWeight="medium">
    {formatCurrency(account.totalCuenta)}
  </Typography>
  <Typography variant="caption" color="text.secondary">
    S: {formatCurrency(account.totalServicios)} | P: {formatCurrency(account.totalProductos)}
  </Typography>
</TableCell>

<TableCell align="right">
  <Chip
    label={account.saldoPendiente >= 0
      ? `+${formatCurrency(Math.abs(account.saldoPendiente))} A FAVOR`
      : `${formatCurrency(account.saldoPendiente)} DEBE`
    }
    color={getSaldoColor(account.saldoPendiente) as any}
    size="small"
    variant={account.saldoPendiente === 0 ? 'filled' : 'outlined'}
  />
</TableCell>
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Muestra totales directamente desde el objeto `account`
- ✅ **CORRECTO:** Distingue saldo a favor vs debe
- ✅ **CORRECTO:** Usa colores semánticos (verde=favor, rojo=debe)

### 4.4 Componente: `AccountHistoryList.tsx`

**Renderizado (líneas 167-191):**

```tsx
<TableCell align="right">
  <Typography variant="body2" fontWeight="medium">
    {formatCurrency(account.totalCuenta)}
  </Typography>
  <Typography variant="caption" color="text.secondary">
    S: {formatCurrency(account.totalServicios)} | P: {formatCurrency(account.totalProductos)}
  </Typography>
</TableCell>
```

**ANÁLISIS:**
- ✅ **CORRECTO:** Muestra totales directamente desde el objeto `account`
- ✅ **CORRECTO:** Para cuentas cerradas, estos valores son el snapshot histórico

---

## 5. FLUJO COMPLETO DE DATOS

### 5.1 Diagrama de Flujo: Consulta de Cuenta Abierta

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: AccountDetailDialog.tsx                              │
│ - Usuario hace clic en "Ver detalles" de cuenta abierta        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIO: posService.getAccountTransactions(accountId)         │
│ - GET /api/pos/cuenta/:id/transacciones?page=1&limit=25        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: pos.routes.js - GET /cuenta/:id/transacciones         │
│ Step 1: Verificar que cuenta existe                            │
│         const cuenta = await prisma.cuentaPaciente.findUnique() │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Obtener transacciones con paginación                   │
│         const transacciones = await prisma.transaccionCuenta    │
│           .findMany({ where: { cuentaId }, skip, take })       │
│         Incluye: producto { codigo, nombre, unidadMedida }      │
│                  servicio { codigo, nombre, tipo }              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Calcular totales actualizados EN TIEMPO REAL           │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │ const [servicios, productos] = await Promise.all([       │ │
│   │   prisma.transaccionCuenta.aggregate({                   │ │
│   │     where: { cuentaId, tipo: 'servicio' },               │ │
│   │     _sum: { subtotal: true }                             │ │
│   │   }),                                                     │ │
│   │   prisma.transaccionCuenta.aggregate({                   │ │
│   │     where: { cuentaId, tipo: 'producto' },               │ │
│   │     _sum: { subtotal: true }                             │ │
│   │   })                                                      │ │
│   │ ]);                                                       │ │
│   │                                                           │ │
│   │ totalServicios = parseFloat(servicios._sum.subtotal||0)  │ │
│   │ totalProductos = parseFloat(productos._sum.subtotal||0)  │ │
│   │ totalCuenta = totalServicios + totalProductos            │ │
│   │ saldoPendiente = anticipo - totalCuenta ✅ CORRECTA      │ │
│   └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Formatear respuesta                                    │
│   {                                                             │
│     transacciones: [...],                                       │
│     pagination: { total, totalPages, currentPage, pageSize },   │
│     totales: {                                                  │
│       anticipo,           // ← Desde cuenta.anticipo            │
│       totalServicios,     // ← Calculado en tiempo real ✅      │
│       totalProductos,     // ← Calculado en tiempo real ✅      │
│       totalCuenta,        // ← Calculado en tiempo real ✅      │
│       saldoPendiente      // ← Calculado en tiempo real ✅      │
│     }                                                           │
│   }                                                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIO: posService recibe respuesta                          │
│ - NO hace transformaciones adicionales                          │
│ - Retorna exactamente lo que recibió del backend               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: AccountDetailDialog actualiza estado                 │
│   setTransactions(response.data.transacciones)                  │
│   setTotales(response.data.totales) // ✅ USA TOTALES BACKEND   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ RENDERIZADO: Muestra información al usuario                    │
│ - Tabla de transacciones con paginación                        │
│ - Chips con totales: Anticipo, Servicios, Productos, Total     │
│ - Chip destacado: Saldo a Favor / Debe                         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Diagrama de Flujo: Consulta de Cuenta Cerrada

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: AccountHistoryList.tsx                               │
│ - Usuario consulta historial de cuentas cerradas               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIO: posService.getPatientAccounts({ estado: 'cerrada' }) │
│ - GET /api/pos/cuentas?estado=cerrada                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: pos.routes.js - GET /cuentas                          │
│ Step 1: Obtener cuentas cerradas                               │
│         const cuentas = await prisma.cuentaPaciente.findMany({ │
│           where: { estado: 'cerrada' }                          │
│         })                                                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Formatear cuentas (líneas 523-570)                     │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │ if (cuenta.estado === 'abierta') {                       │ │
│   │   // [Calcular en tiempo real]                           │ │
│   │ } else {                                                  │ │
│   │   // Cuenta CERRADA: usar valores almacenados            │ │
│   │   anticipo = parseFloat(cuenta.anticipo.toString());     │ │
│   │   totalServicios = parseFloat(cuenta.totalServicios);    │ │
│   │   totalProductos = parseFloat(cuenta.totalProductos);    │ │
│   │   totalCuenta = parseFloat(cuenta.totalCuenta);          │ │
│   │   saldoPendiente = parseFloat(cuenta.saldoPendiente);    │ │
│   │   // ✅ RESPETA SNAPSHOT HISTÓRICO                       │ │
│   │ }                                                         │ │
│   └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: AccountHistoryList renderiza                         │
│ - Muestra totales desde cuenta.totalCuenta (snapshot)          │
│ - Muestra saldo desde cuenta.saldoPendiente (snapshot)         │
│ - ✅ VALORES HISTÓRICOS AL MOMENTO DEL CIERRE                   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Puntos de Transformación de Datos

| Punto | Archivo | Línea | Transformación |
|-------|---------|-------|----------------|
| **1. Lectura BD** | pos.routes.js | 486-520 | `prisma.cuentaPaciente.findMany()` - Lee cuenta con campos Decimal |
| **2. Decisión** | pos.routes.js | 526 | `if (cuenta.estado === 'abierta')` - Bifurcación de lógica |
| **3a. Cálculo Tiempo Real** | pos.routes.js | 528-543 | `prisma.transaccionCuenta.aggregate()` - Suma transacciones |
| **3b. Uso de Snapshot** | pos.routes.js | 544-551 | `parseFloat(cuenta.totalCuenta)` - Usa valores almacenados |
| **4. Formateo** | pos.routes.js | 553-569 | Construcción del objeto de respuesta |
| **5. Serialización** | pos.routes.js | 572-583 | `res.json()` - Envía JSON al frontend |
| **6. Recepción** | posService.ts | 78 | `api.get()` - Recibe respuesta del backend |
| **7. Renderizado** | OpenAccountsList.tsx | 226 | `formatCurrency(account.totalCuenta)` - Solo formatea |

**CONCLUSIÓN:** No hay transformaciones adicionales en el frontend que puedan alterar los totales.

---

## 6. INCONSISTENCIAS IDENTIFICADAS

### 6.1 Inconsistencia Menor: Endpoint `/cuenta/:id/transacciones`

**Ubicación:** `pos.routes.js` líneas 824-838

**Problema:**
El endpoint **NO distingue** entre cuentas abiertas y cerradas, siempre calcula en tiempo real.

**Impacto:**
- **Cuentas ABIERTAS:** ✅ Funciona correctamente
- **Cuentas CERRADAS:** ⚠️ Los totales podrían diferir del snapshot histórico

**Ejemplo de Problema:**
```javascript
// Cuenta cerrada el 1 de noviembre con:
// - totalCuenta = $5,000 (snapshot)
// - saldoPendiente = +$5,000 (snapshot)

// Si después del cierre se agregan transacciones (error humano):
// - GET /cuenta/:id/transacciones calculará totales NUEVOS
// - GET /cuenta/:id mostrará snapshot HISTÓRICO
// = INCONSISTENCIA
```

**Recomendación:**
```javascript
// Línea 824, agregar:
if (cuenta.estado === 'cerrada') {
  // Usar valores almacenados para cuentas cerradas
  const totales = {
    anticipo: parseFloat(cuenta.anticipo),
    totalServicios: parseFloat(cuenta.totalServicios),
    totalProductos: parseFloat(cuenta.totalProductos),
    totalCuenta: parseFloat(cuenta.totalCuenta),
    saldoPendiente: parseFloat(cuenta.saldoPendiente)
  };
} else {
  // Calcular en tiempo real para cuentas abiertas
  const [servicios, productos] = await Promise.all([...]);
}
```

### 6.2 Problema de Performance: N+1 Queries

**Ubicación:** `pos.routes.js` líneas 523-570

**Problema:**
```javascript
const cuentasFormatted = await Promise.all(cuentas.map(async (cuenta) => {
  if (cuenta.estado === 'abierta') {
    // Hace 2 queries por cada cuenta abierta
    const [servicios, productos] = await Promise.all([...]);
  }
}));
```

Si hay **100 cuentas abiertas**, se ejecutan **200 queries adicionales** (2 por cuenta).

**Impacto:**
- ⚠️ Latencia alta con muchas cuentas abiertas
- ⚠️ Sobrecarga en PostgreSQL
- ⚠️ Timeout posible si >1000 cuentas

**Recomendación de Optimización:**
```javascript
// Obtener IDs de cuentas abiertas
const cuentasAbiertas = cuentas.filter(c => c.estado === 'abierta');
const idsAbiertas = cuentasAbiertas.map(c => c.id);

// UNA SOLA query para todas las cuentas abiertas
const totalesPorCuenta = await prisma.transaccionCuenta.groupBy({
  by: ['cuentaId', 'tipo'],
  where: {
    cuentaId: { in: idsAbiertas },
    tipo: { in: ['servicio', 'producto'] }
  },
  _sum: {
    subtotal: true
  }
});

// Construir mapa de totales por cuenta
const totalesMap = {};
for (const total of totalesPorCuenta) {
  if (!totalesMap[total.cuentaId]) {
    totalesMap[total.cuentaId] = { servicios: 0, productos: 0 };
  }
  if (total.tipo === 'servicio') {
    totalesMap[total.cuentaId].servicios = parseFloat(total._sum.subtotal || 0);
  } else if (total.tipo === 'producto') {
    totalesMap[total.cuentaId].productos = parseFloat(total._sum.subtotal || 0);
  }
}

// Formatear cuentas usando el mapa
const cuentasFormatted = cuentas.map((cuenta) => {
  if (cuenta.estado === 'abierta') {
    const totales = totalesMap[cuenta.id] || { servicios: 0, productos: 0 };
    const totalServicios = totales.servicios;
    const totalProductos = totales.productos;
    // ...
  }
});
```

**Beneficio:**
- **Antes:** 1 + (N * 2) queries = 201 queries para 100 cuentas
- **Después:** 1 + 1 queries = 2 queries para 100 cuentas
- **Mejora:** 99.5% reducción de queries

### 6.3 Posible Race Condition: Cierre de Cuenta

**Ubicación:** No visible en los archivos analizados (se asume que está en otro archivo)

**Problema Teórico:**
```javascript
// Thread 1: Enfermero agrega medicamento a cuenta
POST /api/patient-accounts/:id/transactions

// Thread 2 (simultáneo): Cajero cierra cuenta
PUT /api/patient-accounts/:id/close

// ¿Qué pasa si el cierre se ejecuta ANTES del commit de la transacción?
// = Cuenta cerrada con snapshot INCORRECTO
```

**Recomendación:**
```javascript
// En endpoint de cierre de cuenta
await prisma.$transaction(async (tx) => {
  // 1. Lock pesimista (SELECT FOR UPDATE)
  const cuenta = await tx.$queryRaw`
    SELECT * FROM cuentas_pacientes
    WHERE id = ${cuentaId}
    FOR UPDATE
  `;

  if (cuenta.estado !== 'abierta') {
    throw new Error('Cuenta ya cerrada');
  }

  // 2. Calcular totales finales
  const [servicios, productos] = await Promise.all([...]);

  // 3. Cerrar cuenta con snapshot
  await tx.cuentaPaciente.update({
    where: { id: cuentaId },
    data: {
      estado: 'cerrada',
      totalServicios,
      totalProductos,
      totalCuenta,
      saldoPendiente,
      fechaCierre: new Date(),
      cajeroCierreId
    }
  });
}, {
  isolationLevel: 'Serializable' // Máxima protección
});
```

---

## 7. CASOS EDGE NO MANEJADOS

### 7.1 Transacciones Negativas

**Problema:** ¿Qué pasa si hay descuentos o devoluciones?

**Escenario:**
```sql
INSERT INTO transacciones_cuenta (cuenta_id, tipo, concepto, cantidad, precio_unitario, subtotal)
VALUES (123, 'producto', 'Descuento por error', 1, -100.00, -100.00);
```

**Impacto:**
- `totalProductos` se reducirá correctamente
- `saldoPendiente` aumentará (más saldo a favor)

**Validación Actual:** ❓ No visible en el código analizado

**Recomendación:**
```javascript
// Validar que subtotales negativos tengan justificación
if (subtotal < 0 && !motivo) {
  throw new Error('Los descuentos requieren un motivo');
}
```

### 7.2 Cuenta con Anticipo Cero

**Problema:** ¿Se puede crear una cuenta sin anticipo?

**Escenario:**
```javascript
// Cuenta con anticipo = $0
// Se agregan servicios por $500
// saldoPendiente = 0 - 500 = -$500 (paciente debe)
```

**Validación Actual:** ❓ No visible en el código analizado

**Recomendación:**
```javascript
// En creación de cuenta
if (anticipo < ANTICIPO_MINIMO && tipoAtencion === 'hospitalizacion') {
  throw new Error(`Se requiere un anticipo mínimo de ${ANTICIPO_MINIMO}`);
}
```

### 7.3 Transacciones después de Cierre

**Problema:** ¿Se puede agregar una transacción a una cuenta cerrada?

**Escenario:**
```javascript
// Cuenta cerrada el 1 de noviembre
// Enfermero intenta agregar medicamento el 2 de noviembre
POST /api/patient-accounts/123/transactions
```

**Validación Necesaria:**
```javascript
// En endpoint de agregar transacción
const cuenta = await prisma.cuentaPaciente.findUnique({ where: { id } });
if (cuenta.estado === 'cerrada') {
  throw new Error('No se pueden agregar transacciones a una cuenta cerrada');
}
```

### 7.4 Cuenta sin Transacciones

**Problema:** ¿Qué muestra el endpoint si una cuenta no tiene transacciones?

**Escenario:**
```javascript
// Cuenta recién creada, sin transacciones
GET /api/pos/cuenta/123/transacciones
```

**Resultado Esperado:**
```json
{
  "transacciones": [],
  "pagination": { "total": 0, "totalPages": 0, "currentPage": 1, "pageSize": 25 },
  "totales": {
    "anticipo": 10000.00,
    "totalServicios": 0.00,
    "totalProductos": 0.00,
    "totalCuenta": 0.00,
    "saldoPendiente": 10000.00
  }
}
```

**Análisis:**
```javascript
// prisma.transaccionCuenta.aggregate() con 0 resultados retorna:
// { _sum: { subtotal: null } }

// El código actual hace:
const totalServicios = parseFloat(servicios._sum.subtotal || 0); // ✅ MANEJA BIEN
```

✅ **CORRECTO:** El código maneja correctamente cuentas sin transacciones.

---

## 8. VALIDACIONES DE INTEGRIDAD

### 8.1 Validaciones Presentes

| Validación | Ubicación | Estado |
|------------|-----------|--------|
| Cuenta existe | pos.routes.js:755 | ✅ Implementada |
| Usuario autenticado | auth.middleware | ✅ Implementada |
| Rol autorizado | auth.middleware | ✅ Implementada |
| Transacciones con paginación | pos.routes.js:796 | ✅ Implementada |

### 8.2 Validaciones Faltantes

| Validación | Impacto | Prioridad |
|------------|---------|-----------|
| Transacción negativa requiere motivo | Medio | Media |
| No agregar transacciones a cuenta cerrada | Alto | Alta |
| Anticipo mínimo para hospitalización | Medio | Media |
| Lock optimista en cierre de cuenta | Alto | Alta |

---

## 9. RECOMENDACIONES

### 9.1 Correcciones Inmediatas (Prioridad Alta)

#### Recomendación 1: Respetar Snapshot en Endpoint de Transacciones

**Archivo:** `backend/routes/pos.routes.js`
**Líneas:** 824-838

**Problema:** El endpoint `/cuenta/:id/transacciones` siempre calcula en tiempo real, incluso para cuentas cerradas.

**Corrección:**
```javascript
// Calcular totales actualizados de la cuenta
let totales;

if (cuenta.estado === 'cerrada') {
  // Cuenta CERRADA: usar snapshot histórico
  totales = {
    anticipo: parseFloat(cuenta.anticipo),
    totalServicios: parseFloat(cuenta.totalServicios),
    totalProductos: parseFloat(cuenta.totalProductos),
    totalCuenta: parseFloat(cuenta.totalCuenta),
    saldoPendiente: parseFloat(cuenta.saldoPendiente)
  };
} else {
  // Cuenta ABIERTA: calcular en tiempo real
  const [servicios, productos] = await Promise.all([
    prisma.transaccionCuenta.aggregate({
      where: { cuentaId: parseInt(id), tipo: 'servicio' },
      _sum: { subtotal: true }
    }),
    prisma.transaccionCuenta.aggregate({
      where: { cuentaId: parseInt(id), tipo: 'producto' },
      _sum: { subtotal: true }
    })
  ]);

  const totalServicios = parseFloat(servicios._sum.subtotal || 0);
  const totalProductos = parseFloat(productos._sum.subtotal || 0);
  const totalCuenta = totalServicios + totalProductos;
  const saldoPendiente = parseFloat(cuenta.anticipo) - totalCuenta;

  totales = {
    anticipo: parseFloat(cuenta.anticipo),
    totalServicios,
    totalProductos,
    totalCuenta,
    saldoPendiente
  };
}

res.json({
  success: true,
  data: {
    transacciones: transaccionesFormatted,
    pagination: { /* ... */ },
    totales // ✅ Ahora respeta snapshot para cuentas cerradas
  }
});
```

#### Recomendación 2: Prevenir Transacciones en Cuentas Cerradas

**Archivo:** Requiere verificar `patient-accounts.routes.js` (no analizado)
**Endpoint:** `POST /api/patient-accounts/:id/transactions`

**Corrección Necesaria:**
```javascript
// Al inicio del handler
const cuenta = await prisma.cuentaPaciente.findUnique({
  where: { id: parseInt(accountId) }
});

if (!cuenta) {
  return res.status(404).json({
    success: false,
    message: 'Cuenta no encontrada'
  });
}

if (cuenta.estado === 'cerrada') {
  return res.status(400).json({
    success: false,
    message: 'No se pueden agregar transacciones a una cuenta cerrada. La cuenta fue cerrada el ' + cuenta.fechaCierre
  });
}
```

### 9.2 Optimizaciones (Prioridad Media)

#### Optimización 1: Reducir N+1 Queries en `/cuentas`

**Implementación:**
```javascript
// GET /pos/cuentas endpoint
router.get('/cuentas', authenticateToken, async (req, res) => {
  try {
    const { estado, pacienteId, limit = 100, offset = 0 } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (pacienteId) where.pacienteId = parseInt(pacienteId);

    const [cuentas, total] = await Promise.all([
      prisma.cuentaPaciente.findMany({ /* ... */ }),
      prisma.cuentaPaciente.count({ where })
    ]);

    // Separar cuentas abiertas y cerradas
    const cuentasAbiertas = cuentas.filter(c => c.estado === 'abierta');
    const cuentasCerradas = cuentas.filter(c => c.estado === 'cerrada');

    // Calcular totales para cuentas abiertas con UNA SOLA query
    const totalesPorCuenta = {};
    if (cuentasAbiertas.length > 0) {
      const idsAbiertas = cuentasAbiertas.map(c => c.id);

      const totales = await prisma.transaccionCuenta.groupBy({
        by: ['cuentaId', 'tipo'],
        where: {
          cuentaId: { in: idsAbiertas },
          tipo: { in: ['servicio', 'producto'] }
        },
        _sum: {
          subtotal: true
        }
      });

      // Construir mapa de totales
      for (const total of totales) {
        if (!totalesPorCuenta[total.cuentaId]) {
          totalesPorCuenta[total.cuentaId] = { servicios: 0, productos: 0 };
        }
        if (total.tipo === 'servicio') {
          totalesPorCuenta[total.cuentaId].servicios = parseFloat(total._sum.subtotal || 0);
        } else if (total.tipo === 'producto') {
          totalesPorCuenta[total.cuentaId].productos = parseFloat(total._sum.subtotal || 0);
        }
      }
    }

    // Formatear cuentas
    const cuentasFormatted = cuentas.map((cuenta) => {
      let totalServicios, totalProductos, totalCuenta, anticipo, saldoPendiente;

      if (cuenta.estado === 'abierta') {
        const totales = totalesPorCuenta[cuenta.id] || { servicios: 0, productos: 0 };
        totalServicios = totales.servicios;
        totalProductos = totales.productos;
        totalCuenta = totalServicios + totalProductos;
        anticipo = parseFloat(cuenta.anticipo.toString());
        saldoPendiente = anticipo - totalCuenta;
      } else {
        // Usar snapshot
        anticipo = parseFloat(cuenta.anticipo.toString());
        totalServicios = parseFloat(cuenta.totalServicios.toString());
        totalProductos = parseFloat(cuenta.totalProductos.toString());
        totalCuenta = parseFloat(cuenta.totalCuenta.toString());
        saldoPendiente = parseFloat(cuenta.saldoPendiente.toString());
      }

      return {
        id: cuenta.id,
        /* ... resto de campos ... */
        anticipo,
        totalServicios,
        totalProductos,
        totalCuenta,
        saldoPendiente
      };
    });

    res.json({
      success: true,
      data: {
        accounts: cuentasFormatted,
        pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
      }
    });

  } catch (error) {
    logger.logError('GET_PATIENT_ACCOUNTS', error);
    res.status(500).json({ success: false, message: 'Error al obtener cuentas' });
  }
});
```

**Beneficio:**
- **Antes:** 1 + (N * 2) queries = 201 queries para 100 cuentas abiertas
- **Después:** 1 + 1 queries = 2 queries
- **Mejora:** 99.5% reducción

#### Optimización 2: Índices de Base de Datos

**Verificar que existan los siguientes índices:**
```sql
-- Índice para filtrar transacciones por cuenta y tipo
CREATE INDEX idx_transacciones_cuenta_tipo
ON transacciones_cuenta (cuenta_id, tipo);

-- Índice para sumas rápidas por cuenta
CREATE INDEX idx_transacciones_subtotal
ON transacciones_cuenta (cuenta_id, tipo, subtotal);

-- Índice para consultas de cuentas abiertas
CREATE INDEX idx_cuentas_estado_fecha
ON cuentas_pacientes (estado, fecha_apertura);
```

### 9.3 Mejoras de Robustez (Prioridad Media)

#### Mejora 1: Lock Optimista en Cierre de Cuenta

**Archivo:** `patient-accounts.routes.js` (ubicación asumida)
**Endpoint:** `PUT /api/patient-accounts/:id/close`

**Implementación:**
```javascript
router.put('/:id/close', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { metodoPago, montoRecibido } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock pesimista: SELECT FOR UPDATE
      const cuenta = await tx.$queryRaw`
        SELECT * FROM cuentas_pacientes
        WHERE id = ${parseInt(id)}
        FOR UPDATE
      `;

      if (!cuenta || cuenta.length === 0) {
        throw new Error('Cuenta no encontrada');
      }

      if (cuenta[0].estado === 'cerrada') {
        throw new Error('La cuenta ya está cerrada');
      }

      // 2. Calcular totales finales desde transacciones
      const [servicios, productos] = await Promise.all([
        tx.transaccionCuenta.aggregate({
          where: { cuentaId: parseInt(id), tipo: 'servicio' },
          _sum: { subtotal: true }
        }),
        tx.transaccionCuenta.aggregate({
          where: { cuentaId: parseInt(id), tipo: 'producto' },
          _sum: { subtotal: true }
        })
      ]);

      const totalServicios = parseFloat(servicios._sum.subtotal || 0);
      const totalProductos = parseFloat(productos._sum.subtotal || 0);
      const totalCuenta = totalServicios + totalProductos;
      const anticipo = parseFloat(cuenta[0].anticipo);
      const saldoPendiente = anticipo - totalCuenta;

      // 3. Validar que el monto recibido sea suficiente
      if (saldoPendiente < 0 && montoRecibido < Math.abs(saldoPendiente)) {
        throw new Error(`Se requiere un pago de ${Math.abs(saldoPendiente)}, se recibió ${montoRecibido}`);
      }

      // 4. Cerrar cuenta con snapshot final
      const cuentaCerrada = await tx.cuentaPaciente.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'cerrada',
          totalServicios,
          totalProductos,
          totalCuenta,
          saldoPendiente,
          fechaCierre: new Date(),
          cajeroCierreId: req.user.id
        }
      });

      return cuentaCerrada;
    }, {
      isolationLevel: 'Serializable', // Máxima protección contra race conditions
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      data: { account: result },
      message: 'Cuenta cerrada exitosamente'
    });

  } catch (error) {
    logger.logError('CLOSE_ACCOUNT', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

#### Mejora 2: Validación de Anticipo Mínimo

**Archivo:** `patient-accounts.routes.js` (ubicación asumida)
**Endpoint:** `POST /api/patient-accounts`

**Implementación:**
```javascript
// Constantes de negocio
const ANTICIPO_MINIMO = {
  consulta_general: 0,       // Sin anticipo
  urgencia: 5000,            // $5,000 MXN
  hospitalizacion: 10000     // $10,000 MXN
};

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pacienteId, tipoAtencion, anticipo, /* ... */ } = req.body;

    // Validar anticipo mínimo según tipo de atención
    const anticipoMinimo = ANTICIPO_MINIMO[tipoAtencion];
    if (anticipo < anticipoMinimo) {
      return res.status(400).json({
        success: false,
        message: `Se requiere un anticipo mínimo de ${anticipoMinimo} MXN para ${tipoAtencion}`
      });
    }

    // Crear cuenta
    const cuenta = await prisma.cuentaPaciente.create({
      data: {
        pacienteId,
        tipoAtencion,
        anticipo,
        cajeroAperturaId: req.user.id,
        /* ... */
      }
    });

    // Crear transacción de anticipo
    await prisma.transaccionCuenta.create({
      data: {
        cuentaId: cuenta.id,
        tipo: 'anticipo',
        concepto: 'Anticipo inicial',
        cantidad: 1,
        precioUnitario: anticipo,
        subtotal: anticipo,
        empleadoCargoId: req.user.id
      }
    });

    res.json({
      success: true,
      data: { account: cuenta },
      message: 'Cuenta creada exitosamente'
    });

  } catch (error) {
    logger.logError('CREATE_ACCOUNT', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 9.4 Monitoreo y Alertas (Prioridad Baja)

#### Alerta 1: Cuenta con Saldo Negativo Alto

```javascript
// En endpoint de agregar transacción
const totalCuenta = await calcularTotalCuenta(cuentaId);
const saldoPendiente = cuenta.anticipo - totalCuenta;

if (saldoPendiente < -50000) { // Más de $50K de deuda
  logger.warn('CUENTA_SALDO_NEGATIVO_ALTO', {
    cuentaId,
    saldoPendiente,
    pacienteId: cuenta.pacienteId,
    cajeroId: req.user.id
  });

  // Opcional: Enviar notificación al administrador
}
```

#### Alerta 2: Cuenta Abierta Más de 30 Días

```javascript
// Tarea cron diaria
async function alertarCuentasAbiertas() {
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const cuentasAntiguas = await prisma.cuentaPaciente.findMany({
    where: {
      estado: 'abierta',
      fechaApertura: {
        lt: hace30Dias
      }
    },
    include: {
      paciente: true,
      cajeroApertura: true
    }
  });

  for (const cuenta of cuentasAntiguas) {
    logger.warn('CUENTA_ABIERTA_ANTIGUA', {
      cuentaId: cuenta.id,
      paciente: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno}`,
      diasAbierta: Math.floor((Date.now() - cuenta.fechaApertura) / (1000 * 60 * 60 * 24)),
      cajero: cuenta.cajeroApertura.username
    });
  }

  return cuentasAntiguas.length;
}
```

---

## 10. PLAN DE VERIFICACIÓN

### 10.1 Pasos para Reproducir el Problema Reportado

1. **Crear cuenta de prueba:**
```bash
POST /api/patient-accounts
{
  "pacienteId": 1,
  "tipoAtencion": "hospitalizacion",
  "anticipo": 10000,
  "medicoTratanteId": 5
}
```

2. **Agregar transacciones:**
```bash
POST /api/patient-accounts/{id}/transactions
{
  "tipo": "servicio",
  "servicioId": 1,
  "cantidad": 1,
  "precioUnitario": 500
}

POST /api/patient-accounts/{id}/transactions
{
  "tipo": "producto",
  "productoId": 10,
  "cantidad": 2,
  "precioUnitario": 250
}
```

3. **Verificar totales en diferentes endpoints:**
```bash
# Endpoint 1: Lista de cuentas
GET /api/pos/cuentas?estado=abierta
# Verificar: totalServicios = 500, totalProductos = 500, totalCuenta = 1000, saldoPendiente = 9000

# Endpoint 2: Detalle de cuenta
GET /api/pos/cuenta/{id}
# Verificar: Mismos totales que endpoint 1

# Endpoint 3: Historial de transacciones
GET /api/pos/cuenta/{id}/transacciones
# Verificar: totales.totalServicios = 500, totales.totalProductos = 500, etc.
```

4. **Cerrar cuenta:**
```bash
PUT /api/patient-accounts/{id}/close
{
  "metodoPago": "efectivo",
  "montoRecibido": 1000
}
```

5. **Verificar totales después del cierre:**
```bash
GET /api/pos/cuentas?estado=cerrada
# Verificar: Totales coinciden con el momento del cierre

GET /api/pos/cuenta/{id}/transacciones
# ⚠️ VERIFICAR: ¿Muestra snapshot o recalcula?
```

### 10.2 Casos de Prueba

| Caso | Escenario | Resultado Esperado |
|------|-----------|-------------------|
| **Test 1** | Cuenta abierta sin transacciones | `totalCuenta = 0, saldoPendiente = anticipo` |
| **Test 2** | Cuenta abierta con 1 servicio | `totalCuenta = precioServicio, saldoPendiente = anticipo - precioServicio` |
| **Test 3** | Cuenta abierta con servicios y productos | `totalCuenta = servicios + productos, saldoPendiente correcto` |
| **Test 4** | Cuenta cerrada consultada en `/cuentas` | Muestra snapshot histórico |
| **Test 5** | Cuenta cerrada consultada en `/cuenta/:id` | Muestra snapshot histórico |
| **Test 6** | Cuenta cerrada consultada en `/transacciones` | ⚠️ **DEBE** mostrar snapshot (actualmente recalcula) |
| **Test 7** | 100 cuentas abiertas en `/cuentas` | Latencia < 2 segundos (después de optimización) |
| **Test 8** | Intento de agregar transacción a cuenta cerrada | Error 400 "Cuenta cerrada" |

### 10.3 Consultas SQL para Verificación Manual

```sql
-- Verificar integridad de una cuenta específica
WITH totales_calculados AS (
  SELECT
    cuenta_id,
    SUM(CASE WHEN tipo = 'servicio' THEN subtotal ELSE 0 END) AS total_servicios_calc,
    SUM(CASE WHEN tipo = 'producto' THEN subtotal ELSE 0 END) AS total_productos_calc,
    SUM(CASE WHEN tipo IN ('servicio', 'producto') THEN subtotal ELSE 0 END) AS total_cuenta_calc
  FROM transacciones_cuenta
  WHERE cuenta_id = 123
  GROUP BY cuenta_id
)
SELECT
  c.id,
  c.estado,
  c.anticipo,
  c.total_servicios AS total_servicios_almacenado,
  tc.total_servicios_calc AS total_servicios_calculado,
  c.total_productos AS total_productos_almacenado,
  tc.total_productos_calc AS total_productos_calculado,
  c.total_cuenta AS total_cuenta_almacenado,
  tc.total_cuenta_calc AS total_cuenta_calculado,
  c.saldo_pendiente AS saldo_almacenado,
  (c.anticipo - tc.total_cuenta_calc) AS saldo_calculado,
  -- Detectar inconsistencias
  CASE
    WHEN c.estado = 'cerrada' AND (
      ABS(c.total_servicios - tc.total_servicios_calc) > 0.01 OR
      ABS(c.total_productos - tc.total_productos_calc) > 0.01 OR
      ABS(c.total_cuenta - tc.total_cuenta_calc) > 0.01 OR
      ABS(c.saldo_pendiente - (c.anticipo - tc.total_cuenta_calc)) > 0.01
    ) THEN 'INCONSISTENTE'
    ELSE 'OK'
  END AS estado_integridad
FROM cuentas_pacientes c
LEFT JOIN totales_calculados tc ON c.id = tc.cuenta_id
WHERE c.id = 123;
```

```sql
-- Encontrar todas las cuentas con inconsistencias
WITH totales_calculados AS (
  SELECT
    cuenta_id,
    SUM(CASE WHEN tipo = 'servicio' THEN subtotal ELSE 0 END) AS total_servicios_calc,
    SUM(CASE WHEN tipo = 'producto' THEN subtotal ELSE 0 END) AS total_productos_calc,
    SUM(CASE WHEN tipo IN ('servicio', 'producto') THEN subtotal ELSE 0 END) AS total_cuenta_calc
  FROM transacciones_cuenta
  GROUP BY cuenta_id
)
SELECT
  c.id,
  c.estado,
  c.fecha_apertura,
  c.fecha_cierre,
  ABS(c.total_servicios - COALESCE(tc.total_servicios_calc, 0)) AS diff_servicios,
  ABS(c.total_productos - COALESCE(tc.total_productos_calc, 0)) AS diff_productos,
  ABS(c.total_cuenta - COALESCE(tc.total_cuenta_calc, 0)) AS diff_total,
  ABS(c.saldo_pendiente - (c.anticipo - COALESCE(tc.total_cuenta_calc, 0))) AS diff_saldo
FROM cuentas_pacientes c
LEFT JOIN totales_calculados tc ON c.id = tc.cuenta_id
WHERE
  c.estado = 'cerrada' AND (
    ABS(c.total_servicios - COALESCE(tc.total_servicios_calc, 0)) > 0.01 OR
    ABS(c.total_productos - COALESCE(tc.total_productos_calc, 0)) > 0.01 OR
    ABS(c.total_cuenta - COALESCE(tc.total_cuenta_calc, 0)) > 0.01 OR
    ABS(c.saldo_pendiente - (c.anticipo - COALESCE(tc.total_cuenta_calc, 0))) > 0.01
  )
ORDER BY c.fecha_cierre DESC;
```

---

## 11. TESTING

### 11.1 Estado Actual de Tests

**Archivo:** `backend/tests/pos/pos.test.js`

**Suite:** POS Routes Tests
**Tests:** 26/26 passing (100% ✅)

**Estructura de Tests:**
```javascript
describe('POS Routes Tests', () => {
  // Suite 1: GET /api/pos/services
  describe('GET /api/pos/services', () => {
    it('should return list of active services', async () => { /* ... */ });
  });

  // Suite 2: POST /api/pos/quick-sale
  describe('POST /api/pos/quick-sale', () => {
    it('should process quick sale with products and services', async () => { /* ... */ });
    it('should validate stock before sale', async () => { /* ... */ });
    it('should reduce product stock after sale', async () => { /* ... */ });
  });

  // Suite 3: GET /api/pos/cuentas
  describe('GET /api/pos/cuentas', () => {
    it('should return list of patient accounts', async () => { /* ... */ });
    it('should filter accounts by estado', async () => { /* ... */ });
  });

  // Suite 4: GET /api/pos/cuenta/:id
  describe('GET /api/pos/cuenta/:id', () => {
    it('should return account details with transactions', async () => { /* ... */ });
    it('should return 404 for non-existent account', async () => { /* ... */ });
  });

  // Suite 5: GET /api/pos/cuenta/:id/transacciones
  describe('GET /api/pos/cuenta/:id/transacciones', () => {
    it('should return paginated transactions', async () => { /* ... */ });
    it('should include updated totals', async () => { /* ... */ });
  });

  // Suite 6: POST /api/pos/recalcular-cuentas
  describe('POST /api/pos/recalcular-cuentas', () => {
    it('should recalculate all open accounts (admin only)', async () => { /* ... */ });
    it('should reject non-admin users', async () => { /* ... */ });
  });
});
```

### 11.2 Tests Faltantes (Recomendados)

#### Test 1: Consistencia entre Endpoints

```javascript
describe('Consistency between endpoints', () => {
  it('should return same totals in /cuentas, /cuenta/:id, and /transacciones for open account', async () => {
    // 1. Crear cuenta
    const cuenta = await createTestCuentaPaciente({ anticipo: 10000 });

    // 2. Agregar transacciones
    await createTestTransaction({ cuentaId: cuenta.id, tipo: 'servicio', subtotal: 500 });
    await createTestTransaction({ cuentaId: cuenta.id, tipo: 'producto', subtotal: 300 });

    // 3. Consultar en 3 endpoints diferentes
    const res1 = await request(app)
      .get('/api/pos/cuentas')
      .set('Authorization', `Bearer ${authToken}`);

    const res2 = await request(app)
      .get(`/api/pos/cuenta/${cuenta.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    const res3 = await request(app)
      .get(`/api/pos/cuenta/${cuenta.id}/transacciones`)
      .set('Authorization', `Bearer ${authToken}`);

    // 4. Verificar consistencia
    const cuentaFromList = res1.body.data.accounts.find(c => c.id === cuenta.id);
    const cuentaDetail = res2.body.data.account;
    const totalesFromTrans = res3.body.data.totales;

    expect(cuentaFromList.totalCuenta).toBe(800);
    expect(cuentaDetail.totalCuenta).toBe(800);
    expect(totalesFromTrans.totalCuenta).toBe(800);

    expect(cuentaFromList.saldoPendiente).toBe(9200);
    expect(cuentaDetail.saldoPendiente).toBe(9200);
    expect(totalesFromTrans.saldoPendiente).toBe(9200);
  });
});
```

#### Test 2: Snapshot Histórico para Cuentas Cerradas

```javascript
describe('Historical snapshot for closed accounts', () => {
  it('should preserve snapshot totals for closed accounts', async () => {
    // 1. Crear cuenta y transacciones
    const cuenta = await createTestCuentaPaciente({ anticipo: 10000 });
    await createTestTransaction({ cuentaId: cuenta.id, tipo: 'servicio', subtotal: 500 });

    // 2. Cerrar cuenta
    const cuentaCerrada = await prisma.cuentaPaciente.update({
      where: { id: cuenta.id },
      data: {
        estado: 'cerrada',
        totalServicios: 500,
        totalProductos: 0,
        totalCuenta: 500,
        saldoPendiente: 9500,
        fechaCierre: new Date()
      }
    });

    // 3. Agregar transacción después del cierre (simulando error)
    await createTestTransaction({ cuentaId: cuenta.id, tipo: 'producto', subtotal: 200 });

    // 4. Consultar cuenta cerrada en /cuentas
    const res1 = await request(app)
      .get('/api/pos/cuentas?estado=cerrada')
      .set('Authorization', `Bearer ${authToken}`);

    const cuentaFromList = res1.body.data.accounts.find(c => c.id === cuenta.id);

    // ✅ DEBE mostrar snapshot histórico, NO recalcular
    expect(cuentaFromList.totalCuenta).toBe(500); // NO 700
    expect(cuentaFromList.saldoPendiente).toBe(9500); // NO 9300

    // 5. Consultar en /cuenta/:id
    const res2 = await request(app)
      .get(`/api/pos/cuenta/${cuenta.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res2.body.data.account.totalCuenta).toBe(500);
    expect(res2.body.data.account.saldoPendiente).toBe(9500);

    // 6. Consultar en /transacciones
    const res3 = await request(app)
      .get(`/api/pos/cuenta/${cuenta.id}/transacciones`)
      .set('Authorization', `Bearer ${authToken}`);

    // ⚠️ ACTUALMENTE FALLA: Este endpoint recalcula en tiempo real
    // ✅ DEBERÍA: Mostrar snapshot histórico
    expect(res3.body.data.totales.totalCuenta).toBe(500); // Actualmente retorna 700
  });
});
```

#### Test 3: Race Condition en Cierre de Cuenta

```javascript
describe('Race conditions', () => {
  it('should handle concurrent transaction + close gracefully', async () => {
    const cuenta = await createTestCuentaPaciente({ anticipo: 10000 });

    // Simular 2 operaciones concurrentes
    const promises = [
      // Thread 1: Agregar transacción
      request(app)
        .post(`/api/patient-accounts/${cuenta.id}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo: 'servicio',
          servicioId: testServicio.id,
          cantidad: 1,
          precioUnitario: 500
        }),

      // Thread 2: Cerrar cuenta (con pequeño delay)
      new Promise(resolve => setTimeout(resolve, 50)).then(() =>
        request(app)
          .put(`/api/patient-accounts/${cuenta.id}/close`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ metodoPago: 'efectivo', montoRecibido: 0 })
      )
    ];

    const [res1, res2] = await Promise.all(promises);

    // Verificar: Una operación debe fallar o ambas deben completarse correctamente
    const cuentaFinal = await prisma.cuentaPaciente.findUnique({
      where: { id: cuenta.id },
      include: { transacciones: true }
    });

    if (cuentaFinal.estado === 'cerrada') {
      // Si se cerró, debe incluir la transacción o rechazarla explícitamente
      const transaccionAgregada = cuentaFinal.transacciones.find(t => t.tipo === 'servicio');
      if (transaccionAgregada) {
        // La transacción se agregó ANTES del cierre
        expect(cuentaFinal.totalCuenta).toBeGreaterThan(0);
      } else {
        // La transacción fue rechazada
        expect(res1.status).toBe(400);
        expect(res1.body.message).toContain('cerrada');
      }
    }
  });
});
```

#### Test 4: Recalcular Cuentas con Inconsistencias

```javascript
describe('POST /api/pos/recalcular-cuentas', () => {
  it('should fix inconsistent accounts', async () => {
    // 1. Crear cuenta con valores inconsistentes
    const cuenta = await prisma.cuentaPaciente.create({
      data: {
        pacienteId: testPatient.id,
        tipoAtencion: 'consulta_general',
        estado: 'abierta',
        anticipo: 10000,
        totalServicios: 100, // ❌ VALOR INCORRECTO
        totalProductos: 200, // ❌ VALOR INCORRECTO
        totalCuenta: 300,    // ❌ VALOR INCORRECTO
        saldoPendiente: 9700, // ❌ VALOR INCORRECTO
        cajeroAperturaId: testUser.id
      }
    });

    // 2. Agregar transacciones reales
    await prisma.transaccionCuenta.createMany({
      data: [
        { cuentaId: cuenta.id, tipo: 'servicio', concepto: 'Test', cantidad: 1, precioUnitario: 500, subtotal: 500 },
        { cuentaId: cuenta.id, tipo: 'producto', concepto: 'Test', cantidad: 1, precioUnitario: 300, subtotal: 300 }
      ]
    });

    // 3. Ejecutar recálculo
    const response = await request(app)
      .post('/api/pos/recalcular-cuentas')
      .set('Authorization', `Bearer ${adminToken}`); // Requiere rol admin

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.cuentasActualizadas).toBe(1);

    // 4. Verificar corrección
    const cuentaActualizada = await prisma.cuentaPaciente.findUnique({
      where: { id: cuenta.id }
    });

    expect(parseFloat(cuentaActualizada.totalServicios)).toBe(500);
    expect(parseFloat(cuentaActualizada.totalProductos)).toBe(300);
    expect(parseFloat(cuentaActualizada.totalCuenta)).toBe(800);
    expect(parseFloat(cuentaActualizada.saldoPendiente)).toBe(9200);
  });
});
```

---

## 12. CONCLUSIONES

### 12.1 Hallazgos Principales

1. **✅ CORRECCIÓN YA IMPLEMENTADA:**
   - El sistema fue corregido el 6 de noviembre de 2025 (commit b293475)
   - Se implementó cálculo en tiempo real para cuentas abiertas
   - Se respeta snapshot histórico para cuentas cerradas (en 2 de 3 endpoints)

2. **⚠️ INCONSISTENCIA MENOR IDENTIFICADA:**
   - El endpoint `GET /api/pos/cuenta/:id/transacciones` NO respeta snapshot para cuentas cerradas
   - Siempre recalcula totales en tiempo real
   - Impacto: Bajo (solo afecta la vista de transacciones)

3. **⚠️ PROBLEMA DE PERFORMANCE:**
   - N+1 queries en endpoint `GET /api/pos/cuentas` con cuentas abiertas
   - Impacto: Alto con >100 cuentas abiertas
   - Solución: Implementar `groupBy` de Prisma

4. **✅ ARQUITECTURA ROBUSTA:**
   - Single source of truth: Tabla `transacciones_cuenta`
   - Fórmula correcta: `saldoPendiente = anticipo - (servicios + productos)`
   - Prisma transactions con timeouts configurados

### 12.2 Estado del Problema Reportado

**PREGUNTA CRÍTICA:** ¿El problema reportado por Alfredo persiste después de la corrección del 6 de noviembre?

**POSIBLES ESCENARIOS:**

#### Escenario A: Problema Resuelto ✅
- La corrección del 6 de noviembre ya resolvió el problema
- Los totales ahora se calculan correctamente en tiempo real
- El usuario necesita **refrescar la caché del navegador** o **recargar la aplicación**

#### Escenario B: Problema con Datos Históricos ⚠️
- El problema afecta solo a **cuentas cerradas antes del 6 de noviembre**
- Estas cuentas tienen snapshots incorrectos almacenados
- **Solución:** Ejecutar `POST /api/pos/recalcular-cuentas` (PERO SOLO SI LAS CUENTAS ESTÁN ABIERTAS)

#### Escenario C: Problema en Endpoint `/transacciones` ⚠️
- El usuario está viendo la vista de transacciones de una cuenta cerrada
- El endpoint `/cuenta/:id/transacciones` recalcula en tiempo real (no respeta snapshot)
- **Solución:** Implementar Recomendación 1 (líneas arriba)

#### Escenario D: Problema de Caché Frontend ⚠️
- El frontend está mostrando datos antiguos en caché
- El backend está enviando datos correctos
- **Solución:** Implementar `cache-control: no-cache` o agregar `timestamp` a las peticiones

### 12.3 Acciones Recomendadas Inmediatas

**PARA ALFREDO (Usuario):**
1. ✅ **Verificar si el problema persiste:**
   - Abrir cuenta de prueba
   - Agregar transacciones
   - Consultar en diferentes vistas (lista, detalle, historial)
   - Cerrar cuenta y volver a consultar
   - Reportar exactamente dónde ve la discrepancia

2. ✅ **Limpiar caché del navegador:**
   ```bash
   # Chrome/Edge
   Ctrl + Shift + Delete → Borrar caché

   # O forzar recarga sin caché
   Ctrl + Shift + R
   ```

3. ✅ **Ejecutar recálculo de cuentas abiertas (si hay inconsistencias):**
   ```bash
   POST /api/pos/recalcular-cuentas
   # Requiere rol: administrador
   ```

**PARA DESARROLLO (Alfredo como Developer):**
1. ✅ **Implementar Recomendación 1:** Respetar snapshot en `/cuenta/:id/transacciones`
2. ✅ **Implementar Validación:** No permitir transacciones en cuentas cerradas
3. ⚙️ **Considerar Optimización:** Reducir N+1 queries en `/cuentas` (prioridad media)
4. 🧪 **Agregar Tests:** Tests de consistencia y snapshot histórico

### 12.4 Preguntas Pendientes para Alfredo

1. **¿El problema persiste después de la corrección del 6 de noviembre?**
   - Si NO: El problema está resuelto ✅
   - Si SÍ: Necesitamos reproducción exacta del escenario

2. **¿En qué vista específica se ve el problema?**
   - ¿En la lista de cuentas abiertas?
   - ¿En el detalle de cuenta?
   - ¿En el historial de transacciones?
   - ¿En cuentas cerradas o abiertas?

3. **¿Qué valores específicos están incorrectos?**
   - ¿El anticipo?
   - ¿El total de servicios/productos?
   - ¿El saldo pendiente?
   - ¿El total de cuenta?

4. **¿Se puede reproducir con una cuenta específica?**
   - Proporcionar ID de cuenta con problema
   - Ejecutar consultas SQL de verificación (sección 10.3)

---

## 13. REFERENCIAS

### Archivos Analizados
1. `/backend/prisma/schema.prisma` - Modelos CuentaPaciente y TransaccionCuenta
2. `/backend/routes/pos.routes.js` - 3 endpoints GET (cuentas, cuenta/:id, transacciones)
3. `/frontend/src/services/posService.ts` - Servicio de comunicación con API
4. `/frontend/src/components/pos/AccountDetailDialog.tsx` - Componente de detalle con historial
5. `/frontend/src/components/pos/OpenAccountsList.tsx` - Lista de cuentas abiertas
6. `/frontend/src/components/pos/AccountHistoryList.tsx` - Lista de cuentas cerradas

### Commits Relevantes
- `b293475` (6 Nov 2025) - Corrección de totales POS con cálculo en tiempo real
- `114f752` (anterior) - Corrección relacionada con saldos

### Documentación del Sistema
- `CLAUDE.md` - Instrucciones principales del proyecto
- `.claude/doc/FLUJOS_TRABAJO_CRITICOS.md` - Flujos de trabajo del sistema
- `.claude/doc/ANALISIS_SISTEMA_COMPLETO_2025.md` - Análisis general

---

**FIN DEL REPORTE**

**Investigador:** Backend Research Specialist
**Fecha:** 7 de noviembre de 2025
**Próximos pasos:** Esperar retroalimentación de Alfredo para determinar si el problema persiste y en qué contexto específico.
