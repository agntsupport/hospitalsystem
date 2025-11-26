const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');
const { calcularTotalesCuenta, formatearTotales } = require('../utils/posCalculations');

// ==============================================
// ENDPOINTS PARA MÓDULO POS - VENTAS RÁPIDAS
// ==============================================

// GET /services - Obtener servicios disponibles para POS
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: [
        { tipo: 'asc' },
        { nombre: 'asc' }
      ]
    });

    const serviciosFormatted = servicios.map(servicio => ({
      id: servicio.id,
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      tipo: servicio.tipo,
      precio: parseFloat(servicio.precio.toString()),
      activo: servicio.activo
    }));

    res.json({
      success: true,
      data: { 
        items: serviciosFormatted,
        total: serviciosFormatted.length
      },
      message: 'Servicios obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_POS_SERVICES', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
});

// POST /quick-sale - Procesar venta rápida
router.post('/quick-sale', authenticateToken, auditMiddleware('pos'), async (req, res) => {
  try {
    // Verificar que el usuario está autenticado
    if (!req.user || !req.user.id) {
      logger.error('Usuario no autenticado correctamente:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado correctamente'
      });
    }
    
    // Obtener el ID del usuario autenticado desde el token
    const cajeroId = req.user.id;
    logger.info(`Usuario autenticado - ID: ${cajeroId}, Username: ${req.user.username}, Rol: ${req.user.rol}`);
    const { items, metodoPago, montoRecibido, observaciones } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un item para la venta'
      });
    }

    // Validar método de pago
    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!metodosValidos.includes(metodoPago)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido'
      });
    }

    // Iniciar transacción
    const result = await prisma.$transaction(async (tx) => {
      let totalVenta = 0;

      // Validar y calcular total
      for (const item of items) {
        if (item.tipo === 'producto') {
          // Verificar stock disponible
          const producto = await tx.producto.findFirst({
            where: { 
              id: item.itemId,
              activo: true
            }
          });

          if (!producto) {
            throw new Error(`Producto con ID ${item.itemId} no encontrado`);
          }

          if (producto.stockActual < item.cantidad) {
            throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}, Requerido: ${item.cantidad}`);
          }

          totalVenta += item.cantidad * item.precioUnitario;

          // Reducir stock (atomic decrement para prevenir race conditions)
          const productoActualizado = await tx.producto.update({
            where: { id: item.itemId },
            data: {
              stockActual: {
                decrement: item.cantidad
              }
            }
          });

          // Verificar que el stock no sea negativo después de la reducción
          if (productoActualizado.stockActual < 0) {
            throw new Error(`Stock insuficiente para ${producto.nombre}. Operación causó stock negativo.`);
          }

          // Registrar movimiento de inventario
          logger.info(`Creando movimiento de inventario con usuarioId: ${cajeroId}, tipo: ${typeof cajeroId}`);
          if (!cajeroId || typeof cajeroId !== 'number') {
            throw new Error(`ID de usuario inválido para movimiento de inventario: ${cajeroId}`);
          }
          
          await tx.movimientoInventario.create({
            data: {
              productoId: item.itemId,
              tipoMovimiento: 'salida',
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              motivo: 'venta_rapida',
              usuarioId: parseInt(cajeroId),  // Asegurar que es un número
              observaciones: `Venta rápida - ${producto.nombre}`
            }
          });

        } else if (item.tipo === 'servicio') {
          // Verificar que el servicio existe
          const servicio = await tx.servicio.findFirst({
            where: { 
              id: item.itemId,
              activo: true
            }
          });

          if (!servicio) {
            throw new Error(`Servicio con ID ${item.itemId} no encontrado`);
          }

          totalVenta += item.cantidad * item.precioUnitario;
        }
      }

      // Crear venta rápida
      const ventaRapida = await tx.ventaRapida.create({
        data: {
          numeroVenta: `VR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
          total: totalVenta,
          metodoPago,
          montoRecibido: montoRecibido || totalVenta,
          cambio: metodoPago === 'efectivo' ? (montoRecibido || totalVenta) - totalVenta : 0,
          cajeroId,
          observaciones
        }
      });

      // Crear items de la venta
      for (const item of items) {
        // Obtener el nombre del item
        let nombreItem = '';
        if (item.tipo === 'producto') {
          const producto = await tx.producto.findUnique({ where: { id: item.itemId } });
          nombreItem = producto?.nombre || 'Producto';
        } else if (item.tipo === 'servicio') {
          const servicio = await tx.servicio.findUnique({ where: { id: item.itemId } });
          nombreItem = servicio?.nombre || 'Servicio';
        }

        await tx.itemVentaRapida.create({
          data: {
            ventaRapidaId: ventaRapida.id,
            tipo: item.tipo,
            servicioId: item.tipo === 'servicio' ? item.itemId : null,
            productoId: item.tipo === 'producto' ? item.itemId : null,
            nombre: nombreItem,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario
          }
        });
      }

      return ventaRapida;
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      message: 'Venta procesada exitosamente',
      data: { sale: result }
    });

  } catch (error) {
    logger.logError('PROCESS_QUICK_SALE', error);

    // Determinar código de status apropiado basado en el mensaje de error
    let statusCode = 500;
    if (error.message && error.message.includes('no encontrado')) {
      statusCode = 404;
    } else if (error.message && (error.message.includes('insuficiente') || error.message.includes('inválido'))) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error procesando venta rápida'
    });
  }
});

