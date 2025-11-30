// ABOUTME: Rutas para gestión de recibos y comprobantes formales
// ABOUTME: Endpoints para emitir, consultar, cancelar y reimprimir recibos de pago

const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ==============================================
// FUNCIONES AUXILIARES
// ==============================================

// Generar folio automático
async function generarFolioRecibo() {
  const year = new Date().getFullYear();
  const prefix = `REC-${year}-`;

  const ultimoRecibo = await prisma.recibo.findFirst({
    where: { folio: { startsWith: prefix } },
    orderBy: { folio: 'desc' }
  });

  let consecutivo = 1;
  if (ultimoRecibo) {
    const lastNum = parseInt(ultimoRecibo.folio.split('-')[2]) || 0;
    consecutivo = lastNum + 1;
  }

  return `${prefix}${consecutivo.toString().padStart(6, '0')}`;
}

// ==============================================
// ENDPOINTS DE RECIBOS
// NOTA: Las rutas estáticas van ANTES de las dinámicas
// ==============================================

// GET /stats - Estadísticas de recibos (Admin, Socio)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id
router.get('/stats', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const where = {};
    if (fechaInicio || fechaFin) {
      where.fechaEmision = {};
      if (fechaInicio) where.fechaEmision.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaEmision.lte = new Date(fechaFin);
    }

    const [
      totalRecibos,
      recibosPorTipo,
      recibosPorEstado,
      montoTotalEmitido,
      montoCancelado
    ] = await Promise.all([
      prisma.recibo.count({ where }),
      prisma.recibo.groupBy({
        by: ['tipo'],
        where,
        _count: { id: true },
        _sum: { total: true }
      }),
      prisma.recibo.groupBy({
        by: ['estado'],
        where,
        _count: { id: true }
      }),
      prisma.recibo.aggregate({
        where: { ...where, estado: { not: 'cancelado' } },
        _sum: { total: true }
      }),
      prisma.recibo.aggregate({
        where: { ...where, estado: 'cancelado' },
        _sum: { total: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalRecibos,
        montoTotalEmitido: parseFloat(montoTotalEmitido._sum.total || 0),
        montoCancelado: parseFloat(montoCancelado._sum.total || 0),
        porTipo: recibosPorTipo.reduce((acc, item) => {
          acc[item.tipo] = {
            cantidad: item._count.id,
            monto: parseFloat(item._sum.total || 0)
          };
          return acc;
        }, {}),
        porEstado: recibosPorEstado.reduce((acc, item) => {
          acc[item.estado] = item._count.id;
          return acc;
        }, {})
      },
      message: 'Estadísticas de recibos obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_RECIBOS_STATS', error);
    handlePrismaError(error, res);
  }
});

// GET /folio/:folio - Buscar recibo por folio (Admin, Cajero, Socio)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id
router.get('/folio/:folio', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const { folio } = req.params;

    const recibo = await prisma.recibo.findUnique({
      where: { folio },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        },
        cuenta: {
          select: { id: true, tipoAtencion: true, estado: true }
        },
        cajero: {
          select: { id: true, username: true, apellidos: true }
        }
      }
    });

    if (!recibo) {
      return res.status(404).json({
        success: false,
        message: 'Recibo no encontrado'
      });
    }

    res.json({
      success: true,
      data: recibo,
      message: 'Recibo encontrado'
    });

  } catch (error) {
    logger.logError('GET_RECIBO_BY_FOLIO', error);
    handlePrismaError(error, res);
  }
});

