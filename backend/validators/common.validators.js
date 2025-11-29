// ABOUTME: Validadores comunes reutilizables con express-validator
// ABOUTME: Patrones de validación para IDs, fechas, paginación y campos genéricos

const { body, param, query, validationResult } = require('express-validator');

// ================================
// MIDDLEWARE DE ERRORES
// ================================

/**
 * Middleware centralizado para manejar errores de validación
 */
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
// VALIDADORES DE ID
// ================================

/**
 * Valida parámetro :id como entero positivo
 */
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
  handleValidationErrors
];

/**
 * Crea validador de ID para parámetro específico
 * @param {string} paramName - Nombre del parámetro
 * @param {string} fieldLabel - Etiqueta para mensajes de error
 */
const createIdParamValidator = (paramName, fieldLabel = 'ID') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`El ${fieldLabel} debe ser un número entero positivo`),
  handleValidationErrors
];

/**
 * Valida ID en body como entero positivo
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} required - Si es requerido
 */
const validateIdField = (fieldName, required = true) => {
  const validator = body(fieldName)
    .isInt({ min: 1 })
    .withMessage(`El campo ${fieldName} debe ser un número entero positivo`);

  return required ? validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`) : validator.optional();
};

// ================================
// VALIDADORES DE PAGINACIÓN
// ================================

/**
 * Validadores de paginación estándar
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  handleValidationErrors
];

// ================================
// VALIDADORES DE FECHA
// ================================

/**
 * Valida rango de fechas en query
 */
const validateDateRange = [
  query('fechaInicio')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida (ISO8601)'),

  query('fechaFin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser una fecha válida (ISO8601)')
    .custom((value, { req }) => {
      if (req.query.fechaInicio && value) {
        const start = new Date(req.query.fechaInicio);
        const end = new Date(value);
        if (end < start) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Valida campo de fecha en body
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} required - Si es requerido
 */
const validateDateField = (fieldName, required = false) => {
  const validator = body(fieldName)
    .isISO8601()
    .withMessage(`El campo ${fieldName} debe ser una fecha válida`);

  return required ? validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`) : validator.optional();
};

// ================================
// VALIDADORES DE TEXTO
// ================================

/**
 * Valida campo de texto con límites de longitud
 * @param {string} fieldName - Nombre del campo
 * @param {number} minLength - Longitud mínima
 * @param {number} maxLength - Longitud máxima
 * @param {boolean} required - Si es requerido
 */
const validateTextField = (fieldName, minLength = 1, maxLength = 255, required = true) => {
  let validator = body(fieldName).trim();

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  return validator
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`El campo ${fieldName} debe tener entre ${minLength} y ${maxLength} caracteres`);
};

/**
 * Valida campo de búsqueda en query
 */
const validateSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La búsqueda debe tener máximo 200 caracteres'),

  query('buscar')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La búsqueda debe tener máximo 200 caracteres'),

  handleValidationErrors
];

// ================================
// VALIDADORES DE EMAIL
// ================================

/**
 * Valida email en body
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} required - Si es requerido
 */
const validateEmailField = (fieldName = 'email', required = false) => {
  let validator = body(fieldName).trim();

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  return validator
    .isEmail()
    .withMessage(`El campo ${fieldName} debe ser un email válido`)
    .normalizeEmail();
};

// ================================
// VALIDADORES DE TELÉFONO
// ================================

/**
 * Valida teléfono en body
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} required - Si es requerido
 */
const validatePhoneField = (fieldName = 'telefono', required = false) => {
  let validator = body(fieldName).trim();

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  return validator
    .isLength({ min: 7, max: 20 })
    .withMessage(`El campo ${fieldName} debe tener entre 7 y 20 caracteres`)
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage(`El campo ${fieldName} solo puede contener números y caracteres especiales válidos`);
};

// ================================
// VALIDADORES DE NÚMEROS
// ================================

/**
 * Valida campo numérico decimal
 * @param {string} fieldName - Nombre del campo
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo (opcional)
 * @param {boolean} required - Si es requerido
 */
