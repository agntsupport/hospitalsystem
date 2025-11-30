# Plan de Complementación del Sistema Administrativo y Financiero
## Sistema de Gestión Hospitalaria Integral

**Autor:** Claude (Análisis para Alfredo Manuel Reyes)
**Fecha:** 29 de noviembre de 2025
**Versión:** 1.0

---

## RESUMEN EJECUTIVO

### Estado Actual del Sistema Financiero

| Módulo | % Completo | Calificación |
|--------|------------|--------------|
| **POS y Cuentas de Pacientes** | 100% | ⭐⭐⭐⭐⭐ |
| **Transacciones** | 100% | ⭐⭐⭐⭐⭐ |
| **Inventario con Costos** | 95% | ⭐⭐⭐⭐⭐ |
| **Facturación** | 85% | ⭐⭐⭐⭐ |
| **Cuentas por Cobrar** | 90% | ⭐⭐⭐⭐ |
| **Reportes Financieros** | 75% | ⭐⭐⭐ |
| **Costos Operativos** | 70% | ⭐⭐⭐ |
| **Gestión de Caja** | 0% | ❌ NO IMPLEMENTADO |
| **Devoluciones/Reembolsos** | 0% | ❌ NO IMPLEMENTADO |
| **Depósitos Bancarios** | 0% | ❌ NO IMPLEMENTADO |
| **Descuentos Autorizados** | 0% | ❌ NO IMPLEMENTADO |
| **Recibos Formales** | 30% | ⚠️ PARCIAL |

**Puntuación Global del Módulo Financiero: 72/100**

---

## DIAGNÓSTICO DETALLADO

### Lo Que Funciona Bien ✅

1. **POS Completamente Funcional (100%)**
   - 15 endpoints operativos
   - Transacciones atómicas con `SELECT FOR UPDATE`
   - Snapshot inmutable al cerrar cuentas
   - Pagos parciales con recálculo automático
   - Impresión de tickets (react-to-print v3.2.0)

2. **Inventario Robusto (95%)**
   - Separación clara COSTO vs PRECIO DE VENTA
   - 40+ endpoints implementados
   - Decrementos atómicos de stock
   - 8 tipos de movimientos auditados
   - Alertas de stock bajo/crítico

3. **Cuentas por Cobrar (90%)**
   - Autorización de admin requerida
   - Historial con fechas de pago
   - Estados: pendiente, pagado_parcial, pagado_total, cancelado
   - Top 10 deudores

4. **Reportes de Utilidades (75%)**
   - Endpoint `/reports/profit/detailed` con desglose
   - Costos de productos reales
   - Costos de servicios estimados (60% configurable)
   - Margen bruto y neto calculados

### Lo Que Falta (Gaps Críticos) ❌

1. **Sistema de Caja Diaria** - NO EXISTE
   - Sin apertura/cierre de turno
   - Sin arqueo de efectivo
   - Sin trazabilidad por cajero/turno

2. **Devoluciones y Reembolsos** - NO EXISTE
   - Imposible revertir una transacción
   - Productos vendidos por error no se devuelven
   - Stock no se recupera

3. **Depósitos Bancarios** - NO EXISTE
   - Efectivo "desaparece" sin trazabilidad
   - Sin registro de depósitos
   - Sin conciliación bancaria

4. **Descuentos con Autorización** - NO EXISTE
   - Cualquier precio se puede modificar
   - Sin límites por rol
   - Sin registro de autorizaciones

---

## PLAN DE IMPLEMENTACIÓN

### FASE 1: Sistema de Caja Diaria (CRÍTICO)
**Prioridad:** P0 - Máxima
**Impacto:** Trazabilidad del efectivo, control por turno

#### 1.1 Modelo de Datos (Prisma)