// GET /sales-history - Historial de ventas rápidas
router.get('/sales-history', async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      cajero, 
      metodoPago,
      limit = 50,
      offset = 0
    } = req.query;

    const where = {};

    // Filtros de fecha
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const endDate = new Date(fechaFin);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Filtro por cajero
    if (cajero) {
      where.cajeroId = parseInt(cajero);
    }

    // Filtro por método de pago
    if (metodoPago) {
      where.metodoPago = metodoPago;
    }

    // Obtener ventas con información del cajero
    const ventas = await prisma.ventaRapida.findMany({
      where,
      include: {
        cajero: {
          select: {
            id: true,
            username: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Contar total para paginación
    const total = await prisma.ventaRapida.count({ where });

    // Formatear respuesta
    const ventasFormatted = ventas.map(venta => ({
      id: venta.id,
      numeroVenta: venta.numeroVenta,
      total: parseFloat(venta.total),
      metodoPago: venta.metodoPago,
      montoRecibido: venta.montoRecibido ? parseFloat(venta.montoRecibido) : null,
      cambio: venta.cambio ? parseFloat(venta.cambio) : null,
      cajero: venta.cajero,
      fecha: venta.createdAt,
      observaciones: venta.observaciones,
      items: venta.items.map(item => ({
        tipo: item.tipo,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: parseFloat(item.precioUnitario),
        subtotal: parseFloat(item.subtotal)
      }))
    }));

    res.json({
      success: true,
      data: {
        items: ventasFormatted,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Historial de ventas obtenido exitosamente'
    });

  } catch (error) {
    logger.logError('GET_SALES_HISTORY', error, { filters: req.query });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de ventas'
    });
  }
});

// GET /stats - Obtener estadísticas del POS
router.get('/stats', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener estadísticas de cuentas de pacientes
    const [
      cuentasAbiertas,
      cuentasCerradasHoy,
      totalVentasHoy,
      totalVentasMes,
      ventasHoy,
      ventasMes
    ] = await Promise.all([
      // Cuentas abiertas actualmente
      prisma.cuentaPaciente.count({
        where: { estado: 'abierta' }
      }),
      
      // Cuentas cerradas hoy
      prisma.cuentaPaciente.count({
        where: {
          estado: 'cerrada',
          fechaCierre: {
            gte: hoy,
            lte: finHoy
          }
        }
      }),

      // Total de ventas de hoy
      prisma.ventaRapida.aggregate({
        where: {
          createdAt: {
            gte: hoy,
            lte: finHoy
          }
        },
        _sum: { total: true }
      }),

      // Total de ventas del mes
      prisma.ventaRapida.aggregate({
        where: {
          createdAt: {
            gte: inicioMes,
            lte: finMes
          }
        },
        _sum: { total: true }
      }),

      // Ventas de hoy para contar items
      prisma.ventaRapida.findMany({
        where: {
          createdAt: {
            gte: hoy,
            lte: finHoy
          }
        },
        include: { items: true }
      }),

      // Ventas del mes para contar items
      prisma.ventaRapida.findMany({
        where: {
          createdAt: {
            gte: inicioMes,
            lte: finMes
          }
        },
        include: { items: true }
      })
    ]);

    // Calcular servicios y productos vendidos
    const serviciosVendidosHoy = ventasHoy.reduce((total, venta) => 
      total + venta.items.filter(item => item.tipo === 'servicio').reduce((sum, item) => sum + item.cantidad, 0), 0
    );

    const productosVendidosHoy = ventasHoy.reduce((total, venta) => 
      total + venta.items.filter(item => item.tipo === 'producto').reduce((sum, item) => sum + item.cantidad, 0), 0
    );

    // Calcular saldos (separando a favor y en contra)
    const [saldosAFavor, saldosDebe] = await Promise.all([
      // Saldos a favor del paciente (positivos)
      prisma.cuentaPaciente.aggregate({
        where: { 
          estado: 'abierta',
          saldoPendiente: { gt: 0 }
        },
        _sum: { saldoPendiente: true }
      }),
      // Saldos que debe el paciente (negativos)
      prisma.cuentaPaciente.aggregate({
        where: { 
          estado: 'abierta',
          saldoPendiente: { lt: 0 }
        },
        _sum: { saldoPendiente: true }
      })
    ]);

    const stats = {
      cuentasAbiertas: cuentasAbiertas,
      cuentasCerradas: cuentasCerradasHoy,
      totalVentasHoy: parseFloat(totalVentasHoy._sum.total?.toString() || '0'),
      totalVentasMes: parseFloat(totalVentasMes._sum.total?.toString() || '0'),
      serviciosVendidos: serviciosVendidosHoy,
      productosVendidos: productosVendidosHoy,
      saldosAFavor: parseFloat(saldosAFavor._sum.saldoPendiente?.toString() || '0'),
      saldosPorCobrar: Math.abs(parseFloat(saldosDebe._sum.saldoPendiente?.toString() || '0'))
    };

    res.json({
      success: true,
      data: { stats },
      message: 'Estadísticas POS obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_POS_STATS', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas POS',
      error: error.message
    });
  }
});

