# 📊 API de Reportes - Documentación Completa

**Sistema de Gestión Hospitalaria Integral**
**Desarrollado por:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Versión:** 2.2.0
**Última actualización:** 4 de diciembre de 2025

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Reportes Predefinidos](#reportes-predefinidos)
   - [Financial](#1-reporte-financiero)
   - [Operational](#2-reporte-operativo)
   - [Inventory](#3-reporte-de-inventario)
   - [Patients](#4-reporte-de-pacientes)
   - [Hospitalization](#5-reporte-de-hospitalización)
   - [Revenue](#6-reporte-de-ingresos)
   - [Rooms Occupancy](#7-ocupación-de-habitaciones)
   - [Appointments](#8-reporte-de-citas-médicas)
   - [Employees](#9-reporte-de-empleados)
   - [Services](#10-reporte-de-servicios)
   - [Audit](#11-reporte-de-auditoría)
4. [Reportes Avanzados](#reportes-avanzados)
   - [Custom Reports](#reportes-personalizados)
   - [Export Reports](#exportación-de-reportes)
5. [Parámetros Comunes](#parámetros-comunes)
6. [Códigos de Respuesta](#códigos-de-respuesta)
7. [Ejemplos Prácticos](#ejemplos-prácticos)
8. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

La API de Reportes del Sistema de Gestión Hospitalaria proporciona **11 endpoints predefinidos** más capacidades de **reportes personalizados** y **exportación en múltiples formatos** (PDF, Excel, CSV).

### Características Principales

- ✅ **11 reportes predefinidos** con métricas clave
- ✅ **Filtrado avanzado** por fechas, estados, tipos
- ✅ **Agrupación dinámica** de datos
- ✅ **Reportes personalizados** con campos configurables
- ✅ **Exportación** en PDF, Excel (XLSX), CSV
- ✅ **Paginación** automática (límite 100 registros por defecto)
- ✅ **Validación de permisos** por rol de usuario

### Base URL

```
http://localhost:3001/api/reports
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:

```bash
Authorization: Bearer {your_jwt_token}
```

### Ejemplo con curl

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3001/api/reports/financial
```

### Permisos por Rol

| Endpoint | Administrador | Socio | Médico | Cajero | Otros |
|----------|:-------------:|:-----:|:------:|:------:|:-----:|
| Financial | ✅ | ✅ | ❌ | ❌ | ❌ |
| Operational | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| Inventory | ✅ | ⚠️ | ❌ | ❌ | ⚠️ |
| All Others | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ |

⚠️ = Acceso parcial según permisos específicos

---

## 📊 Reportes Predefinidos

### 1. Reporte Financiero

**Endpoint:** `GET /api/reports/financial`

**Descripción:** Reporte completo de ingresos, cuentas por cobrar y distribución de métodos de pago.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fechaInicio` | Date | No | Fecha de inicio (ISO 8601) |
| `fechaFin` | Date | No | Fecha de fin (ISO 8601) |

#### Ejemplo de Request

```bash
GET /api/reports/financial?fechaInicio=2025-01-01&fechaFin=2025-12-31
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "ingresos": {
      "total": 1250000.50,
      "ventasRapidas": 450000.00,
      "facturas": 800000.50
    },
    "cuentasPorCobrar": {
      "total": 125000.00,
      "vencidas": 35000.00,
      "porVencer": 90000.00
    },
    "distribucionMetodosPago": {
      "efectivo": 450000.00,
      "tarjeta": 650000.50,
      "transferencia": 150000.00
    }
  },
  "message": "Reporte financiero generado correctamente"
}
```

#### Casos de Uso

```javascript
// Frontend - React/TypeScript
async function fetchFinancialReport(startDate, endDate) {
  const token = localStorage.getItem('authToken');

  const params = new URLSearchParams();
  if (startDate) params.append('fechaInicio', startDate);
  if (endDate) params.append('fechaFin', endDate);

  const response = await fetch(
    `${API_URL}/reports/financial?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.json();
}

// Uso
const report = await fetchFinancialReport('2025-01-01', '2025-12-31');
console.log('Ingresos totales:', report.data.ingresos.total);
```

---

### 2. Reporte Operativo

**Endpoint:** `GET /api/reports/operational`

**Descripción:** Métricas operativas del hospital (atención pacientes, inventario, ocupación).

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fechaInicio` | Date | No | Fecha de inicio |
| `fechaFin` | Date | No | Fecha de fin |

#### Ejemplo de Request

```bash
GET /api/reports/operational?fechaInicio=2025-12-01
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "atencionPacientes": {
      "total": 1250,
      "nuevos": 320,
      "recurrentes": 930,
      "promedioTiempoAtencion": "45 minutos"
    },
    "inventario": {
      "productosActivos": 450,
      "productosBajoStock": 23,
      "valorTotal": 450000.00
    },
    "ocupacion": {
      "habitaciones": {
        "total": 100,
        "ocupadas": 78,
        "tasaOcupacion": 78.0
      },
      "quirofanos": {
        "total": 8,
        "enUso": 3,
        "tasaUso": 37.5
      }
    }
  },
  "message": "Reporte operativo generado correctamente"
}
```

---

### 3. Reporte de Inventario

**Endpoint:** `GET /api/reports/inventory`

**Descripción:** Estado del inventario, productos bajo stock, movimientos.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `bajoStock` | Boolean | No | Filtrar solo productos bajo stock |

#### Ejemplo de Request

```bash
GET /api/reports/inventory?bajoStock=true
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalProductos": 450,
      "productosBajoStock": 23,
      "valorTotal": 450000.00
    },
    "productosBajoStock": [
      {
        "id": 45,
        "nombre": "Paracetamol 500mg",
        "stockActual": 15,
        "stockMinimo": 50,
        "deficit": 35,
        "proveedor": "Farmacias ABC"
      },
      {
        "id": 78,
        "nombre": "Jeringa 10ml",
        "stockActual": 8,
        "stockMinimo": 100,
        "deficit": 92,
        "proveedor": "Suministros Médicos XYZ"
      }
    ]
  },
  "message": "Reporte de inventario generado correctamente"
}
```

#### Caso de Uso: Alertas Automáticas

```javascript
// Sistema de alertas automáticas
async function checkLowStock() {
  const report = await fetch('/api/reports/inventory?bajoStock=true');
  const data = await report.json();

  if (data.data.resumen.productosBajoStock > 0) {
    // Enviar notificación al almacenista
    sendNotification({
      recipient: 'almacen@hospital.com',
      subject: `Alerta: ${data.data.resumen.productosBajoStock} productos bajo stock`,
      body: data.data.productosBajoStock.map(p =>
        `- ${p.nombre}: ${p.stockActual} unidades (mínimo: ${p.stockMinimo})`
      ).join('\n')
    });
  }
}

// Ejecutar cada 6 horas
setInterval(checkLowStock, 6 * 60 * 60 * 1000);
```

---

### 4. Reporte de Pacientes

**Endpoint:** `GET /api/reports/patients`

**Descripción:** Estadísticas de pacientes con distribución por edad y género.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `groupBy` | String | No | Agrupar por: 'edad', 'genero' |

#### Ejemplo de Request

```bash
GET /api/reports/patients?groupBy=edad
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalPacientes": 5240,
      "pacientesActivos": 4980,
      "pacientesInactivos": 260
    },
    "distribucionPorEdad": {
      "0-17": 845,
      "18-35": 1680,
      "36-55": 1890,
      "56-75": 685,
      "76+": 140
    },
    "distribucionPorGenero": {
      "M": 2450,
      "F": 2790
    }
  },
  "message": "Reporte de pacientes generado correctamente"
}
```

---

### 5. Reporte de Hospitalización

**Endpoint:** `GET /api/reports/hospitalization`

**Descripción:** Métricas de hospitalización, estancia promedio, altas.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `estado` | String | No | Filtrar por estado: 'en_observacion', 'alta' |
| `metrics` | Boolean | No | Incluir métricas avanzadas |

#### Ejemplo de Request

```bash
GET /api/reports/hospitalization?metrics=true
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "ingresosActivos": 78,
      "altasMesActual": 142,
      "promedioEstancia": "4.5 días"
    },
    "estanciaPromedio": 4.5,
    "distribucionPorTipo": {
      "urgencia": 45,
      "programada": 33
    },
    "tasasOcupacion": {
      "actual": 78.0,
      "promedio30dias": 72.5
    }
  },
  "message": "Reporte de hospitalización generado correctamente"
}
```

---

### 6. Reporte de Ingresos

**Endpoint:** `GET /api/reports/revenue`

**Descripción:** Ingresos desglosados por período (mensual, trimestral, anual).

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `periodo` | String | No | 'mensual', 'trimestral', 'anual' |
| `groupBy` | String | No | Agrupar por: 'servicio' |

#### Ejemplo de Request

```bash
GET /api/reports/revenue?periodo=mensual&groupBy=servicio
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalIngresos": 850000.00,
      "ventasRapidas": {
        "monto": 250000.00,
        "cantidad": 1250
      },
      "facturas": {
        "monto": 600000.00,
        "cantidad": 420
      }
    },
    "porServicio": {
      "Consulta General": {
        "monto": 125000.00,
        "cantidad": 420
      },
      "Hospitalización": {
        "monto": 450000.00,
        "cantidad": 78
      },
      "Cirugía": {
        "monto": 275000.00,
        "cantidad": 15
      }
    }
  },
  "message": "Reporte de ingresos generado correctamente"
}
```

#### Caso de Uso: Dashboard Ejecutivo

```javascript
// Dashboard tiempo real
async function refreshExecutiveDashboard() {
  const [monthly, quarterly, yearly] = await Promise.all([
    fetch('/api/reports/revenue?periodo=mensual'),
    fetch('/api/reports/revenue?periodo=trimestral'),
    fetch('/api/reports/revenue?periodo=anual')
  ]);

  const monthlyData = await monthly.json();
  const quarterlyData = await quarterly.json();
  const yearlyData = await yearly.json();

  // Actualizar gráficos
  updateChart('monthly', monthlyData.data);
  updateChart('quarterly', quarterlyData.data);
  updateChart('yearly', yearlyData.data);

  // Calcular KPIs
  const kpis = {
    monthlyRevenue: monthlyData.data.resumen.totalIngresos,
    quarterlyGrowth: calculateGrowth(monthlyData, quarterlyData),
    yearlyProjection: projectYearly(monthlyData, yearlyData)
  };

  updateKPIs(kpis);
}

// Actualizar cada 5 minutos
setInterval(refreshExecutiveDashboard, 5 * 60 * 1000);
```

---

### 7. Ocupación de Habitaciones

**Endpoint:** `GET /api/reports/rooms-occupancy`

**Descripción:** Tasa de ocupación de habitaciones global y por tipo.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `groupBy` | String | No | Agrupar por: 'tipo' |

#### Ejemplo de Request

```bash
GET /api/reports/rooms-occupancy?groupBy=tipo
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "tasaOcupacion": 78.0,
    "resumen": {
      "totalHabitaciones": 100,
      "habitacionesOcupadas": 78,
      "habitacionesDisponibles": 22
    },
    "porTipo": [
      {
        "tipo": "individual",
        "total": 40,
        "ocupadas": 35,
        "disponibles": 5,
        "tasaOcupacion": 87.5
      },
      {
        "tipo": "doble",
        "total": 35,
        "ocupadas": 28,
        "disponibles": 7,
        "tasaOcupacion": 80.0
      },
      {
        "tipo": "UCI",
        "total": 15,
        "ocupadas": 9,
        "disponibles": 6,
        "tasaOcupacion": 60.0
      },
      {
        "tipo": "pediatria",
        "total": 10,
        "ocupadas": 6,
        "disponibles": 4,
        "tasaOcupacion": 60.0
      }
    ]
  },
  "message": "Reporte de ocupación generado correctamente"
}
```

---

### 8. Reporte de Citas Médicas

**Endpoint:** `GET /api/reports/appointments`

**Descripción:** Estadísticas de citas médicas con distribución por estado.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `estado` | String | No | Filtrar por: 'confirmada', 'cancelada', 'completada' |
| `fechaInicio` | Date | No | Fecha de inicio |
| `fechaFin` | Date | No | Fecha de fin |

#### Ejemplo de Request

```bash
GET /api/reports/appointments?estado=confirmada
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalCitas": 450,
      "distribucionEstado": {
        "confirmada": 280,
        "cancelada": 45,
        "completada": 125
      }
    },
    "citas": [
      {
        "id": 1245,
        "fechaCita": "2025-12-05T09:00:00.000Z",
        "tipoCita": "consulta_general",
        "paciente": {
          "id": 345,
          "nombre": "Juan",
          "apellidoPaterno": "Pérez",
          "apellidoMaterno": "García"
        },
        "medico": {
          "id": 78,
          "nombre": "Dra. María",
          "apellidoPaterno": "González"
        },
        "motivo": "Control mensual",
        "estado": "confirmada"
      }
    ]
  },
  "message": "Reporte de citas generado correctamente"
}
```

---

### 9. Reporte de Empleados

**Endpoint:** `GET /api/reports/employees`

**Descripción:** Estadísticas de empleados con distribución por rol.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `groupBy` | String | No | Agrupar por: 'rol' |

#### Ejemplo de Request

```bash
GET /api/reports/employees?groupBy=rol
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalEmpleados": 285,
      "empleadosActivos": 270,
      "empleadosInactivos": 15
    },
    "porRol": {
      "medico_especialista": 45,
      "medico_residente": 30,
      "enfermero": 95,
      "cajero": 12,
      "almacenista": 8,
      "administrador": 5,
      "socio": 3,
      "personal_limpieza": 45,
      "seguridad": 20,
      "otros": 22
    }
  },
  "message": "Reporte de empleados generado correctamente"
}
```

---

### 10. Reporte de Servicios

**Endpoint:** `GET /api/reports/services`

**Descripción:** Uso de servicios hospitalarios, más solicitados, cantidades.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `orderBy` | String | No | Ordenar por: 'cantidad' |
| `order` | String | No | Dirección: 'asc', 'desc' |

#### Ejemplo de Request

```bash
GET /api/reports/services?orderBy=cantidad&order=desc
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalServicios": 85,
      "serviciosMasSolicitados": [
        {
          "id": 12,
          "codigo": "CONS-GEN",
          "nombre": "Consulta General",
          "tipo": "consulta",
          "precio": 500.00,
          "cantidadUsos": 1250
        },
        {
          "id": 34,
          "codigo": "LAB-SANGRE",
          "nombre": "Análisis de Sangre Completo",
          "tipo": "laboratorio",
          "precio": 350.00,
          "cantidadUsos": 890
        }
      ]
    },
    "servicios": [
      /* ... todos los servicios ordenados ... */
    ]
  },
  "message": "Reporte de servicios generado correctamente"
}
```

---

### 11. Reporte de Auditoría

**Endpoint:** `GET /api/reports/audit`

**Descripción:** Trazabilidad completa de operaciones del sistema.

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `entidad` | String | No | Filtrar por entidad: 'pacientes', 'facturas', etc. |
| `accion` | String | No | Filtrar por acción: 'crear', 'actualizar', 'eliminar' |
| `fechaInicio` | Date | No | Fecha de inicio |
| `fechaFin` | Date | No | Fecha de fin |

#### Ejemplo de Request

```bash
GET /api/reports/audit?entidad=pacientes&accion=crear
```

#### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalRegistros": 450,
      "distribucionPorTipo": {
        "crear": 280,
        "actualizar": 145,
        "eliminar": 25
      },
      "distribucionPorEntidad": {
        "pacientes": 180,
        "facturas": 120,
        "inventario": 95,
        "citas": 55
      }
    },
    "registros": [
      {
        "id": 12450,
        "modulo": "pacientes",
        "tipoOperacion": "crear",
        "entidadTipo": "pacientes",
        "entidadId": 3450,
        "usuario": {
          "id": 45,
          "username": "cajero1",
          "rol": "cajero"
        },
        "motivo": "Registro de nuevo paciente",
        "ipAddress": "192.168.1.105",
        "createdAt": "2025-12-04T10:30:00.000Z"
      }
    ]
  },
  "message": "Reporte de auditoría generado correctamente"
}
```