```prisma
model CajaDiaria {
  id                Int           @id @default(autoincrement())
  numero            String        @unique // AUTO: CAJA-{fecha}-{consecutivo}
  cajeroId          Int           @map("cajero_id")
  turno             TurnoCaja
  saldoInicial      Decimal       @map("saldo_inicial") @db.Decimal(12, 2)
  saldoFinalSistema Decimal?      @map("saldo_final_sistema") @db.Decimal(12, 2)
  saldoFinalContado Decimal?      @map("saldo_final_contado") @db.Decimal(12, 2)
  diferencia        Decimal?      @db.Decimal(12, 2)
  estado            EstadoCaja    @default(abierta)
  fechaApertura     DateTime      @default(now()) @map("fecha_apertura")
  fechaCierre       DateTime?     @map("fecha_cierre")
  observaciones     String?
  justificacionDif  String?       @map("justificacion_diferencia")
  autorizadorId     Int?          @map("autorizador_id") // Si diferencia > umbral
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  // Relaciones
  cajero         Usuario        @relation("CajaDiariaCajero", fields: [cajeroId], references: [id])
  autorizador    Usuario?       @relation("CajaDiariaAutorizador", fields: [autorizadorId], references: [id])
  movimientos    MovimientoCaja[]
  cuentasCerradas CuentaPaciente[] @relation("CuentasCerradasCaja")
  pagos          Pago[]         @relation("PagosCaja")

  @@index([cajeroId])
  @@index([estado])
  @@index([fechaApertura])
  @@map("cajas_diarias")
}

model MovimientoCaja {
  id           Int              @id @default(autoincrement())
  cajaId       Int              @map("caja_id")
  tipo         TipoMovimientoCaja
  monto        Decimal          @db.Decimal(12, 2)
  concepto     String
  referencia   String?          // Número de cuenta, factura, etc.
  metodoPago   MetodoPago?      @map("metodo_pago")
  cajeroId     Int              @map("cajero_id")
  fecha        DateTime         @default(now())
  observaciones String?

  // Relaciones
  caja    CajaDiaria @relation(fields: [cajaId], references: [id])
  cajero  Usuario    @relation("MovimientosCajaCajero", fields: [cajeroId], references: [id])

  @@index([cajaId])
  @@index([tipo])
  @@index([fecha])
  @@map("movimientos_caja")
}

enum EstadoCaja {
  abierta
  cerrada
  arqueo_pendiente
  cerrada_con_diferencia
}

enum TurnoCaja {
  matutino    // 06:00 - 14:00
  vespertino  // 14:00 - 22:00
  nocturno    // 22:00 - 06:00
}

enum TipoMovimientoCaja {
  ingreso_efectivo      // Cobro cuenta paciente
  ingreso_tarjeta       // Cobro con tarjeta
  ingreso_transferencia // Cobro por transferencia
  egreso_devolucion     // Devolución a paciente
  egreso_gasto_menor    // Gasto menor con autorización
  egreso_deposito       // Retiro para depósito bancario
  ajuste_positivo       // Ajuste a favor
  ajuste_negativo       // Ajuste en contra (faltante)
}
```

#### 1.2 Endpoints API

```
POST   /api/caja/abrir                    - Abrir caja del turno
GET    /api/caja/actual                   - Obtener caja actual del cajero
GET    /api/caja/resumen                  - Resumen de movimientos
POST   /api/caja/movimiento               - Registrar movimiento manual
PUT    /api/caja/:id/arqueo               - Registrar conteo de efectivo
PUT    /api/caja/:id/cerrar               - Cerrar caja con validación
GET    /api/caja/historial                - Historial de cajas (admin)
GET    /api/caja/:id/detalle              - Detalle completo de una caja
GET    /api/caja/reporte-diario           - Reporte consolidado del día
```

#### 1.3 Reglas de Negocio

1. **Apertura de Caja:**
   - Solo un cajero puede tener UNA caja abierta a la vez
   - Saldo inicial debe ser declarado (puede ser $0)
   - Genera número único: `CAJA-2025-11-29-001`

2. **Durante el Turno:**
   - Cada cobro de cuenta se registra automáticamente como movimiento
   - Cada pago parcial se registra automáticamente
   - Gastos menores requieren autorización (configurable por monto)

3. **Cierre de Caja:**
   - Cajero ingresa saldo contado manualmente
   - Sistema calcula saldo esperado (inicial + ingresos - egresos)
   - Si diferencia > umbral (ej. $50): requiere autorización admin
   - Si diferencia > 0: "sobrante" (ajuste positivo)
   - Si diferencia < 0: "faltante" (ajuste negativo)
   - Genera reporte imprimible de cierre

