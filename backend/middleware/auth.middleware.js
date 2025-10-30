const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Validar que JWT_SECRET esté definido al inicio
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está definido en variables de entorno');
  console.error('Por favor defina JWT_SECRET en el archivo .env');
  process.exit(1); // Detener servidor si no hay JWT_SECRET
}

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware de autenticación centralizado con JWT real
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    // Verificar JWT real con secret validado
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Cargar datos completos del usuario desde PostgreSQL
    const user = await prisma.usuario.findUnique({
      where: { 
        id: decoded.userId,
        activo: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        activo: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    
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
      return res.status(401).json({ 
        success: false, 
        message: 'Error de autenticación' 
      });
    }
  }
};

// Middleware opcional de autenticación (para endpoints públicos)
const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'super_secure_jwt_secret_key_for_hospital_system_2024'
      );
      
      const user = await prisma.usuario.findUnique({
        where: { 
          id: decoded.userId,
          activo: true
        },
        select: {
          id: true,
          username: true,
          email: true,
          rol: true,
          activo: true
        }
      });
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // En auth opcional, ignoramos errores de token y continuamos sin usuario
    }
  }
  
  next();
};

// Middleware de autorización por roles
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles
};