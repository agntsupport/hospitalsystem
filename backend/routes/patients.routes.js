const express = require('express');
const router = express.Router();
const { prisma, calcularEdad, formatPaginationResponse, handlePrismaError } = require('../utils/database');
const { validatePagination, validateRequired } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const { generateExpediente, sanitizeSearch, isValidEmail, isValidCURP } = require('../utils/helpers');
const logger = require('../utils/logger');

// ==============================================
// ENDPOINTS DE PACIENTES
// ==============================================

// GET / - Obtener todos los pacientes con filtros avanzados
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { 
      search,
      genero,
      rangoEdadMin,
      rangoEdadMax,
      ciudad,
      estado,
      soloMenores,
      conContactoEmergencia,
      conSeguroMedico,
      conAlergias,
      estadoCivil,
      ocupacion,
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtros WHERE
    const where = { activo: true };

    // Búsqueda por texto
    if (search) {
      const searchTerm = sanitizeSearch(search);
      where.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { apellidoPaterno: { contains: searchTerm, mode: 'insensitive' } },
        { apellidoMaterno: { contains: searchTerm, mode: 'insensitive' } },
        { numeroExpediente: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Filtros específicos
    if (genero) where.genero = genero;
    if (ciudad) where.ciudad = { contains: ciudad, mode: 'insensitive' };
    if (estado) where.estado = { contains: estado, mode: 'insensitive' };
    if (estadoCivil) where.estadoCivil = estadoCivil;
    if (ocupacion) where.ocupacion = { contains: ocupacion, mode: 'insensitive' };

    // Filtros booleanos
    if (soloMenores === 'true') where.esMenorEdad = true;
    if (conContactoEmergencia === 'true') where.contactoEmergenciaNombre = { not: null };
    if (conSeguroMedico === 'true') where.seguroAseguradora = { not: null };
    if (conAlergias === 'true') where.alergias = { not: null };

    // Ejecutar consulta con paginación
    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.paciente.count({ where })
    ]);

    // Formatear respuesta con edad calculada
    const pacientesFormatted = pacientes.map(paciente => ({
      id: paciente.id,
      numeroExpediente: paciente.numeroExpediente,
      nombre: paciente.nombre,
      apellidoPaterno: paciente.apellidoPaterno,
      apellidoMaterno: paciente.apellidoMaterno,
      nombreCompleto: `${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}`.trim(),
      fechaNacimiento: paciente.fechaNacimiento,
      edad: calcularEdad(paciente.fechaNacimiento),
      genero: paciente.genero,
      tipoSangre: paciente.tipoSangre,
      telefono: paciente.telefono,
      email: paciente.email,
      direccion: paciente.direccion,
      ciudad: paciente.ciudad,
      estado: paciente.estado,
      codigoPostal: paciente.codigoPostal,
      ocupacion: paciente.ocupacion,
      estadoCivil: paciente.estadoCivil,
      religion: paciente.religion,
      alergias: paciente.alergias,
      medicamentosActuales: paciente.medicamentosActuales,
      antecedentesPatologicos: paciente.antecedentesPatologicos,
      antecedentesFamiliares: paciente.antecedentesFamiliares,
      contactoEmergencia: {
        nombre: paciente.contactoEmergenciaNombre,
        relacion: paciente.contactoEmergenciaRelacion,
        telefono: paciente.contactoEmergenciaTelefono
      },
      seguroMedico: {
        aseguradora: paciente.seguroAseguradora,
        numeroPoliza: paciente.seguroNumeroPoliza,
        vigencia: paciente.seguroVigencia
      },
      curp: paciente.curp,
      nss: paciente.nss,
      esMenorEdad: paciente.esMenorEdad,
      responsableId: paciente.responsableId,
      activo: paciente.activo,
      ultimaVisita: paciente.ultimaVisita,
      fechaRegistro: paciente.createdAt,
      fechaActualizacion: paciente.updatedAt
    }));

    res.json(formatPaginationResponse(pacientesFormatted, total, page, limit));

  } catch (error) {
    logger.logError('GET_PATIENTS', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /stats - Estadísticas de pacientes
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPacientes,
      pacientesActivos,
      menoresEdad,
      distribucionGenero,
      conCuentasAbiertas,
      conCuentasHospitalizacion,
      edadesData,
      registrosRecientes
    ] = await Promise.all([
      prisma.paciente.count(),
      prisma.paciente.count({ where: { activo: true } }),
      prisma.paciente.count({ where: { esMenorEdad: true } }),
      prisma.paciente.groupBy({
        by: ['genero'],
        _count: { genero: true }
      }),
      prisma.paciente.count({
        where: {
          cuentas: {
            some: { estado: 'abierta' }
          }
        }
      }),
      prisma.paciente.count({
        where: {
          cuentas: {
            some: { 
              estado: 'abierta',
              tipoAtencion: 'hospitalizacion' 
            }
          }
        }
      }),
      prisma.paciente.findMany({
        select: { 
          id: true, 
          fechaNacimiento: true 
        }
      }),
      prisma.paciente.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      })
    ]);

    // Calcular distribución por edad
    const edades = edadesData.map(p => calcularEdad(p.fechaNacimiento)).filter(edad => edad !== null);
    const promedioEdad = edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0;

    const distribucionEdad = {
      '0-17': edades.filter(edad => edad >= 0 && edad <= 17).length,
      '18-30': edades.filter(edad => edad >= 18 && edad <= 30).length,
      '31-50': edades.filter(edad => edad >= 31 && edad <= 50).length,
      '51-70': edades.filter(edad => edad >= 51 && edad <= 70).length,
      '71+': edades.filter(edad => edad >= 71).length
    };

    res.json({
      success: true,
      data: {
        resumen: {
          totalPacientes,
          pacientesActivos,
          menoresEdad,
          conCuentasAbiertas,
          conCuentasHospitalizacion,
          registrosRecientes,
          promedioEdad: Math.round(promedioEdad * 10) / 10
        },
        distribucion: {
          genero: distribucionGenero.reduce((acc, item) => {
            acc[item.genero] = item._count.genero;
            return acc;
          }, {}),
          edad: distribucionEdad
        }
      },
      message: 'Estadísticas obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_PATIENTS_STATS', error);
    handlePrismaError(error, res);
  }
});

