const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware de autenticación centralizado
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  // Para este servidor de prueba, aceptamos cualquier token que empiece con jwt_token_
  if (token.startsWith('jwt_token_')) {
    // Extraer ID del usuario del token mock
    const tokenParts = token.split('_');
    const userId = parseInt(tokenParts[2]);
    req.user = { id: userId };
    next();
  } else {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Middleware opcional de autenticación (para endpoints públicos)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && token.startsWith('jwt_token_')) {
    const tokenParts = token.split('_');
    const userId = parseInt(tokenParts[2]);
    req.user = { id: userId };
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};