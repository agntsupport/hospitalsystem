const express = require('express');
const router = express.Router();
const { prisma, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// FUNCIONES HELPER PARA CARGOS AUTOMÁTICOS
// ==============================================

/**
 * Calcula los días de estancia desde el ingreso hasta hoy
 */
function calcularDiasEstancia(fechaIngreso) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const diffTime = Math.abs(hoy - ingreso);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Genera cargos diarios de habitación para una hospitalización
 */
async function generarCargosHabitacion(cuentaId, habitacionId, fechaIngreso, empleadoId, tx = prisma) {
  try {
    // Obtener datos de la habitación
    const habitacion = await tx.habitacion.findUnique({
      where: { id: parseInt(habitacionId) }
    });

    if (!habitacion) {
      throw new Error('Habitación no encontrada');
    }

    // Buscar el servicio de habitación
    let servicio = await tx.servicio.findFirst({
      where: {
        codigo: `HAB-${habitacion.numero}`
      }
    });
    
    if (!servicio) {
      // Si no existe el servicio, crearlo automáticamente
      servicio = await tx.servicio.create({
        data: {
          codigo: `HAB-${habitacion.numero}`,
          nombre: `Habitación ${habitacion.numero} - ${habitacion.tipo} (por día)`,
          descripcion: `Servicio de hospedaje en habitación ${habitacion.numero} tipo ${habitacion.tipo}`,
          precio: habitacion.precioPorDia,
          tipo: 'hospitalizacion',
          activo: true
        }
      });
    }

    // Calcular días de estancia
    const diasEstancia = calcularDiasEstancia(fechaIngreso);
    
    // Verificar si ya existen cargos de habitación para esta cuenta
    const cargosExistentes = await tx.transaccionCuenta.count({
      where: {
        cuentaId: parseInt(cuentaId),
        tipo: 'servicio',
        servicioId: servicio.id
      }
    });

    // Solo generar los cargos que faltan
    const cargosAGenerar = diasEstancia - cargosExistentes;
    
    if (cargosAGenerar > 0) {
      // Crear transacciones por cada día de estancia faltante
      for (let dia = cargosExistentes + 1; dia <= diasEstancia; dia++) {
        const fechaCargo = new Date(fechaIngreso);
        fechaCargo.setDate(fechaCargo.getDate() + (dia - 1));
        
        await tx.transaccionCuenta.create({
          data: {
            cuentaId: parseInt(cuentaId),
            tipo: 'servicio',
            concepto: `Día ${dia} - Habitación ${habitacion.numero} (${habitacion.tipo})`,
            cantidad: 1,
            precioUnitario: servicio.precio,
            subtotal: servicio.precio,
            servicioId: servicio.id,
            empleadoCargoId: parseInt(empleadoId),
            fechaTransaccion: fechaCargo,
            observaciones: `Cargo automático día ${dia} de hospitalización`
          }
        });
      }
      
      // Actualizar totales de la cuenta
      await actualizarTotalesCuenta(cuentaId, tx);
      
      logger.info(`✅ Generados ${cargosAGenerar} cargos de habitación para cuenta ${cuentaId}`);
      return cargosAGenerar;
    } else {
      logger.info(`ℹ️  No hay cargos pendientes para cuenta ${cuentaId} (${diasEstancia} días, ${cargosExistentes} cargos)`);
      return 0;
    }

  } catch (error) {
    logger.logError('GENERAR_CARGOS_HABITACION', error, { cuentaId, habitacionId });
    throw error;
  }
}

/**
 * Actualiza los totales de una cuenta basándose en las transacciones
 */
async function actualizarTotalesCuenta(cuentaId, tx = prisma) {
  try {
    // Obtener todas las transacciones de la cuenta
    const transacciones = await tx.transaccionCuenta.findMany({
      where: { cuentaId: parseInt(cuentaId) }
    });

    // Calcular totales
    let anticipo = 0;
    let totalServicios = 0;
    let totalProductos = 0;

    transacciones.forEach(transaccion => {
      const subtotal = parseFloat(transaccion.subtotal.toString());
      
      switch (transaccion.tipo) {
        case 'anticipo':
          anticipo += subtotal;
          break;
        case 'servicio':
          totalServicios += subtotal;
          break;
        case 'producto':
          totalProductos += subtotal;
          break;
      }
    });

    const totalCuenta = totalServicios + totalProductos;
    const saldoPendiente = totalCuenta - anticipo;

    // Actualizar la cuenta
    await tx.cuentaPaciente.update({
      where: { id: parseInt(cuentaId) },
      data: {
        anticipo,
        totalServicios,
        totalProductos,
        totalCuenta,
        saldoPendiente
      }
    });

    logger.info(`💰 Totales actualizados para cuenta ${cuentaId}: Servicios: $${totalServicios}, Total: $${totalCuenta}, Saldo: $${saldoPendiente}`);
    return { anticipo, totalServicios, totalProductos, totalCuenta, saldoPendiente };

  } catch (error) {
    logger.logError('ACTUALIZAR_TOTALES_CUENTA', error, { cuentaId });
    throw error;
  }
}

// ==============================================
// ENDPOINTS DE HOSPITALIZACIÓN
// ==============================================

// GET /admissions - Obtener admisiones
router.get('/admissions', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { estado, especialidad, search, pacienteId, includeDischarges } = req.query;

    const where = {};

    // Filtrar por paciente específico si se proporciona
    if (pacienteId) {
      where.cuentaPaciente = {
        pacienteId: parseInt(pacienteId)
      };
    }

    // Por defecto, solo mostrar pacientes NO dados de alta (aún hospitalizados)
    // A menos que se especifique includeDischarges=true
    if (includeDischarges !== 'true') {
      where.fechaAlta = null;
    }

    // Manejar filtros de estado (puede ser string o array)
    if (estado) {
      if (Array.isArray(estado)) {
        where.estado = { in: estado };
      } else {
        where.estado = estado;
      }
    }

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
      cuentaPacienteId: admision.cuentaPacienteId, // INCLUIR ID DE CUENTA
      paciente: admision.cuentaPaciente?.paciente ? {
        ...admision.cuentaPaciente.paciente,
        nombreCompleto: `${admision.cuentaPaciente.paciente.nombre} ${admision.cuentaPaciente.paciente.apellidoPaterno} ${admision.cuentaPaciente.paciente.apellidoMaterno || ''}`.trim()
      } : null,
      cuentaPaciente: admision.cuentaPaciente ? {
        id: admision.cuentaPaciente.id,
        tipoAtencion: admision.cuentaPaciente.tipoAtencion,
        estado: admision.cuentaPaciente.estado,
        fechaApertura: admision.cuentaPaciente.fechaApertura
      } : null,
      // INCLUIR ANTICIPO EN LA RESPUESTA (VALIDACIÓN FLUJO CRÍTICO #1)
      anticipo: admision.cuentaPaciente ? parseFloat(admision.cuentaPaciente.anticipo.toString()) : 0.00,
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
    logger.logError('GET_ADMISSIONS', error, { filters: { estado, especialidad, search, pacienteId, includeDischarges } });
    handlePrismaError(error, res);
  }
});

