# Backend - Plan de Acción Priorizado
**Fecha:** 31 de Octubre de 2025
**Objetivo:** Alcanzar estado production-ready en 2-3 semanas (MVP) o 2-3 meses (óptimo)

---

## SEMANA 1: SEGURIDAD CRÍTICA (5 días)

### 🔴 DÍA 1-2: Eliminar Vulnerabilidad Passwords

**Archivo:** `backend/routes/auth.routes.js` líneas 64-84

**Código a eliminar:**
```javascript
} else {
  // ⚠️ Para migración gradual: verificar contraseñas conocidas
  const knownPasswords = {
    'admin123': user.username === 'admin',
    'cajero123': user.username === 'cajero1',
    'enfermero123': user.username === 'enfermero1',
    'medico123': user.username === 'especialista1',
    'residente123': user.username === 'residente1',
    'almacen123': user.username === 'almacen1',
    'socio123': user.username === 'socio1'
  };
  
  if (knownPasswords[password]) {
    passwordValid = true;
    // Actualizar a bcrypt hash
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    });
  }
}
```

**Código nuevo:**
```javascript
// Verificar contraseña con bcrypt
if (!user.passwordHash || !user.passwordHash.startsWith('$2')) {
  return res.status(403).json({
    success: false,
    message: 'Su cuenta requiere actualización de seguridad. Contacte al administrador.'
  });
}

passwordValid = await bcrypt.compare(password, user.passwordHash);
```

**Testing:** Verificar que todos los usuarios de seed tienen bcrypt

---

### 🔴 DÍA 3: Agregar Índices de Base de Datos

**Archivo:** `backend/prisma/schema.prisma`

**Agregar los siguientes índices:**

```prisma
model Paciente {
  // ... campos existentes ...
  
  @@index([numeroExpediente])
  @@index([nombre, apellidoPaterno])
  @@index([fechaNacimiento])
  @@index([activo])
  @@index([curp])
}

model Producto {
  // ... campos existentes ...
  
  @@index([codigo])
  @@index([categoria, activo])
  @@index([stockActual])
  @@index([proveedorId])
}

model CuentaPaciente {
  // ... campos existentes ...
  
  @@index([estado, tipoAtencion])
  @@index([pacienteId, estado])
  @@index([fechaApertura])
  @@index([habitacionId])
}

model Factura {
  // ... campos existentes ...
  
  @@index([estado, fechaVencimiento])
  @@index([pacienteId, estado])
  @@index([numeroFactura])
  @@index([fechaFactura])
}

model MovimientoInventario {
  // ... campos existentes ...
  
  @@index([productoId, tipoMovimiento])
  @@index([fechaMovimiento])
  @@index([usuarioId])
}
```

**Comandos:**
```bash
cd backend
npx prisma migrate dev --name add_critical_indexes
npx prisma generate
```

**Testing:** Verificar que queries de búsqueda son más rápidas

---

### 🔴 DÍA 4-5: Configurar Timeouts en Transacciones

**Archivos afectados:**
- `backend/server-modular.js` (línea 489)
- `backend/routes/hospitalization.routes.js`
- Cualquier otro uso de `prisma.$transaction`

**Patrón a aplicar:**
```javascript
// ❌ ANTES:
await prisma.$transaction(async (tx) => {
  // ... operaciones
});

// ✅ DESPUÉS:
await prisma.$transaction(async (tx) => {
  // ... operaciones
}, {
  maxWait: 5000,  // Espera máximo 5s para adquirir lock
  timeout: 10000, // Timeout de ejecución 10s
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
});
```

**Testing:** Verificar que transacciones largas no cuelgan el sistema

---

## SEMANA 2: VALIDACIONES Y REFINAMIENTO (5 días)

### 🟡 DÍA 6-7: Implementar Blacklist JWT (Redis)

**Archivos nuevos:**
- `backend/utils/token-blacklist.js`
- `backend/middleware/blacklist.middleware.js`

**Código:**
```javascript
// utils/token-blacklist.js
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

client.on('error', (err) => console.error('Redis error:', err));
await client.connect();

async function blacklistToken(token, expiresIn = 86400) {
  await client.setEx(`bl_${token}`, expiresIn, 'true');
}

async function isBlacklisted(token) {
  const result = await client.get(`bl_${token}`);
  return result === 'true';
}

module.exports = { blacklistToken, isBlacklisted };
```

**Integración en auth.middleware.js:**
```javascript
const { isBlacklisted } = require('../utils/token-blacklist');

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  // Verificar blacklist
  if (await isBlacklisted(token)) {
    return res.status(401).json({ message: 'Token revocado' });
  }
  
  // ... resto del código
};
```

**Modificar logout:**
```javascript
router.post('/logout', authenticateToken, async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  await blacklistToken(token, 86400); // 24h
  res.json({ success: true, message: 'Logout exitoso' });
});
```

---

### 🟡 DÍA 8-9: Reemplazar Console.log por Morgan

**Archivo:** `backend/server-modular.js` línea 61-64

**Eliminar:**
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

