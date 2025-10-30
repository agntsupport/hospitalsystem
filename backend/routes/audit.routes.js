const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ==============================================
// RUTAS DE AUDITORÍA
// ==============================================

// Obtener historial de auditoría para una entidad específica
router.get('/trail/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const auditRecords = await prisma.auditoriaOperacion.findMany({
      where: {
        entidadTipo: entityType,
        entidadId: parseInt(entityId)
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            rol: true
          }
        },
        causaCancelacion: {
          select: {
            codigo: true,
            descripcion: true,
            categoria: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      success: true,
      data: auditRecords
    });
  } catch (error) {
    logger.logError('GET_AUDIT_TRAIL', error, { filters: req.query });
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de auditoría'
    });
  }
});

// Obtener auditoría por módulo
router.get('/module/:module', authenticateToken, async (req, res) => {
  try {
    const { module } = req.params;
    const { 
      limit = 100, 
      offset = 0, 
      userId, 
      startDate, 
      endDate,
      tipoOperacion 
    } = req.query;

    const where = { modulo: module };
    
    // Filtros opcionales
    if (userId) where.usuarioId = parseInt(userId);
    if (tipoOperacion) where.tipoOperacion = { contains: tipoOperacion };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const auditRecords = await prisma.auditoriaOperacion.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            rol: true
          }
        },
        causaCancelacion: {
          select: {
            codigo: true,
            descripcion: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalRecords = await prisma.auditoriaOperacion.count({ where });

    res.json({
      success: true,
      data: {
        records: auditRecords,
        total: totalRecords,
        hasMore: (parseInt(offset) + parseInt(limit)) < totalRecords
      }
    });
  } catch (error) {
    logger.logError('GET_MODULE_AUDIT', error, { modulo: req.params.modulo });
    res.status(500).json({
      success: false,
      message: 'Error al obtener auditoría del módulo'
    });
  }
});

// Obtener actividad de un usuario específico
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar permisos - solo admin o el mismo usuario
    if (req.user.rol !== 'administrador' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver esta información'
      });
    }

    const auditRecords = await prisma.auditoriaOperacion.findMany({
      where: {
        usuarioId: parseInt(userId)
      },
      include: {
        causaCancelacion: {
          select: {
            codigo: true,
            descripcion: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      success: true,
      data: auditRecords
    });
  } catch (error) {
    logger.logError('GET_USER_ACTIVITY', error, { userId: req.params.userId });
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad del usuario'
    });
  }
});

// Obtener estadísticas de auditoría (solo admin)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Solo administradores pueden ver estadísticas generales
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden ver estadísticas de auditoría'
      });
    }

    const { startDate, endDate } = req.query;
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Operaciones por módulo
    const operacionesPorModulo = await prisma.auditoriaOperacion.groupBy({
      by: ['modulo'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Operaciones por usuario
    const operacionesPorUsuario = await prisma.auditoriaOperacion.groupBy({
      by: ['usuarioId', 'usuarioNombre', 'rolUsuario'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Cancelaciones
    const cancelaciones = await prisma.auditoriaOperacion.count({
      where: {
        ...where,
        causaCancelacionId: {
          not: null
        }
      }
    });

    const totalOperaciones = await prisma.auditoriaOperacion.count({ where });

    res.json({
      success: true,
      data: {
        totalOperaciones,
        cancelaciones,
        operacionesPorModulo,
        operacionesPorUsuario: operacionesPorUsuario.map(item => ({
          usuarioId: item.usuarioId,
          usuarioNombre: item.usuarioNombre,
          rolUsuario: item.rolUsuario,
          operaciones: item._count.id
        }))
      }
    });
  } catch (error) {
    logger.logError('GET_AUDIT_STATS', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de auditoría'
    });
  }
});

// Obtener causas de cancelación disponibles
router.get('/cancellation-causes', authenticateToken, async (req, res) => {
  try {
    const causes = await prisma.causaCancelacion.findMany({
      where: {
        activo: true
      },
      orderBy: {
        categoria: 'asc'
      }
    });

    res.json({
      success: true,
      data: causes
    });
  } catch (error) {
    logger.logError('GET_CANCELLATION_CAUSES', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener causas de cancelación'
    });
  }
});

module.exports = router;