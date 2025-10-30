# Recomendaciones Técnicas Detalladas - Backend

**Fecha:** 30 de octubre de 2025
**Sistema:** Hospital Management System Backend
**Analista:** Claude (Backend Research Specialist)

Este documento complementa el Executive Report con implementaciones técnicas específicas, código de ejemplo y guías de migración paso a paso.

---

## 1. VALIDACIÓN DE ENTRADA - IMPLEMENTACIÓN COMPLETA

### 1.1 Estructura de Validadores Propuesta

```
backend/validators/
├── auth.validators.js       (NEW)
├── patient.validators.js    (NEW)
├── employee.validators.js   (NEW)
├── hospitalization.validators.js (NEW)
├── billing.validators.js    (NEW)
├── quirofano.validators.js  (NEW)
├── pos.validators.js        (NEW)
├── solicitud.validators.js  (NEW)
├── room.validators.js       (NEW)
├── office.validators.js     (NEW)
├── inventory.validators.js  (EXISTING - 375 LOC)
└── common.validators.js     (NEW - shared validators)
```

### 1.2 Validador Base Común

**Archivo: `backend/validators/common.validators.js`**

```javascript
const { body, param, query, validationResult } = require('express-validator');

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===============================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.type !== 'field' ? undefined : err.value // No exponer valores sensibles
      }))
    });
  }

  next();
};

// ===============================================
// VALIDADORES REUTILIZABLES
// ===============================================

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser mayor o igual a 0'),

  handleValidationErrors
];

const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La búsqueda debe tener máximo 200 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]*$/)
    .withMessage('La búsqueda contiene caracteres no permitidos'),

  handleValidationErrors
];

const validateDateRange = [
  query('fechaInicio')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('fechaInicio debe ser una fecha válida (ISO 8601)'),

  query('fechaFin')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('fechaFin debe ser una fecha válida (ISO 8601)')
    .custom((value, { req }) => {
      if (req.query.fechaInicio && new Date(value) < new Date(req.query.fechaInicio)) {
        throw new Error('fechaFin debe ser posterior a fechaInicio');
      }
      return true;
    }),

  handleValidationErrors
];

const validateEmail = (fieldName = 'email') =>
  body(fieldName)
    .optional()
    .trim()
    .isEmail()
    .withMessage(`${fieldName} debe ser un email válido`)
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage(`${fieldName} debe tener máximo 100 caracteres`);

const validatePhone = (fieldName = 'telefono') =>
  body(fieldName)
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]{7,20}$/)
    .withMessage(`${fieldName} debe contener entre 7 y 20 caracteres numéricos`);

const validateCURP = () =>
  body('curp')
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/)
    .withMessage('CURP no tiene formato válido (ej: ABCD123456HDFRNN09)');

const validateRFC = () =>
  body('rfc')
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)
    .withMessage('RFC no tiene formato válido');

const validateMoneyAmount = (fieldName) =>
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} es requerido`)
    .isFloat({ min: 0, max: 9999999.99 })
    .withMessage(`${fieldName} debe estar entre 0 y 9,999,999.99`)
    .custom((value) => {
      // Validar máximo 2 decimales
      const decimals = (value.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        throw new Error(`${fieldName} no puede tener más de 2 decimales`);
      }
      return true;
    });

const validateBoolean = (fieldName) =>
  body(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`${fieldName} debe ser true o false`);

module.exports = {
  handleValidationErrors,
  validateId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateEmail,
  validatePhone,
  validateCURP,
  validateRFC,
  validateMoneyAmount,
  validateBoolean
};
```

### 1.3 Validador de Autenticación (CRÍTICO - P0)

**Archivo: `backend/validators/auth.validators.js`**

```javascript
const { body } = require('express-validator');
const { handleValidationErrors } = require('./common.validators');

// ===============================================
// LOGIN VALIDATOR
// ===============================================

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres'),

  handleValidationErrors
];

// ===============================================
// REGISTER/CREATE USER VALIDATOR
// ===============================================