// POST /cuentas - Crear nueva cuenta de paciente (sin hospitalización)
router.post('/cuentas', authenticateToken, auditMiddleware('pos'), async (req, res) => {
  try {
    const { pacienteId, tipoAtencion, anticipo, medicoTratanteId, observaciones } = req.body;

    // Validaciones requeridas
    if (!pacienteId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del paciente es requerido'
      });
    }

    if (!tipoAtencion) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de atención es requerido'
      });
    }

    // Validar que el tipo de atención sea válido
    const tiposValidos = ['consulta_general', 'urgencia', 'hospitalizacion'];
    if (!tiposValidos.includes(tipoAtencion)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de atención inválido'
      });
    }

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(pacienteId) }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Si se proporciona médico tratante, verificar que existe
    if (medicoTratanteId) {
      const medico = await prisma.empleado.findUnique({
        where: { id: parseInt(medicoTratanteId) }
      });

      if (!medico) {
        return res.status(404).json({
          success: false,
          message: 'Médico tratante no encontrado'
        });
      }

      // Verificar que es médico
      if (!medico.tipoEmpleado.includes('medico')) {
        return res.status(400).json({
          success: false,
          message: 'El empleado seleccionado no es médico'
        });
      }
    }

    // Obtener cajero del token JWT
    const cajeroAperturaId = req.user.id;

    // Crear cuenta de paciente
    const nuevaCuenta = await prisma.cuentaPaciente.create({
      data: {
        pacienteId: parseInt(pacienteId),
        tipoAtencion,
        anticipo: anticipo ? parseFloat(anticipo) : 0,
        medicoTratanteId: medicoTratanteId ? parseInt(medicoTratanteId) : null,
        cajeroAperturaId,
        observaciones: observaciones || null,
        // Valores por defecto
        estado: 'abierta',
        totalServicios: 0,
        totalProductos: 0,
        totalCuenta: 0,
        saldoPendiente: anticipo ? parseFloat(anticipo) : 0
      },
      include: {
        paciente: {
          select: {
            id: true,
            numeroExpediente: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            telefono: true,
            email: true
          }
        },
        medicoTratante: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true
          }
        },
        cajeroApertura: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Formatear respuesta
    const cuentaFormatted = {
      id: nuevaCuenta.id,
      pacienteId: nuevaCuenta.pacienteId,
      tipoAtencion: nuevaCuenta.tipoAtencion,
      estado: nuevaCuenta.estado,
      anticipo: parseFloat(nuevaCuenta.anticipo.toString()),
      totalServicios: parseFloat(nuevaCuenta.totalServicios.toString()),
      totalProductos: parseFloat(nuevaCuenta.totalProductos.toString()),
      totalCuenta: parseFloat(nuevaCuenta.totalCuenta.toString()),
      saldoPendiente: parseFloat(nuevaCuenta.saldoPendiente.toString()),
      fechaApertura: nuevaCuenta.fechaApertura,
      observaciones: nuevaCuenta.observaciones,
      paciente: nuevaCuenta.paciente,
      medicoTratante: nuevaCuenta.medicoTratante,
      cajeroApertura: nuevaCuenta.cajeroApertura
    };

    logger.info(`Cuenta POS creada - ID: ${nuevaCuenta.id}, Paciente: ${paciente.nombre} ${paciente.apellidoPaterno}, Cajero: ${req.user.username}`);

    res.status(201).json({
      success: true,
      data: { account: cuentaFormatted },
      message: 'Cuenta de paciente creada exitosamente'
    });

  } catch (error) {
    logger.logError('CREATE_PATIENT_ACCOUNT', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cuenta de paciente',
      error: error.message
    });
  }
});

