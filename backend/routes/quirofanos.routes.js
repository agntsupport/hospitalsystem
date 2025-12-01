const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, captureOriginalData } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// CONSTANTE: DURACIÓN MÁXIMA DE CIRUGÍA (6 HORAS)
// ==============================================
const MAX_CIRUGIA_DURATION_HOURS = 6;

// ==============================================
// RUTAS DE QUIRÓFANOS
// ==============================================

// GET /api/quirofanos - Obtener lista de quirófanos con filtros
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      estado,
      tipo,
      especialidad,
      disponible,
      sortBy = 'numero',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = req.query;

    const whereClause = {
      // Por defecto, excluir quirófanos eliminados (fuera de servicio)
      estado: {
        not: 'fuera_de_servicio'
      }
    };

    // Filtro de búsqueda por número
    if (search) {
      whereClause.numero = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Filtros opcionales
    if (estado) {
      whereClause.estado = estado;
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (especialidad) {
      whereClause.especialidad = {
        contains: especialidad,
        mode: 'insensitive'
      };
    }

    // Filtro especial para quirófanos disponibles
    if (disponible === 'true') {
      whereClause.estado = 'disponible';
    }

    // Consulta principal con paginación
    const [quirofanos, total] = await Promise.all([
      prisma.quirofano.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        include: {
          citas: {
            where: {
              estado: {
                in: ['programada', 'confirmada']
              }
            },
            select: {
              id: true,
              fechaCita: true,
              estado: true,
              paciente: {
                select: {
                  nombre: true,
                  apellidoPaterno: true,
                  apellidoMaterno: true
                }
              }
            }
          },
          cirugias: {
            where: {
              estado: {
                in: ['programada', 'en_progreso']
              }
            },
            select: {
              id: true,
              fechaInicio: true,
              fechaFin: true,
              estado: true,
              tipoIntervencion: true
            }
          }
        }
      }),
      prisma.quirofano.count({ where: whereClause })
    ]);

    // Calcular estadísticas adicionales
    const quirofanosConEstadisticas = quirofanos.map(quirofano => ({
      ...quirofano,
      ocupado: quirofano.estado === 'ocupado',
      citasActivas: quirofano.citas.length,
      cirugiasActivas: quirofano.cirugias.length,
      precioHora: parseFloat(quirofano.precioHora || 0)
    }));

    res.json({
      success: true,
      data: {
        items: quirofanosConEstadisticas,
        total,
        hasMore: parseInt(offset) + quirofanos.length < total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      }
    });
  } catch (error) {
    logger.logError('GET_QUIROFANOS', error, { filters: req.query });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/quirofanos/available-numbers - Números disponibles y sugerencias
router.get('/available-numbers', authenticateToken, async (req, res) => {
  try {
    const quirofanosExistentes = await prisma.quirofano.findMany({
      select: { numero: true },
      orderBy: { numero: 'asc' }
    });
    
    const numerosExistentes = quirofanosExistentes.map(q => q.numero);
    
    // Generar sugerencias basadas en patrón Q + número
    const sugerencias = [];
    for (let i = 1; i <= 20; i++) {
      const numeroSugerido = `Q${i}`;
      if (!numerosExistentes.includes(numeroSugerido)) {
        sugerencias.push(numeroSugerido);
        if (sugerencias.length >= 5) break; // Máximo 5 sugerencias
      }
    }
    
    res.json({
      success: true,
      data: {
        existingNumbers: numerosExistentes,
        suggestions: sugerencias,
        total: numerosExistentes.length,
        pattern: 'Q1, Q2, Q3...'
      }
    });
  } catch (error) {
    logger.logError('GET_AVAILABLE_NUMBERS', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/quirofanos/stats - Estadísticas de quirófanos
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalQuirofanos,
      disponibles,
      ocupados,
      mantenimiento,
      porTipo,
      cirugiasHoy
    ] = await Promise.all([
      prisma.quirofano.count({
        where: { estado: { not: 'fuera_de_servicio' } }
      }),
      prisma.quirofano.count({ where: { estado: 'disponible' } }),
      prisma.quirofano.count({ where: { estado: 'ocupado' } }),
      prisma.quirofano.count({ where: { estado: 'mantenimiento' } }),
      prisma.quirofano.groupBy({
        by: ['tipo'],
        where: { estado: { not: 'fuera_de_servicio' } },
        _count: { id: true }
      }),
      prisma.cirugiaQuirofano.count({
        where: {
          fechaInicio: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    const distribucionPorTipo = {};
    porTipo.forEach(grupo => {
      distribucionPorTipo[grupo.tipo] = grupo._count.id;
    });

    res.json({
      success: true,
      data: {
        resumen: {
          totalQuirofanos,
          disponibles,
          ocupados,
          mantenimiento,
          cirugiasHoy,
          porcentajeOcupacion: totalQuirofanos > 0 
            ? Math.round((ocupados / totalQuirofanos) * 100) 
            : 0
        },
        distribucion: {
          porTipo: distribucionPorTipo,
          porEstado: {
            disponible: disponibles,
            ocupado: ocupados,
            mantenimiento: mantenimiento
          }
        }
      }
    });
  } catch (error) {
    logger.logError('GET_QUIROFANOS_STATS', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/quirofanos - Crear nuevo quirófano
router.post('/', authenticateToken, auditMiddleware('quirofanos'), async (req, res) => {
  try {
    // Verificar permisos - solo administradores
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear quirófanos'
      });
    }

    const {
      numero,
      tipo,
      especialidad,
      descripcion,
      equipamiento,
      capacidadEquipo,
      precioHora
    } = req.body;

    // Validaciones
    if (!numero || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'El número y tipo de quirófano son requeridos'
      });
    }

    // Validar tipo de quirófano
    const tiposValidos = [
      'cirugia_general',
      'cirugia_cardiaca',
      'cirugia_neurologica',
      'cirugia_ortopedica',
      'cirugia_plastica',
      'cirugia_pediatrica',
      'cirugia_traumatologia',
      'cirugia_ambulatoria'
    ];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de quirófano inválido. Valores permitidos: ${tiposValidos.join(', ')}`
      });
    }

    // Verificar que el número no esté duplicado
    const existeQuirofano = await prisma.quirofano.findUnique({
      where: { numero }
    });

    if (existeQuirofano) {
      // Obtener números existentes para información
      const quirofanosExistentes = await prisma.quirofano.findMany({
        select: { numero: true },
        orderBy: { numero: 'asc' }
      });
      
      const numerosExistentes = quirofanosExistentes.map(q => q.numero);
      
      // Sugerir el próximo número disponible
      let siguienteNumero = 'Q6';
      for (let i = 1; i <= 20; i++) {
        const numeroSugerido = `Q${i}`;
        if (!numerosExistentes.includes(numeroSugerido)) {
          siguienteNumero = numeroSugerido;
          break;
        }
      }
      
      return res.status(400).json({
        success: false,
        message: `Ya existe un quirófano con el número "${numero}". Números existentes: ${numerosExistentes.join(', ')}. Sugerencia: ${siguienteNumero}`,
        existingNumbers: numerosExistentes,
        suggestion: siguienteNumero
      });
    }

    // Crear quirófano y servicio asociado en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el quirófano
      const nuevoQuirofano = await tx.quirofano.create({
        data: {
          numero: numero.toString(),
          tipo,
          especialidad,
          estado: 'disponible', // Estado inicial
          descripcion,
          equipamiento,
          capacidadEquipo: capacidadEquipo || 6,
          precioHora: precioHora ? parseFloat(precioHora) : null
        }
      });

      // 2. Crear servicio asociado automáticamente si se especifica precio por hora
      let servicio = null;
      if (precioHora) {
        const codigoServicio = `QUIR-${numero}`;
        const nombreServicio = `Quirófano ${numero} - ${tipo} (por hora)`;
        const descripcionServicio = `Cargo por uso de quirófano ${numero} tipo ${tipo}. Tarifa por hora. ${especialidad ? `Especialidad: ${especialidad}` : ''}`;
        
        servicio = await tx.servicio.create({
          data: {
            codigo: codigoServicio,
            nombre: nombreServicio,
            descripcion: descripcionServicio,
            tipo: 'cirugia',
            precio: parseFloat(precioHora),
            activo: true
          }
        });
      }

      return { quirofano: nuevoQuirofano, servicio };
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    res.status(201).json({
      success: true,
      data: {
        quirofano: result.quirofano,
        servicio: result.servicio
      },
      message: result.servicio 
        ? 'Quirófano y servicio asociado creados exitosamente' 
        : 'Quirófano creado exitosamente'
    });
  } catch (error) {
    logger.logError('CREATE_QUIROFANO', error, { numero: req.body.numero });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// ==============================================
// RUTAS DE CIRUGÍAS PROGRAMADAS
// ==============================================

// POST /api/quirofanos/cirugias - Programar nueva cirugía
router.post('/cirugias', authenticateToken, auditMiddleware('cirugias'), async (req, res) => {
  try {
    // Verificar permisos - cajeros, enfermeros, médicos y administradores pueden agendar cirugías
    const allowedRoles = ['administrador', 'medico_especialista', 'medico_residente', 'enfermero', 'cajero'];
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para programar cirugías'
      });
    }

    const {
      quirofanoId,
      pacienteId,
      medicoId,
      tipoIntervencion,
      fechaInicio,
      fechaFin,
      observaciones,
      equipoMedico
    } = req.body;

    // Validaciones básicas
    if (!quirofanoId || !pacienteId || !medicoId || !tipoIntervencion || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para programar la cirugía'
      });
    }

    // Validar que las fechas no sean pasadas
    const now = new Date();
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (fechaInicioDate < now) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser una fecha pasada'
      });
    }

    // Validar que fechaFin sea posterior a fechaInicio
    if (fechaFinDate <= fechaInicioDate) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    // Validar existencia del quirófano
    const quirofano = await prisma.quirofano.findUnique({
      where: { id: parseInt(quirofanoId) }
    });

    if (!quirofano) {
      return res.status(404).json({
        success: false,
        message: 'Quirófano no encontrado'
      });
    }

    // Validar existencia del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(pacienteId) }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Validar existencia del médico
    const medico = await prisma.empleado.findUnique({
      where: { id: parseInt(medicoId) }
    });

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // Verificar disponibilidad del quirófano
    const conflictos = await prisma.cirugiaQuirofano.findMany({
      where: {
        quirofanoId: parseInt(quirofanoId),
        estado: {
          in: ['programada', 'en_progreso']
        },
        OR: [
          {
            fechaInicio: {
              lt: new Date(fechaFin),
              gte: new Date(fechaInicio)
            }
          },
          {
            fechaFin: {
              gt: new Date(fechaInicio),
              lte: new Date(fechaFin)
            }
          }
        ]
      }
    });

    if (conflictos.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El quirófano ya está reservado para ese horario'
      });
    }

    // Crear la cirugía programada
    const nuevaCirugia = await prisma.cirugiaQuirofano.create({
      data: {
        quirofanoId: parseInt(quirofanoId),
        pacienteId: parseInt(pacienteId),
        medicoId: parseInt(medicoId),
        tipoIntervencion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        observaciones,
        equipoMedico: equipoMedico || [],
        estado: 'programada'
      },
      include: {
        quirofano: true,
        paciente: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        },
        medico: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: nuevaCirugia,
      message: 'Cirugía programada exitosamente'
    });
  } catch (error) {
    logger.logError('CREATE_SURGERY', error, {
      quirofanoId: req.body.quirofanoId,
      pacienteId: req.body.pacienteId
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/quirofanos/cirugias - Obtener lista de cirugías
router.get('/cirugias', authenticateToken, async (req, res) => {
  try {
    const { 
      estado,
      quirofanoId,
      medicoId,
      fechaInicio,
      fechaFin,
      sortBy = 'fechaInicio',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = req.query;

    const whereClause = {};

    if (estado) whereClause.estado = estado;
    if (quirofanoId && quirofanoId !== '') whereClause.quirofanoId = parseInt(quirofanoId);
    if (medicoId && medicoId !== '') whereClause.medicoId = parseInt(medicoId);
    
    if (fechaInicio || fechaFin) {
      whereClause.fechaInicio = {};
      if (fechaInicio) whereClause.fechaInicio.gte = new Date(fechaInicio);
      if (fechaFin) whereClause.fechaInicio.lte = new Date(fechaFin);
    }

    // Usar la cláusula where directamente
    const extendedWhereClause = {
      ...whereClause
    };

    const [cirugias, total] = await Promise.all([
      prisma.cirugiaQuirofano.findMany({
        where: extendedWhereClause,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        include: {
          quirofano: {
            select: {
              id: true,
              numero: true,
              tipo: true,
              especialidad: true,
              estado: true
            }
          },
          paciente: {
            select: {
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              telefono: true
            }
          },
          medico: {
            select: {
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              especialidad: true
            }
          }
        }
      }),
      prisma.cirugiaQuirofano.count({ where: extendedWhereClause })
    ]);

    res.json({
      success: true,
      data: {
        items: cirugias,
        total,
        hasMore: parseInt(offset) + cirugias.length < total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      }
    });
  } catch (error) {
    logger.logError('GET_SURGERIES', error, { filters: req.query });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/quirofanos/cirugias/:id - Obtener detalle de cirugía
router.get('/cirugias/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cirugia = await prisma.cirugiaQuirofano.findUnique({
      where: { id: parseInt(id) },
      include: {
        quirofano: true,
        paciente: true,
        medico: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true,
            telefono: true,
            email: true
          }
        }
      }
    });

    if (!cirugia) {
      return res.status(404).json({
        success: false,
        message: 'Cirugía no encontrada'
      });
    }

    // Si hay equipo médico, obtener sus datos
    if (cirugia.equipoMedico && Array.isArray(cirugia.equipoMedico)) {
      const equipoIds = cirugia.equipoMedico;
      const equipoDetalle = await prisma.empleado.findMany({
        where: {
          id: {
            in: equipoIds
          }
        },
        select: {
          id: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          tipoEmpleado: true,
          especialidad: true
        }
      });
      cirugia.equipoMedicoDetalle = equipoDetalle;
    }

    res.json({
      success: true,
      data: cirugia
    });
  } catch (error) {
    logger.logError('GET_SURGERY_DETAIL', error, { cirugiaId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/quirofanos/cirugias/:id/estado - Actualizar estado de cirugía
router.put('/cirugias/:id/estado', authenticateToken, auditMiddleware('cirugias'), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones, motivo } = req.body;

    // Verificar permisos - cajeros, enfermeros, médicos y administradores pueden cambiar estado
    const allowedRoles = ['administrador', 'medico_especialista', 'medico_residente', 'enfermero', 'cajero'];
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para actualizar el estado de cirugías'
      });
    }

    const estadosValidos = ['programada', 'en_progreso', 'completada', 'cancelada', 'reprogramada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    // Si es cancelación, requerir motivo
    if (estado === 'cancelada' && !motivo) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un motivo para cancelar la cirugía'
      });
    }

    const cirugia = await prisma.cirugiaQuirofano.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cirugia) {
      return res.status(404).json({
        success: false,
        message: 'Cirugía no encontrada'
      });
    }

    const updateData = { estado };
    
    // Si la cirugía se inicia, actualizar el estado del quirófano
    if (estado === 'en_progreso') {
      await prisma.quirofano.update({
        where: { id: cirugia.quirofanoId },
        data: { estado: 'ocupado' }
      });
    }
    
    // Si la cirugía termina, liberar el quirófano
    if (estado === 'completada' || estado === 'cancelada') {
      updateData.fechaFin = new Date();
      await prisma.quirofano.update({
        where: { id: cirugia.quirofanoId },
        data: { estado: 'limpieza' }
      });

      // Si la cirugía se completó exitosamente, generar cargo automático
      if (estado === 'completada') {
        try {
          // Obtener datos completos de la cirugía y quirófano
          const cirugiaCompleta = await prisma.cirugiaQuirofano.findUnique({
            where: { id: parseInt(id) },
            include: {
              quirofano: true,
              paciente: true
            }
          });

          // Buscar hospitalización activa del paciente (a través de cuentaPaciente)
          const hospitalizacionActiva = await prisma.hospitalizacion.findFirst({
            where: {
              cuentaPaciente: {
                pacienteId: cirugiaCompleta.pacienteId
              },
              estado: {
                notIn: ['alta_medica', 'alta_voluntaria']
              }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (hospitalizacionActiva && hospitalizacionActiva.cuentaPacienteId) {
            // Verificar que la cuenta esté abierta
            const cuenta = await prisma.cuentaPaciente.findUnique({
              where: { id: hospitalizacionActiva.cuentaPacienteId }
            });

            if (cuenta && cuenta.estado === 'abierta') {
              // Calcular horas de cirugía
              const fechaInicio = new Date(cirugia.fechaInicio);
              const fechaFin = new Date();
              const horasCirugia = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60));

              // Buscar o crear servicio de quirófano
              const codigoServicio = `QUIR-${cirugiaCompleta.quirofano.numero}`;
              let servicio = await prisma.servicio.findFirst({
                where: { codigo: codigoServicio }
              });

              // Si no existe, crear el servicio
              if (!servicio) {
                const precioHora = cirugiaCompleta.quirofano.precioHora || 0;
                servicio = await prisma.servicio.create({
                  data: {
                    codigo: codigoServicio,
                    nombre: `Uso de quirófano ${cirugiaCompleta.quirofano.numero}`,
                    descripcion: `Servicio de uso de quirófano ${cirugiaCompleta.quirofano.numero}`,
                    precio: precioHora,
                    categoria: 'quirofano',
                    activo: true
                  }
                });
              }

              // Crear transacción de cargo automático
              const precioUnitario = parseFloat(servicio.precio.toString());
              const subtotal = horasCirugia * precioUnitario;

              await prisma.transaccionCuenta.create({
                data: {
                  cuentaId: hospitalizacionActiva.cuentaPacienteId,
                  tipo: 'servicio',
                  concepto: `Uso de quirófano ${cirugiaCompleta.quirofano.numero} - ${cirugiaCompleta.tipoIntervencion}`,
                  cantidad: horasCirugia,
                  precioUnitario: precioUnitario,
                  subtotal: subtotal,
                  servicioId: servicio.id,
                  empleadoCargoId: req.user.id,
                  observaciones: `Cargo automático por cirugía completada (ID: ${cirugia.id})`
                }
              });

              logger.logInfo('SURGERY_CHARGE_CREATED', {
                cirugiaId: cirugia.id,
                cuentaId: hospitalizacionActiva.cuentaPacienteId,
                horasCirugia,
                subtotal,
                quirofanoNumero: cirugiaCompleta.quirofano.numero
              });
            } else {
              logger.logWarning('SURGERY_CHARGE_SKIPPED_CLOSED_ACCOUNT', {
                cirugiaId: cirugia.id,
                cuentaId: hospitalizacionActiva.cuentaPacienteId,
                motivo: 'Cuenta cerrada'
              });
            }
          } else {
            logger.logWarning('SURGERY_CHARGE_SKIPPED_NO_HOSPITALIZATION', {
              cirugiaId: cirugia.id,
              pacienteId: cirugiaCompleta.pacienteId,
              motivo: 'No hay hospitalización activa para el paciente'
            });
          }
        } catch (cargoError) {
          // No fallar la operación completa si hay error en el cargo
          logger.logError('SURGERY_CHARGE_ERROR', cargoError, {
            cirugiaId: cirugia.id,
            motivo: 'Error al generar cargo automático de quirófano'
          });
        }
      }
    }

    if (observaciones) {
      updateData.observaciones = cirugia.observaciones 
        ? `${cirugia.observaciones}\n${observaciones}` 
        : observaciones;
    }

    const cirugiaActualizada = await prisma.cirugiaQuirofano.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        quirofano: true,
        paciente: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        },
        medico: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: cirugiaActualizada,
      message: `Estado de la cirugía actualizado a ${estado}`
    });
  } catch (error) {
    logger.logError('UPDATE_SURGERY_STATUS', error, {
      cirugiaId: req.params.id,
      nuevoEstado: req.body.estado
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/quirofanos/cirugias/:id - Cancelar cirugía
router.delete('/cirugias/:id', authenticateToken, auditMiddleware('cirugias'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Verificar permisos - cajeros, enfermeros, médicos y administradores pueden cancelar cirugías
    const allowedRoles = ['administrador', 'medico_especialista', 'medico_residente', 'enfermero', 'cajero'];
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para cancelar cirugías'
      });
    }

    // Motivo opcional pero recomendado
    const motivoTexto = motivo || 'Sin motivo especificado';

    const cirugia = await prisma.cirugiaQuirofano.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cirugia) {
      return res.status(404).json({
        success: false,
        message: 'Cirugía no encontrada'
      });
    }

    if (cirugia.estado === 'completada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una cirugía completada'
      });
    }

    const cirugiaCancelada = await prisma.cirugiaQuirofano.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'cancelada',
        observaciones: cirugia.observaciones
          ? `${cirugia.observaciones}\n[CANCELADA - ${new Date().toISOString()}]: ${motivoTexto}`
          : `[CANCELADA - ${new Date().toISOString()}]: ${motivoTexto}`
      }
    });

    // Liberar el quirófano si estaba ocupado
    if (cirugia.estado === 'en_progreso') {
      await prisma.quirofano.update({
        where: { id: cirugia.quirofanoId },
        data: { estado: 'disponible' }
      });
    }

    res.json({
      success: true,
      data: cirugiaCancelada,
      message: 'Cirugía cancelada exitosamente'
    });
  } catch (error) {
    logger.logError('CANCEL_SURGERY', error, { cirugiaId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/quirofanos/:id - Obtener quirófano por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const quirofano = await prisma.quirofano.findUnique({
      where: { id: parseInt(id) },
      include: {
        citas: {
          include: {
            paciente: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                telefono: true
              }
            },
            medico: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                especialidad: true
              }
            }
          },
          orderBy: {
            fechaCita: 'desc'
          },
          take: 10
        },
        cirugias: {
          orderBy: {
            fechaInicio: 'desc'
          },
          take: 10
        }
      }
    });

    if (!quirofano) {
      return res.status(404).json({
        success: false,
        message: 'Quirófano no encontrado'
      });
    }

    // Transformar datos para la respuesta
    const quirofanoConDatos = {
      ...quirofano,
      precioHora: parseFloat(quirofano.precioHora || 0),
      citasRecientes: quirofano.citas,
      cirugiasRecientes: quirofano.cirugias
    };

    res.json({
      success: true,
      data: quirofanoConDatos
    });
  } catch (error) {
    logger.logError('GET_QUIROFANO_BY_ID', error, { quirofanoId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/quirofanos/:id - Actualizar quirófano
router.put('/:id', authenticateToken, captureOriginalData('quirofano'), auditMiddleware('quirofanos'), async (req, res) => {
  try {
    // Verificar permisos - solo administradores
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar quirófanos'
      });
    }

    const { id } = req.params;
    const {
      numero,
      tipo,
      especialidad,
      estado,
      descripcion,
      equipamiento,
      capacidadEquipo,
      precioHora
    } = req.body;

    // Verificar que el quirófano existe
    const quirofanoExistente = await prisma.quirofano.findUnique({
      where: { id: parseInt(id) }
    });

    if (!quirofanoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Quirófano no encontrado'
      });
    }

    // Si se está cambiando el número, verificar que no esté duplicado
    if (numero && numero !== quirofanoExistente.numero) {
      const numeroDuplicado = await prisma.quirofano.findUnique({
        where: { numero: numero.toString() }
      });

      if (numeroDuplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un quirófano con ese número'
        });
      }
    }

    const datosActualizacion = {};
    
    if (numero) datosActualizacion.numero = numero.toString();
    if (tipo) datosActualizacion.tipo = tipo;
    if (especialidad !== undefined) datosActualizacion.especialidad = especialidad;
    if (estado) datosActualizacion.estado = estado;
    if (descripcion !== undefined) datosActualizacion.descripcion = descripcion;
    if (equipamiento !== undefined) datosActualizacion.equipamiento = equipamiento;
    if (capacidadEquipo) datosActualizacion.capacidadEquipo = parseInt(capacidadEquipo);
    if (precioHora !== undefined) {
      datosActualizacion.precioHora = precioHora ? parseFloat(precioHora) : null;
    }

    const quirofanoActualizado = await prisma.quirofano.update({
      where: { id: parseInt(id) },
      data: datosActualizacion
    });

    res.json({
      success: true,
      data: quirofanoActualizado,
      message: 'Quirófano actualizado exitosamente'
    });
  } catch (error) {
    logger.logError('UPDATE_QUIROFANO', error, { quirofanoId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/quirofanos/:id/estado - Cambiar estado del quirófano
router.put('/:id/estado', authenticateToken, auditMiddleware('quirofanos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    // Estados válidos
    const estadosValidos = ['disponible', 'ocupado', 'mantenimiento', 'reservado', 'limpieza', 'preparacion'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const quirofano = await prisma.quirofano.findUnique({
      where: { id: parseInt(id) }
    });

    if (!quirofano) {
      return res.status(404).json({
        success: false,
        message: 'Quirófano no encontrado'
      });
    }

    // Verificar permisos según el cambio de estado solicitado
    // Caso especial: Marcar limpieza completada (limpieza -> disponible)
    // Solo administradores y enfermeros pueden hacerlo
    if (quirofano.estado === 'limpieza' && estado === 'disponible') {
      const rolesLimpiezaCompletada = ['administrador', 'enfermero'];
      if (!rolesLimpiezaCompletada.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores y enfermeros pueden marcar la limpieza como completada'
        });
      }
    } else {
      // Para otros cambios de estado: administradores, enfermeros y médicos especialistas
      const allowedRoles = ['administrador', 'enfermero', 'medico_especialista'];
      if (!allowedRoles.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para cambiar el estado de los quirófanos'
        });
      }
    }

    const quirofanoActualizado = await prisma.quirofano.update({
      where: { id: parseInt(id) },
      data: { estado }
    });

    // Registrar el cambio de estado para auditoría (motivo será redactado si contiene información sensible)
    logger.logOperation('QUIROFANO_CAMBIO_ESTADO', {
      quirofanoId: quirofano.id,
      numero: quirofano.numero,
      estadoAnterior: quirofano.estado,
      estadoNuevo: estado,
      motivo // Será redactado automáticamente si contiene información sensible
    });

    res.json({
      success: true,
      data: quirofanoActualizado,
      message: `Estado del quirófano actualizado a ${estado}`
    });
  } catch (error) {
    logger.logError('UPDATE_QUIROFANO_STATUS', error, {
      quirofanoId: req.params.id,
      nuevoEstado: req.body.estado
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/quirofanos/:id - Eliminar quirófano (soft delete)
router.delete('/:id', authenticateToken, auditMiddleware('quirofanos'), async (req, res) => {
  try {
    // Verificar permisos - solo administradores
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar quirófanos'
      });
    }

    const { id } = req.params;

    const quirofano = await prisma.quirofano.findUnique({
      where: { id: parseInt(id) },
      include: {
        citas: {
          where: {
            estado: {
              in: ['programada', 'confirmada']
            }
          }
        },
        cirugias: {
          where: {
            estado: {
              in: ['programada', 'en_progreso']
            }
          }
        }
      }
    });

    if (!quirofano) {
      return res.status(404).json({
        success: false,
        message: 'Quirófano no encontrado'
      });
    }

    // Verificar que no tenga citas o cirugías activas
    if (quirofano.citas.length > 0 || quirofano.cirugias.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el quirófano porque tiene citas o cirugías programadas'
      });
    }

    // Soft delete - cambiar estado a inactivo en lugar de eliminar
    const quirofanoEliminado = await prisma.quirofano.update({
      where: { id: parseInt(id) },
      data: { 
        estado: 'fuera_de_servicio',
        descripcion: `${quirofano.descripcion || ''} [ELIMINADO - ${new Date().toISOString()}]`
      }
    });

    res.json({
      success: true,
      data: quirofanoEliminado,
      message: 'Quirófano marcado como fuera de servicio'
    });
  } catch (error) {
    logger.logError('DELETE_QUIROFANO', error, { quirofanoId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/quirofanos/disponibles/horario - Obtener quirófanos disponibles para una fecha/hora
router.get('/disponibles/horario', authenticateToken, async (req, res) => {
  try {
    const { fecha, horaInicio, horaFin, tipo } = req.query;

    if (!fecha || !horaInicio || !horaFin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha, hora de inicio y fin son requeridas'
      });
    }

    const fechaInicio = new Date(`${fecha}T${horaInicio}`);
    const fechaFin = new Date(`${fecha}T${horaFin}`);

    const whereClause = {
      estado: 'disponible'
    };

    if (tipo) {
      whereClause.tipo = tipo;
    }

    // Buscar quirófanos disponibles
    const quirofanosDisponibles = await prisma.quirofano.findMany({
      where: {
        ...whereClause,
        NOT: {
          OR: [
            {
              citas: {
                some: {
                  fechaCita: {
                    gte: fechaInicio,
                    lt: fechaFin
                  },
                  estado: {
                    in: ['programada', 'confirmada']
                  }
                }
              }
            },
            {
              cirugias: {
                some: {
                  AND: [
                    {
                      fechaInicio: {
                        lt: fechaFin
                      }
                    },
                    {
                      fechaFin: {
                        gt: fechaInicio
                      }
                    }
                  ],
                  estado: {
                    in: ['programada', 'en_progreso']
                  }
                }
              }
            }
          ]
        }
      }
    });

    res.json({
      success: true,
      data: quirofanosDisponibles.map(quirofano => ({
        ...quirofano,
        precioHora: parseFloat(quirofano.precioHora || 0)
      }))
    });
  } catch (error) {
    logger.logError('GET_AVAILABLE_QUIROFANOS', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/quirofanos/agenda/disponibilidad - Obtener disponibilidad de quirófanos para agenda
// Considera quirófanos ocupados mostrando cuándo estarán disponibles (después de 6h)
router.get('/agenda/disponibilidad', authenticateToken, async (req, res) => {
  try {
    const { fecha, quirofanoId } = req.query;

    // Si no se proporciona fecha, usar la fecha actual
    const fechaConsulta = fecha ? new Date(fecha) : new Date();
    const inicioDelDia = new Date(fechaConsulta);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fechaConsulta);
    finDelDia.setHours(23, 59, 59, 999);

    const whereClause = {
      estado: { not: 'fuera_de_servicio' }
    };

    if (quirofanoId) {
      whereClause.id = parseInt(quirofanoId);
    }

    // Obtener todos los quirófanos con sus cirugías activas
    const quirofanos = await prisma.quirofano.findMany({
      where: whereClause,
      include: {
        cirugias: {
          where: {
            estado: { in: ['programada', 'en_progreso'] },
            OR: [
              // Cirugías que empiezan en el día consultado
              {
                fechaInicio: {
                  gte: inicioDelDia,
                  lte: finDelDia
                }
              },
              // Cirugías en progreso (pueden haber iniciado antes)
              {
                estado: 'en_progreso'
              }
            ]
          },
          orderBy: { fechaInicio: 'asc' },
          include: {
            paciente: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true
              }
            },
            medico: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                especialidad: true
              }
            }
          }
        }
      }
    });

    const ahora = new Date();

    const disponibilidad = quirofanos.map(quirofano => {
      const cirugiasDelDia = quirofano.cirugias;
      let estadoActual = quirofano.estado;
      let disponibleDesde = null;
      let cirugiaActual = null;
      let proximasCirugias = [];

      // Buscar cirugía en progreso
      const cirugiaEnProgreso = cirugiasDelDia.find(c => c.estado === 'en_progreso');

      if (cirugiaEnProgreso) {
        cirugiaActual = cirugiaEnProgreso;
        estadoActual = 'ocupado';

        // Calcular tiempo máximo de ocupación (6 horas desde inicio)
        const tiempoMaximoOcupacion = new Date(cirugiaEnProgreso.fechaInicio);
        tiempoMaximoOcupacion.setHours(tiempoMaximoOcupacion.getHours() + MAX_CIRUGIA_DURATION_HOURS);

        // El quirófano estará disponible después de 6h o cuando termine la cirugía programada
        if (cirugiaEnProgreso.fechaFin) {
          disponibleDesde = new Date(Math.min(tiempoMaximoOcupacion.getTime(), new Date(cirugiaEnProgreso.fechaFin).getTime()));
        } else {
          disponibleDesde = tiempoMaximoOcupacion;
        }

        // Si ya pasaron las 6 horas, marcar como disponible ahora
        if (ahora >= tiempoMaximoOcupacion) {
          disponibleDesde = ahora;
        }

        // Las demás cirugías programadas
        proximasCirugias = cirugiasDelDia.filter(c => c.estado === 'programada');
      } else if (estadoActual === 'ocupado') {
        // Estado marcado como ocupado pero sin cirugía en progreso - disponible inmediatamente
        disponibleDesde = ahora;
        proximasCirugias = cirugiasDelDia.filter(c => c.estado === 'programada');
      } else {
        // No hay cirugía en progreso, verificar próximas programadas
        proximasCirugias = cirugiasDelDia.filter(c => c.estado === 'programada');
      }

      // Calcular slots disponibles para el día
      const slotsDisponibles = calcularSlotsDisponibles(
        inicioDelDia,
        finDelDia,
        cirugiasDelDia,
        disponibleDesde,
        ahora
      );

      return {
        id: quirofano.id,
        numero: quirofano.numero,
        tipo: quirofano.tipo,
        especialidad: quirofano.especialidad,
        estadoActual,
        precioHora: parseFloat(quirofano.precioHora || 0),
        cirugiaActual: cirugiaActual ? {
          id: cirugiaActual.id,
          tipoIntervencion: cirugiaActual.tipoIntervencion,
          fechaInicio: cirugiaActual.fechaInicio,
          fechaFinEstimada: cirugiaActual.fechaFin,
          paciente: cirugiaActual.paciente,
          medico: cirugiaActual.medico,
          tiempoTranscurrido: Math.floor((ahora - new Date(cirugiaActual.fechaInicio)) / (1000 * 60)), // minutos
          tiempoRestanteMaximo: Math.max(0, Math.floor((disponibleDesde - ahora) / (1000 * 60))) // minutos hasta liberación automática
        } : null,
        disponibleDesde: estadoActual === 'ocupado' ? disponibleDesde : (estadoActual === 'disponible' ? ahora : null),
        proximasCirugias: proximasCirugias.map(c => ({
          id: c.id,
          tipoIntervencion: c.tipoIntervencion,
          fechaInicio: c.fechaInicio,
          fechaFin: c.fechaFin,
          paciente: c.paciente,
          medico: c.medico
        })),
        slotsDisponibles
      };
    });

    res.json({
      success: true,
      data: {
        fecha: fechaConsulta,
        duracionMaximaCirugiaHoras: MAX_CIRUGIA_DURATION_HOURS,
        quirofanos: disponibilidad
      }
    });
  } catch (error) {
    logger.logError('GET_AGENDA_DISPONIBILIDAD', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Función auxiliar para calcular slots disponibles en el día
function calcularSlotsDisponibles(inicioDelDia, finDelDia, cirugias, disponibleDesde, ahora) {
  const slots = [];
  const cirugiasOrdenadas = [...cirugias]
    .filter(c => c.estado === 'programada' || c.estado === 'en_progreso')
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));

  // Punto de inicio: ahora o cuando esté disponible
  let puntoActual = disponibleDesde ? new Date(Math.max(disponibleDesde.getTime(), ahora.getTime())) : ahora;

  // Si el punto actual es antes del inicio del día, usar inicio del día
  if (puntoActual < inicioDelDia) {
    puntoActual = new Date(inicioDelDia);
  }

  for (const cirugia of cirugiasOrdenadas) {
    const inicioCirugia = new Date(cirugia.fechaInicio);

    // Si hay espacio antes de esta cirugía
    if (puntoActual < inicioCirugia) {
      const duracionMinutos = Math.floor((inicioCirugia - puntoActual) / (1000 * 60));
      if (duracionMinutos >= 60) { // Solo slots de al menos 1 hora
        slots.push({
          inicio: new Date(puntoActual),
          fin: new Date(inicioCirugia),
          duracionMinutos
        });
      }
    }

    // Mover el punto actual al fin de esta cirugía (o 6h después del inicio si no tiene fin)
    if (cirugia.fechaFin) {
      puntoActual = new Date(cirugia.fechaFin);
    } else {
      const finEstimado = new Date(inicioCirugia);
      finEstimado.setHours(finEstimado.getHours() + MAX_CIRUGIA_DURATION_HOURS);
      puntoActual = finEstimado;
    }
  }

  // Agregar slot final del día si hay espacio
  if (puntoActual < finDelDia) {
    const duracionMinutos = Math.floor((finDelDia - puntoActual) / (1000 * 60));
    if (duracionMinutos >= 60) {
      slots.push({
        inicio: new Date(puntoActual),
        fin: new Date(finDelDia),
        duracionMinutos
      });
    }
  }

  return slots;
}

// POST /api/quirofanos/liberar-automatico - Liberar quirófanos con cirugías de más de 6 horas
// Este endpoint puede ser llamado por un cron job o al cargar la página de quirófanos
router.post('/liberar-automatico', authenticateToken, async (req, res) => {
  try {
    const ahora = new Date();
    const hace6Horas = new Date(ahora.getTime() - (MAX_CIRUGIA_DURATION_HOURS * 60 * 60 * 1000));

    // Buscar cirugías en progreso que hayan iniciado hace más de 6 horas
    const cirugiasExcedidas = await prisma.cirugiaQuirofano.findMany({
      where: {
        estado: 'en_progreso',
        fechaInicio: {
          lt: hace6Horas
        }
      },
      include: {
        quirofano: true,
        paciente: {
          select: {
            nombre: true,
            apellidoPaterno: true
          }
        }
      }
    });

    const resultados = [];

    for (const cirugia of cirugiasExcedidas) {
      try {
        // Completar la cirugía automáticamente
        await prisma.$transaction(async (tx) => {
          // Actualizar cirugía a completada
          await tx.cirugiaQuirofano.update({
            where: { id: cirugia.id },
            data: {
              estado: 'completada',
              fechaFin: ahora,
              observaciones: cirugia.observaciones
                ? `${cirugia.observaciones}\n[LIBERACIÓN AUTOMÁTICA - ${ahora.toISOString()}]: Cirugía completada automáticamente después de ${MAX_CIRUGIA_DURATION_HOURS} horas`
                : `[LIBERACIÓN AUTOMÁTICA - ${ahora.toISOString()}]: Cirugía completada automáticamente después de ${MAX_CIRUGIA_DURATION_HOURS} horas`
            }
          });

          // Liberar el quirófano (poner en limpieza)
          await tx.quirofano.update({
            where: { id: cirugia.quirofanoId },
            data: { estado: 'limpieza' }
          });
        });

        const tiempoExcedido = Math.floor((ahora - new Date(cirugia.fechaInicio)) / (1000 * 60 * 60));

        resultados.push({
          cirugiaId: cirugia.id,
          quirofanoNumero: cirugia.quirofano.numero,
          paciente: `${cirugia.paciente.nombre} ${cirugia.paciente.apellidoPaterno}`,
          tiempoTranscurridoHoras: tiempoExcedido,
          liberado: true
        });

        logger.logInfo('QUIROFANO_LIBERACION_AUTOMATICA', {
          cirugiaId: cirugia.id,
          quirofanoId: cirugia.quirofanoId,
          quirofanoNumero: cirugia.quirofano.numero,
          tiempoTranscurridoHoras: tiempoExcedido,
          fechaInicio: cirugia.fechaInicio
        });
      } catch (liberacionError) {
        logger.logError('QUIROFANO_LIBERACION_ERROR', liberacionError, {
          cirugiaId: cirugia.id
        });
        resultados.push({
          cirugiaId: cirugia.id,
          quirofanoNumero: cirugia.quirofano.numero,
          liberado: false,
          error: liberacionError.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        cirugiasLiberadas: resultados.filter(r => r.liberado).length,
        cirugiasConError: resultados.filter(r => !r.liberado).length,
        detalles: resultados,
        duracionMaximaHoras: MAX_CIRUGIA_DURATION_HOURS
      },
      message: resultados.length > 0
        ? `Se procesaron ${resultados.length} cirugías excedidas`
        : 'No hay cirugías que hayan excedido el tiempo máximo'
    });
  } catch (error) {
    logger.logError('LIBERACION_AUTOMATICA_ERROR', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/quirofanos/cirugias/:id - Editar/Reprogramar cirugía
router.put('/cirugias/:id', authenticateToken, auditMiddleware('cirugias'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quirofanoId,
      pacienteId,
      medicoId,
      tipoIntervencion,
      fechaInicio,
      fechaFin,
      observaciones,
      equipoMedico
    } = req.body;

    // Verificar permisos - cajeros, enfermeros, médicos y administradores pueden editar cirugías
    const allowedRoles = ['administrador', 'medico_especialista', 'medico_residente', 'enfermero', 'cajero'];
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar cirugías'
      });
    }

    // Verificar que la cirugía existe
    const cirugiaExistente = await prisma.cirugiaQuirofano.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cirugiaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Cirugía no encontrada'
      });
    }

    // No se puede editar una cirugía completada o cancelada
    if (['completada', 'cancelada'].includes(cirugiaExistente.estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede editar una cirugía ${cirugiaExistente.estado}`
      });
    }

    // Preparar datos de actualización
    const datosActualizacion = {};

    // Validar y actualizar campos si se proporcionan
    if (tipoIntervencion) datosActualizacion.tipoIntervencion = tipoIntervencion;
    if (observaciones !== undefined) datosActualizacion.observaciones = observaciones;
    if (equipoMedico) datosActualizacion.equipoMedico = equipoMedico;

    // Validar paciente si se proporciona
    if (pacienteId && pacienteId !== cirugiaExistente.pacienteId) {
      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(pacienteId) }
      });
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }
      datosActualizacion.pacienteId = parseInt(pacienteId);
    }

    // Validar médico si se proporciona
    if (medicoId && medicoId !== cirugiaExistente.medicoId) {
      const medico = await prisma.empleado.findUnique({
        where: { id: parseInt(medicoId) }
      });
      if (!medico) {
        return res.status(404).json({
          success: false,
          message: 'Médico no encontrado'
        });
      }
      datosActualizacion.medicoId = parseInt(medicoId);
    }

    // Validar fechas y quirófano si se proporcionan (reprogramación)
    const nuevoQuirofanoId = quirofanoId ? parseInt(quirofanoId) : cirugiaExistente.quirofanoId;
    const nuevaFechaInicio = fechaInicio ? new Date(fechaInicio) : cirugiaExistente.fechaInicio;
    const nuevaFechaFin = fechaFin ? new Date(fechaFin) : cirugiaExistente.fechaFin;

    // Si se cambió el quirófano, validar que existe
    if (quirofanoId && quirofanoId !== cirugiaExistente.quirofanoId) {
      const quirofano = await prisma.quirofano.findUnique({
        where: { id: nuevoQuirofanoId }
      });
      if (!quirofano) {
        return res.status(404).json({
          success: false,
          message: 'Quirófano no encontrado'
        });
      }
      datosActualizacion.quirofanoId = nuevoQuirofanoId;
    }

    // Validar fechas si se proporcionan
    if (fechaInicio || fechaFin) {
      // Solo validar fechas futuras si la cirugía no está en progreso
      if (cirugiaExistente.estado !== 'en_progreso') {
        const ahora = new Date();
        if (nuevaFechaInicio < ahora) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio no puede ser una fecha pasada'
          });
        }
      }

      if (nuevaFechaFin <= nuevaFechaInicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // Verificar conflictos con otras cirugías (excluyendo la actual)
      const conflictos = await prisma.cirugiaQuirofano.findMany({
        where: {
          id: { not: parseInt(id) },
          quirofanoId: nuevoQuirofanoId,
          estado: { in: ['programada', 'en_progreso'] },
          OR: [
            {
              fechaInicio: { lt: nuevaFechaFin, gte: nuevaFechaInicio }
            },
            {
              fechaFin: { gt: nuevaFechaInicio, lte: nuevaFechaFin }
            },
            {
              AND: [
                { fechaInicio: { lte: nuevaFechaInicio } },
                { fechaFin: { gte: nuevaFechaFin } }
              ]
            }
          ]
        }
      });

      if (conflictos.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El quirófano ya está reservado para ese horario'
        });
      }

      if (fechaInicio) datosActualizacion.fechaInicio = nuevaFechaInicio;
      if (fechaFin) datosActualizacion.fechaFin = nuevaFechaFin;
    }

    // Si se reprogramó fecha o quirófano, cambiar estado a 'reprogramada' (si estaba programada)
    if ((fechaInicio || fechaFin || quirofanoId) && cirugiaExistente.estado === 'programada') {
      datosActualizacion.estado = 'reprogramada';
    }

    // Actualizar la cirugía
    const cirugiaActualizada = await prisma.cirugiaQuirofano.update({
      where: { id: parseInt(id) },
      data: datosActualizacion,
      include: {
        quirofano: true,
        paciente: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        },
        medico: {
          select: {
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: cirugiaActualizada,
      message: 'Cirugía actualizada exitosamente'
    });
  } catch (error) {
    logger.logError('UPDATE_SURGERY', error, { cirugiaId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;