// POST / - Crear nuevo paciente
router.post('/', authenticateToken, auditMiddleware('pacientes'), validateRequired(['nombre', 'apellidoPaterno', 'fechaNacimiento']), async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      genero,
      tipoSangre,
      telefono,
      email,
      direccion,
      ciudad,
      estado,
      codigoPostal,
      ocupacion,
      estadoCivil,
      religion,
      alergias,
      medicamentosActuales,
      antecedentesPatologicos,
      antecedentesFamiliares,
      contactoEmergencia,
      seguroMedico,
      curp,
      nss,
      responsableId
    } = req.body;

    // Validaciones
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    if (curp && !isValidCURP(curp)) {
      return res.status(400).json({
        success: false,
        message: 'CURP inválido'
      });
    }

    // Calcular si es menor de edad
    const edad = calcularEdad(new Date(fechaNacimiento));
    const esMenorEdad = edad !== null && edad < 18;

    // Generar número de expediente único
    const numeroExpediente = await generateExpediente(prisma);

    const paciente = await prisma.paciente.create({
      data: {
        numeroExpediente,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento: new Date(fechaNacimiento),
        genero,
        tipoSangre,
        telefono,
        email,
        direccion,
        ciudad,
        estado,
        codigoPostal,
        ocupacion,
        estadoCivil,
        religion,
        alergias,
        medicamentosActuales,
        antecedentesPatologicos,
        antecedentesFamiliares,
        contactoEmergenciaNombre: contactoEmergencia?.nombre,
        contactoEmergenciaRelacion: contactoEmergencia?.relacion,
        contactoEmergenciaTelefono: contactoEmergencia?.telefono,
        seguroAseguradora: seguroMedico?.aseguradora,
        seguroNumeroPoliza: seguroMedico?.numeroPoliza,
        seguroVigencia: seguroMedico?.vigencia ? new Date(seguroMedico.vigencia) : null,
        curp,
        nss,
        esMenorEdad,
        responsableId,
        activo: true
      }
    });

    // Formatear respuesta
    const pacienteResponse = {
      ...paciente,
      edad: calcularEdad(paciente.fechaNacimiento),
      contactoEmergencia: {
        nombre: paciente.contactoEmergenciaNombre,
        relacion: paciente.contactoEmergenciaRelacion,
        telefono: paciente.contactoEmergenciaTelefono
      },
      seguroMedico: {
        aseguradora: paciente.seguroAseguradora,
        numeroPoliza: paciente.seguroNumeroPoliza,
        vigencia: paciente.seguroVigencia
      }
    };

    res.status(201).json({
      success: true,
      data: { paciente: pacienteResponse },
      message: 'Paciente creado correctamente'
    });

  } catch (error) {
    logger.logError('CREATE_PATIENT', error, {
      nombre: req.body.nombre,
      apellidoPaterno: req.body.apellidoPaterno
    });
    handlePrismaError(error, res);
  }
});

// GET /:id - Obtener paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pacienteId = parseInt(id);

    if (isNaN(pacienteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido'
      });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true
          }
        },
        cuentas: {
          orderBy: { fechaApertura: 'desc' },
          take: 5 // Últimas 5 cuentas
        }
      }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Formatear respuesta
    const pacienteResponse = {
      ...paciente,
      edad: calcularEdad(paciente.fechaNacimiento),
      contactoEmergencia: {
        nombre: paciente.contactoEmergenciaNombre,
        relacion: paciente.contactoEmergenciaRelacion,
        telefono: paciente.contactoEmergenciaTelefono
      },
      seguroMedico: {
        aseguradora: paciente.seguroAseguradora,
        numeroPoliza: paciente.seguroNumeroPoliza,
        vigencia: paciente.seguroVigencia
      }
    };

    res.json({
      success: true,
      data: { paciente: pacienteResponse },
      message: 'Paciente obtenido correctamente'
    });

  } catch (error) {
    logger.logError('GET_PATIENT_BY_ID', error, { pacienteId: req.params.id });
    handlePrismaError(error, res);
  }
});

