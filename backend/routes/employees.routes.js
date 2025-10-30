const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// ==============================================
// ENDPOINTS DE EMPLEADOS
// ==============================================

// GET /stats - Estadísticas de empleados
router.get('/stats', async (req, res) => {
  try {
    const [
      totalEmpleados,
      empleadosActivos,
      empleadosPorTipo,
      empleadosEspecialistas
    ] = await Promise.all([
      prisma.empleado.count(),
      prisma.empleado.count({ where: { activo: true } }),
      prisma.empleado.groupBy({
        by: ['tipoEmpleado'],
        _count: { tipoEmpleado: true }
      }),
      prisma.empleado.count({
        where: { 
          tipoEmpleado: 'medico_especialista',
          activo: true 
        }
      })
    ]);

    // Formatear distribución por tipo
    const distribucionPorTipo = {};
    empleadosPorTipo.forEach(item => {
      distribucionPorTipo[item.tipoEmpleado] = item._count.tipoEmpleado;
    });

    res.json({
      success: true,
      data: {
        totalEmpleados,
        empleadosActivos,
        empleadosInactivos: totalEmpleados - empleadosActivos,
        distribucionPorTipo,
        empleadosEspecialistas,
        // Calcular métricas adicionales
        tasaActividad: totalEmpleados > 0 ? 
          ((empleadosActivos / totalEmpleados) * 100).toFixed(1) : 0
      },
      message: 'Estadísticas de empleados obtenidas correctamente'
    });

  } catch (error) {
    logger.logError('GET_EMPLOYEES_STATS', error);
    handlePrismaError(error, res);
  }
});

// GET / - Lista de empleados con paginación y filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      tipoEmpleado,
      activo = true,
      especialidad
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Construir filtros
    const where = {};
    
    // Filtro por estado activo (por defecto true)
    if (activo !== undefined) {
      where.activo = activo === 'true' || activo === true;
    }
    
    // Filtro por tipo de empleado
    if (tipoEmpleado) {
      where.tipoEmpleado = tipoEmpleado;
    }
    
    // Filtro por especialidad
    if (especialidad) {
      where.especialidad = { contains: especialidad, mode: 'insensitive' };
    }
    
    // Búsqueda por texto
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellidoPaterno: { contains: search, mode: 'insensitive' } },
        { apellidoMaterno: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { especialidad: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Obtener empleados con paginación
    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { apellidoPaterno: 'asc' },
          { nombre: 'asc' }
        ]
      }),
      prisma.empleado.count({ where })
    ]);
    
    // Formatear empleados para el frontend
    const empleadosFormatted = empleados.map(empleado => ({
      id: empleado.id,
      nombre: empleado.nombre,
      apellidoPaterno: empleado.apellidoPaterno,
      apellidoMaterno: empleado.apellidoMaterno,
      nombreCompleto: `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ''}`.trim(),
      fechaNacimiento: empleado.fechaNacimiento,
      genero: empleado.genero,
      direccion: empleado.direccion,
      turno: empleado.turno,
      tipoEmpleado: empleado.tipoEmpleado,
      especialidad: empleado.especialidad,
      cedulaProfesional: empleado.cedulaProfesional,
      telefono: empleado.telefono,
      email: empleado.email,
      salario: empleado.salario ? parseFloat(empleado.salario) : null,
      fechaIngreso: empleado.fechaIngreso,
      activo: empleado.activo,
      createdAt: empleado.createdAt,
      updatedAt: empleado.updatedAt
    }));
    
    res.json({
      success: true,
      data: {
        items: empleadosFormatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      message: 'Empleados obtenidos correctamente'
    });

  } catch (error) {
    logger.logError('GET_EMPLOYEES', error, { filters: req.query });
    handlePrismaError(error, res);
  }
});

