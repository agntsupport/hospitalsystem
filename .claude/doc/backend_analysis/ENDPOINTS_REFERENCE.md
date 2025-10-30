# Backend API - Endpoints Reference

**Sistema:** Sistema de Gestión Hospitalaria
**Total Endpoints:** 115
**Base URL:** `http://localhost:3001/api`

---

## Autenticación (4 endpoints)

### POST /api/auth/login
**Descripción:** Iniciar sesión con JWT + bcrypt
**Auth:** No
**Rate Limit:** 5 requests/15min (anti brute force)
**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": { "id": 1, "username": "admin", "rol": "administrador" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/logout
**Descripción:** Cerrar sesión (cliente-side, no invalida token)
**Auth:** Required (JWT)
**Response:** `{ "success": true, "message": "Logout exitoso" }`

### GET /api/auth/verify-token
**Descripción:** Verificar validez de token JWT
**Auth:** Token en header Authorization
**Response:**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "valid": true,
    "user": { "id": 1, "username": "admin", "rol": "administrador" }
  }
}
```

### GET /api/auth/profile
**Descripción:** Obtener perfil del usuario autenticado
**Auth:** Required (JWT)
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@hospital.com",
      "rol": "administrador",
      "activo": true,
      "fechaRegistro": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Pacientes (6 endpoints)

### GET /api/patients
**Descripción:** Lista de pacientes con filtros avanzados
**Auth:** No (público)
**Query Params:**
```
?page=1
&limit=50
&search=juan
&genero=M
&rangoEdadMin=18
&rangoEdadMax=65
&ciudad=Guadalajara
&estado=Jalisco
&soloMenores=false
&conContactoEmergencia=true
&conSeguroMedico=true
&conAlergias=false
&estadoCivil=casado
&ocupacion=ingeniero
&sortBy=nombre
&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "numeroExpediente": "EXP-2024-00001",
        "nombre": "Juan",
        "apellidoPaterno": "Pérez",
        "apellidoMaterno": "García",
        "nombreCompleto": "Juan Pérez García",
        "edad": 35,
        "genero": "M",
        "telefono": "33-1234-5678",
        "email": "juan.perez@email.com"
      }
    ]
  },
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### GET /api/patients/stats
**Descripción:** Estadísticas de pacientes
**Auth:** No
**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "activos": 142,
    "menoresEdad": 23,
    "conSeguro": 98,
    "porGenero": { "M": 75, "F": 73, "Otro": 2 },
    "porEstadoCivil": { "soltero": 45, "casado": 78, "divorciado": 15 }
  }
}
```

### POST /api/patients
**Descripción:** Crear nuevo paciente
**Auth:** Required (JWT)
**Auditoría:** Sí
**Body:**
```json
{
  "nombre": "Juan",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "García",
  "fechaNacimiento": "1989-05-15",
  "genero": "M",
  "telefono": "33-1234-5678",
  "email": "juan.perez@email.com",
  "direccion": "Calle Falsa 123",
  "ciudad": "Guadalajara",
  "estado": "Jalisco",
  "codigoPostal": "44100",
  "tipoSangre": "O+",
  "alergias": "Penicilina",
  "contactoEmergenciaNombre": "María Pérez",
  "contactoEmergenciaRelacion": "Esposa",
  "contactoEmergenciaTelefono": "33-8765-4321"
}
```

### GET /api/patients/:id
**Descripción:** Detalle completo de paciente
**Auth:** No
**Response:** Objeto paciente con todas las relaciones

### PUT /api/patients/:id
**Descripción:** Actualizar paciente
**Auth:** Required (JWT)
**Auditoría:** Sí (captura datos anteriores)
**Body:** Campos a actualizar (parcial permitido)

### DELETE /api/patients/:id
**Descripción:** Soft delete de paciente
**Auth:** Required (JWT)
**Auditoría:** Crítica (requiere motivo)
**Body:**
```json
{
  "motivo": "Paciente duplicado",
  "causaCancelacionId": 1
}
```

---

## Inventario (15 endpoints)

### Proveedores

#### GET /api/inventory/suppliers
**Descripción:** Lista de proveedores
**Query Params:** `?page=1&limit=50&search=farmacia&activo=true`

#### POST /api/inventory/suppliers
**Descripción:** Crear proveedor
**Auth:** Required
**Auditoría:** Sí
**Body:**
```json
{
  "nombreEmpresa": "Farmacia ABC S.A. de C.V.",
  "nombreComercial": "Farmacia ABC",
  "rfc": "FABC850101XXX",
  "contactoNombre": "Carlos López",
  "contactoTelefono": "33-1111-2222",
  "contactoEmail": "contacto@farmaciaabc.com",
  "direccion": "Av. Principal 456",
  "condicionesPago": "30 días"
}
```

#### PUT /api/inventory/suppliers/:id
**Descripción:** Actualizar proveedor
**Auth:** Required
**Auditoría:** Sí (captura datos anteriores)

#### DELETE /api/inventory/suppliers/:id
**Descripción:** Eliminar proveedor
**Auth:** Required
**Auditoría:** Crítica

### Productos

#### GET /api/inventory/products
**Descripción:** Lista de productos
**Query Params:**
```
?page=1
&limit=50
&search=paracetamol
&categoria=medicamento
&activo=true
&lowStock=true
&proveedorId=5
&sortBy=nombre
&sortOrder=asc
```

#### POST /api/inventory/products
**Descripción:** Crear producto
**Auth:** Required
**Auditoría:** Sí
**Body:**
```json
{
  "codigo": "MED-001",
  "codigoBarras": "7501234567890",
  "nombre": "Paracetamol 500mg",
  "descripcion": "Tabletas de 500mg",
  "categoria": "medicamento",
  "unidadMedida": "caja",
  "contenidoPorUnidad": "20 tabletas",
  "precioCompra": 25.00,
  "precioVenta": 45.00,
  "stockMinimo": 50,
  "stockMaximo": 500,
  "stockActual": 200,
  "ubicacion": "A-15",
  "requiereReceta": true,
  "proveedorId": 5
}
```

#### PUT /api/inventory/products/:id
**Descripción:** Actualizar producto
**Auth:** Required
**Auditoría:** Sí

#### DELETE /api/inventory/products/:id
**Descripción:** Eliminar producto
**Auth:** Required
**Auditoría:** Crítica

#### GET /api/inventory/products/low-stock
**Descripción:** Productos con stock bajo
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 15,
        "nombre": "Paracetamol 500mg",
        "stockActual": 25,
        "stockMinimo": 50,
        "diferencia": -25,
        "estado": "bajo"
      }
    ]
  }
}
```

