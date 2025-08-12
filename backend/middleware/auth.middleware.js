const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

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
    // Verificar JWT real
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'super_secure_jwt_secret_key_for_hospital_system_2024'
    );
    
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

module.exports = {
  authenticateToken,
  optionalAuth
};