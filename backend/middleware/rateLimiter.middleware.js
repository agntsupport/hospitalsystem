// ABOUTME: Middleware de rate limiting para proteger endpoints sensibles
// Implementa límites de tasa específicos para exports y reportes pesados

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limiter general para reportes
const reportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes de reportes. Por favor intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logWarning('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      user: req.user?.username || 'anonymous'
    });

    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes de reportes. Por favor intenta nuevamente en 15 minutos.'
    });
  }
});

// Rate limiter estricto para exports (PDF/Excel/CSV)
// Los exports son operaciones costosas que requieren más recursos
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // Solo 10 exports por IP cada 10 minutos
  message: {
    success: false,
    message: 'Límite de exportaciones alcanzado. Por favor intenta nuevamente en 10 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todas las requests incluso si son exitosas
  handler: (req, res) => {
    logger.logWarning('EXPORT_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      user: req.user?.username || 'anonymous',
      format: req.query.format
    });

    res.status(429).json({
      success: false,
      message: 'Límite de exportaciones alcanzado. Por favor intenta nuevamente en 10 minutos.',
      retryAfter: '10 minutos'
    });
  },
  // Usar IP + userId para usuarios autenticados (más específico)
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `export_${req.user.id}`;
    }
    return `export_${req.ip}`;
  }
});

// Rate limiter para reportes personalizados (custom reports)
// Son más peligrosos porque permiten extraer datos arbitrarios
const customReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Solo 20 reportes personalizados cada 15 minutos
  message: {
    success: false,
    message: 'Límite de reportes personalizados alcanzado. Por favor intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logWarning('CUSTOM_REPORT_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      user: req.user?.username || 'anonymous',
      reportType: req.body?.tipo
    });

    res.status(429).json({
      success: false,
      message: 'Límite de reportes personalizados alcanzado. Por favor intenta nuevamente en 15 minutos.'
    });
  },
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `custom_${req.user.id}`;
    }
    return `custom_${req.ip}`;
  }
});

module.exports = {
  reportsLimiter,
  exportLimiter,
  customReportLimiter
};
