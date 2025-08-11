const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');

// ==============================================
// ENDPOINTS DE HABITACIONES
// ==============================================

// GET / - Obtener habitaciones
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { tipo, estado, disponibles } = req.query;

    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (disponibles === 'true') where.estado = 'disponible';

    const [habitaciones, total] = await Promise.all([
      prisma.habitacion.findMany({
        where,
        orderBy: { numero: 'asc' },
        take: limit,
        skip: offset
      }),
      prisma.habitacion.count({ where })
    ]);

    const habitacionesFormatted = habitaciones.map(habitacion => ({
      id: habitacion.id,
      numero: habitacion.numero,
      tipo: habitacion.tipo,
      precioPorDia: parseFloat(habitacion.precioPorDia),
      estado: habitacion.estado,
      descripcion: habitacion.descripcion,
      fechaCreacion: habitacion.createdAt,
      fechaActualizacion: habitacion.updatedAt
    }));

    res.json(formatPaginationResponse(habitacionesFormatted, total, page, limit));

  } catch (error) {
    console.error('Error obteniendo habitaciones:', error);
    handlePrismaError(error, res);
  }
});

// POST / - Crear habitación
router.post('/', validateRequired(['numero', 'tipo', 'precioPorDia']), async (req, res) => {
  try {
    const { numero, tipo, precioPorDia, descripcion } = req.body;

    const habitacion = await prisma.habitacion.create({
      data: {
        numero,
        tipo,
        precioPorDia: parseFloat(precioPorDia),
        descripcion,
        estado: 'disponible'
      }
    });

    res.status(201).json({
      success: true,
      data: { habitacion },
      message: 'Habitación creada correctamente'
    });

  } catch (error) {
    console.error('Error creando habitación:', error);
    handlePrismaError(error, res);
  }
});

// PUT /:id/assign - Asignar habitación
router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { pacienteId } = req.body;

    const habitacion = await prisma.habitacion.update({
      where: { id: parseInt(id) },
      data: { estado: 'ocupada' }
    });

    res.json({
      success: true,
      data: { habitacion },
      message: 'Habitación asignada correctamente'
    });

  } catch (error) {
    console.error('Error asignando habitación:', error);
    handlePrismaError(error, res);
  }
});

// GET /stats - Estadísticas de habitaciones
router.get('/stats', async (req, res) => {
  try {
    const [
      totalHabitaciones,
      distribucionTipo,
      distribucionEstado
    ] = await Promise.all([
      prisma.habitacion.count(),
      prisma.habitacion.groupBy({
        by: ['tipo'],
        _count: { tipo: true }
      }),
      prisma.habitacion.groupBy({
        by: ['estado'],
        _count: { estado: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalHabitaciones,
        porTipo: distribucionTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count.tipo;
          return acc;
        }, {}),
        porEstado: distribucionEstado.reduce((acc, item) => {
          acc[item.estado] = item._count.estado;
          return acc;
        }, {})
      },
      message: 'Estadísticas obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;