// GET /paciente/:pacienteId - Obtener recibos de un paciente (Cajero, Admin, Socio)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id
router.get('/paciente/:pacienteId', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recibos, total] = await Promise.all([
      prisma.recibo.findMany({
        where: { pacienteId: parseInt(pacienteId) },
        include: {
          cuenta: {
            select: { id: true, tipoAtencion: true }
          },
          cajero: {
            select: { id: true, username: true, apellidos: true }
          }
        },
        orderBy: { fechaEmision: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.recibo.count({ where: { pacienteId: parseInt(pacienteId) } })
    ]);

    res.json({
      success: true,
      data: {
        recibos: recibos.map(r => ({
          id: r.id,
          folio: r.folio,
          tipo: r.tipo,
          cuenta: r.cuenta,
          total: parseFloat(r.total),
          metodoPago: r.metodoPago,
          fechaEmision: r.fechaEmision,
          estado: r.estado,
          cajero: r.cajero
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Recibos del paciente obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_RECIBOS_PACIENTE', error);
    handlePrismaError(error, res);
  }
});

// GET /cuenta/:cuentaId - Obtener recibos de una cuenta (Cajero, Admin, Socio)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id
router.get('/cuenta/:cuentaId', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const { cuentaId } = req.params;

    const recibos = await prisma.recibo.findMany({
      where: { cuentaId: parseInt(cuentaId) },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellidoPaterno: true }
        },
        cajero: {
          select: { id: true, username: true, apellidos: true }
        }
      },
      orderBy: { fechaEmision: 'desc' }
    });

    const totalEmitidos = recibos.filter(r => r.estado === 'emitido' || r.estado === 'reimpreso').length;
    const totalCancelados = recibos.filter(r => r.estado === 'cancelado').length;
    const montoTotal = recibos
      .filter(r => r.estado !== 'cancelado')
      .reduce((sum, r) => sum + parseFloat(r.total), 0);

    res.json({
      success: true,
      data: {
        recibos: recibos.map(r => ({
          id: r.id,
          folio: r.folio,
          tipo: r.tipo,
          total: parseFloat(r.total),
          metodoPago: r.metodoPago,
          fechaEmision: r.fechaEmision,
          estado: r.estado,
          cajero: r.cajero
        })),
        resumen: {
          totalRecibos: recibos.length,
          emitidos: totalEmitidos,
          cancelados: totalCancelados,
          montoTotal
        }
      },
      message: 'Recibos de la cuenta obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_RECIBOS_CUENTA', error);
    handlePrismaError(error, res);
  }
});

// GET / - Listar recibos con filtros (Admin, Cajero, Socio)
router.get('/', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      tipo,
      estado,
      pacienteId,
      cuentaId,
      cajeroId,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    if (fechaInicio || fechaFin) {
      where.fechaEmision = {};
      if (fechaInicio) where.fechaEmision.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaEmision.lte = new Date(fechaFin);
    }

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (pacienteId) where.pacienteId = parseInt(pacienteId);
    if (cuentaId) where.cuentaId = parseInt(cuentaId);
    if (cajeroId) where.cajeroId = parseInt(cajeroId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recibos, total] = await Promise.all([
      prisma.recibo.findMany({
        where,
        include: {
          paciente: {
            select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true }
          },
          cuenta: {
            select: { id: true, tipoAtencion: true, estado: true }
          },
          cajero: {
            select: { id: true, username: true, apellidos: true }
          },
          canceladoPor: {
            select: { id: true, username: true, apellidos: true }
          }
        },
        orderBy: { fechaEmision: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.recibo.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        recibos: recibos.map(r => ({
          id: r.id,
          folio: r.folio,
          serie: r.serie,
          tipo: r.tipo,
          paciente: r.paciente ? {
            id: r.paciente.id,
            nombre: `${r.paciente.nombre} ${r.paciente.apellidoPaterno} ${r.paciente.apellidoMaterno || ''}`.trim()
          } : null,
          cuenta: r.cuenta,
          montoRecibido: parseFloat(r.montoRecibido),
          cambio: parseFloat(r.cambio),
          metodoPago: r.metodoPago,
          subtotal: parseFloat(r.subtotal),
          iva: parseFloat(r.iva),
          total: parseFloat(r.total),
          fechaEmision: r.fechaEmision,
          estado: r.estado,
          cajero: r.cajero,
          canceladoPor: r.canceladoPor,
          fechaCancelacion: r.fechaCancelacion,
          motivoCancelacion: r.motivoCancelacion
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Recibos obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_RECIBOS', error);
    handlePrismaError(error, res);
  }
});

// GET /:id - Obtener recibo por ID (Admin, Cajero, Socio)
router.get('/:id', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const { id } = req.params;

    const recibo = await prisma.recibo.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            telefono: true,
            email: true,
            direccion: true
          }
        },
        cuenta: {
          select: {
            id: true,
            tipoAtencion: true,
            estado: true,
            totalCuenta: true,
            anticipo: true
          }
        },
        cajero: {
          select: { id: true, username: true, apellidos: true }
        },
        canceladoPor: {
          select: { id: true, username: true, apellidos: true }
        }
      }
    });

    if (!recibo) {
      return res.status(404).json({
        success: false,
        message: 'Recibo no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: recibo.id,
        folio: recibo.folio,
        serie: recibo.serie,
        tipo: recibo.tipo,
        paciente: recibo.paciente ? {
          id: recibo.paciente.id,
          nombre: `${recibo.paciente.nombre} ${recibo.paciente.apellidoPaterno} ${recibo.paciente.apellidoMaterno || ''}`.trim(),
          telefono: recibo.paciente.telefono,
          email: recibo.paciente.email,
          direccion: recibo.paciente.direccion
        } : null,
        cuenta: recibo.cuenta,
        montoRecibido: parseFloat(recibo.montoRecibido),
        cambio: parseFloat(recibo.cambio),
        metodoPago: recibo.metodoPago,
        conceptos: recibo.conceptos,
        subtotal: parseFloat(recibo.subtotal),
        iva: parseFloat(recibo.iva),
        total: parseFloat(recibo.total),
        fechaEmision: recibo.fechaEmision,
        estado: recibo.estado,
        cajero: recibo.cajero,
        canceladoPor: recibo.canceladoPor,
        fechaCancelacion: recibo.fechaCancelacion,
        motivoCancelacion: recibo.motivoCancelacion,
        createdAt: recibo.createdAt
      },
      message: 'Recibo obtenido correctamente'
    });

  } catch (error) {
    logger.logError('GET_RECIBO_BY_ID', error);
    handlePrismaError(error, res);
  }
});