// PUT /:id - Actualizar paciente
router.put('/:id', authenticateToken, auditMiddleware('pacientes'), captureOriginalData('paciente'), async (req, res) => {
  try {
    const { id } = req.params;
    const pacienteId = parseInt(id);

    if (isNaN(pacienteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido'
      });
    }

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      genero,
      tipoSangre,
      telefono,
      email,
      direccion,
      ciudad,
      estado,
      codigoPostal,
      ocupacion,
      estadoCivil,
      religion,
      alergias,
      medicamentosActuales,
      antecedentesPatologicos,
      antecedentesFamiliares,
      contactoEmergencia,
      seguroMedico,
      curp,
      nss,
      responsableId
    } = req.body;

    // Validaciones
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    if (curp && !isValidCURP(curp)) {
      return res.status(400).json({
        success: false,
        message: 'CURP inválido'
      });
    }

    // Calcular si es menor de edad
    const esMenorEdad = fechaNacimiento ? calcularEdad(new Date(fechaNacimiento)) < 18 : undefined;

    const paciente = await prisma.paciente.update({
      where: { id: pacienteId },
      data: {
        ...(nombre && { nombre }),
        ...(apellidoPaterno && { apellidoPaterno }),
        ...(apellidoMaterno !== undefined && { apellidoMaterno }),
        ...(fechaNacimiento && { 
          fechaNacimiento: new Date(fechaNacimiento),
          esMenorEdad 
        }),
        ...(genero && { genero }),
        ...(tipoSangre && { tipoSangre }),
        ...(telefono && { telefono }),
        ...(email !== undefined && { email }),
        ...(direccion && { direccion }),
        ...(ciudad && { ciudad }),
        ...(estado && { estado }),
        ...(codigoPostal && { codigoPostal }),
        ...(ocupacion && { ocupacion }),
        ...(estadoCivil && { estadoCivil }),
        ...(religion && { religion }),
        ...(alergias !== undefined && { alergias }),
        ...(medicamentosActuales !== undefined && { medicamentosActuales }),
        ...(antecedentesPatologicos !== undefined && { antecedentesPatologicos }),
        ...(antecedentesFamiliares !== undefined && { antecedentesFamiliares }),
        ...(contactoEmergencia && {
          contactoEmergenciaNombre: contactoEmergencia.nombre,
          contactoEmergenciaRelacion: contactoEmergencia.relacion,
          contactoEmergenciaTelefono: contactoEmergencia.telefono
        }),
        ...(seguroMedico && {
          seguroAseguradora: seguroMedico.aseguradora,
          seguroNumeroPoliza: seguroMedico.numeroPoliza,
          seguroVigencia: seguroMedico.vigencia ? new Date(seguroMedico.vigencia) : null
        }),
        ...(curp !== undefined && { curp }),
        ...(nss !== undefined && { nss }),
        ...(responsableId !== undefined && { responsableId })
      }
    });

    // Formatear respuesta
    const pacienteResponse = {
      ...paciente,
      edad: calcularEdad(paciente.fechaNacimiento),
      contactoEmergencia: {
        nombre: paciente.contactoEmergenciaNombre,
        relacion: paciente.contactoEmergenciaRelacion,
        telefono: paciente.contactoEmergenciaTelefono
      },
      seguroMedico: {
        aseguradora: paciente.seguroAseguradora,
        numeroPoliza: paciente.seguroNumeroPoliza,
        vigencia: paciente.seguroVigencia
      }
    };

    res.json({
      success: true,
      data: { paciente: pacienteResponse },
      message: 'Paciente actualizado correctamente'
    });

  } catch (error) {
    logger.logError('UPDATE_PATIENT', error, { pacienteId: req.params.id });
    handlePrismaError(error, res);
  }
});

// DELETE /:id - Eliminar paciente (soft delete)
router.delete('/:id', authenticateToken, auditMiddleware('pacientes'), criticalOperationAudit, captureOriginalData('paciente'), async (req, res) => {
  try {
    const { id } = req.params;
    const pacienteId = parseInt(id);

    if (isNaN(pacienteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido'
      });
    }

    await prisma.paciente.update({
      where: { id: pacienteId },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Paciente eliminado correctamente'
    });

  } catch (error) {
    logger.logError('DELETE_PATIENT', error, { pacienteId: req.params.id });
    handlePrismaError(error, res);
  }
});

module.exports = router;