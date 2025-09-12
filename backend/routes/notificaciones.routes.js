const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// ==============================================
// ENDPOINTS DE NOTIFICACIONES
// ==============================================

// GET /api/notificaciones - Obtener notificaciones del usuario
router.get('/', 
  authenticateToken, 
  async (req, res) => {
    try {
      const { 
        leida,
        tipo,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir filtros
      const where = {
        usuarioId: req.user.id
      };
      
      if (leida !== undefined) {
        where.leida = leida === 'true';
      }
      
      if (tipo) {
        where.tipo = tipo;
      }

      // Obtener notificaciones
      const [notificaciones, total] = await Promise.all([
        prisma.notificacionSolicitud.findMany({
          where,
          include: {
            solicitud: {
              select: {
                id: true,
                numero: true,
                estado: true,
                prioridad: true,
                paciente: {
                  select: {
                    id: true,
                    nombre: true,
                    apellidoPaterno: true,
                    apellidoMaterno: true
                  }
                }
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { fechaEnvio: 'desc' }
        }),
        prisma.notificacionSolicitud.count({ where })
      ]);

      res.json({
        data: notificaciones,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      res.status(500).json({ 
        error: 'Error al obtener notificaciones',
        details: error.message 
      });
    }
  }
);

// GET /api/notificaciones/no-leidas/count - Contar notificaciones no leídas
router.get('/no-leidas/count', 
  authenticateToken, 
  async (req, res) => {
    try {
      const count = await prisma.notificacionSolicitud.count({
        where: {
          usuarioId: req.user.id,
          leida: false
        }
      });

      res.json({ count });
    } catch (error) {
      console.error('Error contando notificaciones:', error);
      res.status(500).json({ 
        error: 'Error al contar notificaciones',
        details: error.message 
      });
    }
  }
);

// PUT /api/notificaciones/:id/marcar-leida - Marcar notificación como leída
router.put('/:id/marcar-leida',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const notificacion = await prisma.notificacionSolicitud.findUnique({
        where: { id: parseInt(id) }
      });

      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      if (notificacion.usuarioId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta notificación' });
      }

      const notificacionActualizada = await prisma.notificacionSolicitud.update({
        where: { id: parseInt(id) },
        data: { 
          leida: true,
          fechaLectura: new Date()
        }
      });

      res.json({
        message: 'Notificación marcada como leída',
        notificacion: notificacionActualizada
      });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      res.status(500).json({ 
        error: 'Error al marcar notificación como leída',
        details: error.message 
      });
    }
  }
);

// PUT /api/notificaciones/marcar-todas-leidas - Marcar todas las notificaciones como leídas
router.put('/marcar-todas-leidas',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await prisma.notificacionSolicitud.updateMany({
        where: {
          usuarioId: req.user.id,
          leida: false
        },
        data: { 
          leida: true,
          fechaLectura: new Date()
        }
      });

      res.json({
        message: `${result.count} notificaciones marcadas como leídas`
      });
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      res.status(500).json({ 
        error: 'Error al marcar todas las notificaciones como leídas',
        details: error.message 
      });
    }
  }
);

// DELETE /api/notificaciones/:id - Eliminar notificación
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const notificacion = await prisma.notificacionSolicitud.findUnique({
        where: { id: parseInt(id) }
      });

      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      if (notificacion.usuarioId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta notificación' });
      }

      await prisma.notificacionSolicitud.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        message: 'Notificación eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      res.status(500).json({ 
        error: 'Error al eliminar notificación',
        details: error.message 
      });
    }
  }
);

// GET /api/notificaciones/tipos - Obtener tipos de notificaciones disponibles
router.get('/tipos',
  authenticateToken,
  async (req, res) => {
    try {
      const tipos = [
        { value: 'NUEVA_SOLICITUD', label: 'Nueva Solicitud' },
        { value: 'SOLICITUD_ASIGNADA', label: 'Solicitud Asignada' },
        { value: 'SOLICITUD_ENTREGADA', label: 'Solicitud Entregada' },
        { value: 'SOLICITUD_COMPLETADA', label: 'Solicitud Completada' },
        { value: 'SOLICITUD_CANCELADA', label: 'Solicitud Cancelada' },
        { value: 'STOCK_BAJO', label: 'Stock Bajo' }
      ];

      res.json(tipos);
    } catch (error) {
      console.error('Error obteniendo tipos de notificaciones:', error);
      res.status(500).json({ 
        error: 'Error al obtener tipos de notificaciones',
        details: error.message 
      });
    }
  }
);

module.exports = router;