const validateDecimalField = (fieldName, min = 0, max = null, required = true) => {
  let validator = body(fieldName);

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  const constraints = { min };
  if (max !== null) {
    constraints.max = max;
  }

  return validator
    .isFloat(constraints)
    .withMessage(`El campo ${fieldName} debe ser un número${max ? ` entre ${min} y ${max}` : ` mayor o igual a ${min}`}`);
};

/**
 * Valida campo numérico entero
 * @param {string} fieldName - Nombre del campo
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo (opcional)
 * @param {boolean} required - Si es requerido
 */
const validateIntegerField = (fieldName, min = 0, max = null, required = true) => {
  let validator = body(fieldName);

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  const constraints = { min };
  if (max !== null) {
    constraints.max = max;
  }

  return validator
    .isInt(constraints)
    .withMessage(`El campo ${fieldName} debe ser un entero${max ? ` entre ${min} y ${max}` : ` mayor o igual a ${min}`}`);
};

// ================================
// VALIDADORES DE ENUM
// ================================

/**
 * Valida campo enum en body
 * @param {string} fieldName - Nombre del campo
 * @param {string[]} allowedValues - Valores permitidos
 * @param {boolean} required - Si es requerido
 */
const validateEnumField = (fieldName, allowedValues, required = true) => {
  let validator = body(fieldName);

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  return validator
    .isIn(allowedValues)
    .withMessage(`El campo ${fieldName} debe ser uno de: ${allowedValues.join(', ')}`);
};

/**
 * Valida campo enum en query
 * @param {string} fieldName - Nombre del campo
 * @param {string[]} allowedValues - Valores permitidos
 */
const validateEnumQuery = (fieldName, allowedValues) => {
  return query(fieldName)
    .optional()
    .isIn(allowedValues)
    .withMessage(`El filtro ${fieldName} debe ser uno de: ${allowedValues.join(', ')}`);
};

// ================================
// VALIDADORES DE BOOLEAN
// ================================

/**
 * Valida campo boolean en body
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} required - Si es requerido
 */
const validateBooleanField = (fieldName, required = false) => {
  let validator = body(fieldName);

  if (required) {
    validator = validator.notEmpty().withMessage(`El campo ${fieldName} es requerido`);
  } else {
    validator = validator.optional();
  }

  return validator
    .isBoolean()
    .withMessage(`El campo ${fieldName} debe ser true o false`);
};

/**
 * Valida campo boolean en query
 * @param {string} fieldName - Nombre del campo
 */
const validateBooleanQuery = (fieldName) => {
  return query(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`El filtro ${fieldName} debe ser true o false`);
};

// ================================
// UTILIDADES
// ================================

/**
 * Combina múltiples validadores en un solo array
 * @param {...Array} validators - Arrays de validadores
 * @returns {Array} - Array combinado de validadores
 */
const combineValidators = (...validators) => {
  // Flatten y filtrar duplicados de handleValidationErrors
  const combined = validators.flat().filter((v, i, arr) => {
    // Mantener solo el último handleValidationErrors
    if (v === handleValidationErrors) {
      return i === arr.lastIndexOf(handleValidationErrors);
    }
    return true;
  });

  // Asegurar que handleValidationErrors esté al final
  const withoutHandler = combined.filter(v => v !== handleValidationErrors);
  return [...withoutHandler, handleValidationErrors];
};

module.exports = {
  // Middleware
  handleValidationErrors,

  // ID validators
  validateIdParam,
  createIdParamValidator,
  validateIdField,

  // Pagination
  validatePagination,

  // Date validators
  validateDateRange,
  validateDateField,

  // Text validators
  validateTextField,
  validateSearchQuery,

  // Contact validators
  validateEmailField,
  validatePhoneField,

  // Number validators
  validateDecimalField,
  validateIntegerField,

  // Enum validators
  validateEnumField,
  validateEnumQuery,

  // Boolean validators
  validateBooleanField,
  validateBooleanQuery,

  // Utilities
  combineValidators
};