#### GET /api/inventory/products/stats
**Descripción:** Estadísticas de inventario
**Response:**
```json
{
  "success": true,
  "data": {
    "totalProductos": 450,
    "valorTotal": 2450000,
    "productosActivos": 420,
    "stockBajo": 23,
    "stockCritico": 5,
    "porCategoria": {
      "medicamento": 250,
      "material_medico": 150,
      "insumo": 50
    }
  }
}
```

### Movimientos

#### GET /api/inventory/movements
**Descripción:** Historial de movimientos
**Query Params:**
```
?page=1
&limit=50
&productoId=15
&tipo=salida
&fechaInicio=2024-01-01
&fechaFin=2024-12-31
&usuarioId=5
```

#### POST /api/inventory/movements
**Descripción:** Registrar movimiento
**Auth:** Required
**Auditoría:** Sí
**Body:**
```json
{
  "productoId": 15,
  "tipo": "salida",
  "cantidad": 10,
  "motivo": "Venta directa",
  "observaciones": "Cliente walk-in"
}
```
**Tipos:** `entrada`, `salida`, `ajuste`, `aplicacion_paciente`

#### GET /api/inventory/movements/stats
**Descripción:** Estadísticas de movimientos

### Alertas

#### GET /api/inventory/alerts
**Descripción:** Alertas de inventario activas
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "productoId": 15,
        "tipoAlerta": "stock_bajo",
        "criticidad": "alta",
        "mensaje": "Stock por debajo del mínimo: 25/50",
        "activa": true,
        "createdAt": "2024-10-30T10:00:00.000Z"
      }
    ]
  }
}
```

#### PUT /api/inventory/alerts/:id/resolve
**Descripción:** Resolver alerta
**Auth:** Required
**Body:**
```json
{
  "observaciones": "Stock repuesto con compra #1234"
}
```

---

## Hospitalización (10 endpoints)

### GET /api/hospitalization/admissions
**Descripción:** Lista de ingresos hospitalarios
**Query Params:**
```
?page=1
&limit=50
&estado=en_observacion
&habitacionId=5
&medicoId=3
&fechaInicio=2024-10-01
&fechaFin=2024-10-31
```

### POST /api/hospitalization/admissions
**Descripción:** Crear ingreso hospitalario (anticipo automático $10,000)
**Auth:** Required
**Auditoría:** Crítica
**Roles:** administrador, cajero, medico_residente, medico_especialista
**Body:**
```json
{
  "pacienteId": 15,
  "habitacionId": 5,
  "medicoEspecialistaId": 3,
  "motivoHospitalizacion": "Apendicitis aguda",
  "diagnosticoIngreso": "Dolor abdominal agudo en FID",
  "indicacionesGenerales": "Ayuno, antibióticos IV cada 8h"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Ingreso hospitalario creado. Anticipo de $10,000.00 aplicado automáticamente.",
  "data": {
    "admission": { ... },
    "account": {
      "id": 45,
      "anticipo": 10000,
      "estado": "abierta"
    }
  }
}
```

### GET /api/hospitalization/admissions/:id
**Descripción:** Detalle completo de ingreso
**Include:** cuenta, paciente, habitación, médico, órdenes, notas

### PUT /api/hospitalization/admissions/:id/discharge
**Descripción:** Alta médica (requiere nota de alta previa)
**Auth:** Required
**Auditoría:** Crítica
**Roles:** medico_especialista, enfermero
**Body:**
```json
{
  "diagnosticoAlta": "Postoperatorio apendicectomía sin complicaciones",
  "montoRecibido": 15000,
  "metodoPago": "tarjeta"
}
```
**Validaciones:**
- ✅ Requiere nota de alta SOAP previa
- ✅ Calcula automáticamente días de estancia
- ✅ Carga servicio de habitación (precio/día * días)
- ✅ Cierra cuenta y genera factura
- ✅ Libera habitación

### POST /api/hospitalization/admissions/:id/notes
**Descripción:** Agregar nota SOAP (evolución médica/enfermería)
**Auth:** Required
**Roles:** medico_residente, medico_especialista, enfermero
**Body:**
```json
{
  "tipoNota": "evolucion_medica",
  "turno": "matutino",
  "temperatura": 36.5,
  "presionSistolica": 120,
  "presionDiastolica": 80,
  "frecuenciaCardiaca": 75,
  "frecuenciaRespiratoria": 18,
  "saturacionOxigeno": 98,
  "estadoGeneral": "Paciente estable, sin dolor",
  "sintomas": "Mejoría clínica",
  "examenFisico": "Abdomen blando, sin dolor a la palpación",
  "planTratamiento": "Continuar antibióticos 48h más, iniciar dieta líquida",
  "observaciones": "Alta probable en 24h"
}
```
**Tipos de Nota:**
- `evolucion_medica` - Evolución diaria por médico
- `nota_enfermeria` - Nota de enfermería por turno
- `interconsulta` - Interconsulta a especialista
- `procedimiento` - Nota de procedimiento
- `evolucion` - Evolución general
- `alta` - Nota de alta médica (requerida para dar alta)

### GET /api/hospitalization/admissions/:id/notes
**Descripción:** Listar notas de hospitalización
**Query Params:** `?tipoNota=evolucion_medica&turno=matutino`

### POST /api/hospitalization/orders
**Descripción:** Crear orden médica
**Auth:** Required
**Roles:** medico_residente, medico_especialista
**Body:**
```json
{
  "hospitalizacionId": 25,
  "tipoOrden": "medicamento",
  "descripcion": "Omeprazol 40mg IV cada 24h",
  "frecuencia": "cada 24 horas",
  "duracion": "5 días",
  "prioridad": "rutina",
  "observaciones": "Aplicar en ayunas"
}
```
**Tipos de Orden:**
- `medicamento` - Prescripción de medicamentos
- `procedimiento` - Procedimientos médicos
- `dieta` - Indicaciones dietéticas
- `cuidados` - Cuidados de enfermería
- `laboratorio` - Estudios de laboratorio
- `interconsulta` - Interconsulta a especialista

### GET /api/hospitalization/orders
**Descripción:** Listar órdenes médicas
**Query Params:**
```
?hospitalizacionId=25
&estado=activa
&prioridad=urgente
&tipoOrden=medicamento
```

### PUT /api/hospitalization/orders/:id/status
**Descripción:** Actualizar estado de orden
**Auth:** Required
**Body:**
```json
{
  "estado": "completada",
  "motivoCambio": "Orden aplicada sin complicaciones",
  "observaciones": "Paciente toleró bien el medicamento"
}
```
**Estados:** `activa`, `completada`, `suspendida`, `cancelada`

### GET /api/hospitalization/stats
**Descripción:** Estadísticas de hospitalización
**Response:**
```json
{
  "success": true,
  "data": {
    "ingresosActivos": 15,
    "habitacionesOcupadas": 12,
    "habitacionesDisponibles": 8,
    "promedioEstancia": 3.5,
    "altasMes": 45,
    "porEstado": {
      "en_observacion": 5,
      "estable": 8,
      "critico": 2
    }
  }
}
```

---

## Quirófanos y Cirugías (14 endpoints)

### Quirófanos

#### GET /api/quirofanos
**Descripción:** Lista de quirófanos
**Query Params:**
```
?page=1
&limit=50
&estado=disponible
&tipo=cirugia_general
&especialidad=ortopedia
```

#### POST /api/quirofanos
**Descripción:** Crear quirófano (servicio automático creado)
**Auth:** Required
**Roles:** administrador
**Body:**
```json
{
  "numero": "Q-01",
  "tipo": "cirugia_general",
  "especialidad": "Cirugía General",
  "equipamiento": "Laparoscopio, Monitor, Mesa quirúrgica",
  "capacidadEquipo": 6,
  "precioHora": 5000,
  "descripcion": "Quirófano equipado para cirugía general"
}
```
**Acción Automática:** Crea servicio `QUI-Q-01` con precio $5000/hora

#### GET /api/quirofanos/:id
**Descripción:** Detalle de quirófano
**Include:** cirugías programadas, historial

#### PUT /api/quirofanos/:id
**Descripción:** Actualizar quirófano
**Auth:** Required
**Auditoría:** Sí

#### PUT /api/quirofanos/:id/estado
**Descripción:** Cambiar estado de quirófano
**Auth:** Required
**Body:**
```json
{
  "estado": "mantenimiento",
  "observaciones": "Mantenimiento preventivo programado"
}
```
**Estados:** `disponible`, `ocupado`, `mantenimiento`, `limpieza`, `preparacion`, `fuera_de_servicio`

#### DELETE /api/quirofanos/:id
**Descripción:** Soft delete de quirófano
**Auth:** Required
**Auditoría:** Crítica
**Validación:** No debe tener cirugías activas/programadas

#### GET /api/quirofanos/stats
**Descripción:** Estadísticas de quirófanos

#### GET /api/quirofanos/available-numbers
**Descripción:** Sugerir número disponible para quirófano
**Response:**
```json
{
  "success": true,
  "data": {
    "suggested": "Q-05",
    "existingNumbers": ["Q-01", "Q-02", "Q-03", "Q-04"]
  }
}
```

### Cirugías

#### POST /api/quirofanos/cirugias
**Descripción:** Programar cirugía (cargo automático de quirófano)
**Auth:** Required
**Roles:** medico_especialista, administrador
**Body:**
```json
{
  "quirofanoId": 3,
  "pacienteId": 25,
  "medicoId": 5,
  "tipoIntervencion": "Apendicectomía laparoscópica",
  "fechaInicio": "2024-11-05T08:00:00.000Z",
  "fechaFin": "2024-11-05T10:00:00.000Z",
  "equipoMedico": {
    "cirujano": 5,
    "anestesiologo": 7,
    "instrumentista": 12,
    "circulante": 15
  },
  "observaciones": "Paciente en ayuno desde 22h del día anterior"
}
```
**Validaciones:**
- ✅ Quirófano disponible en horario
- ✅ Médico no tiene otra cirugía en ese horario
- ✅ Duración mínima 1 hora
- ✅ Carga automática de servicio quirófano a cuenta del paciente

#### GET /api/quirofanos/cirugias
**Descripción:** Lista de cirugías programadas
**Query Params:**
```
?page=1
&limit=50
&estado=programada
&quirofanoId=3
&medicoId=5
&fechaInicio=2024-11-01
&fechaFin=2024-11-30
```

#### GET /api/quirofanos/cirugias/:id
**Descripción:** Detalle de cirugía
**Include:** quirófano, paciente, médico, equipo médico

#### PUT /api/quirofanos/cirugias/:id/estado
**Descripción:** Actualizar estado de cirugía
**Auth:** Required
**Body:**
```json
{
  "estado": "en_progreso",
  "observaciones": "Paciente anestesiado, iniciando incisión"
}
```
**Estados:** `programada`, `en_progreso`, `completada`, `cancelada`, `reprogramada`

#### PUT /api/quirofanos/cirugias/:id/equipo
**Descripción:** Actualizar equipo médico de cirugía
**Auth:** Required
**Body:**
```json
{
  "equipoMedico": {
    "cirujano": 5,
    "anestesiologo": 7,
    "instrumentista": 12,
    "circulante": 15,
    "ayudante": 20
  }
}
```

#### DELETE /api/quirofanos/cirugias/:id
**Descripción:** Cancelar cirugía
**Auth:** Required
**Auditoría:** Crítica
**Body:**
```json
{
  "motivo": "Paciente presentó fiebre pre-quirúrgica",
  "causaCancelacionId": 8
}
```

---

## Facturación (6 endpoints)

### GET /api/billing/invoices
**Descripción:** Lista de facturas
**Query Params:**
```
?page=1
&limit=50
&estado=pending
&pacienteId=15
&fechaInicio=2024-10-01
&fechaFin=2024-10-31
```

### POST /api/billing/invoices
**Descripción:** Crear factura manual
**Auth:** Required
**Auditoría:** Sí
**Body:**
```json
{
  "pacienteId": 15,
  "cuentaId": 45,
  "fechaVencimiento": "2024-12-01",
  "detalles": [
    {
      "tipo": "servicio",
      "servicioId": 5,
      "descripcion": "Consulta especializada",
      "cantidad": 1,
      "precioUnitario": 800
    },
    {
      "tipo": "producto",
      "productoId": 25,
      "descripcion": "Paracetamol 500mg",
      "cantidad": 2,
      "precioUnitario": 45
    }
  ],
  "descuentos": 50,
  "observaciones": "Descuento por convenio empresa"
}
```

### GET /api/billing/invoices/:id
**Descripción:** Detalle de factura
**Include:** paciente, cuenta, detalles, pagos

### POST /api/billing/invoices/:id/pay
**Descripción:** Registrar pago de factura
**Auth:** Required
**Body:**
```json
{
  "monto": 5000,
  "metodoPago": "card",
  "referencia": "AUTH-123456",
  "autorizacion": "987654",
  "observaciones": "Pago parcial, resta $3,450"
}
```
**Métodos de Pago:** `cash`, `card`, `transfer`, `check`, `insurance`

### GET /api/billing/stats
**Descripción:** Estadísticas de facturación
**Response:**
```json
{
  "success": true,
  "data": {
    "totalFacturado": 450000,
    "totalCobrado": 380000,
    "totalPendiente": 70000,
    "facturasMes": 125,
    "promedioFactura": 3600,
    "porEstado": {
      "paid": 95,
      "pending": 20,
      "overdue": 10
    }
  }
}
```

### GET /api/billing/accounts-receivable
**Descripción:** Cuentas por cobrar (análisis de cartera)
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "paciente": "Juan Pérez García",
        "facturas": 3,
        "totalAdeudo": 12500,
        "antiguedadMaxima": 45,
        "clasificacion": "al_corriente"
      }
    ],
    "resumen": {
      "totalCuentas": 25,
      "montoTotal": 150000,
      "0_30_dias": 80000,
      "31_60_dias": 45000,
      "61_90_dias": 20000,
      "mas_90_dias": 5000
    }
  }
}
```

