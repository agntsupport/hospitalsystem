# Plan de Acción - Sistema de Gestión Hospitalaria
**Duración:** 4 semanas (20 días hábiles)
**Fecha Inicio:** 7 de noviembre de 2025
**Responsable:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial

---

## 🎯 OBJETIVOS GLOBALES

1. **Semana 1:** Resolver 2 blockers P0 → Sistema listo para staging ✅
2. **Semana 2:** Tests E2E 100% passing + optimizaciones backend ✅
3. **Semana 3-4:** Cobertura tests 52% + features completas + bundle optimizado ✅
4. **Resultado Final:** Sistema production-ready (9.5/10) ✅

---

## 📅 SEMANA 1: BLOCKERS CRÍTICOS (P0) 🚨

**Objetivo:** Eliminar 2 blockers que impiden deployment a staging
**Esfuerzo:** 35 horas | **Meta:** Sistema funcional para staging

### Día 1-2: BLOCKER-001 - Integración Solicitudes → POS (8h)

**Problema:** Productos surtidos NO se cargan automáticamente a cuenta del paciente

**Tareas:**
```
□ Backend (5h):
  □ Modificar PUT /api/solicitudes/:id/status (backend/routes/solicitudes.routes.js)
    - Al cambiar estado a "completada"
    - Iterar sobre solicitud.items
    - Por cada item, llamar a addItemToAccount() del POS
    - Registrar en auditoría
  □ Agregar validación: verificar que cuenta POS existe
  □ Agregar rollback: si falla carga POS, revertir estado a "en_progreso"

□ Tests (2h):
  □ Test unitario: surtir solicitud carga items a cuenta POS
  □ Test integración: verificar monto total actualizado
  □ Test edge case: solicitud sin cuenta POS activa (error 404)

□ E2E (1h):
  □ Extender flujo2-almacen-completo.spec.ts
  □ Validar que productos aparecen en cuenta del paciente
```

**Código Específico:**
```javascript
// backend/routes/solicitudes.routes.js - Línea ~180 (modificar)

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    // Actualizar estado
    const solicitud = await prisma.solicitud.update({
      where: { id: parseInt(id) },
      data: { estado, observaciones },
      include: {
        items: {
          include: { producto: true }
        },
        paciente: true
      }
    });

    // NUEVO: Si estado = "completada", cargar a cuenta POS
    if (estado === 'completada' && solicitud.pacienteId) {
      // Buscar cuenta POS activa del paciente
      const cuentaPOS = await prisma.cuentaPOS.findFirst({
        where: {
          pacienteId: solicitud.pacienteId,
          estado: 'abierta'
        }
      });

      if (!cuentaPOS) {
        return res.status(404).json({
          error: 'No se encontró cuenta POS activa para el paciente'
        });
      }

      // Cargar cada producto a la cuenta
      for (const item of solicitud.items) {
        await prisma.servicioPOS.create({
          data: {
            cuentaId: cuentaPOS.id,
            productoId: item.productoId,
            tipo: 'producto',
            descripcion: item.producto.nombre,
            cantidad: item.cantidadAprobada || item.cantidadSolicitada,
            precioUnitario: item.producto.precioVenta,
            subtotal: (item.cantidadAprobada || item.cantidadSolicitada) * item.producto.precioVenta
          }
        });
      }

      // Recalcular total de la cuenta
      const servicios = await prisma.servicioPOS.findMany({
        where: { cuentaId: cuentaPOS.id }
      });
      const nuevoTotal = servicios.reduce((sum, s) => sum + s.subtotal, 0);

      await prisma.cuentaPOS.update({
        where: { id: cuentaPOS.id },
        data: { total: nuevoTotal }
      });

      // Auditoría
      await prisma.auditLog.create({
        data: {
          usuario: req.user.username,
          accion: 'SOLICITUD_COMPLETADA_CARGADA_POS',
          entidad: 'solicitudes',
          entidadId: solicitud.id,
          detalles: `Solicitud ${id} completada. ${solicitud.items.length} productos cargados a cuenta POS ${cuentaPOS.id}`
        }
      });
    }

    res.json(solicitud);
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ error: 'Error actualizando solicitud' });
  }
});
```

**Checklist de Validación:**
- [ ] Almacén surte solicitud → productos aparecen en cuenta POS
- [ ] Monto total de cuenta POS se actualiza correctamente
- [ ] Si no existe cuenta activa → error 404 claro
- [ ] Auditoría registra la operación
- [ ] Tests pasan (3/3)

