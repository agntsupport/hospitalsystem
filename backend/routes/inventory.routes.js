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

// ==============================================
// ENDPOINTS DE PROVEEDORES
// ==============================================

// GET /suppliers - Obtener proveedores con filtros
router.get('/suppliers', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { 
      search,
      activo,
      sortBy = 'nombreEmpresa',
      sortOrder = 'asc'
    } = req.query;

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
        { nombreEmpresa: { contains: searchTerm, mode: 'insensitive' } },
        { nombreComercial: { contains: searchTerm, mode: 'insensitive' } },
        { codigo: { contains: searchTerm, mode: 'insensitive' } },
        { rfc: { contains: searchTerm, mode: 'insensitive' } },
        { contactoNombre: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.proveedor.count({ where })
    ]);

    const proveedoresFormatted = proveedores.map(proveedor => ({
      id: proveedor.id,
      codigo: proveedor.codigo,
      razonSocial: proveedor.nombreEmpresa,
      nombreComercial: proveedor.nombreComercial,
      rfc: proveedor.rfc,
      contacto: {
        nombre: proveedor.contactoNombre,
        telefono: proveedor.contactoTelefono,
        email: proveedor.contactoEmail
      },
      direccion: proveedor.direccion,
      condicionesPago: proveedor.condicionesPago,
      activo: proveedor.activo,
      fechaRegistro: proveedor.createdAt,
      fechaActualizacion: proveedor.updatedAt
    }));

    res.json(formatPaginationResponse(proveedoresFormatted, total, page, limit));

  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    handlePrismaError(error, res);
  }
});

// POST /suppliers - Crear proveedor
router.post('/suppliers', authenticateToken, auditMiddleware('inventario'), validateRequired(['nombreEmpresa']), async (req, res) => {
  try {
    const {
      nombreEmpresa,
      nombreComercial,
      rfc,
      contactoNombre,
      contactoTelefono,
      contactoEmail,
      direccion,
      condicionesPago
    } = req.body;

    // Generar código único para el proveedor
    const lastSupplier = await prisma.proveedor.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextNumber = lastSupplier ? lastSupplier.id + 1 : 1;
    const codigo = `PROV${nextNumber.toString().padStart(4, '0')}`;

    const proveedor = await prisma.proveedor.create({
      data: {
        codigo,
        nombreEmpresa,
        nombreComercial,
        rfc,
        contactoNombre,
        contactoTelefono,
        contactoEmail,
        direccion,
        condicionesPago: condicionesPago || '30_dias',
        activo: true
      }
    });

    // Format response to match frontend expectations
    const proveedorFormatted = {
      id: proveedor.id,
      codigo: proveedor.codigo,
      razonSocial: proveedor.nombreEmpresa,
      nombreComercial: proveedor.nombreComercial,
      rfc: proveedor.rfc,
      contacto: {
        nombre: proveedor.contactoNombre,
        telefono: proveedor.contactoTelefono,
        email: proveedor.contactoEmail
      },
      direccion: proveedor.direccion,
      condicionesPago: proveedor.condicionesPago,
      activo: proveedor.activo,
      fechaCreacion: proveedor.createdAt,
      fechaActualizacion: proveedor.updatedAt
    };

    res.status(201).json({
      success: true,
      data: proveedorFormatted,
      message: 'Proveedor creado correctamente'
    });

  } catch (error) {
    console.error('Error creando proveedor:', error);
    handlePrismaError(error, res);
  }
});

// PUT /suppliers/:id - Actualizar proveedor
router.put('/suppliers/:id', authenticateToken, auditMiddleware('inventario'), captureOriginalData('proveedor'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombreEmpresa,
      nombreComercial,
      rfc,
      contactoNombre,
      contactoTelefono,
      contactoEmail,
      direccion,
      condicionesPago,
      activo
    } = req.body;

    const proveedor = await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: {
        nombreEmpresa,
        nombreComercial,
        rfc,
        contactoNombre,
        contactoTelefono,
        contactoEmail,
        direccion,
        condicionesPago,
        activo
      }
    });

    res.json({
      success: true,
      data: { proveedor },
      message: 'Proveedor actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    handlePrismaError(error, res);
  }
});