---

## POS - Punto de Venta (6 endpoints)

### POST /api/pos/quick-sales
**Descripción:** Registrar venta rápida (sin cuenta de paciente)
**Auth:** Required
**Roles:** cajero, administrador
**Auditoría:** Crítica
**Body:**
```json
{
  "items": [
    {
      "tipo": "servicio",
      "servicioId": 10,
      "cantidad": 1,
      "precioUnitario": 500
    },
    {
      "tipo": "producto",
      "productoId": 25,
      "cantidad": 3,
      "precioUnitario": 45
    }
  ],
  "metodoPago": "efectivo",
  "montoRecibido": 700,
  "observaciones": "Cliente walk-in"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 156,
      "numeroVenta": "VR-2024-103015",
      "total": 635,
      "cambio": 65,
      "metodoPago": "efectivo"
    }
  }
}
```

### GET /api/pos/quick-sales
**Descripción:** Historial de ventas rápidas
**Query Params:**
```
?page=1
&limit=50
&cajeroId=5
&metodoPago=efectivo
&fechaInicio=2024-10-30
&fechaFin=2024-10-30
```

### GET /api/pos/quick-sales/:id
**Descripción:** Detalle de venta
**Include:** items, cajero

### GET /api/pos/daily-summary
**Descripción:** Resumen diario de caja
**Query Params:** `?fecha=2024-10-30&cajeroId=5`
**Response:**
```json
{
  "success": true,
  "data": {
    "fecha": "2024-10-30",
    "cajeroId": 5,
    "ventasTotales": 15,
    "montoTotal": 12500,
    "porMetodoPago": {
      "efectivo": 8500,
      "tarjeta": 3500,
      "transferencia": 500
    },
    "promedioVenta": 833.33,
    "ticketMinimo": 150,
    "ticketMaximo": 2500
  }
}
```

