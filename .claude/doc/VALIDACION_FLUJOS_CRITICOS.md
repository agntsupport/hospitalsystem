# VALIDACIÓN DE FLUJOS DE TRABAJO CRÍTICOS
**Sistema de Gestión Hospitalaria Integral**
**Fecha:** 6 de noviembre de 2025
**Analista:** Claude Code

---

## 🎯 OBJETIVO

Este documento contiene el **plan de validación específico** para verificar que los 3 flujos de trabajo críticos estén correctamente implementados en el sistema.

**Referencia:** [FLUJOS_TRABAJO_CRITICOS.md](./FLUJOS_TRABAJO_CRITICOS.md)

---

## ✅ CHECKLIST DE VALIDACIÓN

### FLUJO 1: CAJERO - Gestión de Pacientes y Cuentas

#### 1.1 Registro/Búsqueda de Pacientes
- [ ] **Endpoint:** `GET /api/patients?search={query}` existe y funciona
- [ ] **Endpoint:** `POST /api/patients` crea paciente correctamente
- [ ] **Frontend:** Página `/patients` permite búsqueda y creación
- [ ] **Permisos:** Rol `cajero` tiene acceso de lectura y creación

**Comando de validación:**
```bash
# Verificar endpoint de búsqueda
curl -H "Authorization: Bearer $TOKEN_CAJERO" \
  "http://localhost:3001/api/patients?search=juan"

# Verificar creación
curl -X POST -H "Authorization: Bearer $TOKEN_CAJERO" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","apellido_paterno":"Paciente"}' \
  http://localhost:3001/api/patients
```

---

#### 1.2 Apertura de Cuenta POS
- [ ] **Endpoint:** `POST /api/pos/accounts` existe
- [ ] **Validación:** Cuenta se crea con estado `abierta` y saldo `0.0`
- [ ] **Frontend:** Interfaz POS permite crear cuenta para paciente
- [ ] **Permisos:** Rol `cajero` puede crear cuentas

**Comando de validación:**
```bash
# Verificar creación de cuenta
curl -X POST -H "Authorization: Bearer $TOKEN_CAJERO" \
  -H "Content-Type: application/json" \
  -d '{"pacienteId":123,"estado":"abierta","saldo":0.0}' \
  http://localhost:3001/api/pos/accounts
```

---

#### 1.3 Asignación de Médico Responsable
- [ ] **Endpoint:** `GET /api/employees/doctors` lista médicos activos
- [ ] **Validación:** Solo médicos con `activo=true` aparecen
- [ ] **Frontend:** Dropdown/selector de médicos funciona
- [ ] **Permisos:** Cajero puede ver lista de médicos

**Comando de validación:**
```bash
# Listar médicos activos
curl -H "Authorization: Bearer $TOKEN_CAJERO" \
  http://localhost:3001/api/employees/doctors
```

---

#### 1.4 Hospitalización en Consultorio General ⚠️ CRÍTICO
- [ ] **Endpoint:** `POST /api/hospitalization/admissions` existe
- [ ] **VALIDACIÓN CLAVE:** Anticipo de **$10,000 MXN** se carga automáticamente
- [ ] **VALIDACIÓN CLAVE:** Consultorio General **NO genera cargo** por habitación
- [ ] **Validación:** Estado inicial es `activo`
- [ ] **Validación:** Se crea transacción de anticipo automáticamente

**Código a verificar:**
```javascript
// En backend/routes/hospitalization.routes.js
// Debe existir este código (línea ~50):
const nuevaHospitalizacion = await prisma.hospitalizacion.create({
  data: {
    pacienteId: parseInt(pacienteId),
    habitacionId: parseInt(habitacionId),
    medicoId: parseInt(medicoId),
    motivoIngreso,
    diagnosticoInicial,
    anticipo: 10000.0, // ← DEBE EXISTIR
    estadoHospitalizacion: 'activo'
  }
});

// Debe crear transacción de anticipo:
await prisma.transaccionCuenta.create({
  data: {
    cuentaId: cuenta.id,
    tipo: 'pago',
    monto: 10000.0, // ← DEBE EXISTIR
    descripcion: 'Anticipo inicial por hospitalización',
    metodoPago: 'efectivo',
    usuarioId: req.user.userId
  }
});
```

