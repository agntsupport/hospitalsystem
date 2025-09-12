const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth.routes');
const testHelpers = require('../setupTests');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints', () => {
  let testUser;

  beforeEach(async () => {
    // Create test user for login tests
    testUser = await testHelpers.createTestUser({
      nombreUsuario: 'testadmin',
      email: 'testadmin@hospital.com',
      contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'admin123'
      rol: 'administrador'
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          nombreUsuario: 'testadmin',
          contrasena: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('usuario');
      expect(response.body.data.usuario.nombreUsuario).toBe('testadmin');
      expect(response.body.data.usuario.rol).toBe('administrador');
      expect(response.body.data.usuario).not.toHaveProperty('contrasena');
    });

    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          nombreUsuario: 'nonexistent',
          contrasena: 'admin123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Usuario no encontrado');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          nombreUsuario: 'testadmin',
          contrasena: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contraseña incorrecta');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with inactive user', async () => {
      // Create inactive user
      await testHelpers.createTestUser({
        nombreUsuario: 'inactiveuser',
        email: 'inactive@hospital.com',
        contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        rol: 'administrador',
        activo: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          nombreUsuario: 'inactiveuser',
          contrasena: 'admin123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inactivo');
    });
  });

  describe('GET /api/auth/verify-token', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          nombreUsuario: 'testadmin',
          contrasena: 'admin123'
        });
      
      authToken = loginResponse.body.data.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.usuario).toHaveProperty('nombreUsuario', 'testadmin');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          nombreUsuario: 'testadmin',
          contrasena: 'admin123'
        });
      
      authToken = loginResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('nombreUsuario', 'testadmin');
      expect(response.body.data).toHaveProperty('rol', 'administrador');
      expect(response.body.data).not.toHaveProperty('contrasena');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});