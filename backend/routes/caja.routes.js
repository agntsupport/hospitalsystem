// ABOUTME: Rutas para gestión de caja diaria del hospital
// ABOUTME: Control de turnos, arqueos, movimientos de efectivo y reportes de caja

const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// HELPERS
// ==============================================

const generarNumeroCaja = async () => {
  const hoy = new Date();
  const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');

  const ultimaCaja = await prisma.cajaDiaria.findFirst({
    where: {
      numero: { startsWith: `CAJA-${fecha}` }
    },
    orderBy: { numero: 'desc' }
  });

  let consecutivo = 1;
  if (ultimaCaja) {
    const partes = ultimaCaja.numero.split('-');
    consecutivo = parseInt(partes[2]) + 1;
  }

  return `CAJA-${fecha}-${consecutivo.toString().padStart(3, '0')}`;
};

const determinarTurno = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 14) return 'matutino';
  if (hora >= 14 && hora < 22) return 'vespertino';
  return 'nocturno';
};

// ==============================================
// ENDPOINTS DE CAJA DIARIA
// ==============================================

// POST /caja/abrir - Abrir caja del turno
router.post('/abrir', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('caja'), async (req, res) => {
  try {
    const { saldoInicial = 0, observaciones, turno } = req.body;
    const cajeroId = req.user.id;

    // Verificar que el cajero no tenga una caja abierta
    const cajaAbierta = await prisma.cajaDiaria.findFirst({
      where: {
        cajeroId,
        estado: 'abierta'
      }
    });

    if (cajaAbierta) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva.',
        data: { cajaAbiertaId: cajaAbierta.id, numero: cajaAbierta.numero }
      });
    }

    const numero = await generarNumeroCaja();
    const turnoActual = turno || determinarTurno();

    const caja = await prisma.cajaDiaria.create({
      data: {
        numero,
        cajeroId,
        turno: turnoActual,
        saldoInicial: parseFloat(saldoInicial),
        estado: 'abierta',
        observaciones
      },
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true, apellidos: true }
        }
      }
    });

    logger.logInfo('CAJA_ABIERTA', `Caja ${numero} abierta por cajero ID ${cajeroId}`, {
      userId: cajeroId,
      cajaId: caja.id,
      saldoInicial
    });

    res.status(201).json({
      success: true,
      data: {
        ...caja,
        saldoInicial: parseFloat(caja.saldoInicial)
      },
      message: `Caja ${numero} abierta correctamente para turno ${turnoActual}`
    });

  } catch (error) {
    logger.logError('ABRIR_CAJA', error);
    handlePrismaError(error, res);
  }
});

// GET /caja/actual - Obtener caja actual del cajero
router.get('/actual', authenticateToken, authorizeRoles(['cajero', 'administrador']), async (req, res) => {
  try {
    const cajeroId = req.user.id;

    const caja = await prisma.cajaDiaria.findFirst({
      where: {
        cajeroId,
        estado: 'abierta'
      },
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true, apellidos: true }
        },
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 10
        }
      }
    });

    if (!caja) {
      return res.json({
        success: true,
        data: null,
        tieneCajaAbierta: false,
        message: 'No tienes una caja abierta actualmente'
      });
    }

    // Calcular totales
    const totales = await prisma.movimientoCaja.groupBy({
      by: ['tipo'],
      where: { cajaId: caja.id },
      _sum: { monto: true }
    });

    const ingresos = totales
      .filter(t => t.tipo.startsWith('ingreso'))
      .reduce((sum, t) => sum + parseFloat(t._sum.monto || 0), 0);

    const egresos = totales
      .filter(t => t.tipo.startsWith('egreso'))
      .reduce((sum, t) => sum + parseFloat(t._sum.monto || 0), 0);

    const ajustes = totales
      .filter(t => t.tipo.startsWith('ajuste'))
      .reduce((sum, t) => {
        if (t.tipo === 'ajuste_positivo') return sum + parseFloat(t._sum.monto || 0);
        return sum - parseFloat(t._sum.monto || 0);
      }, 0);

    const saldoActual = parseFloat(caja.saldoInicial) + ingresos - egresos + ajustes;

    res.json({
      success: true,
      data: {
        ...caja,
        saldoInicial: parseFloat(caja.saldoInicial),
        resumen: {
          ingresos,
          egresos,
          ajustes,
          saldoActual
        }
      }
    });

  } catch (error) {
    logger.logError('GET_CAJA_ACTUAL', error);
    handlePrismaError(error, res);
  }
});