### POST /api/pos/cancel-item
**Descripción:** Cancelar item de venta
**Auth:** Required
**Auditoría:** Crítica (requiere autorización)
**Roles:** administrador
**Body:**
```json
{
  "ventaRapidaId": 156,
  "itemId": 342,
  "motivo": "Producto incorrecto capturado",
  "causaCancelacionId": 5,
  "usuarioAutorizaId": 1
}
```

### GET /api/pos/stats
**Descripción:** Estadísticas de POS
**Response:**
```json
{
  "success": true,
  "data": {
    "ventasDia": 45,
    "ventasSemana": 280,
    "ventasMes": 1250,
    "montoDia": 25000,
    "montoSemana": 165000,
    "montoMes": 780000,
    "productosMasVendidos": [
      {
        "productoId": 25,
        "nombre": "Paracetamol 500mg",
        "cantidadVendida": 150,
        "montoTotal": 6750
      }
    ]
  }
}
```

---

## Reportes (5 endpoints)

### GET /api/reports/financial
**Descripción:** Reporte financiero
**Query Params:**
```
?fechaInicio=2024-10-01
&fechaFin=2024-10-31
&incluirDetalle=true
```
**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": "2024-10-01 a 2024-10-31",
    "ingresos": {
      "facturacion": 450000,
      "pos": 125000,
      "hospitalizacion": 320000,
      "total": 895000
    },
    "egresos": {
      "compraInventario": 180000,
      "nomina": 250000,
      "servicios": 45000,
      "total": 475000
    },
    "utilidad": 420000,
    "margen": 46.93
  }
}
```

### GET /api/reports/operational
**Descripción:** Reporte operativo
**Query Params:** `?fechaInicio=2024-10-01&fechaFin=2024-10-31`
**Response:**
```json
{
  "success": true,
  "data": {
    "pacientes": {
      "atendidos": 850,
      "nuevos": 125,
      "recurrentes": 725
    },
    "hospitalizacion": {
      "ingresos": 45,
      "altas": 42,
      "promedioEstancia": 3.5,
      "ocupacionPromedio": 75
    },
    "quirofanos": {
      "cirugias": 28,
      "horasUso": 112,
      "utilizacion": 60
    },
    "consultorios": {
      "consultas": 650,
      "horasUso": 520,
      "utilizacion": 65
    }
  }
}
```

### GET /api/reports/executive
**Descripción:** Reporte ejecutivo (dashboard)
**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "ingresosDelMes": 895000,
      "crecimientoMensual": 12.5,
      "pacientesActivos": 2500,
      "ocupacionPromedio": 72,
      "satisfaccionPacientes": 4.5
    },
    "alertas": [
      {
        "tipo": "stock_critico",
        "mensaje": "5 productos en stock crítico",
        "criticidad": "alta"
      }
    ]
  }
}
```

