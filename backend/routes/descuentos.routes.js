// ABOUTME: Rutas para gestión de descuentos autorizados en el sistema POS
// ABOUTME: Control de políticas de descuento, solicitudes, autorizaciones y aplicaciones

const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// HELPERS
// ==============================================

// Tipos válidos según el enum TipoDescuento del schema
const TIPOS_VALIDOS = ['cortesia_medica', 'empleado_hospital', 'convenio_empresa', 'promocion_temporal', 'ajuste_precio', 'redondeo', 'otro'];

// Tipos de cálculo válidos
const TIPOS_CALCULO_VALIDOS = ['porcentaje', 'monto_fijo'];

// Estados válidos
const ESTADOS_VALIDOS = ['pendiente', 'autorizado', 'rechazado', 'aplicado', 'revertido'];

// ==============================================
// ENDPOINTS DE POLÍTICAS DE DESCUENTO
// ==============================================

// GET /descuentos/politicas - Listar políticas activas
router.get('/politicas', authenticateToken, async (req, res) => {
  try {
    const politicas = await prisma.politicaDescuento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });

    res.json({
      success: true,
      data: politicas.map(p => ({
        ...p,
        porcentajeMaximo: parseFloat(p.porcentajeMaximo),
        montoMaximo: p.montoMaximo ? parseFloat(p.montoMaximo) : null
      }))
    });

  } catch (error) {
    logger.logError('GET_POLITICAS_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// POST /descuentos/politicas - Crear política (admin)
router.post('/politicas', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const {
      nombre,
      tipo,
      porcentajeMaximo,
      montoMaximo,
      rolesPermitidos = [],
      requiereAutorizacion = true,
      rolesAutorizadores = []
    } = req.body;

    // Validaciones
    if (!nombre || !tipo || porcentajeMaximo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, tipo y porcentajeMaximo son requeridos'
      });
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`
      });
    }

    if (porcentajeMaximo < 0 || porcentajeMaximo > 100) {
      return res.status(400).json({
        success: false,
        message: 'El porcentaje máximo debe estar entre 0 y 100'
      });
    }

    const politica = await prisma.politicaDescuento.create({
      data: {
        nombre,
        tipo,
        porcentajeMaximo: parseFloat(porcentajeMaximo),
        montoMaximo: montoMaximo ? parseFloat(montoMaximo) : null,
        rolesPermitidos,
        requiereAutorizacion,
        rolesAutorizadores
      }
    });

    logger.logInfo('POLITICA_DESCUENTO_CREADA', `Política ${nombre} creada`, {
      userId: req.user.id,
      politicaId: politica.id
    });

    res.status(201).json({
      success: true,
      data: {
        ...politica,
        porcentajeMaximo: parseFloat(politica.porcentajeMaximo),
        montoMaximo: politica.montoMaximo ? parseFloat(politica.montoMaximo) : null
      },
      message: 'Política de descuento creada correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_POLITICA_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// PUT /descuentos/politicas/:id - Actualizar política
router.put('/politicas/:id', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      tipo,
      porcentajeMaximo,
      montoMaximo,
      rolesPermitidos,
      requiereAutorizacion,
      rolesAutorizadores,
      activo
    } = req.body;

    const politicaExistente = await prisma.politicaDescuento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!politicaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Política no encontrada'
      });
    }

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (tipo !== undefined) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: `Tipo inválido. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`
        });
      }
      updateData.tipo = tipo;
    }
    if (porcentajeMaximo !== undefined) updateData.porcentajeMaximo = parseFloat(porcentajeMaximo);
    if (montoMaximo !== undefined) updateData.montoMaximo = montoMaximo ? parseFloat(montoMaximo) : null;
    if (rolesPermitidos !== undefined) updateData.rolesPermitidos = rolesPermitidos;
    if (requiereAutorizacion !== undefined) updateData.requiereAutorizacion = requiereAutorizacion;
    if (rolesAutorizadores !== undefined) updateData.rolesAutorizadores = rolesAutorizadores;
    if (activo !== undefined) updateData.activo = activo;

    const politica = await prisma.politicaDescuento.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    logger.logInfo('POLITICA_DESCUENTO_ACTUALIZADA', `Política ${politica.nombre} actualizada`, {
      userId: req.user.id,
      politicaId: politica.id
    });

    res.json({
      success: true,
      data: {
        ...politica,
        porcentajeMaximo: parseFloat(politica.porcentajeMaximo),
        montoMaximo: politica.montoMaximo ? parseFloat(politica.montoMaximo) : null
      },
      message: 'Política actualizada correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_POLITICA_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// DELETE /descuentos/politicas/:id - Desactivar política
router.delete('/politicas/:id', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const { id } = req.params;

    const politica = await prisma.politicaDescuento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!politica) {
      return res.status(404).json({
        success: false,
        message: 'Política no encontrada'
      });
    }

    await prisma.politicaDescuento.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    logger.logInfo('POLITICA_DESCUENTO_DESACTIVADA', `Política ${politica.nombre} desactivada`, {
      userId: req.user.id,
      politicaId: politica.id
    });

    res.json({
      success: true,
      message: 'Política desactivada correctamente'
    });

  } catch (error) {
    logger.logError('DELETE_POLITICA_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS DE DESCUENTOS APLICADOS
// ==============================================

// POST /descuentos - Solicitar descuento en cuenta
router.post('/', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const {
      cuentaId,
      politicaId,
      porcentaje,
      montoDescuento,
      motivo
    } = req.body;
    const aplicadoPorId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    // Validaciones
    if (!cuentaId || !politicaId || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'CuentaId, politicaId y motivo son requeridos'
      });
    }

    // Verificar cuenta
    const cuenta = await prisma.cuentaPaciente.findUnique({
      where: { id: parseInt(cuentaId) },
      include: {
        paciente: true,
        transacciones: true
      }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (cuenta.estado === 'cerrada') {
      return res.status(400).json({
        success: false,
        message: 'No se pueden aplicar descuentos a cuentas cerradas'
      });
    }

    // Verificar política
    const politica = await prisma.politicaDescuento.findUnique({
      where: { id: parseInt(politicaId) }
    });

    if (!politica || !politica.activo) {
      return res.status(400).json({
        success: false,
        message: 'Política de descuento no válida'
      });
    }

    // Calcular monto original para descuento (total de la cuenta)
    const montoOriginal = parseFloat(cuenta.totalCuenta);

    // Calcular descuento
    let descuentoCalculado = 0;
    const porcentajeAplicar = porcentaje || parseFloat(politica.porcentajeMaximo);

    if (porcentajeAplicar > parseFloat(politica.porcentajeMaximo)) {
      return res.status(400).json({
        success: false,
        message: `El porcentaje ${porcentajeAplicar}% excede el máximo permitido de ${politica.porcentajeMaximo}%`
      });
    }

    descuentoCalculado = (montoOriginal * porcentajeAplicar) / 100;

    // Si se especifica monto directo, usarlo (con validación)
    if (montoDescuento) {
      const montoMaximoPermitido = politica.montoMaximo ? parseFloat(politica.montoMaximo) : descuentoCalculado;
      if (parseFloat(montoDescuento) > montoMaximoPermitido) {
        return res.status(400).json({
          success: false,
          message: `El monto de descuento $${montoDescuento} excede el máximo permitido de $${montoMaximoPermitido}`
        });
      }
      descuentoCalculado = parseFloat(montoDescuento);
    }

    // Validar monto máximo de política
    if (politica.montoMaximo && descuentoCalculado > parseFloat(politica.montoMaximo)) {
      descuentoCalculado = parseFloat(politica.montoMaximo);
    }

    // Determinar si requiere autorización
    const requiereAuth = politica.requiereAutorizacion && !esAdmin;
    const estadoInicial = requiereAuth ? 'pendiente' : 'autorizado';

    // Determinar tipo de cálculo
    const tipoCalculo = porcentajeAplicar > 0 ? 'porcentaje' : 'monto_fijo';

    // Calcular monto final
    const montoFinal = montoOriginal - descuentoCalculado;

    const descuento = await prisma.$transaction(async (tx) => {
      const desc = await tx.descuentoAplicado.create({
        data: {
          cuentaId: parseInt(cuentaId),
          politicaId: parseInt(politicaId),
          estado: estadoInicial,
          tipoCalculo,
          porcentaje: porcentajeAplicar,
          montoOriginal,
          montoDescuento: descuentoCalculado,
          montoFinal,
          motivo,
          aplicadoPorId,
          autorizadoPorId: estadoInicial === 'autorizado' && esAdmin ? aplicadoPorId : null,
          fechaAutorizacion: estadoInicial === 'autorizado' ? new Date() : null
        }
      });

      // Si está autorizado, aplicar inmediatamente
      if (estadoInicial === 'autorizado') {
        await tx.cuentaPaciente.update({
          where: { id: parseInt(cuentaId) },
          data: {
            totalCuenta: { decrement: descuentoCalculado }
          }
        });
      }

      return desc;
    });

    const descuentoCompleto = await prisma.descuentoAplicado.findUnique({
      where: { id: descuento.id },
      include: {
        cuenta: {
          include: {
            paciente: { select: { nombre: true, apellidoPaterno: true } }
          }
        },
        politica: true,
        aplicadoPor: { select: { id: true, username: true, nombre: true } },
        autorizadoPor: { select: { id: true, username: true, nombre: true } }
      }
    });

    logger.logInfo('DESCUENTO_SOLICITADO', `Descuento ID:${descuento.id} - $${descuentoCalculado} (${porcentajeAplicar}%) - Estado: ${estadoInicial}`, {
      userId: aplicadoPorId,
      descuentoId: descuento.id,
      cuentaId
    });

    res.status(201).json({
      success: true,
      data: {
        ...descuentoCompleto,
        porcentaje: descuentoCompleto.porcentaje ? parseFloat(descuentoCompleto.porcentaje) : null,
        montoOriginal: parseFloat(descuentoCompleto.montoOriginal),
        montoDescuento: parseFloat(descuentoCompleto.montoDescuento),
        montoFinal: parseFloat(descuentoCompleto.montoFinal)
      },
      message: requiereAuth
        ? 'Solicitud de descuento creada. Pendiente de autorización.'
        : 'Descuento autorizado y aplicado correctamente.'
    });

  } catch (error) {
    logger.logError('CREATE_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// GET /descuentos - Listar descuentos
router.get('/', authenticateToken, authorizeRoles(['cajero', 'administrador', 'socio']), async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, cuentaId, fechaInicio, fechaFin } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (estado) where.estado = estado;
    if (cuentaId) where.cuentaId = parseInt(cuentaId);

    if (fechaInicio || fechaFin) {
      where.fechaAplicacion = {};
      if (fechaInicio) where.fechaAplicacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaAplicacion.lte = new Date(fechaFin);
    }

    const [descuentos, total] = await Promise.all([
      prisma.descuentoAplicado.findMany({
        where,
        include: {
          cuenta: {
            include: {
              paciente: { select: { nombre: true, apellidoPaterno: true } }
            }
          },
          politica: { select: { nombre: true, tipo: true } },
          aplicadoPor: { select: { id: true, username: true, nombre: true } },
          autorizadoPor: { select: { id: true, username: true, nombre: true } }
        },
        orderBy: { fechaAplicacion: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.descuentoAplicado.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items: descuentos.map(d => ({
          ...d,
          porcentaje: d.porcentaje ? parseFloat(d.porcentaje) : null,
          montoOriginal: parseFloat(d.montoOriginal),
          montoDescuento: parseFloat(d.montoDescuento),
          montoFinal: parseFloat(d.montoFinal)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.logError('GET_DESCUENTOS', error);
    handlePrismaError(error, res);
  }
});

// GET /descuentos/pendientes - Descuentos pendientes de autorización
router.get('/pendientes', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const descuentos = await prisma.descuentoAplicado.findMany({
      where: { estado: 'pendiente' },
      include: {
        cuenta: {
          include: {
            paciente: { select: { nombre: true, apellidoPaterno: true } }
          }
        },
        politica: true,
        aplicadoPor: { select: { id: true, username: true, nombre: true } }
      },
      orderBy: { fechaAplicacion: 'asc' }
    });

    res.json({
      success: true,
      data: descuentos.map(d => ({
        ...d,
        porcentaje: d.porcentaje ? parseFloat(d.porcentaje) : null,
        montoOriginal: parseFloat(d.montoOriginal),
        montoDescuento: parseFloat(d.montoDescuento),
        montoFinal: parseFloat(d.montoFinal)
      })),
      total: descuentos.length
    });

  } catch (error) {
    logger.logError('GET_DESCUENTOS_PENDIENTES', error);
    handlePrismaError(error, res);
  }
});

// GET /descuentos/reporte/estadisticas - Reporte de descuentos (ANTES de /:id)
router.get('/reporte/estadisticas', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const where = {};
    if (fechaInicio || fechaFin) {
      where.fechaAplicacion = {};
      if (fechaInicio) where.fechaAplicacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaAplicacion.lte = new Date(fechaFin);
    }

    const [
      totalDescuentos,
      descuentosPorEstado,
      descuentosPorPolitica,
      montoTotal
    ] = await Promise.all([
      prisma.descuentoAplicado.count({ where }),
      prisma.descuentoAplicado.groupBy({
        by: ['estado'],
        where,
        _count: { id: true },
        _sum: { montoDescuento: true }
      }),
      prisma.descuentoAplicado.groupBy({
        by: ['politicaId'],
        where,
        _count: { id: true },
        _sum: { montoDescuento: true }
      }),
      prisma.descuentoAplicado.aggregate({
        where: { ...where, estado: 'autorizado' },
        _sum: { montoDescuento: true }
      })
    ]);

    // Obtener nombres de políticas
    const politicas = await prisma.politicaDescuento.findMany();
    const politicasMap = politicas.reduce((acc, p) => {
      acc[p.id] = p.nombre;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalDescuentos,
        montoTotalDescuentos: parseFloat(montoTotal._sum.montoDescuento || 0),
        porEstado: descuentosPorEstado.map(e => ({
          estado: e.estado,
          cantidad: e._count.id,
          monto: parseFloat(e._sum.montoDescuento || 0)
        })),
        porPolitica: descuentosPorPolitica.map(p => ({
          politica: politicasMap[p.politicaId] || 'Desconocida',
          cantidad: p._count.id,
          monto: parseFloat(p._sum.montoDescuento || 0)
        }))
      }
    });

  } catch (error) {
    logger.logError('GET_REPORTE_DESCUENTOS', error);
    handlePrismaError(error, res);
  }
});

// GET /descuentos/:id - Detalle de descuento
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const descuento = await prisma.descuentoAplicado.findUnique({
      where: { id: parseInt(id) },
      include: {
        cuenta: {
          include: {
            paciente: true,
            transacciones: true
          }
        },
        politica: true,
        aplicadoPor: { select: { id: true, username: true, nombre: true, apellidos: true } },
        autorizadoPor: { select: { id: true, username: true, nombre: true, apellidos: true } }
      }
    });

    if (!descuento) {
      return res.status(404).json({
        success: false,
        message: 'Descuento no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        ...descuento,
        porcentaje: descuento.porcentaje ? parseFloat(descuento.porcentaje) : null,
        montoOriginal: parseFloat(descuento.montoOriginal),
        montoDescuento: parseFloat(descuento.montoDescuento),
        montoFinal: parseFloat(descuento.montoFinal)
      }
    });

  } catch (error) {
    logger.logError('GET_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// PUT /descuentos/:id/autorizar - Autorizar descuento (admin)
router.put('/:id/autorizar', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const descuento = await prisma.descuentoAplicado.findUnique({
      where: { id: parseInt(id) },
      include: { cuenta: true }
    });

    if (!descuento) {
      return res.status(404).json({
        success: false,
        message: 'Descuento no encontrado'
      });
    }

    if (descuento.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `No se puede autorizar un descuento en estado: ${descuento.estado}`
      });
    }

    // Aplicar descuento a la cuenta
    const resultado = await prisma.$transaction(async (tx) => {
      const descActualizado = await tx.descuentoAplicado.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'autorizado',
          autorizadoPorId: adminId,
          fechaAutorizacion: new Date()
        }
      });

      await tx.cuentaPaciente.update({
        where: { id: descuento.cuentaId },
        data: {
          totalCuenta: { decrement: parseFloat(descuento.montoDescuento) }
        }
      });

      return descActualizado;
    });

    logger.logInfo('DESCUENTO_AUTORIZADO', `Descuento ID:${descuento.id} autorizado - $${descuento.montoDescuento}`, {
      userId: adminId,
      descuentoId: descuento.id
    });

    res.json({
      success: true,
      data: {
        ...resultado,
        porcentaje: resultado.porcentaje ? parseFloat(resultado.porcentaje) : null,
        montoOriginal: parseFloat(resultado.montoOriginal),
        montoDescuento: parseFloat(resultado.montoDescuento),
        montoFinal: parseFloat(resultado.montoFinal)
      },
      message: 'Descuento autorizado y aplicado correctamente'
    });

  } catch (error) {
    logger.logError('AUTORIZAR_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// PUT /descuentos/:id/rechazar - Rechazar descuento (admin)
router.put('/:id/rechazar', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoRechazo } = req.body;
    const adminId = req.user.id;

    if (!motivoRechazo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es requerido'
      });
    }

    const descuento = await prisma.descuentoAplicado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!descuento) {
      return res.status(404).json({
        success: false,
        message: 'Descuento no encontrado'
      });
    }

    if (descuento.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `No se puede rechazar un descuento en estado: ${descuento.estado}`
      });
    }

    const descuentoActualizado = await prisma.descuentoAplicado.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'rechazado',
        autorizadoPorId: adminId,
        fechaAutorizacion: new Date(),
        motivo: `${descuento.motivo} | RECHAZADO: ${motivoRechazo}`
      }
    });

    logger.logInfo('DESCUENTO_RECHAZADO', `Descuento ID:${descuento.id} rechazado: ${motivoRechazo}`, {
      userId: adminId,
      descuentoId: descuento.id
    });

    res.json({
      success: true,
      data: {
        ...descuentoActualizado,
        porcentaje: descuentoActualizado.porcentaje ? parseFloat(descuentoActualizado.porcentaje) : null,
        montoOriginal: parseFloat(descuentoActualizado.montoOriginal),
        montoDescuento: parseFloat(descuentoActualizado.montoDescuento),
        montoFinal: parseFloat(descuentoActualizado.montoFinal)
      },
      message: 'Descuento rechazado'
    });

  } catch (error) {
    logger.logError('RECHAZAR_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

// PUT /descuentos/:id/revertir - Revertir descuento autorizado
router.put('/:id/revertir', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('descuentos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id;

    const descuento = await prisma.descuentoAplicado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!descuento) {
      return res.status(404).json({
        success: false,
        message: 'Descuento no encontrado'
      });
    }

    if (descuento.estado !== 'autorizado') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden revertir descuentos autorizados. Estado actual: ${descuento.estado}`
      });
    }

    // Revertir el descuento
    const resultado = await prisma.$transaction(async (tx) => {
      // Devolver el monto a la cuenta
      await tx.cuentaPaciente.update({
        where: { id: descuento.cuentaId },
        data: {
          totalCuenta: { increment: parseFloat(descuento.montoDescuento) }
        }
      });

      return tx.descuentoAplicado.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'revertido',
          motivo: motivo ? `${descuento.motivo} | REVERTIDO: ${motivo}` : descuento.motivo
        }
      });
    });

    logger.logInfo('DESCUENTO_REVERTIDO', `Descuento ID:${descuento.id} revertido`, {
      userId,
      descuentoId: descuento.id
    });

    res.json({
      success: true,
      data: {
        ...resultado,
        porcentaje: resultado.porcentaje ? parseFloat(resultado.porcentaje) : null,
        montoOriginal: parseFloat(resultado.montoOriginal),
        montoDescuento: parseFloat(resultado.montoDescuento),
        montoFinal: parseFloat(resultado.montoFinal)
      },
      message: 'Descuento revertido y monto devuelto a la cuenta'
    });

  } catch (error) {
    logger.logError('REVERTIR_DESCUENTO', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;