// GET /caja/resumen - Resumen de movimientos de la caja actual
router.get('/resumen', authenticateToken, authorizeRoles(['cajero', 'administrador']), async (req, res) => {
  try {
    const cajeroId = req.user.id;
    const { cajaId } = req.query;

    let whereCondition = { cajeroId, estado: 'abierta' };
    if (cajaId) {
      whereCondition = { id: parseInt(cajaId) };
    }

    const caja = await prisma.cajaDiaria.findFirst({
      where: whereCondition,
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true, apellidos: true }
        }
      }
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    // Obtener movimientos agrupados por tipo
    const movimientosPorTipo = await prisma.movimientoCaja.groupBy({
      by: ['tipo'],
      where: { cajaId: caja.id },
      _sum: { monto: true },
      _count: { id: true }
    });

    // Obtener movimientos agrupados por método de pago
    const movimientosPorMetodo = await prisma.movimientoCaja.groupBy({
      by: ['metodoPago'],
      where: {
        cajaId: caja.id,
        metodoPago: { not: null }
      },
      _sum: { monto: true },
      _count: { id: true }
    });

    // Calcular totales
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalAjustes = 0;

    const desglosePorTipo = movimientosPorTipo.map(m => {
      const monto = parseFloat(m._sum.monto || 0);
      if (m.tipo.startsWith('ingreso')) totalIngresos += monto;
      else if (m.tipo.startsWith('egreso')) totalEgresos += monto;
      else if (m.tipo === 'ajuste_positivo') totalAjustes += monto;
      else if (m.tipo === 'ajuste_negativo') totalAjustes -= monto;

      return {
        tipo: m.tipo,
        total: monto,
        cantidad: m._count.id
      };
    });

    const desglosePorMetodo = movimientosPorMetodo.map(m => ({
      metodoPago: m.metodoPago,
      total: parseFloat(m._sum.monto || 0),
      cantidad: m._count.id
    }));

    const saldoInicial = parseFloat(caja.saldoInicial);
    const saldoCalculado = saldoInicial + totalIngresos - totalEgresos + totalAjustes;

    res.json({
      success: true,
      data: {
        caja: {
          id: caja.id,
          numero: caja.numero,
          turno: caja.turno,
          estado: caja.estado,
          fechaApertura: caja.fechaApertura,
          cajero: caja.cajero
        },
        resumen: {
          saldoInicial,
          totalIngresos,
          totalEgresos,
          totalAjustes,
          saldoCalculado,
          efectivoEsperado: saldoCalculado
        },
        desglosePorTipo,
        desglosePorMetodo
      }
    });

  } catch (error) {
    logger.logError('GET_RESUMEN_CAJA', error);
    handlePrismaError(error, res);
  }
});