**Comando de validación:**
```bash
# Buscar en código
cd /Users/alfredo/agntsystemsc/backend
grep -n "10000" routes/hospitalization.routes.js
grep -n "anticipo.*10000" routes/hospitalization.routes.js

# Test manual
curl -X POST -H "Authorization: Bearer $TOKEN_CAJERO" \
  -H "Content-Type: application/json" \
  -d '{"pacienteId":123,"habitacionId":1,"medicoId":456,"motivoIngreso":"Consulta general"}' \
  http://localhost:3001/api/hospitalization/admissions

# Verificar que se creó transacción de $10,000
```

**RESULTADO ESPERADO:**
- Hospitalización creada con `anticipo: 10000.0`
- Transacción de tipo `pago` por $10,000 en cuenta del paciente
- Consultorio General no debe tener campo `tipoHabitacion` con cargo

---

#### 1.5 Cargos Automáticos de Habitaciones ⚠️ CRÍTICO
- [ ] **Validación:** Cuando paciente se cambia de Consultorio General a Habitación, se generan cargos diarios
- [ ] **Endpoint:** `PUT /api/hospitalization/:id/change-room` existe
- [ ] **Validación:** Job/Cron genera cargos diarios a las 00:00
- [ ] **Validación:** Se crea registro en `servicio_habitacion` automáticamente

**Código a verificar:**
```javascript
// Buscar en backend/routes/hospitalization.routes.js o similar
// Debe existir endpoint para cambio de habitación:
router.put('/:id/change-room', authenticateToken, async (req, res) => {
  const { nuevaHabitacionId } = req.body;

  // Actualizar hospitalización
  await prisma.hospitalizacion.update({
    where: { id: parseInt(req.params.id) },
    data: { habitacionId: parseInt(nuevaHabitacionId) }
  });

  // Obtener información de nueva habitación
  const habitacion = await prisma.habitacion.findUnique({
    where: { id: parseInt(nuevaHabitacionId) }
  });

  // Si NO es consultorio general, generar cargo
  if (habitacion.tipo !== 'consultorio_general') {
    // Crear cargo automático
    await prisma.servicioHabitacion.create({
      data: {
        hospitalizacionId: parseInt(req.params.id),
        habitacionId: parseInt(nuevaHabitacionId),
        precioHabitacion: habitacion.precioDiario,
        fecha: new Date()
      }
    });
  }
});
```

**Comando de validación:**
```bash
# Buscar lógica de cargos automáticos
cd /Users/alfredo/agntsystemsc/backend
grep -rn "servicio_habitacion\|servicioHabitacion" routes/
grep -rn "precioDiario\|cargo.*habitacion" routes/

# Verificar modelo en Prisma
grep -A 10 "model ServicioHabitacion" prisma/schema.prisma
```

**RESULTADO ESPERADO:**
- Cambio de habitación funciona
- Se genera cargo automático en `servicio_habitacion` si NO es consultorio general
- Consultorio General nunca genera cargo

---

#### 1.6 Cargos Automáticos de Quirófanos ⚠️ CRÍTICO
- [ ] **Endpoint:** `POST /api/quirofanos/cirugias` crea cirugía
- [ ] **Endpoint:** `PUT /api/quirofanos/cirugias/:id/complete` marca como completada
- [ ] **VALIDACIÓN CLAVE:** Al completar cirugía, se genera cargo automático
- [ ] **Validación:** Cargo se registra en `servicio_quirofano`
- [ ] **Validación:** Cargo incluye: uso de quirófano + tiempo + insumos

**Código a verificar:**
```javascript
// En backend/routes/quirofanos.routes.js
// Debe existir endpoint para completar cirugía:
router.put('/cirugias/:id/complete', authenticateToken, async (req, res) => {
  const cirugiaId = parseInt(req.params.id);

  // Actualizar estado de cirugía
  const cirugia = await prisma.cirugiaQuirofano.update({
    where: { id: cirugiaId },
    data: { estadoCirugia: 'completada', horaFin: new Date() }
  });

  // Obtener información del quirófano
  const quirofano = await prisma.quirofano.findUnique({
    where: { id: cirugia.quirofanoId }
  });

  // GENERAR CARGO AUTOMÁTICO
  await prisma.servicioQuirofano.create({
    data: {
      cirugiaId: cirugiaId,
      quirofanoId: cirugia.quirofanoId,
      precioQuirofano: quirofano.precioPorHora || 5000.0,
      duracion: calculateDuration(cirugia.horaInicio, cirugia.horaFin),
      fecha: new Date()
    }
  });
});
```

