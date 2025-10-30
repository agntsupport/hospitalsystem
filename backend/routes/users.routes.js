const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', 
  authenticateToken, 
  authorizeRoles(['administrador']),
  async (req, res) => {
    try {
      const { 
        search, 
        rol, 
        activo,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir where clause
      const where = {};
      
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellidos: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (rol) {
        where.rol = rol;
      }

      if (activo !== undefined) {
        where.activo = activo === 'true';
      }

      // Obtener usuarios
      const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
          where,
          select: {
            id: true,
            username: true,
            email: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            rol: true,
            activo: true,
            ultimoAcceso: true,
            intentosFallidos: true,
            createdAt: true,
            updatedAt: true
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.usuario.count({ where })
      ]);

      res.json({
        data: usuarios,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      logger.logError('GET_USERS', error, { filters: req.query });
      res.status(500).json({ 
        error: 'Error al obtener usuarios',
        details: error.message 
      });
    }
  }
);

// GET /api/users/:id - Obtener un usuario específico (solo admin)
router.get('/:id',
  authenticateToken,
  authorizeRoles(['administrador']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          username: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          activo: true,
          ultimoAcceso: true,
          intentosFallidos: true,
          createdAt: true,
          updatedAt: true,
          historialRoles: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(usuario);
    } catch (error) {
      logger.logError('GET_USER_BY_ID', error, { userId: req.params.id });
      res.status(500).json({ 
        error: 'Error al obtener usuario',
        details: error.message 
      });
    }
  }
);

// POST /api/users - Crear nuevo usuario (solo admin)
router.post('/',
  authenticateToken,
  authorizeRoles(['administrador']),
  auditMiddleware('usuarios', 'crear'),
  async (req, res) => {
    try {
      const { 
        username, 
        password, 
        email, 
        nombre, 
        apellidos, 
        telefono, 
        rol 
      } = req.body;

      // Validaciones
      if (!username || !password || !rol) {
        return res.status(400).json({ 
          error: 'Username, password y rol son requeridos' 
        });
      }

      // Verificar si el username ya existe
      const existingUser = await prisma.usuario.findUnique({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'El nombre de usuario ya está en uso' 
        });
      }

      // Verificar email único si se proporciona
      if (email) {
        const existingEmail = await prisma.usuario.findUnique({
          where: { email }
        });
        
        if (existingEmail) {
          return res.status(400).json({ 
            error: 'El email ya está registrado' 
          });
        }
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          username,
          passwordHash,
          email,
          nombre,
          apellidos,
          telefono,
          rol,
          activo: true
        },
        select: {
          id: true,
          username: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          activo: true,
          createdAt: true
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: nuevoUsuario.id,
        datosNuevos: nuevoUsuario
      };

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        usuario: nuevoUsuario
      });
    } catch (error) {
      logger.logError('CREATE_USER', error, { username: req.body.username });
      res.status(500).json({ 
        error: 'Error al crear usuario',
        details: error.message 
      });
    }
  }
);

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put('/:id',
  authenticateToken,
  authorizeRoles(['administrador']),
  auditMiddleware('usuarios', 'actualizar'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        username, 
        email, 
        nombre, 
        apellidos, 
        telefono, 
        rol,
        activo,
        password
      } = req.body;

      // Obtener usuario actual
      const usuarioActual = await prisma.usuario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!usuarioActual) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar username único si cambió
      if (username && username !== usuarioActual.username) {
        const existingUser = await prisma.usuario.findUnique({
          where: { username }
        });
        
        if (existingUser) {
          return res.status(400).json({ 
            error: 'El nombre de usuario ya está en uso' 
          });
        }
      }

      // Verificar email único si cambió
      if (email && email !== usuarioActual.email) {
        const existingEmail = await prisma.usuario.findUnique({
          where: { email }
        });
        
        if (existingEmail) {
          return res.status(400).json({ 
            error: 'El email ya está registrado' 
          });
        }
      }

      // Preparar datos de actualización
      const updateData = {
        ...(username && { username }),
        ...(email !== undefined && { email }),
        ...(nombre !== undefined && { nombre }),
        ...(apellidos !== undefined && { apellidos }),
        ...(telefono !== undefined && { telefono }),
        ...(activo !== undefined && { activo })
      };

      // Si se proporciona nueva contraseña
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      // Si cambió el rol, registrar en historial
      if (rol && rol !== usuarioActual.rol) {
        await prisma.historialRolUsuario.create({
          data: {
            usuarioId: parseInt(id),
            rolAnterior: usuarioActual.rol,
            rolNuevo: rol,
            cambiadoPor: req.user.id,
            razon: req.body.razonCambioRol || 'Actualización de rol por administrador'
          }
        });
        updateData.rol = rol;
      }

      // Actualizar usuario
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          activo: true,
          updatedAt: true
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: usuarioActualizado.id,
        datosAnteriores: usuarioActual,
        datosNuevos: usuarioActualizado
      };

      res.json({
        message: 'Usuario actualizado exitosamente',
        usuario: usuarioActualizado
      });
    } catch (error) {
      logger.logError('UPDATE_USER', error, { userId: req.params.id });
      res.status(500).json({ 
        error: 'Error al actualizar usuario',
        details: error.message 
      });
    }
  }
);

