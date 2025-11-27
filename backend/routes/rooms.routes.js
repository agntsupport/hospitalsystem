const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

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
    logger.logError('GET_ROOMS', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// POST / - Crear habitación
router.post('/', authenticateToken, auditMiddleware('habitaciones'), validateRequired(['numero', 'tipo', 'precioPorDia']), async (req, res) => {
  try {
    // Verificar permisos - solo administradores
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear habitaciones'
      });
    }

    const { numero, tipo, precioPorDia, descripcion } = req.body;

    // Validar que el precio sea positivo
    if (parseFloat(precioPorDia) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio por día debe ser un valor positivo'
      });
    }

    // Verificar que el número no esté duplicado
    const existeHabitacion = await prisma.habitacion.findUnique({
      where: { numero: numero.toString() }
    });

    if (existeHabitacion) {
      // Obtener números existentes para información
      const habitacionesExistentes = await prisma.habitacion.findMany({
        select: { numero: true },
        orderBy: { numero: 'asc' }
      });
      
      const numerosExistentes = habitacionesExistentes.map(h => h.numero);
      
      return res.status(400).json({
        success: false,
        message: `Ya existe una habitación con el número "${numero}". Números existentes: ${numerosExistentes.join(', ')}`,
        existingNumbers: numerosExistentes
      });
    }

    // Crear habitación y servicio asociado en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la habitación
      const habitacion = await tx.habitacion.create({
        data: {
          numero: numero.toString(),
          tipo,
          precioPorDia: parseFloat(precioPorDia),
          descripcion,
          estado: 'disponible'
        }
      });

      // 2. Crear servicio asociado automáticamente
      const codigoServicio = `HAB-${numero}`;
      const nombreServicio = `Habitación ${numero} - ${tipo} (por día)`;
      const descripcionServicio = `Cargo por uso de habitación ${numero} tipo ${tipo}. Tarifa diaria.`;
      
      const servicio = await tx.servicio.create({
        data: {
          codigo: codigoServicio,
          nombre: nombreServicio,
          descripcion: descripcionServicio,
          tipo: 'hospitalizacion',
          precio: parseFloat(precioPorDia),
          activo: true
        }
      });

      return { habitacion, servicio };
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.status(201).json({
      success: true,
      data: { 
        habitacion: result.habitacion,
        servicio: result.servicio 
      },
      message: 'Habitación y servicio asociado creados correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_ROOM', error, { numero: req.body.numero });
    handlePrismaError(error, res);
  }
});

