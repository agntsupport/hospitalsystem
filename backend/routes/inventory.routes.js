const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const { sanitizeSearch } = require('../utils/helpers');
const { getSafeSelect, validateSelect } = require('../utils/schema-validator');

// ==============================================
// ENDPOINTS DE INVENTARIO
// ==============================================

// GET /products - Obtener productos con filtros
router.get('/products', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { 
      search,
      categoria,
      proveedor,
      activo,
      conStock,
      stockBajo,
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtros WHERE
    const where = {};

    // Filtro de activo (por defecto true)
    if (activo !== undefined) {
      where.activo = activo === 'true';
    } else {
      where.activo = true;
    }

    // Búsqueda por texto
    if (search) {
      const searchTerm = sanitizeSearch(search);
      where.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { descripcion: { contains: searchTerm, mode: 'insensitive' } },
        { codigo: { contains: searchTerm, mode: 'insensitive' } },
        { codigoBarras: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Filtros específicos
    if (categoria) where.categoria = categoria;
    if (proveedor) where.proveedorId = parseInt(proveedor);
    if (conStock === 'true') where.stockActual = { gt: 0 };
    if (stockBajo === 'true') {
      where.stockActual = { lte: prisma.raw('stock_minimo') };
    }

    // Ejecutar consulta con paginación
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: {
          proveedor: {
            select: getSafeSelect('proveedor', 'basic')
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.producto.count({ where })
    ]);

    // Formatear respuesta
    const productosFormatted = productos.map(producto => ({
      id: producto.id,
      codigo: producto.codigo,
      codigoBarras: producto.codigoBarras,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      proveedor: producto.proveedor ? {
        id: producto.proveedor.id,
        razonSocial: producto.proveedor.nombreEmpresa,
        contactoNombre: producto.proveedor.contactoNombre
      } : null,
      unidadMedida: producto.unidadMedida,
      contenidoPorUnidad: producto.contenidoPorUnidad,
      precioCompra: parseFloat(producto.precioCompra || 0),
      precioVenta: parseFloat(producto.precioVenta || 0),
      margenGanancia: producto.precioVenta && producto.precioCompra 
        ? ((parseFloat(producto.precioVenta) - parseFloat(producto.precioCompra)) / parseFloat(producto.precioCompra) * 100)
        : 0,
      stockMinimo: producto.stockMinimo,
      stockMaximo: producto.stockMaximo,
      stockActual: producto.stockActual,
      stockStatus: producto.stockActual <= 0 ? 'agotado' :
                  producto.stockActual <= producto.stockMinimo ? 'bajo' : 'normal',
      ubicacion: producto.ubicacion,
      requiereReceta: producto.requiereReceta,
      fechaCaducidad: producto.fechaCaducidad,
      lote: producto.lote,
      activo: producto.activo,
      fechaRegistro: producto.createdAt,
      fechaActualizacion: producto.updatedAt
    }));

    res.json({
      success: true,
      data: {
        products: productosFormatted,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      },
      message: 'Productos obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    handlePrismaError(error, res);
  }
});

// POST /products - Crear nuevo producto
router.post('/products', authenticateToken, auditMiddleware('inventario'), validateRequired(['nombre', 'categoria', 'precioVenta']), async (req, res) => {
  try {
    const {
      codigo,
      codigoBarras,
      nombre,
      descripcion,
      categoria,
      proveedorId,
      unidadMedida,
      contenidoPorUnidad,
      precioCompra,
      precioVenta,
      stockMinimo = 0,
      stockMaximo = 0,
      stockActual = 0,
      ubicacion,
      requiereReceta = false,
      fechaCaducidad,
      lote
    } = req.body;

    const producto = await prisma.producto.create({
      data: {
        codigo: codigo || `PROD-${Date.now()}`,
        codigoBarras,
        nombre,
        descripcion,
        categoria,
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
        unidadMedida,
        contenidoPorUnidad,
        precioCompra: precioCompra ? parseFloat(precioCompra) : null,
        precioVenta: parseFloat(precioVenta),
        stockMinimo: parseInt(stockMinimo),
        stockMaximo: parseInt(stockMaximo),
        stockActual: parseInt(stockActual),
        ubicacion,
        requiereReceta,
        fechaCaducidad: fechaCaducidad ? new Date(fechaCaducidad) : null,
        lote,
        activo: true
      },
      include: {
        proveedor: {
          select: getSafeSelect('proveedor', 'basic')
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { product: producto },
      message: 'Producto creado correctamente'
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    handlePrismaError(error, res);
  }
});

// PUT /products/:id - Actualizar producto
router.put('/products/:id', authenticateToken, auditMiddleware('inventario'), captureOriginalData('producto'), async (req, res) => {
  try {
    const { id } = req.params;
    const productoId = parseInt(id);

    if (isNaN(productoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const updateData = { ...req.body };
    
    // Convertir tipos de datos
    if (updateData.precioCompra !== undefined) {
      updateData.precioCompra = parseFloat(updateData.precioCompra) || null;
    }
    if (updateData.precioVenta !== undefined) {
      updateData.precioVenta = parseFloat(updateData.precioVenta);
    }
    if (updateData.stockMinimo !== undefined) {
      updateData.stockMinimo = parseInt(updateData.stockMinimo);
    }
    if (updateData.stockMaximo !== undefined) {
      updateData.stockMaximo = parseInt(updateData.stockMaximo);
    }
    if (updateData.stockActual !== undefined) {
      updateData.stockActual = parseInt(updateData.stockActual);
    }
    if (updateData.fechaCaducidad) {
      updateData.fechaCaducidad = new Date(updateData.fechaCaducidad);
    }
    if (updateData.proveedorId) {
      updateData.proveedorId = parseInt(updateData.proveedorId);
    }

    const producto = await prisma.producto.update({
      where: { id: productoId },
      data: updateData,
      include: {
        proveedor: {
          select: getSafeSelect('proveedor', 'basic')
        }
      }
    });

    res.json({
      success: true,
      data: { product: producto },
      message: 'Producto actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    handlePrismaError(error, res);
  }
});

// DELETE /products/:id - Eliminar producto (soft delete)
router.delete('/products/:id', authenticateToken, auditMiddleware('inventario'), criticalOperationAudit, async (req, res) => {
  try {
    const { id } = req.params;
    const productoId = parseInt(id);

    if (isNaN(productoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    await prisma.producto.update({
      where: { id: productoId },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    handlePrismaError(error, res);
  }
});

// GET /movements - Obtener movimientos de inventario
router.get('/movements', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { 
      productoId,
      tipo,
      motivo,
      fechaInicio,
      fechaFin,
      usuarioId
    } = req.query;

    // Construir filtros WHERE
    const where = {};

    if (productoId) where.productoId = parseInt(productoId);
    if (tipo) where.tipoMovimiento = tipo;
    if (motivo) where.motivo = motivo;
    if (usuarioId) where.usuarioId = parseInt(usuarioId);

    // Filtros de fecha
    if (fechaInicio || fechaFin) {
      where.fechaMovimiento = {};
      if (fechaInicio) {
        where.fechaMovimiento.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const endDate = new Date(fechaFin);
        endDate.setHours(23, 59, 59, 999);
        where.fechaMovimiento.lte = endDate;
      }
    }

    // Ejecutar consulta
    const [movimientos, total] = await Promise.all([
      prisma.movimientoInventario.findMany({
        where,
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true
            }
          },
          usuario: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { fechaMovimiento: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.movimientoInventario.count({ where })
    ]);

    // Formatear respuesta
    const movimientosFormatted = movimientos.map(mov => ({
      id: mov.id,
      producto: mov.producto,
      tipo: mov.tipoMovimiento,
      cantidad: mov.cantidad,
      motivo: mov.motivo,
      observaciones: mov.observaciones,
      usuario: mov.usuario,
      fecha: mov.fechaMovimiento
    }));

    res.json({
      success: true,
      data: {
        items: movimientosFormatted,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      },
      message: 'Movimientos obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    handlePrismaError(error, res);
  }
});

// POST /movements - Crear movimiento de inventario
router.post('/movements', authenticateToken, auditMiddleware('inventario'), validateRequired(['productoId', 'tipo', 'cantidad', 'motivo']), async (req, res) => {
  try {
    const {
      productoId,
      tipo,
      cantidad,
      motivo,
      observaciones,
      usuarioId = 16 // Usuario por defecto
    } = req.body;

    const cantidadNum = parseInt(cantidad);
    const productoIdNum = parseInt(productoId);
    const usuarioIdNum = parseInt(usuarioId);

    if (cantidadNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Usar transacción para actualizar stock y crear movimiento
    const result = await prisma.$transaction(async (tx) => {
      // Obtener producto actual
      const producto = await tx.producto.findUnique({
        where: { id: productoIdNum }
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      // Calcular nuevo stock
      let nuevoStock = producto.stockActual;
      if (tipo === 'entrada') {
        nuevoStock += cantidadNum;
      } else if (tipo === 'salida') {
        nuevoStock -= cantidadNum;
        if (nuevoStock < 0) {
          throw new Error('Stock insuficiente');
        }
      }

      // Actualizar stock del producto
      await tx.producto.update({
        where: { id: productoIdNum },
        data: { stockActual: nuevoStock }
      });

      // Crear movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          productoId: productoIdNum,
          tipoMovimiento: tipo,
          cantidad: cantidadNum,
          motivo,
          observaciones,
          usuarioId: usuarioIdNum
        },
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              stockActual: true
            }
          },
          usuario: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      return movimiento;
    });

    res.status(201).json({
      success: true,
      data: { movement: result },
      message: 'Movimiento creado correctamente'
    });

  } catch (error) {
    console.error('Error creando movimiento:', error);
    if (error.message === 'Producto no encontrado' || error.message === 'Stock insuficiente') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    handlePrismaError(error, res);
  }
});

// GET /stats - Estadísticas de inventario
router.get('/stats', async (req, res) => {
  try {
    const [
      totalProductos,
      productosActivos,
      productosAgotados,
      productosStockBajo,
      valorTotalInventario,
      distribucionCategorias,
      movimientosRecientes
    ] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({ where: { activo: true } }),
      prisma.producto.count({ where: { stockActual: 0, activo: true } }),
      prisma.$queryRaw`SELECT COUNT(*) as count FROM productos WHERE stock_actual <= stock_minimo AND activo = true`,
      prisma.$queryRaw`SELECT SUM(precio_venta * stock_actual) as valor FROM productos WHERE activo = true`,
      prisma.producto.groupBy({
        by: ['categoria'],
        _count: { categoria: true },
        where: { activo: true }
      }),
      prisma.movimientoInventario.count({
        where: {
          fechaMovimiento: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        resumen: {
          totalProductos,
          productosActivos,
          productosAgotados,
          productosStockBajo: parseInt(productosStockBajo[0].count),
          valorTotalInventario: parseFloat(valorTotalInventario[0]?.valor || 0),
          movimientosRecientes
        },
        distribucion: {
          categorias: distribucionCategorias.reduce((acc, item) => {
            acc[item.categoria] = item._count.categoria;
            return acc;
          }, {})
        }
      },
      message: 'Estadísticas obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de inventario:', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;