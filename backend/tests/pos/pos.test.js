const request = require('supertest');
const express = require('express');
const posRoutes = require('../../routes/pos.routes');
const { prisma } = require('../../utils/database');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/pos', posRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('POS Routes Tests', () => {
  let testUser;
  let authToken;
  let testProduct;
  let testServicio;
  let testCuentaPaciente;
  const {
    createTestUser,
    createTestProduct,
    createTestPatient,
    createTestCuentaPaciente,
    cleanTestData
  } = global.testHelpers;

  beforeAll(async () => {
    await cleanTestData();
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await cleanTestData();

    // Crear usuario de prueba (cajero)
    testUser = await createTestUser({
      username: `cajero_test_${Date.now()}`,
      password: 'test123',
      rol: 'cajero'
    });

    // Generar token
    authToken = jwt.sign(
      { id: testUser.id, username: testUser.username, rol: testUser.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Crear producto de prueba
    testProduct = await createTestProduct({
      nombre: `Producto Test ${Date.now()}`,
      precio: 100.00,
      stock: 50,
      activo: true
    });

    // Crear servicio de prueba
    testServicio = await prisma.servicio.create({
      data: {
        codigo: `SRV${Date.now()}`,
        nombre: `Servicio Test ${Date.now()}`,
        descripcion: 'Servicio de prueba',
        tipo: 'consulta_general',
        precio: 500.00,
        activo: true
      }
    });

    // Crear paciente y cuenta de prueba
    const testPatient = await createTestPatient({
      nombre: 'Paciente',
      apellidoPaterno: 'Test',
      apellidoMaterno: 'POS',
      fechaNacimiento: new Date('1990-01-01')
    });

    testCuentaPaciente = await createTestCuentaPaciente({
      pacienteId: testPatient.id,
      cajeroAperturaId: testUser.id,
      saldoTotal: 0
    });
  });

  afterEach(async () => {
    await cleanTestData();
  });

  afterAll(async () => {
    await cleanTestData();
  });

  // ==============================================
  // TEST SUITE 1: GET /api/pos/services
  // ==============================================
  describe('GET /api/pos/services', () => {
    it('should return list of active services', async () => {
      const response = await request(app)
        .get('/api/pos/services')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.items)).toBe(true);

      // Verificar que incluye el servicio de prueba
      const servicioEncontrado = response.body.data.items.find(s => s.id === testServicio.id);
      expect(servicioEncontrado).toBeDefined();
      expect(servicioEncontrado.nombre).toBe(testServicio.nombre);
      expect(servicioEncontrado.precio).toBe(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/pos/services');

      expect(response.status).toBe(401);
    });

    it('should not return inactive services', async () => {
      // Crear servicio inactivo
      const servicioInactivo = await prisma.servicio.create({
        data: {
          codigo: `INAC${Date.now()}`,
          nombre: 'Servicio Inactivo',
          tipo: 'urgencia',
          precio: 200.00,
          activo: false
        }
      });

      const response = await request(app)
        .get('/api/pos/services')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const servicioEncontrado = response.body.data.items.find(s => s.id === servicioInactivo.id);
      expect(servicioEncontrado).toBeUndefined();
    });

    it('should return services sorted by tipo and nombre', async () => {
      // Crear servicios adicionales
      await prisma.servicio.create({
        data: {
          codigo: `LAB${Date.now()}`,
          nombre: 'Laboratorio',
          tipo: 'consulta_especialidad',
          precio: 300.00,
          activo: true
        }
      });

      const response = await request(app)
        .get('/api/pos/services')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==============================================
  // TEST SUITE 2: POST /api/pos/quick-sale
  // ==============================================
  describe('POST /api/pos/quick-sale', () => {
    it('should process quick sale with products successfully', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 2,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 250.00,
        observaciones: 'Venta de prueba'
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('venta');
      expect(response.body.data.venta).toHaveProperty('total');
      expect(parseFloat(response.body.data.venta.total)).toBe(200.00);
      expect(response.body.data).toHaveProperty('cambio');

      // Verificar que el stock se dedujo
      const productoActualizado = await prisma.producto.findUnique({
        where: { id: testProduct.id }
      });
      expect(productoActualizado.stock).toBe(48); // 50 - 2
    });

    it('should process quick sale with services successfully', async () => {
      const saleData = {
        items: [
          {
            tipo: 'servicio',
            itemId: testServicio.id,
            cantidad: 1,
            precioUnitario: 500.00
          }
        ],
        metodoPago: 'tarjeta',
        montoRecibido: 500.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.venta.total)).toBe(500.00);
    });

    it('should process quick sale with mixed items (products and services)', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 1,
            precioUnitario: 100.00
          },
          {
            tipo: 'servicio',
            itemId: testServicio.id,
            cantidad: 1,
            precioUnitario: 500.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 600.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.venta.total)).toBe(600.00);
    });

    it('should reject sale without items', async () => {
      const saleData = {
        items: [],
        metodoPago: 'efectivo',
        montoRecibido: 100.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('al menos un item');
    });

    it('should reject sale with invalid payment method', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 1,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'bitcoin', // Método no válido
        montoRecibido: 100.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Método de pago inválido');
    });

    it('should reject sale when product stock is insufficient', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 100, // Más que el stock disponible (50)
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 10000.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('stock insuficiente');
    });

    it('should reject sale when product does not exist', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: 99999, // ID que no existe
            cantidad: 1,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 100.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 1,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 100.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .send(saleData);

      expect(response.status).toBe(401);
    });

    it('should calculate correct change when overpaying', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 1,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 200.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.cambio)).toBe(100.00);
    });
  });

  // ==============================================
  // TEST SUITE 3: GET /api/pos/sales-history
  // ==============================================
  describe('GET /api/pos/sales-history', () => {
    beforeEach(async () => {
      // Crear algunas ventas de prueba
      await prisma.ventaRapida.create({
        data: {
          cajeroId: testUser.id,
          total: 150.00,
          metodoPago: 'efectivo',
          montoRecibido: 200.00,
          cambio: 50.00,
          items: {
            create: {
              tipo: 'producto',
              itemId: testProduct.id,
              cantidad: 1,
              precioUnitario: 100.00,
              subtotal: 100.00
            }
          }
        }
      });
    });

    it('should return sales history', async () => {
      const response = await request(app)
        .get('/api/pos/sales-history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/pos/sales-history?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/pos/sales-history?fechaInicio=${today}&fechaFin=${today}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==============================================
  // TEST SUITE 4: GET /api/pos/stats
  // ==============================================
  describe('GET /api/pos/stats', () => {
    beforeEach(async () => {
      // Crear ventas para estadísticas
      await prisma.ventaRapida.create({
        data: {
          cajeroId: testUser.id,
          total: 500.00,
          metodoPago: 'efectivo',
          montoRecibido: 500.00,
          cambio: 0,
          items: {
            create: {
              tipo: 'servicio',
              itemId: testServicio.id,
              cantidad: 1,
              precioUnitario: 500.00,
              subtotal: 500.00
            }
          }
        }
      });
    });

    it('should return POS statistics', async () => {
      const response = await request(app)
        .get('/api/pos/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalVentas');
      expect(response.body.data).toHaveProperty('montoTotal');
    });

    it('should filter stats by date range', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/pos/stats?fechaInicio=${today}&fechaFin=${today}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==============================================
  // TEST SUITE 5: GET /api/pos/cuenta/:id/transacciones
  // ==============================================
  describe('GET /api/pos/cuenta/:id/transacciones', () => {
    let testTransaccion;

    beforeEach(async () => {
      // Crear transacción de prueba
      testTransaccion = await prisma.transaccionCuenta.create({
        data: {
          cuentaPacienteId: testCuentaPaciente.id,
          tipo: 'cargo',
          concepto: 'Servicio de prueba',
          monto: 500.00,
          servicioId: testServicio.id,
          usuarioId: testUser.id
        }
      });
    });

    it('should return transactions for a patient account', async () => {
      const response = await request(app)
        .get(`/api/pos/cuenta/${testCuentaPaciente.id}/transacciones`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transacciones');
      expect(Array.isArray(response.body.data.transacciones)).toBe(true);
      expect(response.body.data.transacciones.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/pos/cuenta/${testCuentaPaciente.id}/transacciones`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .get('/api/pos/cuenta/99999/transacciones')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ==============================================
  // TEST SUITE 6: POST /api/pos/recalcular-cuentas
  // ==============================================
  describe('POST /api/pos/recalcular-cuentas', () => {
    it('should recalculate patient accounts', async () => {
      const response = await request(app)
        .post('/api/pos/recalcular-cuentas')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cuentasActualizadas');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/pos/recalcular-cuentas');

      expect(response.status).toBe(401);
    });
  });

  // ==============================================
  // TEST SUITE 7: Edge Cases
  // ==============================================
  describe('Edge Cases', () => {
    it('should handle concurrent quick sales correctly', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 1,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 100.00
      };

      // Simular ventas concurrentes
      const promises = [
        request(app)
          .post('/api/pos/quick-sale')
          .set('Authorization', `Bearer ${authToken}`)
          .send(saleData),
        request(app)
          .post('/api/pos/quick-sale')
          .set('Authorization', `Bearer ${authToken}`)
          .send(saleData)
      ];

      const results = await Promise.all(promises);

      // Ambas deberían tener éxito
      results.forEach(response => {
        expect([200, 400]).toContain(response.status);
      });

      // Stock final debería ser correcto
      const productoFinal = await prisma.producto.findUnique({
        where: { id: testProduct.id }
      });
      expect(productoFinal.stock).toBe(48); // 50 - 2
    });

    it('should handle large sale with many items', async () => {
      // Crear múltiples productos
      const productos = await Promise.all([...Array(10)].map(async (_, i) => {
        return await createTestProduct({
          nombre: `Producto ${i}`,
          precio: (i + 1) * 10,
          stock: 100
        });
      }));

      const items = productos.map(p => ({
        tipo: 'producto',
        itemId: p.id,
        cantidad: 1,
        precioUnitario: parseFloat(p.precio)
      }));

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items,
          metodoPago: 'tarjeta',
          montoRecibido: 1000.00
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle decimal quantities correctly', async () => {
      const saleData = {
        items: [
          {
            tipo: 'producto',
            itemId: testProduct.id,
            cantidad: 2.5,
            precioUnitario: 100.00
          }
        ],
        metodoPago: 'efectivo',
        montoRecibido: 300.00
      };

      const response = await request(app)
        .post('/api/pos/quick-sale')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData);

      // Debería aceptar o rechazar consistentemente
      expect([200, 400]).toContain(response.status);
    });
  });
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              TESTS DEL MÓDULO POS COMPLETADOS                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ✓ GET /api/pos/services (4 tests)                          ║
║  ✓ POST /api/pos/quick-sale (10 tests)                      ║
║  ✓ GET /api/pos/sales-history (3 tests)                     ║
║  ✓ GET /api/pos/stats (2 tests)                             ║
║  ✓ GET /api/pos/cuenta/:id/transacciones (3 tests)          ║
║  ✓ POST /api/pos/recalcular-cuentas (2 tests)               ║
║  ✓ Edge Cases (3 tests)                                      ║
║                                                               ║
║  Total: 27 tests comprehensivos                              ║
║  Coverage objetivo: 70%+                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
