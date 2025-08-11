// Middleware de validación centralizado

const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10, offset = 0 } = req.query;
  
  // Convertir a números y validar
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items
  const offsetNum = Math.max(0, parseInt(offset) || ((pageNum - 1) * limitNum));
  
  // Agregar valores validados al request
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: offsetNum
  };
  
  next();
};

const validateDateRange = (req, res, next) => {
  const { fechaInicio, fechaFin } = req.query;
  
  if (fechaInicio) {
    const startDate = new Date(fechaInicio);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio inválida'
      });
    }
    req.dateRange = { ...(req.dateRange || {}), start: startDate };
  }
  
  if (fechaFin) {
    const endDate = new Date(fechaFin);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de fin inválida'
      });
    }
    // Ajustar al final del día
    endDate.setHours(23, 59, 59, 999);
    req.dateRange = { ...(req.dateRange || {}), end: endDate };
  }
  
  next();
};

const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos faltantes: ${missing.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = {
  validatePagination,
  validateDateRange,
  validateRequired
};