// DELETE /suppliers/:id - Eliminar proveedor (soft delete)
router.delete('/suppliers/:id', authenticateToken, auditMiddleware('inventario'), criticalOperationAudit, captureOriginalData('proveedor'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el proveedor tiene productos asociados
    const productosAsociados = await prisma.producto.count({
      where: { proveedorId: parseInt(id) }
    });

    if (productosAsociados > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el proveedor porque tiene ${productosAsociados} productos asociados`
      });
    }

    await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Proveedor desactivado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS DE PRODUCTOS
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
      ids,
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
    
    // Filtro por IDs específicos (para validación de stock)
    if (ids) {
      const idsArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (idsArray.length > 0) {
        where.id = { in: idsArray };
      }
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

// ==============================================
// SERVICIOS ENDPOINTS
// ==============================================

// GET /services - Obtener lista de servicios con paginación y filtros
router.get('/services', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      tipo = 'all',
      activo = 'all',
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Construir condiciones de filtrado
    const whereConditions = {};

    // Filtro de búsqueda
    if (search) {
      whereConditions.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por tipo
    if (tipo !== 'all') {
      whereConditions.tipo = tipo;
    }

    // Filtro por estado activo
    if (activo !== 'all') {
      whereConditions.activo = activo === 'true';
    }

    // Ejecutar consultas en paralelo
    const [servicios, totalServicios] = await Promise.all([
      prisma.servicio.findMany({
        where: whereConditions,
        skip: offset,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              transacciones: true,
              itemsVentaRapida: true,
              detallesFactura: true
            }
          }
        }
      }),
      prisma.servicio.count({ where: whereConditions })
    ]);

    res.json({
      success: true,
      data: {
        servicios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalServicios,
          totalPages: Math.ceil(totalServicios / limit)
        }
      },
      message: 'Servicios obtenidos correctamente'
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
});

// POST /services - Crear nuevo servicio
router.post('/services', 
  authenticateToken, 
  auditMiddleware('inventario'),
  validateRequired(['codigo', 'nombre', 'tipo', 'precio']), 
  async (req, res) => {
  try {
    const { codigo, nombre, descripcion, tipo, precio } = req.body;

    // Verificar si el código ya existe
    const existingService = await prisma.servicio.findUnique({
      where: { codigo }
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un servicio con ese código'
      });
    }

    // Crear el servicio
    const newService = await prisma.servicio.create({
      data: {
        codigo,
        nombre,
        descripcion,
        tipo,
        precio: parseFloat(precio),
        activo: true
      }
    });

    res.status(201).json({
      success: true,
      data: newService,
      message: 'Servicio creado correctamente'
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio',
      error: error.message
    });
  }
});

// PUT /services/:id - Actualizar servicio
router.put('/services/:id', 
  authenticateToken, 
  auditMiddleware('inventario'),
  captureOriginalData('servicio'),
  async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, tipo, precio, activo } = req.body;

    // Verificar que el servicio existe
    const existingService = await prisma.servicio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Si se está cambiando el código, verificar que no exista otro con ese código
    if (codigo && codigo !== existingService.codigo) {
      const codeExists = await prisma.servicio.findUnique({
        where: { codigo }
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro servicio con ese código'
        });
      }
    }

    // Actualizar el servicio
    const updatedService = await prisma.servicio.update({
      where: { id: parseInt(id) },
      data: {
        ...(codigo && { codigo }),
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(tipo && { tipo }),
        ...(precio !== undefined && { precio: parseFloat(precio) }),
        ...(activo !== undefined && { activo })
      }
    });

    res.json({
      success: true,
      data: updatedService,
      message: 'Servicio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
      error: error.message
    });
  }
});

// DELETE /services/:id - Eliminar servicio (soft delete)
router.delete('/services/:id', 
  authenticateToken, 
  auditMiddleware('inventario'),
  criticalOperationAudit,
  captureOriginalData('servicio'),
  async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el servicio existe
    const existingService = await prisma.servicio.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            transacciones: true,
            itemsVentaRapida: true,
            detallesFactura: true
          }
        }
      }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar si el servicio tiene relaciones activas
    const hasActiveRelations = 
      existingService._count.transacciones > 0 ||
      existingService._count.itemsVentaRapida > 0 ||
      existingService._count.detallesFactura > 0;

    if (hasActiveRelations) {
      // Solo desactivar si tiene relaciones
      const updatedService = await prisma.servicio.update({
        where: { id: parseInt(id) },
        data: { activo: false }
      });

      return res.json({
        success: true,
        data: updatedService,
        message: 'Servicio desactivado correctamente (tiene historial asociado)'
      });
    }

    // Si no tiene relaciones, eliminar permanentemente
    await prisma.servicio.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Servicio eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio',
      error: error.message
    });
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