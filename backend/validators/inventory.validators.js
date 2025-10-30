const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// ================================
// PRODUCTO VALIDATORS
// ================================

const validateProducto = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('El código debe tener entre 1 y 50 caracteres'),

  body('categoria')
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isIn(['medicamento', 'material_medico', 'insumo', 'equipo', 'otro'])
    .withMessage('Categoría inválida. Debe ser: medicamento, material_medico, insumo, equipo, u otro'),

  body('unidadMedida')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La unidad de medida debe tener máximo 50 caracteres'),

  body('precioVenta')
    .notEmpty()
    .withMessage('El precio de venta es requerido')
    .isFloat({ min: 0 })
    .withMessage('El precio de venta debe ser mayor o igual a 0')
    .custom((value) => {
      if (value < 0) {
        throw new Error('El precio no puede ser negativo');
      }
      return true;
    }),

  body('stockActual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock actual debe ser mayor o igual a 0')
    .custom((value) => {
      if (value < 0) {
        throw new Error('El stock no puede ser negativo');
      }
      return true;
    }),

  body('stockMinimo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock mínimo debe ser mayor o igual a 0'),

  body('stockMaximo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock máximo debe ser mayor o igual a 0')
    .custom((value, { req }) => {
      if (req.body.stockMinimo && value < req.body.stockMinimo) {
        throw new Error('El stock máximo debe ser mayor o igual al stock mínimo');
      }
      return true;
    }),

  body('proveedorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del proveedor debe ser un número entero positivo'),

  body('ubicacion')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ubicación debe tener máximo 100 caracteres'),

  body('lote')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El lote debe tener máximo 50 caracteres'),

  body('fechaVencimiento')
    .optional()
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser una fecha válida'),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false'),

  handleValidationErrors
];

const validateProductoUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('categoria')
    .optional()
    .isIn(['medicamento', 'material_medico', 'insumo', 'equipo', 'otro'])
    .withMessage('Categoría inválida'),

  body('precioVenta')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio de venta debe ser mayor o igual a 0')
    .custom((value) => {
      if (value < 0) {
        throw new Error('El precio no puede ser negativo');
      }
      return true;
    }),

  body('stockActual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock actual debe ser mayor o igual a 0')
    .custom((value) => {
      if (value < 0) {
        throw new Error('El stock no puede ser negativo');
      }
      return true;
    }),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false'),

  handleValidationErrors
];

// ================================
// PROVEEDOR VALIDATORS
// ================================

const validateProveedor = [
  body('nombreEmpresa')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la empresa es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('contactoNombre')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre de contacto debe tener máximo 100 caracteres'),

  body('contactoTelefono')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono debe tener máximo 20 caracteres')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('El teléfono solo puede contener números y caracteres especiales válidos'),

  body('contactoEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),

  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono debe tener máximo 20 caracteres'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),

  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('La dirección debe tener máximo 300 caracteres'),

  body('rfc')
    .optional()
    .trim()
    .isLength({ min: 12, max: 13 })
    .withMessage('El RFC debe tener 12 o 13 caracteres')
    .matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)
    .withMessage('El RFC no tiene un formato válido'),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false'),

  handleValidationErrors
];

const validateProveedorUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del proveedor debe ser un número entero positivo'),

  body('nombreEmpresa')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('contactoEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false'),

  handleValidationErrors
];

// ================================
// MOVIMIENTO VALIDATORS
// ================================

const validateMovimiento = [
  body('productoId')
    .notEmpty()
    .withMessage('El ID del producto es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),

  body('tipoMovimiento')
    .notEmpty()
    .withMessage('El tipo de movimiento es requerido')
    .isIn(['entrada', 'salida', 'ajuste', 'merma', 'transferencia'])
    .withMessage('Tipo de movimiento inválido. Debe ser: entrada, salida, ajuste, merma o transferencia'),

  body('cantidad')
    .notEmpty()
    .withMessage('La cantidad es requerida')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      return true;
    }),

  body('motivo')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo debe tener máximo 500 caracteres'),

  body('numeroDocumento')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El número de documento debe tener máximo 100 caracteres'),

  body('proveedorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del proveedor debe ser un número entero positivo'),

  handleValidationErrors
];

// ================================
// QUERY VALIDATORS
// ================================

const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La búsqueda debe tener máximo 200 caracteres'),

  handleValidationErrors
];

const validateProductoQuery = [
  ...validatePaginationQuery.slice(0, -1), // Exclude handleValidationErrors

  query('categoria')
    .optional()
    .isIn(['medicamento', 'material_medico', 'insumo', 'equipo', 'otro'])
    .withMessage('Categoría inválida'),

  query('stockBajo')
    .optional()
    .isBoolean()
    .withMessage('stockBajo debe ser true o false'),

  query('activo')
    .optional()
    .isBoolean()
    .withMessage('activo debe ser true o false'),

  handleValidationErrors
];

// ================================
// ID PARAMETER VALIDATORS
// ================================

const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  handleValidationErrors
];

module.exports = {
  validateProducto,
  validateProductoUpdate,
  validateProveedor,
  validateProveedorUpdate,
  validateMovimiento,
  validatePaginationQuery,
  validateProductoQuery,
  validateIdParam
};