---

## 🚀 Reportes Avanzados

### Reportes Personalizados

**Endpoint:** `POST /api/reports/custom`

**Descripción:** Genera reportes con campos y filtros totalmente configurables.

#### Request Body

```json
{
  "tipo": "facturacion",
  "campos": ["paciente", "total", "fecha", "estado"],
  "filtros": {
    "estado": "pagada",
    "fechaInicio": "2025-01-01",
    "fechaFin": "2025-12-31"
  }
}
```

#### Tipos Disponibles

- `facturacion` - Facturas y pagos
- (Extensible para más tipos)

#### Ejemplo Completo

```bash
curl -X POST http://localhost:3001/api/reports/custom \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "facturacion",
    "campos": ["paciente", "total", "fecha", "estado"],
    "filtros": {
      "estado": "pagada"
    }
  }'
```

#### Respuesta

```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalRegistros": 420,
      "tipo": "facturacion",
      "campos": ["paciente", "total", "fecha", "estado"],
      "filtros": {
        "estado": "pagada"
      }
    },
    "registros": [
      {
        "paciente": {
          "id": 345,
          "nombre": "Juan",
          "apellidoPaterno": "Pérez",
          "apellidoMaterno": "García"
        },
        "total": 5500.00,
        "fecha": "2025-12-01T00:00:00.000Z",
        "estado": "paid"
      }
    ]
  },
  "message": "Reporte personalizado generado correctamente"
}
```

