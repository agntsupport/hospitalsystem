const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

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

    // Generar JWT real
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      rol: user.rol
    };

    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET || 'super_secure_jwt_secret_key_for_hospital_system_2024',
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      fechaRegistro: user.createdAt,
      fechaActualizacion: user.updatedAt
    };

    res.json({ 
      success: true, 
      message: 'Login exitoso',
      data: { user: userResponse, token }
    });

  } catch (error) {
    console.error('Error en login:', error);
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

// GET /verify-token - Verificar token
router.get('/verify-token', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  // Para este servidor de prueba, aceptamos cualquier token que empiece con jwt_token_
  if (token.startsWith('jwt_token_')) {
    res.json({ 
      success: true, 
      message: 'Token válido',
      data: { valid: true }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
});

// GET /profile - Obtener perfil del usuario autenticado
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !token.startsWith('jwt_token_')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado' 
    });
  }

  try {
    // Extraer ID del usuario del token mock
    const tokenParts = token.split('_');
    const userId = parseInt(tokenParts[2]);

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true
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
      fechaActualizacion: user.updatedAt
    };

    res.json({ 
      success: true, 
      message: 'Perfil obtenido correctamente',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

module.exports = router;