// GET /cuentas - Obtener listado de cuentas de pacientes
router.get('/cuentas', authenticateToken, async (req, res) => {
  try {
    const { estado, pacienteId, limit = 100, offset = 0 } = req.query;

    const where = {};

    // Filtrar por estado si se proporciona
    if (estado) {
      where.estado = estado;
    }

    // Filtrar por paciente específico si se proporciona
    if (pacienteId) {
      where.pacienteId = parseInt(pacienteId);
    }

    const [cuentas, total] = await Promise.all([
      prisma.cuentaPaciente.findMany({
        where,
        include: {
          paciente: {
            select: {
              id: true,
              numeroExpediente: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              telefono: true
            }
          },
          hospitalizacion: {
            select: {
              id: true,
              fechaIngreso: true,
              fechaAlta: true,
              habitacion: {
                select: {
                  numero: true,
                  tipo: true
                }
              }
            }
          }
        },
        orderBy: {
          fechaApertura: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.cuentaPaciente.count({ where })
    ]);

    // Formatear cuentas: calcular en tiempo real SOLO si está abierta, usar valores almacenados si está cerrada
    const cuentasFormatted = await Promise.all(cuentas.map(async (cuenta) => {
      // Usar helper centralizado para calcular totales
      const totales = await calcularTotalesCuenta(cuenta, prisma);
      const { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente } = totales;

      return {
        id: cuenta.id,
        numeroExpediente: cuenta.numeroExpediente,
        pacienteId: cuenta.pacienteId,
        tipoAtencion: cuenta.tipoAtencion,
        estado: cuenta.estado,
        anticipo,
        totalServicios,
        totalProductos,
        totalCuenta,
        saldoPendiente,
        fechaApertura: cuenta.fechaApertura,
        fechaCierre: cuenta.fechaCierre,
        observaciones: cuenta.observaciones,
        paciente: cuenta.paciente,
        hospitalizacion: cuenta.hospitalizacion
      };
    }));

    res.json({
      success: true,
      data: {
        accounts: cuentasFormatted,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      },
      message: 'Cuentas obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_PATIENT_ACCOUNTS', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas de pacientes',
      error: error.message
    });
  }
});

// GET /cuenta/:id - Obtener detalles completos de una cuenta específica
router.get('/cuenta/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cuenta = await prisma.cuentaPaciente.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: {
          select: {
            id: true,
            numeroExpediente: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            fechaNacimiento: true,
            genero: true,
            telefono: true,
            email: true
          }
        },
        transacciones: {
          include: {
            producto: {
              select: {
                codigo: true,
                nombre: true,
                unidadMedida: true
              }
            },
            servicio: {
              select: {
                codigo: true,
                nombre: true,
                tipo: true
              }
            }
          },
          orderBy: { fechaTransaccion: 'desc' }
        },
        hospitalizacion: {
          select: {
            id: true,
            fechaIngreso: true,
            fechaAlta: true,
            diagnosticoIngreso: true,
            habitacion: {
              select: {
                numero: true,
                tipo: true
              }
            },
            medicoEspecialista: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true
              }
            }
          }
        },
        pagos: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
                username: true
              }
            }
          },
          orderBy: { fechaPago: 'desc' }
        }
      }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de paciente no encontrada'
      });
    }

    // Usar helper centralizado para calcular totales
    const totales = await calcularTotalesCuenta(cuenta, prisma);
    const { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente } = totales;

    // Formatear respuesta
    const cuentaFormatted = {
      id: cuenta.id,
      numeroExpediente: cuenta.numeroExpediente,
      pacienteId: cuenta.pacienteId,
      tipoAtencion: cuenta.tipoAtencion,
      estado: cuenta.estado,
      anticipo,
      totalServicios,
      totalProductos,
      totalCuenta,
      saldoPendiente,
      fechaApertura: cuenta.fechaApertura,
      fechaCierre: cuenta.fechaCierre,
      observaciones: cuenta.observaciones,
      paciente: cuenta.paciente,
      transacciones: cuenta.transacciones.map(t => ({
        id: t.id,
        tipo: t.tipo,
        concepto: t.concepto,
        cantidad: t.cantidad,
        precioUnitario: parseFloat(t.precioUnitario.toString()),
        subtotal: parseFloat(t.subtotal.toString()),
        fechaTransaccion: t.fechaTransaccion,
        producto: t.producto,
        servicio: t.servicio
      })),
      pagos: cuenta.pagos.map(p => ({
        id: p.id,
        monto: parseFloat(p.monto.toString()),
        metodoPago: p.metodoPago,
        tipoPago: p.tipoPago,
        fechaPago: p.fechaPago,
        observaciones: p.observaciones,
        empleado: p.empleado
      })),
      hospitalizacion: cuenta.hospitalizacion
    };

    res.json({
      success: true,
      data: { account: cuentaFormatted },
      message: 'Cuenta obtenida correctamente'
    });

  } catch (error) {
    logger.logError('GET_PATIENT_ACCOUNT', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta de paciente',
      error: error.message
    });
  }
});

// GET /cuenta/:id/transacciones - Obtener transacciones de una cuenta específica
router.get('/cuenta/:id/transacciones', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 50,
      tipo 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verificar que la cuenta existe
    const cuenta = await prisma.cuentaPaciente.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de paciente no encontrada'
      });
    }

    // Construir filtros
    const where = {
      cuentaId: parseInt(id)
    };

    if (tipo) {
      where.tipo = tipo;
    }

    // Obtener transacciones con detalles
    const [transacciones, total] = await Promise.all([
      prisma.transaccionCuenta.findMany({
        where,
        include: {
          producto: {
            select: {
              codigo: true,
              nombre: true,
              unidadMedida: true
            }
          },
          servicio: {
            select: {
              codigo: true,
              nombre: true,
              tipo: true
            }
          }
        },
        orderBy: { fechaTransaccion: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaccionCuenta.count({ where })
    ]);

    // Formatear transacciones
    const transaccionesFormatted = transacciones.map(transaccion => ({
      id: transaccion.id,
      tipo: transaccion.tipo,
      concepto: transaccion.concepto,
      cantidad: transaccion.cantidad,
      precioUnitario: parseFloat(transaccion.precioUnitario?.toString() || '0'),
      subtotal: parseFloat(transaccion.subtotal?.toString() || '0'),
      fecha: transaccion.fechaTransaccion,
      producto: transaccion.producto ? {
        codigo: transaccion.producto.codigo,
        nombre: transaccion.producto.nombre,
        unidadMedida: transaccion.producto.unidadMedida
      } : null,
      servicio: transaccion.servicio ? {
        codigo: transaccion.servicio.codigo,
        nombre: transaccion.servicio.nombre,
        tipo: transaccion.servicio.tipo
      } : null
    }));

    // Usar helper centralizado para calcular totales
    const totales = await calcularTotalesCuenta(cuenta, prisma);
    const { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente } = totales;

    res.json({
      success: true,
      data: {
        transacciones: transaccionesFormatted,
        pagination: {
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit)
        },
        // Totales de la cuenta (snapshot histórico si cerrada, tiempo real si abierta)
        totales: {
          anticipo,
          totalServicios,
          totalProductos,
          totalCuenta,
          saldoPendiente
        }
      },
      message: 'Transacciones obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_ACCOUNT_TRANSACTIONS', error, { cuentaId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones de cuenta',
      error: error.message
    });
  }
});

