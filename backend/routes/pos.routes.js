const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');

const prisma = new PrismaClient();

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
    console.error('Error al obtener servicios POS:', error);
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
      console.error('Usuario no autenticado correctamente:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado correctamente'
      });
    }
    
    // Obtener el ID del usuario autenticado desde el token
    const cajeroId = req.user.id;
    console.log('Usuario autenticado - ID:', cajeroId, 'Username:', req.user.username, 'Rol:', req.user.rol);
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

          // Reducir stock
          await tx.producto.update({
            where: { id: item.itemId },
            data: {
              stockActual: producto.stockActual - item.cantidad
            }
          });

          // Registrar movimiento de inventario
          console.log('Creando movimiento de inventario con usuarioId:', cajeroId, 'tipo:', typeof cajeroId);
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
    });

    res.json({
      success: true,
      message: 'Venta procesada exitosamente',
      data: { sale: result }
    });

  } catch (error) {
    console.error('Error procesando venta rápida:', error);
    res.status(500).json({
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
    console.error('Error obteniendo historial de ventas:', error);
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

    // Calcular saldos pendientes
    const saldosPendientes = await prisma.cuentaPaciente.aggregate({
      where: { 
        estado: 'abierta',
        saldoPendiente: { gt: 0 }
      },
      _sum: { saldoPendiente: true }
    });

    const stats = {
      cuentasAbiertas: cuentasAbiertas,
      cuentasCerradas: cuentasCerradasHoy,
      totalVentasHoy: parseFloat(totalVentasHoy._sum.total?.toString() || '0'),
      totalVentasMes: parseFloat(totalVentasMes._sum.total?.toString() || '0'),
      serviciosVendidos: serviciosVendidosHoy,
      productosVendidos: productosVendidosHoy,
      saldosPendientes: parseFloat(saldosPendientes._sum.saldoPendiente?.toString() || '0')
    };

    res.json({
      success: true,
      data: { stats },
      message: 'Estadísticas POS obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas POS:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas POS',
      error: error.message
    });
  }
});

module.exports = router;