### GET /api/reports/inventory-valuation
**Descripción:** Valuación de inventario
**Response:**
```json
{
  "success": true,
  "data": {
    "valorTotal": 2450000,
    "porCategoria": {
      "medicamento": 1800000,
      "material_medico": 500000,
      "insumo": 150000
    },
    "rotacion": {
      "promedio": 45,
      "lenta": 23,
      "normal": 350,
      "rapida": 77
    },
    "obsoletos": {
      "cantidad": 15,
      "valor": 25000
    }
  }
}
```

### GET /api/reports/patient-statistics
**Descripción:** Estadísticas demográficas de pacientes
**Response:**
```json
{
  "success": true,
  "data": {
    "totalPacientes": 2500,
    "demograficos": {
      "porGenero": { "M": 1200, "F": 1280, "Otro": 20 },
      "porRangoEdad": {
        "0-18": 350,
        "19-35": 750,
        "36-60": 950,
        "60+": 450
      },
      "porEstadoCivil": {
        "soltero": 800,
        "casado": 1350,
        "divorciado": 250,
        "viudo": 100
      }
    },
    "geograficos": {
      "porEstado": {
        "Jalisco": 2100,
        "Nayarit": 250,
        "Colima": 150
      }
    },
    "seguros": {
      "conSeguro": 1800,
      "sinSeguro": 700,
      "porAseguradora": {
        "IMSS": 900,
        "Seguro Popular": 500,
        "Privado": 400
      }
    }
  }
}
```

