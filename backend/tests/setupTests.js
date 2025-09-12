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
    await prisma.auditoria_operaciones.deleteMany({
      where: {
        usuario_id: { gt: 1000 } // Only delete test users
      }
    });
    
    await prisma.cirugias_quirofano.deleteMany({
      where: {
        medico_id: { gt: 1000 }
      }
    });
    
    await prisma.hospitalizaciones.deleteMany({
      where: {
        paciente_id: { gt: 1000 }
      }
    });
    
    await prisma.transacciones_cuenta.deleteMany({
      where: {
        cuenta_id: { gt: 1000 }
      }
    });
    
    await prisma.cuentas_pacientes.deleteMany({
      where: {
        paciente_id: { gt: 1000 }
      }
    });
    
    await prisma.pacientes.deleteMany({
      where: {
        id: { gt: 1000 }
      }
    });
    
    await prisma.empleados.deleteMany({
      where: {
        id: { gt: 1000 }
      }
    });
    
    await prisma.usuarios.deleteMany({
      where: {
        id: { gt: 1000 }
      }
    });
    
    await prisma.productos.deleteMany({
      where: {
        id: { gt: 1000 }
      }
    });
    
    await prisma.quirofanos.deleteMany({
      where: {
        id: { gt: 1000 }
      }
    });
    
  } catch (error) {
    console.warn('Warning: Error cleaning test data:', error.message);
  }
}

// Helper functions for tests
global.testHelpers = {
  prisma,
  cleanTestData,
  
  createTestUser: async (userData = {}) => {
    return await prisma.usuarios.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        nombreUsuario: userData.nombreUsuario || 'testuser',
        email: userData.email || 'test@test.com', 
        contrasena: userData.contrasena || '$2a$10$hashed.password',
        rol: userData.rol || 'administrador',
        activo: userData.activo !== false,
        ...userData
      }
    });
  },
  
  createTestEmployee: async (employeeData = {}) => {
    return await prisma.empleados.create({
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
    return await prisma.pacientes.create({
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
    return await prisma.productos.create({
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
    return await prisma.proveedores.create({
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
    return await prisma.quirofanos.create({
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