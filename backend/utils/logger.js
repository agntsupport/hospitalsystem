const winston = require('winston');
const path = require('path');

// Campos sensibles que deben ser redactados por HIPAA/privacidad
const SENSITIVE_FIELDS = [
  // Información médica (PHI)
  'diagnosticoIngreso',
  'diagnosticoEgreso',
  'motivoIngreso',
  'tratamiento',
  'medicamentos',
  'alergias',
  'antecedentesPatologicos',
  'antecedentesFamiliares',
  'medicamentosActuales',
  'observaciones',
  'notasMedicas',
  'notaEvolucion',
  'indicaciones',
  'resultados',
  'descripcionServicio',
  'detalles',

  // Información personal (PII)
  'password',
  'passwordHash',
  'contrasena',
  'curp',
  'rfc',
  'numeroSeguroSocial',
  'numeroPoliza',
  'tarjetaCredito',
  'cuentaBancaria',

  // Información de contacto sensible
  'email',
  'telefono',
  'direccion',
  'codigoPostal',
];

// Función para sanitizar objetos recursivamente
function sanitizeObject(obj, depth = 0) {
  if (depth > 10) return '[Max Depth Reached]'; // Prevenir recursión infinita

  if (obj === null || obj === undefined) return obj;

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Redactar campos sensibles
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Custom format para sanitización
const sanitizeFormat = winston.format((info) => {
  // Sanitizar el mensaje principal si es un objeto
  if (typeof info.message === 'object') {
    info.message = sanitizeObject(info.message);
  }

  // Sanitizar metadata adicional
  if (info.meta && typeof info.meta === 'object') {
    info.meta = sanitizeObject(info.meta);
  }

  return info;
});

// Configuración de formato
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  sanitizeFormat(),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Agregar stack trace si hay error
    if (stack) {
      msg += `\n${stack}`;
    }

    // Agregar metadata si existe (ya sanitizada)
    if (Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
  })
);

// Crear directorios de logs si no existen
const logsDir = path.join(__dirname, '../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar transportes
const transports = [
  // Console transport (solo en desarrollo)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),

  // File transport para errores
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport para todos los logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
  }),
];

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // No salir en excepciones no manejadas
  exitOnError: false,
});

// Helper methods para logging estructurado
logger.logOperation = (operation, data = {}) => {
  logger.info(`Operation: ${operation}`, sanitizeObject(data));
};

logger.logError = (operation, error, data = {}) => {
  logger.error(`Error in ${operation}`, {
    error: error.message,
    stack: error.stack,
    ...sanitizeObject(data),
  });
};

logger.logAuth = (action, userId, data = {}) => {
  logger.info(`Auth: ${action}`, {
    userId,
    ...sanitizeObject(data),
  });
};

logger.logDatabase = (operation, data = {}) => {
  // Solo loggear ID y tipo de operación, nunca datos médicos
  const safeData = {
    operation,
    ids: data.id || data.ids || data.pacienteId || data.usuarioId,
    count: data.count,
  };
  logger.debug(`Database: ${operation}`, safeData);
};

// Stream para Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