4. **Validaciones:**
   - No se puede abrir nueva caja sin cerrar la anterior
   - Cuentas de pacientes se vinculan a la caja activa del cajero
   - No se puede cerrar caja con cuentas abiertas (excepto CPC)

---

### FASE 2: Sistema de Devoluciones y Reembolsos
**Prioridad:** P0 - Máxima
**Impacto:** Corrección de errores, satisfacción del paciente

#### 2.1 Modelo de Datos

```prisma
model Devolucion {
  id                   Int              @id @default(autoincrement())
  numero               String           @unique // AUTO: DEV-{timestamp}
  cuentaId             Int?             @map("cuenta_id")
  transaccionId        Int?             @map("transaccion_id")
  ventaRapidaId        Int?             @map("venta_rapida_id")
  tipo                 TipoDevolucion
  estado               EstadoDevolucion @default(solicitada)
  montoDevolucion      Decimal          @map("monto_devolucion") @db.Decimal(10, 2)
  motivoId             Int              @map("motivo_id")
  motivoDetalle        String?          @map("motivo_detalle")
  cajeroSolicitaId     Int              @map("cajero_solicita_id")
  autorizadorId        Int?             @map("autorizador_id")
  fechaSolicitud       DateTime         @default(now()) @map("fecha_solicitud")
  fechaAutorizacion    DateTime?        @map("fecha_autorizacion")
  fechaProceso         DateTime?        @map("fecha_proceso")
  metodoPagoDevolucion MetodoPago?      @map("metodo_pago_devolucion")
  observaciones        String?
  createdAt            DateTime         @default(now()) @map("created_at")
  updatedAt            DateTime         @updatedAt @map("updated_at")

  // Relaciones
  cuenta             CuentaPaciente?    @relation(fields: [cuentaId], references: [id])
  transaccion        TransaccionCuenta? @relation(fields: [transaccionId], references: [id])
  ventaRapida        VentaRapida?       @relation(fields: [ventaRapidaId], references: [id])
  motivo             MotivoDevolucion   @relation(fields: [motivoId], references: [id])
  cajeroSolicita     Usuario            @relation("DevolucionSolicitada", fields: [cajeroSolicitaId], references: [id])
  autorizador        Usuario?           @relation("DevolucionAutorizada", fields: [autorizadorId], references: [id])
  productosDevueltos ProductoDevuelto[]

  @@index([estado])
  @@index([fechaSolicitud])
  @@index([cuentaId])
  @@map("devoluciones")
}

model ProductoDevuelto {
  id              Int         @id @default(autoincrement())
  devolucionId    Int         @map("devolucion_id")
  productoId      Int         @map("producto_id")
  cantidadOriginal Int        @map("cantidad_original")
  cantidadDevuelta Int        @map("cantidad_devuelta")
  precioUnitario  Decimal     @map("precio_unitario") @db.Decimal(8, 2)
  subtotal        Decimal     @db.Decimal(10, 2)
  estadoProducto  EstadoProductoDevuelto @default(bueno)
  regresaInventario Boolean   @default(true) @map("regresa_inventario")

  // Relaciones
  devolucion Devolucion @relation(fields: [devolucionId], references: [id])
  producto   Producto   @relation(fields: [productoId], references: [id])

  @@map("productos_devueltos")
}

model MotivoDevolucion {
  id                   Int            @id @default(autoincrement())
  codigo               String         @unique
  descripcion          String
  categoria            CategoriaMotivo
  requiereAutorizacion Boolean        @default(true) @map("requiere_autorizacion")
  activo               Boolean        @default(true)

  // Relaciones
  devoluciones Devolucion[]

  @@map("motivos_devolucion")
}

enum TipoDevolucion {
  producto_cuenta       // Producto de cuenta paciente
  servicio_cuenta       // Servicio de cuenta paciente
  producto_venta_rapida // Producto de venta rápida
  servicio_venta_rapida // Servicio de venta rápida
  total_cuenta          // Devolución total de cuenta
}

enum EstadoDevolucion {
  solicitada            // Cajero creó la solicitud
  pendiente_autorizacion// Esperando admin
  autorizada            // Admin aprobó
  rechazada             // Admin rechazó
  procesada             // Dinero devuelto, stock ajustado
  cancelada             // Cancelada por solicitante
}

enum EstadoProductoDevuelto {
  bueno                 // Regresa a inventario
  danado                // No regresa, se registra merma
  caducado              // No regresa, se registra merma
}

enum CategoriaMotivo {
  error_captura         // Error del cajero al capturar
  error_medico          // Médico ordenó producto incorrecto
  paciente_rechaza      // Paciente no quiere el producto
  producto_defectuoso   // Producto en mal estado
  duplicado             // Se cobró dos veces
  otro
}
```