---

## Solicitudes de Productos (7 endpoints)

### GET /api/solicitudes
**Descripción:** Lista de solicitudes de productos
**Query Params:**
```
?page=1
&limit=50
&estado=SOLICITADO
&prioridad=URGENTE
&solicitanteId=5
&almacenistaId=3
&pacienteId=25
```

### POST /api/solicitudes
**Descripción:** Crear solicitud de productos
**Auth:** Required
**Roles:** medico_residente, medico_especialista, enfermero
**Body:**
```json
{
  "pacienteId": 25,
  "cuentaPacienteId": 45,
  "prioridad": "URGENTE",
  "detalles": [
    {
      "productoId": 15,
      "cantidadSolicitada": 5
    },
    {
      "productoId": 28,
      "cantidadSolicitada": 2
    }
  ],
  "observaciones": "Para cirugía programada a las 14:00h"
}
```
**Acción Automática:** Notifica a almacenista

### GET /api/solicitudes/:id
**Descripción:** Detalle de solicitud
**Include:** paciente, cuenta, solicitante, almacenista, detalles, historial, notificaciones

### PUT /api/solicitudes/:id
**Descripción:** Actualizar solicitud (cambiar productos)
**Auth:** Required
**Roles:** solicitante original
**Validación:** Solo si estado = SOLICITADO

