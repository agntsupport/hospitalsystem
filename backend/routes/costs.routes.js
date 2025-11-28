// ABOUTME: Rutas para gestión de costos operativos del hospital
// ABOUTME: CRUD completo para costos y configuración de reportes (solo admin)

const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ==============================================
// COSTOS OPERATIVOS - CRUD
// ==============================================

// GET /costs/operational - Listar costos operativos con filtros
router.get('/operational', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { categoria, periodo, activo = 'true', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (periodo) {
      // Filtrar por mes específico
      const periodoDate = new Date(periodo);
      const startOfMonth = new Date(periodoDate.getFullYear(), periodoDate.getMonth(), 1);
      const endOfMonth = new Date(periodoDate.getFullYear(), periodoDate.getMonth() + 1, 0);
      where.periodo = { gte: startOfMonth, lte: endOfMonth };
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const [costos, total] = await Promise.all([
      prisma.costoOperativo.findMany({
        where,
        orderBy: [{ periodo: 'desc' }, { categoria: 'asc' }],
        skip,
        take: parseInt(limit)
      }),
      prisma.costoOperativo.count({ where })
    ]);

    // Calcular totales por categoría
    const totalesPorCategoria = await prisma.costoOperativo.groupBy({
      by: ['categoria'],
      where: { activo: true },
      _sum: { monto: true }
    });

    res.json({
      success: true,
      data: {
        items: costos.map(c => ({
          ...c,
          monto: parseFloat(c.monto)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        totalesPorCategoria: totalesPorCategoria.reduce((acc, item) => {
          acc[item.categoria] = parseFloat(item._sum.monto || 0);
          return acc;
        }, {})
      },
      message: 'Costos operativos obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_OPERATIONAL_COSTS', error);
    handlePrismaError(error, res);
  }
});

// GET /costs/operational/:id - Obtener un costo específico
router.get('/operational/:id', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { id } = req.params;

    const costo = await prisma.costoOperativo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!costo) {
      return res.status(404).json({
        success: false,
        message: 'Costo operativo no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        ...costo,
        monto: parseFloat(costo.monto)
      }
    });

  } catch (error) {
    logger.logError('GET_OPERATIONAL_COST', error);
    handlePrismaError(error, res);
  }
});

// POST /costs/operational - Crear nuevo costo operativo
router.post('/operational', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { categoria, concepto, descripcion, monto, periodo, recurrente = true } = req.body;

    // Validaciones
    if (!categoria || !concepto || !monto || !periodo) {
      return res.status(400).json({
        success: false,
        message: 'Categoría, concepto, monto y periodo son requeridos'
      });
    }

    const categoriasValidas = [
      'nomina', 'servicios_publicos', 'mantenimiento', 'insumos_generales',
      'renta_inmueble', 'seguros', 'depreciacion', 'marketing', 'capacitacion', 'otros'
    ];

    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        success: false,
        message: `Categoría inválida. Valores permitidos: ${categoriasValidas.join(', ')}`
      });
    }

    if (isNaN(monto) || parseFloat(monto) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser un número positivo'
      });
    }

    const nuevoCosto = await prisma.costoOperativo.create({
      data: {
        categoria,
        concepto,
        descripcion,
        monto: parseFloat(monto),
        periodo: new Date(periodo),
        recurrente
      }
    });

    logger.logInfo('CREATE_OPERATIONAL_COST', `Costo creado: ${concepto} - $${monto}`, {
      userId: req.user.userId,
      costoId: nuevoCosto.id
    });

    res.status(201).json({
      success: true,
      data: {
        ...nuevoCosto,
        monto: parseFloat(nuevoCosto.monto)
      },
      message: 'Costo operativo creado correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_OPERATIONAL_COST', error);
    handlePrismaError(error, res);
  }
});