**Entregable:** Integración solicitudes→POS funcional y testeada

---

### Día 3-4: BLOCKER-002 - Análisis de Médicos Top (12h)

**Problema:** Administrador no puede ver qué médicos generan más ingresos

**Tareas:**

**Backend (6h):**
```
□ Crear GET /api/reports/top-doctors (nuevo archivo o extender reports.routes.js)
  □ Query: JOIN cuentas_pos + servicios_pos → GROUP BY medicoAsignadoId
  □ Calcular: total facturado, pacientes atendidos, promedio por paciente
  □ Filtros: periodo (mes|trimestre|año), especialidad
  □ Ordenar: por ingresos DESC
  □ Límite: top 10

□ Crear GET /api/reports/doctor-performance/:id
  □ Detalle individual de un médico
  □ Gráfico evolución mensual
  □ Breakdown por tipo de servicio

□ Tests (3 casos)
```

**Código Backend:**
```javascript
// backend/routes/reports.routes.js - Agregar

router.get('/top-doctors', authMiddleware, async (req, res) => {
  try {
    const { periodo = 'mes', especialidad } = req.query;

    // Calcular rango de fechas
    const fechaInicio = new Date();
    if (periodo === 'mes') fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    else if (periodo === 'trimestre') fechaInicio.setMonth(fechaInicio.getMonth() - 3);
    else if (periodo === 'año') fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);

    // Query con agregaciones
    const topDoctors = await prisma.$queryRaw`
      SELECT
        e.id,
        e.nombre,
        e.apellido,
        e.especialidad,
        COUNT(DISTINCT cp.id) as pacientes_atendidos,
        COUNT(DISTINCT cp.pacienteId) as pacientes_unicos,
        SUM(cp.total) as ingresos_totales,
        AVG(cp.total) as promedio_por_paciente,
        COUNT(DISTINCT h.id) as hospitalizaciones,
        COUNT(DISTINCT c.id) as cirugias
      FROM empleados e
      LEFT JOIN cuentas_pos cp ON cp.medicoAsignadoId = e.id
      LEFT JOIN hospitalizaciones h ON h.medicoAsignadoId = e.id
      LEFT JOIN cirugias c ON c.medicoAsignadoId = e.id
      WHERE e.rol IN ('medico_residente', 'medico_especialista')
        AND cp.fechaCreacion >= ${fechaInicio}
        ${especialidad ? Prisma.sql`AND e.especialidad = ${especialidad}` : Prisma.empty}
      GROUP BY e.id, e.nombre, e.apellido, e.especialidad
      ORDER BY ingresos_totales DESC
      LIMIT 10
    `;

    res.json({
      periodo,
      fechaInicio,
      topDoctors: topDoctors.map(d => ({
        ...d,
        ingresos_totales: parseFloat(d.ingresos_totales || 0),
        promedio_por_paciente: parseFloat(d.promedio_por_paciente || 0)
      }))
    });
  } catch (error) {
    console.error('Error obteniendo top doctors:', error);
    res.status(500).json({ error: 'Error obteniendo top doctors' });
  }
});
```

**Frontend (4h):**
```
□ Componente TopDoctorsTable (frontend/src/components/reports/)
  □ Tabla Material-UI con columnas:
    - Nombre, Especialidad, Pacientes, Ingresos, Promedio
  □ Ordenable por columna
  □ Filtros: periodo, especialidad

□ Gráfico de barras (Chart.js o Recharts)
  □ Top 10 médicos por ingresos

□ Integrar en ReportsPage (tab "Médicos Top")
```

**Código Frontend:**
```typescript
// frontend/src/components/reports/TopDoctorsTable.tsx

import { useState, useEffect } from 'react';
import { getTopDoctors } from '../../services/reports.service';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Select, MenuItem, Typography
} from '@mui/material';

export const TopDoctorsTable = () => {
  const [doctors, setDoctors] = useState([]);
  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    loadDoctors();
  }, [periodo]);

  const loadDoctors = async () => {
    const data = await getTopDoctors({ periodo });
    setDoctors(data.topDoctors);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Médicos con Mayor Facturación</Typography>

      <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
        <MenuItem value="mes">Último Mes</MenuItem>
        <MenuItem value="trimestre">Último Trimestre</MenuItem>
        <MenuItem value="año">Último Año</MenuItem>
      </Select>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Médico</TableCell>
            <TableCell>Especialidad</TableCell>
            <TableCell align="right">Pacientes</TableCell>
            <TableCell align="right">Ingresos</TableCell>
            <TableCell align="right">Promedio</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {doctors.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.nombre} {doc.apellido}</TableCell>
              <TableCell>{doc.especialidad}</TableCell>
              <TableCell align="right">{doc.pacientes_unicos}</TableCell>
              <TableCell align="right">${doc.ingresos_totales.toLocaleString()}</TableCell>
              <TableCell align="right">${doc.promedio_por_paciente.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
```