// POST /admissions - Crear nueva admisión
router.post('/admissions', authenticateToken, authorizeRoles(['administrador', 'cajero', 'medico_residente', 'medico_especialista']), auditMiddleware('hospitalizacion'), validateRequired(['pacienteId', 'habitacionId', 'diagnosticoIngreso', 'motivoIngreso', 'medicoTratanteId']), async (req, res) => {
  try {
    const {
      pacienteId,
      habitacionId,
      diagnosticoIngreso,
      motivoIngreso,
      medicoTratanteId,
      observaciones
    } = req.body;
    
    logger.logOperation('CREATE_ADMISSION', {
      pacienteId,
      habitacionId,
      medicoTratanteId,
      // Medical data (diagnosticoIngreso, motivoIngreso, observaciones) automatically redacted
      diagnosticoIngreso,
      motivoIngreso,
      observaciones
    });

    // Validar que la habitación esté disponible
    const habitacion = await prisma.habitacion.findUnique({
      where: { id: parseInt(habitacionId) }
    });

    if (!habitacion) {
      return res.status(404).json({
        success: false,
        message: 'Habitación no encontrada'
      });
    }

    if (habitacion.estado !== 'disponible') {
      return res.status(409).json({
        success: false,
        message: `La habitación ${habitacion.numero} no está disponible para ingreso (estado: ${habitacion.estado})`
      });
    }

    // No necesitamos generar numero de ingreso aquí, se genera después con el ID

    const admision = await prisma.$transaction(async (tx) => {
      // 1. Crear cuenta de paciente para hospitalización
      const cuentaPaciente = await tx.cuentaPaciente.create({
        data: {
          pacienteId: parseInt(pacienteId),
          tipoAtencion: 'hospitalizacion',
          estado: 'abierta',
          cajeroAperturaId: req.user.id, // Usuario actual que crea la cuenta
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

      // 3. Crear transacción de anticipo automático de $10,000 MXN
      await tx.transaccionCuenta.create({
        data: {
          cuentaId: cuentaPaciente.id,
          tipo: 'anticipo',
          concepto: 'Anticipo por hospitalización',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: req.user.id,
          observaciones: 'Anticipo automático por ingreso hospitalario'
        }
      });

      // 4. Generar cargo inicial de habitación (día 1)
      await generarCargosHabitacion(
        cuentaPaciente.id, 
        parseInt(habitacionId), 
        new Date(), // Fecha de ingreso es hoy
        req.user.id,
        tx
      );

      // 5. Crear hospitalización
      const hospitalizacion = await tx.hospitalizacion.create({
        data: {
          cuentaPacienteId: cuentaPaciente.id,
          habitacionId: parseInt(habitacionId),
          medicoEspecialistaId: parseInt(medicoTratanteId),
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
    }, {
      maxWait: 5000,  // Máximo 5 segundos esperando obtener el lock
      timeout: 10000  // Máximo 10 segundos ejecutando la transacción
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
    logger.logError('CREATE_ADMISSION', error, {
      pacienteId: req.body.pacienteId,
      habitacionId: req.body.habitacionId
    });
    handlePrismaError(error, res);
  }
});

// PUT /admissions/:id/discharge - Dar de alta
router.put('/admissions/:id/discharge', authenticateToken, authorizeRoles(['enfermero', 'medico_residente', 'medico_especialista', 'administrador']), auditMiddleware('hospitalizacion'), criticalOperationAudit, captureOriginalData('hospitalizacion'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosticoAlta,
      observacionesAlta
    } = req.body;

    const admision = await prisma.$transaction(async (tx) => {
      // Obtener admisión actual
      const admisionActual = await tx.hospitalizacion.findUnique({
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
      return await tx.hospitalizacion.update({
        where: { id: parseInt(id) },
        data: {
          fechaAlta: new Date(),
          diagnosticoAlta,
          indicacionesGenerales: observacionesAlta,
          estado: 'alta_medica'
        }
      });
    }, {
      maxWait: 5000,  // Máximo 5 segundos esperando obtener el lock
      timeout: 10000  // Máximo 10 segundos ejecutando la transacción
    });

    res.json({
      success: true,
      data: { admission: admision },
      message: 'Alta procesada correctamente'
    });

  } catch (error) {
    logger.logError('PROCESS_DISCHARGE', error, { admisionId: req.params.id });
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
      
      // Pacientes hospitalizados actualmente (todos excepto dados de alta)
      prisma.hospitalizacion.count({ 
        where: { 
          estado: { 
            notIn: ['alta_medica', 'alta_voluntaria'] 
          } 
        } 
      }),
      
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
        where: { 
          estado: { 
            notIn: ['alta_medica', 'alta_voluntaria'] 
          } 
        }
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
    logger.logError('GET_HOSPITALIZATION_STATS', error);
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINTS PARA NOTAS MÉDICAS
// ==============================================

// GET /:id/notes - Obtener notas médicas de una admisión (solo personal médico y enfermería)
router.get('/admissions/:id/notes', authenticateToken, authorizeRoles(['administrador', 'enfermero', 'medico_residente', 'medico_especialista']), async (req, res) => {
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
    logger.logError('GET_MEDICAL_NOTES', error, { hospitalizacionId: req.params.id });
    handlePrismaError(error, res);
  }
});

// GET /:id/patient-status - Obtener estado básico del paciente (para cajeros)
router.get('/admissions/:id/patient-status', authenticateToken, authorizeRoles(['administrador', 'cajero', 'enfermero', 'medico_residente', 'medico_especialista']), async (req, res) => {
  try {
    const { id } = req.params;

    const hospitalizacion = await prisma.hospitalizacion.findUnique({
      where: { id: parseInt(id) },
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
                fechaNacimiento: true,
                genero: true,
                tipoSangre: true,
                contactoEmergenciaNombre: true,
                contactoEmergenciaTelefono: true,
                contactoEmergenciaRelacion: true
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
            apellidoMaterno: true,
            especialidad: true
          }
        }
      }
    });

    if (!hospitalizacion) {
      return res.status(404).json({
        success: false,
        message: 'Hospitalización no encontrada'
      });
    }

    // Solo información básica del estado del paciente
    const estadoPaciente = {
      hospitalizacion: {
        id: hospitalizacion.id,
        numeroIngreso: `ING-${hospitalizacion.id}`,
        fechaIngreso: hospitalizacion.fechaIngreso,
        fechaAlta: hospitalizacion.fechaAlta,
        estado: hospitalizacion.estado,
        diagnosticoIngreso: hospitalizacion.diagnosticoIngreso,
        diagnosticoAlta: hospitalizacion.diagnosticoAlta
      },
      paciente: {
        id: hospitalizacion.cuentaPaciente.paciente.id,
        nombreCompleto: `${hospitalizacion.cuentaPaciente.paciente.nombre} ${hospitalizacion.cuentaPaciente.paciente.apellidoPaterno} ${hospitalizacion.cuentaPaciente.paciente.apellidoMaterno || ''}`.trim(),
        numeroExpediente: hospitalizacion.cuentaPaciente.paciente.numeroExpediente,
        edad: hospitalizacion.cuentaPaciente.paciente.fechaNacimiento ? 
          Math.floor((new Date() - new Date(hospitalizacion.cuentaPaciente.paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        genero: hospitalizacion.cuentaPaciente.paciente.genero,
        tipoSangre: hospitalizacion.cuentaPaciente.paciente.tipoSangre,
        contactoEmergencia: {
          nombre: hospitalizacion.cuentaPaciente.paciente.contactoEmergenciaNombre,
          telefono: hospitalizacion.cuentaPaciente.paciente.contactoEmergenciaTelefono,
          relacion: hospitalizacion.cuentaPaciente.paciente.contactoEmergenciaRelacion
        }
      },
      habitacion: hospitalizacion.habitacion ? {
        numero: hospitalizacion.habitacion.numero,
        tipo: hospitalizacion.habitacion.tipo
      } : null,
      medicoTratante: hospitalizacion.medicoEspecialista ? {
        nombre: `${hospitalizacion.medicoEspecialista.nombre} ${hospitalizacion.medicoEspecialista.apellidoPaterno} ${hospitalizacion.medicoEspecialista.apellidoMaterno || ''}`.trim(),
        especialidad: hospitalizacion.medicoEspecialista.especialidad
      } : null,
      cuenta: {
        estado: hospitalizacion.cuentaPaciente.estado,
        tipoAtencion: hospitalizacion.cuentaPaciente.tipoAtencion
      }
    };

    res.json({
      success: true,
      data: estadoPaciente,
      message: 'Estado del paciente obtenido correctamente'
    });

  } catch (error) {
    logger.logError('GET_PATIENT_STATUS', error, { hospitalizacionId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /:id/notes - Crear nueva nota médica
router.post('/admissions/:id/notes', authenticateToken, authorizeRoles(['enfermero', 'medico_residente', 'medico_especialista', 'administrador']), auditMiddleware('hospitalizacion'), validateRequired(['tipoNota', 'turno']), async (req, res) => {
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

    // Log sanitizado (información médica será redactada automáticamente)
    logger.logOperation('CREATE_MEDICAL_NOTE', {
      hospitalizacionId: id,
      tipoNota,
      turno,
      empleadoId,
      // Información médica sensible será automáticamente redactada por el logger
      estadoGeneral,
      sintomas,
      examenFisico,
      planTratamiento
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
    logger.logError('CREATE_MEDICAL_NOTE_ERROR', error, {
      hospitalizacionId: req.params.id,
      tipoNota: req.body.tipoNota
    });
    handlePrismaError(error, res);
  }
});

// ==============================================
// ENDPOINT PARA CARGOS AUTOMÁTICOS
// ==============================================

// POST /update-room-charges - Actualizar cargos de habitación para todas las hospitalizaciones activas
router.post('/update-room-charges', authenticateToken, authorizeRoles(['administrador', 'cajero']), async (req, res) => {
  try {
    logger.info('🔄 Iniciando actualización de cargos de habitación...');

    // Obtener todas las hospitalizaciones activas (que no tengan alta)
    const hospitalizacionesActivas = await prisma.hospitalizacion.findMany({
      where: {
        estado: {
          notIn: ['alta_medica', 'alta_voluntaria']
        }
      },
      include: {
        cuentaPaciente: true
      }
    });

    logger.info(`📊 Encontradas ${hospitalizacionesActivas.length} hospitalizaciones activas`);

    let totalCargosGenerados = 0;
    const resultados = [];

    // Procesar cada hospitalización en una transacción
    for (const hospitalizacion of hospitalizacionesActivas) {
      try {
        const cargosGenerados = await prisma.$transaction(async (tx) => {
          return await generarCargosHabitacion(
            hospitalizacion.cuentaPacienteId,
            hospitalizacion.habitacionId,
            hospitalizacion.fechaIngreso,
            req.user.id,
            tx
          );
        }, {
          maxWait: 5000,
          timeout: 10000
        });

        totalCargosGenerados += cargosGenerados;
        resultados.push({
          hospitalizacionId: hospitalizacion.id,
          cuentaId: hospitalizacion.cuentaPacienteId,
          cargosGenerados,
          estado: 'success'
        });

      } catch (error) {
        logger.logError('PROCESS_HOSPITALIZATION_CHARGES', error, {
          hospitalizacionId: hospitalizacion.id,
          cuentaId: hospitalizacion.cuentaPacienteId
        });
        resultados.push({
          hospitalizacionId: hospitalizacion.id,
          cuentaId: hospitalizacion.cuentaPacienteId,
          cargosGenerados: 0,
          estado: 'error',
          mensaje: error.message
        });
      }
    }

    logger.info(`✅ Proceso completado: ${totalCargosGenerados} cargos generados`);

    res.json({
      success: true,
      message: `Actualización completada: ${totalCargosGenerados} cargos generados en ${hospitalizacionesActivas.length} hospitalizaciones`,
      data: {
        totalCargosGenerados,
        hospitalizacionesProcesadas: hospitalizacionesActivas.length,
        resultados
      }
    });

  } catch (error) {
    logger.logError('UPDATE_ROOM_CHARGES_MASS', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cargos de habitación',
      error: error.message
    });
  }
});

// POST /admissions/:id/update-charges - Actualizar cargos de una hospitalización específica
router.post('/admissions/:id/update-charges', authenticateToken, authorizeRoles(['administrador', 'cajero']), async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`🔄 Actualizando cargos para hospitalización ${id}...`);

    // Buscar la hospitalización
    const hospitalizacion = await prisma.hospitalizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cuentaPaciente: true
      }
    });

    if (!hospitalizacion) {
      return res.status(404).json({
        success: false,
        message: 'Hospitalización no encontrada'
      });
    }

    if (['alta_medica', 'alta_voluntaria'].includes(hospitalizacion.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden generar cargos para pacientes dados de alta'
      });
    }

    // Generar los cargos faltantes
    const cargosGenerados = await prisma.$transaction(async (tx) => {
      return await generarCargosHabitacion(
        hospitalizacion.cuentaPacienteId,
        hospitalizacion.habitacionId,
        hospitalizacion.fechaIngreso,
        req.user.id,
        tx
      );
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      message: `Cargos actualizados: ${cargosGenerados} cargos generados`,
      data: {
        hospitalizacionId: parseInt(id),
        cuentaId: hospitalizacion.cuentaPacienteId,
        cargosGenerados
      }
    });

  } catch (error) {
    logger.logError('UPDATE_CHARGES_SINGLE_HOSPITALIZATION', error, {
      hospitalizacionId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cargos de la hospitalización',
      error: error.message
    });
  }
});

// POST /accounts/:id/recalculate-totals - Recalcular totales de una cuenta específica
router.post('/accounts/:id/recalculate-totals', authenticateToken, authorizeRoles(['administrador', 'cajero']), async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`🧮 Recalculando totales para cuenta ${id}...`);

    const totales = await prisma.$transaction(async (tx) => {
      return await actualizarTotalesCuenta(parseInt(id), tx);
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.json({
      success: true,
      message: 'Totales recalculados exitosamente',
      data: {
        cuentaId: parseInt(id),
        ...totales
      }
    });

  } catch (error) {
    logger.logError('RECALCULATE_ACCOUNT_TOTALS', error, { cuentaId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error al recalcular totales de la cuenta',
      error: error.message
    });
  }
});

module.exports = router;