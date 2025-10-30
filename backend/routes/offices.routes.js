const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');
const logger = require('../utils/logger');

// ==============================================
// ENDPOINTS DE CONSULTORIOS (OFFICES)
// ==============================================

// GET /stats - Estadísticas de consultorios
router.get('/stats', async (req, res) => {
  try {
    const [
      totalConsultorios,
      distribucionEstado,
      distribucionEspecialidad
    ] = await Promise.all([
      prisma.consultorio.count(),
      prisma.consultorio.groupBy({
        by: ['estado'],
        _count: { estado: true }
      }),
      prisma.consultorio.groupBy({
        by: ['especialidad'],
        _count: { especialidad: true },
        where: { especialidad: { not: null } }
      })
    ]);

    const estadosDistribucion = distribucionEstado.reduce((acc, item) => {
      acc[item.estado] = item._count.estado;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalConsultorios,
        available: estadosDistribucion.disponible || 0,
        occupied: estadosDistribucion.ocupado || 0,
        maintenance: estadosDistribucion.mantenimiento || 0,
        distribution: distribucionEspecialidad.reduce((acc, item) => {
          acc[item.especialidad] = item._count.especialidad;
          return acc;
        }, {})
      },
      message: 'Estadísticas de consultorios obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_OFFICES_STATS', error);
    handlePrismaError(error, res);
  }
});

// GET / - Obtener consultorios
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { especialidad, estado, disponibles } = req.query;

    const where = {};
    if (especialidad) where.especialidad = especialidad;
    if (estado) where.estado = estado;
    if (disponibles === 'true') where.estado = 'disponible';

    const [consultorios, total] = await Promise.all([
      prisma.consultorio.findMany({
        where,
        orderBy: { numero: 'asc' },
        take: limit,
        skip: offset
      }),
      prisma.consultorio.count({ where })
    ]);

    const consultoriosFormatted = consultorios.map(consultorio => ({
      id: consultorio.id,
      numero: consultorio.numero,
      tipo: consultorio.tipo,
      especialidad: consultorio.especialidad,
      estado: consultorio.estado,
      descripcion: consultorio.descripcion,
      fechaCreacion: consultorio.createdAt,
      fechaActualizacion: consultorio.updatedAt
    }));

    res.json(formatPaginationResponse(consultoriosFormatted, total, page, limit));

  } catch (error) {
    logger.logError('GET_OFFICES', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// POST / - Crear consultorio
router.post('/', validateRequired(['numero']), async (req, res) => {
  try {
    const { numero, tipo = 'consulta_general', especialidad, descripcion, estado = 'disponible' } = req.body;

    const consultorioExistente = await prisma.consultorio.findUnique({
      where: { numero }
    });

    if (consultorioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un consultorio con ese número'
      });
    }

    const nuevoConsultorio = await prisma.consultorio.create({
      data: {
        numero,
        tipo,
        especialidad,
        descripcion,
        estado
      }
    });

    const consultorioFormatted = {
      id: nuevoConsultorio.id,
      numero: nuevoConsultorio.numero,
      tipo: nuevoConsultorio.tipo,
      especialidad: nuevoConsultorio.especialidad,
      estado: nuevoConsultorio.estado,
      descripcion: nuevoConsultorio.descripcion,
      fechaCreacion: nuevoConsultorio.createdAt,
      fechaActualizacion: nuevoConsultorio.updatedAt
    };

    res.status(201).json({
      success: true,
      data: consultorioFormatted,
      message: 'Consultorio creado exitosamente'
    });

  } catch (error) {
    logger.logError('CREATE_OFFICE', error, { numero: req.body.numero });
    handlePrismaError(error, res);
  }
});