#### 2.2 Endpoints API

```
POST   /api/devoluciones                       - Crear solicitud de devolución
GET    /api/devoluciones                       - Listar devoluciones (filtros)
GET    /api/devoluciones/:id                   - Detalle de devolución
PUT    /api/devoluciones/:id/autorizar         - Autorizar (admin)
PUT    /api/devoluciones/:id/rechazar          - Rechazar (admin)
PUT    /api/devoluciones/:id/procesar          - Procesar (devolver dinero/stock)
PUT    /api/devoluciones/:id/cancelar          - Cancelar solicitud
GET    /api/devoluciones/motivos               - Listar motivos de devolución
POST   /api/devoluciones/motivos               - Crear motivo (admin)
GET    /api/devoluciones/reporte               - Reporte de devoluciones
```

#### 2.3 Reglas de Negocio

1. **Creación de Devolución:**
   - Solo cuentas CERRADAS pueden tener devoluciones
   - Se puede devolver parcialmente (ej. 3 de 5 productos)
   - Productos con stock físico pueden regresar a inventario
   - Servicios NO regresan a inventario

2. **Autorización:**
   - Montos < $500: Cajero puede procesar directamente
   - Montos >= $500: Requiere autorización de admin
   - Motivo "error_medico": Siempre requiere autorización

3. **Procesamiento:**
   - Crea movimiento de inventario tipo "entrada" (si aplica)
   - Registra egreso en caja actual del cajero
   - Actualiza historial de la cuenta original
   - Genera registro de auditoría

4. **Tiempo Límite:**
   - Configurable (default: 24 horas desde cierre de cuenta)
   - Después del límite: solo admin puede autorizar

---

### FASE 3: Sistema de Depósitos Bancarios
**Prioridad:** P1 - Alta
**Impacto:** Trazabilidad del efectivo, conciliación bancaria

#### 3.1 Modelo de Datos

```prisma
model CuentaBancaria {
  id              Int               @id @default(autoincrement())
  banco           String
  numeroCuenta    String            @unique @map("numero_cuenta")
  clabe           String?           @unique
  alias           String
  tipo            TipoCuentaBancaria
  moneda          String            @default("MXN")
  activa          Boolean           @default(true)
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  // Relaciones
  depositos DepositoBancario[]

  @@map("cuentas_bancarias")
}

model DepositoBancario {
  id               Int              @id @default(autoincrement())
  numero           String           @unique // AUTO: DEP-{fecha}-{consecutivo}
  cuentaBancariaId Int              @map("cuenta_bancaria_id")
  cajaId           Int              @map("caja_id")
  cajeroId         Int              @map("cajero_id")
  montoEfectivo    Decimal          @map("monto_efectivo") @db.Decimal(12, 2)
  montoCheques     Decimal          @default(0) @map("monto_cheques") @db.Decimal(12, 2)
  montoTotal       Decimal          @map("monto_total") @db.Decimal(12, 2)
  estado           EstadoDeposito   @default(preparado)
  referenciaBanco  String?          @map("referencia_banco")
  comprobante      String?          // URL o path del comprobante escaneado
  fechaPreparacion DateTime         @default(now()) @map("fecha_preparacion")
  fechaDeposito    DateTime?        @map("fecha_deposito")
  fechaConfirmacion DateTime?       @map("fecha_confirmacion")
  confirmadoPorId  Int?             @map("confirmado_por_id")
  observaciones    String?
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  // Relaciones
  cuentaBancaria CuentaBancaria @relation(fields: [cuentaBancariaId], references: [id])
  caja           CajaDiaria     @relation(fields: [cajaId], references: [id])
  cajero         Usuario        @relation("DepositoPreparado", fields: [cajeroId], references: [id])
  confirmadoPor  Usuario?       @relation("DepositoConfirmado", fields: [confirmadoPorId], references: [id])

  @@index([estado])
  @@index([fechaDeposito])
  @@index([cuentaBancariaId])
  @@map("depositos_bancarios")
}

enum TipoCuentaBancaria {
  corriente
  ahorro
  inversion
}

enum EstadoDeposito {
  preparado          // Efectivo contado y separado
  en_transito        // En camino al banco
  depositado         // Depositado, esperando confirmación
  confirmado         // Banco confirmó el monto
  rechazado          // Banco rechazó (cheque sin fondos, etc.)
  con_diferencia     // Monto confirmado != monto declarado
}
```

