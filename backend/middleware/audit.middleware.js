const { prisma } = require('../utils/database');

// Middleware para auditoría por módulo
const auditMiddleware = (modulo) => {
  return async (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);
    
    // Sobrescribir res.json para capturar respuestas exitosas
    res.json = async function(data) {
      // Si la operación fue exitosa y hay un usuario autenticado
      if (data.success && req.user) {
        const auditData = {
          modulo: modulo,
          tipoOperacion: `${req.method} ${req.route?.path || req.path}`,
          entidadTipo: determineEntityType(req.route?.path || req.path),
          entidadId: extractEntityId(data, req),
          usuarioId: req.user.id,
          usuarioNombre: req.user.username,
          rolUsuario: req.user.rol,
          datosNuevos: sanitizeData(req.body),
          motivo: req.body.motivo || null,
          causaCancelacionId: req.body.causaCancelacionId || null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent')
        };
        
        // Si es una operación de actualización, capturar datos anteriores
        if (req.method === 'PUT' || req.method === 'PATCH') {
          auditData.datosAnteriores = req.originalData || null;
        }
        
        // Registrar auditoría de forma asíncrona sin bloquear la respuesta
        setImmediate(async () => {
          try {
            await prisma.auditoriaOperacion.create({
              data: auditData
            });
          } catch (error) {
            console.error(`[AUDIT ERROR] Error al registrar auditoría para ${modulo}:`, error);
          }
        });
      }
      
      // Llamar al método original
      return originalJson(data);
    };
    
    next();
  };
};

// Middleware para operaciones críticas que requieren validación adicional
const criticalOperationAudit = async (req, res, next) => {
  const criticalOps = [
    'DELETE',
    '/cancel',
    '/descuento',
    '/alta',
    '/cierre'
  ];
  
  const isCritical = criticalOps.some(op => 
    req.method === op || req.path.includes(op.toLowerCase())
  );
  
  if (isCritical) {
    // Validar que haya motivo para operaciones críticas
    if (!req.body.motivo && req.method !== 'GET') {
      return res.status(400).json({
        success: false,
        message: 'Esta operación requiere especificar un motivo en el campo "motivo"'
      });
    }
    
    // Si es cancelación, validar causa
    if (req.path.includes('cancel') && !req.body.causaCancelacionId) {
      return res.status(400).json({
        success: false,
        message: 'Las cancelaciones requieren especificar una causa en causaCancelacionId'
      });
    }
    
    // Validar permisos para descuentos (solo administradores)
    if (req.path.includes('descuento') && req.user?.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden aplicar descuentos'
      });
    }
  }
  
  next();
};

// Middleware para capturar datos anteriores en operaciones de actualización
const captureOriginalData = (entityType) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const entityId = req.params.id;
        if (entityId && !isNaN(parseInt(entityId))) {
          let originalData = null;
          
          switch (entityType) {
            case 'producto':
              originalData = await prisma.producto.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
            case 'movimiento':
              originalData = await prisma.movimientoInventario.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
            case 'cuenta':
              originalData = await prisma.cuentaPaciente.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
            case 'paciente':
              originalData = await prisma.paciente.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
            case 'hospitalizacion':
              originalData = await prisma.hospitalizacion.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
            case 'quirofano':
              originalData = await prisma.quirofano.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
            case 'cirugia':
              originalData = await prisma.cirugiaQuirofano.findUnique({
                where: { id: parseInt(entityId) }
              });
              break;
          }
          
          req.originalData = originalData;
        }
      } catch (error) {
        console.error('Error capturing original data:', error);
      }
    }
    
    next();
  };
};

// Función auxiliar para determinar el tipo de entidad
const determineEntityType = (path) => {
  if (path.includes('patient')) return 'paciente';
  if (path.includes('product')) return 'producto';
  if (path.includes('movement')) return 'movimiento';
  if (path.includes('invoice')) return 'factura';
  if (path.includes('admission') || path.includes('hospitalization')) return 'hospitalizacion';
  if (path.includes('account')) return 'cuenta';
  if (path.includes('supplier')) return 'proveedor';
  if (path.includes('user')) return 'usuario';
  if (path.includes('quirofano')) return 'quirofano';
  if (path.includes('cirugia')) return 'cirugia';
  return 'general';
};

// Función auxiliar para extraer ID de entidad
const extractEntityId = (data, req) => {
  // Prioridad: ID en data.data, luego en params, luego 0
  if (data.data?.id) return data.data.id;
  if (req.params?.id) return parseInt(req.params.id);
  if (data.id) return data.id;
  return 0;
};

// Función auxiliar para limpiar datos sensibles antes de guardar
const sanitizeData = (data) => {
  if (!data) return null;
  
  const sanitized = { ...data };
  
  // Eliminar campos sensibles
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.authorization;
  
  // Truncar campos muy largos
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '... [truncado]';
    }
  });
  
  return sanitized;
};

module.exports = {
  auditMiddleware,
  criticalOperationAudit,
  captureOriginalData
};