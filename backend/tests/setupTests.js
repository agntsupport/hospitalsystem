const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

// Test database configuration
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
  
  // Clean up test data before tests
  await cleanTestData();
});

afterAll(async () => {
  // Clean up test data after tests
  await cleanTestData();
  
  // Close database connection
  await prisma.$disconnect();
});

// Clean test data between test suites
beforeEach(async () => {
  // Reset database to clean state for each test
  await cleanTestData();
});

async function cleanTestData() {
  try {
    // Delete test data in correct order (respecting foreign keys)
    // Using exact Prisma Client model names (camelCase from PascalCase models)

    // Silent catch for each operation - some tables might not exist in test
    try { await prisma.auditoriaOperacion.deleteMany({ where: { usuarioId: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.cirugiaQuirofano.deleteMany({ where: { medicoId: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.notaHospitalizacion.deleteMany({ where: { hospitalizacionId: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.hospitalizacion.deleteMany({ where: { pacienteId: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.cuentaPaciente.deleteMany({ where: { pacienteId: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.paciente.deleteMany({ where: { id: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.empleado.deleteMany({ where: { id: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.usuario.deleteMany({ where: { id: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.producto.deleteMany({ where: { id: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.proveedor.deleteMany({ where: { id: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.quirofano.deleteMany({ where: { id: { gt: 1000 } } }); } catch (e) {}
    try { await prisma.solicitudProductos.deleteMany({ where: { solicitanteId: { gt: 1000 } } }); } catch (e) {}

  } catch (error) {
    console.warn('Warning: Error cleaning test data:', error.message);
  }
}

// Helper functions for tests
global.testHelpers = {
  prisma,
  cleanTestData,
  
  createTestUser: async (userData = {}) => {
    return await prisma.usuario.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        username: userData.username || 'testuser',
        email: userData.email || 'test@test.com',
        passwordHash: userData.passwordHash || '$2a$10$hashed.password',
        rol: userData.rol || 'administrador',
        activo: userData.activo !== false,
        ...userData
      }
    });
  },

  createTestEmployee: async (employeeData = {}) => {
    return await prisma.empleado.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        nombre: employeeData.nombre || 'Test',
        apellidoPaterno: employeeData.apellidoPaterno || 'Employee',
        tipoEmpleado: employeeData.tipoEmpleado || 'medico_especialista',
        cedulaProfesional: employeeData.cedulaProfesional || '12345678',
        especialidad: employeeData.especialidad || 'Test Specialty',
        fechaIngreso: employeeData.fechaIngreso || new Date(),
        activo: employeeData.activo !== false,
        ...employeeData
      }
    });
  },

  createTestPatient: async (patientData = {}) => {
    return await prisma.paciente.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        nombre: patientData.nombre || 'Test',
        apellidoPaterno: patientData.apellidoPaterno || 'Patient',
        fechaNacimiento: patientData.fechaNacimiento || new Date('1990-01-01'),
        genero: patientData.genero || 'M',
        telefono: patientData.telefono || '1234567890',
        ...patientData
      }
    });
  },

  createTestProduct: async (productData = {}) => {
    return await prisma.producto.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        nombre: productData.nombre || 'Test Product',
        precio: productData.precio || 100.00,
        stock: productData.stock || 10,
        stockMinimo: productData.stockMinimo || 5,
        categoria: productData.categoria || 'medicamento',
        ...productData
      }
    });
  },

  createTestSupplier: async (supplierData = {}) => {
    return await prisma.proveedor.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        nombre: supplierData.nombre || 'Test Supplier',
        contacto: supplierData.contacto || 'Test Contact',
        telefono: supplierData.telefono || '5551234567',
        email: supplierData.email || 'test@supplier.com',
        ...supplierData
      }
    });
  },

  createTestQuirofano: async (quirofanoData = {}) => {
    return await prisma.quirofano.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        numero: quirofanoData.numero || Math.floor(Math.random() * 1000) + 1000,
        tipo: quirofanoData.tipo || 'general',
        estado: quirofanoData.estado || 'disponible',
        equipamiento: quirofanoData.equipamiento || 'Equipamiento básico',
        capacidad: quirofanoData.capacidad || 6,
        ubicacion: quirofanoData.ubicacion || 'Piso 2',
        ...quirofanoData
      }
    });
  }
};

module.exports = global.testHelpers;