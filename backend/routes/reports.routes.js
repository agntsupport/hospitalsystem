const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { validateDateRange } = require('../middleware/validation.middleware');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { exportLimiter, customReportLimiter } = require('../middleware/rateLimiter.middleware');
const logger = require('../utils/logger');

// ==============================================
// ENDPOINTS DE REPORTES
// ==============================================

// GET /financial - Reporte financiero completo (solo admin y socio)
router.get('/financial', authenticateToken, authorizeRoles(['administrador', 'socio']), validateDateRange, async (req, res) => {
  try {
    const { dateRange } = req;
    const whereDate = {};

    if (dateRange?.start || dateRange?.end) {
      if (dateRange.start) whereDate.gte = dateRange.start;
      if (dateRange.end) whereDate.lte = dateRange.end;
    }

    const [
      // Ingresos de transacciones de cuentas
      transaccionesCuentas,
      // Cuentas cerradas (pagadas)
      cuentasCerradas,
      // Cuentas por cobrar
      cuentasPorCobrar,
      // Devoluciones
      devolucionesAprobadas,
      // Descuentos aplicados
      descuentosAutorizados,
      // Depósitos bancarios
      depositosBancarios,
      // Caja diaria
      cajasDiarias
    ] = await Promise.all([
      // Transacciones de cuentas (servicios + productos)
      prisma.transaccionCuenta.aggregate({
        where: {
          tipo: { in: ['servicio', 'producto'] },
          ...(Object.keys(whereDate).length > 0 ? { fechaTransaccion: whereDate } : {})
        },
        _sum: { subtotal: true },
        _count: { id: true }
      }),
      // Cuentas cerradas
      prisma.cuentaPaciente.aggregate({
        where: {
          estado: 'cerrada',
          ...(Object.keys(whereDate).length > 0 ? { fechaCierre: whereDate } : {})
        },
        _sum: { totalCuenta: true },
        _count: { id: true }
      }),
      // Cuentas por cobrar
      prisma.cuentaPaciente.aggregate({
        where: {
          cuentaPorCobrar: true,
          estado: 'abierta'
        },
        _sum: { saldoPendiente: true },
        _count: { id: true }
      }),
      // Devoluciones aprobadas
      prisma.devolucion.aggregate({
        where: {
          estado: 'aprobada',
          ...(Object.keys(whereDate).length > 0 ? { fechaDevolucion: whereDate } : {})
        },
        _sum: { monto: true },
        _count: { id: true }
      }),
      // Descuentos autorizados
      prisma.descuentoAplicado.aggregate({
        where: {
          estado: 'autorizado',
          ...(Object.keys(whereDate).length > 0 ? { fechaAplicacion: whereDate } : {})
        },
        _sum: { montoDescuento: true },
        _count: { id: true }
      }),
      // Depósitos bancarios
      prisma.depositoBancario.aggregate({
        where: {
          estado: 'confirmado',
          ...(Object.keys(whereDate).length > 0 ? { fechaDeposito: whereDate } : {})
        },
        _sum: { monto: true },
        _count: { id: true }
      }),
      // Cajas diarias cerradas
      prisma.cajaDiaria.findMany({
        where: {
          estado: 'cerrada',
          ...(Object.keys(whereDate).length > 0 ? { fechaCierre: whereDate } : {})
        },
        select: {
          totalIngresos: true,
          totalEgresos: true,
          diferencia: true
        }
      })
    ]);

    // Calcular totales de caja
    const totalIngresosCaja = cajasDiarias.reduce((sum, c) => sum + parseFloat(c.totalIngresos || 0), 0);
    const totalEgresosCaja = cajasDiarias.reduce((sum, c) => sum + parseFloat(c.totalEgresos || 0), 0);
    const diferenciaCaja = cajasDiarias.reduce((sum, c) => sum + parseFloat(c.diferencia || 0), 0);

    const ingresosBrutos = parseFloat(transaccionesCuentas._sum.subtotal || 0);
    const devoluciones = parseFloat(devolucionesAprobadas._sum.monto || 0);
    const descuentos = parseFloat(descuentosAutorizados._sum.montoDescuento || 0);
    const ingresosNetos = ingresosBrutos - devoluciones - descuentos;

    res.json({
      success: true,
      data: {
        ingresos: {
          brutos: ingresosBrutos,
          transacciones: transaccionesCuentas._count.id,
          cuentasCerradas: {
            monto: parseFloat(cuentasCerradas._sum.totalCuenta || 0),
            cantidad: cuentasCerradas._count.id
          }
        },
        deducciones: {
          devoluciones: {
            monto: devoluciones,
            cantidad: devolucionesAprobadas._count.id
          },
          descuentos: {
            monto: descuentos,
            cantidad: descuentosAutorizados._count.id
          },
          total: devoluciones + descuentos
        },
        ingresosNetos,
        cuentasPorCobrar: {
          monto: Math.abs(parseFloat(cuentasPorCobrar._sum.saldoPendiente || 0)),
          cantidad: cuentasPorCobrar._count.id
        },
        bancos: {
          depositados: parseFloat(depositosBancarios._sum.monto || 0),
          cantidadDepositos: depositosBancarios._count.id
        },
        caja: {
          ingresos: totalIngresosCaja,
          egresos: totalEgresosCaja,
          diferencia: diferenciaCaja,
          cajasAnalizadas: cajasDiarias.length
        }
      },
      message: 'Reporte financiero generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_FINANCIAL_REPORT', error, { dateRange: req.query });
    handlePrismaError(error, res);
  }
});

// GET /operational - Reporte operacional (Admin, Socio, Médico Especialista)
router.get('/operational', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista']), validateDateRange, async (req, res) => {
  try {
    const { dateRange } = req;
    const whereMovimiento = {};
    
    if (dateRange?.start || dateRange?.end) {
      whereMovimiento.fechaMovimiento = {};
      if (dateRange.start) whereMovimiento.fechaMovimiento.gte = dateRange.start;
      if (dateRange.end) whereMovimiento.fechaMovimiento.lte = dateRange.end;
    }

    const [
      pacientesAtendidos,
      admisionesHospitalarias,
      movimientosInventario,
      habitacionesOcupadas
    ] = await Promise.all([
      prisma.cuentaPaciente.count({
        where: dateRange ? { fechaApertura: { gte: dateRange.start, lte: dateRange.end } } : {}
      }),
      prisma.hospitalizacion.count({
        where: dateRange ? { fechaIngreso: { gte: dateRange.start, lte: dateRange.end } } : {}
      }),
      prisma.movimientoInventario.count({ where: whereMovimiento }),
      prisma.habitacion.count({ where: { estado: 'ocupada' } })
    ]);

    res.json({
      success: true,
      data: {
        atencionPacientes: {
          pacientesAtendidos,
          admisionesHospitalarias
        },
        inventario: {
          movimientos: movimientosInventario
        },
        ocupacion: {
          habitacionesOcupadas
        }
      },
      message: 'Reporte operacional generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_OPERATIONAL_REPORT', error, { dateRange: req.query });
    handlePrismaError(error, res);
  }
});

// GET /executive - Reporte ejecutivo (Admin, Socio)
router.get('/executive', authenticateToken, authorizeRoles(['administrador', 'socio']), validateDateRange, async (req, res) => {
  try {
    const { dateRange } = req;

    // Obtener datos de múltiples fuentes
    const [
      resumenFinanciero,
      resumenOperacional,
      tendencias
    ] = await Promise.all([
      // Resumen financiero
      Promise.all([
        // Transacciones de cuentas (servicios + productos)
        prisma.transaccionCuenta.aggregate({
          where: dateRange ? {
            fechaTransaccion: { gte: dateRange.start, lte: dateRange.end },
            tipo: { in: ['servicio', 'producto'] }
          } : { tipo: { in: ['servicio', 'producto'] } },
          _sum: { subtotal: true }
        }),
        // Cuentas cerradas
        prisma.cuentaPaciente.aggregate({
          where: {
            estado: 'cerrada',
            ...(dateRange ? { fechaCierre: { gte: dateRange.start, lte: dateRange.end } } : {})
          },
          _sum: { totalCuenta: true }
        })
      ]),
      // Resumen operacional
      Promise.all([
        prisma.paciente.count({
          where: dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {}
        }),
        prisma.hospitalizacion.count({
          where: dateRange ? { fechaIngreso: { gte: dateRange.start, lte: dateRange.end } } : {}
        })
      ]),
      // Tendencias (últimos 30 días)
      prisma.$queryRaw`
        SELECT DATE(created_at) as fecha, COUNT(*) as pacientes
        FROM pacientes
        WHERE created_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(created_at)
        ORDER BY fecha DESC
        LIMIT 30
      `
    ]);

    const [transacciones, cuentasCerradas] = resumenFinanciero;
    const [nuevosPacientes, nuevasAdmisiones] = resumenOperacional;
    const ingresosTotales = parseFloat(transacciones._sum.subtotal || 0) + parseFloat(cuentasCerradas._sum.totalCuenta || 0);

    // Convert BigInt values to numbers in tendencias
    const tendenciasNormalized = tendencias.map(item => ({
      fecha: item.fecha,
      pacientes: Number(item.pacientes)
    }));

    res.json({
      success: true,
      data: {
        resumenEjecutivo: {
          ingresosTotales,
          nuevosPacientes,
          nuevasAdmisiones,
          tendenciaPacientes: tendenciasNormalized
        }
      },
      message: 'Reporte ejecutivo generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_EXECUTIVE_REPORT', error, { dateRange: req.query });
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS MANAGERIAL PARA FRONTEND
// ==============================================

// GET /managerial/executive-summary - Resumen ejecutivo gerencial (Admin, Socio)
router.get('/managerial/executive-summary', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes', fechaInicio, fechaFin } = req.query;
    
    // Calcular fechas basadas en el período
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

    // Obtener datos reales de la base de datos
    const [ingresosTotales, pacientesAtendidos, habitacionesStats] = await Promise.all([
      // Ingresos totales (transacciones de cuentas + cuentas cerradas)
      Promise.all([
        // Transacciones de cuentas (servicios + productos)
        prisma.transaccionCuenta.aggregate({
          where: {
            fechaTransaccion: { gte: startDate, lte: endDate },
            tipo: { in: ['servicio', 'producto'] }
          },
          _sum: { subtotal: true }
        }),
        // Cuentas cerradas
        prisma.cuentaPaciente.aggregate({
          where: {
            estado: 'cerrada',
            fechaCierre: { gte: startDate, lte: endDate }
          },
          _sum: { totalCuenta: true }
        })
      ]),
      // Pacientes atendidos
      prisma.cuentaPaciente.count({
        where: { fechaApertura: { gte: startDate, lte: endDate } }
      }),
      // Estadísticas de habitaciones
      Promise.all([
        prisma.habitacion.count(),
        prisma.habitacion.count({ where: { estado: 'ocupada' } })
      ])
    ]);

    const [transacciones, cuentasCerradas] = ingresosTotales;
    const [totalHabitaciones, habitacionesOcupadas] = habitacionesStats;

    const ingresosTotalesCalc = parseFloat(transacciones._sum.subtotal?.toString() || '0') + parseFloat(cuentasCerradas._sum.totalCuenta?.toString() || '0');
    const ocupacionPromedio = totalHabitaciones > 0 ? (habitacionesOcupadas / totalHabitaciones) * 100 : 0;

    const utilidadNetaCalc = isNaN(ingresosTotalesCalc) ? 0 : ingresosTotalesCalc * 0.25;
    
    const executiveSummary = {
      resumenEjecutivo: {
        ingresosTotales: isNaN(ingresosTotalesCalc) ? 0 : ingresosTotalesCalc,
        utilidadNeta: utilidadNetaCalc,
        pacientesAtendidos,
        ocupacionPromedio: parseFloat(ocupacionPromedio.toFixed(1)),
        satisfaccionGeneral: 4.2
      },
      periodo: {
        fechaInicio: startDate.toISOString(),
        fechaFin: endDate.toISOString(),
        dias: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    };

    res.json({
      success: true,
      data: executiveSummary,
      message: 'Resumen ejecutivo obtenido exitosamente'
    });
    
  } catch (error) {
    logger.logError('GET_EXECUTIVE_SUMMARY', error);
    handlePrismaError(error, res);
  }
});

// GET /managerial/kpis - KPIs gerenciales (Admin, Socio)
router.get('/managerial/kpis', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes', fechaInicio, fechaFin } = req.query;
    
    // Calcular fechas basadas en el período
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

    // Obtener datos de KPIs
    const [financialData, operationalData, inventoryData] = await Promise.all([
      // Datos financieros
      Promise.all([
        // Transacciones de cuentas
        prisma.transaccionCuenta.aggregate({
          where: {
            fechaTransaccion: { gte: startDate, lte: endDate },
            tipo: { in: ['servicio', 'producto'] }
          },
          _sum: { subtotal: true }
        }),
        // Cuentas cerradas
        prisma.cuentaPaciente.aggregate({
          where: {
            estado: 'cerrada',
            fechaCierre: { gte: startDate, lte: endDate }
          },
          _sum: { totalCuenta: true }
        }),
        // Cuentas por cobrar
        prisma.cuentaPaciente.aggregate({
          where: {
            cuentaPorCobrar: true,
            estado: 'abierta'
          },
          _sum: { saldoPendiente: true }
        })
      ]),
      // Datos operacionales
      Promise.all([
        prisma.paciente.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        }),
        prisma.cuentaPaciente.count({
          where: { fechaApertura: { gte: startDate, lte: endDate } }
        }),
        Promise.all([
          prisma.habitacion.count(),
          prisma.habitacion.count({ where: { estado: 'ocupada' } })
        ])
      ]),
      // Datos inventario
      Promise.all([
        // Productos bajo stock mínimo usando un query raw simple
        prisma.$queryRaw`SELECT COUNT(*) as count FROM productos WHERE stock_actual <= stock_minimo AND activo = true`,
        prisma.producto.aggregate({
          _sum: { stockActual: true }
        }),
        prisma.producto.aggregate({
          where: { precioCompra: { not: null } },
          _sum: {
            stockActual: true
          }
        })
      ])
    ]);

    const [facturas, ventas, cuentasPorCobrar] = financialData;
    const [pacientesNuevos, consultasRealizadas, [totalHabitaciones, habitacionesOcupadas]] = operationalData;
    const [productosBajoStockResult, stockTotal, valorInventario] = inventoryData;
    
    // El query raw devuelve un array con un objeto que tiene count como string
    const productosBajoStock = parseInt(productosBajoStockResult[0]?.count || 0);
    
    const ingresosTotales = parseFloat(facturas._sum.total || 0) + parseFloat(ventas._sum.total || 0);
    const ocupacionHabitaciones = totalHabitaciones > 0 ? (habitacionesOcupadas / totalHabitaciones) * 100 : 0;
    
    const periodoTexto = periodo === 'mes' ? 'Último mes' : periodo === 'trimestre' ? 'Último trimestre' : 'Último año';
    
    // Formatear como array de KPIs para el frontend
    const kpisArray = [
      // KPIs Financieros
      {
        nombre: 'Ingresos Totales',
        valor: ingresosTotales,
        unidad: '$',
        meta: ingresosTotales * 1.1,
        tendencia: 'up',
        cambio: 12.5,
        periodo: periodoTexto,
        categoria: 'financiero'
      },
      {
        nombre: 'Utilidad Neta',
        valor: ingresosTotales * 0.25,
        unidad: '$',
        meta: ingresosTotales * 0.3,
        tendencia: 'up',
        cambio: 8.3,
        periodo: periodoTexto,
        categoria: 'financiero'
      },
      {
        nombre: 'Cuentas por Cobrar',
        valor: parseFloat(cuentasPorCobrar._sum.total || 0),
        unidad: '$',
        tendencia: 'down',
        cambio: -5.2,
        periodo: periodoTexto,
        categoria: 'financiero'
      },
      // KPIs Operacionales
      {
        nombre: 'Pacientes Nuevos',
        valor: pacientesNuevos,
        unidad: '',
        meta: pacientesNuevos * 1.05,
        tendencia: 'up',
        cambio: 15.7,
        periodo: periodoTexto,
        categoria: 'operativo'
      },
      {
        nombre: 'Ocupación Habitaciones',
        valor: parseFloat(ocupacionHabitaciones.toFixed(1)),
        unidad: '%',
        meta: 85,
        tendencia: 'stable',
        cambio: 2.1,
        periodo: periodoTexto,
        categoria: 'operativo'
      },
      {
        nombre: 'Consultas Realizadas',
        valor: consultasRealizadas,
        unidad: '',
        meta: consultasRealizadas * 1.1,
        tendencia: 'up',
        cambio: 9.4,
        periodo: periodoTexto,
        categoria: 'operativo'
      },
      // KPIs Inventario
      {
        nombre: 'Productos Bajo Stock',
        valor: productosBajoStock,
        unidad: '',
        tendencia: 'down',
        cambio: -23.1,
        periodo: periodoTexto,
        categoria: 'eficiencia'
      },
      {
        nombre: 'Stock Total',
        valor: stockTotal._sum.stockActual || 0,
        unidad: 'unidades',
        tendencia: 'up',
        cambio: 7.8,
        periodo: periodoTexto,
        categoria: 'eficiencia'
      }
    ];

    res.json({
      success: true,
      data: {
        items: kpisArray
      },
      message: 'KPIs obtenidos exitosamente'
    });
    
  } catch (error) {
    logger.logError('GET_KPIS', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// REPORTES DE MÉDICOS - NUEVO (Junta Directiva)
// ==============================================

// GET /doctors/rankings - Ranking de médicos por hospitalizaciones e ingresos (Admin, Socio)
router.get('/doctors/rankings', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes', fechaInicio, fechaFin, ordenarPor = 'ingresos', limite = 10 } = req.query;

    // Calcular fechas basadas en el período
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

    // Obtener médicos con sus hospitalizaciones y cuentas
    const medicos = await prisma.empleado.findMany({
      where: {
        tipoEmpleado: { in: ['medico_residente', 'medico_especialista'] },
        activo: true
      },
      include: {
        hospitalizaciones: {
          where: {
            fechaIngreso: { gte: startDate, lte: endDate }
          },
          include: {
            cuentaPaciente: {
              include: {
                transacciones: {
                  where: {
                    tipo: { in: ['servicio', 'producto'] }
                  }
                }
              }
            }
          }
        },
        cuentasTratante: {
          where: {
            fechaApertura: { gte: startDate, lte: endDate }
          },
          include: {
            transacciones: {
              where: {
                tipo: { in: ['servicio', 'producto'] }
              }
            }
          }
        }
      }
    });

    // Calcular métricas por médico
    let medicosConMetricas = medicos.map(medico => {
      // Hospitalizaciones
      const hospitalizaciones = medico.hospitalizaciones.length;

      // Ingresos de hospitalizaciones
      let ingresosHospitalizaciones = 0;
      let ingresosProductosHosp = 0;
      let ingresosServiciosHosp = 0;

      medico.hospitalizaciones.forEach(hosp => {
        hosp.cuentaPaciente.transacciones.forEach(trans => {
          const subtotal = parseFloat(trans.subtotal || 0);
          if (trans.tipo === 'producto') {
            ingresosProductosHosp += subtotal;
          } else if (trans.tipo === 'servicio') {
            ingresosServiciosHosp += subtotal;
          }
        });
      });
      ingresosHospitalizaciones = ingresosProductosHosp + ingresosServiciosHosp;

      // Ingresos de cuentas como médico tratante (consultas)
      let ingresosCuentas = 0;
      let ingresosProductosCuentas = 0;
      let ingresosServiciosCuentas = 0;

      medico.cuentasTratante.forEach(cuenta => {
        cuenta.transacciones.forEach(trans => {
          const subtotal = parseFloat(trans.subtotal || 0);
          if (trans.tipo === 'producto') {
            ingresosProductosCuentas += subtotal;
          } else if (trans.tipo === 'servicio') {
            ingresosServiciosCuentas += subtotal;
          }
        });
      });
      ingresosCuentas = ingresosProductosCuentas + ingresosServiciosCuentas;

      // Totales
      const ingresosTotales = ingresosHospitalizaciones + ingresosCuentas;
      const ingresosProductos = ingresosProductosHosp + ingresosProductosCuentas;
      const ingresosServicios = ingresosServiciosHosp + ingresosServiciosCuentas;

      // Pacientes únicos atendidos
      const pacientesUnicos = new Set([
        ...medico.hospitalizaciones.map(h => h.cuentaPaciente.pacienteId),
        ...medico.cuentasTratante.map(c => c.pacienteId)
      ]).size;

      return {
        id: medico.id,
        nombre: `${medico.nombre} ${medico.apellidoPaterno} ${medico.apellidoMaterno || ''}`.trim(),
        especialidad: medico.especialidad || medico.tipoEmpleado,
        cedulaProfesional: medico.cedulaProfesional,
        hospitalizaciones,
        ingresos: {
          total: ingresosTotales,
          productos: ingresosProductos,
          servicios: ingresosServicios,
          porHospitalizaciones: ingresosHospitalizaciones,
          porConsultas: ingresosCuentas
        },
        pacientes: pacientesUnicos,
        cuentasAtendidas: medico.cuentasTratante.length
      };
    });

    // Ordenar según el criterio solicitado
    if (ordenarPor === 'hospitalizaciones') {
      medicosConMetricas.sort((a, b) => b.hospitalizaciones - a.hospitalizaciones);
    } else if (ordenarPor === 'ingresos') {
      medicosConMetricas.sort((a, b) => b.ingresos.total - a.ingresos.total);
    } else if (ordenarPor === 'pacientes') {
      medicosConMetricas.sort((a, b) => b.pacientes - a.pacientes);
    }

    // Limitar resultados
    const limitNum = parseInt(limite) || 10;
    medicosConMetricas = medicosConMetricas.slice(0, limitNum);

    // Calcular totales generales
    const totales = {
      hospitalizaciones: medicosConMetricas.reduce((sum, m) => sum + m.hospitalizaciones, 0),
      ingresos: medicosConMetricas.reduce((sum, m) => sum + m.ingresos.total, 0),
      productos: medicosConMetricas.reduce((sum, m) => sum + m.ingresos.productos, 0),
      servicios: medicosConMetricas.reduce((sum, m) => sum + m.ingresos.servicios, 0),
      pacientes: medicosConMetricas.reduce((sum, m) => sum + m.pacientes, 0)
    };

    res.json({
      success: true,
      data: {
        medicos: medicosConMetricas,
        totales,
        periodo: {
          fechaInicio: startDate.toISOString(),
          fechaFin: endDate.toISOString(),
          tipo: periodo
        }
      },
      message: 'Ranking de médicos generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_DOCTORS_RANKINGS', error);
    handlePrismaError(error, res);
  }
});

// GET /doctors/:id/detail - Detalle de ingresos de un médico específico (Admin, Socio)
router.get('/doctors/:id/detail', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'mes', fechaInicio, fechaFin } = req.query;

    // Calcular fechas basadas en el período
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

    // Obtener médico con todas sus transacciones
    const medico = await prisma.empleado.findUnique({
      where: { id: parseInt(id) },
      include: {
        hospitalizaciones: {
          where: {
            fechaIngreso: { gte: startDate, lte: endDate }
          },
          include: {
            cuentaPaciente: {
              include: {
                paciente: {
                  select: { id: true, nombre: true, apellidoPaterno: true }
                },
                transacciones: {
                  where: { tipo: { in: ['servicio', 'producto'] } },
                  include: {
                    servicio: { select: { id: true, nombre: true, codigo: true } },
                    producto: { select: { id: true, nombre: true, codigo: true, precioCompra: true } }
                  }
                }
              }
            },
            habitacion: { select: { numero: true, tipo: true } }
          }
        },
        cuentasTratante: {
          where: {
            fechaApertura: { gte: startDate, lte: endDate }
          },
          include: {
            paciente: {
              select: { id: true, nombre: true, apellidoPaterno: true }
            },
            transacciones: {
              where: { tipo: { in: ['servicio', 'producto'] } },
              include: {
                servicio: { select: { id: true, nombre: true, codigo: true } },
                producto: { select: { id: true, nombre: true, codigo: true, precioCompra: true } }
              }
            }
          }
        }
      }
    });

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // Desglosar transacciones por tipo
    const detalleProductos = [];
    const detalleServicios = [];

    // Procesar hospitalizaciones
    medico.hospitalizaciones.forEach(hosp => {
      hosp.cuentaPaciente.transacciones.forEach(trans => {
        const item = {
          fecha: trans.fechaTransaccion,
          paciente: `${hosp.cuentaPaciente.paciente.nombre} ${hosp.cuentaPaciente.paciente.apellidoPaterno}`,
          concepto: trans.concepto,
          cantidad: trans.cantidad,
          precioUnitario: parseFloat(trans.precioUnitario),
          subtotal: parseFloat(trans.subtotal),
          tipoAtencion: 'hospitalizacion',
          habitacion: hosp.habitacion?.numero
        };

        if (trans.tipo === 'producto' && trans.producto) {
          item.codigo = trans.producto.codigo;
          item.costo = trans.producto.precioCompra ? parseFloat(trans.producto.precioCompra) * trans.cantidad : null;
          item.margen = item.costo ? ((item.subtotal - item.costo) / item.subtotal * 100).toFixed(2) : null;
          detalleProductos.push(item);
        } else if (trans.tipo === 'servicio' && trans.servicio) {
          item.codigo = trans.servicio.codigo;
          detalleServicios.push(item);
        }
      });
    });

    // Procesar consultas/cuentas
    medico.cuentasTratante.forEach(cuenta => {
      cuenta.transacciones.forEach(trans => {
        const item = {
          fecha: trans.fechaTransaccion,
          paciente: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno}`,
          concepto: trans.concepto,
          cantidad: trans.cantidad,
          precioUnitario: parseFloat(trans.precioUnitario),
          subtotal: parseFloat(trans.subtotal),
          tipoAtencion: cuenta.tipoAtencion
        };

        if (trans.tipo === 'producto' && trans.producto) {
          item.codigo = trans.producto.codigo;
          item.costo = trans.producto.precioCompra ? parseFloat(trans.producto.precioCompra) * trans.cantidad : null;
          item.margen = item.costo ? ((item.subtotal - item.costo) / item.subtotal * 100).toFixed(2) : null;
          detalleProductos.push(item);
        } else if (trans.tipo === 'servicio' && trans.servicio) {
          item.codigo = trans.servicio.codigo;
          detalleServicios.push(item);
        }
      });
    });

    // Calcular resumen
    const totalProductos = detalleProductos.reduce((sum, p) => sum + p.subtotal, 0);
    const totalServicios = detalleServicios.reduce((sum, s) => sum + s.subtotal, 0);
    const costoProductos = detalleProductos.reduce((sum, p) => sum + (p.costo || 0), 0);

    res.json({
      success: true,
      data: {
        medico: {
          id: medico.id,
          nombre: `${medico.nombre} ${medico.apellidoPaterno} ${medico.apellidoMaterno || ''}`.trim(),
          especialidad: medico.especialidad,
          cedulaProfesional: medico.cedulaProfesional
        },
        resumen: {
          totalIngresos: totalProductos + totalServicios,
          totalProductos,
          totalServicios,
          costoProductos,
          utilidadProductos: totalProductos - costoProductos,
          margenProductos: totalProductos > 0 ? ((totalProductos - costoProductos) / totalProductos * 100).toFixed(2) : 0,
          hospitalizaciones: medico.hospitalizaciones.length,
          consultas: medico.cuentasTratante.length
        },
        detalleProductos,
        detalleServicios,
        periodo: {
          fechaInicio: startDate.toISOString(),
          fechaFin: endDate.toISOString()
        }
      },
      message: 'Detalle de médico generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_DOCTOR_DETAIL', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// REPORTES DE UTILIDADES - NUEVO (Junta Directiva)
// ==============================================

// GET /profit/detailed - Reporte detallado de utilidades netas (Admin, Socio)
router.get('/profit/detailed', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes', fechaInicio, fechaFin, desglose = 'todo' } = req.query;

    // Calcular fechas basadas en el período
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

    // Obtener configuración de porcentaje estimado para servicios
    const configPorcentaje = await prisma.configuracionReportes.findUnique({
      where: { clave: 'porcentaje_costo_servicio' }
    });
    const porcentajeCostoServicio = configPorcentaje ? parseFloat(configPorcentaje.valor) : 60;

    const data = {};

    // ========== PRODUCTOS ==========
    if (desglose === 'productos' || desglose === 'todo') {
      // Transacciones de productos con costo
      const transaccionesProductos = await prisma.transaccionCuenta.findMany({
        where: {
          tipo: 'producto',
          fechaTransaccion: { gte: startDate, lte: endDate }
        },
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              precioCompra: true,
              precioVenta: true,
              categoria: true
            }
          }
        }
      });

      // Agrupar por producto
      const productosPorId = {};
      transaccionesProductos.forEach(trans => {
        if (!trans.producto) return;
        const prodId = trans.producto.id;
        if (!productosPorId[prodId]) {
          productosPorId[prodId] = {
            id: prodId,
            codigo: trans.producto.codigo,
            nombre: trans.producto.nombre,
            categoria: trans.producto.categoria,
            precioCompra: trans.producto.precioCompra ? parseFloat(trans.producto.precioCompra) : null,
            precioVenta: parseFloat(trans.producto.precioVenta),
            vendidos: 0,
            ingreso: 0,
            costo: 0
          };
        }
        productosPorId[prodId].vendidos += trans.cantidad;
        productosPorId[prodId].ingreso += parseFloat(trans.subtotal);
        if (trans.producto.precioCompra) {
          productosPorId[prodId].costo += parseFloat(trans.producto.precioCompra) * trans.cantidad;
        }
      });

      const itemsProductos = Object.values(productosPorId).map(p => ({
        ...p,
        utilidad: p.ingreso - p.costo,
        margen: p.ingreso > 0 ? ((p.ingreso - p.costo) / p.ingreso * 100).toFixed(2) : 0
      })).sort((a, b) => b.ingreso - a.ingreso);

      const totalIngresosProductos = itemsProductos.reduce((sum, p) => sum + p.ingreso, 0);
      const totalCostoProductos = itemsProductos.reduce((sum, p) => sum + p.costo, 0);

      data.productos = {
        ingresos: totalIngresosProductos,
        costo: totalCostoProductos,
        utilidad: totalIngresosProductos - totalCostoProductos,
        margen: totalIngresosProductos > 0
          ? ((totalIngresosProductos - totalCostoProductos) / totalIngresosProductos * 100).toFixed(2)
          : 0,
        items: itemsProductos.slice(0, 20) // Top 20
      };
    }

    // ========== SERVICIOS ==========
    if (desglose === 'servicios' || desglose === 'todo') {
      // Transacciones de servicios
      const transaccionesServicios = await prisma.transaccionCuenta.findMany({
        where: {
          tipo: 'servicio',
          fechaTransaccion: { gte: startDate, lte: endDate }
        },
        include: {
          servicio: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              tipo: true,
              precio: true,
              costo: true
            }
          }
        }
      });

      // Agrupar por servicio
      const serviciosPorId = {};
      transaccionesServicios.forEach(trans => {
        if (!trans.servicio) return;
        const servId = trans.servicio.id;
        if (!serviciosPorId[servId]) {
          serviciosPorId[servId] = {
            id: servId,
            codigo: trans.servicio.codigo,
            nombre: trans.servicio.nombre,
            tipo: trans.servicio.tipo,
            precioBase: parseFloat(trans.servicio.precio),
            costoReal: trans.servicio.costo ? parseFloat(trans.servicio.costo) : null,
            vendidos: 0,
            ingreso: 0,
            costoRealTotal: 0,
            costoEstimadoTotal: 0
          };
        }
        serviciosPorId[servId].vendidos += trans.cantidad;
        serviciosPorId[servId].ingreso += parseFloat(trans.subtotal);
        if (trans.servicio.costo) {
          serviciosPorId[servId].costoRealTotal += parseFloat(trans.servicio.costo) * trans.cantidad;
        }
        // Siempre calcular estimado como fallback
        serviciosPorId[servId].costoEstimadoTotal += parseFloat(trans.subtotal) * (porcentajeCostoServicio / 100);
      });

      const itemsServicios = Object.values(serviciosPorId).map(s => {
        // Usar costo real si está disponible, si no, estimado
        const costoFinal = s.costoRealTotal > 0 ? s.costoRealTotal : s.costoEstimadoTotal;
        const usaCostoReal = s.costoRealTotal > 0;
        return {
          ...s,
          costo: costoFinal,
          usaCostoReal,
          utilidad: s.ingreso - costoFinal,
          margen: s.ingreso > 0 ? ((s.ingreso - costoFinal) / s.ingreso * 100).toFixed(2) : 0
        };
      }).sort((a, b) => b.ingreso - a.ingreso);

      const totalIngresosServicios = itemsServicios.reduce((sum, s) => sum + s.ingreso, 0);
      const totalCostoServicios = itemsServicios.reduce((sum, s) => sum + s.costo, 0);
      const serviciosConCostoReal = itemsServicios.filter(s => s.usaCostoReal).length;

      data.servicios = {
        ingresos: totalIngresosServicios,
        costoEstimado: totalIngresosServicios * (porcentajeCostoServicio / 100),
        costoCalculado: totalCostoServicios,
        porcentajeEstimado: porcentajeCostoServicio,
        serviciosConCostoReal,
        serviciosTotales: itemsServicios.length,
        utilidad: totalIngresosServicios - totalCostoServicios,
        margen: totalIngresosServicios > 0
          ? ((totalIngresosServicios - totalCostoServicios) / totalIngresosServicios * 100).toFixed(2)
          : 0,
        items: itemsServicios.slice(0, 20)
      };
    }

    // ========== COSTOS OPERATIVOS ==========
    const costosOperativos = await prisma.costoOperativo.findMany({
      where: {
        activo: true,
        periodo: { gte: startDate, lte: endDate }
      },
      orderBy: { categoria: 'asc' }
    });

    // Agrupar por categoría
    const costosPorCategoria = {};
    costosOperativos.forEach(costo => {
      if (!costosPorCategoria[costo.categoria]) {
        costosPorCategoria[costo.categoria] = {
          categoria: costo.categoria,
          total: 0,
          items: []
        };
      }
      costosPorCategoria[costo.categoria].total += parseFloat(costo.monto);
      costosPorCategoria[costo.categoria].items.push({
        id: costo.id,
        concepto: costo.concepto,
        monto: parseFloat(costo.monto),
        periodo: costo.periodo,
        recurrente: costo.recurrente
      });
    });

    const totalCostosOperativos = Object.values(costosPorCategoria).reduce((sum, cat) => sum + cat.total, 0);

    // Calcular nómina desde empleados (si no hay datos en CostoOperativo)
    let nominaEmpleados = 0;
    if (!costosPorCategoria['nomina'] || costosPorCategoria['nomina'].total === 0) {
      const empleadosActivos = await prisma.empleado.findMany({
        where: { activo: true },
        select: { salario: true, nombre: true, tipoEmpleado: true }
      });
      nominaEmpleados = empleadosActivos.reduce((sum, emp) => sum + parseFloat(emp.salario || 0), 0);

      // Agregar a costos operativos
      if (!costosPorCategoria['nomina']) {
        costosPorCategoria['nomina'] = { categoria: 'nomina', total: 0, items: [] };
      }
      costosPorCategoria['nomina'].total = nominaEmpleados;
      costosPorCategoria['nomina'].calculadoDesdeEmpleados = true;
    }

    data.operativos = {
      porCategoria: Object.values(costosPorCategoria),
      total: totalCostosOperativos + nominaEmpleados,
      nominaCalculada: nominaEmpleados > 0 ? nominaEmpleados : null
    };

    // ========== RESUMEN GENERAL ==========
    const ingresosTotales = (data.productos?.ingresos || 0) + (data.servicios?.ingresos || 0);
    const costoProductos = data.productos?.costo || 0;
    const costoServicios = data.servicios?.costoCalculado || 0;
    const costosOps = data.operativos?.total || 0;

    const costosTotales = costoProductos + costoServicios;
    const utilidadBruta = ingresosTotales - costosTotales;
    const utilidadNeta = utilidadBruta - costosOps;

    data.resumen = {
      ingresosTotales,
      costoProductos,
      costoServicios,
      costosTotalesDirectos: costosTotales,
      utilidadBruta,
      margenBruto: ingresosTotales > 0 ? (utilidadBruta / ingresosTotales * 100).toFixed(2) : 0,
      costosOperativos: costosOps,
      utilidadNeta,
      margenNeto: ingresosTotales > 0 ? (utilidadNeta / ingresosTotales * 100).toFixed(2) : 0
    };

    data.periodo = {
      fechaInicio: startDate.toISOString(),
      fechaFin: endDate.toISOString(),
      tipo: periodo
    };

    data.configuracion = {
      porcentajeCostoServicioEstimado: porcentajeCostoServicio
    };

    res.json({
      success: true,
      data,
      message: 'Reporte de utilidades generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_PROFIT_DETAILED', error);
    handlePrismaError(error, res);
  }
});

// GET /profit/summary - Resumen rápido de utilidades (Admin, Socio)
router.get('/profit/summary', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

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

    // Obtener configuración
    const configPorcentaje = await prisma.configuracionReportes.findUnique({
      where: { clave: 'porcentaje_costo_servicio' }
    });
    const porcentajeCostoServicio = configPorcentaje ? parseFloat(configPorcentaje.valor) : 60;

    // Calcular ingresos y costos de forma agregada
    const [transaccionesProductos, transaccionesServicios, costosOps, nomina] = await Promise.all([
      // Productos
      prisma.$queryRaw`
        SELECT
          SUM(tc.subtotal) as ingresos,
          SUM(p.precio_compra * tc.cantidad) as costo
        FROM transacciones_cuenta tc
        LEFT JOIN productos p ON tc.producto_id = p.id
        WHERE tc.tipo = 'producto'
          AND tc.fecha_transaccion >= ${startDate}
          AND tc.fecha_transaccion <= ${endDate}
      `,
      // Servicios
      prisma.$queryRaw`
        SELECT
          SUM(tc.subtotal) as ingresos,
          SUM(COALESCE(s.costo, tc.subtotal * ${porcentajeCostoServicio / 100}) * tc.cantidad) as costo
        FROM transacciones_cuenta tc
        LEFT JOIN servicios s ON tc.servicio_id = s.id
        WHERE tc.tipo = 'servicio'
          AND tc.fecha_transaccion >= ${startDate}
          AND tc.fecha_transaccion <= ${endDate}
      `,
      // Costos operativos
      prisma.costoOperativo.aggregate({
        where: {
          activo: true,
          periodo: { gte: startDate, lte: endDate }
        },
        _sum: { monto: true }
      }),
      // Nómina
      prisma.empleado.aggregate({
        where: { activo: true },
        _sum: { salario: true }
      })
    ]);

    const ingresosProductos = parseFloat(transaccionesProductos[0]?.ingresos || 0);
    const costoProductos = parseFloat(transaccionesProductos[0]?.costo || 0);
    const ingresosServicios = parseFloat(transaccionesServicios[0]?.ingresos || 0);
    const costoServicios = parseFloat(transaccionesServicios[0]?.costo || 0);
    const costosOperativos = parseFloat(costosOps._sum.monto || 0);
    const nominaMensual = parseFloat(nomina._sum.salario || 0);

    const ingresosTotales = ingresosProductos + ingresosServicios;
    const costosTotalesDirectos = costoProductos + costoServicios;
    const utilidadBruta = ingresosTotales - costosTotalesDirectos;
    const totalCostosOperativos = costosOperativos + nominaMensual;
    const utilidadNeta = utilidadBruta - totalCostosOperativos;

    res.json({
      success: true,
      data: {
        ingresos: {
          productos: ingresosProductos,
          servicios: ingresosServicios,
          total: ingresosTotales
        },
        costos: {
          productos: costoProductos,
          servicios: costoServicios,
          operativos: costosOperativos,
          nomina: nominaMensual,
          total: costosTotalesDirectos + totalCostosOperativos
        },
        utilidad: {
          bruta: utilidadBruta,
          margenBruto: ingresosTotales > 0 ? (utilidadBruta / ingresosTotales * 100).toFixed(2) : 0,
          neta: utilidadNeta,
          margenNeto: ingresosTotales > 0 ? (utilidadNeta / ingresosTotales * 100).toFixed(2) : 0
        },
        periodo
      },
      message: 'Resumen de utilidades generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_PROFIT_SUMMARY', error);
    handlePrismaError(error, res);
  }
});

// GET /inventory - Reporte de inventario (Admin, Socio, Médico Especialista, Almacenista)
router.get('/inventory', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista', 'almacenista']), validateDateRange, async (req, res) => {
  try {
    const { bajoStock } = req.query;
    const where = { activo: true };

    // Filtro de bajo stock
    if (bajoStock === 'true') {
      where.stockActual = { lte: prisma.producto.fields.stockMinimo };
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        proveedor: {
          select: {
            id: true,
            nombreEmpresa: true
          }
        }
      },
      orderBy: { stockActual: 'asc' }
    });

    const productosBajoStock = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM productos
      WHERE stock_actual <= stock_minimo AND activo = true
    `;

    res.json({
      success: true,
      data: {
        productos: productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          categoria: p.categoria,
          stockActual: p.stockActual,
          stockMinimo: p.stockMinimo,
          stockMaximo: p.stockMaximo,
          precioVenta: parseFloat(p.precioVenta),
          proveedor: p.proveedor
        })),
        resumen: {
          totalProductos: productos.length,
          productosBajoStock: parseInt(productosBajoStock[0]?.count || 0)
        }
      },
      message: 'Reporte de inventario generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_INVENTORY_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /patients - Reporte de pacientes (Admin, Socio, Médico Especialista)
router.get('/patients', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista']), validateDateRange, async (req, res) => {
  try {
    const { groupBy } = req.query;
    const { dateRange } = req;
    const whereDate = dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {};

    // Query raw sin fecha o con fecha
    let pacientesPorEdadQuery;
    if (dateRange) {
      pacientesPorEdadQuery = prisma.$queryRaw`
        SELECT
          CASE
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 18 THEN 'Menores de 18'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 18 AND 30 THEN '18-30'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 31 AND 50 THEN '31-50'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 51 AND 70 THEN '51-70'
            ELSE 'Mayores de 70'
          END as rango_edad,
          COUNT(*) as cantidad
        FROM pacientes
        WHERE created_at >= ${dateRange.start} AND created_at <= ${dateRange.end}
        GROUP BY rango_edad
        ORDER BY rango_edad
      `;
    } else {
      pacientesPorEdadQuery = prisma.$queryRaw`
        SELECT
          CASE
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 18 THEN 'Menores de 18'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 18 AND 30 THEN '18-30'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 31 AND 50 THEN '31-50'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 51 AND 70 THEN '51-70'
            ELSE 'Mayores de 70'
          END as rango_edad,
          COUNT(*) as cantidad
        FROM pacientes
        GROUP BY rango_edad
        ORDER BY rango_edad
      `;
    }

    const [totalPacientes, distribucionGenero, pacientesPorEdad] = await Promise.all([
      // Total de pacientes
      prisma.paciente.count({ where: whereDate }),

      // Distribución por género
      prisma.paciente.groupBy({
        by: ['genero'],
        _count: { genero: true },
        where: whereDate
      }),

      // Pacientes por rango de edad
      pacientesPorEdadQuery
    ]);

    const data = {
      resumen: {
        totalPacientes
      }
    };

    // Agrupar por género si se solicita
    if (groupBy === 'genero' || !groupBy) {
      data.distribucionGenero = distribucionGenero.reduce((acc, item) => {
        acc[item.genero] = item._count.genero;
        return acc;
      }, {});
    }

    // Agrupar por edad si se solicita
    if (groupBy === 'edad' || !groupBy) {
      data.rangoEdades = pacientesPorEdad.reduce((acc, item) => {
        acc[item.rango_edad] = Number(item.cantidad);
        return acc;
      }, {});
    }

    res.json({
      success: true,
      data,
      message: 'Reporte de pacientes generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_PATIENTS_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /hospitalization - Reporte de hospitalización (Admin, Socio, Médico Especialista)
router.get('/hospitalization', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista']), validateDateRange, async (req, res) => {
  try {
    const { estado, metrics } = req.query;
    const { dateRange } = req;
    const where = {};

    // Validar estado válido
    const estadosValidos = ['en_observacion', 'estable', 'critico', 'alta_medica', 'alta_voluntaria'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    // Filtrar por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtrar por rango de fechas
    if (dateRange?.start || dateRange?.end) {
      where.fechaIngreso = {};
      if (dateRange.start) where.fechaIngreso.gte = dateRange.start;
      if (dateRange.end) where.fechaIngreso.lte = dateRange.end;
    }

    const [hospitalizaciones, totalHospitalizaciones, hospitalizacionesActivas] = await Promise.all([
      prisma.hospitalizacion.findMany({
        where,
        include: {
          cuentaPaciente: {
            select: {
              id: true,
              paciente: {
                select: {
                  id: true,
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true
                }
              }
            }
          },
          habitacion: {
            select: {
              id: true,
              numero: true,
              tipo: true
            }
          }
        },
        orderBy: { fechaIngreso: 'desc' }
      }),
      prisma.hospitalizacion.count({ where }),
      prisma.hospitalizacion.count({ where: { estado: 'en_observacion' } })
    ]);

    const data = {
      resumen: {
        totalHospitalizaciones,
        hospitalizacionesActivas
      },
      hospitalizaciones: hospitalizaciones.map(h => ({
        id: h.id,
        paciente: h.cuentaPaciente.paciente,
        habitacion: h.habitacion,
        fechaIngreso: h.fechaIngreso,
        fechaAlta: h.fechaAlta,
        diagnostico: h.diagnosticoIngreso,
        estado: h.estado,
        diasEstancia: h.fechaAlta
          ? Math.ceil((new Date(h.fechaAlta) - new Date(h.fechaIngreso)) / (1000 * 60 * 60 * 24))
          : Math.ceil((new Date() - new Date(h.fechaIngreso)) / (1000 * 60 * 60 * 24))
      }))
    };

    // Calcular estancia promedio si se solicita
    if (metrics === 'true') {
      const hospitalizacionesConAlta = hospitalizaciones.filter(h => h.fechaAlta);
      if (hospitalizacionesConAlta.length > 0) {
        const sumaDias = hospitalizacionesConAlta.reduce((sum, h) => {
          const dias = Math.ceil((new Date(h.fechaAlta) - new Date(h.fechaIngreso)) / (1000 * 60 * 60 * 24));
          return sum + dias;
        }, 0);
        data.estanciaPromedio = Math.round(sumaDias / hospitalizacionesConAlta.length);
      } else {
        data.estanciaPromedio = 0;
      }
    }

    res.json({
      success: true,
      data,
      message: 'Reporte de hospitalización generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_HOSPITALIZATION_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /revenue - Reporte de ingresos (Admin, Socio)
router.get('/revenue', authenticateToken, authorizeRoles(['administrador', 'socio']), validateDateRange, async (req, res) => {
  try {
    const { periodo, groupBy } = req.query;
    const { dateRange } = req;

    // Calcular fechas según período
    let startDate, endDate;
    if (periodo === 'mensual') {
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (periodo === 'trimestral') {
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (periodo === 'anual') {
      endDate = new Date();
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (dateRange) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    }

    const whereDate = startDate && endDate ? {
      createdAt: { gte: startDate, lte: endDate }
    } : {};

    // Ingresos por transacciones de cuentas + cuentas cerradas
    const [transaccionesCuentas, cuentasCerradas, facturas, servicios] = await Promise.all([
      // Transacciones de cuentas (productos + servicios)
      prisma.transaccionCuenta.aggregate({
        where: {
          tipo: { in: ['servicio', 'producto'] },
          ...(whereDate.createdAt ? { fechaTransaccion: whereDate.createdAt } : {})
        },
        _sum: { subtotal: true },
        _count: { id: true }
      }),
      // Cuentas cerradas (pagadas)
      prisma.cuentaPaciente.aggregate({
        where: {
          estado: 'cerrada',
          ...(whereDate.createdAt ? { fechaCierre: whereDate.createdAt } : {})
        },
        _sum: { totalCuenta: true },
        _count: { id: true }
      }),
      prisma.factura.aggregate({
        where: whereDate.createdAt ? { fechaFactura: whereDate.createdAt } : {},
        _sum: { total: true },
        _count: { id: true }
      }),
      // Transacciones de servicios por concepto
      prisma.transaccionCuenta.groupBy({
        by: ['concepto'],
        where: {
          tipo: 'servicio',
          ...(whereDate.createdAt ? { fechaTransaccion: whereDate.createdAt } : {})
        },
        _sum: { subtotal: true },
        _count: { concepto: true }
      })
    ]);

    const ingresosCuentas = parseFloat(transaccionesCuentas._sum.subtotal || 0);
    const ingresosCuentasCerradas = parseFloat(cuentasCerradas._sum.totalCuenta || 0);
    const ingresosFacturas = parseFloat(facturas._sum.total || 0);

    const data = {
      resumen: {
        totalIngresos: ingresosCuentas + ingresosFacturas,
        transaccionesCuentas: {
          monto: ingresosCuentas,
          cantidad: transaccionesCuentas._count.id
        },
        cuentasCerradas: {
          monto: ingresosCuentasCerradas,
          cantidad: cuentasCerradas._count.id
        },
        facturas: {
          monto: ingresosFacturas,
          cantidad: facturas._count.id
        }
      }
    };

    // Agrupar por servicio si se solicita
    if (groupBy === 'servicio') {
      data.porServicio = servicios.reduce((acc, item) => {
        acc[item.concepto] = {
          monto: parseFloat(item._sum.subtotal || 0),
          cantidad: item._count.concepto
        };
        return acc;
      }, {});
    }

    res.json({
      success: true,
      data,
      message: 'Reporte de ingresos generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_REVENUE_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /rooms-occupancy - Reporte de ocupación de habitaciones (Admin, Socio, Médico Especialista)
router.get('/rooms-occupancy', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista']), validateDateRange, async (req, res) => {
  try {
    const { groupBy } = req.query;

    const [totalHabitaciones, habitacionesOcupadas, habitacionesPorTipo] = await Promise.all([
      prisma.habitacion.count(),
      prisma.habitacion.count({ where: { estado: 'ocupada' } }),
      prisma.habitacion.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
        where: { estado: 'ocupada' }
      })
    ]);

    const tasaOcupacion = totalHabitaciones > 0
      ? ((habitacionesOcupadas / totalHabitaciones) * 100).toFixed(2)
      : 0;

    const data = {
      tasaOcupacion: parseFloat(tasaOcupacion),
      resumen: {
        totalHabitaciones,
        habitacionesOcupadas,
        habitacionesDisponibles: totalHabitaciones - habitacionesOcupadas
      }
    };

    // Agrupar por tipo si se solicita
    if (groupBy === 'tipo') {
      const habitacionesTotalesPorTipo = await prisma.habitacion.groupBy({
        by: ['tipo'],
        _count: { tipo: true }
      });

      data.porTipo = habitacionesTotalesPorTipo.map(tipoTotal => {
        const ocupadas = habitacionesPorTipo.find(t => t.tipo === tipoTotal.tipo)?._count.tipo || 0;
        const total = tipoTotal._count.tipo;
        return {
          tipo: tipoTotal.tipo,
          total,
          ocupadas,
          disponibles: total - ocupadas,
          tasaOcupacion: total > 0 ? parseFloat(((ocupadas / total) * 100).toFixed(2)) : 0
        };
      });
    }

    res.json({
      success: true,
      data,
      message: 'Reporte de ocupación generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_ROOMS_OCCUPANCY_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /appointments - Reporte de citas médicas (Admin, Socio, Médico Especialista)
router.get('/appointments', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista']), validateDateRange, async (req, res) => {
  try {
    const { estado } = req.query;
    const { dateRange } = req;
    const where = {};

    // Filtrar por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtrar por rango de fechas
    if (dateRange?.start || dateRange?.end) {
      where.fechaCita = {};
      if (dateRange.start) where.fechaCita.gte = dateRange.start;
      if (dateRange.end) where.fechaCita.lte = dateRange.end;
    }

    const [citas, totalCitas, citasPorEstado] = await Promise.all([
      prisma.citaMedica.findMany({
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
          medico: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true
            }
          }
        },
        orderBy: { fechaCita: 'desc' },
        take: 100
      }),
      prisma.citaMedica.count({ where }),
      prisma.citaMedica.groupBy({
        by: ['estado'],
        _count: { estado: true },
        where
      })
    ]);

    const data = {
      resumen: {
        totalCitas,
        distribucionEstado: citasPorEstado.reduce((acc, item) => {
          acc[item.estado] = item._count.estado;
          return acc;
        }, {})
      },
      citas: citas.map(c => ({
        id: c.id,
        fechaCita: c.fechaCita,
        tipoCita: c.tipoCita,
        paciente: c.paciente,
        medico: c.medico,
        motivo: c.motivo,
        estado: c.estado
      }))
    };

    res.json({
      success: true,
      data,
      message: 'Reporte de citas generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_APPOINTMENTS_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /employees - Reporte de empleados (Admin only)
router.get('/employees', authenticateToken, authorizeRoles(['administrador']), validateDateRange, async (req, res) => {
  try {
    const { groupBy } = req.query;

    const [totalEmpleados, empleadosActivos, empleadosPorRol] = await Promise.all([
      prisma.empleado.count(),
      prisma.empleado.count({ where: { activo: true } }),
      prisma.empleado.groupBy({
        by: ['tipoEmpleado'],
        _count: { tipoEmpleado: true }
      })
    ]);

    const data = {
      resumen: {
        totalEmpleados,
        empleadosActivos,
        empleadosInactivos: totalEmpleados - empleadosActivos
      }
    };

    // Agrupar por rol si se solicita
    if (groupBy === 'rol') {
      data.porRol = empleadosPorRol.reduce((acc, item) => {
        acc[item.tipoEmpleado] = item._count.tipoEmpleado;
        return acc;
      }, {});
    }

    res.json({
      success: true,
      data,
      message: 'Reporte de empleados generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_EMPLOYEES_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /services - Reporte de uso de servicios (Admin, Socio, Médico Especialista)
router.get('/services', authenticateToken, authorizeRoles(['administrador', 'socio', 'medico_especialista']), validateDateRange, async (req, res) => {
  try {
    const { orderBy, order } = req.query;
    const { dateRange } = req;

    // Construir filtro de fecha
    const whereDate = {};
    if (dateRange?.start || dateRange?.end) {
      whereDate.createdAt = {};
      if (dateRange.start) whereDate.createdAt.gte = dateRange.start;
      if (dateRange.end) whereDate.createdAt.lte = dateRange.end;
    }

    // Obtener todos los servicios con su uso
    const servicios = await prisma.servicio.findMany({
      include: {
        _count: {
          select: {
            transacciones: true,
            detallesFactura: true
          }
        }
      },
      where: { activo: true }
    });

    // Calcular uso total de cada servicio (transacciones de cuentas + detalles de facturas)
    let serviciosConUso = servicios.map(s => ({
      id: s.id,
      codigo: s.codigo,
      nombre: s.nombre,
      tipo: s.tipo,
      precio: parseFloat(s.precio),
      cantidadUsos: s._count.transacciones + s._count.detallesFactura
    }));

    // Ordenar si se solicita
    if (orderBy === 'cantidad') {
      serviciosConUso.sort((a, b) => {
        const comparison = a.cantidadUsos - b.cantidadUsos;
        return order === 'desc' ? -comparison : comparison;
      });
    }

    const data = {
      resumen: {
        totalServicios: servicios.length,
        serviciosMasSolicitados: serviciosConUso.slice(0, 10)
      },
      servicios: serviciosConUso
    };

    res.json({
      success: true,
      data,
      message: 'Reporte de servicios generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_SERVICES_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /audit - Reporte de auditoría (Admin only)
router.get('/audit', authenticateToken, authorizeRoles(['administrador']), validateDateRange, async (req, res) => {
  try {
    const { entidad, accion } = req.query;
    const { dateRange } = req;
    const where = {};

    // Filtrar por entidad
    if (entidad) {
      where.entidadTipo = entidad;
    }

    // Filtrar por acción
    if (accion) {
      where.tipoOperacion = accion;
    }

    // Filtrar por rango de fechas
    if (dateRange?.start || dateRange?.end) {
      where.createdAt = {};
      if (dateRange.start) where.createdAt.gte = dateRange.start;
      if (dateRange.end) where.createdAt.lte = dateRange.end;
    }

    const [registros, totalRegistros, registrosPorTipo, registrosPorEntidad] = await Promise.all([
      prisma.auditoriaOperacion.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              rol: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.auditoriaOperacion.count({ where }),
      prisma.auditoriaOperacion.groupBy({
        by: ['tipoOperacion'],
        _count: { tipoOperacion: true },
        where
      }),
      prisma.auditoriaOperacion.groupBy({
        by: ['entidadTipo'],
        _count: { entidadTipo: true },
        where
      })
    ]);

    const data = {
      resumen: {
        totalRegistros,
        distribucionPorTipo: registrosPorTipo.reduce((acc, item) => {
          acc[item.tipoOperacion] = item._count.tipoOperacion;
          return acc;
        }, {}),
        distribucionPorEntidad: registrosPorEntidad.reduce((acc, item) => {
          acc[item.entidadTipo] = item._count.entidadTipo;
          return acc;
        }, {})
      },
      registros: registros.map(r => ({
        id: r.id,
        modulo: r.modulo,
        tipoOperacion: r.tipoOperacion,
        entidadTipo: r.entidadTipo,
        entidadId: r.entidadId,
        usuario: r.usuario,
        motivo: r.motivo,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt
      }))
    };

    res.json({
      success: true,
      data,
      message: 'Reporte de auditoría generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_AUDIT_REPORT', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// POST /custom - Generar reporte personalizado (Admin only con rate limiting)
router.post('/custom', authenticateToken, authorizeRoles(['administrador']), customReportLimiter, validateDateRange, async (req, res) => {
  try {
    const { tipo, campos, filtros } = req.body;

    if (!tipo || !campos) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere tipo y campos para el reporte personalizado'
      });
    }

    let data = {};

    // Generar reporte según el tipo
    switch (tipo) {
      case 'facturacion':
        const where = {};
        if (filtros?.estado) {
          // Convertir valores en español a inglés si es necesario
          const estadoMap = {
            'pagada': 'paid',
            'pendiente': 'pending',
            'parcial': 'partial',
            'vencida': 'overdue',
            'cancelada': 'cancelled',
            'borrador': 'draft'
          };
          where.estado = estadoMap[filtros.estado] || filtros.estado;
        }

        const facturas = await prisma.factura.findMany({
          where,
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true
              }
            }
          },
          take: 100
        });

        // Filtrar solo los campos solicitados
        data.registros = facturas.map(f => {
          const registro = {};
          if (campos.includes('paciente')) {
            registro.paciente = f.paciente;
          }
          if (campos.includes('total')) {
            registro.total = parseFloat(f.total);
          }
          if (campos.includes('fecha')) {
            registro.fecha = f.fechaFactura;
          }
          if (campos.includes('estado')) {
            registro.estado = f.estado;
          }
          return registro;
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Tipo de reporte '${tipo}' no soportado`
        });
    }

    data.resumen = {
      totalRegistros: data.registros?.length || 0,
      tipo,
      campos,
      filtros
    };

    res.json({
      success: true,
      data,
      message: 'Reporte personalizado generado correctamente'
    });

  } catch (error) {
    logger.logError('GENERATE_CUSTOM_REPORT', error, { body: req.body });
    handlePrismaError(error, res);
  }
});

// GET /export/:tipo - Exportar reporte en diferentes formatos (Admin, Socio con rate limiting estricto)
router.get('/export/:tipo', authenticateToken, authorizeRoles(['administrador', 'socio']), exportLimiter, validateDateRange, async (req, res) => {
  try {
    const { tipo } = req.params;
    const { format } = req.query;

    if (!format) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el parámetro format (pdf, xlsx, csv)'
      });
    }

    // Obtener datos del reporte según el tipo
    let reportData = {};

    // Por ahora, solo implementamos financial como ejemplo
    if (tipo === 'financial') {
      const [transaccionesCuentas, cuentasCerradas, facturas] = await Promise.all([
        // Transacciones de cuentas (productos + servicios)
        prisma.transaccionCuenta.aggregate({
          where: { tipo: { in: ['servicio', 'producto'] } },
          _sum: { subtotal: true },
          _count: { id: true }
        }),
        // Cuentas cerradas
        prisma.cuentaPaciente.aggregate({
          where: { estado: 'cerrada' },
          _sum: { totalCuenta: true },
          _count: { id: true }
        }),
        prisma.factura.aggregate({
          _sum: { total: true },
          _count: { id: true }
        })
      ]);

      const ingresosTransacciones = parseFloat(transaccionesCuentas._sum.subtotal || 0);
      const ingresosCuentas = parseFloat(cuentasCerradas._sum.totalCuenta || 0);
      const ingresosFacturas = parseFloat(facturas._sum.total || 0);

      reportData = {
        tipo: 'Reporte Financiero',
        ingresos: {
          transaccionesCuentas: ingresosTransacciones,
          cuentasCerradas: ingresosCuentas,
          facturas: ingresosFacturas,
          total: ingresosTransacciones + ingresosFacturas
        }
      };
    }

    // Generar respuesta según formato
    switch (format.toLowerCase()) {
      case 'pdf':
        // Por ahora devolvemos un mock de PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-${tipo}.pdf`);
        res.send(Buffer.from(`PDF Mock - ${JSON.stringify(reportData)}`));
        break;

      case 'xlsx':
        // Por ahora devolvemos un mock de Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-${tipo}.xlsx`);
        res.send(Buffer.from(`XLSX Mock - ${JSON.stringify(reportData)}`));
        break;

      case 'csv':
        // Generar CSV simple
        const csvData = `Tipo,Valor\nTransacciones Cuentas,${reportData.ingresos?.transaccionesCuentas || 0}\nCuentas Cerradas,${reportData.ingresos?.cuentasCerradas || 0}\nFacturas,${reportData.ingresos?.facturas || 0}\nTotal,${reportData.ingresos?.total || 0}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-${tipo}.csv`);
        res.send(csvData);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Formato no soportado. Use: pdf, xlsx, csv'
        });
    }

  } catch (error) {
    logger.logError('EXPORT_REPORT', error, { tipo: req.params.tipo, format: req.query.format });
    handlePrismaError(error, res);
  }
});

// ==============================================
// REPORTES FINANCIEROS AVANZADOS - FASES 1-4
// ==============================================

// GET /caja-diaria - Reporte de caja diaria (Admin, Cajero, Socio)
router.get('/caja-diaria', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, estado, cajeroId } = req.query;

    const where = {};

    if (fechaInicio || fechaFin) {
      where.fechaApertura = {};
      if (fechaInicio) where.fechaApertura.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaApertura.lte = new Date(fechaFin);
    }

    if (estado) {
      where.estado = estado;
    }

    if (cajeroId) {
      where.cajeroId = parseInt(cajeroId);
    }

    const [cajas, resumen] = await Promise.all([
      prisma.cajaDiaria.findMany({
        where,
        include: {
          cajero: {
            select: {
              id: true,
              username: true,
              apellidos: true
            }
          }
        },
        orderBy: { fechaApertura: 'desc' },
        take: 100
      }),
      prisma.cajaDiaria.aggregate({
        where,
        _sum: {
          saldoInicial: true,
          saldoFinalSistema: true,
          saldoFinalContado: true,
          diferencia: true
        },
        _count: { id: true }
      })
    ]);

    // Calcular métricas adicionales
    const cajasConDiferencia = cajas.filter(c => c.diferencia && parseFloat(c.diferencia) !== 0);
    const diferenciaPromedio = cajasConDiferencia.length > 0
      ? cajasConDiferencia.reduce((sum, c) => sum + parseFloat(c.diferencia || 0), 0) / cajasConDiferencia.length
      : 0;

    res.json({
      success: true,
      data: {
        cajas: cajas.map(c => ({
          id: c.id,
          numero: c.numero,
          cajero: c.cajero,
          turno: c.turno,
          fechaApertura: c.fechaApertura,
          fechaCierre: c.fechaCierre,
          estado: c.estado,
          saldoInicial: parseFloat(c.saldoInicial),
          saldoFinalSistema: parseFloat(c.saldoFinalSistema || 0),
          saldoFinalContado: parseFloat(c.saldoFinalContado || 0),
          diferencia: parseFloat(c.diferencia || 0),
          observaciones: c.observaciones,
          justificacionDif: c.justificacionDif
        })),
        resumen: {
          totalCajas: resumen._count.id,
          saldoInicialTotal: parseFloat(resumen._sum.saldoInicial || 0),
          saldoFinalSistemaTotal: parseFloat(resumen._sum.saldoFinalSistema || 0),
          saldoFinalContadoTotal: parseFloat(resumen._sum.saldoFinalContado || 0),
          diferenciaTotal: parseFloat(resumen._sum.diferencia || 0),
          cajasConDiferencia: cajasConDiferencia.length,
          diferenciaPromedio: parseFloat(diferenciaPromedio.toFixed(2))
        }
      },
      message: 'Reporte de caja diaria generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_CAJA_DIARIA_REPORT', error);
    handlePrismaError(error, res);
  }
});

// GET /devoluciones - Reporte de devoluciones (Admin, Cajero, Socio)
router.get('/devoluciones', authenticateToken, authorizeRoles(['administrador', 'cajero', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, estado, tipo } = req.query;

    const where = {};

    if (fechaInicio || fechaFin) {
      where.fechaSolicitud = {};
      if (fechaInicio) where.fechaSolicitud.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaSolicitud.lte = new Date(fechaFin);
    }

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const [devoluciones, resumenEstado, resumenTipo] = await Promise.all([
      prisma.devolucion.findMany({
        where,
        include: {
          cuenta: {
            include: {
              paciente: {
                select: { id: true, nombre: true, apellidoPaterno: true }
              }
            }
          },
          cajeroSolicita: {
            select: { id: true, username: true, apellidos: true }
          },
          autorizador: {
            select: { id: true, username: true, apellidos: true }
          },
          motivo: {
            select: { id: true, codigo: true, descripcion: true }
          }
        },
        orderBy: { fechaSolicitud: 'desc' },
        take: 100
      }),
      prisma.devolucion.groupBy({
        by: ['estado'],
        where,
        _sum: { montoDevolucion: true },
        _count: { id: true }
      }),
      prisma.devolucion.groupBy({
        by: ['tipo'],
        where,
        _sum: { montoDevolucion: true },
        _count: { id: true }
      })
    ]);

    const totalMonto = devoluciones.reduce((sum, d) => sum + parseFloat(d.montoDevolucion), 0);

    res.json({
      success: true,
      data: {
        devoluciones: devoluciones.map(d => ({
          id: d.id,
          numero: d.numero,
          cuenta: d.cuenta ? {
            id: d.cuenta.id,
            paciente: d.cuenta.paciente
          } : null,
          tipo: d.tipo,
          monto: parseFloat(d.montoDevolucion),
          motivo: d.motivo,
          motivoDetalle: d.motivoDetalle,
          estado: d.estado,
          fechaSolicitud: d.fechaSolicitud,
          fechaAutorizacion: d.fechaAutorizacion,
          fechaProceso: d.fechaProceso,
          cajeroSolicita: d.cajeroSolicita,
          autorizador: d.autorizador,
          metodoPago: d.metodoPagoDevolucion,
          observaciones: d.observaciones
        })),
        resumen: {
          totalDevoluciones: devoluciones.length,
          montoTotal: totalMonto,
          porEstado: resumenEstado.reduce((acc, item) => {
            acc[item.estado] = {
              cantidad: item._count.id,
              monto: parseFloat(item._sum.montoDevolucion || 0)
            };
            return acc;
          }, {}),
          porTipo: resumenTipo.reduce((acc, item) => {
            acc[item.tipo] = {
              cantidad: item._count.id,
              monto: parseFloat(item._sum.montoDevolucion || 0)
            };
            return acc;
          }, {})
        }
      },
      message: 'Reporte de devoluciones generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_DEVOLUCIONES_REPORT', error);
    handlePrismaError(error, res);
  }
});

// GET /depositos-bancarios - Reporte de depósitos bancarios (Admin, Socio)
router.get('/depositos-bancarios', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, cuentaBancariaId, estado } = req.query;

    const where = {};

    if (fechaInicio || fechaFin) {
      where.fechaPreparacion = {};
      if (fechaInicio) where.fechaPreparacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaPreparacion.lte = new Date(fechaFin);
    }

    if (cuentaBancariaId) {
      where.cuentaBancariaId = parseInt(cuentaBancariaId);
    }

    if (estado) {
      where.estado = estado;
    }

    const [depositos, resumenCuenta, resumenEstado] = await Promise.all([
      prisma.depositoBancario.findMany({
        where,
        include: {
          cuentaBancaria: {
            select: { id: true, banco: true, numeroCuenta: true, alias: true }
          },
          caja: {
            select: { id: true, numero: true, fechaApertura: true }
          },
          cajero: {
            select: { id: true, username: true, apellidos: true }
          },
          confirmadoPor: {
            select: { id: true, username: true, apellidos: true }
          }
        },
        orderBy: { fechaPreparacion: 'desc' },
        take: 100
      }),
      prisma.depositoBancario.groupBy({
        by: ['cuentaBancariaId'],
        where,
        _sum: { montoTotal: true },
        _count: { id: true }
      }),
      prisma.depositoBancario.groupBy({
        by: ['estado'],
        where,
        _sum: { montoTotal: true },
        _count: { id: true }
      })
    ]);

    const totalMonto = depositos.reduce((sum, d) => sum + parseFloat(d.montoTotal), 0);

    res.json({
      success: true,
      data: {
        depositos: depositos.map(d => ({
          id: d.id,
          numero: d.numero,
          cuentaBancaria: d.cuentaBancaria,
          montoEfectivo: parseFloat(d.montoEfectivo),
          montoCheques: parseFloat(d.montoCheques),
          montoTotal: parseFloat(d.montoTotal),
          fechaPreparacion: d.fechaPreparacion,
          fechaDeposito: d.fechaDeposito,
          referenciaBanco: d.referenciaBanco,
          estado: d.estado,
          caja: d.caja,
          cajero: d.cajero,
          confirmadoPor: d.confirmadoPor,
          fechaConfirmacion: d.fechaConfirmacion,
          comprobante: d.comprobante,
          observaciones: d.observaciones
        })),
        resumen: {
          totalDepositos: depositos.length,
          montoTotal: totalMonto,
          porCuenta: resumenCuenta.map(item => ({
            cuentaBancariaId: item.cuentaBancariaId,
            cantidad: item._count.id,
            monto: parseFloat(item._sum.montoTotal || 0)
          })),
          porEstado: resumenEstado.reduce((acc, item) => {
            acc[item.estado] = {
              cantidad: item._count.id,
              monto: parseFloat(item._sum.montoTotal || 0)
            };
            return acc;
          }, {})
        }
      },
      message: 'Reporte de depósitos bancarios generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_DEPOSITOS_BANCARIOS_REPORT', error);
    handlePrismaError(error, res);
  }
});

// GET /descuentos - Reporte de descuentos aplicados (Admin, Socio)
router.get('/descuentos', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { fechaInicio, fechaFin, estado, politicaId } = req.query;

    const where = {};

    if (fechaInicio || fechaFin) {
      where.fechaAplicacion = {};
      if (fechaInicio) where.fechaAplicacion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaAplicacion.lte = new Date(fechaFin);
    }

    if (estado) {
      where.estado = estado;
    }

    if (politicaId) {
      where.politicaId = parseInt(politicaId);
    }

    const [descuentos, resumenEstado, resumenPolitica] = await Promise.all([
      prisma.descuentoAplicado.findMany({
        where,
        include: {
          cuenta: {
            include: {
              paciente: {
                select: { id: true, nombre: true, apellidoPaterno: true }
              }
            }
          },
          politica: {
            select: { id: true, nombre: true, tipo: true }
          },
          aplicadoPor: {
            select: { id: true, username: true, apellidos: true }
          },
          autorizadoPor: {
            select: { id: true, username: true, apellidos: true }
          }
        },
        orderBy: { fechaAplicacion: 'desc' },
        take: 100
      }),
      prisma.descuentoAplicado.groupBy({
        by: ['estado'],
        where,
        _sum: { montoDescuento: true },
        _count: { id: true }
      }),
      // Agrupar por política usando Prisma
      prisma.descuentoAplicado.groupBy({
        by: ['politicaId'],
        where,
        _sum: { montoDescuento: true },
        _count: { id: true }
      })
    ]);

    const totalDescuento = descuentos.reduce((sum, d) => sum + parseFloat(d.montoDescuento), 0);
    const totalMontoOriginal = descuentos.reduce((sum, d) => sum + parseFloat(d.montoOriginal), 0);
    const totalMontoFinal = descuentos.reduce((sum, d) => sum + parseFloat(d.montoFinal), 0);

    res.json({
      success: true,
      data: {
        descuentos: descuentos.map(d => ({
          id: d.id,
          cuenta: d.cuenta ? {
            id: d.cuenta.id,
            paciente: d.cuenta.paciente
          } : null,
          politica: d.politica,
          tipoCalculo: d.tipoCalculo,
          porcentaje: parseFloat(d.porcentaje || 0),
          montoOriginal: parseFloat(d.montoOriginal),
          montoDescuento: parseFloat(d.montoDescuento),
          montoFinal: parseFloat(d.montoFinal),
          motivo: d.motivo,
          estado: d.estado,
          fechaAplicacion: d.fechaAplicacion,
          fechaAutorizacion: d.fechaAutorizacion,
          aplicadoPor: d.aplicadoPor,
          autorizadoPor: d.autorizadoPor
        })),
        resumen: {
          totalDescuentos: descuentos.length,
          montoDescuentoTotal: totalDescuento,
          montoOriginalTotal: totalMontoOriginal,
          montoFinalTotal: totalMontoFinal,
          porcentajeAhorroPromedio: totalMontoOriginal > 0
            ? ((totalDescuento / totalMontoOriginal) * 100).toFixed(2)
            : 0,
          porEstado: resumenEstado.reduce((acc, item) => {
            acc[item.estado] = {
              cantidad: item._count.id,
              monto: parseFloat(item._sum.montoDescuento || 0)
            };
            return acc;
          }, {}),
          porPolitica: resumenPolitica.map(p => ({
            politicaId: p.politicaId,
            cantidad: p._count.id,
            montoTotal: parseFloat(p._sum.montoDescuento || 0)
          }))
        }
      },
      message: 'Reporte de descuentos generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_DESCUENTOS_REPORT', error);
    handlePrismaError(error, res);
  }
});

// GET /flujo-caja - Reporte consolidado de flujo de caja (Admin, Socio)
router.get('/flujo-caja', authenticateToken, authorizeRoles(['administrador', 'socio']), async (req, res) => {
  try {
    const { periodo = 'mes', fechaInicio, fechaFin } = req.query;

    // Calcular fechas basadas en el período
    let startDate = new Date();
    let endDate = new Date();

    if (periodo === 'dia') {
      startDate.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (periodo === 'mes') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (periodo === 'trimestre') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (periodo === 'año') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (fechaInicio) startDate = new Date(fechaInicio);
    if (fechaFin) endDate = new Date(fechaFin);

    const [
      ingresosCuentas,
      pagosRecibidos,
      devoluciones,
      descuentos,
      depositosBancarios,
      cajasDiarias
    ] = await Promise.all([
      // Ingresos por transacciones
      prisma.transaccionCuenta.aggregate({
        where: {
          tipo: { in: ['servicio', 'producto'] },
          fechaTransaccion: { gte: startDate, lte: endDate }
        },
        _sum: { subtotal: true },
        _count: { id: true }
      }),
      // Pagos recibidos (transacciones tipo pago)
      prisma.transaccionCuenta.aggregate({
        where: {
          tipo: 'pago',
          fechaTransaccion: { gte: startDate, lte: endDate }
        },
        _sum: { subtotal: true },
        _count: { id: true }
      }),
      // Devoluciones autorizadas
      prisma.devolucion.aggregate({
        where: {
          estado: 'autorizada',
          fechaSolicitud: { gte: startDate, lte: endDate }
        },
        _sum: { montoDevolucion: true },
        _count: { id: true }
      }),
      // Descuentos autorizados
      prisma.descuentoAplicado.aggregate({
        where: {
          estado: 'autorizado',
          fechaAplicacion: { gte: startDate, lte: endDate }
        },
        _sum: { montoDescuento: true },
        _count: { id: true }
      }),
      // Depósitos bancarios confirmados
      prisma.depositoBancario.aggregate({
        where: {
          estado: 'confirmado',
          fechaConfirmacion: { gte: startDate, lte: endDate }
        },
        _sum: { montoTotal: true },
        _count: { id: true }
      }),
      // Cajas cerradas
      prisma.cajaDiaria.findMany({
        where: {
          estado: 'cerrada',
          fechaCierre: { gte: startDate, lte: endDate }
        },
        select: {
          saldoInicial: true,
          saldoFinalSistema: true,
          saldoFinalContado: true,
          diferencia: true
        }
      })
    ]);

    // Calcular totales de caja (saldoFinalContado es lo que realmente hay, saldoFinalSistema es lo calculado)
    const totalSaldoSistema = cajasDiarias.reduce((sum, c) => sum + parseFloat(c.saldoFinalSistema || 0), 0);
    const totalSaldoContado = cajasDiarias.reduce((sum, c) => sum + parseFloat(c.saldoFinalContado || 0), 0);

    const ingresosBrutos = parseFloat(ingresosCuentas._sum.subtotal || 0);
    const pagos = parseFloat(pagosRecibidos._sum.subtotal || 0);
    const devolucionesTotal = parseFloat(devoluciones._sum.montoDevolucion || 0);
    const descuentosTotal = parseFloat(descuentos._sum.montoDescuento || 0);
    const depositadoBanco = parseFloat(depositosBancarios._sum.montoTotal || 0);

    const ingresosNetos = ingresosBrutos - devolucionesTotal - descuentosTotal;
    const efectivoNeto = pagos - devolucionesTotal;

    res.json({
      success: true,
      data: {
        periodo: {
          inicio: startDate.toISOString(),
          fin: endDate.toISOString(),
          tipo: periodo
        },
        ingresos: {
          brutos: ingresosBrutos,
          transacciones: ingresosCuentas._count.id,
          pagosRecibidos: pagos,
          cantidadPagos: pagosRecibidos._count.id
        },
        egresos: {
          devoluciones: devolucionesTotal,
          cantidadDevoluciones: devoluciones._count.id,
          descuentos: descuentosTotal,
          cantidadDescuentos: descuentos._count.id
        },
        neto: {
          ingresos: ingresosNetos,
          efectivo: efectivoNeto
        },
        bancos: {
          depositado: depositadoBanco,
          cantidadDepositos: depositosBancarios._count.id
        },
        caja: {
          saldoFinalSistema: totalSaldoSistema,
          saldoFinalContado: totalSaldoContado,
          diferencia: totalSaldoContado - totalSaldoSistema,
          cajasAnalizadas: cajasDiarias.length
        }
      },
      message: 'Reporte de flujo de caja generado correctamente'
    });

  } catch (error) {
    logger.logError('GET_FLUJO_CAJA_REPORT', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;