// POST /recalcular-cuentas - Recalcular totales de todas las cuentas abiertas (solo administradores)
router.post('/recalcular-cuentas', authenticateToken, async (req, res) => {
  try {
    // Solo administradores pueden ejecutar este endpoint
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden recalcular cuentas'
      });
    }

    logger.info('🔧 Iniciando recálculo de todas las cuentas abiertas...');
    
    // Obtener todas las cuentas abiertas
    const cuentasAbiertas = await prisma.cuentaPaciente.findMany({
      where: { estado: 'abierta' }
    });

    logger.info(`📋 Encontradas ${cuentasAbiertas.length} cuentas abiertas para recalcular`);

    let cuentasActualizadas = 0;
    const resultados = [];

    for (const cuenta of cuentasAbiertas) {
      // Usar helper centralizado para calcular totales (incluye pagos parciales)
      const totales = await calcularTotalesCuenta(cuenta, prisma);
      const { totalServicios, totalProductos, totalCuenta, saldoPendiente } = totales;

      // Verificar si hay cambios
      const cambios = (
        Math.abs(parseFloat(cuenta.totalServicios) - totalServicios) > 0.01 ||
        Math.abs(parseFloat(cuenta.totalProductos) - totalProductos) > 0.01 ||
        Math.abs(parseFloat(cuenta.totalCuenta) - totalCuenta) > 0.01 ||
        Math.abs(parseFloat(cuenta.saldoPendiente) - saldoPendiente) > 0.01
      );

      if (cambios) {
        // Actualizar cuenta
        await prisma.cuentaPaciente.update({
          where: { id: cuenta.id },
          data: {
            totalServicios,
            totalProductos,
            totalCuenta,
            saldoPendiente
          }
        });

        cuentasActualizadas++;
        resultados.push({
          cuentaId: cuenta.id,
          antes: {
            totalServicios: parseFloat(cuenta.totalServicios),
            totalProductos: parseFloat(cuenta.totalProductos),
            totalCuenta: parseFloat(cuenta.totalCuenta),
            saldoPendiente: parseFloat(cuenta.saldoPendiente)
          },
          despues: {
            totalServicios,
            totalProductos,
            totalCuenta,
            saldoPendiente
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        cuentasRevisadas: cuentasAbiertas.length,
        cuentasActualizadas,
        resultados
      },
      message: `Recálculo completado. ${cuentasActualizadas} de ${cuentasAbiertas.length} cuentas fueron actualizadas.`
    });

  } catch (error) {
    logger.logError('RECALCULATE_ACCOUNTS', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular cuentas',
      error: error.message
    });
  }
});

// ==============================================
// POST /cuentas/:id/pago-parcial - Registrar pago parcial
// ==============================================
router.post('/cuentas/:id/pago-parcial', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { monto, metodoPago, observaciones } = req.body;
  const cajeroId = req.user.id;

  try {
    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a cero'
      });
    }

    if (!metodoPago) {
      return res.status(400).json({
        success: false,
        message: 'El método de pago es requerido'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener cuenta con lock FOR UPDATE (previene race conditions)
      // Usamos query raw para obtener lock explícito en PostgreSQL
      const cuentas = await tx.$queryRaw`
        SELECT * FROM "CuentaPaciente"
        WHERE id = ${parseInt(id)}
        FOR UPDATE
      `;

      if (!cuentas || cuentas.length === 0) {
        throw new Error('Cuenta no encontrada');
      }

      const cuenta = cuentas[0];

      if (cuenta.estado === 'cerrada') {
        throw new Error('No se pueden registrar pagos en una cuenta cerrada');
      }

      // Obtener paciente para el log
      const paciente = await tx.paciente.findUnique({
        where: { id: cuenta.pacienteId }
      });

      // 2. Registrar pago parcial
      const pago = await tx.pago.create({
        data: {
          cuentaPacienteId: parseInt(id),
          monto: parseFloat(monto),
          metodoPago,
          tipoPago: 'parcial',
          empleadoId: cajeroId,
          observaciones: observaciones || `Pago parcial de $${parseFloat(monto).toFixed(2)}`
        }
      });

      logger.info(`💰 Pago parcial registrado en cuenta #${id}`, {
        paciente: paciente ? `${paciente.nombre} ${paciente.apellidoPaterno}` : 'N/A',
        monto: parseFloat(monto),
        metodoPago,
        cajero: cajeroId
      });

      return { pago, cuenta };
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      data: result,
      message: `Pago parcial de $${parseFloat(monto).toFixed(2)} registrado exitosamente`
    });

  } catch (error) {
    logger.logError('PARTIAL_PAYMENT', error, { cuentaId: id, monto, cajeroId });
    res.status(400).json({
      success: false,
      message: error.message || 'Error al registrar pago parcial',
      error: error.message
    });
  }
});