// PUT /:id/assign - Asignar habitación
router.put('/:id/assign', authenticateToken, auditMiddleware('habitaciones'), captureOriginalData('habitacion'), async (req, res) => {
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
    logger.logError('ASSIGN_ROOM', error, { roomId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id/release - Liberar habitación
router.put('/:id/release', authenticateToken, auditMiddleware('habitaciones'), captureOriginalData('habitacion'), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const habitacionId = parseInt(id);

    // Verificar que la habitación existe
    const habitacion = await prisma.habitacion.findUnique({
      where: { id: habitacionId }
    });

    if (!habitacion) {
      return res.status(404).json({
        success: false,
        message: 'Habitación no encontrada'
      });
    }

    // Verificar que no hay hospitalizaciones activas en esta habitación
    const hospitalizacionActiva = await prisma.hospitalizacion.findFirst({
      where: {
        habitacionId: habitacionId,
        fechaAlta: null
      },
      include: {
        cuentaPaciente: {
          include: {
            paciente: true
          }
        }
      }
    });

    if (hospitalizacionActiva) {
      const paciente = hospitalizacionActiva.cuentaPaciente?.paciente;
      const nombrePaciente = paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente desconocido';
      return res.status(400).json({
        success: false,
        message: `No se puede liberar la habitación. Hay un paciente hospitalizado: ${nombrePaciente}. Primero debe dar de alta al paciente.`
      });
    }

    // Liberar la habitación
    const habitacionActualizada = await prisma.habitacion.update({
      where: { id: habitacionId },
      data: { estado: 'disponible' }
    });

    logger.logOperation('RELEASE_ROOM', {
      user: req.user?.username,
      roomId: habitacionId,
      roomNumber: habitacion.numero
    });

    res.json({
      success: true,
      data: { habitacion: habitacionActualizada },
      message: 'Habitación liberada correctamente'
    });

  } catch (error) {
    logger.logError('RELEASE_ROOM', error, { roomId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id/maintenance - Poner habitación en mantenimiento
router.put('/:id/maintenance', authenticateToken, auditMiddleware('habitaciones'), captureOriginalData('habitacion'), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const habitacionId = parseInt(id);

    // Verificar que la habitación existe
    const habitacion = await prisma.habitacion.findUnique({
      where: { id: habitacionId }
    });

    if (!habitacion) {
      return res.status(404).json({
        success: false,
        message: 'Habitación no encontrada'
      });
    }

    // Verificar que no hay hospitalizaciones activas
    const hospitalizacionActiva = await prisma.hospitalizacion.findFirst({
      where: {
        habitacionId: habitacionId,
        fechaAlta: null
      },
      include: {
        cuentaPaciente: {
          include: {
            paciente: true
          }
        }
      }
    });

    if (hospitalizacionActiva) {
      const paciente = hospitalizacionActiva.cuentaPaciente?.paciente;
      const nombrePaciente = paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente desconocido';
      return res.status(400).json({
        success: false,
        message: `No se puede poner en mantenimiento. Hay un paciente hospitalizado: ${nombrePaciente}`
      });
    }

    // Poner en mantenimiento
    const habitacionActualizada = await prisma.habitacion.update({
      where: { id: habitacionId },
      data: { estado: 'mantenimiento' }
    });

    logger.logOperation('MAINTENANCE_ROOM', {
      user: req.user?.username,
      roomId: habitacionId,
      roomNumber: habitacion.numero
    });

    res.json({
      success: true,
      data: { habitacion: habitacionActualizada },
      message: 'Habitación puesta en mantenimiento correctamente'
    });

  } catch (error) {
    logger.logError('MAINTENANCE_ROOM', error, { roomId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id - Actualizar habitación
router.put('/:id', authenticateToken, auditMiddleware('habitaciones'), captureOriginalData('habitacion'), validateRequired(['numero', 'tipo', 'precioPorDia']), async (req, res) => {
  try {
    // Verificar permisos - solo administradores
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden editar habitaciones'
      });
    }

    const { id } = req.params;
    const { numero, tipo, precioPorDia, descripcion, estado } = req.body;

    const habitacion = await prisma.habitacion.update({
      where: { id: parseInt(id) },
      data: {
        numero,
        tipo,
        precioPorDia: parseFloat(precioPorDia),
        descripcion,
        estado: estado || 'disponible'
      }
    });

    res.json({
      success: true,
      data: { habitacion },
      message: 'Habitación actualizada correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_ROOM', error, { roomId: req.params.id });
    handlePrismaError(error, res);
  }
});

// DELETE /:id - Eliminar habitación
router.delete('/:id', authenticateToken, auditMiddleware('habitaciones'), captureOriginalData('habitacion'), async (req, res) => {
  try {
    // Verificar permisos - solo administradores
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar habitaciones'
      });
    }

    const { id } = req.params;
    const habitacionId = parseInt(id);


    // Verificar que la habitación no esté ocupada
    const habitacion = await prisma.habitacion.findUnique({
      where: { id: habitacionId }
    });

    if (!habitacion) {
      return res.status(404).json({
        success: false,
        message: 'Habitación no encontrada'
      });
    }

    if (habitacion.estado === 'ocupada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una habitación que está ocupada'
      });
    }

    // Verificar si hay ingresos activos en esta habitación
    const ingresosActivos = await prisma.hospitalizacion.count({
      where: {
        habitacionId: habitacionId,
        fechaAlta: null
      }
    });

    if (ingresosActivos > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una habitación con ingresos activos'
      });
    }

    // Eliminar habitación y servicio asociado en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar servicio asociado (código: HAB-{numero})
      const codigoServicio = `HAB-${habitacion.numero}`;
      await tx.servicio.deleteMany({
        where: { codigo: codigoServicio }
      });

      // 2. Eliminar habitación
      await tx.habitacion.delete({
        where: { id: habitacionId }
      });
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      message: 'Habitación eliminada correctamente'
    });

  } catch (error) {
    logger.logError('DELETE_ROOM', error, { roomId: req.params.id });
    handlePrismaError(error, res);
  }
});

// GET /available-numbers - Números disponibles y sugerencias
router.get('/available-numbers', async (req, res) => {
  try {
    const habitacionesExistentes = await prisma.habitacion.findMany({
      select: { numero: true },
      orderBy: { numero: 'asc' }
    });
    
    const numerosExistentes = habitacionesExistentes.map(h => h.numero);
    
    // Generar sugerencias basadas en patrón numérico
    const sugerencias = [];
    for (let i = 1; i <= 20; i++) {
      const numeroSugerido = i.toString().padStart(2, '0');
      if (!numerosExistentes.includes(numeroSugerido)) {
        sugerencias.push(numeroSugerido);
        if (sugerencias.length >= 5) break; // Máximo 5 sugerencias
      }
    }
    
    res.json({
      success: true,
      data: {
        existingNumbers: numerosExistentes,
        suggestions: sugerencias,
        total: numerosExistentes.length
      }
    });
  } catch (error) {
    logger.logError('GET_AVAILABLE_ROOM_NUMBERS', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
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
    logger.logError('GET_ROOMS_STATS', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;