// POST / - Emitir nuevo recibo (Cajero, Admin)
router.post('/', authenticateToken, authorizeRoles(['administrador', 'cajero']), async (req, res) => {
  try {
    const {
      tipo,
      cuentaId,
      pacienteId,
      pagoId,
      montoRecibido,
      cambio = 0,
      metodoPago,
      conceptos,
      subtotal,
      iva = 0,
      total,
      serie = 'A'
    } = req.body;

    // Validaciones
    if (!tipo || !cuentaId || !pacienteId || !metodoPago || !conceptos || !subtotal || !total) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: tipo, cuentaId, pacienteId, metodoPago, conceptos, subtotal, total'
      });
    }

    // Validar tipo
    const tiposValidos = ['cobro_cuenta', 'pago_parcial', 'anticipo', 'devolucion'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`
      });
    }

    // Validar cuenta existe
    const cuenta = await prisma.cuentaPaciente.findUnique({
      where: { id: parseInt(cuentaId) }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    // Validar paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(pacienteId) }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Generar folio
    const folio = await generarFolioRecibo();

    // Crear recibo
    const recibo = await prisma.recibo.create({
      data: {
        folio,
        serie,
        tipo,
        cuentaId: parseInt(cuentaId),
        pagoId: pagoId ? parseInt(pagoId) : null,
        pacienteId: parseInt(pacienteId),
        cajeroId: req.user.id,
        montoRecibido: parseFloat(montoRecibido || total),
        cambio: parseFloat(cambio),
        metodoPago,
        conceptos,
        subtotal: parseFloat(subtotal),
        iva: parseFloat(iva),
        total: parseFloat(total)
      },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true }
        },
        cuenta: {
          select: { id: true, tipoAtencion: true }
        },
        cajero: {
          select: { id: true, username: true, apellidos: true }
        }
      }
    });

    logger.logOperation('RECIBO_EMITIDO', {
      reciboId: recibo.id,
      folio: recibo.folio,
      tipo,
      total,
      cajeroId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: {
        id: recibo.id,
        folio: recibo.folio,
        serie: recibo.serie,
        tipo: recibo.tipo,
        paciente: recibo.paciente ? {
          id: recibo.paciente.id,
          nombre: `${recibo.paciente.nombre} ${recibo.paciente.apellidoPaterno} ${recibo.paciente.apellidoMaterno || ''}`.trim()
        } : null,
        cuenta: recibo.cuenta,
        montoRecibido: parseFloat(recibo.montoRecibido),
        cambio: parseFloat(recibo.cambio),
        metodoPago: recibo.metodoPago,
        conceptos: recibo.conceptos,
        subtotal: parseFloat(recibo.subtotal),
        iva: parseFloat(recibo.iva),
        total: parseFloat(recibo.total),
        fechaEmision: recibo.fechaEmision,
        estado: recibo.estado,
        cajero: recibo.cajero
      },
      message: `Recibo ${folio} emitido correctamente`
    });

  } catch (error) {
    logger.logError('EMITIR_RECIBO', error);
    handlePrismaError(error, res);
  }
});

// PUT /:id/cancelar - Cancelar recibo (Admin)
router.put('/:id/cancelar', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere motivo de cancelación'
      });
    }

    const recibo = await prisma.recibo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!recibo) {
      return res.status(404).json({
        success: false,
        message: 'Recibo no encontrado'
      });
    }

    if (recibo.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'El recibo ya está cancelado'
      });
    }

    const reciboCancelado = await prisma.recibo.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'cancelado',
        fechaCancelacion: new Date(),
        canceladoPorId: req.user.id,
        motivoCancelacion: motivo
      },
      include: {
        canceladoPor: {
          select: { id: true, username: true, apellidos: true }
        }
      }
    });

    logger.logOperation('RECIBO_CANCELADO', {
      reciboId: reciboCancelado.id,
      folio: reciboCancelado.folio,
      motivo,
      canceladoPorId: req.user.id
    });

    res.json({
      success: true,
      data: {
        id: reciboCancelado.id,
        folio: reciboCancelado.folio,
        estado: reciboCancelado.estado,
        fechaCancelacion: reciboCancelado.fechaCancelacion,
        canceladoPor: reciboCancelado.canceladoPor,
        motivoCancelacion: reciboCancelado.motivoCancelacion
      },
      message: `Recibo ${reciboCancelado.folio} cancelado correctamente`
    });

  } catch (error) {
    logger.logError('CANCELAR_RECIBO', error);
    handlePrismaError(error, res);
  }
});

// PUT /:id/reimprimir - Marcar recibo como reimpreso (Cajero, Admin)
router.put('/:id/reimprimir', authenticateToken, authorizeRoles(['administrador', 'cajero']), async (req, res) => {
  try {
    const { id } = req.params;

    const recibo = await prisma.recibo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!recibo) {
      return res.status(404).json({
        success: false,
        message: 'Recibo no encontrado'
      });
    }

    if (recibo.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede reimprimir un recibo cancelado'
      });
    }

    const reciboActualizado = await prisma.recibo.update({
      where: { id: parseInt(id) },
      data: { estado: 'reimpreso' },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true }
        },
        cajero: {
          select: { id: true, username: true, apellidos: true }
        }
      }
    });

    logger.logOperation('RECIBO_REIMPRESO', {
      reciboId: reciboActualizado.id,
      folio: reciboActualizado.folio,
      usuarioId: req.user.id
    });

    res.json({
      success: true,
      data: {
        id: reciboActualizado.id,
        folio: reciboActualizado.folio,
        estado: reciboActualizado.estado,
        paciente: reciboActualizado.paciente,
        cajero: reciboActualizado.cajero
      },
      message: `Recibo ${reciboActualizado.folio} marcado como reimpreso`
    });

  } catch (error) {
    logger.logError('REIMPRIMIR_RECIBO', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;
