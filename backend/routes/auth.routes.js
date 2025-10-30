const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

    // Verificar contraseña con bcrypt
    let passwordValid = false;
    
    // Si el password hash empieza con $2, es bcrypt
    if (user.passwordHash && user.passwordHash.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Para migración gradual: verificar contraseñas conocidas y actualizar a bcrypt
      const knownPasswords = {
        'admin123': user.username === 'admin',
        'cajero123': user.username === 'cajero1',
        'enfermero123': user.username === 'enfermero1',
        'medico123': user.username === 'especialista1',
        'residente123': user.username === 'residente1',
        'almacen123': user.username === 'almacen1',
        'socio123': user.username === 'socio1'
      };
      
      if (knownPasswords[password]) {
        passwordValid = true;
        // Actualizar a bcrypt hash
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.usuario.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword }
        });
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Actualizar último acceso
    await prisma.usuario.update({
      where: { id: user.id },
      data: { 
        ultimoAcceso: new Date(),
        intentosFallidos: 0 // Resetear intentos fallidos en login exitoso
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

// POST /logout - Cerrar sesión
router.post('/logout', authenticateToken, auditMiddleware('autenticacion'), (req, res) => {
  // En este servidor simple, el logout es solo del lado del cliente
  // En producción aquí se invalidaría el token en una blacklist
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
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