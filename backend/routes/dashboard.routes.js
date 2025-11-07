// ABOUTME: Rutas API para dashboard - tabla de ocupación en tiempo real de consultorios, habitaciones y quirófanos

const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');

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
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Desde hoy 00:00
              lte: new Date(new Date().setHours(23, 59, 59, 999)) // Hasta hoy 23:59
            },
            // No filtrar por estado - mostrar todas las citas del día
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
          take: 1, // Solo la cita actual
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
              in: ['en_observacion', 'estable', 'critico'] // Estados activos
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
          take: 1, // Solo la hospitalización actual
          orderBy: { fechaIngreso: 'desc' }
        }
      }
    });

    const habitacionesFormateadas = habitaciones.map(habitacion => {
      const hospitalizacionActual = habitacion.hospitalizaciones[0];
      const paciente = hospitalizacionActual?.cuentaPaciente?.paciente;
      const medico = hospitalizacionActual?.medicoEspecialista;

      // Calcular días hospitalizado
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

    // 3. QUIRÓFANOS
    const quirofanos = await prisma.quirofano.findMany({
      orderBy: { numero: 'asc' },
      include: {
        cirugias: {
          where: {
            OR: [
              {
                // Cirugías en progreso
                estado: 'en_progreso'
              },
              {
                // Cirugías programadas para hoy
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

      // Calcular tiempo transcurrido para cirugía en progreso
      let tiempoTranscurrido = null;
      if (cirugiaEnProgreso) {
        const inicio = new Date(cirugiaEnProgreso.fechaInicio);
        const ahora = new Date();
        const diferencia = ahora - inicio;
        tiempoTranscurrido = Math.floor(diferencia / (1000 * 60)); // minutos
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

    // Respuesta final
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
