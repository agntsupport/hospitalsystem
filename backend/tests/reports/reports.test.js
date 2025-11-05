const request = require('supertest');
const express = require('express');
const reportsRoutes = require('../../routes/reports.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');

const app = express();
app.use(express.json());
app.use('/api/reports', authenticateToken, reportsRoutes);

describe('Reports Endpoints', () => {
  let testUser, authToken;

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
  });

  describe('GET /api/reports/financial', () => {
    it('should get financial report', async () => {
      const response = await request(app)
        .get('/api/reports/financial')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ingresos');
      expect(response.body.data).toHaveProperty('cuentasPorCobrar');
      expect(response.body.data).toHaveProperty('distribucionMetodosPago');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/reports/financial?fechaInicio=2024-01-01&fechaFin=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require admin role (role auth not implemented)', async () => {
      const userToken = await createTokenForRole('cajero');
      const response = await request(app)
        .get('/api/reports/financial')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/reports/operational', () => {
    it('should get operational report', async () => {
      const response = await request(app)
        .get('/api/reports/operational')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('atencionPacientes');
      expect(response.body.data).toHaveProperty('inventario');
      expect(response.body.data).toHaveProperty('ocupacion');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/reports/operational?fechaInicio=2024-01-01&fechaFin=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/inventory', () => {
    it('should get inventory report', async () => {
      const response = await request(app)
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should show low stock items', async () => {
      const response = await request(app)
        .get('/api/reports/inventory?bajoStock=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/patients', () => {
    it('should get patients report', async () => {
      const response = await request(app)
        .get('/api/reports/patients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should group by age range', async () => {
      const response = await request(app)
        .get('/api/reports/patients?groupBy=edad')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should group by gender', async () => {
      const response = await request(app)
        .get('/api/reports/patients?groupBy=genero')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/hospitalization', () => {
    it('should get hospitalization report', async () => {
      const response = await request(app)
        .get('/api/reports/hospitalization')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should show active admissions', async () => {
      const response = await request(app)
        .get('/api/reports/hospitalization?estado=en_observacion')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should calculate average stay duration', async () => {
      const response = await request(app)
        .get('/api/reports/hospitalization?metrics=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('estanciaPromedio');
    });
  });

  describe.skip('GET /api/reports/revenue (endpoint not implemented)', () => {
    it('should get revenue report by period', async () => {
      const response = await request(app)
        .get('/api/reports/revenue?periodo=mensual')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should group by service type', async () => {
      const response = await request(app)
        .get('/api/reports/revenue?groupBy=servicio')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe.skip('GET /api/reports/rooms-occupancy (endpoint not implemented)', () => {
    it('should get rooms occupancy report', async () => {
      const response = await request(app)
        .get('/api/reports/rooms-occupancy')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasaOcupacion');
    });

    it('should group by room type', async () => {
      const response = await request(app)
        .get('/api/reports/rooms-occupancy?groupBy=tipo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe.skip('GET /api/reports/appointments (endpoint not implemented)', () => {
    it('should get appointments report', async () => {
      const response = await request(app)
        .get('/api/reports/appointments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/reports/appointments?estado=confirmada')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe.skip('GET /api/reports/employees (endpoint not implemented)', () => {
    it('should get employees report', async () => {
      const response = await request(app)
        .get('/api/reports/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should group by role', async () => {
      const response = await request(app)
        .get('/api/reports/employees?groupBy=rol')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe.skip('GET /api/reports/services (endpoint not implemented)', () => {
    it('should get services usage report', async () => {
      const response = await request(app)
        .get('/api/reports/services')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should show most requested services', async () => {
      const response = await request(app)
        .get('/api/reports/services?orderBy=cantidad&order=desc')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/executive', () => {
    it('should get executive summary', async () => {
      const response = await request(app)
        .get('/api/reports/executive')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resumenEjecutivo');
      expect(response.body.data.resumenEjecutivo).toHaveProperty('ingresosTotales');
      expect(response.body.data.resumenEjecutivo).toHaveProperty('nuevosPacientes');
    });
  });

  describe.skip('GET /api/reports/audit (endpoint not implemented)', () => {
    it('should get audit report', async () => {
      const response = await request(app)
        .get('/api/reports/audit')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by entity', async () => {
      const response = await request(app)
        .get('/api/reports/audit?entidad=pacientes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by action type', async () => {
      const response = await request(app)
        .get('/api/reports/audit?accion=crear')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe.skip('POST /api/reports/custom (endpoint not implemented)', () => {
    it('should generate custom report', async () => {
      const reportConfig = {
        tipo: 'facturacion',
        campos: ['paciente', 'total', 'fecha'],
        filtros: {
          estado: 'pagada'
        }
      };

      const response = await request(app)
        .post('/api/reports/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportConfig);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe.skip('GET /api/reports/export/:tipo (endpoint not implemented)', () => {
    it('should export report as PDF', async () => {
      const response = await request(app)
        .get('/api/reports/export/financial?format=pdf')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('pdf');
    });

    it('should export report as Excel', async () => {
      const response = await request(app)
        .get('/api/reports/export/financial?format=xlsx')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should export report as CSV', async () => {
      const response = await request(app)
        .get('/api/reports/export/financial?format=csv')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('csv');
    });
  });

  // Helper function
  async function createTokenForRole(rol) {
    const user = await testHelpers.createTestUser({
      username: `user_${Date.now()}_${Math.random()}`,
      rol
    });

    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  }
});