// DELETE /api/users/:id - Desactivar usuario (soft delete, solo admin)
router.delete('/:id',
  authenticateToken,
  authorizeRoles(['administrador']),
  auditMiddleware('usuarios', 'eliminar'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // No permitir auto-eliminación
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ 
          error: 'No puedes desactivar tu propia cuenta' 
        });
      }

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Desactivar usuario (soft delete)
      const usuarioDesactivado = await prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { activo: false }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: usuario,
        datosNuevos: usuarioDesactivado
      };

      res.json({ 
        message: 'Usuario desactivado exitosamente',
        usuario: {
          id: usuarioDesactivado.id,
          username: usuarioDesactivado.username,
          activo: usuarioDesactivado.activo
        }
      });
    } catch (error) {
      logger.logError('DEACTIVATE_USER', error, { userId: req.params.id });
      res.status(500).json({ 
        error: 'Error al desactivar usuario',
        details: error.message 
      });
    }
  }
);

// PUT /api/users/:id/reactivate - Reactivar usuario (solo admin)
router.put('/:id/reactivate',
  authenticateToken,
  authorizeRoles(['administrador']),
  auditMiddleware('usuarios', 'reactivar'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.activo) {
        return res.status(400).json({ error: 'El usuario ya está activo' });
      }

      // Reactivar usuario
      const usuarioReactivado = await prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { 
          activo: true,
          intentosFallidos: 0 // Resetear intentos fallidos
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: usuario,
        datosNuevos: usuarioReactivado
      };

      res.json({ 
        message: 'Usuario reactivado exitosamente',
        usuario: {
          id: usuarioReactivado.id,
          username: usuarioReactivado.username,
          activo: usuarioReactivado.activo
        }
      });
    } catch (error) {
      logger.logError('REACTIVATE_USER', error, { userId: req.params.id });
      res.status(500).json({ 
        error: 'Error al reactivar usuario',
        details: error.message 
      });
    }
  }
);

// PUT /api/users/:id/reset-password - Resetear contraseña (solo admin)
router.put('/:id/reset-password',
  authenticateToken,
  authorizeRoles(['administrador']),
  auditMiddleware('usuarios', 'resetear_password'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'La nueva contraseña debe tener al menos 6 caracteres' 
        });
      }

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Hash de la nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y resetear intentos fallidos
      await prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { 
          passwordHash,
          intentosFallidos: 0
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: { passwordChanged: false },
        datosNuevos: { passwordChanged: true }
      };

      res.json({ 
        message: 'Contraseña reseteada exitosamente'
      });
    } catch (error) {
      logger.logError('RESET_PASSWORD', error, { userId: req.params.id });
      res.status(500).json({ 
        error: 'Error al resetear contraseña',
        details: error.message 
      });
    }
  }
);

// GET /api/users/:id/role-history - Obtener historial de cambios de rol
router.get('/:id/role-history',
  authenticateToken,
  authorizeRoles(['administrador']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const historial = await prisma.historialRolUsuario.findMany({
        where: { usuarioId: parseInt(id) },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json(historial);
    } catch (error) {
      logger.logError('GET_ROLE_HISTORY', error, { userId: req.params.id });
      res.status(500).json({ 
        error: 'Error al obtener historial de roles',
        details: error.message 
      });
    }
  }
);

// GET /api/users/stats - Obtener estadísticas de usuarios (solo admin)
router.get('/stats/summary',
  authenticateToken,
  authorizeRoles(['administrador']),
  async (req, res) => {
    try {
      const [
        totalUsuarios,
        usuariosActivos,
        usuariosPorRol,
        usuariosCreados30Dias
      ] = await Promise.all([
        prisma.usuario.count(),
        prisma.usuario.count({ where: { activo: true } }),
        prisma.usuario.groupBy({
          by: ['rol'],
          _count: true
        }),
        prisma.usuario.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      res.json({
        totalUsuarios,
        usuariosActivos,
        usuariosInactivos: totalUsuarios - usuariosActivos,
        usuariosPorRol: usuariosPorRol.map(item => ({
          rol: item.rol,
          cantidad: item._count
        })),
        usuariosCreados30Dias
      });
    } catch (error) {
      logger.logError('GET_USERS_STATS', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        details: error.message 
      });
    }
  }
);

module.exports = router;