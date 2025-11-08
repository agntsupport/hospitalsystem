const { PrismaClient } = require('@prisma/client');

// Cliente Prisma singleton con pool de conexiones optimizado
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
  // Connection pool configurado en schema.prisma
});

// ==============================================
// VALIDACIÓN DE INTEGRIDAD DE CUENTAS
// ==============================================
// NOTA: En Prisma 6.x, el middleware $use fue removido.
// La validación de cuentas cerradas se realiza a nivel de aplicación
// en cada endpoint que crea transacciones.
//
// Endpoints que validan antes de crear transacciones:
// - POST /api/pos/cuentas/:id/items (pos.routes.js)
// - PUT /api/solicitudes/:id/entregar (solicitudes.routes.js)
// - PUT /api/quirofanos/cirugias/:id/estado (quirofanos.routes.js)
// - POST /api/hospitalization/discharge (hospitalization.routes.js)
//
// Esta función auxiliar puede usarse en cualquier lugar donde se necesite
// validar antes de crear transacciones.
async function validateCuentaAbierta(cuentaId) {
  const cuenta = await prisma.cuentaPaciente.findUnique({
    where: { id: parseInt(cuentaId) },
    select: { estado: true, id: true }
  });

  if (!cuenta) {
    throw new Error(`No se puede crear transacción: Cuenta ${cuentaId} no encontrada`);
  }

  if (cuenta.estado === 'cerrada') {
    throw new Error(
      `No se pueden agregar transacciones a la cuenta ${cuentaId}. ` +
      `La cuenta está cerrada y es inmutable.`
    );
  }

  return cuenta;
}

// Manejar cierre graceful de conexiones
process.on('beforeExit', async () => {
  await prisma.$disconnect();
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
  handlePrismaError,
  validateCuentaAbierta
};