**Tests (2h):**
```
□ Backend:
  □ GET /api/reports/top-doctors retorna top 10
  □ Filtro por periodo funciona
  □ Filtro por especialidad funciona
  □ Ordenamiento correcto por ingresos DESC
  □ Cálculos correctos (sum, avg, count)

□ Frontend:
  □ Componente renderiza sin errores
  □ Cambio de periodo recarga datos
  □ Datos se muestran formateados correctamente
```

**Checklist de Validación:**
- [ ] Endpoint /api/reports/top-doctors retorna top 10 médicos
- [ ] Cálculos de ingresos son correctos
- [ ] Filtros por periodo y especialidad funcionan
- [ ] Frontend muestra tabla con datos correctos
- [ ] Gráfico de barras se renderiza
- [ ] Tests pasan (5/5 backend, 3/3 frontend)

**Entregable:** Análisis de médicos top funcional y desplegado

---

### Día 4-5: Correcciones Tests E2E (7h)

**P0-E2E-001: Agregar data-testid en formularios (4h)**

**Problema:** Selectores genéricos fallan en formularios

**Archivos a modificar:**
1. `frontend/e2e/flujo1-cajero-completo.spec.ts` (15 selectores)
2. `frontend/e2e/flujo2-almacen-completo.spec.ts` (8 selectores)
3. `frontend/e2e/flujo3-admin-completo.spec.ts` (6 selectores)

**Patrón de corrección:**
```typescript
// ❌ ANTES:
await page.click('button:has-text("Nuevo")');

// ✅ DESPUÉS:
await page.getByTestId('new-patient-button').click();

// O más robusto:
await page.locator('button[data-testid="new-patient-button"]').click();
```

**Tareas:**
```
□ Crear helpers reutilizables (frontend/e2e/helpers/selectors.ts)
  - fillTextField(page, testId, value)
  - clickButton(page, testId)
  - selectOption(page, testId, value)

□ Refactorizar flujo1-cajero-completo.spec.ts
  - Login: username-input, password-input (YA EXISTEN)
  - Registro paciente: todos los campos con data-testid
  - Hospitalización: campos con data-testid
  - Alta: campos con data-testid

□ Ejecutar y validar: 55 tests → 100% passing
```

**P0-E2E-005: Corregir test alta hospitalaria (3h)**

**Problema:** Test solo llena 2 campos, backend requiere 10+

**Código a corregir:**
```typescript
// frontend/e2e/flujo1-cajero-completo.spec.ts - Línea ~270

test('1.9 - Dar Alta al Paciente', async () => {
  // ... navegación ...

  // ❌ ACTUAL (solo 2 campos):
  await page.fill('[name="diagnosticoFinal"]', 'Apendicitis tratada exitosamente');
  await page.fill('[name="resumen"]', 'Paciente evolucionó favorablemente');

  // ✅ AGREGAR campos faltantes:
  await page.fill('[name="medicoAlta"]', 'Dr. Especialista');
  await page.fill('[name="indicacionesAlta"]', 'Reposo 7 días, control en 15 días');
  await page.fill('[name="medicamentos"]', 'Amoxicilina 500mg cada 8h por 7 días');
  await page.fill('[name="proximaCita"]', '2025-11-20');
  await page.fill('[name="observaciones"]', 'Paciente consciente, orientado');
  await page.selectOption('[name="tipoAlta"]', 'mejoria');
  await page.fill('[name="firmaDigital"]', 'Dr. Especialista - Ced. 123456');

  // Esperar mensaje de éxito
  await expect(page.locator('text=/alta.*éxito/i')).toBeVisible({ timeout: 5000 });
});
```

**Checklist de Validación:**
- [ ] Helpers de selectores creados y funcionando
- [ ] flujo1 refactorizado con selectores robustos
- [ ] Test de alta llena TODOS los campos requeridos
- [ ] 55 tests E2E ejecutan → 100% passing

**Entregable:** Tests E2E corregidos y pasando

---