#### Mapeo de Estados (Español → Inglés)

```javascript
const estadoMap = {
  'pagada': 'paid',
  'pendiente': 'pending',
  'parcial': 'partial',
  'vencida': 'overdue',
  'cancelada': 'cancelled',
  'borrador': 'draft'
};
```

---

### Exportación de Reportes

**Endpoint:** `GET /api/reports/export/:tipo`

**Descripción:** Exporta cualquier reporte en PDF, Excel o CSV.

#### Parámetros Path

| Parámetro | Descripción |
|-----------|-------------|
| `tipo` | Tipo de reporte: 'financial', 'operational', 'inventory', etc. |

#### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `format` | String | **Sí** | Formato: 'pdf', 'xlsx', 'csv' |

#### Ejemplo: Exportar a PDF

```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3001/api/reports/export/financial?format=pdf" \
  --output reporte-financial.pdf
```

#### Ejemplo: Exportar a Excel

```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3001/api/reports/export/financial?format=xlsx" \
  --output reporte-financial.xlsx
```

#### Ejemplo: Exportar a CSV

```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3001/api/reports/export/financial?format=csv" \
  --output reporte-financial.csv
```

#### Headers de Respuesta

```
Content-Type: application/pdf
Content-Disposition: attachment; filename=reporte-financial.pdf
```

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=reporte-financial.xlsx
```

```
Content-Type: text/csv
Content-Disposition: attachment; filename=reporte-financial.csv
```

#### Ejemplo de Implementación en Frontend

```javascript
async function downloadReport(tipo, format) {
  const token = localStorage.getItem('authToken');

  const response = await fetch(
    `${API_URL}/reports/export/${tipo}?format=${format}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Error al exportar reporte');
  }

  // Obtener el blob
  const blob = await response.blob();

  // Crear URL temporal y descargar
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-${tipo}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Uso
downloadReport('financial', 'pdf');  // Descarga PDF
downloadReport('financial', 'xlsx'); // Descarga Excel
downloadReport('financial', 'csv');  // Descarga CSV
```

---

## 🔧 Parámetros Comunes

### Filtrado por Fechas

Todos los endpoints soportan filtrado por rango de fechas:

```
?fechaInicio=2025-01-01&fechaFin=2025-12-31
```

**Formato:** ISO 8601 (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss.sssZ`)

### Agrupación de Datos

Algunos endpoints soportan agrupación dinámica:

```
?groupBy=tipo
?groupBy=servicio
?groupBy=edad
?groupBy=rol
```

### Paginación

Por defecto, los endpoints limitan los resultados a **100 registros**.

---

## 📋 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Éxito - Reporte generado correctamente |
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token JWT faltante o inválido |
| 403 | Forbidden - Permisos insuficientes para el reporte |
| 404 | Not Found - Endpoint no existe |
| 500 | Internal Server Error - Error del servidor |

### Estructura de Error

```json
{
  "success": false,
  "message": "Error al generar reporte",
  "error": "Descripción detallada del error"
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Dashboard Ejecutivo Completo

```javascript
async function fetchExecutiveDashboard() {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Obtener todos los reportes en paralelo
  const [
    financial,
    operational,
    revenue,
    occupancy,
    services
  ] = await Promise.all([
    fetch(`${API_URL}/reports/financial`, { headers }),
    fetch(`${API_URL}/reports/operational`, { headers }),
    fetch(`${API_URL}/reports/revenue?periodo=mensual`, { headers }),
    fetch(`${API_URL}/reports/rooms-occupancy?groupBy=tipo`, { headers }),
    fetch(`${API_URL}/reports/services?orderBy=cantidad&order=desc`, { headers })
  ]);

  const data = await Promise.all([
    financial.json(),
    operational.json(),
    revenue.json(),
    occupancy.json(),
    services.json()
  ]);

  return {
    financial: data[0].data,
    operational: data[1].data,
    revenue: data[2].data,
    occupancy: data[3].data,
    services: data[4].data
  };
}
```

### Ejemplo 2: Sistema de Alertas

```javascript
// Verificar stock bajo cada 6 horas
setInterval(async () => {
  const report = await fetch('/api/reports/inventory?bajoStock=true');
  const data = await report.json();

  if (data.data.resumen.productosBajoStock > 0) {
    await sendNotification({
      type: 'warning',
      message: `${data.data.resumen.productosBajoStock} productos bajo stock`,
      recipients: ['almacen@hospital.com']
    });
  }
}, 6 * 60 * 60 * 1000);
```

### Ejemplo 3: Exportación Masiva

```javascript
async function exportAllReports() {
  const reports = [
    'financial',
    'operational',
    'inventory',
    'patients',
    'hospitalization'
  ];

  for (const report of reports) {
    await downloadReport(report, 'pdf');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s entre descargas
  }
}
```

---

## ✅ Mejores Prácticas

### 1. Caché de Reportes

```javascript
// Cachear reportes por 5 minutos
const reportCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCachedReport(endpoint) {
  const cached = reportCache.get(endpoint);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(endpoint);
  const data = await response.json();

  reportCache.set(endpoint, {
    data,
    timestamp: Date.now()
  });

  return data;
}
```

### 2. Manejo de Errores

```javascript
async function safeReportFetch(endpoint) {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error desconocido');
    }

    return data;
  } catch (error) {
    console.error('Error fetching report:', error);

    // Mostrar mensaje al usuario
    showErrorToast(`No se pudo cargar el reporte: ${error.message}`);

    // Retornar datos vacíos seguros
    return {
      success: false,
      data: {},
      message: error.message
    };
  }
}
```

### 3. Optimización de Requests

```javascript
// Usar AbortController para cancelar requests
const controller = new AbortController();

fetch('/api/reports/financial', {
  signal: controller.signal
});

// Cancelar si el usuario navega antes de completar
window.addEventListener('beforeunload', () => {
  controller.abort();
});
```

### 4. Validación de Fechas

```javascript
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Fechas inválidas');
  }

  if (start > end) {
    throw new Error('Fecha de inicio debe ser anterior a fecha fin');
  }

  // Limitar a 1 año máximo
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end - start > oneYear) {
    throw new Error('El rango de fechas no puede exceder 1 año');
  }

  return { start, end };
}
```

### 5. Rate Limiting

```javascript
// Implementar throttling en el cliente
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;

  return function(...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime < delay) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastExecTime = currentTime;
        func.apply(this, args);
      }, delay - (currentTime - lastExecTime));
    } else {
      lastExecTime = currentTime;
      func.apply(this, args);
    }
  };
}

// Uso: máximo 1 request cada 2 segundos
const fetchReportThrottled = throttle(fetchReport, 2000);
```

---

## 🔒 Seguridad

### Headers de Seguridad

Todos los endpoints incluyen:

- **Helmet.js** - Protección contra XSS, clickjacking
- **Rate Limiting** - 100 requests/15min por IP
- **CORS** - Configurado para dominios autorizados
- **JWT Validation** - Token obligatorio y verificado

### Recomendaciones

1. **Nunca expongas el JWT en logs**
2. **Usa HTTPS en producción**
3. **Implementa rate limiting en el cliente**
4. **Valida permisos antes de mostrar reportes sensibles**
5. **No cachees reportes con datos personales**

---

## 🤝 Soporte

**Desarrollador:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Teléfono:** 443 104 7479
**Email:** (disponible bajo solicitud)

**Repositorio:** Sistema privado
**Documentación adicional:** `/docs/`

---

*© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial. Todos los derechos reservados.*
