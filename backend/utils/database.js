const { PrismaClient } = require('@prisma/client');

// Cliente Prisma singleton
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Función para calcular edad desde fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Función para formatear respuesta de paginación
const formatPaginationResponse = (data, total, page, limit) => {
  return {
    success: true,
    data: {
      items: data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        offset: (page - 1) * limit
      }
    }
  };
};

// Función para manejar errores de Prisma
const handlePrismaError = (error, res) => {
  console.error('Error de base de datos:', error);
  
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'El registro ya existe (violación de unicidad)'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro no encontrado'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = {
  prisma,
  calcularEdad,
  formatPaginationResponse,
  handlePrismaError
};