**Agregar:**
```javascript
const morgan = require('morgan');

// Morgan para HTTP logging
app.use(morgan('combined', {
  stream: logger.stream,
  skip: (req, res) => {
    // En producción, solo loggear errores
    return process.env.NODE_ENV === 'production' && res.statusCode < 400;
  }
}));
```

---

### 🟡 DÍA 10: Habilitar CSP en Helmet

**Archivo:** `backend/server-modular.js` línea 20

**Cambiar:**
```javascript
app.use(helmet({
  contentSecurityPolicy: false, // ❌ Deshabilitado
  crossOriginEmbedderPolicy: false
}));
```

**Por:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}));
```

---

## SEMANA 3 (OPCIONAL): TESTING CRÍTICO (5 días)

### 🟢 DÍA 11-12: Corregir Tests de Inventory

**Archivos:** `backend/tests/inventory.test.js`

**Problemas conocidos:**
- 11/29 tests passing (38%)
- Problemas de nomenclatura (nombreUsuario → username)
- Imports incorrectos

**Plan:**
1. Actualizar helpers de test
2. Corregir imports
3. Actualizar assertions

---

### 🟢 DÍA 13-14: Agregar Tests para Quirófanos

**Archivo nuevo:** `backend/tests/quirofanos.test.js`

**Tests mínimos:**
```javascript
describe('Quirófanos Routes', () => {
  describe('GET /api/quirofanos', () => {
    it('debe retornar lista de quirófanos');
    it('debe filtrar por estado');
    it('debe paginar correctamente');
  });

  describe('POST /api/quirofanos', () => {
    it('debe crear quirófano con datos válidos');
    it('debe validar número único');
    it('debe generar servicio automático');
  });

  describe('POST /api/quirofanos/cirugias', () => {
    it('debe programar cirugía');
    it('debe validar disponibilidad');
    it('debe generar cargo automático');
  });
});
```

---

### 🟢 DÍA 15: Agregar Tests para Hospitalización

**Archivo nuevo:** `backend/tests/hospitalization.test.js`

**Tests mínimos:**
```javascript
describe('Hospitalización Routes', () => {
  describe('POST /api/hospitalization/admissions', () => {
    it('debe crear ingreso con anticipo automático');
    it('debe validar permisos por rol');
    it('debe ocupar habitación');
  });

  describe('PUT /api/patient-accounts/:id/close', () => {
    it('debe cerrar cuenta completa');
    it('debe validar nota de alta');
    it('debe calcular cargos de habitación');
    it('debe generar factura correctamente');
    it('debe liberar habitación');
  });
});
```

---

## CHECKLIST DE VERIFICACIÓN

### ✅ Post-Semana 1 (Seguridad)
- [ ] Vulnerabilidad de passwords eliminada
- [ ] 15 índices críticos agregados en BD
- [ ] Timeouts configurados en todas las transacciones
- [ ] Tests de auth siguen pasando (10/10)
- [ ] Búsquedas de pacientes <500ms (con datos de prueba)

### ✅ Post-Semana 2 (Validaciones)
- [ ] Blacklist JWT implementada con Redis
- [ ] Logout funcional (tokens se invalidan)
- [ ] 0 console.log residuales
- [ ] CSP habilitado en Helmet
- [ ] Morgan logging activo

### ✅ Post-Semana 3 (Testing - Opcional)
- [ ] Tests inventory >80% passing
- [ ] Tests quirófanos implementados
- [ ] Tests hospitalización implementados
- [ ] Overall pass rate >70%

---

## COMANDOS DE VERIFICACIÓN

```bash
# Verificar índices creados
cd backend
npx prisma migrate status
psql -d hospital_management -c "\d+ pacientes"

# Verificar tests
npm test -- --coverage

# Verificar logging
grep -r "console.log\|console.error" routes/*.js

# Verificar Redis
redis-cli ping
redis-cli KEYS "bl_*"

# Verificar performance (después de índices)
psql -d hospital_management -c "EXPLAIN ANALYZE SELECT * FROM pacientes WHERE nombre ILIKE '%Juan%';"
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Baseline | Target Semana 2 | Target Semana 3 |
|---------|----------|-----------------|-----------------|
| Vulnerabilidades críticas | 1 | 0 ✅ | 0 ✅ |
| Índices BD | 4 | 19 ✅ | 19 ✅ |
| Tests passing | 52% | 52% | 70% ✅ |
| Console statements | 1 | 0 ✅ | 0 ✅ |
| Logout funcional | ❌ | ✅ | ✅ |
| Búsquedas <500ms | ❌ | ✅ | ✅ |

---

## PRÓXIMOS PASOS POST-ACCIÓN

1. **Deployment a staging** con correcciones P0
2. **Load testing** con datos reales
3. **Monitoreo** con New Relic/Datadog
4. **Documentación** OpenAPI/Swagger
5. **Refactoring** archivos >1,000 líneas

---

**Última actualización:** 31 de Octubre de 2025
**Responsable:** Backend Team
**Siguiente revisión:** Post-Semana 2