// ==============================================
// PUT /cuentas/:id/close - Cerrar cuenta con snapshot
// ==============================================
router.put('/cuentas/:id/close', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { metodoPago, montoPagado, observaciones, cuentaPorCobrar, motivoCuentaPorCobrar } = req.body;
  const cajeroCierreId = req.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener cuenta con validación
      const cuenta = await tx.cuentaPaciente.findUnique({
        where: { id: parseInt(id) },
        include: { transacciones: true, paciente: true }
      });

      if (!cuenta) {
        throw new Error('Cuenta no encontrada');
      }

      if (cuenta.estado === 'cerrada') {
        throw new Error('La cuenta ya está cerrada');
      }

      // 1.1 VALIDAR NOTA DE ALTA PARA HOSPITALIZACIONES (Flujo Crítico #1)
      if (cuenta.tipoAtencion === 'hospitalizacion') {
        logger.info(`🏥 Validando alta médica para cuenta #${id}...`);

        // Buscar hospitalización asociada
        const hospitalizacion = await tx.hospitalizacion.findUnique({
          where: { cuentaPacienteId: parseInt(id) }
        });

        if (hospitalizacion) {
          // Verificar si ya fue dado de alta
          const yaFueDadoDeAlta = hospitalizacion.fechaAlta &&
            ['alta_medica', 'alta_voluntaria'].includes(hospitalizacion.estado);

          logger.info(`🏥 Estado hospitalización: ${hospitalizacion.estado}, Alta: ${yaFueDadoDeAlta}`);

          if (!yaFueDadoDeAlta) {
            // Si NO fue dado de alta, validar que exista nota de alta
            const notaAlta = await tx.notaHospitalizacion.findFirst({
              where: {
                hospitalizacionId: hospitalizacion.id,
                tipoNota: 'alta'
              }
            });

            if (!notaAlta) {
              logger.warn(`⚠️ Intento de cerrar cuenta #${id} sin alta médica`);
              throw new Error('No se puede cerrar la cuenta. Falta "Nota de Alta" por parte de un médico.');
            }

            logger.info(`✅ Nota de alta encontrada para cuenta #${id}`);
          } else {
            logger.info(`✅ Paciente ya fue dado de alta - permitir cierre de cuenta #${id}`);
          }
        }
      }

      // 2. CALCULAR TOTALES EN TIEMPO REAL (single source of truth)
      // Usar helper centralizado para calcular totales (con transacción)
      const totales = await calcularTotalesCuenta(cuenta, tx);
      const { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente } = totales;

      logger.info(`💰 Totales cuenta #${id}: Anticipo: $${anticipo}, Total: $${totalCuenta}, Saldo: $${saldoPendiente}`);

      // 3. Validar pago si hay saldo pendiente
      if (saldoPendiente < 0) {
        // Si hay deuda y no se proporciona pago ni autorización de CPC
        if (!montoPagado && !cuentaPorCobrar) {
          throw new Error(
            `Se requiere pago de $${Math.abs(saldoPendiente).toFixed(2)} para cerrar la cuenta, ` +
            `o autorización de administrador para cuenta por cobrar`
          );
        }

        // Si se solicita cuenta por cobrar, validar autorización de administrador
        if (cuentaPorCobrar) {
          if (req.user.rol !== 'administrador') {
            throw new Error('Solo administradores pueden autorizar cuentas por cobrar');
          }

          if (!motivoCuentaPorCobrar) {
            throw new Error('Se requiere un motivo para autorizar cuenta por cobrar');
          }
        }
      }

      // 4. GUARDAR SNAPSHOT HISTÓRICO INMUTABLE (estado al momento del cierre)
      const updateData = {
        estado: 'cerrada',
        anticipo,              // Snapshot calculado
        totalServicios,        // Snapshot calculado
        totalProductos,        // Snapshot calculado
        totalCuenta,           // Snapshot calculado
        saldoPendiente,        // Snapshot calculado
        cajeroCierreId,
        fechaCierre: new Date(),
        observaciones: observaciones || `Cuenta cerrada - Total: $${totalCuenta.toFixed(2)}`
      };

      // Agregar campos de cuenta por cobrar si aplica
      if (cuentaPorCobrar) {
        updateData.cuentaPorCobrar = true;
        updateData.autorizacionCPCId = req.user.id;
        updateData.motivoCuentaPorCobrar = motivoCuentaPorCobrar;
        updateData.fechaAutorizacionCPC = new Date();
      }

      const cuentaCerrada = await tx.cuentaPaciente.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { paciente: true, cajeroCierre: true, autorizadorCPC: true }
      });

      // 5. Crear registro de cuenta por cobrar si aplica
      let historialCPC = null;
      if (cuentaPorCobrar && saldoPendiente < 0) {
        historialCPC = await tx.historialCuentaPorCobrar.create({
          data: {
            cuentaPacienteId: parseInt(id),
            montoOriginal: Math.abs(saldoPendiente),
            saldoPendiente: Math.abs(saldoPendiente),
            autorizadoPor: req.user.id,
            motivoAutorizacion: motivoCuentaPorCobrar,
            estado: 'pendiente'
          }
        });

        logger.info(`📋 Cuenta por cobrar creada para cuenta #${id}`, {
          paciente: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno}`,
          montoOriginal: Math.abs(saldoPendiente),
          autorizador: req.user.id,
          motivo: motivoCuentaPorCobrar
        });
      }

      // 6. Registrar pago final si aplica
      let pago = null;
      if (montoPagado && montoPagado > 0) {
        pago = await tx.pago.create({
          data: {
            monto: montoPagado,
            metodoPago: metodoPago || 'efectivo',
            tipoPago: 'total', // Marcar como pago final al cerrar cuenta
            cuentaPacienteId: parseInt(id),
            empleadoId: cajeroCierreId,
            observaciones: `Pago final al cerrar cuenta #${id}`
          }
        });
      }

      logger.info(`💰 Cuenta #${id} cerrada exitosamente`, {
        paciente: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno}`,
        totales: { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente },
        pago: pago ? { monto: pago.monto, metodo: pago.metodoPago } : null,
        cuentaPorCobrar: cuentaPorCobrar || false,
        cajero: cajeroCierreId
      });

      return {
        cuentaCerrada,
        pago,
        historialCPC,
        totales: { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente }
      };
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      data: result,
      message: `Cuenta #${id} cerrada exitosamente`
    });

  } catch (error) {
    logger.logError('CLOSE_ACCOUNT', error, { cuentaId: id, userId: cajeroCierreId });
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cerrar cuenta',
      error: error.message
    });
  }
});

// ===================================================================
// CUENTAS POR COBRAR (CPC) - GESTIÓN COMPLETA
// ===================================================================