#### 3.2 Endpoints API

```
GET    /api/bancos/cuentas                     - Listar cuentas bancarias
POST   /api/bancos/cuentas                     - Crear cuenta bancaria
PUT    /api/bancos/cuentas/:id                 - Actualizar cuenta
DELETE /api/bancos/cuentas/:id                 - Desactivar cuenta

POST   /api/bancos/depositos                   - Preparar depósito
GET    /api/bancos/depositos                   - Listar depósitos
GET    /api/bancos/depositos/:id               - Detalle de depósito
PUT    /api/bancos/depositos/:id/transito      - Marcar en tránsito
PUT    /api/bancos/depositos/:id/depositado    - Marcar como depositado
PUT    /api/bancos/depositos/:id/confirmar     - Confirmar recepción banco
PUT    /api/bancos/depositos/:id/rechazar      - Marcar como rechazado
GET    /api/bancos/depositos/pendientes        - Depósitos sin confirmar
GET    /api/bancos/conciliacion                - Reporte de conciliación
```

#### 3.3 Flujo de Depósito

1. **Preparación (Cajero):**
   - Al cerrar caja, sistema sugiere monto a depositar
   - Cajero prepara efectivo y cheques
   - Crea registro de depósito preparado
   - Genera movimiento de egreso en caja

2. **Tránsito:**
   - Se marca cuando el dinero sale del hospital
   - Registra quién transporta y hacia qué sucursal

3. **Depósito:**
   - Se marca cuando se realizó el depósito físico
   - Se captura referencia del banco (ficha)

4. **Confirmación:**
   - Admin verifica en estado de cuenta bancario
   - Si coincide: confirmar
   - Si hay diferencia: registrar y justificar

---

### FASE 4: Sistema de Descuentos Autorizados
**Prioridad:** P1 - Alta
**Impacto:** Control de márgenes, prevención de fraude

#### 4.1 Modelo de Datos

