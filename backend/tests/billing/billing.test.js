const request = require('supertest');
const express = require('express');
const billingRoutes = require('../../routes/billing.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');
const { prisma } = require('../../utils/database');

const app = express();
app.use(express.json());
app.use('/api/billing', authenticateToken, billingRoutes);

describe('Billing Endpoints', () => {
  let testUser, authToken, testPatient, testAccount;

  beforeEach(async () => {
    const timestamp = Date.now();
    testUser = await testHelpers.createTestUser({
      username: `testadmin_${timestamp}_${Math.floor(Math.random() * 1000)}`,
      rol: 'administrador'
    });

    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUser.id, rol: testUser.rol },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test patient
    testPatient = await testHelpers.createTestPatient({
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García'
    });

    // Create test patient account with transactions
    const { cuenta } = await testHelpers.createTestCuentaPaciente({
      paciente: testPatient,
      totalServicios: 500.00,
      totalProductos: 300.00,
      totalCuenta: 800.00,
      saldoPendiente: 800.00
    });
    testAccount = cuenta;

    // Add transactions to account (services)
    await prisma.transaccionCuenta.create({
      data: {
        cuentaId: testAccount.id,
        tipo: 'servicio',
        concepto: 'Consulta general',
        cantidad: 1,
        precioUnitario: 500.00,
        subtotal: 500.00,
        fechaTransaccion: new Date()
      }
    });

    await prisma.transaccionCuenta.create({
      data: {
        cuentaId: testAccount.id,
        tipo: 'producto',
        concepto: 'Medicamento',
        cantidad: 2,
        precioUnitario: 150.00,
        subtotal: 300.00,
        fechaTransaccion: new Date()
      }
    });
  });

  describe('GET /api/billing/invoices', () => {
    it('should get all invoices with pagination', async () => {
      // Create an invoice first
      await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const response = await request(app)
        .get('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should filter by patient ID', async () => {
      const response = await request(app)
        .get(`/api/billing/invoices?pacienteId=${testPatient.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by invoice status', async () => {
      const response = await request(app)
        .get('/api/billing/invoices?estado=pending')
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
    it('should create a new invoice from patient account', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura).toBeDefined();
      expect(response.body.data.factura.pacienteId).toBe(testPatient.id);
      expect(response.body.data.factura.cuentaId).toBe(testAccount.id);
      expect(parseFloat(response.body.data.factura.subtotal)).toBe(800.00);
      expect(parseFloat(response.body.data.factura.impuestos)).toBe(128.00); // 16% IVA
      expect(parseFloat(response.body.data.factura.total)).toBe(928.00); // 800 + 128
      expect(response.body.data.factura.estado).toBe('pending');
    });

    it('should auto-generate invoice number', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      expect(response.status).toBe(201);
      expect(response.body.data.factura.numeroFactura).toBeDefined();
      expect(response.body.data.factura.numeroFactura).toMatch(/^FAC-\d{6}-\d{4}$/); // Format: FAC-YYYYMM-####
    });

    it('should set due date to 30 days from now', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      expect(response.status).toBe(201);

      const dueDate = new Date(response.body.data.factura.fechaVencimiento);
      const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Allow 1 day tolerance
      expect(Math.abs(dueDate - expectedDate)).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    });

    it('should require cuentaId', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: 999999 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cuenta no encontrada');
    });
  });

  describe('GET /api/billing/invoices/:id', () => {
    it('should get invoice by ID with details', async () => {
      // Create invoice first
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoiceId = createResponse.body.data.factura.id;

      const response = await request(app)
        .get(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura).toBeDefined();
      expect(response.body.data.factura.id).toBe(invoiceId);
      expect(response.body.data.factura.paciente).toBeDefined();
      expect(response.body.data.factura.cuenta).toBeDefined();
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
    it('should update invoice status', async () => {
      // Create invoice first
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoiceId = createResponse.body.data.factura.id;

      const response = await request(app)
        .put(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'cancelled' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura.estado).toBe('cancelled');
    });

    it('should not allow updating paid invoice', async () => {
      // Create invoice and mark as paid
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoiceId = createResponse.body.data.factura.id;

      // Mark as paid first
      await request(app)
        .put(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'paid' });

      // Try to cancel
      const response = await request(app)
        .put(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'cancelled' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pagada');
    });
  });

  describe('GET /api/billing/stats', () => {
    it('should return billing statistics', async () => {
      // Create some invoices first
      await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const response = await request(app)
        .get('/api/billing/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.resumen).toBeDefined();
      expect(response.body.data.distribucion).toBeDefined();
    });
  });

  describe('GET /api/billing/accounts-receivable', () => {
    it('should get accounts receivable summary', async () => {
      const response = await request(app)
        .get('/api/billing/accounts-receivable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalFacturado).toBeDefined();
      expect(response.body.data.totalCobrado).toBeDefined();
      expect(response.body.data.saldoPendiente).toBeDefined();
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/billing/accounts-receivable?fechaInicio=2024-01-01&fechaFin=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by status (pending only)', async () => {
      const response = await request(app)
        .get('/api/billing/accounts-receivable?estado=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/billing/invoices/:id/payments', () => {
    it('should process a full payment', async () => {
      // Create invoice first
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoice = createResponse.body.data.factura;
      const invoiceId = invoice.id;

      const paymentData = {
        monto: parseFloat(invoice.total),
        metodoPago: 'cash',
        referencia: 'PAGO001',
        cajeroId: testUser.id
      };

      const response = await request(app)
        .post(`/api/billing/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.invoice).toBeDefined();
      expect(response.body.data.invoice.estado).toBe('paid');
      expect(parseFloat(response.body.data.invoice.saldoPendiente)).toBe(0);
    });

    it('should process a partial payment', async () => {
      // Create invoice first
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoice = createResponse.body.data.factura;
      const invoiceId = invoice.id;
      const partialAmount = parseFloat(invoice.total) / 2;

      const paymentData = {
        monto: partialAmount,
        metodoPago: 'cash'
      };

      const response = await request(app)
        .post(`/api/billing/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoice.estado).toBe('partial');
      expect(parseFloat(response.body.data.invoice.saldoPendiente)).toBeGreaterThan(0);
    });

    it('should require payment method', async () => {
      // Create invoice first
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoiceId = createResponse.body.data.factura.id;

      const response = await request(app)
        .post(`/api/billing/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ monto: 100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/billing/invoices/:id/payments', () => {
    it('should get payment history for an invoice', async () => {
      // Create invoice and payment
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoiceId = createResponse.body.data.factura.id;

      await request(app)
        .post(`/api/billing/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ monto: 100, metodoPago: 'cash' });

      const response = await request(app)
        .get(`/api/billing/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
      expect(Array.isArray(response.body.data.payments)).toBe(true);
      expect(response.body.data.payments.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/billing/invoices/:id', () => {
    it('should cancel an unpaid invoice', async () => {
      // Create invoice first
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoiceId = createResponse.body.data.factura.id;

      const response = await request(app)
        .delete(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not delete a paid invoice', async () => {
      // Create invoice and mark as paid
      const createResponse = await request(app)
        .post('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cuentaId: testAccount.id });

      const invoice = createResponse.body.data.factura;
      const invoiceId = invoice.id;

      // Pay the invoice
      await request(app)
        .post(`/api/billing/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          monto: parseFloat(invoice.total),
          metodoPago: 'cash'
        });

      const response = await request(app)
        .delete(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
