const request = require('supertest');
const express = require('express');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth.middleware');
const { auditMiddleware } = require('../../middleware/audit.middleware');
const testHelpers = require('../setupTests');

describe('Middleware Tests', () => {
  let testUser, validToken, invalidToken;

  beforeEach(async () => {
    testUser = await testHelpers.createTestUser({
      username: `testmiddleware_${Date.now()}`,
      rol: 'administrador'
    });

    const jwt = require('jsonwebtoken');
    validToken = jwt.sign(
      { userId: testUser.id, rol: testUser.rol },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    invalidToken = 'invalid.jwt.token';
  });

  describe('Auth Middleware', () => {
    let app;
    let server;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Protected route for testing
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({
          success: true,
          message: 'Access granted',
          user: req.user
        });
      });

      // Public route for comparison
      app.get('/public', (req, res) => {
        res.json({ success: true, message: 'Public access' });
      });

      // Start server
      server = app.listen(0); // Random port
    });

    afterEach((done) => {
      if (server) {
        server.close(done);
      } else {
        done();
      }
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('rol', testUser.rol);
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token inválido');
    });

    it('should deny access with missing token', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should deny access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should deny access with expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id, rol: testUser.rol },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token expirado');
    });

    it('should allow access to public routes without token', async () => {
      const response = await request(app)
        .get('/public');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle inactive user token', async () => {
      // Create inactive user
      const inactiveUser = await testHelpers.createTestUser({
        username: `inactivetest_${Date.now()}`,
        rol: 'administrador',
        activo: false
      });

      const jwt = require('jsonwebtoken');
      const inactiveToken = jwt.sign(
        { userId: inactiveUser.id, rol: inactiveUser.rol },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${inactiveToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Audit Middleware', () => {
    let app;
    let server;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Add auth middleware first (audit depends on user info)
      app.use(authenticateToken);
      app.use(auditMiddleware('test'));

      // Test routes with different operations
      app.post('/test-create', (req, res) => {
        res.status(201).json({ success: true, message: 'Created', data: { id: 1 } });
      });

      app.put('/test-update/:id', (req, res) => {
        res.json({ success: true, message: 'Updated', data: { id: req.params.id } });
      });

      app.delete('/test-delete/:id', (req, res) => {
        res.json({ success: true, message: 'Deleted' });
      });

      app.get('/test-read', (req, res) => {
        res.json({ success: true, data: [] });
      });

      // Start server
      server = app.listen(0); // Random port
    });

    afterEach((done) => {
      if (server) {
        server.close(done);
      } else {
        done();
      }
    });

    it('should not block CREATE operations', async () => {
      const response = await request(app)
        .post('/test-create')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ nombre: 'Test Entity' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Created');
    });

    it('should not block UPDATE operations', async () => {
      const response = await request(app)
        .put('/test-update/123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ nombre: 'Updated Entity' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Updated');
    });

    it('should not block DELETE operations', async () => {
      const response = await request(app)
        .delete('/test-delete/456')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Deleted');
    });

    it('should not block READ operations', async () => {
      const response = await request(app)
        .get('/test-read')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle audit errors gracefully', async () => {
      // Mock prisma error
      const originalCreate = testHelpers.prisma.auditoriaOperacion.create;
      testHelpers.prisma.auditoriaOperacion.create = jest.fn()
        .mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/test-create')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ nombre: 'Test Entity' });

      // Response should still be successful despite audit error
      expect(response.status).toBe(201);

      // Restore original function
      testHelpers.prisma.auditoriaOperacion.create = originalCreate;
    });

    it('should process requests with custom headers', async () => {
      const response = await request(app)
        .post('/test-create')
        .set('Authorization', `Bearer ${validToken}`)
        .set('User-Agent', 'Test-Agent/1.0')
        .send({ nombre: 'Test Entity' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Role-based Authorization', () => {
    let app;
    let server;
    const requireRole = (allowedRoles) => {
      return (req, res, next) => {
        if (!allowedRoles.includes(req.user.rol)) {
          return res.status(403).json({
            success: false,
            message: 'Acceso denegado: permisos insuficientes'
          });
        }
        next();
      };
    };

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(authenticateToken);

      // Admin-only route
      app.get('/admin-only', requireRole(['administrador']), (req, res) => {
        res.json({ success: true, message: 'Admin access granted' });
      });

      // Medical staff route
      app.get('/medical-only', requireRole(['medico_especialista', 'medico_residente']), (req, res) => {
        res.json({ success: true, message: 'Medical access granted' });
      });

      // Multi-role route
      app.get('/multi-role', requireRole(['administrador', 'cajero', 'enfermero']), (req, res) => {
        res.json({ success: true, message: 'Multi-role access granted' });
      });

      // Start server
      server = app.listen(0); // Random port
    });

    afterEach((done) => {
      if (server) {
        server.close(done);
      } else {
        done();
      }
    });

    it('should allow admin access to admin-only routes', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-admin access to admin-only routes', async () => {
      const enfermero = await testHelpers.createTestUser({
        username: `testenfermero_${Date.now()}`,
        rol: 'enfermero'
      });

      const jwt = require('jsonwebtoken');
      const enfermeroToken = jwt.sign(
        { userId: enfermero.id, rol: enfermero.rol },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${enfermeroToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acceso denegado');
    });

    it('should allow medical staff access to medical routes', async () => {
      const doctor = await testHelpers.createTestUser({
        username: `testdoctor_${Date.now()}`,
        rol: 'medico_especialista'
      });

      const jwt = require('jsonwebtoken');
      const doctorToken = jwt.sign(
        { userId: doctor.id, rol: doctor.rol },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/medical-only')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle multi-role authorization correctly', async () => {
      const cajero = await testHelpers.createTestUser({
        username: `testcajero_${Date.now()}`,
        rol: 'cajero'
      });

      const jwt = require('jsonwebtoken');
      const cajeroToken = jwt.sign(
        { userId: cajero.id, rol: cajero.rol },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});