// PUT /costs/operational/:id - Actualizar costo operativo
router.put('/operational/:id', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, concepto, descripcion, monto, periodo, recurrente, activo } = req.body;

    const costoExistente = await prisma.costoOperativo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!costoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Costo operativo no encontrado'
      });
    }

    const updateData = {};

    if (categoria !== undefined) {
      const categoriasValidas = [
        'nomina', 'servicios_publicos', 'mantenimiento', 'insumos_generales',
        'renta_inmueble', 'seguros', 'depreciacion', 'marketing', 'capacitacion', 'otros'
      ];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({
          success: false,
          message: `Categoría inválida. Valores permitidos: ${categoriasValidas.join(', ')}`
        });
      }
      updateData.categoria = categoria;
    }

    if (concepto !== undefined) updateData.concepto = concepto;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (monto !== undefined) {
      if (isNaN(monto) || parseFloat(monto) < 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser un número positivo'
        });
      }
      updateData.monto = parseFloat(monto);
    }
    if (periodo !== undefined) updateData.periodo = new Date(periodo);
    if (recurrente !== undefined) updateData.recurrente = recurrente;
    if (activo !== undefined) updateData.activo = activo;

    const costoActualizado = await prisma.costoOperativo.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    logger.logInfo('UPDATE_OPERATIONAL_COST', `Costo actualizado: ID ${id}`, {
      userId: req.user.userId,
      changes: updateData
    });

    res.json({
      success: true,
      data: {
        ...costoActualizado,
        monto: parseFloat(costoActualizado.monto)
      },
      message: 'Costo operativo actualizado correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_OPERATIONAL_COST', error);
    handlePrismaError(error, res);
  }
});

// DELETE /costs/operational/:id - Eliminar (soft delete) costo operativo
router.delete('/operational/:id', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = false } = req.query;

    const costoExistente = await prisma.costoOperativo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!costoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Costo operativo no encontrado'
      });
    }

    if (hardDelete === 'true') {
      // Eliminación física (solo para admin y con confirmación explícita)
      await prisma.costoOperativo.delete({
        where: { id: parseInt(id) }
      });
      logger.logInfo('HARD_DELETE_OPERATIONAL_COST', `Costo eliminado permanentemente: ID ${id}`, {
        userId: req.user.userId
      });
    } else {
      // Soft delete
      await prisma.costoOperativo.update({
        where: { id: parseInt(id) },
        data: { activo: false }
      });
      logger.logInfo('SOFT_DELETE_OPERATIONAL_COST', `Costo desactivado: ID ${id}`, {
        userId: req.user.userId
      });
    }

    res.json({
      success: true,
      message: hardDelete === 'true'
        ? 'Costo operativo eliminado permanentemente'
        : 'Costo operativo desactivado correctamente'
    });

  } catch (error) {
    logger.logError('DELETE_OPERATIONAL_COST', error);
    handlePrismaError(error, res);
  }
});