### Día 5: Verificar cargos automáticos quirófano (8h)

**WARNING-001: Cargos de quirófano no verificados**

**Tareas:**
```
□ Análisis de código (2h):
  □ Revisar backend/routes/quirofanos.routes.js
  □ Buscar función que genera cargo al completar cirugía
  □ Verificar que se llama en el momento correcto

□ Si NO existe implementación (6h):
  □ Implementar función generarCargoQuirofano()
  □ Llamar al cambiar estado cirugía a "completada"
  □ Crear servicio POS con código "QUIR-{numero}"
  □ Tests (3 casos)

□ Si SÍ existe (2h):
  □ Validar con test E2E que funciona
  □ Documentar el flujo
```

**Código esperado:**
```javascript
// backend/routes/quirofanos.routes.js

const generarCargoQuirofano = async (cirugiaId) => {
  const cirugia = await prisma.cirugia.findUnique({
    where: { id: cirugiaId },
    include: {
      quirofano: true,
      paciente: {
        include: {
          cuentasPOS: {
            where: { estado: 'abierta' },
            orderBy: { fechaCreacion: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  if (!cirugia.paciente.cuentasPOS[0]) {
    throw new Error('No se encontró cuenta POS activa');
  }

  const cuentaPOS = cirugia.paciente.cuentasPOS[0];
  const duracionHoras = Math.ceil(
    (new Date(cirugia.horaFin) - new Date(cirugia.horaInicio)) / (1000 * 60 * 60)
  );

  await prisma.servicioPOS.create({
    data: {
      cuentaId: cuentaPOS.id,
      tipo: 'quirofano',
      codigo: `QUIR-${cirugia.quirofano.numero}`,
      descripcion: `Quirófano ${cirugia.quirofano.numero} - ${cirugia.tipoCirugia}`,
      cantidad: duracionHoras,
      precioUnitario: cirugia.quirofano.precioPorHora || 5000,
      subtotal: duracionHoras * (cirugia.quirofano.precioPorHora || 5000),
      servicioId: cirugiaId
    }
  });

  // Actualizar total cuenta
  const servicios = await prisma.servicioPOS.findMany({
    where: { cuentaId: cuentaPOS.id }
  });
  const nuevoTotal = servicios.reduce((sum, s) => sum + s.subtotal, 0);

  await prisma.cuentaPOS.update({
    where: { id: cuentaPOS.id },
    data: { total: nuevoTotal }
  });
};
```

**Checklist de Validación:**
- [ ] Función generarCargoQuirofano() implementada
- [ ] Se llama al completar cirugía (estado = "completada")
- [ ] Cargo se crea con monto correcto (duracion * precio_hora)
- [ ] Total de cuenta POS se actualiza
- [ ] Test unitario pasa
- [ ] Test E2E valida el cargo

**Entregable:** Cargos de quirófano funcionando correctamente

---

### Resumen Semana 1

**Entregables:**
- ✅ Integración solicitudes→POS funcionando
- ✅ Análisis médicos top implementado (backend + frontend)
- ✅ Tests E2E 100% passing (55/55)
- ✅ Cargos quirófano verificados y funcionando

**Métricas:**
- Blockers P0: 2 → 0 ✅
- Tests E2E passing: 9/55 (16%) → 55/55 (100%) ✅
- Sistema listo para staging: ✅

**Decisión:** Deploy a staging para validación con usuarios

---

## 📅 SEMANA 2: OPTIMIZACIONES BACKEND + PERFORMANCE (P1) 🟡

**Objetivo:** Optimizar performance backend + eliminar vulnerabilidades menores
**Esfuerzo:** 35 horas

### Día 6-7: Eliminar N+1 Queries (11 endpoints) - 6h

**Endpoints afectados:**
```javascript
// 1. GET /api/patients (backend/routes/patients.routes.js)
const patients = await prisma.paciente.findMany({
  include: {
    hospitalizaciones: true,  // AGREGAR
    cuentasPOS: true          // AGREGAR
  }
});

// 2. GET /api/hospitalization/admissions
const admissions = await prisma.hospitalizacion.findMany({
  include: {
    paciente: true,           // AGREGAR
    habitacion: true,         // AGREGAR
    medicoAsignado: true      // AGREGAR
  }
});

// 3. GET /api/pos/accounts
const accounts = await prisma.cuentaPOS.findMany({
  include: {
    paciente: true,           // AGREGAR
    servicios: true,          // AGREGAR
    medicoAsignado: true      // AGREGAR
  }
});

// 4-11. Repetir patrón en: quirofanos, cirugias, solicitudes, inventory, etc.
```

