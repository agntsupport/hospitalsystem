const express = require('express');
const router = express.Router();
const { prisma, handlePrismaError } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// ==============================================
// ENDPOINTS DE AUTENTICACIÓN
// ==============================================

// POST /login - Iniciar sesión
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

    // En un entorno real, aquí verificarías el hash de la contraseña
    // Para este ejemplo, asumimos que las contraseñas coinciden
    if (password === 'admin123' || password === 'cajero123' || password === 'enfermero123' || 
        password === 'medico123' || password === 'residente123' || password === 'almacen123' || 
        password === 'socio123') {
      
      // Generar token mock (en producción usar JWT real)
      const token = `jwt_token_${user.id}_${Date.now()}`;

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
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

  } catch (error) {
    console.error('Error en login:', error);
    handlePrismaError(error, res);
  }
});

// POST /logout - Cerrar sesión
router.post('/logout', (req, res) => {
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