/**
 * GET /api/pos/cuentas-por-cobrar
 * Listar todas las cuentas por cobrar con filtros opcionales
 *
 * Query params:
 * - estado: pendiente | pagado_parcial | pagado_total | cancelado
 * - fechaInicio: fecha inicio (YYYY-MM-DD)
 * - fechaFin: fecha fin (YYYY-MM-DD)
 * - pacienteId: ID del paciente
 * - page: página (default 1)
 * - limit: registros por página (default 20)
 *
 * Roles permitidos: administrador, cajero
 */
router.get('/cuentas-por-cobrar', authenticateToken, async (req, res) => {
  try {
    const { estado, fechaInicio, fechaFin, pacienteId, page = 1, limit = 20 } = req.query;

    // Solo admin y cajeros pueden ver CPC
    if (!['administrador', 'cajero'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver cuentas por cobrar'
      });
    }

    const where = {};

    // Filtros opcionales
    if (estado) {
      where.estado = estado;
    }

    if (fechaInicio || fechaFin) {
      where.fechaCreacion = {};
      if (fechaInicio) {
        where.fechaCreacion.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        where.fechaCreacion.lte = fechaFinDate;
      }
    }

    if (pacienteId) {
      where.cuentaPaciente = {
        pacienteId: parseInt(pacienteId)
      };
    }

    // Contar total de registros
    const total = await prisma.historialCuentaPorCobrar.count({ where });

    // Obtener registros con paginación
    const cuentasPorCobrar = await prisma.historialCuentaPorCobrar.findMany({
      where,
      include: {
        cuentaPaciente: {
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                telefono: true,
                email: true
              }
            }
          }
        },
        autorizador: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellidos: true
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Formatear respuesta
    const cuentasFormateadas = cuentasPorCobrar.map(cpc => ({
      id: cpc.id,
      cuentaPacienteId: cpc.cuentaPacienteId,
      paciente: {
        id: cpc.cuentaPaciente.paciente.id,
        nombreCompleto: `${cpc.cuentaPaciente.paciente.nombre} ${cpc.cuentaPaciente.paciente.apellidoPaterno} ${cpc.cuentaPaciente.paciente.apellidoMaterno || ''}`.trim(),
        telefono: cpc.cuentaPaciente.paciente.telefono,
        email: cpc.cuentaPaciente.paciente.email
      },
      montoOriginal: parseFloat(cpc.montoOriginal.toString()),
      saldoPendiente: parseFloat(cpc.saldoPendiente.toString()),
      montoPagado: parseFloat(cpc.montoOriginal.toString()) - parseFloat(cpc.saldoPendiente.toString()),
      porcentajePagado: ((parseFloat(cpc.montoOriginal.toString()) - parseFloat(cpc.saldoPendiente.toString())) / parseFloat(cpc.montoOriginal.toString()) * 100).toFixed(2),
      estado: cpc.estado,
      autorizadoPor: {
        id: cpc.autorizador.id,
        nombre: `${cpc.autorizador.nombre} ${cpc.autorizador.apellidoPaterno || ''}`.trim(),
        username: cpc.autorizador.username
      },
      motivoAutorizacion: cpc.motivoAutorizacion,
      fechaCreacion: cpc.fechaCreacion,
      fechaUltimoPago: cpc.fechaUltimoPago
    }));

    res.json({
      success: true,
      data: {
        items: cuentasFormateadas,
        pagination: {
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.logError('LIST_CPC', error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas por cobrar',
      error: error.message
    });
  }
});

/**
 * POST /api/pos/cuentas-por-cobrar/:id/pago
 * Registrar pago contra una cuenta por cobrar
 *
 * Body:
 * - monto: monto del pago (requerido, > 0)
 * - metodoPago: efectivo | tarjeta | transferencia (requerido)
 * - observaciones: notas adicionales (opcional)
 *
 * Roles permitidos: administrador, cajero
 */
router.post('/cuentas-por-cobrar/:id/pago', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { monto, metodoPago, observaciones } = req.body;
  const cajeroId = req.user.id;

  try {
    // Validar permisos
    if (!['administrador', 'cajero'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para registrar pagos de CPC'
      });
    }

    // Validar datos
    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a cero'
      });
    }

    if (!metodoPago) {
      return res.status(400).json({
        success: false,
        message: 'El método de pago es requerido'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Obtener CPC actual
      const cpc = await tx.historialCuentaPorCobrar.findUnique({
        where: { id: parseInt(id) },
        include: {
          cuentaPaciente: {
            include: {
              paciente: true
            }
          }
        }
      });

      if (!cpc) {
        throw new Error('Cuenta por cobrar no encontrada');
      }

      if (cpc.estado === 'pagado_total') {
        throw new Error('Esta cuenta por cobrar ya está pagada completamente');
      }

      if (cpc.estado === 'cancelado') {
        throw new Error('Esta cuenta por cobrar está cancelada y no acepta pagos');
      }

      const saldoPendiente = parseFloat(cpc.saldoPendiente.toString());
      const montoPago = parseFloat(monto);

      if (montoPago > saldoPendiente) {
        throw new Error(
          `El monto de pago (${montoPago.toFixed(2)}) no puede ser mayor al saldo pendiente (${saldoPendiente.toFixed(2)})`
        );
      }

      // Registrar pago en tabla Pago
      const pago = await tx.pago.create({
        data: {
          cuentaPacienteId: cpc.cuentaPacienteId,
          monto: montoPago,
          metodoPago,
          tipoPago: 'parcial', // Los pagos de CPC siempre son parciales (cuenta ya cerrada)
          empleadoId: cajeroId,
          observaciones: observaciones || `Pago contra cuenta por cobrar #${id}`
        }
      });

      // Calcular nuevo saldo
      const nuevoSaldo = saldoPendiente - montoPago;
      let nuevoEstado = cpc.estado;

      if (nuevoSaldo === 0) {
        nuevoEstado = 'pagado_total';
      } else if (nuevoSaldo < parseFloat(cpc.montoOriginal.toString())) {
        nuevoEstado = 'pagado_parcial';
      }

      // Actualizar CPC
      const cpcActualizado = await tx.historialCuentaPorCobrar.update({
        where: { id: parseInt(id) },
        data: {
          saldoPendiente: nuevoSaldo,
          estado: nuevoEstado,
          fechaUltimoPago: new Date()
        }
      });

      logger.info(`💰 Pago de CPC registrado`, {
        cpcId: id,
        paciente: `${cpc.cuentaPaciente.paciente.nombre} ${cpc.cuentaPaciente.paciente.apellidoPaterno}`,
        monto: montoPago,
        nuevoSaldo,
        estadoAnterior: cpc.estado,
        estadoNuevo: nuevoEstado,
        cajero: cajeroId
      });

      return { pago, cpcActualizado, cuentaPaciente: cpc.cuentaPaciente };
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      data: result,
      message: nuevoSaldo === 0
        ? `Cuenta por cobrar pagada completamente`
        : `Pago de ${parseFloat(monto).toFixed(2)} registrado. Saldo pendiente: ${result.cpcActualizado.saldoPendiente.toFixed(2)}`
    });

  } catch (error) {
    logger.logError('PAGO_CPC', error, { cpcId: id, monto, cajeroId });
    res.status(400).json({
      success: false,
      message: error.message || 'Error al registrar pago de CPC',
      error: error.message
    });
  }
});

