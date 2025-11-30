// ABOUTME: Rutas para gestión de cuentas bancarias y depósitos
// ABOUTME: Control de depósitos, confirmaciones y conciliación bancaria

const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// HELPERS
// ==============================================

const generarNumeroDeposito = async () => {
  const hoy = new Date();
  const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');

  const ultimoDeposito = await prisma.depositoBancario.findFirst({
    where: {
      numero: { startsWith: `DEP-${fecha}` }
    },
    orderBy: { numero: 'desc' }
  });

  let consecutivo = 1;
  if (ultimoDeposito) {
    const partes = ultimoDeposito.numero.split('-');
    consecutivo = parseInt(partes[2]) + 1;
  }

  return `DEP-${fecha}-${consecutivo.toString().padStart(3, '0')}`;
};

// ==============================================
// ENDPOINTS DE CUENTAS BANCARIAS
// ==============================================

// GET /bancos/cuentas - Listar cuentas bancarias
router.get('/cuentas', authenticateToken, authorizeRoles(['cajero', 'administrador', 'socio']), async (req, res) => {
  try {
    const { activa } = req.query;

    const where = {};
    if (activa !== undefined) {
      where.activa = activa === 'true';
    }

    const cuentas = await prisma.cuentaBancaria.findMany({
      where,
      orderBy: { alias: 'asc' }
    });

    res.json({
      success: true,
      data: cuentas
    });

  } catch (error) {
    logger.logError('GET_CUENTAS_BANCARIAS', error);
    handlePrismaError(error, res);
  }
});

