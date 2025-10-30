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

    // Generate unique identifiers using timestamp to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const uniqueEmail = userDataWithoutPassword.email || `test${timestamp}_${randomSuffix}@test.com`;
    const uniqueUsername = userDataWithoutPassword.username || `testuser${timestamp}_${randomSuffix}`;

    // Only include ID if explicitly provided
    const createData = {
      username: uniqueUsername,
      email: uniqueEmail,
      passwordHash,
      rol: userDataWithoutPassword.rol || 'administrador',
      activo: userDataWithoutPassword.activo !== false,
      ...userDataWithoutPassword
    };

    // Only set id if explicitly provided in userData
    if (userDataWithoutPassword.id !== undefined) {
      createData.id = userDataWithoutPassword.id;
    }

    return await prisma.usuario.create({
      data: createData
    });
  },

  createTestEmployee: async (employeeData = {}) => {
    // Generate unique cedula using timestamp to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const uniqueCedula = employeeData.cedulaProfesional || `CED${timestamp}${randomSuffix}`;

    const createData = {
      nombre: employeeData.nombre || 'Test',
      apellidoPaterno: employeeData.apellidoPaterno || 'Employee',
      tipoEmpleado: employeeData.tipoEmpleado || 'medico_especialista',
      cedulaProfesional: uniqueCedula,
      especialidad: employeeData.especialidad || 'Test Specialty',
      fechaIngreso: employeeData.fechaIngreso || new Date(),
      activo: employeeData.activo !== false,
      ...employeeData
    };

    // Only set id if explicitly provided
    if (employeeData.id !== undefined) {
      createData.id = employeeData.id;
    }

    return await prisma.empleado.create({
      data: createData
    });
  },

  createTestPatient: async (patientData = {}) => {
    // Generate unique telefono using timestamp to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const uniqueTelefono = patientData.telefono || `555${timestamp % 10000000}`;

    const createData = {
      nombre: patientData.nombre || 'Test',
      apellidoPaterno: patientData.apellidoPaterno || 'Patient',
      fechaNacimiento: patientData.fechaNacimiento || new Date('1990-01-01'),
      genero: patientData.genero || 'M',
      telefono: uniqueTelefono,
      ...patientData
    };

    // Only set id if explicitly provided
    if (patientData.id !== undefined) {
      createData.id = patientData.id;
    }

    return await prisma.paciente.create({
      data: createData
    });
  },

  createTestProduct: async (productData = {}) => {
    // Generate unique codigo using timestamp to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const uniqueCodigo = productData.codigo || `TEST-${timestamp}-${randomSuffix}`;

    const createData = {
      codigo: uniqueCodigo,
      nombre: productData.nombre || 'Test Product',
      categoria: productData.categoria || 'medicamento',
      unidadMedida: productData.unidadMedida || 'pieza',
      precioVenta: productData.precioVenta || productData.precio || 100.00,
      stockActual: productData.stockActual || productData.stock || 10,
      stockMinimo: productData.stockMinimo || 5,
      proveedorId: productData.proveedor_id || productData.proveedorId || null,
      activo: productData.activo !== false
    };

    // Only set id if explicitly provided
    if (productData.id !== undefined) {
      createData.id = productData.id;
    }

    return await prisma.producto.create({
      data: createData
    });
  },

  createTestSupplier: async (supplierData = {}) => {
    // Generate unique email using timestamp to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const uniqueEmail = supplierData.email || supplierData.contactoEmail || `test${timestamp}_${randomSuffix}@supplier.com`;

    const createData = {
      nombreEmpresa: supplierData.nombreEmpresa || supplierData.nombre || 'Test Supplier',
      contactoNombre: supplierData.contactoNombre || supplierData.contacto || 'Test Contact',
      contactoTelefono: supplierData.contactoTelefono || supplierData.telefono || '5551234567',
      contactoEmail: uniqueEmail,
      telefono: supplierData.telefono || '5551234567',
      email: uniqueEmail,
      activo: supplierData.activo !== false
    };

    // Only set id if explicitly provided
    if (supplierData.id !== undefined) {
      createData.id = supplierData.id;
    }

    return await prisma.proveedor.create({
      data: createData
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
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create or use existing patient
    let paciente = accountData.paciente;
    if (!paciente) {
      paciente = await global.testHelpers.createTestPatient({
        nombre: 'Paciente',
        apellidoPaterno: 'Test',
        apellidoMaterno: 'Solicitud'
      });
    }

    // Create cajero usuario if needed
    let cajeroId = accountData.cajeroAperturaId;
    if (!cajeroId) {
      const cajero = await global.testHelpers.createTestUser({
        username: `cajero_test_${timestamp}_${randomSuffix}`,
        rol: 'cajero'
      });
      cajeroId = cajero.id;
    }

    // Create patient account
    const createData = {
      pacienteId: paciente.id,
      tipoAtencion: accountData.tipoAtencion || 'urgencia',
      cajeroAperturaId: cajeroId,
      anticipo: accountData.anticipo || 0,
      totalServicios: accountData.totalServicios || 0,
      totalProductos: accountData.totalProductos || 0,
      totalCuenta: accountData.totalCuenta || 0,
      saldoPendiente: accountData.saldoPendiente || 0,
      fechaApertura: accountData.fechaApertura || new Date()
    };

    // Only set id if explicitly provided
    if (accountData.id !== undefined) {
      createData.id = accountData.id;
    }

    const cuenta = await prisma.cuentaPaciente.create({
      data: createData
    });

    return { cuenta, paciente };
  },

  createTestSolicitud: async (solicitudData = {}) => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create paciente if not provided
    let paciente = solicitudData.paciente;
    if (!paciente) {
      paciente = await global.testHelpers.createTestPatient({
        nombre: 'Paciente',
        apellidoPaterno: 'Solicitud',
        apellidoMaterno: 'Test'
      });
    }

    // Create solicitante (Usuario) if not provided
    let solicitante = solicitudData.solicitante;
    if (!solicitante) {
      // Create usuario for solicitante (enfermero or medico)
      solicitante = await global.testHelpers.createTestUser({
        username: `solicitante_${timestamp}_${randomSuffix}`,
        rol: 'enfermero'
      });
    }

    // Create cajero usuario for cuenta if needed
    const cajero = await global.testHelpers.createTestUser({
      username: `cajero_sol_${timestamp}_${randomSuffix}`,
      rol: 'cajero'
    });

    // Create cuenta paciente if not provided
    let cuenta = solicitudData.cuenta;
    if (!cuenta) {
      cuenta = await prisma.cuentaPaciente.create({
        data: {
          pacienteId: paciente.id,
          tipoAtencion: solicitudData.tipoAtencion || 'hospitalizacion',
          cajeroAperturaId: cajero.id,
          anticipo: 0,
          totalServicios: 0,
          totalProductos: 0,
          totalCuenta: 0,
          saldoPendiente: 0,
          fechaApertura: new Date()
        }
      });
    }

    // Create producto if not provided
    let producto = solicitudData.producto;
    if (!producto) {
      producto = await global.testHelpers.createTestProduct({
        nombre: 'Producto Test Solicitud',
        stockActual: solicitudData.stockActual || 100
      });
    }

    // Create solicitud with correct schema
    const solicitudCreateData = {
      numero: `SP-${timestamp}-${randomSuffix}`,
      pacienteId: paciente.id,
      cuentaPacienteId: cuenta.id,
      solicitanteId: solicitante.id,
      estado: solicitudData.estado || 'SOLICITADO',
      prioridad: solicitudData.prioridad || 'NORMAL',
      observaciones: solicitudData.observaciones || 'Solicitud de prueba',
      fechaSolicitud: solicitudData.fechaSolicitud || new Date()
    };

    // Only set id if explicitly provided
    if (solicitudData.id !== undefined) {
      solicitudCreateData.id = solicitudData.id;
    }

    const solicitud = await prisma.solicitudProductos.create({
      data: solicitudCreateData
    });

    // Create detalle if cantidad and productoId provided
    const cantidad = solicitudData.cantidad || 10;
    await prisma.detalleSolicitudProducto.create({
      data: {
        solicitudId: solicitud.id,
        productoId: producto.id,
        cantidadSolicitada: cantidad,
        estado: 'PENDIENTE'
      }
    });

    return { solicitud, solicitante, paciente, cuenta, producto, cajero };
  },

  cleanSolicitudesTestData: async () => {
    try {
      // Find test users by username pattern
      const testUsers = await prisma.usuario.findMany({
        where: {
          username: {
            contains: '_sol_'
          }
        },
        select: { id: true }
      });
      const testUserIds = testUsers.map(u => u.id);

      if (testUserIds.length === 0) return;

      // Clean in correct order respecting FK constraints
      await prisma.detalleSolicitudProducto.deleteMany({});
      await prisma.historialSolicitud.deleteMany({});
      await prisma.notificacionSolicitud.deleteMany({});
      await prisma.solicitudProductos.deleteMany({
        where: { solicitanteId: { in: testUserIds } }
      });
      await prisma.transaccionCuenta.deleteMany({});
      await prisma.cuentaPaciente.deleteMany({});
      await prisma.movimientoInventario.deleteMany({
        where: { usuarioId: { in: testUserIds } }
      });
      await prisma.producto.deleteMany({
        where: { codigo: { startsWith: 'TEST-' } }
      });
      await prisma.paciente.deleteMany({
        where: { nombre: 'Paciente' }
      });
      await prisma.empleado.deleteMany({});
      await prisma.usuario.deleteMany({
        where: { id: { in: testUserIds } }
      });
    } catch (error) {
      console.warn('Warning: Error cleaning solicitudes test data:', error.message);
    }
  }
};

module.exports = global.testHelpers;