// GET /:id - Obtener empleado por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const empleado = await prisma.empleado.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    // Formatear empleado para el frontend
    const empleadoFormatted = {
      id: empleado.id,
      nombre: empleado.nombre,
      apellidoPaterno: empleado.apellidoPaterno,
      apellidoMaterno: empleado.apellidoMaterno,
      nombreCompleto: `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ''}`.trim(),
      tipoEmpleado: empleado.tipoEmpleado,
      especialidad: empleado.especialidad,
      cedulaProfesional: empleado.cedulaProfesional,
      telefono: empleado.telefono,
      email: empleado.email,
      salario: empleado.salario ? parseFloat(empleado.salario) : null,
      fechaIngreso: empleado.fechaIngreso,
      activo: empleado.activo,
      createdAt: empleado.createdAt,
      updatedAt: empleado.updatedAt
    };
    
    res.json({
      success: true,
      data: empleadoFormatted,
      message: 'Empleado obtenido correctamente'
    });
    
  } catch (error) {
    logger.logError('GET_EMPLOYEE_BY_ID', error, { employeeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// POST / - Crear nuevo empleado y usuario
router.post('/', authenticateToken, auditMiddleware('empleados'), async (req, res) => {
  try {
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      genero,
      direccion,
      turno,
      tipoEmpleado,
      especialidad,
      cedulaProfesional,
      telefono,
      email,
      salario,
      fechaIngreso,
      // Datos de usuario
      username,
      password,
      rol
    } = req.body;
    
    // Validaciones básicas
    if (!nombre || !apellidoPaterno || !tipoEmpleado || !fechaIngreso) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos (nombre, apellidoPaterno, tipoEmpleado, fechaIngreso)'
      });
    }

    // Validaciones para usuario si se proporciona username/password
    if (username || password) {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar tanto nombre de usuario como contraseña'
        });
      }

      // Validar que el username no esté en uso
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { username }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
    }
    
    // Validar que email no esté en uso si se proporciona
    if (email) {
      const empleadoExistente = await prisma.empleado.findFirst({
        where: { email, activo: true }
      });
      
      if (empleadoExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro empleado'
        });
      }
    }
    
    // Validar que cédula no esté en uso si se proporciona
    if (cedulaProfesional) {
      const empleadoExistente = await prisma.empleado.findFirst({
        where: { cedulaProfesional, activo: true }
      });
      
      if (empleadoExistente) {
        return res.status(400).json({
          success: false,
          message: 'La cédula profesional ya está en uso por otro empleado'
        });
      }
    }

    // Usar transacción para crear empleado y usuario
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear empleado
      const nuevoEmpleado = await tx.empleado.create({
        data: {
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          genero: genero || null,
          direccion: direccion || null,
          turno: turno || null,
          tipoEmpleado,
          especialidad,
          cedulaProfesional,
          telefono,
          email,
          salario: salario ? parseFloat(salario) : null,
          fechaIngreso: new Date(fechaIngreso),
          activo: true
        }
      });

      // Si se proporcionan datos de usuario, crear la cuenta
      let nuevoUsuario = null;
      if (username && password) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        nuevoUsuario = await tx.usuario.create({
          data: {
            username,
            password: hashedPassword,
            nombre: `${nombre} ${apellidoPaterno} ${apellidoMaterno || ''}`.trim(),
            email: email || null,
            rol: rol || tipoEmpleado, // Usar el rol proporcionado o el tipo de empleado
            activo: true,
            empleadoId: nuevoEmpleado.id
          }
        });
      }

      return { empleado: nuevoEmpleado, usuario: nuevoUsuario };
    });
    
    res.status(201).json({
      success: true,
      data: resultado.empleado,
      message: `Empleado ${resultado.usuario ? 'y usuario' : ''} creado exitosamente`
    });
    
  } catch (error) {
    logger.logError('CREATE_EMPLOYEE', error, { nombre: req.body.nombre });
    handlePrismaError(error, res);
  }
});

// PUT /:id - Actualizar empleado
router.put('/:id', authenticateToken, auditMiddleware('empleados'), captureOriginalData('empleado'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento,
      genero,
      direccion,
      turno,
      tipoEmpleado,
      especialidad,
      cedulaProfesional,
      telefono,
      email,
      salario,
      fechaIngreso,
      activo
    } = req.body;
    
    // Verificar que el empleado existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!empleadoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    // Validar email único si se está cambiando
    if (email && email !== empleadoExistente.email) {
      const empleadoConEmail = await prisma.empleado.findFirst({
        where: { 
          email, 
          activo: true,
          id: { not: parseInt(id) }
        }
      });
      
      if (empleadoConEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro empleado'
        });
      }
    }
    
    // Validar cédula única si se está cambiando
    if (cedulaProfesional && cedulaProfesional !== empleadoExistente.cedulaProfesional) {
      const empleadoConCedula = await prisma.empleado.findFirst({
        where: { 
          cedulaProfesional, 
          activo: true,
          id: { not: parseInt(id) }
        }
      });
      
      if (empleadoConCedula) {
        return res.status(400).json({
          success: false,
          message: 'La cédula profesional ya está en uso por otro empleado'
        });
      }
    }
    
    // Actualizar empleado
    const empleadoActualizado = await prisma.empleado.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento: fechaNacimiento !== undefined ? (fechaNacimiento ? new Date(fechaNacimiento) : null) : undefined,
        genero: genero !== undefined ? genero : undefined,
        direccion: direccion !== undefined ? direccion : undefined,
        turno: turno !== undefined ? turno : undefined,
        tipoEmpleado,
        especialidad,
        cedulaProfesional,
        telefono,
        email,
        salario: salario ? parseFloat(salario) : null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        activo: activo !== undefined ? activo : undefined
      }
    });
    
    res.json({
      success: true,
      data: empleadoActualizado,
      message: 'Empleado actualizado exitosamente'
    });
    
  } catch (error) {
    logger.logError('UPDATE_EMPLOYEE', error, { employeeId: req.params.id });
    handlePrismaError(error, res);
  }
});

// DELETE /:id - Eliminar empleado (soft delete)
router.delete('/:id', authenticateToken, auditMiddleware('empleados'), criticalOperationAudit, captureOriginalData('empleado'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el empleado existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!empleadoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    // Soft delete - marcar como inactivo
    await prisma.empleado.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
    
    res.json({
      success: true,
      message: 'Empleado desactivado exitosamente'
    });
    
  } catch (error) {
    logger.logError('DEACTIVATE_EMPLOYEE', error, { employeeId: req.params.id });
    handlePrismaError(error, res);
  }
});

module.exports = router;