// GET /costs/summary - Resumen de costos por categoría y período
router.get('/summary', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes', fechaInicio, fechaFin } = req.query;

    // Calcular fechas
    let startDate = new Date();
    let endDate = new Date();

    if (periodo === 'mes') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (periodo === 'trimestre') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (periodo === 'año') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (fechaInicio) startDate = new Date(fechaInicio);
    if (fechaFin) endDate = new Date(fechaFin);

    // Costos del modelo CostoOperativo
    const [costosPorCategoria, costosRecurrentes, nominaEmpleados] = await Promise.all([
      // Costos por categoría
      prisma.costoOperativo.groupBy({
        by: ['categoria'],
        where: {
          activo: true,
          periodo: { gte: startDate, lte: endDate }
        },
        _sum: { monto: true },
        _count: { id: true }
      }),
      // Costos recurrentes (para proyección)
      prisma.costoOperativo.findMany({
        where: {
          activo: true,
          recurrente: true
        },
        select: {
          categoria: true,
          concepto: true,
          monto: true
        }
      }),
      // Nómina desde empleados
      prisma.empleado.aggregate({
        where: { activo: true },
        _sum: { salario: true },
        _count: { id: true }
      })
    ]);

    const resumenPorCategoria = costosPorCategoria.map(cat => ({
      categoria: cat.categoria,
      total: parseFloat(cat._sum.monto || 0),
      cantidad: cat._count.id
    }));

    // Agregar nómina si no está en costos operativos
    const nominaEnCostos = resumenPorCategoria.find(c => c.categoria === 'nomina');
    const nominaTotal = parseFloat(nominaEmpleados._sum.salario || 0);

    if (!nominaEnCostos || nominaEnCostos.total === 0) {
      resumenPorCategoria.push({
        categoria: 'nomina',
        total: nominaTotal,
        cantidad: nominaEmpleados._count.id,
        calculadoDesdeEmpleados: true
      });
    }

    const totalGeneral = resumenPorCategoria.reduce((sum, cat) => sum + cat.total, 0);

    // Proyección mensual basada en recurrentes
    const proyeccionMensual = costosRecurrentes.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0) + nominaTotal;

    res.json({
      success: true,
      data: {
        porCategoria: resumenPorCategoria,
        totalGeneral,
        nomina: {
          total: nominaTotal,
          empleados: nominaEmpleados._count.id
        },
        proyeccion: {
          mensual: proyeccionMensual,
          trimestral: proyeccionMensual * 3,
          anual: proyeccionMensual * 12
        },
        periodo: {
          fechaInicio: startDate.toISOString(),
          fechaFin: endDate.toISOString()
        }
      },
      message: 'Resumen de costos generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_COSTS_SUMMARY', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// CONFIGURACIÓN DE REPORTES
// ==============================================

// GET /costs/config - Obtener configuración de reportes
router.get('/config', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const configuraciones = await prisma.configuracionReportes.findMany({
      orderBy: { clave: 'asc' }
    });

    // Parsear valores según tipo
    const configParsed = configuraciones.map(c => {
      let valorParsed = c.valor;
      if (c.tipoDato === 'number') valorParsed = parseFloat(c.valor);
      if (c.tipoDato === 'boolean') valorParsed = c.valor === 'true';
      if (c.tipoDato === 'json') valorParsed = JSON.parse(c.valor);

      return {
        ...c,
        valorParsed
      };
    });

    res.json({
      success: true,
      data: configParsed
    });

  } catch (error) {
    logger.logError('GET_REPORTS_CONFIG', error);
    handlePrismaError(error, res);
  }
});

// PUT /costs/config/:clave - Actualizar configuración
router.put('/config/:clave', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor, descripcion } = req.body;

    if (valor === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El valor es requerido'
      });
    }

    // Buscar o crear configuración
    const configExistente = await prisma.configuracionReportes.findUnique({
      where: { clave }
    });

    let config;
    if (configExistente) {
      // Verificar si es editable
      if (!configExistente.editablePorAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Esta configuración no es editable'
        });
      }

      config = await prisma.configuracionReportes.update({
        where: { clave },
        data: {
          valor: String(valor),
          descripcion: descripcion || configExistente.descripcion
        }
      });
    } else {
      // Crear nueva configuración
      config = await prisma.configuracionReportes.create({
        data: {
          clave,
          valor: String(valor),
          descripcion: descripcion || '',
          tipoDato: typeof valor === 'number' ? 'number' : typeof valor === 'boolean' ? 'boolean' : 'string'
        }
      });
    }

    logger.logInfo('UPDATE_REPORTS_CONFIG', `Configuración actualizada: ${clave} = ${valor}`, {
      userId: req.user.userId
    });

    res.json({
      success: true,
      data: config,
      message: 'Configuración actualizada correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_REPORTS_CONFIG', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// COSTOS DE SERVICIOS
// ==============================================

// GET /costs/services - Listar servicios con sus costos
router.get('/services', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        precio: true,
        costo: true
      }
    });

    // Obtener configuración de % estimado
    const configPorcentaje = await prisma.configuracionReportes.findUnique({
      where: { clave: 'porcentaje_costo_servicio' }
    });
    const porcentajeEstimado = configPorcentaje ? parseFloat(configPorcentaje.valor) : 60;

    const serviciosConMargen = servicios.map(s => {
      const precio = parseFloat(s.precio);
      const costoReal = s.costo ? parseFloat(s.costo) : null;
      const costoEstimado = precio * (porcentajeEstimado / 100);
      const costoFinal = costoReal || costoEstimado;
      const margen = precio > 0 ? ((precio - costoFinal) / precio * 100) : 0;

      return {
        ...s,
        precio,
        costoReal,
        costoEstimado,
        usaCostoReal: costoReal !== null,
        margen: margen.toFixed(2)
      };
    });

    res.json({
      success: true,
      data: {
        items: serviciosConMargen,
        porcentajeEstimado
      }
    });

  } catch (error) {
    logger.logError('GET_SERVICES_COSTS', error);
    handlePrismaError(error, res);
  }
});