// POST /caja/movimiento - Registrar movimiento manual
router.post('/movimiento', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('caja'), async (req, res) => {
  try {
    const { tipo, monto, concepto, referencia, metodoPago, observaciones, cuentaId } = req.body;
    const cajeroId = req.user.id;

    // Validaciones
    if (!tipo || !monto || !concepto) {
      return res.status(400).json({
        success: false,
        message: 'Tipo, monto y concepto son requeridos'
      });
    }

    const tiposValidos = [
      'ingreso_efectivo', 'ingreso_tarjeta', 'ingreso_transferencia',
      'egreso_devolucion', 'egreso_gasto_menor', 'egreso_deposito',
      'ajuste_positivo', 'ajuste_negativo'
    ];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`
      });
    }

    // Obtener caja abierta del cajero
    const caja = await prisma.cajaDiaria.findFirst({
      where: {
        cajeroId,
        estado: 'abierta'
      }
    });

    if (!caja) {
      return res.status(400).json({
        success: false,
        message: 'Debes tener una caja abierta para registrar movimientos'
      });
    }

    // Gastos menores > $500 requieren autorización (solo advertencia por ahora)
    if (tipo === 'egreso_gasto_menor' && parseFloat(monto) > 500) {
      logger.logInfo('GASTO_MENOR_ALTO', `Gasto menor de $${monto} registrado sin autorización`, {
        userId: cajeroId,
        cajaId: caja.id
      });
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        tipo,
        monto: parseFloat(monto),
        concepto,
        referencia,
        metodoPago: metodoPago || null,
        cuentaId: cuentaId ? parseInt(cuentaId) : null,
        cajeroId,
        observaciones
      },
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true }
        }
      }
    });

    logger.logInfo('MOVIMIENTO_CAJA', `${tipo}: $${monto} - ${concepto}`, {
      userId: cajeroId,
      cajaId: caja.id,
      movimientoId: movimiento.id
    });

    res.status(201).json({
      success: true,
      data: {
        ...movimiento,
        monto: parseFloat(movimiento.monto)
      },
      message: 'Movimiento registrado correctamente'
    });

  } catch (error) {
    logger.logError('REGISTRAR_MOVIMIENTO', error);
    handlePrismaError(error, res);
  }
});

// PUT /caja/:id/arqueo - Registrar conteo de efectivo
router.put('/:id/arqueo', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('caja'), async (req, res) => {
  try {
    const { id } = req.params;
    const { saldoContado, observaciones } = req.body;
    const cajeroId = req.user.id;

    if (saldoContado === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El saldo contado es requerido'
      });
    }

    const caja = await prisma.cajaDiaria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    if (caja.estado !== 'abierta') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede hacer arqueo de cajas abiertas'
      });
    }

    // Calcular saldo esperado
    const totales = await prisma.movimientoCaja.groupBy({
      by: ['tipo'],
      where: { cajaId: caja.id },
      _sum: { monto: true }
    });

    let saldoSistema = parseFloat(caja.saldoInicial);
    totales.forEach(t => {
      const monto = parseFloat(t._sum.monto || 0);
      if (t.tipo.startsWith('ingreso')) saldoSistema += monto;
      else if (t.tipo.startsWith('egreso')) saldoSistema -= monto;
      else if (t.tipo === 'ajuste_positivo') saldoSistema += monto;
      else if (t.tipo === 'ajuste_negativo') saldoSistema -= monto;
    });

    const diferencia = parseFloat(saldoContado) - saldoSistema;

    const cajaActualizada = await prisma.cajaDiaria.update({
      where: { id: parseInt(id) },
      data: {
        saldoFinalSistema: saldoSistema,
        saldoFinalContado: parseFloat(saldoContado),
        diferencia,
        estado: 'arqueo_pendiente',
        observaciones: observaciones || caja.observaciones
      }
    });

    logger.logInfo('ARQUEO_CAJA', `Caja ${caja.numero}: Sistema $${saldoSistema}, Contado $${saldoContado}, Diferencia $${diferencia}`, {
      userId: cajeroId,
      cajaId: caja.id
    });

    res.json({
      success: true,
      data: {
        ...cajaActualizada,
        saldoInicial: parseFloat(cajaActualizada.saldoInicial),
        saldoFinalSistema: parseFloat(cajaActualizada.saldoFinalSistema),
        saldoFinalContado: parseFloat(cajaActualizada.saldoFinalContado),
        diferencia: parseFloat(cajaActualizada.diferencia)
      },
      message: diferencia === 0
        ? 'Arqueo correcto. Caja lista para cerrar.'
        : `Arqueo con diferencia de $${diferencia.toFixed(2)}. Se requiere justificación.`
    });

  } catch (error) {
    logger.logError('ARQUEO_CAJA', error);
    handlePrismaError(error, res);
  }
});

// PUT /caja/:id/cerrar - Cerrar caja con validación
router.put('/:id/cerrar', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('caja'), async (req, res) => {
  try {
    const { id } = req.params;
    const { justificacionDiferencia, observaciones } = req.body;
    const cajeroId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    const caja = await prisma.cajaDiaria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    if (caja.estado === 'cerrada' || caja.estado === 'cerrada_con_diferencia') {
      return res.status(400).json({
        success: false,
        message: 'Esta caja ya está cerrada'
      });
    }

    // Si no se ha hecho arqueo, hacerlo ahora
    if (caja.estado === 'abierta') {
      return res.status(400).json({
        success: false,
        message: 'Debes realizar el arqueo antes de cerrar la caja'
      });
    }

    const diferencia = parseFloat(caja.diferencia || 0);
    const umbralDiferencia = 50; // Configurable

    // Validar diferencia
    if (Math.abs(diferencia) > umbralDiferencia && !esAdmin) {
      if (!justificacionDiferencia) {
        return res.status(400).json({
          success: false,
          message: `Diferencia de $${diferencia.toFixed(2)} supera el umbral de $${umbralDiferencia}. Se requiere justificación y autorización de administrador.`
        });
      }
    }

    const estadoFinal = diferencia !== 0 ? 'cerrada_con_diferencia' : 'cerrada';

    const cajaActualizada = await prisma.cajaDiaria.update({
      where: { id: parseInt(id) },
      data: {
        estado: estadoFinal,
        fechaCierre: new Date(),
        justificacionDif: justificacionDiferencia || caja.justificacionDif,
        observaciones: observaciones || caja.observaciones,
        autorizadorId: esAdmin && diferencia !== 0 ? cajeroId : null
      },
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true, apellidos: true }
        },
        autorizador: {
          select: { id: true, username: true, nombre: true }
        }
      }
    });

    // Si hay diferencia, registrar movimiento de ajuste
    if (diferencia !== 0) {
      await prisma.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: diferencia > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
          monto: Math.abs(diferencia),
          concepto: `Ajuste por diferencia en cierre de caja`,
          cajeroId,
          observaciones: justificacionDiferencia
        }
      });
    }

    logger.logInfo('CAJA_CERRADA', `Caja ${caja.numero} cerrada con estado ${estadoFinal}`, {
      userId: cajeroId,
      cajaId: caja.id,
      diferencia
    });

    res.json({
      success: true,
      data: {
        ...cajaActualizada,
        saldoInicial: parseFloat(cajaActualizada.saldoInicial),
        saldoFinalSistema: parseFloat(cajaActualizada.saldoFinalSistema || 0),
        saldoFinalContado: parseFloat(cajaActualizada.saldoFinalContado || 0),
        diferencia: parseFloat(cajaActualizada.diferencia || 0)
      },
      message: `Caja cerrada correctamente${diferencia !== 0 ? ` con diferencia de $${diferencia.toFixed(2)}` : ''}`
    });

  } catch (error) {
    logger.logError('CERRAR_CAJA', error);
    handlePrismaError(error, res);
  }
});

// GET /caja/historial - Historial de cajas (admin)
router.get('/historial', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { page = 1, limit = 20, cajeroId, estado, fechaInicio, fechaFin } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (cajeroId) where.cajeroId = parseInt(cajeroId);
    if (estado) where.estado = estado;

    if (fechaInicio || fechaFin) {
      where.fechaApertura = {};
      if (fechaInicio) where.fechaApertura.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaApertura.lte = new Date(fechaFin);
    }

    const [cajas, total] = await Promise.all([
      prisma.cajaDiaria.findMany({
        where,
        include: {
          cajero: {
            select: { id: true, username: true, nombre: true, apellidos: true }
          },
          _count: {
            select: { movimientos: true }
          }
        },
        orderBy: { fechaApertura: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.cajaDiaria.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items: cajas.map(c => ({
          ...c,
          saldoInicial: parseFloat(c.saldoInicial),
          saldoFinalSistema: c.saldoFinalSistema ? parseFloat(c.saldoFinalSistema) : null,
          saldoFinalContado: c.saldoFinalContado ? parseFloat(c.saldoFinalContado) : null,
          diferencia: c.diferencia ? parseFloat(c.diferencia) : null,
          totalMovimientos: c._count.movimientos
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
    logger.logError('GET_HISTORIAL_CAJAS', error);
    handlePrismaError(error, res);
  }
});

// GET /caja/:id/detalle - Detalle completo de una caja
router.get('/:id/detalle', authenticateToken, authorizeRoles(['cajero', 'administrador', 'socio']), async (req, res) => {
  try {
    const { id } = req.params;

    const caja = await prisma.cajaDiaria.findUnique({
      where: { id: parseInt(id) },
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true, apellidos: true }
        },
        autorizador: {
          select: { id: true, username: true, nombre: true }
        },
        movimientos: {
          orderBy: { fecha: 'desc' },
          include: {
            cuenta: {
              select: { id: true, paciente: { select: { nombre: true, apellidoPaterno: true } } }
            }
          }
        }
      }
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        ...caja,
        saldoInicial: parseFloat(caja.saldoInicial),
        saldoFinalSistema: caja.saldoFinalSistema ? parseFloat(caja.saldoFinalSistema) : null,
        saldoFinalContado: caja.saldoFinalContado ? parseFloat(caja.saldoFinalContado) : null,
        diferencia: caja.diferencia ? parseFloat(caja.diferencia) : null,
        movimientos: caja.movimientos.map(m => ({
          ...m,
          monto: parseFloat(m.monto)
        }))
      }
    });

  } catch (error) {
    logger.logError('GET_DETALLE_CAJA', error);
    handlePrismaError(error, res);
  }
});

// GET /caja/reporte-diario - Reporte consolidado del día
router.get('/reporte-diario', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fecha } = req.query;

    const fechaReporte = fecha ? new Date(fecha) : new Date();
    const inicioDelDia = new Date(fechaReporte);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fechaReporte);
    finDelDia.setHours(23, 59, 59, 999);

    // Obtener todas las cajas del día
    const cajas = await prisma.cajaDiaria.findMany({
      where: {
        fechaApertura: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      },
      include: {
        cajero: {
          select: { id: true, username: true, nombre: true, apellidos: true }
        }
      }
    });

    // Obtener todos los movimientos del día
    const movimientos = await prisma.movimientoCaja.groupBy({
      by: ['tipo', 'metodoPago'],
      where: {
        fecha: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      },
      _sum: { monto: true },
      _count: { id: true }
    });

    // Calcular totales
    let totalIngresos = 0;
    let totalEgresos = 0;
    let efectivo = 0;
    let tarjeta = 0;
    let transferencia = 0;

    movimientos.forEach(m => {
      const monto = parseFloat(m._sum.monto || 0);

      if (m.tipo.startsWith('ingreso')) {
        totalIngresos += monto;
        if (m.metodoPago === 'efectivo') efectivo += monto;
        else if (m.metodoPago === 'tarjeta') tarjeta += monto;
        else if (m.metodoPago === 'transferencia') transferencia += monto;
      } else if (m.tipo.startsWith('egreso')) {
        totalEgresos += monto;
      }
    });

    const cajasConDiferencia = cajas.filter(c => c.diferencia && parseFloat(c.diferencia) !== 0);

    res.json({
      success: true,
      data: {
        fecha: fechaReporte.toISOString().split('T')[0],
        resumen: {
          totalCajas: cajas.length,
          cajasAbiertas: cajas.filter(c => c.estado === 'abierta').length,
          cajasCerradas: cajas.filter(c => c.estado === 'cerrada' || c.estado === 'cerrada_con_diferencia').length,
          cajasConDiferencia: cajasConDiferencia.length,
          totalDiferencias: cajasConDiferencia.reduce((sum, c) => sum + parseFloat(c.diferencia || 0), 0)
        },
        totales: {
          ingresos: totalIngresos,
          egresos: totalEgresos,
          neto: totalIngresos - totalEgresos
        },
        porMetodoPago: {
          efectivo,
          tarjeta,
          transferencia
        },
        cajas: cajas.map(c => ({
          id: c.id,
          numero: c.numero,
          cajero: c.cajero,
          turno: c.turno,
          estado: c.estado,
          saldoInicial: parseFloat(c.saldoInicial),
          saldoFinalContado: c.saldoFinalContado ? parseFloat(c.saldoFinalContado) : null,
          diferencia: c.diferencia ? parseFloat(c.diferencia) : null
        }))
      }
    });

  } catch (error) {
    logger.logError('GET_REPORTE_DIARIO', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;