**Comando de validación:**
```bash
# Buscar lógica de cargos de quirófano
cd /Users/alfredo/agntsystemsc/backend
grep -rn "servicio_quirofano\|servicioQuirofano" routes/
grep -rn "completada.*cirugia\|complete.*surgery" routes/

# Verificar modelo en Prisma
grep -A 10 "model ServicioQuirofano" prisma/schema.prisma
```

**RESULTADO ESPERADO:**
- Al completar cirugía, se crea registro en `servicio_quirofano`
- Cargo incluye precio de quirófano * duración
- Cargo se suma a cuenta del paciente automáticamente

---

#### 1.7 Cierre de Cuenta y Cobro
- [ ] **Endpoint:** `POST /api/pos/accounts/:id/close` cierra cuenta
- [ ] **Validación:** Calcula total = productos + servicios + habitaciones + quirófanos
- [ ] **Validación:** Resta anticipo de $10,000
- [ ] **Validación:** Actualiza estado a `cerrada` o `facturada`
- [ ] **Frontend:** Muestra resumen completo de cuenta antes de cerrar

**Comando de validación:**
```bash
# Verificar cierre de cuenta
curl -X POST -H "Authorization: Bearer $TOKEN_CAJERO" \
  -H "Content-Type: application/json" \
  -d '{"metodoPago":"efectivo","montoPagado":5000.0}' \
  http://localhost:3001/api/pos/accounts/123/close
```

---

#### 1.8 Cuentas por Cobrar con Autorización Admin
- [ ] **Endpoint:** `PUT /api/pos/accounts/:id/status` cambia estado a `cuentas_por_cobrar`
- [ ] **VALIDACIÓN:** Requiere `autorizadoPor` (ID de administrador)
- [ ] **Validación:** Solo rol `administrador` puede autorizar
- [ ] **Validación:** Se registra en auditoría

**Código a verificar:**
```javascript
// En backend/routes/pos.routes.js o billing.routes.js
router.put('/accounts/:id/status', authenticateToken, async (req, res) => {
  const { nuevoEstado, autorizadoPor, observaciones } = req.body;

  // VALIDAR que si es cuentas por cobrar, requiere autorización de admin
  if (nuevoEstado === 'cuentas_por_cobrar') {
    if (!autorizadoPor) {
      return res.status(400).json({ error: 'Requiere autorización de administrador' });
    }

    // Verificar que autorizadoPor sea administrador
    const admin = await prisma.usuario.findUnique({ where: { id: autorizadoPor } });
    if (admin.rol !== 'administrador') {
      return res.status(403).json({ error: 'Solo administradores pueden autorizar' });
    }
  }

  // Actualizar estado
  await prisma.cuentaPaciente.update({
    where: { id: parseInt(req.params.id) },
    data: { estado: nuevoEstado, autorizadoPor, observaciones }
  });
});
```

---

### FLUJO 2: ALMACÉN - Gestión de Inventario

#### 2.1 Diferencia entre COSTO y PRECIO DE VENTA ⚠️ CRÍTICO
- [ ] **Validación:** Campo `costo` existe en modelo `Producto`
- [ ] **Validación:** Campo `precio` existe en modelo `Producto`
- [ ] **VALIDACIÓN CLAVE:** `costo` = precio de compra al proveedor
- [ ] **VALIDACIÓN CLAVE:** `precio` = precio de venta al paciente
- [ ] **Validación:** Al agregar producto a cuenta, se usa `precio` (NO `costo`)

**Código a verificar:**
```bash
# Verificar schema Prisma
cd /Users/alfredo/agntsystemsc/backend
grep -A 20 "model Producto" prisma/schema.prisma

# Debe mostrar:
# model Producto {
#   costo    Float   // ← Precio de compra
#   precio   Float   // ← Precio de venta
# }
```

**Validación de uso:**
```javascript
// Cuando se agrega producto a cuenta del paciente
// Debe usar PRECIO (no costo):
await prisma.transaccionCuenta.create({
  data: {
    cuentaId: cuentaId,
    productoId: productoId,
    cantidad: cantidad,
    precioUnitario: producto.precio, // ← Usar PRECIO
    total: cantidad * producto.precio
  }
});
```

---

#### 2.2 Surtido de Solicitudes
- [ ] **Endpoint:** `GET /api/solicitudes?estado=pendiente` lista solicitudes
- [ ] **Endpoint:** `PUT /api/solicitudes/:id/surte` marca como surtida
- [ ] **Validación:** Al surtar, se crea movimiento de inventario tipo `salida`
- [ ] **Validación:** Stock se decrementa automáticamente
- [ ] **VALIDACIÓN CLAVE:** Productos se cargan automáticamente a cuenta del paciente