// POST /bancos/cuentas - Crear cuenta bancaria
router.post('/cuentas', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { banco, numeroCuenta, clabe, alias, tipo, moneda = 'MXN' } = req.body;

    if (!banco || !numeroCuenta || !alias || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Banco, número de cuenta, alias y tipo son requeridos'
      });
    }

    const tiposValidos = ['corriente', 'ahorro', 'inversion'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`
      });
    }

    const cuenta = await prisma.cuentaBancaria.create({
      data: {
        banco,
        numeroCuenta,
        clabe: clabe || null,
        alias,
        tipo,
        moneda
      }
    });

    logger.logInfo('CUENTA_BANCARIA_CREADA', `Cuenta ${alias} - ${banco} creada`, {
      userId: req.user.id,
      cuentaId: cuenta.id
    });

    res.status(201).json({
      success: true,
      data: cuenta,
      message: 'Cuenta bancaria creada correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_CUENTA_BANCARIA', error);
    handlePrismaError(error, res);
  }
});

// PUT /bancos/cuentas/:id - Actualizar cuenta bancaria
router.put('/cuentas/:id', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { banco, numeroCuenta, clabe, alias, tipo, moneda, activa } = req.body;

    const cuentaExistente = await prisma.cuentaBancaria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cuentaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta bancaria no encontrada'
      });
    }

    const updateData = {};
    if (banco !== undefined) updateData.banco = banco;
    if (numeroCuenta !== undefined) updateData.numeroCuenta = numeroCuenta;
    if (clabe !== undefined) updateData.clabe = clabe;
    if (alias !== undefined) updateData.alias = alias;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (moneda !== undefined) updateData.moneda = moneda;
    if (activa !== undefined) updateData.activa = activa;

    const cuenta = await prisma.cuentaBancaria.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    logger.logInfo('CUENTA_BANCARIA_ACTUALIZADA', `Cuenta ${cuenta.alias} actualizada`, {
      userId: req.user.id,
      cuentaId: cuenta.id
    });

    res.json({
      success: true,
      data: cuenta,
      message: 'Cuenta bancaria actualizada correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_CUENTA_BANCARIA', error);
    handlePrismaError(error, res);
  }
});

// DELETE /bancos/cuentas/:id - Desactivar cuenta bancaria
router.delete('/cuentas/:id', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { id } = req.params;

    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta bancaria no encontrada'
      });
    }

    await prisma.cuentaBancaria.update({
      where: { id: parseInt(id) },
      data: { activa: false }
    });

    logger.logInfo('CUENTA_BANCARIA_DESACTIVADA', `Cuenta ${cuenta.alias} desactivada`, {
      userId: req.user.id,
      cuentaId: cuenta.id
    });

    res.json({
      success: true,
      message: 'Cuenta bancaria desactivada correctamente'
    });

  } catch (error) {
    logger.logError('DELETE_CUENTA_BANCARIA', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS DE DEPÓSITOS BANCARIOS
// ==============================================

// POST /bancos/depositos - Preparar depósito
router.post('/depositos', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { cuentaBancariaId, montoEfectivo, montoCheques = 0, observaciones } = req.body;
    const cajeroId = req.user.id;

    if (!cuentaBancariaId || !montoEfectivo) {
      return res.status(400).json({
        success: false,
        message: 'Cuenta bancaria y monto en efectivo son requeridos'
      });
    }

    // Verificar cuenta bancaria
    const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
      where: { id: parseInt(cuentaBancariaId) }
    });

    if (!cuentaBancaria || !cuentaBancaria.activa) {
      return res.status(400).json({
        success: false,
        message: 'Cuenta bancaria no válida o inactiva'
      });
    }

    // Verificar caja abierta
    const cajaAbierta = await prisma.cajaDiaria.findFirst({
      where: {
        cajeroId,
        estado: 'abierta'
      }
    });

    if (!cajaAbierta) {
      return res.status(400).json({
        success: false,
        message: 'Debes tener una caja abierta para preparar depósitos'
      });
    }

    const montoTotal = parseFloat(montoEfectivo) + parseFloat(montoCheques);
    const numero = await generarNumeroDeposito();

    // Crear depósito y movimiento de caja en transacción
    const deposito = await prisma.$transaction(async (tx) => {
      const dep = await tx.depositoBancario.create({
        data: {
          numero,
          cuentaBancariaId: parseInt(cuentaBancariaId),
          cajaId: cajaAbierta.id,
          cajeroId,
          montoEfectivo: parseFloat(montoEfectivo),
          montoCheques: parseFloat(montoCheques),
          montoTotal,
          estado: 'preparado',
          observaciones
        }
      });

      // Registrar egreso en caja
      await tx.movimientoCaja.create({
        data: {
          cajaId: cajaAbierta.id,
          tipo: 'egreso_deposito',
          monto: montoTotal,
          concepto: `Depósito preparado ${numero}`,
          referencia: numero,
          metodoPago: 'efectivo',
          cajeroId
        }
      });

      return dep;
    });

    const depositoCompleto = await prisma.depositoBancario.findUnique({
      where: { id: deposito.id },
      include: {
        cuentaBancaria: true,
        cajero: { select: { id: true, username: true, nombre: true } }
      }
    });

    logger.logInfo('DEPOSITO_PREPARADO', `Depósito ${numero} - $${montoTotal} preparado`, {
      userId: cajeroId,
      depositoId: deposito.id,
      cuentaBancariaId
    });

    res.status(201).json({
      success: true,
      data: {
        ...depositoCompleto,
        montoEfectivo: parseFloat(depositoCompleto.montoEfectivo),
        montoCheques: parseFloat(depositoCompleto.montoCheques),
        montoTotal: parseFloat(depositoCompleto.montoTotal)
      },
      message: `Depósito ${numero} preparado correctamente`
    });

  } catch (error) {
    logger.logError('CREATE_DEPOSITO', error);
    handlePrismaError(error, res);
  }
});

// GET /bancos/depositos - Listar depósitos
router.get('/depositos', authenticateToken, authorizeRoles(['cajero', 'administrador', 'socio']), async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, cuentaBancariaId, fechaInicio, fechaFin } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (estado) where.estado = estado;
    if (cuentaBancariaId) where.cuentaBancariaId = parseInt(cuentaBancariaId);

    if (fechaInicio || fechaFin) {
      where.fechaPreparacion = {};
      if (fechaInicio) where.fechaPreparacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaPreparacion.lte = new Date(fechaFin);
    }

    const [depositos, total] = await Promise.all([
      prisma.depositoBancario.findMany({
        where,
        include: {
          cuentaBancaria: { select: { banco: true, alias: true, numeroCuenta: true } },
          cajero: { select: { id: true, username: true, nombre: true } },
          confirmadoPor: { select: { id: true, username: true, nombre: true } }
        },
        orderBy: { fechaPreparacion: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.depositoBancario.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items: depositos.map(d => ({
          ...d,
          montoEfectivo: parseFloat(d.montoEfectivo),
          montoCheques: parseFloat(d.montoCheques),
          montoTotal: parseFloat(d.montoTotal)
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
    logger.logError('GET_DEPOSITOS', error);
    handlePrismaError(error, res);
  }
});

// GET /bancos/depositos/pendientes - Depósitos sin confirmar
router.get('/depositos/pendientes', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const depositos = await prisma.depositoBancario.findMany({
      where: {
        estado: { in: ['preparado', 'en_transito', 'depositado'] }
      },
      include: {
        cuentaBancaria: true,
        cajero: { select: { id: true, username: true, nombre: true } },
        caja: { select: { numero: true, turno: true } }
      },
      orderBy: { fechaPreparacion: 'asc' }
    });

    const totales = {
      preparados: 0,
      enTransito: 0,
      depositados: 0,
      montoTotal: 0
    };

    depositos.forEach(d => {
      const monto = parseFloat(d.montoTotal);
      totales.montoTotal += monto;
      if (d.estado === 'preparado') totales.preparados += monto;
      else if (d.estado === 'en_transito') totales.enTransito += monto;
      else if (d.estado === 'depositado') totales.depositados += monto;
    });

    res.json({
      success: true,
      data: {
        items: depositos.map(d => ({
          ...d,
          montoEfectivo: parseFloat(d.montoEfectivo),
          montoCheques: parseFloat(d.montoCheques),
          montoTotal: parseFloat(d.montoTotal)
        })),
        totales,
        total: depositos.length
      }
    });

  } catch (error) {
    logger.logError('GET_DEPOSITOS_PENDIENTES', error);
    handlePrismaError(error, res);
  }
});

// GET /bancos/depositos/:id - Detalle de depósito
router.get('/depositos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deposito = await prisma.depositoBancario.findUnique({
      where: { id: parseInt(id) },
      include: {
        cuentaBancaria: true,
        caja: {
          include: {
            cajero: { select: { id: true, username: true, nombre: true, apellidos: true } }
          }
        },
        cajero: { select: { id: true, username: true, nombre: true, apellidos: true } },
        confirmadoPor: { select: { id: true, username: true, nombre: true, apellidos: true } }
      }
    });

    if (!deposito) {
      return res.status(404).json({
        success: false,
        message: 'Depósito no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        ...deposito,
        montoEfectivo: parseFloat(deposito.montoEfectivo),
        montoCheques: parseFloat(deposito.montoCheques),
        montoTotal: parseFloat(deposito.montoTotal)
      }
    });

  } catch (error) {
    logger.logError('GET_DEPOSITO', error);
    handlePrismaError(error, res);
  }
});

// PUT /bancos/depositos/:id/transito - Marcar en tránsito
router.put('/depositos/:id/transito', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const deposito = await prisma.depositoBancario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!deposito) {
      return res.status(404).json({
        success: false,
        message: 'Depósito no encontrado'
      });
    }

    if (deposito.estado !== 'preparado') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden marcar en tránsito depósitos preparados. Estado actual: ${deposito.estado}`
      });
    }

    const depositoActualizado = await prisma.depositoBancario.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'en_transito',
        observaciones: observaciones || deposito.observaciones
      }
    });

    logger.logInfo('DEPOSITO_EN_TRANSITO', `Depósito ${deposito.numero} en tránsito`, {
      userId: req.user.id,
      depositoId: deposito.id
    });

    res.json({
      success: true,
      data: {
        ...depositoActualizado,
        montoTotal: parseFloat(depositoActualizado.montoTotal)
      },
      message: 'Depósito marcado en tránsito'
    });

  } catch (error) {
    logger.logError('DEPOSITO_TRANSITO', error);
    handlePrismaError(error, res);
  }
});