**Proceso:**
```
Día 6:
□ Identificar queries sin include (usar console.time/timeEnd)
□ Agregar includes apropiados (6 endpoints)
□ Medir mejora de latencia con Postman

Día 7:
□ Continuar con 5 endpoints restantes
□ Ejecutar suite de tests (validar no se rompió nada)
□ Documentar mejoras en CHANGELOG
```

**Validación:**
- Latencia de listados: antes vs después (objetivo: -70-90%)
- Tests backend: 415/415 passing (mantener 100%)

---

### Día 8: Redis Cache (6h)

**Instalación:**
```bash
cd backend
npm install redis
```

**Implementación:**
```javascript
// backend/utils/cache.js (NUEVO)

const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

client.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  if (!client.isOpen) await client.connect();
};

const cacheMiddleware = (ttl = 60) => async (req, res, next) => {
  await connectRedis();
  const key = `cache:${req.originalUrl}`;

  try {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    res.originalJson = res.json;
    res.json = (data) => {
      client.setEx(key, ttl, JSON.stringify(data));
      res.originalJson(data);
    };
    next();
  } catch (error) {
    next();
  }
};

module.exports = { cacheMiddleware, client };
```

**Endpoints a cachear:**
```javascript
// backend/routes/rooms.routes.js
router.get('/occupation', cacheMiddleware(30), async (req, res) => {
  // TTL: 30 segundos (tabla ocupación se actualiza cada 30s)
});

// backend/routes/inventory.routes.js
router.get('/products', cacheMiddleware(300), async (req, res) => {
  // TTL: 5 minutos (productos cambian poco)
});

// backend/routes/reports.routes.js
router.get('/stats', cacheMiddleware(60), async (req, res) => {
  // TTL: 1 minuto (stats se pueden cachear brevemente)
});
```

**Invalidación de cache:**
```javascript
// Cuando se modifica un recurso
router.post('/products', authMiddleware, async (req, res) => {
  // ... crear producto ...
  await client.del('cache:/api/inventory/products');  // Invalidar cache
  res.json(newProduct);
});
```

**Validación:**
- Primer request: consulta BD
- Requests subsecuentes (dentro de TTL): retornan de cache
- Reducción carga BD: -40-60%

---

### Día 9: Eliminar console.logs + CSRF Protection (8h)

**Parte 1: Eliminar 208 console.logs (4h)**

**Crear logger wrapper:**
```typescript
// frontend/src/utils/logger.ts

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: any[]) => {
    if (isDevelopment) console.log('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment) console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    // Siempre loggear errores (incluso en prod)
    console.error('[ERROR]', ...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) console.debug('[DEBUG]', ...args);
  }
};
```

**Buscar y reemplazar:**
```bash
# Buscar todos los console.log
grep -r "console.log" frontend/src --include="*.ts" --include="*.tsx"

# Reemplazar con logger.info
# Usar search & replace en VSCode:
# Buscar: console\.log\(
# Reemplazar: logger.info(
```

**Validación:**
- Build de producción: 0 console.logs en código bundled
- Solo logger.error en producción

---

**Parte 2: CSRF Protection (4h)**

**Instalación:**
```bash
cd backend
npm install csurf cookie-parser
```

**Implementación:**
```javascript
// backend/server-modular.js

const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// CSRF protection en rutas que modifican datos
const csrfProtection = csrf({ cookie: true });

// Endpoint para obtener token CSRF
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Aplicar a rutas POST/PUT/DELETE
app.use('/api/patients', csrfProtection);
app.use('/api/pos', csrfProtection);
// ... etc
```

**Frontend:**
```typescript
// frontend/src/services/api.ts

// Obtener token CSRF al iniciar app
const getCsrfToken = async () => {
  const response = await axios.get('/api/csrf-token');
  return response.data.csrfToken;
};

// Incluir en headers de requests
axios.interceptors.request.use(async (config) => {
  if (['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
    const csrfToken = await getCsrfToken();
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

**Validación:**
- POST sin token CSRF → 403 Forbidden
- POST con token válido → 200 OK

---

### Día 10: Rate Limiting Robusto + Testing (7h)

**Rate limiting por endpoint:**
```javascript
// backend/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

// Rate limiter para login (más estricto)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta en 15 minutos.'
});