**Código a verificar:**
```javascript
// En backend/routes/solicitudes.routes.js
router.put('/:id/surte', authenticateToken, async (req, res) => {
  const solicitudId = parseInt(req.params.id);

  const solicitud = await prisma.solicitudProductos.findUnique({
    where: { id: solicitudId },
    include: { detalles: { include: { producto: true } } }
  });

  // Para cada producto en la solicitud
  for (const item of solicitud.detalles) {
    // 1. Crear movimiento de salida
    await prisma.movimientoInventario.create({
      data: {
        tipo: 'salida',
        productoId: item.productoId,
        cantidad: item.cantidad,
        solicitudId: solicitudId
      }
    });

    // 2. Decrementar stock
    await prisma.producto.update({
      where: { id: item.productoId },
      data: { stock: { decrement: item.cantidad } }
    });

    // 3. CARGAR A CUENTA DEL PACIENTE
    await prisma.transaccionCuenta.create({
      data: {
        cuentaId: solicitud.cuentaId, // ← Debe existir
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio, // ← Usar PRECIO de venta
        total: item.cantidad * item.producto.precio
      }
    });
  }

  // 4. Marcar solicitud como surtida
  await prisma.solicitudProductos.update({
    where: { id: solicitudId },
    data: { estado: 'surtida' }
  });
});
```

---

### FLUJO 3: ADMINISTRADOR - Gestión Financiera

#### 3.1 Reportes de Ingresos/Egresos
- [ ] **Endpoint:** `GET /api/reports/financial?tipo=ingresos` existe
- [ ] **Endpoint:** `GET /api/reports/financial?tipo=egresos` existe
- [ ] **Validación:** Reportes incluyen desglose por fuente (productos, servicios, habitaciones, quirófanos)
- [ ] **Validación:** Comparación con períodos anteriores funciona
- [ ] **Permisos:** Solo `administrador` y `socio` tienen acceso

---

#### 3.2 Análisis de Médicos Top
- [ ] **Endpoint:** `GET /api/reports/top-doctors?periodo=mes` existe
- [ ] **Validación:** Calcula ingresos generados por médico
- [ ] **Validación:** Incluye: pacientes atendidos, cirugías, ingresos totales
- [ ] **Validación:** Ranking ordenado por ingresos descendente

---

#### 3.3 Autorización de Cuentas por Cobrar
- [ ] **Endpoint:** `PUT /api/billing/accounts-receivable/:id/authorize` existe
- [ ] **VALIDACIÓN:** Solo rol `administrador` puede ejecutar
- [ ] **Validación:** Se registra `autorizadoPor` en BD
- [ ] **Validación:** Auditoría registra la autorización

---

### FLUJO ADICIONAL: Tabla de Ocupación en Tiempo Real

#### 4.1 Endpoint de Ocupación
- [ ] **Endpoint:** `GET /api/dashboard/ocupacion` existe
- [ ] **Validación:** Retorna consultorios, habitaciones, quirófanos
- [ ] **Validación:** Incluye estado (ocupado/disponible/mantenimiento/programado)
- [ ] **Validación:** Información de paciente/médico actual si está ocupado

**Respuesta esperada:**
```json
{
  "consultorioGeneral": {
    "total": 1,
    "ocupados": 1,
    "disponibles": 0,
    "detalle": [
      {
        "numero": 1,
        "estado": "ocupado",
        "pacienteActual": {
          "nombre": "Juan Pérez",
          "fechaIngreso": "2025-11-06T08:00:00"
        },
        "medicoAsignado": "Dr. Carlos Ramírez"
      }
    ]
  },
  "habitaciones": { /* ... */ },
  "quirofanos": { /* ... */ }
}
```

---

#### 4.2 Componente Frontend
- [ ] **Componente:** `src/components/dashboard/OcupacionTable.tsx` existe
- [ ] **Validación:** Se renderiza en dashboard de TODOS los roles
- [ ] **Validación:** Actualiza cada 30 segundos (polling)
- [ ] **Validación:** Muestra indicadores visuales (🔴 ocupado, 🟢 disponible, 🟡 programado)

---

## 🧪 SCRIPT DE VALIDACIÓN AUTOMATIZADO