// PUT /bancos/depositos/:id/depositado - Marcar como depositado
router.put('/depositos/:id/depositado', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { referenciaBanco, observaciones } = req.body;

    const deposito = await prisma.depositoBancario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!deposito) {
      return res.status(404).json({
        success: false,
        message: 'Depósito no encontrado'
      });
    }

    if (deposito.estado !== 'preparado' && deposito.estado !== 'en_transito') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden marcar como depositados depósitos preparados o en tránsito. Estado actual: ${deposito.estado}`
      });
    }

    const depositoActualizado = await prisma.depositoBancario.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'depositado',
        fechaDeposito: new Date(),
        referenciaBanco: referenciaBanco || deposito.referenciaBanco,
        observaciones: observaciones || deposito.observaciones
      }
    });

    logger.logInfo('DEPOSITO_REALIZADO', `Depósito ${deposito.numero} realizado`, {
      userId: req.user.id,
      depositoId: deposito.id
    });

    res.json({
      success: true,
      data: {
        ...depositoActualizado,
        montoTotal: parseFloat(depositoActualizado.montoTotal)
      },
      message: 'Depósito marcado como realizado. Pendiente de confirmación bancaria.'
    });

  } catch (error) {
    logger.logError('DEPOSITO_REALIZADO', error);
    handlePrismaError(error, res);
  }
});

// PUT /bancos/depositos/:id/confirmar - Confirmar recepción banco
router.put('/depositos/:id/confirmar', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { montoConfirmado, referenciaBanco, observaciones } = req.body;
    const adminId = req.user.id;

    const deposito = await prisma.depositoBancario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!deposito) {
      return res.status(404).json({
        success: false,
        message: 'Depósito no encontrado'
      });
    }

    if (deposito.estado !== 'depositado') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden confirmar depósitos ya realizados. Estado actual: ${deposito.estado}`
      });
    }

    const montoOriginal = parseFloat(deposito.montoTotal);
    const montoFinal = montoConfirmado !== undefined ? parseFloat(montoConfirmado) : montoOriginal;
    const hayDiferencia = montoFinal !== montoOriginal;

    const depositoActualizado = await prisma.depositoBancario.update({
      where: { id: parseInt(id) },
      data: {
        estado: hayDiferencia ? 'con_diferencia' : 'confirmado',
        fechaConfirmacion: new Date(),
        confirmadoPorId: adminId,
        referenciaBanco: referenciaBanco || deposito.referenciaBanco,
        observaciones: hayDiferencia
          ? `${observaciones || ''} [Diferencia: $${(montoFinal - montoOriginal).toFixed(2)}]`
          : observaciones || deposito.observaciones
      },
      include: {
        cuentaBancaria: true,
        confirmadoPor: { select: { username: true, nombre: true } }
      }
    });

    logger.logInfo('DEPOSITO_CONFIRMADO', `Depósito ${deposito.numero} confirmado ${hayDiferencia ? 'con diferencia' : ''}`, {
      userId: adminId,
      depositoId: deposito.id,
      montoOriginal,
      montoConfirmado: montoFinal
    });

    res.json({
      success: true,
      data: {
        ...depositoActualizado,
        montoEfectivo: parseFloat(depositoActualizado.montoEfectivo),
        montoCheques: parseFloat(depositoActualizado.montoCheques),
        montoTotal: parseFloat(depositoActualizado.montoTotal)
      },
      message: hayDiferencia
        ? `Depósito confirmado con diferencia de $${(montoFinal - montoOriginal).toFixed(2)}`
        : 'Depósito confirmado correctamente'
    });

  } catch (error) {
    logger.logError('CONFIRMAR_DEPOSITO', error);
    handlePrismaError(error, res);
  }
});