```prisma
model PoliticaDescuento {
  id                   Int               @id @default(autoincrement())
  nombre               String
  tipo                 TipoDescuento
  porcentajeMaximo     Decimal           @map("porcentaje_maximo") @db.Decimal(5, 2)
  montoMaximo          Decimal?          @map("monto_maximo") @db.Decimal(10, 2)
  rolesPermitidos      Rol[]             @map("roles_permitidos")
  requiereAutorizacion Boolean           @default(true) @map("requiere_autorizacion")
  rolesAutorizadores   Rol[]             @map("roles_autorizadores")
  activo               Boolean           @default(true)
  createdAt            DateTime          @default(now()) @map("created_at")
  updatedAt            DateTime          @updatedAt @map("updated_at")

  // Relaciones
  descuentos DescuentoAplicado[]

  @@map("politicas_descuento")
}

model DescuentoAplicado {
  id               Int               @id @default(autoincrement())
  cuentaId         Int               @map("cuenta_id")
  transaccionId    Int?              @map("transaccion_id")
  politicaId       Int               @map("politica_id")
  tipoCalculo      TipoCalculoDescuento @map("tipo_calculo")
  porcentaje       Decimal?          @db.Decimal(5, 2)
  montoDescuento   Decimal           @map("monto_descuento") @db.Decimal(10, 2)
  montoOriginal    Decimal           @map("monto_original") @db.Decimal(10, 2)
  montoFinal       Decimal           @map("monto_final") @db.Decimal(10, 2)
  motivo           String
  aplicadoPorId    Int               @map("aplicado_por_id")
  autorizadoPorId  Int?              @map("autorizado_por_id")
  estado           EstadoDescuento   @default(pendiente)
  fechaAplicacion  DateTime          @default(now()) @map("fecha_aplicacion")
  fechaAutorizacion DateTime?        @map("fecha_autorizacion")
  createdAt        DateTime          @default(now()) @map("created_at")

  // Relaciones
  cuenta         CuentaPaciente    @relation(fields: [cuentaId], references: [id])
  transaccion    TransaccionCuenta? @relation(fields: [transaccionId], references: [id])
  politica       PoliticaDescuento @relation(fields: [politicaId], references: [id])
  aplicadoPor    Usuario           @relation("DescuentoAplicado", fields: [aplicadoPorId], references: [id])
  autorizadoPor  Usuario?          @relation("DescuentoAutorizado", fields: [autorizadoPorId], references: [id])

  @@index([cuentaId])
  @@index([estado])
  @@index([fechaAplicacion])
  @@map("descuentos_aplicados")
}

enum TipoDescuento {
  cortesia_medica       // Descuento por médico tratante
  empleado_hospital     // Descuento a empleados
  convenio_empresa      // Convenio corporativo
  promocion_temporal    // Promoción vigente
  ajuste_precio         // Ajuste de precio por error
  redondeo              // Redondeo a favor del paciente
  otro
}

enum TipoCalculoDescuento {
  porcentaje           // % sobre el monto
  monto_fijo           // Cantidad fija
}

enum EstadoDescuento {
  pendiente            // Esperando autorización
  autorizado           // Admin aprobó
  rechazado            // Admin rechazó
  aplicado             // Descuento efectivo
  revertido            // Se revirtió el descuento
}
```

#### 4.2 Endpoints API

```
GET    /api/descuentos/politicas              - Listar políticas
POST   /api/descuentos/politicas              - Crear política (admin)
PUT    /api/descuentos/politicas/:id          - Actualizar política
DELETE /api/descuentos/politicas/:id          - Desactivar política

POST   /api/descuentos/aplicar                - Solicitar descuento
GET    /api/descuentos/pendientes             - Descuentos pendientes
PUT    /api/descuentos/:id/autorizar          - Autorizar (admin)
PUT    /api/descuentos/:id/rechazar           - Rechazar (admin)
PUT    /api/descuentos/:id/revertir           - Revertir descuento
GET    /api/descuentos/reporte                - Reporte de descuentos
GET    /api/descuentos/por-empleado/:id       - Descuentos por empleado
```

#### 4.3 Políticas Sugeridas (Seed)

| Política | % Máximo | Requiere Auth | Roles Permitidos |
|----------|----------|---------------|------------------|
| Cortesía Médica | 20% | Sí | medico_especialista |
| Empleado | 15% | Sí | administrador |
| Promoción | 30% | No si <= 10% | cajero |
| Redondeo | 0.5% | No | cajero |
| Ajuste Precio | 100% | Siempre | administrador |

---

### FASE 5: Mejoras en Reportes Financieros
**Prioridad:** P2 - Media
**Impacto:** Visibilidad gerencial, toma de decisiones

#### 5.1 Nuevos Reportes

```
GET /api/reports/caja/consolidado-diario      - Reporte de todas las cajas del día
GET /api/reports/caja/por-cajero              - Rendimiento por cajero
GET /api/reports/ingresos/por-tipo-atencion   - Ingresos por consulta/urgencia/hosp
GET /api/reports/ingresos/por-servicio        - Top servicios por facturación
GET /api/reports/ingresos/por-producto        - Top productos por facturación
GET /api/reports/margen/por-producto          - Margen de utilidad por producto
GET /api/reports/margen/por-servicio          - Margen estimado por servicio
GET /api/reports/devoluciones/tendencias      - Tendencias de devoluciones
GET /api/reports/descuentos/impacto           - Impacto de descuentos en ingresos
GET /api/reports/cuentas-por-cobrar/aging     - Aging report detallado
GET /api/reports/flujo-efectivo               - Estado de flujo de efectivo
GET /api/reports/presupuesto-vs-real          - Comparativa presupuesto vs real
```

