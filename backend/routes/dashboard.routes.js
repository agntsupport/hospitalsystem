// ABOUTME: Rutas API para dashboard - métricas en tiempo real, ocupación y KPIs por rol
// ABOUTME: Incluye endpoints optimizados para todos los roles del sistema

const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Obtener métricas principales del dashboard según el rol del usuario
 * @access  Private (todos los roles autenticados)
 * @returns {Object} Métricas personalizadas según el rol del usuario
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.rol;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Métricas base para todos los roles
    const baseMetrics = {
      timestamp: today.toISOString(),
      rol: userRole
    };

    // Métricas de ocupación (disponibles para todos)
    // Solo quirófanos tienen soft delete (fuera_de_servicio)
    const [habitaciones, quirofanos, consultorios] = await Promise.all([
      prisma.habitacion.findMany({ select: { estado: true } }),
      prisma.quirofano.findMany({
        where: { estado: { not: 'fuera_de_servicio' } },
        select: { estado: true }
      }),
      prisma.consultorio.findMany({ select: { estado: true } })
    ]);

    const ocupacion = {
      habitaciones: {
        total: habitaciones.length,
        ocupadas: habitaciones.filter(h => h.estado === 'ocupada').length,
        disponibles: habitaciones.filter(h => h.estado === 'disponible').length,
        mantenimiento: habitaciones.filter(h => h.estado === 'mantenimiento').length
      },
      quirofanos: {
        total: quirofanos.length,
        ocupados: quirofanos.filter(q => q.estado === 'ocupado').length,
        disponibles: quirofanos.filter(q => q.estado === 'disponible').length,
        limpieza: quirofanos.filter(q => q.estado === 'limpieza').length
      },
      consultorios: {
        total: consultorios.length,
        ocupados: consultorios.filter(c => c.estado === 'ocupado').length,
        disponibles: consultorios.filter(c => c.estado === 'disponible').length
      }
    };

    const capacidadTotal = ocupacion.habitaciones.total + ocupacion.quirofanos.total + ocupacion.consultorios.total;
    const ocupadosTotal = ocupacion.habitaciones.ocupadas + ocupacion.quirofanos.ocupados + ocupacion.consultorios.ocupados;

    ocupacion.general = {
      capacidadTotal,
      ocupadosTotal,
      porcentajeOcupacion: capacidadTotal > 0 ? ((ocupadosTotal / capacidadTotal) * 100).toFixed(1) : 0
    };

    // Métricas según rol
    let roleMetrics = {};

    if (['administrador', 'socio'].includes(userRole)) {
      // Métricas financieras para admin y socio
      const [
        pagosDelMes,
        pagosMesAnterior,
        cuentasAbiertas,
        cuentasPorCobrar,
        pacientesHospitalizados,
        totalPacientes,
        totalEmpleados
      ] = await Promise.all([
        // Pagos del mes actual (buscar en la tabla Pago)
        prisma.pago.aggregate({
          where: {
            fechaPago: { gte: startOfMonth }
          },
          _sum: { monto: true }
        }),
        // Pagos del mes anterior
        prisma.pago.aggregate({
          where: {
            fechaPago: { gte: startOfLastMonth, lte: endOfLastMonth }
          },
          _sum: { monto: true }
        }),
        // Cuentas abiertas
        prisma.cuentaPaciente.count({
          where: { estado: 'abierta' }
        }),
        // Cuentas por cobrar
        prisma.cuentaPaciente.aggregate({
          where: { cuentaPorCobrar: true },
          _sum: { saldoPendiente: true },
          _count: true
        }),
        // Pacientes hospitalizados actualmente
        prisma.hospitalizacion.count({
          where: {
            estado: { in: ['en_observacion', 'estable', 'critico'] }
          }
        }),
        // Total pacientes
        prisma.paciente.count({ where: { activo: true } }),
        // Total empleados activos
        prisma.empleado.count({ where: { activo: true } })
      ]);

      const ingresoActual = Number(pagosDelMes._sum?.monto) || 0;
      const ingresoAnterior = Number(pagosMesAnterior._sum?.monto) || 0;
      const crecimiento = ingresoAnterior > 0
        ? (((ingresoActual - ingresoAnterior) / ingresoAnterior) * 100).toFixed(1)
        : 0;

      roleMetrics = {
        financiero: {
          ingresosMes: ingresoActual,
          ingresosMesAnterior: ingresoAnterior,
          crecimientoMensual: parseFloat(crecimiento),
          cuentasAbiertas,
          cuentasPorCobrar: {
            cantidad: cuentasPorCobrar._count || 0,
            monto: Number(cuentasPorCobrar._sum?.saldoPendiente) || 0
          }
        },
        operativo: {
          pacientesHospitalizados,
          totalPacientes,
          totalEmpleados
        }
      };
    }

    if (['cajero'].includes(userRole)) {
      // Métricas para cajero
      const [cuentasAbiertas, pagosHoy, cobrosPendientes] = await Promise.all([
        prisma.cuentaPaciente.count({ where: { estado: 'abierta' } }),
        prisma.pago.aggregate({
          where: {
            fechaPago: { gte: startOfDay }
          },
          _sum: { monto: true },
          _count: true
        }),
        prisma.cuentaPaciente.count({
          where: {
            estado: 'abierta',
            saldoPendiente: { lt: 0 }
          }
        })
      ]);

      roleMetrics = {
        cuentasAbiertas,
        ventasHoy: {
          cantidad: pagosHoy._count || 0,
          monto: Number(pagosHoy._sum?.monto) || 0
        },
        cobrosPendientes
      };
    }

    if (['enfermero'].includes(userRole)) {
      // Métricas para enfermero
      const [
        pacientesActivos,
        solicitudesPendientes,
        notificacionesSinLeer
      ] = await Promise.all([
        prisma.hospitalizacion.count({
          where: { estado: { in: ['en_observacion', 'estable', 'critico'] } }
        }),
        prisma.solicitudProducto.count({
          where: {
            estado: { in: ['pendiente', 'en_proceso'] },
            solicitanteId: req.user.userId
          }
        }),
        prisma.notificacion.count({
          where: {
            usuarioId: req.user.userId,
            leida: false
          }
        })
      ]);

      roleMetrics = {
        pacientesActivos,
        solicitudesPendientes,
        notificacionesSinLeer
      };
    }

    if (['almacenista'].includes(userRole)) {
      // Métricas para almacenista - usando raw query para comparar campos
      const [
        productosStockBajoRaw,
        solicitudesPendientes,
        movimientosHoy
      ] = await Promise.all([
        prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Producto" WHERE "stock_actual" <= "stock_minimo" AND "activo" = true`,
        prisma.solicitudProducto.count({
          where: { estado: { in: ['pendiente', 'en_proceso'] } }
        }),
        prisma.movimientoInventario.count({
          where: {
            fechaMovimiento: { gte: startOfDay }
          }
        })
      ]);

      roleMetrics = {
        productosStockBajo: productosStockBajoRaw[0]?.count || 0,
        solicitudesPendientes,
        movimientosHoy
      };
    }

    if (['medico_residente', 'medico_especialista'].includes(userRole)) {
      // Métricas para médicos
      const empleadoId = req.user.empleadoId;

      // Si no tiene empleadoId, mostrar datos generales
      if (!empleadoId) {
        const [pacientesActivos, cirugiasProgramadas, notasHoy] = await Promise.all([
          prisma.hospitalizacion.count({
            where: { estado: { in: ['en_observacion', 'estable', 'critico'] } }
          }),
          prisma.cirugia.count({
            where: {
              estado: 'programada',
              fechaInicio: { gte: startOfDay }
            }
          }),
          prisma.notaMedica.count({
            where: {
              fechaNota: { gte: startOfDay }
            }
          })
        ]);

        roleMetrics = {
          pacientesAsignados: pacientesActivos,
          cirugiasProgramadas,
          notasHoy
        };
      } else {
        const [pacientesAsignados, cirugiasProgramadas, notasHoy] = await Promise.all([
          prisma.hospitalizacion.count({
            where: {
              medicoEspecialistaId: empleadoId,
              estado: { in: ['en_observacion', 'estable', 'critico'] }
            }
          }),
          prisma.cirugia.count({
            where: {
              medicoId: empleadoId,
              estado: 'programada',
              fechaInicio: { gte: startOfDay }
            }
          }),
          prisma.notaMedica.count({
            where: {
              medicoId: empleadoId,
              fechaNota: { gte: startOfDay }
            }
          })
        ]);

        roleMetrics = {
          pacientesAsignados,
          cirugiasProgramadas,
          notasHoy
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...baseMetrics,
        ocupacion,
        ...roleMetrics
      },
      message: 'Métricas del dashboard obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas del dashboard',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/dashboard/summary
 * @desc    Obtener resumen ejecutivo para administradores (datos financieros)
 * @access  Private (solo administrador y socio)
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.rol;

    if (!['administrador', 'socio'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para acceder al resumen ejecutivo'
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Obtener métricas financieras completas
    const [
      pagosMes,
      costoProductosMes,
      totalHabitaciones,
      habitacionesOcupadas,
      pacientesAtendidos,
      empleadosActivos
    ] = await Promise.all([
      // Pagos del mes
      prisma.pago.aggregate({
        where: {
          fechaPago: { gte: startOfMonth }
        },
        _sum: { monto: true }
      }),
      // Costo de productos vendidos (estimado) usando transacciones de productos
      prisma.transaccionCuenta.aggregate({
        where: {
          fechaTransaccion: { gte: startOfMonth },
          tipo: 'producto'
        },
        _sum: { subtotal: true }
      }),
      // Total habitaciones
      prisma.habitacion.count(),
      // Habitaciones ocupadas
      prisma.habitacion.count({ where: { estado: 'ocupada' } }),
      // Pacientes atendidos este mes
      prisma.cuentaPaciente.count({
        where: { fechaApertura: { gte: startOfMonth } }
      }),
      // Empleados activos
      prisma.empleado.count({ where: { activo: true } })
    ]);

    const ingresosTotales = Number(pagosMes._sum?.monto) || 0;
    // Estimar utilidad como 30% de ingresos (se ajusta con los endpoints de reportes)
    const utilidadNeta = ingresosTotales * 0.30;
    const ocupacionPromedio = totalHabitaciones > 0
      ? ((habitacionesOcupadas / totalHabitaciones) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        resumenEjecutivo: {
          ingresosTotales,
          utilidadNeta,
          pacientesAtendidos,
          ocupacionPromedio,
          satisfaccionGeneral: 4.5 // Valor placeholder - requiere módulo de encuestas
        },
        detalles: {
          totalHabitaciones,
          habitacionesOcupadas,
          empleadosActivos
        },
        periodo: {
          fechaInicio: startOfMonth.toISOString(),
          fechaFin: today.toISOString()
        }
      },
      message: 'Resumen ejecutivo obtenido correctamente'
    });

  } catch (error) {
    console.error('Error al obtener resumen ejecutivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen ejecutivo',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/dashboard/ocupacion
 * @desc    Obtener ocupación en tiempo real de consultorios, habitaciones y quirófanos
 * @access  Private (todos los roles autenticados)
 * @returns {Object} Información de ocupación con detalles de pacientes y médicos
 */
router.get('/ocupacion', authenticateToken, async (req, res) => {
  try {
    const timestamp = new Date();

    // 1. CONSULTORIOS (Consultorio General)
    const consultorios = await prisma.consultorio.findMany({
      orderBy: { numero: 'asc' },
      include: {
        citas: {
          where: {
            fechaCita: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999))
            },
          },
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                numeroExpediente: true
              }
            },
            medico: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                especialidad: true
              }
            }
          },
          take: 1,
          orderBy: { fechaCita: 'desc' }
        }
      }
    });

    const consultoriosFormateados = consultorios.map(consultorio => {
      const citaActual = consultorio.citas[0];

      return {
        tipo: 'consultorio',
        numero: consultorio.numero,
        tipoConsultorio: consultorio.tipo,
        especialidad: consultorio.especialidad,
        estado: consultorio.estado,
        ocupado: consultorio.estado === 'ocupado',
        disponible: consultorio.estado === 'disponible',
        pacienteActual: citaActual ? {
          id: citaActual.paciente.id,
          nombre: `${citaActual.paciente.nombre} ${citaActual.paciente.apellidoPaterno} ${citaActual.paciente.apellidoMaterno || ''}`.trim(),
          expediente: citaActual.paciente.numeroExpediente,
          fechaIngreso: citaActual.fechaCita
        } : null,
        medicoAsignado: citaActual ? {
          id: citaActual.medico.id,
          nombre: `${citaActual.medico.nombre} ${citaActual.medico.apellidoPaterno}`.trim(),
          especialidad: citaActual.medico.especialidad
        } : null
      };
    });

    // 2. HABITACIONES
    const habitaciones = await prisma.habitacion.findMany({
      orderBy: { numero: 'asc' },
      include: {
        hospitalizaciones: {
          where: {
            estado: {
              in: ['en_observacion', 'estable', 'critico']
            }
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
                    numeroExpediente: true
                  }
                }
              }
            },
            medicoEspecialista: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                especialidad: true
              }
            }
          },
          take: 1,
          orderBy: { fechaIngreso: 'desc' }
        }
      }
    });

    const habitacionesFormateadas = habitaciones.map(habitacion => {
      const hospitalizacionActual = habitacion.hospitalizaciones[0];
      const paciente = hospitalizacionActual?.cuentaPaciente?.paciente;
      const medico = hospitalizacionActual?.medicoEspecialista;

      let diasHospitalizado = null;
      if (hospitalizacionActual) {
        const fechaIngreso = new Date(hospitalizacionActual.fechaIngreso);
        const hoy = new Date();
        const diferencia = hoy - fechaIngreso;
        diasHospitalizado = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      }

      return {
        tipo: 'habitacion',
        numero: habitacion.numero,
        tipoHabitacion: habitacion.tipo,
        precioDiario: parseFloat(habitacion.precioPorDia),
        estado: habitacion.estado,
        ocupado: habitacion.estado === 'ocupada',
        disponible: habitacion.estado === 'disponible',
        mantenimiento: habitacion.estado === 'mantenimiento',
        pacienteActual: paciente ? {
          id: paciente.id,
          nombre: `${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}`.trim(),
          expediente: paciente.numeroExpediente,
          fechaIngreso: hospitalizacionActual.fechaIngreso,
          diasHospitalizado: diasHospitalizado,
          estadoHospitalizacion: hospitalizacionActual.estado
        } : null,
        medicoAsignado: medico ? {
          id: medico.id,
          nombre: `${medico.nombre} ${medico.apellidoPaterno}`.trim(),
          especialidad: medico.especialidad
        } : null
      };
    });

    // 3. QUIRÓFANOS (excluir los eliminados con fuera_de_servicio)
    const quirofanos = await prisma.quirofano.findMany({
      where: { estado: { not: 'fuera_de_servicio' } },
      orderBy: { numero: 'asc' },
      include: {
        cirugias: {
          where: {
            OR: [
              { estado: 'en_progreso' },
              {
                estado: 'programada',
                fechaInicio: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
              }
            ]
          },
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                numeroExpediente: true
              }
            },
            medico: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                especialidad: true
              }
            }
          },
          orderBy: { fechaInicio: 'asc' }
        }
      }
    });

    const quirofanosFormateados = quirofanos.map(quirofano => {
      const cirugias = quirofano.cirugias;
      const cirugiaEnProgreso = cirugias.find(c => c.estado === 'en_progreso');
      const cirugiasProgramadas = cirugias.filter(c => c.estado === 'programada');
      const proximaCirugia = cirugiasProgramadas[0];

      let tiempoTranscurrido = null;
      if (cirugiaEnProgreso) {
        const inicio = new Date(cirugiaEnProgreso.fechaInicio);
        const ahora = new Date();
        const diferencia = ahora - inicio;
        tiempoTranscurrido = Math.floor(diferencia / (1000 * 60));
      }

      return {
        tipo: 'quirofano',
        numero: quirofano.numero,
        tipoQuirofano: quirofano.tipo,
        especialidad: quirofano.especialidad,
        precioHora: quirofano.precioHora ? parseFloat(quirofano.precioHora) : null,
        estado: quirofano.estado,
        ocupado: quirofano.estado === 'ocupado',
        disponible: quirofano.estado === 'disponible',
        mantenimiento: quirofano.estado === 'mantenimiento',
        programado: cirugiasProgramadas.length > 0,
        cirugiaActual: cirugiaEnProgreso ? {
          id: cirugiaEnProgreso.id,
          tipo: cirugiaEnProgreso.tipoIntervencion,
          paciente: {
            id: cirugiaEnProgreso.paciente.id,
            nombre: `${cirugiaEnProgreso.paciente.nombre} ${cirugiaEnProgreso.paciente.apellidoPaterno} ${cirugiaEnProgreso.paciente.apellidoMaterno || ''}`.trim(),
            expediente: cirugiaEnProgreso.paciente.numeroExpediente
          },
          medicoCircujano: {
            id: cirugiaEnProgreso.medico.id,
            nombre: `${cirugiaEnProgreso.medico.nombre} ${cirugiaEnProgreso.medico.apellidoPaterno}`.trim(),
            especialidad: cirugiaEnProgreso.medico.especialidad
          },
          horaInicio: cirugiaEnProgreso.fechaInicio,
          tiempoTranscurrido: tiempoTranscurrido
        } : null,
        proximaCirugia: proximaCirugia ? {
          id: proximaCirugia.id,
          tipo: proximaCirugia.tipoIntervencion,
          paciente: `${proximaCirugia.paciente.nombre} ${proximaCirugia.paciente.apellidoPaterno}`.trim(),
          horaProgramada: proximaCirugia.fechaInicio
        } : null,
        cirugiasHoy: cirugiasProgramadas.length
      };
    });

    // 4. RESUMEN GENERAL
    const totalConsultorios = consultorios.length;
    const consultoriosOcupados = consultorios.filter(c => c.estado === 'ocupado').length;
    const consultoriosDisponibles = consultorios.filter(c => c.estado === 'disponible').length;

    const totalHabitaciones = habitaciones.length;
    const habitacionesOcupadas = habitaciones.filter(h => h.estado === 'ocupada').length;
    const habitacionesDisponibles = habitaciones.filter(h => h.estado === 'disponible').length;
    const habitacionesMantenimiento = habitaciones.filter(h => h.estado === 'mantenimiento').length;

    const totalQuirofanos = quirofanos.length;
    const quirofanosOcupados = quirofanos.filter(q => q.estado === 'ocupado').length;
    const quirofanosDisponibles = quirofanos.filter(q => q.estado === 'disponible').length;
    const quirofanosMantenimiento = quirofanos.filter(q => q.estado === 'mantenimiento').length;
    const quirofanosProgramados = quirofanosFormateados.filter(q => q.programado && !q.ocupado).length;

    const capacidadTotal = totalConsultorios + totalHabitaciones + totalQuirofanos;
    const ocupadosTotal = consultoriosOcupados + habitacionesOcupadas + quirofanosOcupados;
    const porcentajeOcupacion = capacidadTotal > 0
      ? ((ocupadosTotal / capacidadTotal) * 100).toFixed(1)
      : 0;

    const respuesta = {
      timestamp: timestamp.toISOString(),
      consultorios: {
        total: totalConsultorios,
        ocupados: consultoriosOcupados,
        disponibles: consultoriosDisponibles,
        detalle: consultoriosFormateados
      },
      habitaciones: {
        total: totalHabitaciones,
        ocupadas: habitacionesOcupadas,
        disponibles: habitacionesDisponibles,
        mantenimiento: habitacionesMantenimiento,
        detalle: habitacionesFormateadas
      },
      quirofanos: {
        total: totalQuirofanos,
        ocupados: quirofanosOcupados,
        disponibles: quirofanosDisponibles,
        mantenimiento: quirofanosMantenimiento,
        programados: quirofanosProgramados,
        detalle: quirofanosFormateados
      },
      resumen: {
        capacidadTotal: capacidadTotal,
        ocupadosTotal: ocupadosTotal,
        disponiblesTotal: consultoriosDisponibles + habitacionesDisponibles + quirofanosDisponibles,
        porcentajeOcupacion: parseFloat(porcentajeOcupacion)
      }
    };

    res.status(200).json(respuesta);

  } catch (error) {
    console.error('Error al obtener ocupación:', error);
    res.status(500).json({
      error: 'Error al obtener ocupación del hospital',
      details: error.message
    });
  }
});

module.exports = router;
