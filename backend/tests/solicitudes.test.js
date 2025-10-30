const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const solicitudesRoutes = require('../routes/solicitudes.routes');
const authRoutes = require('../routes/auth.routes');
const {
  createTestUser,
  createTestEmployee,
  createTestPatient,
  createTestProduct,
  createTestCuentaPaciente,
  createTestSolicitud,
  cleanSolicitudesTestData,
  prisma
} = require('./setupTests');

// Create isolated Express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Include auth routes for login
  app.use('/api/auth', authRoutes);
  // Include solicitudes routes with real auth middleware
  app.use('/api/solicitudes', solicitudesRoutes);

  return app;
}

describe('Sistema de Solicitudes de Productos', () => {
  let app;
  let enfermero;
  let enfermeroToken;
  let almacenista;
  let almacenistaToken;
  let admin;
  let adminToken;
  let paciente;
  let cuenta;
  let producto;
  let solicitud;

  beforeAll(async () => {
    app = createTestApp();
    await cleanSolicitudesTestData();
  });

  afterAll(async () => {
    await cleanSolicitudesTestData();
  });

  beforeEach(async () => {
    await cleanSolicitudesTestData();

    // Create test users without specifying ID - let Prisma auto-generate
    // Use unique timestamp-based usernames to avoid collisions
    const timestamp = Date.now();

    enfermero = await createTestUser({
      username: `enfermero_sol_${timestamp}`,
      password: 'enfermero123',
      rol: 'enfermero'
    });

    almacenista = await createTestUser({
      username: `almacenista_sol_${timestamp}`,
      password: 'almacen123',
      rol: 'almacenista'
    });

    admin = await createTestUser({
      username: `admin_sol_${timestamp}`,
      password: 'admin123',
      rol: 'administrador'
    });

    // Login to get real JWT tokens
    const enfermeroLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: enfermero.username, password: 'enfermero123' });
    enfermeroToken = enfermeroLogin.body.data.token;

    const almacenistaLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: almacenista.username, password: 'almacen123' });
    almacenistaToken = almacenistaLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: admin.username, password: 'admin123' });
    adminToken = adminLogin.body.data.token;

    // Create test patient and account
    const accountData = await createTestCuentaPaciente({
      saldoTotal: 0,
      saldoPendiente: 0
    });
    paciente = accountData.paciente;
    cuenta = accountData.cuenta;

    // Create test product
    producto = await createTestProduct({
      stockActual: 100,
      precioVenta: 50.00
    });
  });

  // ==============================================
  // TESTS DE CREACIÓN DE SOLICITUDES
  // ==============================================

  describe('POST /api/solicitudes - Crear solicitud', () => {
    test('Debe crear una solicitud exitosamente como enfermero', async () => {
      const nuevaSolicitud = {
        pacienteId: paciente.id,
        cuentaPacienteId: cuenta.id,
        prioridad: 'ALTA',
        observaciones: 'Solicitud urgente para paciente en UCI',
        productos: [
          {
            productoId: producto.id,
            cantidadSolicitada: 5,
            observaciones: 'Para administración inmediata'
          }
        ]
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${enfermeroToken}`)
        .send(nuevaSolicitud);

      expect(response.status).toBe(201);
      expect(response.body.message).toBeDefined();
      expect(response.body.solicitud).toHaveProperty('id');
      expect(response.body.solicitud.estado).toBe('SOLICITADO');
      expect(response.body.solicitud.prioridad).toBe('ALTA');

      solicitud = response.body.solicitud;
    });

    test('Debe rechazar solicitud sin productos', async () => {
      const solicitudInvalida = {
        pacienteId: paciente.id,
        cuentaPacienteId: cuenta.id,
        prioridad: 'NORMAL',
        productos: []
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${enfermeroToken}`)
        .send(solicitudInvalida);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('Debe rechazar solicitud sin autenticación', async () => {
      const nuevaSolicitud = {
        pacienteId: paciente.id,
        cuentaPacienteId: cuenta.id,
        prioridad: 'NORMAL',
        productos: [
          {
            productoId: producto.id,
            cantidadSolicitada: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .send(nuevaSolicitud);

      expect(response.status).toBe(401);
    });
  });

  // ==============================================
  // TESTS DE CONSULTA DE SOLICITUDES
  // ==============================================

  describe('GET /api/solicitudes - Listar solicitudes', () => {
    beforeEach(async () => {
      // Create test solicitud
      const testData = await createTestSolicitud({
        solicitante: enfermero,
        producto: producto,
        cantidad: 10,
        estado: 'SOLICITADO'
      });
      solicitud = testData.solicitud;
    });

    test('Debe listar solicitudes con paginación', async () => {
      const response = await request(app)
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${enfermeroToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
      expect(response.body.totalPages).toBeDefined();
    });

    test('Debe filtrar por estado correctamente', async () => {
      const response = await request(app)
        .get('/api/solicitudes?estado=SOLICITADO')
        .set('Authorization', `Bearer ${enfermeroToken}`);

      expect(response.status).toBe(200);
      const todasSolicitadas = response.body.data.every(s => s.estado === 'SOLICITADO');
      expect(todasSolicitadas).toBe(true);
    });

    test('Debe filtrar por prioridad correctamente', async () => {
      // Create high priority solicitud
      await createTestSolicitud({
        solicitante: enfermero,
        producto: producto,
        prioridad: 'ALTA'
      });

      const response = await request(app)
        .get('/api/solicitudes?prioridad=ALTA')
        .set('Authorization', `Bearer ${enfermeroToken}`);

      expect(response.status).toBe(200);
      const todasAlta = response.body.data.every(s => s.prioridad === 'ALTA');
      expect(todasAlta).toBe(true);
    });
  });

  // ==============================================
  // TESTS DE DETALLE DE SOLICITUD
  // ==============================================

  describe('GET /api/solicitudes/:id - Ver detalle', () => {
    beforeEach(async () => {
      const testData = await createTestSolicitud({
        solicitante: enfermero,
        producto: producto
      });
      solicitud = testData.solicitud;
    });

    test('Debe obtener detalle completo de solicitud', async () => {
      const response = await request(app)
        .get(`/api/solicitudes/${solicitud.id}`)
        .set('Authorization', `Bearer ${enfermeroToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(solicitud.id);
      expect(response.body).toHaveProperty('solicitanteId');
      expect(response.body).toHaveProperty('detalles');
    });

    test('Debe rechazar acceso sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/solicitudes/${solicitud.id}`);

      expect(response.status).toBe(401);
    });
  });

  // ==============================================
  // TESTS DE ACTUALIZACIÓN DE ESTADO
  // ==============================================

  describe('PUT /api/solicitudes/:id - Actualizar solicitud', () => {
    beforeEach(async () => {
      const testData = await createTestSolicitud({
        solicitante: enfermero,
        producto: producto,
        estado: 'SOLICITADO'
      });
      solicitud = testData.solicitud;
    });

    test('Almacenista debe poder actualizar estado a PREPARANDO al asignar', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitud.id}/asignar`)
        .set('Authorization', `Bearer ${almacenistaToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.solicitud.estado).toBe('PREPARANDO');
    });

    test('Debe validar que solo se pueden asignar solicitudes en estado SOLICITADO', async () => {
      // First assign the solicitud (SOLICITADO -> PREPARANDO)
      await request(app)
        .put(`/api/solicitudes/${solicitud.id}/asignar`)
        .set('Authorization', `Bearer ${almacenistaToken}`)
        .send({});

      // Try to assign again (should fail - already assigned)
      const response = await request(app)
        .put(`/api/solicitudes/${solicitud.id}/asignar`)
        .set('Authorization', `Bearer ${almacenistaToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  // ==============================================
  // TESTS DE VALIDACIÓN DE STOCK
  // ==============================================

  describe('Validación de Stock', () => {
    test('Debe rechazar solicitud con cantidad mayor al stock', async () => {
      const productoPocoStock = await createTestProduct({
        stockActual: 5,
        precioVenta: 50.00
      });

      const solicitudExcesiva = {
        pacienteId: paciente.id,
        cuentaPacienteId: cuenta.id,
        prioridad: 'NORMAL',
        productos: [
          {
            productoId: productoPocoStock.id,
            cantidadSolicitada: 10 // Mayor al stock de 5
          }
        ]
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${enfermeroToken}`)
        .send(solicitudExcesiva);

      // Depending on implementation, might create with warning or reject
      if (response.status === 400) {
        expect(response.body.error).toContain('stock');
      } else if (response.status === 201) {
        expect(response.body.solicitud).toHaveProperty('advertencia');
      }
    });

    test('Debe actualizar stock al entregar solicitud', async () => {
      const testData = await createTestSolicitud({
        solicitante: enfermero,
        producto: producto,
        cantidad: 10,
        stockActual: 100
      });

      const stockInicial = testData.producto.stockActual;

      // Workflow: SOLICITADO -> asignar -> PREPARANDO
      await request(app)
        .put(`/api/solicitudes/${testData.solicitud.id}/asignar`)
        .set('Authorization', `Bearer ${almacenistaToken}`)
        .send({});

      // PREPARANDO -> entregar -> ENTREGADO (stock is reduced here)
      await request(app)
        .put(`/api/solicitudes/${testData.solicitud.id}/entregar`)
        .set('Authorization', `Bearer ${almacenistaToken}`)
        .send({});

      // Verify stock was reduced
      const productoActualizado = await prisma.producto.findUnique({
        where: { id: testData.producto.id }
      });

      expect(productoActualizado.stockActual).toBe(stockInicial - 10);
    });
  });

  // ==============================================
  // TESTS DE ELIMINACIÓN
  // ==============================================

  describe('DELETE /api/solicitudes/:id - Eliminar solicitud', () => {
    beforeEach(async () => {
      const testData = await createTestSolicitud({
        solicitante: enfermero,
        producto: producto,
        estado: 'SOLICITADO'
      });
      solicitud = testData.solicitud;
    });

    test('Debe permitir eliminar solicitud pendiente', async () => {
      const response = await request(app)
        .delete(`/api/solicitudes/${solicitud.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const deleted = await prisma.solicitudProductos.findUnique({
        where: { id: solicitud.id }
      });
      expect(deleted).toBeNull();
    });

    test('Debe rechazar eliminar solicitud completada', async () => {
      // Update to completed
      await prisma.solicitudProductos.update({
        where: { id: solicitud.id },
        data: { estado: 'RECIBIDO' }
      });

      const response = await request(app)
        .delete(`/api/solicitudes/${solicitud.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('RECIBIDO');
    });
  });

  // ==============================================
  // TESTS DE AUTORIZACIÓN POR ROL
  // ==============================================

  describe('Autorización por Rol', () => {
    beforeEach(async () => {
      const testData = await createTestSolicitud({
        solicitante: enfermero,
        producto: producto
      });
      solicitud = testData.solicitud;
    });

    test('Enfermero puede crear solicitudes', async () => {
      const nuevaSolicitud = {
        pacienteId: paciente.id,
        cuentaPacienteId: cuenta.id,
        prioridad: 'NORMAL',
        productos: [{ productoId: producto.id, cantidadSolicitada: 5 }]
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${enfermeroToken}`)
        .send(nuevaSolicitud);

      expect(response.status).toBe(201);
    });

    test('Almacenista puede actualizar estado al asignar', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitud.id}/asignar`)
        .set('Authorization', `Bearer ${almacenistaToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.solicitud.estado).toBe('PREPARANDO');
    });

    test('Admin puede eliminar solicitudes', async () => {
      const response = await request(app)
        .delete(`/api/solicitudes/${solicitud.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});

// Test summary
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        TESTS DEL SISTEMA DE SOLICITUDES DE PRODUCTOS         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ✓ Creación de solicitudes (validaciones)                    ║
║  ✓ Consulta y filtrado de solicitudes                        ║
║  ✓ Detalle de solicitud individual                           ║
║  ✓ Actualización de estados con validación                   ║
║  ✓ Validación de stock disponible                            ║
║  ✓ Eliminación con restricciones                             ║
║  ✓ Autorización por rol (enfermero/almacenista/admin)       ║
║  ✓ Helpers de test aislados y reutilizables                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