```bash
#!/bin/bash
# validar_flujos_criticos.sh

echo "🔍 VALIDACIÓN DE FLUJOS DE TRABAJO CRÍTICOS"
echo "=========================================="

# Variables
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
TOKEN_ADMIN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Token de admin
TOKEN_CAJERO="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Token de cajero

echo ""
echo "📊 FLUJO 1: CAJERO"
echo "-------------------"

# 1.4 Verificar anticipo $10,000
echo "Verificando anticipo automático de \$10,000..."
grep -q "10000" backend/routes/hospitalization.routes.js
if [ $? -eq 0 ]; then
  echo "✅ Anticipo de \$10,000 encontrado en código"
else
  echo "❌ Anticipo de \$10,000 NO encontrado en código"
fi

# 1.5 Verificar cargos automáticos de habitaciones
echo "Verificando cargos automáticos de habitaciones..."
grep -q "servicioHabitacion\|servicio_habitacion" backend/routes/hospitalization.routes.js backend/routes/rooms.routes.js
if [ $? -eq 0 ]; then
  echo "✅ Lógica de cargos de habitación encontrada"
else
  echo "❌ Lógica de cargos de habitación NO encontrada"
fi

# 1.6 Verificar cargos automáticos de quirófanos
echo "Verificando cargos automáticos de quirófanos..."
grep -q "servicioQuirofano\|servicio_quirofano" backend/routes/quirofanos.routes.js
if [ $? -eq 0 ]; then
  echo "✅ Lógica de cargos de quirófano encontrada"
else
  echo "❌ Lógica de cargos de quirófano NO encontrada"
fi

echo ""
echo "📦 FLUJO 2: ALMACÉN"
echo "-------------------"

# 2.1 Verificar campos costo y precio en Producto
echo "Verificando campos costo/precio en modelo Producto..."
grep -A 20 "model Producto" backend/prisma/schema.prisma | grep -q "costo.*Float"
if [ $? -eq 0 ]; then
  echo "✅ Campo 'costo' encontrado en modelo Producto"
else
  echo "❌ Campo 'costo' NO encontrado en modelo Producto"
fi

grep -A 20 "model Producto" backend/prisma/schema.prisma | grep -q "precio.*Float"
if [ $? -eq 0 ]; then
  echo "✅ Campo 'precio' encontrado en modelo Producto"
else
  echo "❌ Campo 'precio' NO encontrado en modelo Producto"
fi

echo ""
echo "💼 FLUJO 3: ADMINISTRADOR"
echo "-------------------------"

# 3.1 Verificar endpoint de reportes financieros
echo "Verificando endpoint de reportes financieros..."
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_ADMIN" \
  "$API_URL/api/reports/financial?tipo=ingresos" | grep -q "200"
if [ $? -eq 0 ]; then
  echo "✅ Endpoint de reportes financieros funciona"
else
  echo "❌ Endpoint de reportes financieros NO funciona"
fi

echo ""
echo "📊 TABLA DE OCUPACIÓN"
echo "---------------------"

# 4.1 Verificar endpoint de ocupación
echo "Verificando endpoint de ocupación..."
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_ADMIN" \
  "$API_URL/api/dashboard/ocupacion" | grep -q "200"
if [ $? -eq 0 ]; then
  echo "✅ Endpoint de ocupación funciona"
else
  echo "❌ Endpoint de ocupación NO funciona"
fi

# 4.2 Verificar componente frontend
echo "Verificando componente OcupacionTable..."
if [ -f "frontend/src/components/dashboard/OcupacionTable.tsx" ]; then
  echo "✅ Componente OcupacionTable.tsx existe"
else
  echo "❌ Componente OcupacionTable.tsx NO existe"
fi

echo ""
echo "=========================================="
echo "✅ Validación completa"
```

**Uso:**
```bash
chmod +x validar_flujos_criticos.sh
./validar_flujos_criticos.sh
```

---

## 📝 DOCUMENTAR GAPS ENCONTRADOS

Si alguna validación falla, documentar en:
`.claude/doc/DEUDA_TECNICA.md`

**Formato:**
```markdown
### Gap: [Nombre del Gap]
- **Flujo:** Cajero / Almacén / Administrador
- **Prioridad:** P0 / P1 / P2
- **Descripción:** Qué falta o no funciona
- **Impacto:** Cómo afecta al sistema
- **Solución propuesta:** Cómo implementarlo
- **Estimación:** Tiempo necesario
```

---

**Analista:** Claude Code (Sonnet 4.5)
**Fecha:** 6 de noviembre de 2025
**Versión:** 1.0.0

---

*© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial. Todos los derechos reservados.*
