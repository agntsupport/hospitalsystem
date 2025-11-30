// ABOUTME: Rutas para gestión de devoluciones y reembolsos
// ABOUTME: Control de solicitudes, autorizaciones y procesamiento de devoluciones

const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// HELPERS
// ==============================================

const generarNumeroDevolucion = async () => {
  const timestamp = Date.now();
  return `DEV-${timestamp}`;
};

// Umbral para autorización automática (configurable)
const UMBRAL_AUTORIZACION = 500;

// ==============================================
// ENDPOINTS DE MOTIVOS DE DEVOLUCIÓN
// ==============================================

// GET /devoluciones/motivos - Listar motivos de devolución
router.get('/motivos', authenticateToken, async (req, res) => {
  try {
    const motivos = await prisma.motivoDevolucion.findMany({
      where: { activo: true },
      orderBy: { descripcion: 'asc' }
    });

    res.json({
      success: true,
      data: motivos
    });

  } catch (error) {
    logger.logError('GET_MOTIVOS_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// POST /devoluciones/motivos - Crear motivo (admin)
router.post('/motivos', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('devoluciones'), async (req, res) => {
  try {
    const { codigo, descripcion, categoria, requiereAutorizacion = true } = req.body;

    if (!codigo || !descripcion || !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Código, descripción y categoría son requeridos'
      });
    }

    const categoriasValidas = ['error_captura', 'error_medico', 'paciente_rechaza', 'producto_defectuoso', 'duplicado', 'otro'];
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        success: false,
        message: `Categoría inválida. Valores permitidos: ${categoriasValidas.join(', ')}`
      });
    }

    const motivo = await prisma.motivoDevolucion.create({
      data: {
        codigo,
        descripcion,
        categoria,
        requiereAutorizacion
      }
    });

    res.status(201).json({
      success: true,
      data: motivo,
      message: 'Motivo de devolución creado correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_MOTIVO_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS DE DEVOLUCIONES
// ==============================================

// POST /devoluciones - Crear solicitud de devolución
router.post('/', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('devoluciones'), async (req, res) => {
  try {
    const { cuentaId, tipo, motivoId, motivoDetalle, productos, observaciones } = req.body;
    const cajeroId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    // Validaciones básicas
    if (!cuentaId || !tipo || !motivoId) {
      return res.status(400).json({
        success: false,
        message: 'CuentaId, tipo y motivoId son requeridos'
      });
    }

    const tiposValidos = ['producto', 'servicio', 'total_cuenta'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`
      });
    }

    // Verificar que la cuenta existe y está cerrada
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

    if (cuenta.estado !== 'cerrada') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden hacer devoluciones de cuentas cerradas'
      });
    }

    // Verificar tiempo límite (24 horas por defecto)
    const horasDesdecierre = cuenta.fechaCierre
      ? (Date.now() - new Date(cuenta.fechaCierre).getTime()) / (1000 * 60 * 60)
      : 0;

    if (horasDesdecierre > 24 && !esAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Han pasado más de 24 horas desde el cierre. Se requiere autorización de administrador.'
      });
    }

    // Verificar motivo
    const motivo = await prisma.motivoDevolucion.findUnique({
      where: { id: parseInt(motivoId) }
    });

    if (!motivo || !motivo.activo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo de devolución no válido'
      });
    }

    // Calcular monto de devolución
    let montoDevolucion = 0;

    if (tipo === 'total_cuenta') {
      montoDevolucion = parseFloat(cuenta.totalCuenta);
    } else if (tipo === 'producto' && productos && productos.length > 0) {
      // Validar productos a devolver
      for (const prod of productos) {
        const transaccion = cuenta.transacciones.find(
          t => t.productoId === prod.productoId && t.tipo === 'producto'
        );
        if (!transaccion) {
          return res.status(400).json({
            success: false,
            message: `Producto ID ${prod.productoId} no encontrado en la cuenta`
          });
        }
        if (prod.cantidad > transaccion.cantidad) {
          return res.status(400).json({
            success: false,
            message: `Cantidad a devolver (${prod.cantidad}) excede la cantidad original (${transaccion.cantidad})`
          });
        }
        montoDevolucion += prod.cantidad * parseFloat(transaccion.precioUnitario);
      }
    } else if (tipo === 'servicio') {
      // Para servicios, se debe especificar el monto
      if (!req.body.montoDevolucion) {
        return res.status(400).json({
          success: false,
          message: 'Para devolución de servicios se debe especificar el monto'
        });
      }
      montoDevolucion = parseFloat(req.body.montoDevolucion);
    }

    // Determinar si requiere autorización
    const requiereAuth = motivo.requiereAutorizacion ||
      montoDevolucion >= UMBRAL_AUTORIZACION ||
      motivo.categoria === 'error_medico';

    const estadoInicial = requiereAuth && !esAdmin ? 'pendiente_autorizacion' : 'autorizada';

    // Crear devolución
    const numero = await generarNumeroDevolucion();

    const devolucion = await prisma.$transaction(async (tx) => {
      const dev = await tx.devolucion.create({
        data: {
          numero,
          cuentaId: parseInt(cuentaId),
          tipo,
          estado: estadoInicial,
          montoDevolucion,
          motivoId: parseInt(motivoId),
          motivoDetalle,
          cajeroSolicitaId: cajeroId,
          autorizadorId: estadoInicial === 'autorizada' && esAdmin ? cajeroId : null,
          fechaAutorizacion: estadoInicial === 'autorizada' ? new Date() : null,
          observaciones
        }
      });

      // Si hay productos a devolver, registrarlos
      if (tipo === 'producto' && productos && productos.length > 0) {
        for (const prod of productos) {
          const transaccion = cuenta.transacciones.find(
            t => t.productoId === prod.productoId && t.tipo === 'producto'
          );

          await tx.productoDevuelto.create({
            data: {
              devolucionId: dev.id,
              productoId: prod.productoId,
              cantidadOriginal: transaccion.cantidad,
              cantidadDevuelta: prod.cantidad,
              precioUnitario: transaccion.precioUnitario,
              subtotal: prod.cantidad * parseFloat(transaccion.precioUnitario),
              estadoProducto: prod.estadoProducto || 'bueno',
              regresaInventario: prod.regresaInventario !== false
            }
          });
        }
      }

      return dev;
    });

    const devolucionCompleta = await prisma.devolucion.findUnique({
      where: { id: devolucion.id },
      include: {
        cuenta: {
          include: {
            paciente: { select: { nombre: true, apellidoPaterno: true } }
          }
        },
        motivo: true,
        cajeroSolicita: { select: { id: true, username: true, nombre: true } },
        productosDevueltos: {
          include: { producto: { select: { nombre: true, codigo: true } } }
        }
      }
    });

    logger.logInfo('DEVOLUCION_CREADA', `Devolución ${numero} - $${montoDevolucion} - Estado: ${estadoInicial}`, {
      userId: cajeroId,
      devolucionId: devolucion.id,
      cuentaId
    });

    res.status(201).json({
      success: true,
      data: {
        ...devolucionCompleta,
        montoDevolucion: parseFloat(devolucionCompleta.montoDevolucion)
      },
      message: requiereAuth && !esAdmin
        ? 'Solicitud de devolución creada. Pendiente de autorización.'
        : 'Devolución autorizada. Lista para procesar.'
    });

  } catch (error) {
    logger.logError('CREATE_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// GET /devoluciones - Listar devoluciones (filtros)
router.get('/', authenticateToken, authorizeRoles(['cajero', 'administrador', 'socio']), async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, cuentaId, fechaInicio, fechaFin } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (estado) where.estado = estado;
    if (cuentaId) where.cuentaId = parseInt(cuentaId);

    if (fechaInicio || fechaFin) {
      where.fechaSolicitud = {};
      if (fechaInicio) where.fechaSolicitud.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaSolicitud.lte = new Date(fechaFin);
    }

    const [devoluciones, total] = await Promise.all([
      prisma.devolucion.findMany({
        where,
        include: {
          cuenta: {
            include: {
              paciente: { select: { nombre: true, apellidoPaterno: true } }
            }
          },
          motivo: true,
          cajeroSolicita: { select: { id: true, username: true, nombre: true } },
          autorizador: { select: { id: true, username: true, nombre: true } }
        },
        orderBy: { fechaSolicitud: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.devolucion.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items: devoluciones.map(d => ({
          ...d,
          montoDevolucion: parseFloat(d.montoDevolucion)
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
    logger.logError('GET_DEVOLUCIONES', error);
    handlePrismaError(error, res);
  }
});

// GET /devoluciones/pendientes - Devoluciones pendientes de autorización
router.get('/pendientes', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const devoluciones = await prisma.devolucion.findMany({
      where: { estado: 'pendiente_autorizacion' },
      include: {
        cuenta: {
          include: {
            paciente: { select: { nombre: true, apellidoPaterno: true } }
          }
        },
        motivo: true,
        cajeroSolicita: { select: { id: true, username: true, nombre: true } },
        productosDevueltos: {
          include: { producto: { select: { nombre: true, codigo: true } } }
        }
      },
      orderBy: { fechaSolicitud: 'asc' }
    });

    res.json({
      success: true,
      data: devoluciones.map(d => ({
        ...d,
        montoDevolucion: parseFloat(d.montoDevolucion)
      })),
      total: devoluciones.length
    });

  } catch (error) {
    logger.logError('GET_DEVOLUCIONES_PENDIENTES', error);
    handlePrismaError(error, res);
  }
});

// GET /devoluciones/:id - Detalle de devolución
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const devolucion = await prisma.devolucion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cuenta: {
          include: {
            paciente: true,
            transacciones: true
          }
        },
        motivo: true,
        cajeroSolicita: { select: { id: true, username: true, nombre: true, apellidos: true } },
        autorizador: { select: { id: true, username: true, nombre: true, apellidos: true } },
        productosDevueltos: {
          include: {
            producto: { select: { id: true, nombre: true, codigo: true, precioVenta: true } }
          }
        }
      }
    });

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        ...devolucion,
        montoDevolucion: parseFloat(devolucion.montoDevolucion),
        productosDevueltos: devolucion.productosDevueltos.map(p => ({
          ...p,
          precioUnitario: parseFloat(p.precioUnitario),
          subtotal: parseFloat(p.subtotal)
        }))
      }
    });

  } catch (error) {
    logger.logError('GET_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// PUT /devoluciones/:id/autorizar - Autorizar (admin)
router.put('/:id/autorizar', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('devoluciones'), async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const adminId = req.user.id;

    const devolucion = await prisma.devolucion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    if (devolucion.estado !== 'pendiente_autorizacion' && devolucion.estado !== 'solicitada') {
      return res.status(400).json({
        success: false,
        message: `No se puede autorizar una devolución en estado: ${devolucion.estado}`
      });
    }

    const devolucionActualizada = await prisma.devolucion.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'autorizada',
        autorizadorId: adminId,
        fechaAutorizacion: new Date(),
        observaciones: observaciones || devolucion.observaciones
      },
      include: {
        cuenta: {
          include: { paciente: { select: { nombre: true, apellidoPaterno: true } } }
        },
        motivo: true,
        cajeroSolicita: { select: { username: true, nombre: true } },
        autorizador: { select: { username: true, nombre: true } }
      }
    });

    logger.logInfo('DEVOLUCION_AUTORIZADA', `Devolución ${devolucion.numero} autorizada`, {
      userId: adminId,
      devolucionId: devolucion.id
    });

    res.json({
      success: true,
      data: {
        ...devolucionActualizada,
        montoDevolucion: parseFloat(devolucionActualizada.montoDevolucion)
      },
      message: 'Devolución autorizada correctamente. Lista para procesar.'
    });

  } catch (error) {
    logger.logError('AUTORIZAR_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// PUT /devoluciones/:id/rechazar - Rechazar (admin)
router.put('/:id/rechazar', authenticateToken, authorizeRoles(['administrador']), auditMiddleware('devoluciones'), async (req, res) => {
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

    const devolucion = await prisma.devolucion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    if (devolucion.estado !== 'pendiente_autorizacion' && devolucion.estado !== 'solicitada') {
      return res.status(400).json({
        success: false,
        message: `No se puede rechazar una devolución en estado: ${devolucion.estado}`
      });
    }

    const devolucionActualizada = await prisma.devolucion.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'rechazada',
        autorizadorId: adminId,
        fechaAutorizacion: new Date(),
        observaciones: motivoRechazo
      }
    });

    logger.logInfo('DEVOLUCION_RECHAZADA', `Devolución ${devolucion.numero} rechazada: ${motivoRechazo}`, {
      userId: adminId,
      devolucionId: devolucion.id
    });

    res.json({
      success: true,
      data: {
        ...devolucionActualizada,
        montoDevolucion: parseFloat(devolucionActualizada.montoDevolucion)
      },
      message: 'Devolución rechazada'
    });

  } catch (error) {
    logger.logError('RECHAZAR_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// PUT /devoluciones/:id/procesar - Procesar (devolver dinero/stock)
router.put('/:id/procesar', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('devoluciones'), async (req, res) => {
  try {
    const { id } = req.params;
    const { metodoPago = 'efectivo' } = req.body;
    const cajeroId = req.user.id;

    const devolucion = await prisma.devolucion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cuenta: true,
        productosDevueltos: {
          include: { producto: true }
        }
      }
    });

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    if (devolucion.estado !== 'autorizada') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden procesar devoluciones autorizadas. Estado actual: ${devolucion.estado}`
      });
    }

    // Verificar que el cajero tenga caja abierta
    const cajaAbierta = await prisma.cajaDiaria.findFirst({
      where: {
        cajeroId,
        estado: 'abierta'
      }
    });

    if (!cajaAbierta) {
      return res.status(400).json({
        success: false,
        message: 'Debes tener una caja abierta para procesar devoluciones'
      });
    }

    // Procesar devolución en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado de devolución
      const devActualizada = await tx.devolucion.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'procesada',
          fechaProceso: new Date(),
          metodoPagoDevolucion: metodoPago
        }
      });

      // 2. Registrar movimiento de caja (egreso)
      await tx.movimientoCaja.create({
        data: {
          cajaId: cajaAbierta.id,
          tipo: 'egreso_devolucion',
          monto: devolucion.montoDevolucion,
          concepto: `Devolución ${devolucion.numero}`,
          referencia: devolucion.numero,
          metodoPago,
          cuentaId: devolucion.cuentaId,
          cajeroId
        }
      });

      // 3. Si hay productos, regresar al inventario
      for (const prod of devolucion.productosDevueltos) {
        if (prod.regresaInventario && prod.estadoProducto === 'bueno') {
          // Incrementar stock
          await tx.producto.update({
            where: { id: prod.productoId },
            data: {
              stockActual: { increment: prod.cantidadDevuelta }
            }
          });

          // Registrar movimiento de inventario
          await tx.movimientoInventario.create({
            data: {
              productoId: prod.productoId,
              tipoMovimiento: 'entrada',
              cantidad: prod.cantidadDevuelta,
              motivo: `Devolución ${devolucion.numero}`,
              usuarioId: cajeroId,
              cuentaPacienteId: devolucion.cuentaId
            }
          });
        }
      }

      return devActualizada;
    });

    logger.logInfo('DEVOLUCION_PROCESADA', `Devolución ${devolucion.numero} procesada - $${devolucion.montoDevolucion}`, {
      userId: cajeroId,
      devolucionId: devolucion.id,
      metodoPago
    });

    res.json({
      success: true,
      data: {
        ...resultado,
        montoDevolucion: parseFloat(resultado.montoDevolucion)
      },
      message: `Devolución procesada correctamente. Se devolvieron $${parseFloat(devolucion.montoDevolucion).toFixed(2)} en ${metodoPago}`
    });

  } catch (error) {
    logger.logError('PROCESAR_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// PUT /devoluciones/:id/cancelar - Cancelar solicitud
router.put('/:id/cancelar', authenticateToken, authorizeRoles(['cajero', 'administrador']), auditMiddleware('devoluciones'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id;

    const devolucion = await prisma.devolucion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    if (devolucion.estado === 'procesada' || devolucion.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar una devolución en estado: ${devolucion.estado}`
      });
    }

    const devolucionActualizada = await prisma.devolucion.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'cancelada',
        observaciones: motivo || devolucion.observaciones
      }
    });

    logger.logInfo('DEVOLUCION_CANCELADA', `Devolución ${devolucion.numero} cancelada`, {
      userId,
      devolucionId: devolucion.id
    });

    res.json({
      success: true,
      data: {
        ...devolucionActualizada,
        montoDevolucion: parseFloat(devolucionActualizada.montoDevolucion)
      },
      message: 'Devolución cancelada'
    });

  } catch (error) {
    logger.logError('CANCELAR_DEVOLUCION', error);
    handlePrismaError(error, res);
  }
});

// GET /devoluciones/reporte - Reporte de devoluciones
router.get('/reporte/estadisticas', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const where = {};
    if (fechaInicio || fechaFin) {
      where.fechaSolicitud = {};
      if (fechaInicio) where.fechaSolicitud.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaSolicitud.lte = new Date(fechaFin);
    }

    const [
      totalDevoluciones,
      devolucionesPorEstado,
      devolucionesPorMotivo,
      montoTotal
    ] = await Promise.all([
      prisma.devolucion.count({ where }),
      prisma.devolucion.groupBy({
        by: ['estado'],
        where,
        _count: { id: true },
        _sum: { montoDevolucion: true }
      }),
      prisma.devolucion.groupBy({
        by: ['motivoId'],
        where,
        _count: { id: true },
        _sum: { montoDevolucion: true }
      }),
      prisma.devolucion.aggregate({
        where: { ...where, estado: 'procesada' },
        _sum: { montoDevolucion: true }
      })
    ]);

    // Obtener nombres de motivos
    const motivos = await prisma.motivoDevolucion.findMany();
    const motivosMap = motivos.reduce((acc, m) => {
      acc[m.id] = m.descripcion;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalDevoluciones,
        montoTotalDevuelto: parseFloat(montoTotal._sum.montoDevolucion || 0),
        porEstado: devolucionesPorEstado.map(e => ({
          estado: e.estado,
          cantidad: e._count.id,
          monto: parseFloat(e._sum.montoDevolucion || 0)
        })),
        porMotivo: devolucionesPorMotivo.map(m => ({
          motivo: motivosMap[m.motivoId] || 'Desconocido',
          cantidad: m._count.id,
          monto: parseFloat(m._sum.montoDevolucion || 0)
        }))
      }
    });

  } catch (error) {
    logger.logError('GET_REPORTE_DEVOLUCIONES', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;