// PUT /bancos/depositos/:id/rechazar - Marcar como rechazado
router.put('/depositos/:id/rechazar', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('bancos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const adminId = req.user.id;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es requerido'
      });
    }

    const deposito = await prisma.depositoBancario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!deposito) {
      return res.status(404).json({
        success: false,
        message: 'Depósito no encontrado'
      });
    }

    if (deposito.estado === 'confirmado' || deposito.estado === 'rechazado') {
      return res.status(400).json({
        success: false,
        message: `No se puede rechazar un depósito en estado: ${deposito.estado}`
      });
    }

    const depositoActualizado = await prisma.depositoBancario.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'rechazado',
        fechaConfirmacion: new Date(),
        confirmadoPorId: adminId,
        observaciones: motivo
      }
    });

    logger.logInfo('DEPOSITO_RECHAZADO', `Depósito ${deposito.numero} rechazado: ${motivo}`, {
      userId: adminId,
      depositoId: deposito.id
    });

    res.json({
      success: true,
      data: {
        ...depositoActualizado,
        montoTotal: parseFloat(depositoActualizado.montoTotal)
      },
      message: 'Depósito marcado como rechazado'
    });

  } catch (error) {
    logger.logError('RECHAZAR_DEPOSITO', error);
    handlePrismaError(error, res);
  }
});