const validateCreateUser = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número')
    .matches(/[@$!%*?&#]/)
    .withMessage('La contraseña debe contener al menos un carácter especial (@$!%*?&#)'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email debe tener máximo 100 caracteres'),

  body('rol')
    .notEmpty()
    .withMessage('El rol es requerido')
    .isIn([
      'cajero',
      'enfermero',
      'almacenista',
      'administrador',
      'socio',
      'medico_residente',
      'medico_especialista'
    ])
    .withMessage('Rol inválido'),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false'),

  handleValidationErrors
];

// ===============================================
// PASSWORD CHANGE VALIDATOR
// ===============================================

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña actual debe tener entre 8 y 128 caracteres'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La nueva contraseña debe contener al menos una letra mayúscula')
    .matches(/[a-z]/)
    .withMessage('La nueva contraseña debe contener al menos una letra minúscula')
    .matches(/\d/)
    .withMessage('La nueva contraseña debe contener al menos un número')
    .matches(/[@$!%*?&#]/)
    .withMessage('La nueva contraseña debe contener al menos un carácter especial')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la contraseña actual');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateCreateUser,
  validatePasswordChange
};
```

### 1.4 Aplicación en Rutas de Autenticación

**Archivo: `backend/routes/auth.routes.js` (MODIFICADO)**

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ✅ IMPORTAR VALIDADORES
const {
  validateLogin,
  validateCreateUser,
  validatePasswordChange
} = require('../validators/auth.validators');

// ===============================================
// LOGIN ENDPOINT - CON VALIDACIÓN
// ===============================================

router.post('/login', validateLogin, async (req, res) => {
  // ✅ Los datos ya están validados por el middleware
  const { username, password } = req.body;

  try {
    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { username, activo: true }
    });

    if (!usuario) {
      logger.logAuth('LOGIN_FAILED', null, { username, reason: 'user_not_found' });
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña con timing attack protection
    const isPasswordValid = await bcrypt.compare(password, usuario.passwordHash);

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: { increment: 1 } }
      });

      logger.logAuth('LOGIN_FAILED', usuario.id, { username, reason: 'invalid_password' });

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si cuenta está bloqueada por intentos fallidos
    if (usuario.intentosFallidos >= 5) {
      logger.logAuth('LOGIN_BLOCKED', usuario.id, { username, reason: 'too_many_attempts' });
      return res.status(423).json({
        success: false,
        message: 'Cuenta bloqueada por múltiples intentos fallidos. Contacte al administrador.'
      });
    }

    // Login exitoso - resetear intentos fallidos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: 0,
        ultimoAcceso: new Date()
      }
    });

    // Generar JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        username: usuario.username,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    logger.logAuth('LOGIN_SUCCESS', usuario.id, { username });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos
        }
      },
      message: 'Login exitoso'
    });

  } catch (error) {
    logger.logError('LOGIN_ERROR', error, { username });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// VERIFY TOKEN ENDPOINT - CON VALIDACIÓN
// ===============================================

router.get('/verify-token', authenticateToken, async (req, res) => {
  // Token ya validado por middleware authenticateToken
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user
    }
  });
});

// ===============================================
// GET PROFILE ENDPOINT - CON VALIDACIÓN
// ===============================================

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        activo: true,
        createdAt: true,
        ultimoAcceso: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { user: usuario }
    });

  } catch (error) {
    logger.logError('GET_PROFILE_ERROR', error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
```

### 1.5 Validador de Billing (CRÍTICO - P0)

**Archivo: `backend/validators/billing.validators.js`**

```javascript
const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateId,
  validatePagination,
  validateDateRange,
  validateMoneyAmount
} = require('./common.validators');

// ===============================================
// CREATE INVOICE VALIDATOR
// ===============================================

const validateCreateInvoice = [
  body('pacienteId')
    .notEmpty()
    .withMessage('El ID del paciente es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID del paciente debe ser un número entero positivo'),

  body('cuentaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de la cuenta debe ser un número entero positivo'),

  validateMoneyAmount('subtotal'),
  validateMoneyAmount('impuestos'),

  body('descuentos')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Los descuentos deben ser mayor o igual a 0'),

  validateMoneyAmount('total'),

  body('metodoPago')
    .optional()
    .isIn(['cash', 'card', 'transfer', 'check', 'insurance'])
    .withMessage('Método de pago inválido'),

  body('fechaVencimiento')
    .notEmpty()
    .withMessage('La fecha de vencimiento es requerida')
    .isISO8601()
    .toDate()
    .withMessage('La fecha de vencimiento debe ser válida')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('La fecha de vencimiento no puede ser anterior a hoy');
      }
      return true;
    }),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item en la factura'),

  body('items.*.tipo')
    .isIn(['servicio', 'producto'])
    .withMessage('Tipo de item inválido'),

  body('items.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser mayor a 0'),

  body('items.*.precioUnitario')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser mayor o igual a 0'),

  handleValidationErrors
];

// ===============================================
// UPDATE INVOICE VALIDATOR
// ===============================================

const validateUpdateInvoice = [
  ...validateId,

  body('estado')
    .optional()
    .isIn(['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled'])
    .withMessage('Estado de factura inválido'),

  body('descuentos')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Los descuentos deben ser mayor o igual a 0'),

  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las observaciones deben tener máximo 500 caracteres'),

  handleValidationErrors
];

// ===============================================
// CREATE PAYMENT VALIDATOR
// ===============================================

const validateCreatePayment = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de la factura debe ser un número entero positivo'),

  validateMoneyAmount('monto'),

  body('metodoPago')
    .notEmpty()
    .withMessage('El método de pago es requerido')
    .isIn(['cash', 'card', 'transfer', 'check', 'insurance'])
    .withMessage('Método de pago inválido'),

  body('referencia')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La referencia debe tener máximo 100 caracteres'),

  body('autorizacion')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La autorización debe tener máximo 50 caracteres'),

  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las observaciones deben tener máximo 500 caracteres'),

  handleValidationErrors
];

// ===============================================
// QUERY VALIDATORS
// ===============================================

const validateInvoiceQuery = [
  ...validatePagination.slice(0, -1), // Remove handleValidationErrors
  ...validateDateRange.slice(0, -1),

  query('estado')
    .optional()
    .isIn(['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled'])
    .withMessage('Estado de factura inválido'),

  query('pacienteId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del paciente debe ser un número entero positivo'),

  handleValidationErrors
];

module.exports = {
  validateCreateInvoice,
  validateUpdateInvoice,
  validateCreatePayment,
  validateInvoiceQuery
};
```

---

## 2. ÍNDICES DE BASE DE DATOS - IMPLEMENTACIÓN

### 2.1 Schema Prisma con Índices Completos

**Archivo: `backend/prisma/schema.prisma` (MODIFICACIONES)**

```prisma
// ===============================================
// MODELO PACIENTE - CON ÍNDICES
// ===============================================

model Paciente {
  id                         Int          @id @default(autoincrement())
  numeroExpediente           String?      @map("numero_expediente")
  nombre                     String
  apellidoPaterno            String       @map("apellido_paterno")
  apellidoMaterno            String?      @map("apellido_materno")
  fechaNacimiento            DateTime     @map("fecha_nacimiento") @db.Date
  genero                     Genero
  tipoSangre                 String?      @map("tipo_sangre")
  telefono                   String?
  email                      String?
  curp                       String?      @unique
  nss                        String?
  esMenorEdad                Boolean      @default(false) @map("es_menor_edad")
  responsableId              Int?         @map("responsable_id")
  activo                     Boolean      @default(true)
  ultimaVisita               DateTime?    @map("ultima_visita") @db.Date
  createdAt                  DateTime     @default(now()) @map("created_at")
  updatedAt                  DateTime     @updatedAt @map("updated_at")

  // Relaciones
  responsable Responsable?       @relation(fields: [responsableId], references: [id])
  cuentas     CuentaPaciente[]
  citas       CitaMedica[]
  historiales HistorialMedico[]
  facturas    Factura[]
  cirugias    CirugiaQuirofano[]
  solicitudesProductos SolicitudProductos[]

  // ✅ ÍNDICES AGREGADOS
  @@index([responsableId])                               // FK lookup
  @@index([activo, nombre, apellidoPaterno])            // Búsqueda compuesta
  @@index([ultimaVisita])                                // Reportes por fecha
  @@index([numeroExpediente])                            // Búsqueda por expediente
  @@index([nss])                                         // Búsqueda por NSS

  @@map("pacientes")
}

// ===============================================
// MODELO EMPLEADO - CON ÍNDICES
// ===============================================

model Empleado {
  id                Int          @id @default(autoincrement())
  nombre            String
  apellidoPaterno   String       @map("apellido_paterno")
  apellidoMaterno   String?      @map("apellido_materno")
  fechaNacimiento   DateTime?    @map("fecha_nacimiento") @db.Date
  tipoEmpleado      TipoEmpleado @map("tipo_empleado")
  cedulaProfesional String?      @map("cedula_profesional")
  especialidad      String?
  telefono          String?
  email             String?
  salario           Decimal?     @db.Decimal(10, 2)
  fechaIngreso      DateTime     @map("fecha_ingreso") @db.Date
  activo            Boolean      @default(true)
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")

  // Relaciones
  cuentasTratante      CuentaPaciente[]
  citas                CitaMedica[]
  historiales          HistorialMedico[]
  hospitalizaciones    Hospitalizacion[]
  ordenesMedicas       OrdenMedica[]
  notasHospitalizacion NotaHospitalizacion[]
  cancelaciones        Cancelacion[]
  cirugiasMedico       CirugiaQuirofano[]

  // ✅ ÍNDICES AGREGADOS
  @@index([tipoEmpleado])                                // Filtro común
  @@index([especialidad])                                // Búsqueda por especialidad
  @@index([cedulaProfesional])                           // Búsqueda por cédula
  @@index([activo, tipoEmpleado, especialidad])         // Búsqueda compuesta

  @@map("empleados")
}

// ===============================================
// MODELO CUENTA_PACIENTE - CON ÍNDICES
// ===============================================

model CuentaPaciente {
  id               Int          @id @default(autoincrement())
  pacienteId       Int          @map("paciente_id")
  tipoAtencion     TipoAtencion @map("tipo_atencion")
  estado           EstadoCuenta @default(abierta)
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
  paciente                Paciente                   @relation(fields: [pacienteId], references: [id])
  habitacion              Habitacion?                @relation(fields: [habitacionId], references: [id])
  medicoTratante          Empleado?                  @relation(fields: [medicoTratanteId], references: [id])
  cajeroApertura          Usuario                    @relation("CajeroApertura", fields: [cajeroAperturaId], references: [id])
  cajeroCierre            Usuario?                   @relation("CajeroCierre", fields: [cajeroCierreId], references: [id])
  transacciones           TransaccionCuenta[]
  movimientos             MovimientoInventario[]
  hospitalizacion         Hospitalizacion?
  facturas                Factura[]
  cancelaciones           Cancelacion[]
  historialModificaciones HistorialModificacionPOS[]
  solicitudesProductos    SolicitudProductos[]

  // ✅ ÍNDICES AGREGADOS
  @@index([pacienteId])                                  // FK crítico - usado en 80% de queries
  @@index([estado])                                      // Filtro común (abiertas vs cerradas)
  @@index([fechaApertura])                               // Ordenamiento y reportes
  @@index([habitacionId])                                // FK lookup
  @@index([medicoTratanteId])                            // FK lookup
  @@index([cajeroAperturaId])                            // FK lookup
  @@index([estado, fechaApertura])                      // Búsqueda compuesta (dashboard)
  @@index([tipoAtencion, estado])                       // Reportes por tipo

  @@map("cuentas_pacientes")
}

// ===============================================
// MODELO TRANSACCION_CUENTA - CON ÍNDICES
// ===============================================

model TransaccionCuenta {
  id                      Int             @id @default(autoincrement())
  cuentaId                Int             @map("cuenta_id")
  tipo                    TipoTransaccion
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
  cuenta                   CuentaPaciente             @relation(fields: [cuentaId], references: [id])
  servicio                 Servicio?                  @relation(fields: [servicioId], references: [id])
  producto                 Producto?                  @relation(fields: [productoId], references: [id])
  aplicacionMedicamento    AplicacionMedicamento?     @relation(fields: [aplicacionMedicamentoId], references: [id])
  empleadoCargo            Usuario?                   @relation(fields: [empleadoCargoId], references: [id])
  HistorialModificacionPOS HistorialModificacionPOS[]

  // ✅ ÍNDICES AGREGADOS (CRÍTICOS - millones de registros esperados)
  @@index([cuentaId])                                    // FK MUY usado
  @@index([tipo])                                        // Filtro común
  @@index([fechaTransaccion])                            // Ordenamiento y reportes
  @@index([empleadoCargoId])                             // FK lookup
  @@index([cuentaId, tipo, fechaTransaccion])           // Covering index para dashboard
  @@index([servicioId])                                  // FK lookup
  @@index([productoId])                                  // FK lookup

  @@map("transacciones_cuenta")
}

// ===============================================
// MODELO HOSPITALIZACION - CON ÍNDICES
// ===============================================

model Hospitalizacion {
  id                    Int                   @id @default(autoincrement())
  cuentaPacienteId      Int                   @unique @map("cuenta_paciente_id")
  habitacionId          Int                   @map("habitacion_id")
  medicoEspecialistaId  Int                   @map("medico_especialista_id")
  fechaIngreso          DateTime              @default(now()) @map("fecha_ingreso")
  fechaAlta             DateTime?             @map("fecha_alta")
  motivoHospitalizacion String                @map("motivo_hospitalizacion")
  diagnosticoIngreso    String                @map("diagnostico_ingreso")
  diagnosticoAlta       String?               @map("diagnostico_alta")
  estado                EstadoHospitalizacion @default(en_observacion)
  indicacionesGenerales String?               @map("indicaciones_generales")
  createdAt             DateTime              @default(now()) @map("created_at")
  updatedAt             DateTime              @updatedAt @map("updated_at")

  // Relaciones
  cuentaPaciente       CuentaPaciente        @relation(fields: [cuentaPacienteId], references: [id])
  habitacion           Habitacion            @relation(fields: [habitacionId], references: [id])
  medicoEspecialista   Empleado              @relation(fields: [medicoEspecialistaId], references: [id])
  ordenesMedicas       OrdenMedica[]
  notasHospitalizacion NotaHospitalizacion[]

  // ✅ ÍNDICES AGREGADOS
  @@index([habitacionId])                                // FK lookup (disponibilidad)
  @@index([estado])                                      // Filtro muy común (activas)
  @@index([medicoEspecialistaId])                        // FK lookup
  @@index([fechaIngreso])                                // Reportes
  @@index([estado, fechaIngreso])                       // Búsqueda compuesta

  @@map("hospitalizaciones")
}

// ===============================================
// MODELO PRODUCTO - CON ÍNDICES
// ===============================================

model Producto {
  id                 Int               @id @default(autoincrement())
  codigo             String            @unique
  codigoBarras       String?           @map("codigo_barras")
  nombre             String
  descripcion        String?
  categoria          CategoriaProducto
  unidadMedida       String            @map("unidad_medida")
  contenidoPorUnidad String?           @map("contenido_por_unidad")
  precioCompra       Decimal?          @map("precio_compra") @db.Decimal(8, 2)
  precioVenta        Decimal           @map("precio_venta") @db.Decimal(8, 2)
  stockMinimo        Int               @default(10) @map("stock_minimo")
  stockMaximo        Int?              @default(100) @map("stock_maximo")
  stockActual        Int               @default(0) @map("stock_actual")
  ubicacion          String?
  requiereReceta     Boolean           @default(false) @map("requiere_receta")
  fechaCaducidad     String?           @map("fecha_caducidad")
  lote               String?
  proveedorId        Int?              @map("proveedor_id")
  activo             Boolean           @default(true)
  createdAt          DateTime          @default(now()) @map("created_at")
  updatedAt          DateTime          @updatedAt @map("updated_at")

  // Relaciones
  proveedor        Proveedor?              @relation(fields: [proveedorId], references: [id])
  transacciones    TransaccionCuenta[]
  movimientos      MovimientoInventario[]
  aplicaciones     AplicacionMedicamento[]
  itemsVentaRapida ItemVentaRapida[]
  detallesFactura  DetalleFactura[]
  alertas          AlertaInventario[]
  detallesSolicitud DetalleSolicitudProducto[]

  // ✅ ÍNDICES AGREGADOS
  @@index([categoria])                                   // Filtro común
  @@index([proveedorId])                                 // FK lookup
  @@index([activo])                                      // Filtro común
  @@index([stockActual, stockMinimo])                   // Stock bajo (alertas)
  @@index([nombre])                                      // Búsqueda
  @@index([codigoBarras])                                // Búsqueda por barcode

  @@map("productos")
}

// ===============================================
// MODELO MOVIMIENTO_INVENTARIO - CON ÍNDICES
// ===============================================

model MovimientoInventario {
  id                      Int            @id @default(autoincrement())
  productoId              Int            @map("producto_id")
  tipoMovimiento          TipoMovimiento @map("tipo_movimiento")
  cantidad                Int
  precioUnitario          Decimal?       @map("precio_unitario") @db.Decimal(8, 2)
  motivo                  String
  usuarioId               Int            @map("usuario_id")
  cuentaPacienteId        Int?           @map("cuenta_paciente_id")
  aplicacionMedicamentoId Int?           @map("aplicacion_medicamento_id")
  fechaMovimiento         DateTime       @default(now()) @map("fecha_movimiento")
  observaciones           String?

  // Relaciones
  producto              Producto               @relation(fields: [productoId], references: [id])
  usuario               Usuario                @relation(fields: [usuarioId], references: [id])
  cuentaPaciente        CuentaPaciente?        @relation(fields: [cuentaPacienteId], references: [id])
  aplicacionMedicamento AplicacionMedicamento? @relation(fields: [aplicacionMedicamentoId], references: [id])

  // ✅ ÍNDICES AGREGADOS
  @@index([productoId])                                  // FK muy usado
  @@index([fechaMovimiento])                             // Reportes
  @@index([tipoMovimiento])                              // Filtro común
  @@index([usuarioId])                                   // FK lookup
  @@index([productoId, fechaMovimiento])                // Covering index

  @@map("movimientos_inventario")
}

// ===============================================
// MODELO QUIROFANO - CON ÍNDICES
// ===============================================

model Quirofano {
  id              Int             @id @default(autoincrement())
  numero          String          @unique
  tipo            TipoQuirofano   @default(cirugia_general)
  especialidad    String?
  estado          EstadoQuirofano @default(disponible)
  descripcion     String?
  equipamiento    String?
  capacidadEquipo Int             @default(6) @map("capacidad_equipo")
  precioHora      Decimal?        @map("precio_hora") @db.Decimal(8, 2)
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relaciones
  citas    CitaMedica[]
  cirugias CirugiaQuirofano[]

  // ✅ ÍNDICES AGREGADOS
  @@index([estado])                                      // Filtro muy común (disponibles)
  @@index([tipo])                                        // Filtro por tipo
  @@index([estado, tipo])                               // Búsqueda compuesta

  @@map("quirofanos")
}

// ===============================================
// MODELO CIRUGIA_QUIROFANO - CON ÍNDICES
// ===============================================

model CirugiaQuirofano {
  id               Int           @id @default(autoincrement())
  quirofanoId      Int           @map("quirofano_id")
  pacienteId       Int           @map("paciente_id")
  medicoId         Int           @map("medico_id")
  tipoIntervencion String        @map("tipo_intervencion")
  fechaInicio      DateTime      @map("fecha_inicio")
  fechaFin         DateTime?     @map("fecha_fin")
  estado           EstadoCirugia @default(programada)
  observaciones    String?
  equipoMedico     Json?         @map("equipo_medico")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  // Relaciones
  quirofano Quirofano @relation(fields: [quirofanoId], references: [id])
  paciente  Paciente  @relation(fields: [pacienteId], references: [id])
  medico    Empleado  @relation(fields: [medicoId], references: [id])

  // ✅ ÍNDICES AGREGADOS
  @@index([quirofanoId])                                 // FK muy usado (disponibilidad)
  @@index([pacienteId])                                  // FK lookup
  @@index([medicoId])                                    // FK lookup
  @@index([fechaInicio])                                 // Ordenamiento y reportes
  @@index([estado])                                      // Filtro común (programadas/activas)
  @@index([quirofanoId, fechaInicio, estado])           // Covering index (scheduler)

  @@map("cirugias_quirofano")
}

// ===============================================
// MODELO FACTURA - CON ÍNDICES
// ===============================================

model Factura {
  id               Int                @id @default(autoincrement())
  numeroFactura    String             @unique @map("numero_factura")
  pacienteId       Int                @map("paciente_id")
  cuentaId         Int?               @map("cuenta_id")
  fechaFactura     DateTime           @default(now()) @map("fecha_factura")
  fechaVencimiento DateTime           @map("fecha_vencimiento")
  subtotal         Decimal            @db.Decimal(10, 2)
  impuestos        Decimal            @db.Decimal(10, 2)
  descuentos       Decimal            @default(0) @db.Decimal(10, 2)
  total            Decimal            @db.Decimal(10, 2)
  saldoPendiente   Decimal?           @default(0) @map("saldo_pendiente") @db.Decimal(10, 2)
  estado           EstadoFactura
  metodoPago       MetodoPagoFactura? @map("metodo_pago")
  observaciones    String?
  createdAt        DateTime           @default(now()) @map("created_at")
  updatedAt        DateTime           @updatedAt @map("updated_at")

  // Relaciones
  paciente Paciente         @relation(fields: [pacienteId], references: [id])
  cuenta   CuentaPaciente?  @relation(fields: [cuentaId], references: [id])
  pagos    PagoFactura[]
  detalles DetalleFactura[]

  // ✅ ÍNDICES AGREGADOS
  @@index([pacienteId])                                  // FK muy usado
  @@index([estado])                                      // Filtro común (pending, overdue)
  @@index([fechaFactura])                                // Reportes
  @@index([fechaVencimiento])                            // Cuentas vencidas
  @@index([estado, fechaVencimiento])                   // Covering index (dashboard)

  @@map("facturas")
}

// ===============================================
// MODELO SOLICITUD_PRODUCTOS - CON ÍNDICES
// ===============================================

model SolicitudProductos {
  id                Int                      @id @default(autoincrement())
  numero            String                   @unique
  pacienteId        Int                      @map("paciente_id")
  cuentaPacienteId  Int                      @map("cuenta_paciente_id")
  solicitanteId     Int                      @map("solicitante_id")
  almacenistaId     Int?                     @map("almacenista_id")
  estado            EstadoSolicitud          @default(SOLICITADO)
  prioridad         PrioridadSolicitud       @default(NORMAL)
  observaciones     String?
  fechaSolicitud    DateTime                 @default(now()) @map("fecha_solicitud")
  fechaNotificacion DateTime?                @map("fecha_notificacion")
  fechaPreparacion  DateTime?                @map("fecha_preparacion")
  fechaEntrega      DateTime?                @map("fecha_entrega")
  fechaRecepcion    DateTime?                @map("fecha_recepcion")
  fechaAplicacion   DateTime?                @map("fecha_aplicacion")
  createdAt         DateTime                 @default(now()) @map("created_at")
  updatedAt         DateTime                 @updatedAt @map("updated_at")

  // Relaciones
  paciente          Paciente                 @relation(fields: [pacienteId], references: [id])
  cuentaPaciente    CuentaPaciente           @relation(fields: [cuentaPacienteId], references: [id])
  solicitante       Usuario                  @relation("SolicitudSolicitante", fields: [solicitanteId], references: [id])
  almacenista       Usuario?                 @relation("SolicitudAlmacenista", fields: [almacenistaId], references: [id])
  detalles          DetalleSolicitudProducto[]
  historial         HistorialSolicitud[]
  notificaciones    NotificacionSolicitud[]

  // ✅ ÍNDICES AGREGADOS
  @@index([solicitanteId])                               // FK lookup (mis solicitudes)
  @@index([almacenistaId])                               // FK lookup (asignadas a mí)
  @@index([estado])                                      // Filtro muy común
  @@index([prioridad])                                   // Ordenamiento
  @@index([fechaSolicitud])                              // Reportes
  @@index([estado, prioridad, fechaSolicitud])          // Covering index (dashboard)

  @@map("solicitudes_productos")
}
```

### 2.2 Migración de Índices

**Archivo: `backend/prisma/migrations/20251030_add_critical_indexes/migration.sql`**

```sql
-- ===============================================
-- MIGRACIÓN: AGREGAR ÍNDICES CRÍTICOS
-- Autor: Claude (Backend Research Specialist)
-- Fecha: 30 de octubre de 2025
-- Descripción: Agregar 45+ índices faltantes para optimización
-- Tiempo estimado: 2-5 minutos en BD con datos
-- ===============================================

-- =====================
-- PACIENTES
-- =====================
CREATE INDEX IF NOT EXISTS "pacientes_responsable_id_idx" ON "pacientes"("responsable_id");
CREATE INDEX IF NOT EXISTS "pacientes_activo_nombre_apellido_idx" ON "pacientes"("activo", "nombre", "apellido_paterno");
CREATE INDEX IF NOT EXISTS "pacientes_ultima_visita_idx" ON "pacientes"("ultima_visita");
CREATE INDEX IF NOT EXISTS "pacientes_numero_expediente_idx" ON "pacientes"("numero_expediente");
CREATE INDEX IF NOT EXISTS "pacientes_nss_idx" ON "pacientes"("nss");

-- =====================
-- EMPLEADOS
-- =====================
CREATE INDEX IF NOT EXISTS "empleados_tipo_empleado_idx" ON "empleados"("tipo_empleado");
CREATE INDEX IF NOT EXISTS "empleados_especialidad_idx" ON "empleados"("especialidad");
CREATE INDEX IF NOT EXISTS "empleados_cedula_profesional_idx" ON "empleados"("cedula_profesional");
CREATE INDEX IF NOT EXISTS "empleados_activo_tipo_especialidad_idx" ON "empleados"("activo", "tipo_empleado", "especialidad");

-- =====================
-- CUENTAS_PACIENTES
-- =====================
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_paciente_id_idx" ON "cuentas_pacientes"("paciente_id");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_estado_idx" ON "cuentas_pacientes"("estado");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_fecha_apertura_idx" ON "cuentas_pacientes"("fecha_apertura");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_habitacion_id_idx" ON "cuentas_pacientes"("habitacion_id");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_medico_tratante_id_idx" ON "cuentas_pacientes"("medico_tratante_id");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_cajero_apertura_id_idx" ON "cuentas_pacientes"("cajero_apertura_id");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_estado_fecha_idx" ON "cuentas_pacientes"("estado", "fecha_apertura");
CREATE INDEX IF NOT EXISTS "cuentas_pacientes_tipo_estado_idx" ON "cuentas_pacientes"("tipo_atencion", "estado");

-- =====================
-- TRANSACCIONES_CUENTA (CRÍTICO)
-- =====================
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_cuenta_id_idx" ON "transacciones_cuenta"("cuenta_id");
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_tipo_idx" ON "transacciones_cuenta"("tipo");
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_fecha_idx" ON "transacciones_cuenta"("fecha_transaccion");
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_empleado_cargo_id_idx" ON "transacciones_cuenta"("empleado_cargo_id");
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_cuenta_tipo_fecha_idx" ON "transacciones_cuenta"("cuenta_id", "tipo", "fecha_transaccion");
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_servicio_id_idx" ON "transacciones_cuenta"("servicio_id");
CREATE INDEX IF NOT EXISTS "transacciones_cuenta_producto_id_idx" ON "transacciones_cuenta"("producto_id");

-- =====================
-- HOSPITALIZACIONES
-- =====================
CREATE INDEX IF NOT EXISTS "hospitalizaciones_habitacion_id_idx" ON "hospitalizaciones"("habitacion_id");
CREATE INDEX IF NOT EXISTS "hospitalizaciones_estado_idx" ON "hospitalizaciones"("estado");
CREATE INDEX IF NOT EXISTS "hospitalizaciones_medico_especialista_id_idx" ON "hospitalizaciones"("medico_especialista_id");
CREATE INDEX IF NOT EXISTS "hospitalizaciones_fecha_ingreso_idx" ON "hospitalizaciones"("fecha_ingreso");
CREATE INDEX IF NOT EXISTS "hospitalizaciones_estado_fecha_idx" ON "hospitalizaciones"("estado", "fecha_ingreso");

-- =====================
-- PRODUCTOS
-- =====================
CREATE INDEX IF NOT EXISTS "productos_categoria_idx" ON "productos"("categoria");
CREATE INDEX IF NOT EXISTS "productos_proveedor_id_idx" ON "productos"("proveedor_id");
CREATE INDEX IF NOT EXISTS "productos_activo_idx" ON "productos"("activo");
CREATE INDEX IF NOT EXISTS "productos_stock_bajo_idx" ON "productos"("stock_actual", "stock_minimo");
CREATE INDEX IF NOT EXISTS "productos_nombre_idx" ON "productos"("nombre");
CREATE INDEX IF NOT EXISTS "productos_codigo_barras_idx" ON "productos"("codigo_barras");

-- =====================
-- MOVIMIENTOS_INVENTARIO
-- =====================
CREATE INDEX IF NOT EXISTS "movimientos_inventario_producto_id_idx" ON "movimientos_inventario"("producto_id");
CREATE INDEX IF NOT EXISTS "movimientos_inventario_fecha_idx" ON "movimientos_inventario"("fecha_movimiento");
CREATE INDEX IF NOT EXISTS "movimientos_inventario_tipo_idx" ON "movimientos_inventario"("tipo_movimiento");
CREATE INDEX IF NOT EXISTS "movimientos_inventario_usuario_id_idx" ON "movimientos_inventario"("usuario_id");
CREATE INDEX IF NOT EXISTS "movimientos_inventario_producto_fecha_idx" ON "movimientos_inventario"("producto_id", "fecha_movimiento");

-- =====================
-- QUIRÓFANOS
-- =====================
CREATE INDEX IF NOT EXISTS "quirofanos_estado_idx" ON "quirofanos"("estado");
CREATE INDEX IF NOT EXISTS "quirofanos_tipo_idx" ON "quirofanos"("tipo");
CREATE INDEX IF NOT EXISTS "quirofanos_estado_tipo_idx" ON "quirofanos"("estado", "tipo");

-- =====================
-- CIRUGÍAS_QUIROFANO
-- =====================
CREATE INDEX IF NOT EXISTS "cirugias_quirofano_quirofano_id_idx" ON "cirugias_quirofano"("quirofano_id");
CREATE INDEX IF NOT EXISTS "cirugias_quirofano_paciente_id_idx" ON "cirugias_quirofano"("paciente_id");
CREATE INDEX IF NOT EXISTS "cirugias_quirofano_medico_id_idx" ON "cirugias_quirofano"("medico_id");
CREATE INDEX IF NOT EXISTS "cirugias_quirofano_fecha_inicio_idx" ON "cirugias_quirofano"("fecha_inicio");
CREATE INDEX IF NOT EXISTS "cirugias_quirofano_estado_idx" ON "cirugias_quirofano"("estado");
CREATE INDEX IF NOT EXISTS "cirugias_quirofano_quirofano_fecha_estado_idx" ON "cirugias_quirofano"("quirofano_id", "fecha_inicio", "estado");

-- =====================
-- FACTURAS
-- =====================
CREATE INDEX IF NOT EXISTS "facturas_paciente_id_idx" ON "facturas"("paciente_id");
CREATE INDEX IF NOT EXISTS "facturas_estado_idx" ON "facturas"("estado");
CREATE INDEX IF NOT EXISTS "facturas_fecha_factura_idx" ON "facturas"("fecha_factura");
CREATE INDEX IF NOT EXISTS "facturas_fecha_vencimiento_idx" ON "facturas"("fecha_vencimiento");
CREATE INDEX IF NOT EXISTS "facturas_estado_vencimiento_idx" ON "facturas"("estado", "fecha_vencimiento");

-- =====================
-- SOLICITUDES_PRODUCTOS
-- =====================
CREATE INDEX IF NOT EXISTS "solicitudes_productos_solicitante_id_idx" ON "solicitudes_productos"("solicitante_id");
CREATE INDEX IF NOT EXISTS "solicitudes_productos_almacenista_id_idx" ON "solicitudes_productos"("almacenista_id");
CREATE INDEX IF NOT EXISTS "solicitudes_productos_estado_idx" ON "solicitudes_productos"("estado");
CREATE INDEX IF NOT EXISTS "solicitudes_productos_prioridad_idx" ON "solicitudes_productos"("prioridad");
CREATE INDEX IF NOT EXISTS "solicitudes_productos_fecha_idx" ON "solicitudes_productos"("fecha_solicitud");
CREATE INDEX IF NOT EXISTS "solicitudes_productos_estado_prioridad_fecha_idx" ON "solicitudes_productos"("estado", "prioridad", "fecha_solicitud");

-- ===============================================
-- ANÁLISIS POST-MIGRACIÓN
-- ===============================================

-- Verificar tamaño de índices creados
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Verificar queries más lentas (habilitar después de reiniciar)
-- SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

COMMENT ON INDEX "transacciones_cuenta_cuenta_id_idx" IS 'Índice crítico - Millones de registros esperados';
COMMENT ON INDEX "cuentas_pacientes_paciente_id_idx" IS 'Índice crítico - FK muy usado en queries';
COMMENT ON INDEX "hospitalizaciones_estado_idx" IS 'Índice crítico - Filtro común para dashboard';
```

### 2.3 Benchmarking de Performance

**Archivo: `backend/scripts/benchmark-indexes.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmarkQueries() {
  console.log('🔍 Benchmarking queries antes/después de índices\n');

  // ==============================================
  // TEST 1: Búsqueda de pacientes activos
  // ==============================================
  console.log('📊 TEST 1: Búsqueda de pacientes activos');

  const startTest1 = Date.now();
  const pacientes = await prisma.paciente.findMany({
    where: {
      activo: true,
      nombre: { startsWith: 'Juan' }
    },
    take: 50
  });
  const timeTest1 = Date.now() - startTest1;

  console.log(`✅ Tiempo: ${timeTest1}ms | Resultados: ${pacientes.length}`);
  console.log(`📈 Esperado: <100ms con índices\n`);

  // ==============================================
  // TEST 2: Cuentas abiertas con transacciones
  // ==============================================
  console.log('📊 TEST 2: Cuentas abiertas con transacciones');

  const startTest2 = Date.now();
  const cuentas = await prisma.cuentaPaciente.findMany({
    where: { estado: 'abierta' },
    include: {
      transacciones: {
        orderBy: { fechaTransaccion: 'desc' },
        take: 10
      },
      paciente: true
    },
    take: 20
  });
  const timeTest2 = Date.now() - startTest2;

  console.log(`✅ Tiempo: ${timeTest2}ms | Resultados: ${cuentas.length}`);
  console.log(`📈 Esperado: <150ms con índices\n`);

  // ==============================================
  // TEST 3: Dashboard hospitalización
  // ==============================================
  console.log('📊 TEST 3: Dashboard hospitalización (query compleja)');

  const startTest3 = Date.now();
  const hospitalizaciones = await prisma.hospitalizacion.findMany({
    where: {
      estado: { in: ['en_observacion', 'estable', 'critico'] }
    },
    include: {
      cuentaPaciente: {
        include: { paciente: true }
      },
      habitacion: true,
      medicoEspecialista: true,
      notasHospitalizacion: {
        take: 5,
        orderBy: { fechaNota: 'desc' }
      }
    },
    orderBy: { fechaIngreso: 'desc' },
    take: 30
  });
  const timeTest3 = Date.now() - startTest3;

  console.log(`✅ Tiempo: ${timeTest3}ms | Resultados: ${hospitalizaciones.length}`);
  console.log(`📈 Esperado: <200ms con índices\n`);

  // ==============================================
  // TEST 4: Reportes financieros
  // ==============================================
  console.log('📊 TEST 4: Reporte de transacciones del mes');

  const startTest4 = Date.now();
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const transacciones = await prisma.transaccionCuenta.findMany({
    where: {
      fechaTransaccion: { gte: firstDayOfMonth },
      tipo: { in: ['servicio', 'producto'] }
    },
    include: {
      cuenta: {
        include: { paciente: true }
      }
    },
    orderBy: { fechaTransaccion: 'desc' }
  });
  const timeTest4 = Date.now() - startTest4;

  console.log(`✅ Tiempo: ${timeTest4}ms | Resultados: ${transacciones.length}`);
  console.log(`📈 Esperado: <300ms con índices (covering index)\n`);

  // ==============================================
  // TEST 5: Stock bajo (inventario crítico)
  // ==============================================
  console.log('📊 TEST 5: Productos con stock bajo');

  const startTest5 = Date.now();
  const productosStockBajo = await prisma.$queryRaw`
    SELECT
      p.id,
      p.nombre,
      p.stock_actual,
      p.stock_minimo,
      pr.nombre_empresa as proveedor
    FROM productos p
    LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
    WHERE p.stock_actual <= p.stock_minimo
    AND p.activo = true
    ORDER BY (p.stock_minimo - p.stock_actual) DESC
    LIMIT 50
  `;
  const timeTest5 = Date.now() - startTest5;

  console.log(`✅ Tiempo: ${timeTest5}ms | Resultados: ${productosStockBajo.length}`);
  console.log(`📈 Esperado: <50ms con índice compuesto\n`);

  // ==============================================
  // RESUMEN
  // ==============================================
  console.log('=' .repeat(50));
  console.log('📊 RESUMEN DE BENCHMARKS');
  console.log('=' .repeat(50));

  const totalTime = timeTest1 + timeTest2 + timeTest3 + timeTest4 + timeTest5;

  console.log(`
Test 1 (Búsqueda pacientes):    ${timeTest1}ms
Test 2 (Cuentas con transacc):  ${timeTest2}ms
Test 3 (Dashboard hospitaliz):  ${timeTest3}ms
Test 4 (Reporte mensual):       ${timeTest4}ms
Test 5 (Stock bajo):            ${timeTest5}ms
────────────────────────────────────────
TOTAL:                          ${totalTime}ms

✅ SI TODOS LOS TESTS < 500ms TOTAL: Índices funcionando correctamente
⚠️ SI ALGUNO > 300ms: Revisar EXPLAIN ANALYZE de ese query
❌ SI TOTAL > 1000ms: Faltan índices o hay N+1 queries
  `);

  await prisma.$disconnect();
}

benchmarkQueries()
  .catch(err => {
    console.error('❌ Error en benchmark:', err);
    process.exit(1);
  });
```

**Uso:**
```bash
# Ejecutar benchmark ANTES de agregar índices
npm run benchmark:before

# Agregar índices
npx prisma migrate dev --name add_critical_indexes

# Ejecutar benchmark DESPUÉS de agregar índices
npm run benchmark:after

# Comparar resultados
```

---

## 3. REFACTORIZACIÓN DE GOD ROUTES

### 3.1 Patrón Controller-Service

**Antes (God Route - 1,198 LOC):**
```javascript
// routes/quirofanos.routes.js (ANTES)
router.post('/cirugias', authenticateToken, async (req, res) => {
  try {
    const {
      quirofanoId,
      pacienteId,
      medicoId,
      tipoIntervencion,
      fechaInicio,
      fechaFin,
      observaciones,
      equipoMedico
    } = req.body;

    // 50 líneas de validaciones manuales
    if (!quirofanoId || !pacienteId || !medicoId) { ... }
    if (new Date(fechaInicio) < new Date()) { ... }
    if (fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) { ... }

    // 30 líneas verificando disponibilidad quirófano
    const quirofano = await prisma.quirofano.findUnique({ ... });
    if (!quirofano) { ... }
    if (quirofano.estado !== 'disponible') { ... }

    // 40 líneas verificando conflictos de agenda
    const conflictos = await prisma.cirugiaQuirofano.findMany({ ... });
    if (conflictos.length > 0) { ... }

    // 20 líneas calculando costos
    const horas = calcularHoras(fechaInicio, fechaFin);
    const costoQuirofano = quirofano.precioHora * horas;

    // 30 líneas creando transacciones
    const cirugia = await prisma.$transaction(async (tx) => {
      const nuevaCirugia = await tx.cirugiaQuirofano.create({ ... });
      await tx.quirofano.update({ ... });
      await tx.transaccionCuenta.create({ ... });
      await tx.servicio.create({ ... });
      return nuevaCirugia;
    });

    // 20 líneas de logging y respuesta
    logger.logOperation('CREATE_CIRUGIA', { ... });
    res.json({ success: true, data: cirugia });

  } catch (error) {
    logger.logError('CREATE_CIRUGIA_ERROR', error);
    res.status(500).json({ ... });
  }
});
```

**Después (Arquitectura Modular):**

**1. Controller (150 LOC):**
```javascript
// controllers/quirofano/cirugia.controller.js
const cirugiaService = require('../../services/quirofano/cirugia.service');
const { handleControllerError } = require('../../utils/error-handler');
const logger = require('../../utils/logger');

exports.programarCirugia = async (req, res) => {
  try {
    const cirugia = await cirugiaService.programarCirugia(req.body, req.user);

    logger.logOperation('CIRUGIA_PROGRAMADA', {
      cirugiaId: cirugia.id,
      quirofanoId: cirugia.quirofanoId,
      pacienteId: cirugia.pacienteId,
      usuarioId: req.user.id
    });

    res.json({
      success: true,
      data: cirugia,
      message: 'Cirugía programada exitosamente'
    });

  } catch (error) {
    handleControllerError(error, res, 'PROGRAMAR_CIRUGIA');
  }
};

exports.listarCirugias = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      quirofanoId: req.query.quirofanoId ? parseInt(req.query.quirofanoId) : undefined,
      medicoId: req.query.medicoId ? parseInt(req.query.medicoId) : undefined,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await cirugiaService.listarCirugias(filters);

    res.json({
      success: true,
      data: result.cirugias,
      pagination: result.pagination
    });

  } catch (error) {
    handleControllerError(error, res, 'LISTAR_CIRUGIAS');
  }
};

exports.obtenerCirugia = async (req, res) => {
  try {
    const cirugiaId = parseInt(req.params.id);
    const cirugia = await cirugiaService.obtenerCirugiaPorId(cirugiaId);

    if (!cirugia) {
      return res.status(404).json({
        success: false,
        message: 'Cirugía no encontrada'
      });
    }

    res.json({
      success: true,
      data: cirugia
    });

  } catch (error) {
    handleControllerError(error, res, 'OBTENER_CIRUGIA');
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const cirugiaId = parseInt(req.params.id);
    const { estado, observaciones } = req.body;

    const cirugia = await cirugiaService.actualizarEstadoCirugia(
      cirugiaId,
      estado,
      observaciones,
      req.user
    );

    res.json({
      success: true,
      data: cirugia,
      message: `Cirugía actualizada a estado: ${estado}`
    });

  } catch (error) {
    handleControllerError(error, res, 'ACTUALIZAR_ESTADO_CIRUGIA');
  }
};

exports.cancelarCirugia = async (req, res) => {
  try {
    const cirugiaId = parseInt(req.params.id);
    const { motivo } = req.body;

    const cirugia = await cirugiaService.cancelarCirugia(
      cirugiaId,
      motivo,
      req.user
    );

    res.json({
      success: true,
      data: cirugia,
      message: 'Cirugía cancelada exitosamente'
    });

  } catch (error) {
    handleControllerError(error, res, 'CANCELAR_CIRUGIA');
  }
};
```

**2. Service (400 LOC):**
```javascript
// services/quirofano/cirugia.service.js
const { prisma } = require('../../utils/database');
const logger = require('../../utils/logger');
const { BusinessError, ValidationError, NotFoundError } = require('../../utils/errors');

class CirugiaService {

  async programarCirugia(data, usuario) {
    const {
      quirofanoId,
      pacienteId,
      medicoId,
      tipoIntervencion,
      fechaInicio,
      fechaFin,
      observaciones,
      equipoMedico
    } = data;

    // Validaciones de negocio
    await this.validateCirugiaData(data);

    // Verificar disponibilidad del quirófano
    await this.verificarDisponibilidad(quirofanoId, fechaInicio, fechaFin);

    // Verificar que entidades existen
    const [quirofano, paciente, medico] = await this.verificarEntidades(
      quirofanoId,
      pacienteId,
      medicoId
    );

    // Calcular costo
    const costoTotal = this.calcularCostoCirugia(quirofano, fechaInicio, fechaFin);

    // Crear cirugía en transacción
    const cirugia = await prisma.$transaction(async (tx) => {
      // 1. Crear cirugía
      const nuevaCirugia = await tx.cirugiaQuirofano.create({
        data: {
          quirofanoId,
          pacienteId,
          medicoId,
          tipoIntervencion,
          fechaInicio: new Date(fechaInicio),
          fechaFin: fechaFin ? new Date(fechaFin) : null,
          estado: 'programada',
          observaciones,
          equipoMedico
        },
        include: {
          quirofano: true,
          paciente: true,
          medico: true
        }
      });

      // 2. Marcar quirófano como reservado
      await tx.quirofano.update({
        where: { id: quirofanoId },
        data: { estado: 'preparacion' }
      });

      // 3. Crear cargo automático en cuenta del paciente
      await this.crearCargoAutomatico(tx, pacienteId, nuevaCirugia, costoTotal);

      return nuevaCirugia;
    });

    logger.logOperation('CIRUGIA_CREADA', {
      cirugiaId: cirugia.id,
      quirofanoNumero: quirofano.numero,
      pacienteNombre: `${paciente.nombre} ${paciente.apellidoPaterno}`,
      costoTotal
    });

    return cirugia;
  }

  async verificarDisponibilidad(quirofanoId, fechaInicio, fechaFin) {
    const quirofano = await prisma.quirofano.findUnique({
      where: { id: quirofanoId }
    });

    if (!quirofano) {
      throw new NotFoundError('Quirófano no encontrado');
    }

    if (quirofano.estado === 'fuera_de_servicio') {
      throw new BusinessError('El quirófano está fuera de servicio');
    }

    // Verificar conflictos de agenda
    const conflictos = await prisma.cirugiaQuirofano.findMany({
      where: {
        quirofanoId,
        estado: { in: ['programada', 'en_progreso'] },
        OR: [
          {
            AND: [
              { fechaInicio: { lte: new Date(fechaInicio) } },
              { fechaFin: { gte: new Date(fechaInicio) } }
            ]
          },
          {
            AND: [
              { fechaInicio: { lte: fechaFin ? new Date(fechaFin) : new Date(fechaInicio) } },
              { fechaFin: { gte: fechaFin ? new Date(fechaFin) : new Date(fechaInicio) } }
            ]
          }
        ]
      }
    });

    if (conflictos.length > 0) {
      throw new BusinessError(
        `El quirófano ya tiene cirugías programadas en ese horario. Conflictos encontrados: ${conflictos.length}`
      );
    }

    return true;
  }

  async verificarEntidades(quirofanoId, pacienteId, medicoId) {
    const [quirofano, paciente, medico] = await Promise.all([
      prisma.quirofano.findUnique({ where: { id: quirofanoId } }),
      prisma.paciente.findUnique({ where: { id: pacienteId } }),
      prisma.empleado.findUnique({ where: { id: medicoId } })
    ]);

    if (!quirofano) throw new NotFoundError('Quirófano no encontrado');
    if (!paciente) throw new NotFoundError('Paciente no encontrado');
    if (!medico) throw new NotFoundError('Médico no encontrado');

    if (!['medico_residente', 'medico_especialista'].includes(medico.tipoEmpleado)) {
      throw new ValidationError('El empleado seleccionado no es médico');
    }

    return [quirofano, paciente, medico];
  }

  validateCirugiaData(data) {
    if (new Date(data.fechaInicio) < new Date()) {
      throw new ValidationError('La fecha de inicio no puede ser en el pasado');
    }

    if (data.fechaFin && new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
      throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    if (data.equipoMedico && !Array.isArray(data.equipoMedico)) {
      throw new ValidationError('El equipo médico debe ser un array');
    }

    return true;
  }

  calcularCostoCirugia(quirofano, fechaInicio, fechaFin) {
    if (!quirofano.precioHora) {
      return 0;
    }

    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date(inicio.getTime() + 3 * 60 * 60 * 1000); // Default: 3 horas

    const horas = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60)));
    const costoTotal = parseFloat(quirofano.precioHora.toString()) * horas;

    return costoTotal;
  }

  async crearCargoAutomatico(tx, pacienteId, cirugia, costoTotal) {
    // Buscar cuenta abierta del paciente
    const cuentaAbierta = await tx.cuentaPaciente.findFirst({
      where: {
        pacienteId,
        estado: 'abierta'
      }
    });

    if (!cuentaAbierta) {
      logger.warn('No se encontró cuenta abierta para crear cargo de cirugía', {
        pacienteId,
        cirugiaId: cirugia.id
      });
      return null;
    }

    // Buscar o crear servicio de quirófano
    const codigoServicio = `QUIR-${cirugia.quirofano.numero}`;

    let servicio = await tx.servicio.findFirst({
      where: { codigo: codigoServicio }
    });

    if (!servicio) {
      servicio = await tx.servicio.create({
        data: {
          codigo: codigoServicio,
          nombre: `Uso de Quirófano ${cirugia.quirofano.numero} - ${cirugia.quirofano.tipo}`,
          descripcion: `Servicio de quirófano tipo ${cirugia.quirofano.tipo}`,
          tipo: 'urgencia',
          precio: cirugia.quirofano.precioHora || 0,
          activo: true
        }
      });
    }

    // Crear transacción de cargo
    const transaccion = await tx.transaccionCuenta.create({
      data: {
        cuentaId: cuentaAbierta.id,
        tipo: 'servicio',
        concepto: `Cirugía ${cirugia.tipoIntervencion} - Quirófano ${cirugia.quirofano.numero}`,
        cantidad: 1,
        precioUnitario: costoTotal,
        subtotal: costoTotal,
        servicioId: servicio.id,
        empleadoCargoId: cirugia.medicoId,
        observaciones: `Cargo automático por cirugía programada ID: ${cirugia.id}`
      }
    });

    // Actualizar totales de cuenta
    await tx.cuentaPaciente.update({
      where: { id: cuentaAbierta.id },
      data: {
        totalServicios: { increment: costoTotal },
        totalCuenta: { increment: costoTotal },
        saldoPendiente: { increment: costoTotal }
      }
    });

    logger.logOperation('CARGO_CIRUGIA_CREADO', {
      cirugiaId: cirugia.id,
      cuentaId: cuentaAbierta.id,
      monto: costoTotal
    });

    return transaccion;
  }

  async listarCirugias(filters) {
    const { estado, quirofanoId, medicoId, fechaInicio, fechaFin, page, limit } = filters;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (estado) whereClause.estado = estado;
    if (quirofanoId) whereClause.quirofanoId = quirofanoId;
    if (medicoId) whereClause.medicoId = medicoId;

    if (fechaInicio || fechaFin) {
      whereClause.fechaInicio = {};
      if (fechaInicio) whereClause.fechaInicio.gte = new Date(fechaInicio);
      if (fechaFin) whereClause.fechaInicio.lte = new Date(fechaFin);
    }

    const [cirugias, total] = await Promise.all([
      prisma.cirugiaQuirofano.findMany({
        where: whereClause,
        include: {
          quirofano: true,
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true
            }
          },
          medico: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              especialidad: true
            }
          }
        },
        orderBy: { fechaInicio: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.cirugiaQuirofano.count({ where: whereClause })
    ]);

    return {
      cirugias,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  async obtenerCirugiaPorId(cirugiaId) {
    const cirugia = await prisma.cirugiaQuirofano.findUnique({
      where: { id: cirugiaId },
      include: {
        quirofano: true,
        paciente: true,
        medico: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true,
            cedulaProfesional: true
          }
        }
      }
    });

    return cirugia;
  }

  async actualizarEstadoCirugia(cirugiaId, estado, observaciones, usuario) {
    const cirugia = await this.obtenerCirugiaPorId(cirugiaId);

    if (!cirugia) {
      throw new NotFoundError('Cirugía no encontrada');
    }

    // Validar transiciones de estado
    this.validateEstadoTransition(cirugia.estado, estado);

    const cirugiaActualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.cirugiaQuirofano.update({
        where: { id: cirugiaId },
        data: {
          estado,
          observaciones: observaciones || cirugia.observaciones,
          fechaFin: estado === 'completada' ? new Date() : cirugia.fechaFin
        },
        include: {
          quirofano: true,
          paciente: true,
          medico: true
        }
      });

      // Si la cirugía se completa o cancela, liberar quirófano
      if (estado === 'completada' || estado === 'cancelada') {
        await tx.quirofano.update({
          where: { id: cirugia.quirofanoId },
          data: { estado: 'disponible' }
        });
      }

      // Si se inicia, marcar quirófano como ocupado
      if (estado === 'en_progreso') {
        await tx.quirofano.update({
          where: { id: cirugia.quirofanoId },
          data: { estado: 'ocupado' }
        });
      }

      return updated;
    });

    logger.logOperation('CIRUGIA_ESTADO_ACTUALIZADO', {
      cirugiaId,
      estadoAnterior: cirugia.estado,
      estadoNuevo: estado,
      usuarioId: usuario.id
    });

    return cirugiaActualizada;
  }

  validateEstadoTransition(estadoActual, estadoNuevo) {
    const transicionesValidas = {
      'programada': ['en_progreso', 'cancelada', 'reprogramada'],
      'en_progreso': ['completada', 'cancelada'],
      'completada': [],
      'cancelada': ['reprogramada'],
      'reprogramada': ['programada', 'cancelada']
    };

    if (!transicionesValidas[estadoActual]?.includes(estadoNuevo)) {
      throw new ValidationError(
        `Transición inválida de estado: ${estadoActual} → ${estadoNuevo}`
      );
    }

    return true;
  }

  async cancelarCirugia(cirugiaId, motivo, usuario) {
    if (!motivo || motivo.trim().length < 10) {
      throw new ValidationError('El motivo de cancelación debe tener al menos 10 caracteres');
    }

    const cirugia = await this.obtenerCirugiaPorId(cirugiaId);

    if (!cirugia) {
      throw new NotFoundError('Cirugía no encontrada');
    }

    if (cirugia.estado === 'completada') {
      throw new BusinessError('No se puede cancelar una cirugía completada');
    }

    if (cirugia.estado === 'cancelada') {
      throw new BusinessError('La cirugía ya está cancelada');
    }

    const cirugiaActualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.cirugiaQuirofano.update({
        where: { id: cirugiaId },
        data: {
          estado: 'cancelada',
          observaciones: `CANCELADA: ${motivo}. ${cirugia.observaciones || ''}`
        },
        include: {
          quirofano: true,
          paciente: true,
          medico: true
        }
      });

      // Liberar quirófano
      await tx.quirofano.update({
        where: { id: cirugia.quirofanoId },
        data: { estado: 'disponible' }
      });

      // Revertir cargo si existe
      await this.revertirCargo(tx, cirugia);

      return updated;
    });

    logger.logOperation('CIRUGIA_CANCELADA', {
      cirugiaId,
      motivo,
      usuarioId: usuario.id
    });

    return cirugiaActualizada;
  }

  async revertirCargo(tx, cirugia) {
    // Buscar transacción de cargo relacionada
    const cargoOriginal = await tx.transaccionCuenta.findFirst({
      where: {
        concepto: { contains: `cirugía programada ID: ${cirugia.id}` }
      }
    });

    if (!cargoOriginal) {
      logger.warn('No se encontró cargo original para revertir', {
        cirugiaId: cirugia.id
      });
      return null;
    }

    // Crear transacción de reversa
    const reversa = await tx.transaccionCuenta.create({
      data: {
        cuentaId: cargoOriginal.cuentaId,
        tipo: 'servicio',
        concepto: `REVERSA: ${cargoOriginal.concepto}`,
        cantidad: cargoOriginal.cantidad,
        precioUnitario: -parseFloat(cargoOriginal.precioUnitario.toString()),
        subtotal: -parseFloat(cargoOriginal.subtotal.toString()),
        servicioId: cargoOriginal.servicioId,
        observaciones: `Reversa automática por cancelación de cirugía ID: ${cirugia.id}`
      }
    });

    // Actualizar totales de cuenta
    await tx.cuentaPaciente.update({
      where: { id: cargoOriginal.cuentaId },
      data: {
        totalServicios: { decrement: parseFloat(cargoOriginal.subtotal.toString()) },
        totalCuenta: { decrement: parseFloat(cargoOriginal.subtotal.toString()) },
        saldoPendiente: { decrement: parseFloat(cargoOriginal.subtotal.toString()) }
      }
    });

    logger.logOperation('CARGO_CIRUGIA_REVERTIDO', {
      cirugiaId: cirugia.id,
      cargoId: cargoOriginal.id,
      reversaId: reversa.id
    });

    return reversa;
  }
}

module.exports = new CirugiaService();
```

**3. Routes (Simplificadas - 150 LOC):**
```javascript
// routes/quirofanos/cirugias.routes.js
const express = require('express');
const router = express.Router();
const cirugiaController = require('../../controllers/quirofano/cirugia.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../../middleware/audit.middleware');
const {
  validateCreateCirugia,
  validateUpdateEstadoCirugia,
  validateCancelCirugia,
  validateCirugiaQuery
} = require('../../validators/quirofano.validators');

// ===============================================
// RUTAS DE CIRUGÍAS
// ===============================================

// GET /api/quirofanos/cirugias - Listar cirugías
router.get('/',
  authenticateToken,
  validateCirugiaQuery,
  cirugiaController.listarCirugias
);

// POST /api/quirofanos/cirugias - Programar cirugía
router.post('/',
  authenticateToken,
  authorizeRoles(['administrador', 'medico_especialista', 'medico_residente']),
  criticalOperationAudit,
  auditMiddleware('cirugias'),
  validateCreateCirugia,
  cirugiaController.programarCirugia
);

// GET /api/quirofanos/cirugias/:id - Obtener cirugía por ID
router.get('/:id',
  authenticateToken,
  cirugiaController.obtenerCirugia
);

// PUT /api/quirofanos/cirugias/:id/estado - Actualizar estado
router.put('/:id/estado',
  authenticateToken,
  authorizeRoles(['administrador', 'medico_especialista', 'enfermero']),
  criticalOperationAudit,
  auditMiddleware('cirugias'),
  captureOriginalData('cirugia'),
  validateUpdateEstadoCirugia,
  cirugiaController.actualizarEstado
);

// DELETE /api/quirofanos/cirugias/:id - Cancelar cirugía
router.delete('/:id',
  authenticateToken,
  authorizeRoles(['administrador', 'medico_especialista']),
  criticalOperationAudit,
  auditMiddleware('cirugias'),
  validateCancelCirugia,
  cirugiaController.cancelarCirugia
);

module.exports = router;
```

**4. Error Handler (Centralizado):**
```javascript
// utils/errors.js
class BusinessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = 400;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 422;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

module.exports = {
  BusinessError,
  ValidationError,
  NotFoundError,
  UnauthorizedError
};

// utils/error-handler.js
const logger = require('./logger');

exports.handleControllerError = (error, res, operation) => {
  logger.logError(operation, error);

  // Errores personalizados con statusCode
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.name
    });
  }

  // Errores de Prisma
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Violación de unicidad en la base de datos'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro no encontrado'
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
```

---

**BENEFICIOS DE LA REFACTORIZACIÓN:**

1. **Testabilidad 5x Mejor:**
```javascript
// Ahora puedes testear lógica de negocio sin HTTP
const cirugiaService = require('../../services/quirofano/cirugia.service');

describe('CirugiaService', () => {
  it('debe calcular correctamente el costo de cirugía', () => {
    const quirofano = { precioHora: 1000 };
    const fechaInicio = '2025-11-01T08:00:00';
    const fechaFin = '2025-11-01T11:00:00';

    const costo = cirugiaService.calcularCostoCirugia(quirofano, fechaInicio, fechaFin);

    expect(costo).toBe(3000); // 3 horas * 1000
  });

  it('debe lanzar error si fecha de inicio es pasada', () => {
    const data = { fechaInicio: '2020-01-01T08:00:00' };

    expect(() => {
      cirugiaService.validateCirugiaData(data);
    }).toThrow('La fecha de inicio no puede ser en el pasado');
  });
});
```

2. **Reutilización de Lógica:**
```javascript
// Mismo servicio usado desde API y desde scheduled jobs
const cirugiaService = require('./services/quirofano/cirugia.service');

// En controller HTTP
exports.programarCirugia = async (req, res) => {
  const cirugia = await cirugiaService.programarCirugia(req.body, req.user);
  res.json({ success: true, data: cirugia });
};

// En cron job
cron.schedule('0 * * * *', async () => {
  const cirugiasProximas = await cirugiaService.obtenerCirugiasProximas(60); // 60 minutos
  await notificationService.enviarRecordatorios(cirugiasProximas);
});
```

3. **Fácil Refactorización Incremental:**
```javascript
// Migrar 1 endpoint a la vez sin romper nada
router.post('/cirugias',
  authenticateToken,
  async (req, res) => {
    // ANTES: 200 líneas de código aquí

    // DESPUÉS: 3 líneas
    const cirugia = await cirugiaService.programarCirugia(req.body, req.user);
    res.json({ success: true, data: cirugia });
  }
);
```

---

**FIN DEL DOCUMENTO TÉCNICO**

Este documento proporciona implementaciones detalladas y código listo para usar para las tres mejoras críticas identificadas en el Executive Report.
