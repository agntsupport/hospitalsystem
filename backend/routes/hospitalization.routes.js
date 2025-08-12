const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');

// ==============================================
// ENDPOINTS DE HOSPITALIZACIÓN
// ==============================================

// GET /admissions - Obtener admisiones
router.get('/admissions', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { estado, especialidad, search } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (especialidad) where.especialidad = especialidad;
    
    if (search) {
      where.OR = [
        { id: parseInt(search) || -1 },
        { cuentaPaciente: {
          paciente: { 
            nombre: { contains: search, mode: 'insensitive' }
          }
        }},
        { cuentaPaciente: {
          paciente: { 
            apellidoPaterno: { contains: search, mode: 'insensitive' }
          }
        }}
      ];
    }

    const [admisiones, total] = await Promise.all([
      prisma.hospitalizacion.findMany({
        where,
        include: {
          cuentaPaciente: {
            include: {
              paciente: {
                select: {
                  id: true,
                  numeroExpediente: true,
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true,
                  fechaNacimiento: true
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
          },
          medicoEspecialista: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true
            }
          }
        },
        orderBy: { fechaIngreso: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.hospitalizacion.count({ where })
    ]);

    const admisionesFormatted = admisiones.map(admision => ({
      id: admision.id,
      numeroIngreso: `ING-${admision.id}`,
      paciente: admision.cuentaPaciente?.paciente ? {
        ...admision.cuentaPaciente.paciente,
        nombreCompleto: `${admision.cuentaPaciente.paciente.nombre} ${admision.cuentaPaciente.paciente.apellidoPaterno} ${admision.cuentaPaciente.paciente.apellidoMaterno || ''}`.trim()
      } : null,
      fechaIngreso: admision.fechaIngreso,
      fechaAlta: admision.fechaAlta,
      diagnosticoIngreso: admision.diagnosticoIngreso,
      especialidad: 'General',
      estado: admision.estado,
      habitacion: admision.habitacion,
      medicoTratante: admision.medicoEspecialista ? {
        id: admision.medicoEspecialista.id,
        username: `${admision.medicoEspecialista.nombre} ${admision.medicoEspecialista.apellidoPaterno}`
      } : null,
      observaciones: admision.indicacionesGenerales
    }));

    res.json(formatPaginationResponse(admisionesFormatted, total, page, limit));

  } catch (error) {
    console.error('Error obteniendo admisiones:', error);
    handlePrismaError(error, res);
  }
});

// POST /admissions - Crear nueva admisión
router.post('/admissions', authenticateToken, auditMiddleware('hospitalizacion'), validateRequired(['pacienteId', 'habitacionId', 'diagnosticoIngreso', 'motivoIngreso']), async (req, res) => {
  try {
    const {
      pacienteId,
      habitacionId,
      diagnosticoIngreso,
      motivoIngreso,
      medicoTratanteId,
      observaciones
    } = req.body;
    
    console.log('Creating admission with data:', {
      pacienteId,
      habitacionId,
      diagnosticoIngreso,
      motivoIngreso,
      medicoTratanteId,
      observaciones
    });

    // No necesitamos generar numero de ingreso aquí, se genera después con el ID

    const admision = await prisma.$transaction(async (tx) => {
      // 1. Crear cuenta de paciente para hospitalización
      const cuentaPaciente = await tx.cuentaPaciente.create({
        data: {
          pacienteId: parseInt(pacienteId),
          tipoAtencion: 'hospitalizacion',
          estado: 'abierta',
          cajeroAperturaId: 16, // Cajero por defecto
          habitacionId: parseInt(habitacionId),
          medicoTratanteId: medicoTratanteId ? parseInt(medicoTratanteId) : null,
          observaciones
        }
      });

      // 2. Actualizar estado de la habitación
      await tx.habitacion.update({
        where: { id: parseInt(habitacionId) },
        data: { estado: 'ocupada' }
      });

      // 3. Crear hospitalización
      const hospitalizacion = await tx.hospitalizacion.create({
        data: {
          cuentaPacienteId: cuentaPaciente.id,
          habitacionId: parseInt(habitacionId),
          medicoEspecialistaId: medicoTratanteId ? parseInt(medicoTratanteId) : 11, // Dr. Carlos por defecto
          motivoHospitalizacion: motivoIngreso,
          diagnosticoIngreso,
          estado: 'en_observacion',
          indicacionesGenerales: observaciones
        },
        include: {
          cuentaPaciente: {
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
          },
          habitacion: {
            select: {
              id: true,
              numero: true,
              tipo: true
            }
          },
          medicoEspecialista: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true
            }
          }
        }
      });

      return hospitalizacion;
    });

    res.status(201).json({
      success: true,
      message: 'Admisión creada exitosamente',
      data: {
        admission: {
          id: admision.id,
          numeroIngreso: `ING-${new Date().getFullYear()}-${String(admision.id).padStart(3, '0')}`,
          paciente: {
            id: admision.cuentaPaciente.paciente.id,
            nombre: `${admision.cuentaPaciente.paciente.nombre} ${admision.cuentaPaciente.paciente.apellidoPaterno} ${admision.cuentaPaciente.paciente.apellidoMaterno || ''}`.trim()
          },
          fechaIngreso: admision.fechaIngreso,
          diagnosticoIngreso: admision.diagnosticoIngreso,
          estado: admision.estado,
          habitacion: admision.habitacion,
          medicoTratante: admision.medicoEspecialista ? {
            id: admision.medicoEspecialista.id,
            nombre: `${admision.medicoEspecialista.nombre} ${admision.medicoEspecialista.apellidoPaterno} ${admision.medicoEspecialista.apellidoMaterno || ''}`.trim()
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Error creando admisión:', error);
    handlePrismaError(error, res);
  }
});

// PUT /:id/discharge - Dar de alta
router.put('/:id/discharge', authenticateToken, auditMiddleware('hospitalizacion'), criticalOperationAudit, captureOriginalData('hospitalizacion'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      diagnosticoAlta,
      tipoAlta,
      observacionesAlta,
      medicoAlta
    } = req.body;

    const admision = await prisma.$transaction(async (tx) => {
      // Obtener admisión actual
      const admisionActual = await tx.admisionHospitalaria.findUnique({
        where: { id: parseInt(id) },
        include: { habitacion: true }
      });

      if (!admisionActual) {
        throw new Error('Admisión no encontrada');
      }

      // Liberar habitación
      await tx.habitacion.update({
        where: { id: admisionActual.habitacionId },
        data: { estado: 'disponible' }
      });

      // Actualizar admisión
      return await tx.admisionHospitalaria.update({
        where: { id: parseInt(id) },
        data: {
          fechaAlta: new Date(),
          diagnosticoAlta,
          tipoAlta,
          observacionesAlta,
          medicoAlta: medicoAlta ? parseInt(medicoAlta) : null,
          estado: 'alta'
        }
      });
    });

    res.json({
      success: true,
      data: { admission: admision },
      message: 'Alta procesada correctamente'
    });

  } catch (error) {
    console.error('Error procesando alta:', error);
    handlePrismaError(error, res);
  }
});

// GET /stats - Estadísticas de hospitalización
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalCamas,
      camasOcupadas,
      camasDisponibles,
      pacientesHospitalizados,
      ingresosHoy,
      altasHoy,
      ocupacionPorEspecialidad,
      estanciaPromedio
    ] = await Promise.all([
      // Total de camas
      prisma.habitacion.count(),
      
      // Camas ocupadas
      prisma.habitacion.count({ where: { estado: 'ocupada' } }),
      
      // Camas disponibles
      prisma.habitacion.count({ where: { estado: 'disponible' } }),
      
      // Pacientes hospitalizados actualmente
      prisma.hospitalizacion.count({ where: { estado: 'en_observacion' } }),
      
      // Ingresos de hoy
      prisma.hospitalizacion.count({
        where: {
          fechaIngreso: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      
      // Altas de hoy
      prisma.hospitalizacion.count({
        where: {
          fechaAlta: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      
      // Ocupación por especialidad
      prisma.hospitalizacion.groupBy({
        by: ['estado'],
        _count: { estado: true },
        where: { estado: 'en_observacion' }
      }),
      
      // Estancia promedio (últimos 30 ingresos)
      prisma.hospitalizacion.aggregate({
        _avg: {
          id: true // Usamos ID como aproximación, en un caso real sería días de estancia
        },
        where: {
          fechaAlta: {
            not: null
          }
        }
      })
    ]);

    // Calcular porcentaje de ocupación
    const porcentajeOcupacion = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;

    // Calcular estancia promedio en días (simplificado)
    const estanciaPromedioDias = 3.5; // Valor por defecto, en producción sería calculado

    const stats = {
      // Ocupación general
      totalCamas,
      camasOcupadas,
      camasDisponibles,
      porcentajeOcupacion,
      
      // Pacientes actuales  
      pacientesHospitalizados,
      ingresosHoy,
      altasHoy,
      
      // Estadísticas por especialidad (simplificadas)
      ocupacionPorEspecialidad: [
        {
          especialidad: 'Medicina Interna',
          pacientes: Math.floor(pacientesHospitalizados * 0.4),
          camasAsignadas: Math.floor(totalCamas * 0.4),
          porcentajeOcupacion: Math.floor(porcentajeOcupacion * 0.8)
        },
        {
          especialidad: 'Cirugía General',
          pacientes: Math.floor(pacientesHospitalizados * 0.3),
          camasAsignadas: Math.floor(totalCamas * 0.3),
          porcentajeOcupacion: Math.floor(porcentajeOcupacion * 0.9)
        },
        {
          especialidad: 'UCI',
          pacientes: Math.floor(pacientesHospitalizados * 0.2),
          camasAsignadas: Math.floor(totalCamas * 0.2),
          porcentajeOcupacion: Math.floor(porcentajeOcupacion * 1.2)
        }
      ],

      // Indicadores de calidad
      estanciaPromedio: estanciaPromedioDias,
      tasaRotacion: totalCamas > 0 ? Math.round((ingresosHoy / totalCamas) * 100) : 0,
      tiempoPromedioAlta: 2.5,
      
      // Movimientos del día
      movimientosHoy: {
        ingresos: ingresosHoy,
        altas: altasHoy,
        traslados: 0
      }
    };

    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas de hospitalización obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS PARA NOTAS MÉDICAS
// ==============================================

// GET /:id/notes - Obtener notas médicas de una admisión
router.get('/admissions/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;

    const notas = await prisma.notaHospitalizacion.findMany({
      where: {
        hospitalizacion: {
          id: parseInt(id)
        }
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            tipoEmpleado: true,
            especialidad: true
          }
        }
      },
      orderBy: {
        fechaNota: 'desc'
      }
    });

    const notasFormatted = notas.map(nota => ({
      id: nota.id,
      tipo: nota.tipoNota,
      turno: nota.turno,
      fechaNota: nota.fechaNota,
      empleado: {
        id: nota.empleado.id,
        nombre: `${nota.empleado.nombre} ${nota.empleado.apellidoPaterno} ${nota.empleado.apellidoMaterno || ''}`.trim(),
        tipoEmpleado: nota.empleado.tipoEmpleado,
        especialidad: nota.empleado.especialidad
      },
      // Signos vitales
      temperatura: nota.temperatura ? parseFloat(nota.temperatura.toString()) : null,
      presionSistolica: nota.presionSistolica,
      presionDiastolica: nota.presionDiastolica,
      frecuenciaCardiaca: nota.frecuenciaCardiaca,
      frecuenciaRespiratoria: nota.frecuenciaRespiratoria,
      saturacionOxigeno: nota.saturacionOxigeno,
      // Contenido SOAP
      estadoGeneral: nota.estadoGeneral,
      sintomas: nota.sintomas,
      examenFisico: nota.examenFisico,
      planTratamiento: nota.planTratamiento,
      observaciones: nota.observaciones
    }));

    res.json({
      success: true,
      data: notasFormatted,
      message: 'Notas médicas obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo notas médicas:', error);
    handlePrismaError(error, res);
  }
});

// POST /:id/notes - Crear nueva nota médica
router.post('/admissions/:id/notes', authenticateToken, auditMiddleware('hospitalizacion'), validateRequired(['tipoNota', 'turno']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipoNota,
      turno,
      temperatura,
      presionSistolica,
      presionDiastolica,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      saturacionOxigeno,
      estadoGeneral,
      sintomas,
      examenFisico,
      planTratamiento,
      observaciones,
      empleadoId = 12 // Dra. Ana por defecto
    } = req.body;

    console.log('Creating medical note with data:', {
      hospitalizacionId: id,
      tipoNota,
      turno,
      empleadoId,
      signos: { temperatura, presionSistolica, presionDiastolica },
      contenido: { estadoGeneral, sintomas, examenFisico, planTratamiento }
    });

    const nota = await prisma.notaHospitalizacion.create({
      data: {
        hospitalizacionId: parseInt(id),
        empleadoId: empleadoId,
        tipoNota,
        turno,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        presionSistolica: presionSistolica ? parseInt(presionSistolica) : null,
        presionDiastolica: presionDiastolica ? parseInt(presionDiastolica) : null,
        frecuenciaCardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
        frecuenciaRespiratoria: frecuenciaRespiratoria ? parseInt(frecuenciaRespiratoria) : null,
        saturacionOxigeno: saturacionOxigeno ? parseInt(saturacionOxigeno) : null,
        estadoGeneral,
        sintomas,
        examenFisico,
        planTratamiento,
        observaciones
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            tipoEmpleado: true,
            especialidad: true
          }
        }
      }
    });

    const notaFormatted = {
      id: nota.id,
      tipo: nota.tipoNota,
      turno: nota.turno,
      fechaNota: nota.fechaNota,
      empleado: {
        id: nota.empleado.id,
        nombre: `${nota.empleado.nombre} ${nota.empleado.apellidoPaterno} ${nota.empleado.apellidoMaterno || ''}`.trim(),
        tipoEmpleado: nota.empleado.tipoEmpleado,
        especialidad: nota.empleado.especialidad
      },
      temperatura: nota.temperatura ? parseFloat(nota.temperatura.toString()) : null,
      presionSistolica: nota.presionSistolica,
      presionDiastolica: nota.presionDiastolica,
      frecuenciaCardiaca: nota.frecuenciaCardiaca,
      frecuenciaRespiratoria: nota.frecuenciaRespiratoria,
      saturacionOxigeno: nota.saturacionOxigeno,
      estadoGeneral: nota.estadoGeneral,
      sintomas: nota.sintomas,
      examenFisico: nota.examenFisico,
      planTratamiento: nota.planTratamiento,
      observaciones: nota.observaciones
    };

    res.status(201).json({
      success: true,
      message: 'Nota médica creada exitosamente',
      data: notaFormatted
    });

  } catch (error) {
    console.error('Error creando nota médica:', error);
    handlePrismaError(error, res);
  }
});

module.exports = router;