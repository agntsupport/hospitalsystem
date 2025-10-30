const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
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
    // If password is provided (plain text), hash it with bcrypt
    // If passwordHash is provided directly, use it (for legacy tests)
    let passwordHash = userData.passwordHash;
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 10);
    } else if (!passwordHash) {
      // Default test password hashed
      passwordHash = await bcrypt.hash('testpassword123', 10);
    }

    // Remove password from userData to avoid conflicts
    const { password, ...userDataWithoutPassword } = userData;

    // Generate unique email if not provided
    const randomId = 1001 + Math.floor(Math.random() * 10000);
    const uniqueEmail = userDataWithoutPassword.email || `test${randomId}@test.com`;
    const uniqueUsername = userDataWithoutPassword.username || `testuser${randomId}`;

    return await prisma.usuario.create({
      data: {
        id: randomId,
        username: uniqueUsername,
        email: uniqueEmail,
        passwordHash,
        rol: userDataWithoutPassword.rol || 'administrador',
        activo: userDataWithoutPassword.activo !== false,
        ...userDataWithoutPassword
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
    const randomId = 1001 + Math.floor(Math.random() * 1000);
    return await prisma.producto.create({
      data: {
        id: randomId,
        codigo: productData.codigo || `TEST-${randomId}`,
        nombre: productData.nombre || 'Test Product',
        categoria: productData.categoria || 'medicamento',
        unidadMedida: productData.unidadMedida || 'pieza',
        precioVenta: productData.precioVenta || productData.precio || 100.00,
        stockActual: productData.stockActual || productData.stock || 10,
        stockMinimo: productData.stockMinimo || 5,
        proveedorId: productData.proveedor_id || productData.proveedorId || null,
        activo: productData.activo !== false
      }
    });
  },

  createTestSupplier: async (supplierData = {}) => {
    return await prisma.proveedor.create({
      data: {
        id: 1001 + Math.floor(Math.random() * 1000),
        nombreEmpresa: supplierData.nombreEmpresa || supplierData.nombre || 'Test Supplier',
        contactoNombre: supplierData.contactoNombre || supplierData.contacto || 'Test Contact',
        contactoTelefono: supplierData.contactoTelefono || supplierData.telefono || '5551234567',
        contactoEmail: supplierData.contactoEmail || supplierData.email || 'test@supplier.com',
        telefono: supplierData.telefono || '5551234567',
        email: supplierData.email || 'test@supplier.com',
        activo: supplierData.activo !== false
      }
    });
  },

  createTestQuirofano: async (quirofanoData = {}) => {
    // Generate unique numero using timestamp + random to avoid collisions
    const uniqueNumero = quirofanoData.numero || `Q${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return await prisma.quirofano.create({
      data: {
        numero: uniqueNumero,
        tipo: quirofanoData.tipo || 'cirugia_general',
        estado: quirofanoData.estado || 'disponible',
        equipamiento: quirofanoData.equipamiento || 'Equipamiento básico',
        capacidadEquipo: quirofanoData.capacidadEquipo || 6,
        ...quirofanoData
      }
    });
  },

  createTestCuentaPaciente: async (accountData = {}) => {
    const uniqueId = 5000 + Math.floor(Math.random() * 1000);

    // Create or use existing patient
    let paciente = accountData.paciente;
    if (!paciente) {
      paciente = await global.testHelpers.createTestPatient({
        id: uniqueId,
        nombre: 'Paciente',
        apellidoPaterno: 'Test',
        apellidoMaterno: 'Solicitud'
      });
    }

    // Create cajero usuario if needed
    let cajeroId = accountData.cajeroAperturaId;
    if (!cajeroId) {
      const cajero = await global.testHelpers.createTestUser({
        id: uniqueId + 10,
        username: `cajero_test_${uniqueId}`,
        rol: 'cajero'
      });
      cajeroId = cajero.id;
    }

    // Create patient account
    const cuenta = await prisma.cuentaPaciente.create({
      data: {
        id: uniqueId,
        pacienteId: paciente.id,
        tipoAtencion: accountData.tipoAtencion || 'urgencia',
        cajeroAperturaId: cajeroId,
        anticipo: accountData.anticipo || 0,
        totalServicios: accountData.totalServicios || 0,
        totalProductos: accountData.totalProductos || 0,
        totalCuenta: accountData.totalCuenta || 0,
        saldoPendiente: accountData.saldoPendiente || 0,
        fechaApertura: accountData.fechaApertura || new Date()
      }
    });

    return { cuenta, paciente };
  },

  createTestSolicitud: async (solicitudData = {}) => {
    const uniqueId = 6000 + Math.floor(Math.random() * 1000);

    // Create solicitante (empleado) if not provided
    let solicitante = solicitudData.solicitante;
    if (!solicitante) {
      solicitante = await global.testHelpers.createTestEmployee({
        id: uniqueId,
        nombre: 'Empleado',
        apellidoPaterno: 'Test',
        tipoEmpleado: 'almacenista'
      });
    }

    // Create producto if not provided
    let producto = solicitudData.producto;
    if (!producto) {
      producto = await global.testHelpers.createTestProduct({
        id: uniqueId,
        codigo: `TEST-PROD-${uniqueId}`,
        nombre: 'Producto Test',
        stockActual: solicitudData.stockActual || 100
      });
    }

    // Create solicitud
    const solicitud = await prisma.solicitudProductos.create({
      data: {
        id: uniqueId,
        solicitanteId: solicitante.id,
        productoId: producto.id,
        cantidad: solicitudData.cantidad || 10,
        estado: solicitudData.estado || 'pendiente',
        prioridad: solicitudData.prioridad || 'media',
        observaciones: solicitudData.observaciones || 'Solicitud de prueba',
        fechaSolicitud: solicitudData.fechaSolicitud || new Date()
      }
    });

    return { solicitud, solicitante, producto };
  },

  cleanSolicitudesTestData: async () => {
    try {
      // Clean in correct order respecting FK constraints
      await prisma.solicitudProductos.deleteMany({ where: { id: { gte: 5000 } } });
      await prisma.transaccionCuenta.deleteMany({ where: { id: { gte: 5000 } } });
      await prisma.cuentaPaciente.deleteMany({ where: { id: { gte: 5000 } } });
      await prisma.producto.deleteMany({ where: { id: { gte: 5000 } } });
      await prisma.paciente.deleteMany({ where: { id: { gte: 5000 } } });
      await prisma.empleado.deleteMany({ where: { id: { gte: 5000 } } });
      await prisma.usuario.deleteMany({ where: { id: { gte: 5000 } } });
    } catch (error) {
      console.warn('Warning: Error cleaning solicitudes test data:', error.message);
    }
  }
};

module.exports = global.testHelpers;