// GET /bancos/conciliacion - Reporte de conciliación
router.get('/conciliacion', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, cuentaBancariaId } = req.query;

    const where = {};
    if (cuentaBancariaId) where.cuentaBancariaId = parseInt(cuentaBancariaId);

    if (fechaInicio || fechaFin) {
      where.fechaPreparacion = {};
      if (fechaInicio) where.fechaPreparacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaPreparacion.lte = new Date(fechaFin);
    }

    const [
      depositosPorEstado,
      depositosPorCuenta,
      totalConfirmado,
      totalPendiente
    ] = await Promise.all([
      prisma.depositoBancario.groupBy({
        by: ['estado'],
        where,
        _count: { id: true },
        _sum: { montoTotal: true }
      }),
      prisma.depositoBancario.groupBy({
        by: ['cuentaBancariaId'],
        where: { ...where, estado: 'confirmado' },
        _sum: { montoTotal: true },
        _count: { id: true }
      }),
      prisma.depositoBancario.aggregate({
        where: { ...where, estado: 'confirmado' },
        _sum: { montoTotal: true }
      }),
      prisma.depositoBancario.aggregate({
        where: { ...where, estado: { in: ['preparado', 'en_transito', 'depositado'] } },
        _sum: { montoTotal: true }
      })
    ]);

    // Obtener nombres de cuentas bancarias
    const cuentas = await prisma.cuentaBancaria.findMany();
    const cuentasMap = cuentas.reduce((acc, c) => {
      acc[c.id] = `${c.alias} - ${c.banco}`;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        resumen: {
          totalConfirmado: parseFloat(totalConfirmado._sum.montoTotal || 0),
          totalPendiente: parseFloat(totalPendiente._sum.montoTotal || 0)
        },
        porEstado: depositosPorEstado.map(d => ({
          estado: d.estado,
          cantidad: d._count.id,
          monto: parseFloat(d._sum.montoTotal || 0)
        })),
        porCuenta: depositosPorCuenta.map(d => ({
          cuenta: cuentasMap[d.cuentaBancariaId] || 'Desconocida',
          cuentaId: d.cuentaBancariaId,
          cantidad: d._count.id,
          monto: parseFloat(d._sum.montoTotal || 0)
        }))
      }
    });

  } catch (error) {
    logger.logError('GET_CONCILIACION', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;
