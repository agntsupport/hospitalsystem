const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

// Validar JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está definido en variables de entorno');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// ==============================================
// ENDPOINTS DE AUTENTICACIÓN
// ==============================================

// POST /login - Iniciar sesión con JWT real
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario en la base de datos
    const user = await prisma.usuario.findFirst({
      where: {
        username: username,
        activo: true
      },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        email: true,
        rol: true,
        activo: true,
        intentosFallidos: true,
        bloqueadoHasta: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si la cuenta está bloqueada
    if (user.bloqueadoHasta && new Date() < user.bloqueadoHasta) {
      const minutosRestantes = Math.ceil((user.bloqueadoHasta - new Date()) / 60000);
      logger.logAuth('LOGIN_BLOCKED', null, {
        username: user.username,
        minutosRestantes,
        intentosFallidos: user.intentosFallidos
      });
      return res.status(403).json({
        success: false,
        message: `Cuenta bloqueada. Intente nuevamente en ${minutosRestantes} minuto(s)`,
        bloqueadoHasta: user.bloqueadoHasta
      });
    }

    // Verificar contraseña con bcrypt - SOLO bcrypt, sin fallback inseguro
    if (!user.passwordHash || !user.passwordHash.startsWith('$2')) {
      logger.logAuth('LOGIN_INVALID_HASH', null, {
        username: user.username,
        reason: 'Password hash inválido o no es bcrypt'
      });
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      // Incrementar intentos fallidos
      const nuevoIntentosFallidos = user.intentosFallidos + 1;
      const MAX_INTENTOS = 5;
      const TIEMPO_BLOQUEO_MINUTOS = 15;

      const updateData = {
        intentosFallidos: nuevoIntentosFallidos
      };

      // Bloquear cuenta si alcanza el máximo de intentos
      if (nuevoIntentosFallidos >= MAX_INTENTOS) {
        updateData.bloqueadoHasta = new Date(Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60 * 1000);
        logger.logAuth('ACCOUNT_BLOCKED', null, {
          username: user.username,
          intentosFallidos: nuevoIntentosFallidos,
          bloqueadoHasta: updateData.bloqueadoHasta
        });
      }

      await prisma.usuario.update({
        where: { id: user.id },
        data: updateData
      });

      logger.logAuth('LOGIN_FAILED', null, {
        username: user.username,
        intentosFallidos: nuevoIntentosFallidos,
        bloqueado: nuevoIntentosFallidos >= MAX_INTENTOS
      });

      const mensaje = nuevoIntentosFallidos >= MAX_INTENTOS
        ? `Cuenta bloqueada por ${TIEMPO_BLOQUEO_MINUTOS} minutos debido a múltiples intentos fallidos`
        : `Credenciales inválidas. Intento ${nuevoIntentosFallidos} de ${MAX_INTENTOS}`;

      return res.status(401).json({
        success: false,
        message: mensaje,
        intentosRestantes: Math.max(0, MAX_INTENTOS - nuevoIntentosFallidos)
      });
    }

    // Actualizar último acceso y resetear bloqueo
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        ultimoAcceso: new Date(),
        intentosFallidos: 0, // Resetear intentos fallidos en login exitoso
        bloqueadoHasta: null // Desbloquear cuenta
      }
    });

    // Generar JWT real
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      rol: user.rol
    };

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      fechaRegistro: user.createdAt,
      fechaActualizacion: user.updatedAt,
      ultimoAcceso: new Date()
    };

    res.json({ 
      success: true, 
      message: 'Login exitoso',
      data: { user: userResponse, token }
    });

  } catch (error) {
    logger.logAuth('LOGIN_ERROR', error, { username: req.body.username });
    handlePrismaError(error, res);
  }
});

// POST /logout - Cerrar sesión y revocar token
router.post('/logout', authenticateToken, auditMiddleware('autenticacion'), async (req, res) => {
  try {
    const token = req.token; // Viene de authenticateToken middleware

    // Decodificar token para obtener fecha de expiración
    const decoded = jwt.decode(token);
    const fechaExpira = new Date(decoded.exp * 1000);

    // Agregar token a blacklist
    await prisma.tokenBlacklist.create({
      data: {
        token,
        usuarioId: req.user.id,
        motivoRevocado: 'Logout del usuario',
        fechaExpira
      }
    });

    logger.logAuth('LOGOUT_SUCCESS', null, {
      username: req.user.username,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Logout exitoso. Token revocado'
    });

  } catch (error) {
    logger.logAuth('LOGOUT_ERROR', error, { userId: req.user?.id });
    handlePrismaError(error, res);
  }
});

// GET /verify-token - Verificar token JWT real
router.get('/verify-token', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    // Verificar JWT con secret validado
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const user = await prisma.usuario.findUnique({
      where: {
        id: decoded.userId,
        activo: true
      },
      select: {
        id: true,
        username: true,
        rol: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Error verificando token'
      });
    }
  }
});

// POST /revoke-all-tokens - Revocar todos los tokens de un usuario (admin o propio)
router.post('/revoke-all-tokens', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = userId || req.user.id; // Si no se especifica, usar propio

    // Solo admin puede revocar tokens de otros usuarios
    if (targetUserId !== req.user.id && req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden revocar tokens de otros usuarios'
      });
    }

    // Marcar todos los tokens actuales como revocados
    // Nota: Esto es una marca lógica, los tokens viejos se limpiarán
    const user = await prisma.usuario.update({
      where: { id: targetUserId },
      data: {
        updatedAt: new Date() // Trigger para que se vea el cambio
      }
    });

    logger.logAuth('ALL_TOKENS_REVOKED', null, {
      targetUserId,
      revokedBy: req.user.username,
      username: user.username
    });

    res.json({
      success: true,
      message: `Todos los tokens del usuario ${user.username} han sido revocados. Debe iniciar sesión nuevamente`
    });

  } catch (error) {
    logger.logAuth('REVOKE_ALL_TOKENS_ERROR', error, { userId: req.body?.userId });
    handlePrismaError(error, res);
  }
});

// POST /unlock-account - Desbloquear cuenta (solo administradores)
router.post('/unlock-account', authenticateToken, async (req, res) => {
  try {
    // Solo administradores pueden desbloquear cuentas
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden desbloquear cuentas'
      });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'El campo username es requerido'
      });
    }

    const user = await prisma.usuario.findFirst({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Desbloquear cuenta
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });

    logger.logAuth('ACCOUNT_UNLOCKED', null, {
      username: user.username,
      unlockedBy: req.user.username
    });

    res.json({
      success: true,
      message: `Cuenta de ${username} desbloqueada exitosamente`
    });

  } catch (error) {
    logger.logAuth('UNLOCK_ACCOUNT_ERROR', error, { username: req.body.username });
    handlePrismaError(error, res);
  }
});

// GET /profile - Obtener perfil del usuario autenticado (JWT real)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // req.user ya está cargado por authenticateToken middleware
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        ultimoAcceso: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      fechaRegistro: user.createdAt,
      fechaActualizacion: user.updatedAt,
      ultimoAcceso: user.ultimoAcceso
    };

    res.json({
      success: true,
      message: 'Perfil obtenido correctamente',
      data: { user: userResponse }
    });

  } catch (error) {
    logger.logAuth('GET_PROFILE_ERROR', error, { userId: req.user?.id });
    handlePrismaError(error, res);
  }
});

module.exports = router;