### PUT /api/solicitudes/:id/status
**Descripción:** Cambiar estado de solicitud (workflow)
**Auth:** Required
**Body:**
```json
{
  "nuevoEstado": "PREPARANDO",
  "observaciones": "Verificando disponibilidad de productos"
}
```
**Workflow:**
```
SOLICITADO (médico/enfermero)
   ↓
NOTIFICADO (sistema automático)
   ↓
PREPARANDO (almacenista)
   ↓
LISTO_ENTREGA (almacenista)
   ↓
ENTREGADO (almacenista)
   ↓
RECIBIDO (médico/enfermero)
   ↓
APLICADO (médico/enfermero - finaliza ciclo)
```

**Validaciones de Transición:**
- SOLICITADO → PREPARANDO: solo almacenista
- PREPARANDO → LISTO_ENTREGA: solo almacenista
- LISTO_ENTREGA → ENTREGADO: solo almacenista
- ENTREGADO → RECIBIDO: solo solicitante original
- RECIBIDO → APLICADO: solo solicitante original
- Cualquier estado → CANCELADO: solicitante o administrador

### DELETE /api/solicitudes/:id
**Descripción:** Cancelar solicitud
**Auth:** Required
**Auditoría:** Crítica
**Roles:** solicitante original, administrador
**Body:**
```json
{
  "motivo": "Paciente dado de alta antes de recibir productos",
  "causaCancelacionId": 12
}
```

### GET /api/solicitudes/stats
**Descripción:** Estadísticas de solicitudes
**Response:**
```json
{
  "success": true,
  "data": {
    "totalSolicitudes": 450,
    "porEstado": {
      "SOLICITADO": 15,
      "PREPARANDO": 8,
      "LISTO_ENTREGA": 5,
      "ENTREGADO": 12,
      "RECIBIDO": 10,
      "APLICADO": 380,
      "CANCELADO": 20
    },
    "tiempoPromedio": {
      "solicitudEntrega": 45,
      "entregaRecepcion": 15,
      "recepcionAplicacion": 30,
      "total": 90
    },
    "porPrioridad": {
      "URGENTE": 85,
      "ALTA": 120,
      "NORMAL": 200,
      "BAJA": 45
    }
  }
}
```

---

## Usuarios y Gestión (9 endpoints)

### GET /api/users
**Descripción:** Lista de usuarios
**Auth:** Required
**Roles:** administrador
**Query Params:** `?page=1&limit=50&rol=cajero&activo=true`

### POST /api/users
**Descripción:** Crear usuario
**Auth:** Required
**Roles:** administrador
**Auditoría:** Sí
**Body:**
```json
{
  "username": "cajero2",
  "password": "cajero123",
  "email": "cajero2@hospital.com",
  "rol": "cajero",
  "nombre": "María",
  "apellidos": "González López",
  "telefono": "33-9999-8888"
}
```

### GET /api/users/:id
**Descripción:** Detalle de usuario
**Auth:** Required
**Roles:** administrador

### PUT /api/users/:id
**Descripción:** Actualizar usuario
**Auth:** Required
**Roles:** administrador
**Auditoría:** Sí

### DELETE /api/users/:id
**Descripción:** Eliminar usuario (soft delete)
**Auth:** Required
**Roles:** administrador
**Auditoría:** Crítica

### PUT /api/users/:id/password
**Descripción:** Cambiar contraseña
**Auth:** Required
**Roles:** administrador (cualquier usuario), usuario mismo (su propia password)
**Body:**
```json
{
  "passwordActual": "cajero123",
  "passwordNuevo": "nuevo_password_seguro_2024"
}
```

### PUT /api/users/:id/role
**Descripción:** Cambiar rol de usuario (registra en historial)
**Auth:** Required
**Roles:** administrador
**Auditoría:** Sí
**Body:**
```json
{
  "nuevoRol": "medico_especialista",
  "razon": "Completó especialidad en Cardiología"
}
```

### GET /api/users/:id/role-history
**Descripción:** Historial de cambios de rol
**Auth:** Required
**Roles:** administrador
**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 15,
        "rolAnterior": "medico_residente",
        "rolNuevo": "medico_especialista",
        "razon": "Completó especialidad en Cardiología",
        "cambiadoPor": "admin",
        "createdAt": "2024-10-15T10:00:00.000Z"
      }
    ]
  }
}
```

### GET /api/users/stats
**Descripción:** Estadísticas de usuarios
**Auth:** Required
**Roles:** administrador
**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsuarios": 45,
    "activos": 42,
    "inactivos": 3,
    "porRol": {
      "administrador": 2,
      "cajero": 5,
      "enfermero": 12,
      "almacenista": 3,
      "medico_residente": 8,
      "medico_especialista": 10,
      "socio": 5
    },
    "ultimoAcceso": {
      "ultimaHora": 8,
      "ultimoDia": 35,
      "ultimaSemana": 42
    }
  }
}
```

---

## Habitaciones (7 endpoints)

### GET /api/rooms
**Descripción:** Lista de habitaciones
**Query Params:**
```
?page=1
&limit=50
&estado=disponible
&tipo=individual
&precioMin=500
&precioMax=2000
```

