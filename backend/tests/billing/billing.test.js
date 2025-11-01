const request = require('supertest');
const express = require('express');
const billingRoutes = require('../../routes/billing.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/billing', authenticateToken, billingRoutes);

describe('Billing Endpoints', () => {
  let testUser, authToken, testPatient, testInvoice;

  beforeEach(async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create test user
    testUser = await testHelpers.createTestUser({
      username: `testcashier_${timestamp}_${randomSuffix}`,
      rol: 'cajero'
    });

    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUser.id, rol: testUser.rol },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test patient
    testPatient = await testHelpers.createTestPatient({
      nombre: 'Carlos',
      apellidoPaterno: 'Ramírez',
      apellidoMaterno: 'Torres',
      fechaNacimiento: new Date('1980-05-10'),
      genero: 'M',
      email: `carlos.ramirez_${timestamp}_${randomSuffix}@email.com`
    });
  });

  describe('GET /api/billing/invoices', () => {
    it('should get invoices list with pagination', async () => {
      const response = await request(app)
        .get('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should filter invoices by patient ID', async () => {
      const response = await request(app)
        .get(`/api/billing/invoices?pacienteId=${testPatient.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter invoices by status', async () => {
      const response = await request(app)
        .get('/api/billing/invoices?estado=paid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter invoices by date range', async () => {
      const fechaInicio = '2024-01-01';
      const fechaFin = '2024-12-31';

      const response = await request(app)
        .get(`/api/billing/invoices?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/billing/invoices?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/billing/invoices');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/billing/invoices', () => {
    it('should create a new invoice with items', async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Consulta general',
            cantidad: 1,
            precioUnitario: 500.00
          },
          {
            descripcion: 'Medicamento',
            cantidad: 2,
            precioUnitario: 150.00
          }
        ],
        descuento: 0,
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura).toBeDefined();
      expect(response.body.data.factura.total).toBe(800.00);
    });

    it('should calculate total correctly with discount', async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Servicio',
            cantidad: 1,
            precioUnitario: 1000.00
          }
        ],
        descuento: 100.00,
        metodoPago: 'tarjeta'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body.data.factura.subtotal).toBe(1000.00);
      expect(response.body.data.factura.descuento).toBe(100.00);
      expect(response.body.data.factura.total).toBe(900.00);
    });

    it('should require patient ID', async () => {
      const invoiceData = {
        items: [
          {
            descripcion: 'Servicio',
            cantidad: 1,
            precioUnitario: 500.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require at least one item', async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: []
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate item quantities are positive', async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Servicio',
            cantidad: -1,
            precioUnitario: 500.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate prices are positive', async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Servicio',
            cantidad: 1,
            precioUnitario: -500.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/billing/invoices/:id', () => {
    beforeEach(async () => {
      // Create a test invoice
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Test Service',
            cantidad: 1,
            precioUnitario: 750.00
          }
        ],
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      testInvoice = response.body.data.factura;
    });

    it('should get invoice by ID with details', async () => {
      const response = await request(app)
        .get(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura.id).toBe(testInvoice.id);
      expect(response.body.data.factura.items).toBeDefined();
    });

    it('should return 404 for non-existent invoice', async () => {
      const response = await request(app)
        .get('/api/billing/invoices/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/billing/invoices/:id', () => {
    beforeEach(async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Original Service',
            cantidad: 1,
            precioUnitario: 500.00
          }
        ],
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      testInvoice = response.body.data.factura;
    });

    it('should update invoice status', async () => {
      const updateData = {
        estado: 'cancelled'
      };

      const response = await request(app)
        .put(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura.estado).toBe('cancelled');
    });

    it('should not allow updating paid invoice', async () => {
      // First mark as paid
      await request(app)
        .put(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'paid' });

      // Try to update again
      const response = await request(app)
        .put(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'cancelled' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/billing/stats', () => {
    it('should return billing statistics', async () => {
      const response = await request(app)
        .get('/api/billing/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalFacturas');
      expect(response.body.data).toHaveProperty('totalCobrado');
      expect(response.body.data).toHaveProperty('facturasPendientes');
    });

    it('should filter stats by date range', async () => {
      const response = await request(app)
        .get('/api/billing/stats?fechaInicio=2024-01-01&fechaFin=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/billing/accounts-receivable', () => {
    it('should get accounts receivable list', async () => {
      const response = await request(app)
        .get('/api/billing/accounts-receivable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter accounts by status', async () => {
      const response = await request(app)
        .get('/api/billing/accounts-receivable?estado=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/billing/payments', () => {
    beforeEach(async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Service to Pay',
            cantidad: 1,
            precioUnitario: 1000.00
          }
        ],
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      testInvoice = response.body.data.factura;
    });

    it('should process a full payment', async () => {
      const paymentData = {
        facturaId: testInvoice.id,
        monto: 1000.00,
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pago.monto).toBe(1000.00);
    });

    it('should process a partial payment', async () => {
      const paymentData = {
        facturaId: testInvoice.id,
        monto: 500.00,
        metodoPago: 'tarjeta'
      };

      const response = await request(app)
        .post('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pago.monto).toBe(500.00);
    });

    it('should not accept payment greater than invoice total', async () => {
      const paymentData = {
        facturaId: testInvoice.id,
        monto: 2000.00,
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require payment method', async () => {
      const paymentData = {
        facturaId: testInvoice.id,
        monto: 500.00
      };

      const response = await request(app)
        .post('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/billing/payments/:facturaId', () => {
    beforeEach(async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Service with Payments',
            cantidad: 1,
            precioUnitario: 1500.00
          }
        ],
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      testInvoice = response.body.data.factura;

      // Make a payment
      await request(app)
        .post('/api/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          facturaId: testInvoice.id,
          monto: 750.00,
          metodoPago: 'efectivo'
        });
    });

    it('should get payment history for an invoice', async () => {
      const response = await request(app)
        .get(`/api/billing/payments/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/billing/invoices/:id', () => {
    beforeEach(async () => {
      const invoiceData = {
        pacienteId: testPatient.id,
        items: [
          {
            descripcion: 'Service to Delete',
            cantidad: 1,
            precioUnitario: 300.00
          }
        ],
        metodoPago: 'efectivo'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData);

      testInvoice = response.body.data.factura;
    });

    it('should delete (cancel) an unpaid invoice', async () => {
      const response = await request(app)
        .delete(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not delete a paid invoice', async () => {
      // Mark as paid first
      await request(app)
        .put(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'pagada' });

      // Try to delete
      const response = await request(app)
        .delete(`/api/billing/invoices/${testInvoice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