#### 5.2 Dashboard Financiero Ejecutivo

Nuevo endpoint consolidado para dashboard de administrador/socio:

```typescript
GET /api/dashboard/financial

Response:
{
  periodo: { inicio, fin },
  resumen: {
    ingresosTotales: number,
    costosTotales: number,
    utilidadBruta: number,
    utilidadNeta: number,
    margenBruto: percentage,
    margenNeto: percentage
  },
  cajas: {
    abiertas: number,
    cerradasHoy: number,
    efectivoEnCajas: number,
    depositosPendientes: number
  },
  cuentasPorCobrar: {
    total: number,
    corriente: number,
    vencido30: number,
    vencido60: number,
    vencido90: number,
    recuperacionMes: percentage
  },
  alertas: [
    { tipo: 'diferencia_caja', mensaje: '...', severidad: 'alta' },
    { tipo: 'deposito_pendiente', mensaje: '...', severidad: 'media' }
  ],
  tendencias: {
    ingresosMensual: [{ mes, monto }],
    utilidadMensual: [{ mes, monto }],
    ocupacionMensual: [{ mes, porcentaje }]
  }
}
```

---

### FASE 6: Recibos y Comprobantes Formales
**Prioridad:** P2 - Media
**Impacto:** Cumplimiento fiscal, profesionalismo

#### 6.1 Modelo de Datos

```prisma
model Recibo {
  id                Int           @id @default(autoincrement())
  folio             String        @unique // AUTO: REC-{año}-{consecutivo}
  serie             String        @default("A")
  tipo              TipoRecibo
  cuentaId          Int?          @map("cuenta_id")
  pagoId            Int?          @map("pago_id")
  ventaRapidaId     Int?          @map("venta_rapida_id")
  pacienteId        Int           @map("paciente_id")
  cajeroId          Int           @map("cajero_id")
  montoRecibido     Decimal       @map("monto_recibido") @db.Decimal(12, 2)
  cambio            Decimal       @default(0) @db.Decimal(12, 2)
  metodoPago        MetodoPago    @map("metodo_pago")
  conceptos         Json          // Array de conceptos cobrados
  subtotal          Decimal       @db.Decimal(12, 2)
  iva               Decimal       @default(0) @db.Decimal(12, 2)
  total             Decimal       @db.Decimal(12, 2)
  fechaEmision      DateTime      @default(now()) @map("fecha_emision")
  fechaCancelacion  DateTime?     @map("fecha_cancelacion")
  canceladoPorId    Int?          @map("cancelado_por_id")
  motivoCancelacion String?       @map("motivo_cancelacion")
  estado            EstadoRecibo  @default(emitido)
  createdAt         DateTime      @default(now()) @map("created_at")

  // Relaciones
  cuenta        CuentaPaciente? @relation(fields: [cuentaId], references: [id])
  pago          Pago?           @relation(fields: [pagoId], references: [id])
  ventaRapida   VentaRapida?    @relation(fields: [ventaRapidaId], references: [id])
  paciente      Paciente        @relation(fields: [pacienteId], references: [id])
  cajero        Usuario         @relation("ReciboEmitido", fields: [cajeroId], references: [id])
  canceladoPor  Usuario?        @relation("ReciboCancelado", fields: [canceladoPorId], references: [id])

  @@index([folio])
  @@index([pacienteId])
  @@index([fechaEmision])
  @@index([estado])
  @@map("recibos")
}

enum TipoRecibo {
  cobro_cuenta        // Cobro de cuenta paciente
  pago_parcial        // Abono a cuenta
  venta_rapida        // Venta mostrador
  anticipo            // Anticipo recibido
  devolucion          // Comprobante de devolución
}

enum EstadoRecibo {
  emitido
  cancelado
  reimpreso
}
```

#### 6.2 Endpoints API