// Rate limiter para quick-sale (transacciones rápidas)
const quickSaleLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20, // 20 ventas por minuto max
  message: 'Límite de ventas rápidas excedido. Espera 1 minuto.'
});

// Rate limiter para invoices
const invoiceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 50, // 50 facturas por 5 min
  message: 'Límite de facturación excedido. Espera 5 minutos.'
});

module.exports = { loginLimiter, quickSaleLimiter, invoiceLimiter };
```

**Aplicar en rutas:**
```javascript
// backend/routes/auth.routes.js
router.post('/login', loginLimiter, async (req, res) => { ... });

// backend/routes/pos.routes.js
router.post('/quick-sale', quickSaleLimiter, async (req, res) => { ... });

// backend/routes/billing.routes.js
router.post('/invoices', invoiceLimiter, async (req, res) => { ... });
```

**Tests (3h):**
```javascript
// backend/tests/rateLimiter.test.js

describe('Rate Limiting', () => {
  test('Bloquea después de 5 intentos de login', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ username: 'test', password: 'wrong' });
    }
    const response = await request(app).post('/api/auth/login').send({ username: 'test', password: 'wrong' });
    expect(response.status).toBe(429);
  });
});
```

**Validación:**
- Login: 5 intentos → bloqueado 15min
- Quick-sale: 20 ventas/min → bloqueado 1min
- Tests rate limiting pasan (3/3)

---

### Resumen Semana 2

**Entregables:**
- ✅ N+1 queries eliminados (11 endpoints)
- ✅ Redis cache implementado (3 endpoints)
- ✅ Console.logs eliminados (208 → 0)
- ✅ CSRF protection implementado
- ✅ Rate limiting robusto

**Métricas:**
- Latencia listados: -70-90% ✅
- Carga BD: -40-60% ✅
- Seguridad backend: 9.5/10 → 9.8/10 ✅

---

## 📅 SEMANA 3-4: COVERAGE TESTS + BUNDLE OPTIMIZATION (P2) 🟢🔵

### Semana 3: Tests de Componentes Críticos

**Componentes a testear (5):**
1. DischargeDialog.tsx - Alta médica (24h)
2. POSPage.tsx - Punto de venta (24h)
3. CirugiaFormDialog.tsx - Cirugías (16h)

**Páginas a testear (3):**
1. PatientsPage.tsx (16h)
2. HospitalizationPage.tsx (16h)
3. InventoryPage.tsx (12h)

**Total:** 108 horas (dividir en pareja/equipo)

---

### Semana 4: Bundle Optimization + Documentación

**Día 16-17: Bundle Optimization (16h)**
- Manual chunks vendor
- Lazy loading dialogs
- Tree shaking
- Análisis con rollup-plugin-visualizer

**Día 18-19: Documentación (16h)**
- Comentarios ABOUTME (54 archivos)
- Swagger completo (137 endpoints)
- Validadores centralizados (8 módulos)

**Día 20: Regression Testing + Release (8h)**
- Suite completa de tests
- Validación en staging
- Preparar release notes
- Deploy a producción

---

## 📊 MÉTRICAS DE PROGRESO

### Checklist General

**Semana 1:**
- [ ] BLOCKER-001 resuelto
- [ ] BLOCKER-002 resuelto
- [ ] Tests E2E 100% passing
- [ ] Cargos quirófano verificados
- [ ] Deploy a staging

**Semana 2:**
- [ ] N+1 queries eliminados
- [ ] Redis cache implementado
- [ ] Console.logs eliminados
- [ ] CSRF protection
- [ ] Rate limiting robusto

**Semana 3:**
- [ ] 5 componentes críticos testeados
- [ ] 3 páginas principales testeadas
- [ ] Cobertura frontend: 8.5% → 35%

**Semana 4:**
- [ ] Bundle size: 8.7 MB → <5 MB
- [ ] ABOUTME comments: 100%
- [ ] Swagger completo
- [ ] Deploy a producción

---

## 🎯 CALIFICACIÓN PROYECTADA

| Semana | Calificación | Estado |
|--------|--------------|--------|
| Inicio | 8.4/10 | Sistema actual |
| Semana 1 | 9.0/10 | Blockers resueltos |
| Semana 2 | 9.3/10 | Performance optimizado |
| Semana 3 | 9.4/10 | Coverage mejorado |
| Semana 4 | 9.5/10 | Production-ready |

---

**Próximo paso:** Comenzar Día 1 - BLOCKER-001 mañana 7 de noviembre.

---

*© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial*