// GET /:id - Obtener consultorio por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const consultorio = await prisma.consultorio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consultorio) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }

    const consultorioFormatted = {
      id: consultorio.id,
      numero: consultorio.numero,
      especialidad: consultorio.especialidad,
      estado: consultorio.estado,
      descripcion: consultorio.descripcion,
      fechaCreacion: consultorio.createdAt,
      fechaActualizacion: consultorio.updatedAt
    };

    res.json({
      success: true,
      data: consultorioFormatted,
      message: 'Consultorio obtenido exitosamente'
    });

  } catch (error) {
    logger.logError('GET_OFFICE_BY_ID', error, { officeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id - Actualizar consultorio
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, especialidad, descripcion, estado } = req.body;

    const consultorioExistente = await prisma.consultorio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consultorioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }

    // Verificar número único si se está cambiando
    if (numero && numero !== consultorioExistente.numero) {
      const numeroExistente = await prisma.consultorio.findUnique({
        where: { numero }
      });

      if (numeroExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un consultorio con ese número'
        });
      }
    }

    const consultorioActualizado = await prisma.consultorio.update({
      where: { id: parseInt(id) },
      data: {
        numero,
        especialidad,
        descripcion,
        estado
      }
    });

    const consultorioFormatted = {
      id: consultorioActualizado.id,
      numero: consultorioActualizado.numero,
      especialidad: consultorioActualizado.especialidad,
      estado: consultorioActualizado.estado,
      descripcion: consultorioActualizado.descripcion,
      fechaCreacion: consultorioActualizado.createdAt,
      fechaActualizacion: consultorioActualizado.updatedAt
    };

    res.json({
      success: true,
      data: consultorioFormatted,
      message: 'Consultorio actualizado exitosamente'
    });

  } catch (error) {
    logger.logError('UPDATE_OFFICE', error, { officeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// DELETE /:id - Eliminar consultorio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const consultorioExistente = await prisma.consultorio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consultorioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }

    await prisma.consultorio.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Consultorio eliminado exitosamente'
    });

  } catch (error) {
    logger.logError('DELETE_OFFICE', error, { officeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id/assign - Asignar consultorio
router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { medicoId, especialidad, observaciones } = req.body;

    const consultorio = await prisma.consultorio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consultorio) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }

    if (consultorio.estado !== 'disponible') {
      return res.status(400).json({
        success: false,
        message: 'El consultorio no está disponible para asignación'
      });
    }

    const consultorioActualizado = await prisma.consultorio.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'ocupado',
        especialidad: especialidad || consultorio.especialidad,
        descripcion: observaciones || consultorio.descripcion
      }
    });

    const consultorioFormatted = {
      id: consultorioActualizado.id,
      numero: consultorioActualizado.numero,
      especialidad: consultorioActualizado.especialidad,
      estado: consultorioActualizado.estado,
      descripcion: consultorioActualizado.descripcion,
      fechaCreacion: consultorioActualizado.createdAt,
      fechaActualizacion: consultorioActualizado.updatedAt
    };

    res.json({
      success: true,
      data: consultorioFormatted,
      message: 'Consultorio asignado exitosamente'
    });

  } catch (error) {
    logger.logError('ASSIGN_OFFICE', error, { officeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id/release - Liberar consultorio
router.put('/:id/release', async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const consultorio = await prisma.consultorio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consultorio) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }

    const consultorioActualizado = await prisma.consultorio.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'disponible',
        descripcion: observaciones || consultorio.descripcion
      }
    });

    const consultorioFormatted = {
      id: consultorioActualizado.id,
      numero: consultorioActualizado.numero,
      especialidad: consultorioActualizado.especialidad,
      estado: consultorioActualizado.estado,
      descripcion: consultorioActualizado.descripcion,
      fechaCreacion: consultorioActualizado.createdAt,
      fechaActualizacion: consultorioActualizado.updatedAt
    };

    res.json({
      success: true,
      data: consultorioFormatted,
      message: 'Consultorio liberado exitosamente'
    });

  } catch (error) {
    logger.logError('RELEASE_OFFICE', error, { officeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id/maintenance - Poner consultorio en mantenimiento
router.put('/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const consultorio = await prisma.consultorio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consultorio) {
      return res.status(404).json({
        success: false,
        message: 'Consultorio no encontrado'
      });
    }

    const consultorioActualizado = await prisma.consultorio.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'mantenimiento',
        descripcion: observaciones || consultorio.descripcion
      }
    });

    const consultorioFormatted = {
      id: consultorioActualizado.id,
      numero: consultorioActualizado.numero,
      especialidad: consultorioActualizado.especialidad,
      estado: consultorioActualizado.estado,
      descripcion: consultorioActualizado.descripcion,
      fechaCreacion: consultorioActualizado.createdAt,
      fechaActualizacion: consultorioActualizado.updatedAt
    };

    res.json({
      success: true,
      data: consultorioFormatted,
      message: 'Consultorio puesto en mantenimiento exitosamente'
    });

  } catch (error) {
    logger.logError('SET_OFFICE_MAINTENANCE', error, { officeId: req.params.id });
    handlePrismaError(error, res);
  }
});

module.exports = router;