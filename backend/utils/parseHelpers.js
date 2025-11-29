// ABOUTME: Helpers para parsing seguro de parámetros de request
// ABOUTME: Evita errores de NaN y undefined en conversiones de tipos

/**
 * Convierte un valor a entero de forma segura
 * @param {any} value - Valor a convertir
 * @param {number} defaultValue - Valor por defecto si la conversión falla
 * @returns {number} - Entero válido o defaultValue
 */
const parseIntSafe = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  return parsed;
};

/**
 * Convierte un valor a float de forma segura
 * @param {any} value - Valor a convertir
 * @param {number} defaultValue - Valor por defecto si la conversión falla
 * @returns {number} - Float válido o defaultValue
 */
const parseFloatSafe = (value, defaultValue = 0.0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseFloat(value);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  return parsed;
};

/**
 * Convierte un valor a boolean de forma segura
 * @param {any} value - Valor a convertir
 * @param {boolean} defaultValue - Valor por defecto si es ambiguo
 * @returns {boolean}
 */
const parseBoolSafe = (value, defaultValue = false) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'si') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
};

/**
 * Extrae ID de parámetros de request de forma segura
 * @param {object} req - Express request object
 * @param {string} paramName - Nombre del parámetro (default: 'id')
 * @returns {{valid: boolean, value: number, error: string}} - Resultado de la extracción
 */
const extractIdParam = (req, paramName = 'id') => {
  const rawValue = req.params[paramName];
  const parsed = parseIntSafe(rawValue, -1);

  if (parsed <= 0) {
    return {
      valid: false,
      value: 0,
      error: `${paramName} inválido: debe ser un número entero positivo`
    };
  }

  return {
    valid: true,
    value: parsed,
    error: null
  };
};

/**
 * Extrae parámetros de paginación de query de forma segura
 * @param {object} query - req.query
 * @param {object} defaults - { page: 1, limit: 10 }
 * @returns {{page: number, limit: number, skip: number}}
 */
const extractPaginationParams = (query, defaults = { page: 1, limit: 10 }) => {
  const page = Math.max(1, parseIntSafe(query.page || query.pagina, defaults.page));
  const limit = Math.min(100, Math.max(1, parseIntSafe(query.limit || query.limite, defaults.limit)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = {
  parseIntSafe,
  parseFloatSafe,
  parseBoolSafe,
  extractIdParam,
  extractPaginationParams
};