/**
 * GET /api/pos/cuentas-por-cobrar/estadisticas
 * Obtener estadísticas de cuentas por cobrar
 *
 * Devuelve:
 * - Total de CPC activas (pendiente + pagado_parcial)
 * - Monto total pendiente de cobro
 * - Monto total recuperado
 * - Porcentaje de recuperación
 * - Distribución por estado
 * - Top 10 deudores
 *
 * Roles permitidos: administrador, cajero, socio
 */
router.get('/cuentas-por-cobrar/estadisticas', authenticateToken, async (req, res) => {
  try {
    // Permisos
    if (!['administrador', 'cajero', 'socio'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver estadísticas de CPC'
      });
    }

    const [
      totalCPC,
      distribucionEstado,
      topDeudores
    ] = await Promise.all([
      // Total de CPC
      prisma.historialCuentaPorCobrar.aggregate({
        _count: true,
        _sum: {
          montoOriginal: true,
          saldoPendiente: true
        }
      }),

      // Distribución por estado
      prisma.historialCuentaPorCobrar.groupBy({
        by: ['estado'],
        _count: true,
        _sum: {
          montoOriginal: true,
          saldoPendiente: true
        }
      }),

      // Top 10 deudores
      prisma.historialCuentaPorCobrar.findMany({
        where: {
          estado: { in: ['pendiente', 'pagado_parcial'] }
        },
        include: {
          cuentaPaciente: {
            include: {
              paciente: {
                select: {
                  id: true,
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                  telefono: true
                }
              }
            }
          }
        },
        orderBy: {
          saldoPendiente: 'desc'
        },
        take: 10
      })
    ]);

    // Calcular métricas
    const montoTotalOriginal = parseFloat(totalCPC._sum.montoOriginal || 0);
    const montoTotalPendiente = parseFloat(totalCPC._sum.saldoPendiente || 0);
    const montoTotalRecuperado = montoTotalOriginal - montoTotalPendiente;
    const porcentajeRecuperacion = montoTotalOriginal > 0
      ? ((montoTotalRecuperado / montoTotalOriginal) * 100).toFixed(2)
      : 0;

    // Formatear distribución por estado
    const distribucionFormateada = distribucionEstado.map(grupo => ({
      estado: grupo.estado,
      cantidad: grupo._count,
      montoOriginal: parseFloat(grupo._sum.montoOriginal || 0),
      saldoPendiente: parseFloat(grupo._sum.saldoPendiente || 0)
    }));

    // Formatear top deudores
    const deudoresFormateados = topDeudores.map(cpc => ({
      cpcId: cpc.id,
      paciente: {
        id: cpc.cuentaPaciente.paciente.id,
        nombreCompleto: `${cpc.cuentaPaciente.paciente.nombre} ${cpc.cuentaPaciente.paciente.apellidoPaterno} ${cpc.cuentaPaciente.paciente.apellidoMaterno || ''}`.trim(),
        telefono: cpc.cuentaPaciente.paciente.telefono
      },
      montoOriginal: parseFloat(cpc.montoOriginal.toString()),
      saldoPendiente: parseFloat(cpc.saldoPendiente.toString()),
      estado: cpc.estado,
      fechaCreacion: cpc.fechaCreacion
    }));

    res.json({
      success: true,
      data: {
        resumen: {
          totalCPC: totalCPC._count,
          montoTotalOriginal,
          montoTotalPendiente,
          montoTotalRecuperado,
          porcentajeRecuperacion: parseFloat(porcentajeRecuperacion)
        },
        distribucion: distribucionFormateada,
        topDeudores: deudoresFormateados
      }
    });

  } catch (error) {
    logger.logError('ESTADISTICAS_CPC', error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de CPC',
      error: error.message
    });
  }
});

module.exports = router;