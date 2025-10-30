const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired, validateDateRange } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const { generateInvoiceNumber } = require('../utils/helpers');
const logger = require('../utils/logger');

// ==============================================
// ENDPOINTS DE FACTURACIÓN
// ==============================================

// GET /invoices - Obtener facturas
router.get('/invoices', validatePagination, validateDateRange, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { dateRange } = req;
    const { estado, pacienteId, metodoPago } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (pacienteId) where.pacienteId = parseInt(pacienteId);
    if (metodoPago) where.metodoPago = metodoPago;
    if (dateRange?.start || dateRange?.end) {
      where.fechaFactura = {};
      if (dateRange.start) where.fechaFactura.gte = dateRange.start;
      if (dateRange.end) where.fechaFactura.lte = dateRange.end;
    }

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
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
            select: {
              id: true,
              tipoAtencion: true
            }
          }
        },
        orderBy: { fechaFactura: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.factura.count({ where })
    ]);

    const facturasFormatted = facturas.map(factura => ({
      id: factura.id,
      numeroFactura: factura.numeroFactura,
      paciente: {
        id: factura.paciente.id,
        nombreCompleto: `${factura.paciente.nombre} ${factura.paciente.apellidoPaterno} ${factura.paciente.apellidoMaterno || ''}`.trim()
      },
      fechaFactura: factura.fechaFactura,
      fechaVencimiento: factura.fechaVencimiento,
      subtotal: parseFloat(factura.subtotal),
      impuestos: parseFloat(factura.impuestos),
      descuentos: parseFloat(factura.descuentos),
      total: parseFloat(factura.total),
      estado: factura.estado,
      metodoPago: factura.metodoPago,
      observaciones: factura.observaciones,
      cuenta: factura.cuenta
    }));

    res.json(formatPaginationResponse(facturasFormatted, total, page, limit));

  } catch (error) {
    logger.logError('GET_INVOICES', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// POST /invoices - Crear factura
router.post('/invoices', authenticateToken, auditMiddleware('facturacion'), validateRequired(['cuentaId']), async (req, res) => {
  try {
    const { cuentaId, observaciones } = req.body;

    // Obtener cuenta y calcular totales
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

    const numeroFactura = await generateInvoiceNumber(prisma);
    const subtotal = parseFloat(cuenta.totalCuenta);
    const impuestos = subtotal * 0.16; // 16% IVA
    const total = subtotal + impuestos;

    const factura = await prisma.factura.create({
      data: {
        numeroFactura,
        pacienteId: cuenta.pacienteId,
        cuentaId: cuenta.id,
        fechaFactura: new Date(),
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        subtotal,
        impuestos,
        descuentos: 0,
        total,
        estado: 'pending',
        metodoPago: 'cash',
        observaciones
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { factura },
      message: 'Factura creada correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_INVOICE', error, { pacienteId: req.body.pacienteId });
    handlePrismaError(error, res);
  }
});

// GET /stats - Estadísticas de facturación
router.get('/stats', validateDateRange, async (req, res) => {
  try {
    const { dateRange } = req;
    const where = {};
    
    if (dateRange?.start || dateRange?.end) {
      where.fechaFactura = {};
      if (dateRange.start) where.fechaFactura.gte = dateRange.start;
      if (dateRange.end) where.fechaFactura.lte = dateRange.end;
    }

    const [
      totalFacturado,
      facturasPendientes,
      facturasPagadas,
      distribucionEstados
    ] = await Promise.all([
      prisma.factura.aggregate({
        where,
        _sum: { total: true }
      }),
      prisma.factura.count({ where: { ...where, estado: 'pending' } }),
      prisma.factura.count({ where: { ...where, estado: 'paid' } }),
      prisma.factura.groupBy({
        by: ['estado'],
        _count: { estado: true },
        _sum: { total: true },
        where
      })
    ]);

    res.json({
      success: true,
      data: {
        resumen: {
          totalFacturado: parseFloat(totalFacturado._sum.total || 0),
          facturasPendientes,
          facturasPagadas
        },
        distribucion: {
          estados: distribucionEstados.reduce((acc, item) => {
            acc[item.estado] = {
              cantidad: item._count.estado,
              monto: parseFloat(item._sum.total || 0)
            };
            return acc;
          }, {})
        }
      },
      message: 'Estadísticas obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_BILLING_STATS', error);
    handlePrismaError(error, res);
  }
});

// GET /invoices/:id/payments - Obtener pagos de una factura
router.get('/invoices/:id/payments', async (req, res) => {
  try {
    const facturaId = parseInt(req.params.id);
    
    if (!facturaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de factura inválido'
      });
    }

    const pagos = await prisma.pagoFactura.findMany({
      where: { facturaId },
      include: {
        cajero: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { fechaPago: 'desc' }
    });

    const pagosFormatted = pagos.map(pago => ({
      id: pago.id,
      facturaId: pago.facturaId,
      monto: parseFloat(pago.monto),
      metodoPago: pago.metodoPago,
      fechaPago: pago.fechaPago,
      referencia: pago.referencia,
      autorizacion: pago.autorizacion,
      observaciones: pago.observaciones,
      cajero: pago.cajero
    }));

    res.json({
      success: true,
      data: { payments: pagosFormatted, total: pagosFormatted.length },
      message: 'Pagos obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_INVOICE_PAYMENTS', error, { facturaId: req.params.id });
    handlePrismaError(error, res);
  }
});

// POST /invoices/:id/payments - Registrar pago para una factura
router.post('/invoices/:id/payments', authenticateToken, auditMiddleware('facturacion'), validateRequired(['monto', 'metodoPago']), async (req, res) => {
  try {
    const facturaId = parseInt(req.params.id);
    const { monto, metodoPago, referencia, autorizacion, observaciones, cajeroId } = req.body;
    
    if (!facturaId) {
      return res.status(400).json({
        success: false,
        message: 'ID de factura inválido'
      });
    }

    // Verificar que la factura existe
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId }
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Crear el pago
    const pago = await prisma.pagoFactura.create({
      data: {
        facturaId,
        monto: parseFloat(monto),
        metodoPago,
        referencia,
        autorizacion,
        observaciones,
        cajeroId: cajeroId || 1 // Default admin user
      },
      include: {
        cajero: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Actualizar saldo pendiente de la factura
    const totalPagado = await prisma.pagoFactura.aggregate({
      where: { facturaId },
      _sum: { monto: true }
    });

    const nuevoSaldoPendiente = parseFloat(factura.total) - parseFloat(totalPagado._sum.monto || 0);
    const nuevoEstado = nuevoSaldoPendiente <= 0 ? 'paid' : 
                       nuevoSaldoPendiente < parseFloat(factura.total) ? 'partial' : 'pending';

    const facturaActualizada = await prisma.factura.update({
      where: { id: facturaId },
      data: {
        saldoPendiente: nuevoSaldoPendiente,
        estado: nuevoEstado
      }
    });

    res.status(201).json({
      success: true,
      data: { 
        payment: {
          id: pago.id,
          facturaId: pago.facturaId,
          monto: parseFloat(pago.monto),
          metodoPago: pago.metodoPago,
          fechaPago: pago.fechaPago,
          referencia: pago.referencia,
          autorizacion: pago.autorizacion,
          observaciones: pago.observaciones,
          cajero: pago.cajero
        },
        invoice: {
          id: facturaActualizada.id,
          saldoPendiente: parseFloat(facturaActualizada.saldoPendiente),
          estado: facturaActualizada.estado
        }
      },
      message: 'Pago registrado exitosamente'
    });

  } catch (error) {
    logger.logError('CREATE_PAYMENT', error, { facturaId: req.params.id });
    handlePrismaError(error, res);
  }
});

// GET /accounts-receivable - Obtener cuentas por cobrar
router.get('/accounts-receivable', validateDateRange, async (req, res) => {
  try {
    const { dateRange } = req;
    const where = {};
    
    if (dateRange?.start || dateRange?.end) {
      where.fechaFactura = {};
      if (dateRange.start) where.fechaFactura.gte = dateRange.start;
      if (dateRange.end) where.fechaFactura.lte = dateRange.end;
    }

    const [
      totalFacturado,
      totalCobrado,
      facturasPendientes,
      facturasVencidas,
      vencimientoCorriente,
      vencimiento30,
      vencimiento60,
      vencimiento90,
      pagosAgrupadosPorMetodo
    ] = await Promise.all([
      // Total facturado
      prisma.factura.aggregate({
        where,
        _sum: { total: true }
      }),
      
      // Total cobrado (suma de pagos)
      prisma.pagoFactura.aggregate({
        where: {
          factura: dateRange?.start || dateRange?.end ? {
            fechaFactura: where.fechaFactura
          } : {}
        },
        _sum: { monto: true }
      }),
      
      // Facturas pendientes
      prisma.factura.count({
        where: { ...where, estado: { in: ['pending', 'partial'] } }
      }),
      
      // Facturas vencidas
      prisma.factura.count({
        where: {
          ...where,
          estado: { in: ['pending', 'partial'] },
          fechaVencimiento: { lt: new Date() }
        }
      }),
      
      // Vencimiento corriente (0-30 días)
      prisma.factura.aggregate({
        where: {
          ...where,
          estado: { in: ['pending', 'partial'] },
          fechaVencimiento: { 
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { saldoPendiente: true }
      }),
      
      // Vencido 31-60 días
      prisma.factura.aggregate({
        where: {
          ...where,
          estado: { in: ['pending', 'partial'] },
          fechaVencimiento: { 
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { saldoPendiente: true }
      }),
      
      // Vencido 61-90 días
      prisma.factura.aggregate({
        where: {
          ...where,
          estado: { in: ['pending', 'partial'] },
          fechaVencimiento: { 
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { saldoPendiente: true }
      }),
      
      // Vencido 90+ días
      prisma.factura.aggregate({
        where: {
          ...where,
          estado: { in: ['pending', 'partial'] },
          fechaVencimiento: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        },
        _sum: { saldoPendiente: true }
      }),
      
      // Pagos agrupados por método de pago
      prisma.pagoFactura.groupBy({
        by: ['metodoPago'],
        _sum: { monto: true },
        where: {
          factura: dateRange?.start || dateRange?.end ? {
            fechaFactura: where.fechaFactura
          } : {}
        }
      })
    ]);

    const totalFacturadoValue = parseFloat(totalFacturado._sum.total || 0);
    const totalCobradoValue = parseFloat(totalCobrado._sum.monto || 0);
    const saldoPendiente = totalFacturadoValue - totalCobradoValue;

    // Calcular promedio de cobranza (días)
    const promedioCobranza = totalFacturadoValue > 0 ? 
      Math.round((saldoPendiente / totalFacturadoValue) * 30) : 0;

    const accountsReceivableData = {
      totalFacturado: totalFacturadoValue,
      totalCobrado: totalCobradoValue,
      saldoPendiente,
      facturasPendientes,
      facturasVencidas,
      promedioCobranza,
      
      vencimiento: {
        corriente: parseFloat(vencimientoCorriente._sum.saldoPendiente || 0),
        vencido30: parseFloat(vencimiento30._sum.saldoPendiente || 0),
        vencido60: parseFloat(vencimiento60._sum.saldoPendiente || 0),
        vencido90: parseFloat(vencimiento90._sum.saldoPendiente || 0)
      },
      
      porMetodoPago: pagosAgrupadosPorMetodo.reduce((acc, item) => {
        acc[item.metodoPago] = parseFloat(item._sum.monto || 0);
        return acc;
      }, {
        cash: 0,
        card: 0,
        transfer: 0,
        check: 0,
        insurance: 0
      })
    };

    res.json({
      success: true,
      data: accountsReceivableData,
      message: 'Cuentas por cobrar obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_ACCOUNTS_RECEIVABLE', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

module.exports = router;