// PUT /costs/services/:id - Actualizar costo de un servicio
router.put('/services/:id', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { costo } = req.body;

    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    if (costo !== undefined && costo !== null && (isNaN(costo) || parseFloat(costo) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'El costo debe ser un número positivo o null'
      });
    }

    const servicioActualizado = await prisma.servicio.update({
      where: { id: parseInt(id) },
      data: {
        costo: costo === null ? null : parseFloat(costo)
      }
    });

    logger.logInfo('UPDATE_SERVICE_COST', `Costo de servicio actualizado: ${servicio.nombre} = $${costo}`, {
      userId: req.user.userId,
      servicioId: id
    });

    res.json({
      success: true,
      data: {
        ...servicioActualizado,
        precio: parseFloat(servicioActualizado.precio),
        costo: servicioActualizado.costo ? parseFloat(servicioActualizado.costo) : null
      },
      message: 'Costo de servicio actualizado correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_SERVICE_COST', error);
    handlePrismaError(error, res);
  }
});

// PUT /costs/services/bulk - Actualizar costos de múltiples servicios
router.put('/services/bulk', authenticateToken, authorizeRoles(['administrador']), async (req, res) => {
  try {
    const { servicios } = req.body;

    if (!Array.isArray(servicios) || servicios.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de servicios con id y costo'
      });
    }

    // Validar todos los servicios
    for (const s of servicios) {
      if (!s.id) {
        return res.status(400).json({
          success: false,
          message: 'Cada servicio debe tener un id'
        });
      }
      if (s.costo !== undefined && s.costo !== null && (isNaN(s.costo) || parseFloat(s.costo) < 0)) {
        return res.status(400).json({
          success: false,
          message: `El costo del servicio ID ${s.id} debe ser un número positivo o null`
        });
      }
    }

    // Actualizar en transacción
    const actualizaciones = await prisma.$transaction(
      servicios.map(s =>
        prisma.servicio.update({
          where: { id: parseInt(s.id) },
          data: { costo: s.costo === null ? null : parseFloat(s.costo) }
        })
      )
    );

    logger.logInfo('BULK_UPDATE_SERVICE_COSTS', `${servicios.length} servicios actualizados`, {
      userId: req.user.userId,
      servicioIds: servicios.map(s => s.id)
    });

    res.json({
      success: true,
      data: {
        actualizados: actualizaciones.length
      },
      message: `${actualizaciones.length} servicios actualizados correctamente`
    });

  } catch (error) {
    logger.logError('BULK_UPDATE_SERVICE_COSTS', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// CATEGORÍAS DISPONIBLES
// ==============================================

// GET /costs/categories - Obtener categorías disponibles
router.get('/categories', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  const categorias = [
    { value: 'nomina', label: 'Nómina', descripcion: 'Sueldos y salarios del personal' },
    { value: 'servicios_publicos', label: 'Servicios Públicos', descripcion: 'Luz, agua, gas, internet, teléfono' },
    { value: 'mantenimiento', label: 'Mantenimiento', descripcion: 'Mantenimiento de equipos e instalaciones' },
    { value: 'insumos_generales', label: 'Insumos Generales', descripcion: 'Papelería, limpieza, consumibles' },
    { value: 'renta_inmueble', label: 'Renta de Inmueble', descripcion: 'Arrendamiento de instalaciones' },
    { value: 'seguros', label: 'Seguros', descripcion: 'Seguros de responsabilidad civil, equipos, inmueble' },
    { value: 'depreciacion', label: 'Depreciación', descripcion: 'Depreciación de activos fijos' },
    { value: 'marketing', label: 'Marketing', descripcion: 'Publicidad y promoción' },
    { value: 'capacitacion', label: 'Capacitación', descripcion: 'Formación y actualización del personal' },
    { value: 'otros', label: 'Otros', descripcion: 'Gastos no categorizados' }
  ];

  res.json({
    success: true,
    data: categorias
  });
});

module.exports = router;