```
POST   /api/recibos                           - Generar recibo
GET    /api/recibos/:id                       - Obtener recibo
GET    /api/recibos/:id/pdf                   - Descargar PDF
PUT    /api/recibos/:id/reimprimir            - Reimprimir (registra en auditoría)
PUT    /api/recibos/:id/cancelar              - Cancelar recibo
GET    /api/recibos/por-paciente/:id          - Recibos de un paciente
GET    /api/recibos/por-folio/:folio          - Buscar por folio
GET    /api/recibos/consecutivo-actual        - Obtener siguiente folio
```

#### 6.3 Formato del Recibo

- **Encabezado:** Logo hospital, RFC, dirección
- **Datos:** Folio, fecha, cajero
- **Paciente:** Nombre, expediente
- **Conceptos:** Tabla de servicios/productos
- **Totales:** Subtotal, IVA, Total, Recibido, Cambio
- **Pie:** "Este recibo NO es comprobante fiscal"

---

## RESUMEN DE ENTREGABLES

### Nuevos Modelos Prisma (8)

1. `CajaDiaria` - Gestión de turnos de caja
2. `MovimientoCaja` - Movimientos de efectivo
3. `Devolucion` - Solicitudes de devolución
4. `ProductoDevuelto` - Detalle de productos devueltos
5. `MotivoDevolucion` - Catálogo de motivos
6. `CuentaBancaria` - Cuentas bancarias del hospital
7. `DepositoBancario` - Registros de depósitos
8. `PoliticaDescuento` - Políticas de descuento
9. `DescuentoAplicado` - Descuentos aplicados
10. `Recibo` - Comprobantes formales

### Nuevos Endpoints (~50)

| Módulo | Endpoints |
|--------|-----------|
| Caja Diaria | 9 |
| Devoluciones | 10 |
| Depósitos Bancarios | 11 |
| Descuentos | 9 |
| Reportes Nuevos | 12 |
| Recibos | 7 |

### Impacto en Sistema Existente

1. **CuentaPaciente:** Agregar relación con `CajaDiaria`
2. **Pago:** Agregar relación con `CajaDiaria` y `Recibo`
3. **VentaRapida:** Agregar relación con `Recibo`
4. **TransaccionCuenta:** Agregar relación con `DescuentoAplicado`
5. **Usuario:** Agregar relaciones para los nuevos módulos

---

## CRONOGRAMA SUGERIDO

| Fase | Descripción | Complejidad | Días Est. |
|------|-------------|-------------|-----------|
| **1** | Sistema de Caja Diaria | Alta | 5-7 |
| **2** | Sistema de Devoluciones | Alta | 5-7 |
| **3** | Depósitos Bancarios | Media | 3-4 |
| **4** | Descuentos Autorizados | Media | 3-4 |
| **5** | Reportes Financieros | Baja | 2-3 |
| **6** | Recibos Formales | Baja | 2-3 |
| | **TOTAL** | | **20-28 días** |

---

## PRIORIZACIÓN RECOMENDADA

### Implementar Inmediatamente (Sprint 1)
1. ✅ **Caja Diaria** - Control de efectivo
2. ✅ **Devoluciones** - Corrección de errores

### Implementar Próximo Sprint (Sprint 2)
3. ✅ **Depósitos Bancarios** - Trazabilidad
4. ✅ **Descuentos** - Control de márgenes

### Nice to Have (Sprint 3)
5. ⏳ **Reportes Avanzados** - Visibilidad gerencial
6. ⏳ **Recibos Formales** - Profesionalismo

---

## CONCLUSIÓN

El sistema actual tiene una base sólida para operaciones hospitalarias, pero **carece de controles financieros fundamentales** que cualquier operación de caja necesita:

1. **Sin caja diaria:** Imposible saber cuánto efectivo hay vs cuánto debería haber
2. **Sin devoluciones:** Errores son irrecuperables
3. **Sin depósitos:** Efectivo desaparece sin trazabilidad
4. **Sin descuentos controlados:** Riesgo de fraude

Implementar las Fases 1-4 elevaría el sistema de **72/100 a ~92/100** en el módulo financiero, haciéndolo comparable con sistemas hospitalarios profesionales.

---

**Documento preparado por:** Claude
**Para:** Alfredo Manuel Reyes - AGNT
**Fecha:** 29 de noviembre de 2025