### POST /api/rooms
**Descripción:** Crear habitación (servicio automático creado)
**Auth:** Required
**Roles:** administrador
**Auditoría:** Sí
**Body:**
```json
{
  "numero": "101",
  "tipo": "individual",
  "precioPorDia": 1200,
  "descripcion": "Habitación individual con baño privado y TV"
}
```
**Acción Automática:** Crea servicio `HAB-101` con precio $1,200/día

### GET /api/rooms/:id
**Descripción:** Detalle de habitación
**Include:** cuenta actual (si ocupada), historial de hospitalizaciones

### PUT /api/rooms/:id
**Descripción:** Actualizar habitación
**Auth:** Required
**Roles:** administrador
**Auditoría:** Sí

### DELETE /api/rooms/:id
**Descripción:** Eliminar habitación
**Auth:** Required
**Roles:** administrador
**Auditoría:** Crítica
**Validación:** No debe estar ocupada

### GET /api/rooms/available-numbers
**Descripción:** Sugerir número disponible
**Response:**
```json
{
  "success": true,
  "data": {
    "suggested": "105",
    "existingNumbers": ["101", "102", "103", "104"]
  }
}
```

### GET /api/rooms/stats
**Descripción:** Estadísticas de habitaciones
**Response:**
```json
{
  "success": true,
  "data": {
    "totalHabitaciones": 20,
    "disponibles": 12,
    "ocupadas": 6,
    "mantenimiento": 2,
    "tasaOcupacion": 30,
    "porTipo": {
      "individual": 10,
      "doble": 6,
      "suite": 3,
      "terapia_intensiva": 1
    }
  }
}
```

---

## Consultorios (9 endpoints)

_Similar a Habitaciones, con endpoints para gestión de consultorios_

---

## Auditoría (5 endpoints)

### GET /api/audit
**Descripción:** Consultar logs de auditoría
**Auth:** Required
**Roles:** administrador, socio
**Query Params:**
```
?page=1
&limit=50
&modulo=inventario
&tipoOperacion=DELETE
&usuarioId=5
&fechaInicio=2024-10-01
&fechaFin=2024-10-31
```

### GET /api/audit/user/:userId
**Descripción:** Logs de auditoría por usuario

### GET /api/audit/entity/:entity
**Descripción:** Logs por tipo de entidad
**Params:** `entity = paciente | producto | factura | etc.`

### GET /api/audit/critical
**Descripción:** Solo operaciones críticas (DELETE, cancelaciones, descuentos)

### GET /api/audit/stats
**Descripción:** Estadísticas de auditoría

---

## Notificaciones (6 endpoints)

### GET /api/notificaciones
**Descripción:** Lista de notificaciones del usuario
**Auth:** Required
**Query Params:** `?leida=false&tipo=NUEVA_SOLICITUD`

### POST /api/notificaciones
**Descripción:** Crear notificación (sistema)
**Auth:** Required
**Roles:** sistema (uso interno)

### PUT /api/notificaciones/:id/mark-read
**Descripción:** Marcar como leída
**Auth:** Required

### DELETE /api/notificaciones/:id
**Descripción:** Eliminar notificación
**Auth:** Required

### GET /api/notificaciones/unread-count
**Descripción:** Contador de no leídas

### PUT /api/notificaciones/mark-all-read
**Descripción:** Marcar todas como leídas

---

## Endpoints Legacy (Compatibilidad)

_Los siguientes endpoints están en server-modular.js y se mantendrán por compatibilidad hasta migración completa a routes separadas_

### GET /api/services
**Descripción:** Lista de servicios (catálogo)

### GET /api/suppliers
**Descripción:** Lista de proveedores (compatibilidad)

### GET /api/patient-accounts
**Descripción:** Cuentas de pacientes (POS)

### PUT /api/patient-accounts/:id/close
**Descripción:** Cerrar cuenta (facturación automática)

### POST /api/patient-accounts/:id/transactions
**Descripción:** Agregar transacción a cuenta

### GET /api/patient-accounts/consistency-check
**Descripción:** Verificar inconsistencias BD

---

## Respuesta Estándar

Todos los endpoints siguen el formato de respuesta:

### Éxito:
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "pagination": { ... } // Solo en endpoints con paginación
}
```

### Error:
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

### Códigos HTTP:
- `200` - Éxito
- `201` - Creado
- `400` - Bad Request (validación)
- `401` - No autenticado
- `403` - No autorizado (permisos)
- `404` - No encontrado
- `409` - Conflicto (violación unique)
- `429` - Too Many Requests (rate limit)
- `500` - Error interno del servidor

---

**Última Actualización:** 30 de Octubre de 2025
**Total Endpoints:** 115
**Versión API:** 1.0.0
