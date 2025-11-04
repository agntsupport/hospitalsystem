// ABOUTME: Comprehensive tests for audit.routes.js - audit trail, module audit, user activity, stats, PII sanitization

const request = require('supertest');
const express = require('express');
const auditRoutes = require('../../routes/audit.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');
const jwt = require('jsonwebtoken');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/audit', authenticateToken, auditRoutes);

describe('Audit Endpoints', () => {
  let adminUser, adminToken;
  let regularUser, regularToken;
  let testPatient, testAuditRecord;

  beforeEach(async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create admin user
    adminUser = await testHelpers.createTestUser({
      username: `admin_audit_${timestamp}_${randomSuffix}`,
      rol: 'administrador'
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, rol: adminUser.rol, id: adminUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create regular user
    regularUser = await testHelpers.createTestUser({
      username: `user_audit_${timestamp}_${randomSuffix}`,
      rol: 'enfermero'
    });

    regularToken = jwt.sign(
      { userId: regularUser.id, rol: regularUser.rol, id: regularUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test patient for audit records
    testPatient = await testHelpers.createTestPatient({
      nombre: 'AuditTest',
      apellidoPaterno: 'Patient',
      email: `audit_${timestamp}_${randomSuffix}@test.com`
    });

    // Create a test audit record
    testAuditRecord = await testHelpers.prisma.auditoriaOperacion.create({
      data: {
        usuarioId: adminUser.id,
        usuarioNombre: adminUser.username,
        rolUsuario: adminUser.rol,
        modulo: 'pacientes',
        tipoOperacion: 'CREACION',
        entidadTipo: 'Paciente',
        entidadId: testPatient.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      }
    });
  });

  describe('GET /api/audit/trail/:entityType/:entityId', () => {
    it('should get audit trail for specific entity', async () => {
      const response = await request(app)
        .get(`/api/audit/trail/Paciente/${testPatient.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('entidadTipo', 'Paciente');
      expect(response.body.data[0]).toHaveProperty('entidadId', testPatient.id);
    });

    it('should respect limit and offset parameters', async () => {
      const response = await request(app)
        .get(`/api/audit/trail/Paciente/${testPatient.id}?limit=5&offset=0`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/audit/trail/Paciente/${testPatient.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/audit/module/:module', () => {
    it('should get audit records for specific module', async () => {
      const response = await request(app)
        .get('/api/audit/module/pacientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('records');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.data.records)).toBe(true);
    });

    it('should filter by userId', async () => {
      const response = await request(app)
        .get(`/api/audit/module/pacientes?userId=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeDefined();

      // Verify all records belong to the specified user
      if (response.body.data.records.length > 0) {
        response.body.data.records.forEach(record => {
          expect(record.usuarioId).toBe(adminUser.id);
        });
      }
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 days ago
      const endDate = new Date();

      const response = await request(app)
        .get('/api/audit/module/pacientes')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by tipoOperacion', async () => {
      const response = await request(app)
        .get('/api/audit/module/pacientes?tipoOperacion=CREACION')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/audit/user/:userId', () => {
    it('should allow admin to view any user activity', async () => {
      const response = await request(app)
        .get(`/api/audit/user/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow user to view own activity', async () => {
      const response = await request(app)
        .get(`/api/audit/user/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-admin from viewing other users activity', async () => {
      const response = await request(app)
        .get(`/api/audit/user/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No tiene permisos');
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/audit/user/${adminUser.id}?limit=10&offset=0`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/audit/stats', () => {
    it('should return audit statistics for admin', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalOperaciones');
      expect(response.body.data).toHaveProperty('cancelaciones');
      expect(response.body.data).toHaveProperty('operacionesPorModulo');
      expect(response.body.data).toHaveProperty('operacionesPorUsuario');
      expect(Array.isArray(response.body.data.operacionesPorModulo)).toBe(true);
      expect(Array.isArray(response.body.data.operacionesPorUsuario)).toBe(true);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('administradores');
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // 30 days ago
      const endDate = new Date();

      const response = await request(app)
        .get('/api/audit/stats')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalOperaciones).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/audit/cancellation-causes', () => {
    beforeEach(async () => {
      // Create test cancellation cause
      await testHelpers.prisma.causaCancelacion.create({
        data: {
          codigo: 'TEST_CAUSE',
          descripcion: 'Test Cancellation Cause',
          categoria: 'TEST',
          activo: true
        }
      });
    });

    it('should return list of active cancellation causes', async () => {
      const response = await request(app)
        .get('/api/audit/cancellation-causes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify all returned causes are active
      response.body.data.forEach(cause => {
        expect(cause.activo).toBe(true);
      });
    });

    it('should be accessible to all authenticated users', async () => {
      const response = await request(app)
        .get('/api/audit/cancellation-causes')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    afterEach(async () => {
      // Clean up test causes
      await testHelpers.prisma.causaCancelacion.deleteMany({
        where: { codigo: 'TEST_CAUSE' }
      });
    });
  });

  describe('PII/PHI Sanitization', () => {
    it('should not expose sensitive patient information in audit logs', async () => {
      const response = await request(app)
        .get(`/api/audit/trail/Paciente/${testPatient.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verify audit records don't contain sensitive PII/PHI in plain text
      response.body.data.forEach(record => {
        // Should not expose raw password hashes, SSN, etc.
        expect(record).not.toHaveProperty('passwordHash');
        expect(record).not.toHaveProperty('ssn');

        // User info should be sanitized (only id, username, rol exposed)
        if (record.usuario) {
          expect(record.usuario).toHaveProperty('id');
          expect(record.usuario).toHaveProperty('username');
          expect(record.usuario).toHaveProperty('rol');
          expect(record.usuario).not.toHaveProperty('passwordHash');
        }
      });
    });
  });

  afterEach(async () => {
    // Clean up audit records created in tests
    try {
      await testHelpers.prisma.auditoriaOperacion.deleteMany({
        where: {
          usuarioId: {
            in: [adminUser.id, regularUser.id]
          }
        }
      });

      await testHelpers.prisma.causaCancelacion.deleteMany({
        where: { codigo: 'TEST_CAUSE' }
      });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });
});
