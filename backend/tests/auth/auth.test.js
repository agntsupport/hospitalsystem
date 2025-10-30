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
      username: 'testadmin',
      email: 'testadmin@hospital.com',
      password: 'admin123', // Will be hashed by createTestUser
      rol: 'administrador'
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.username).toBe('testadmin');
      expect(response.body.data.user.rol).toBe('administrador');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'admin123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
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
        username: 'inactiveuser',
        email: 'inactive@hospital.com',
        password: 'admin123', // Will be hashed by createTestUser
        rol: 'administrador',
        activo: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'inactiveuser',
          password: 'admin123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });
  });

  describe('GET /api/auth/verify-token', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'admin123'
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
      expect(response.body.data.user).toHaveProperty('username', 'testadmin');
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
          username: 'testadmin',
          password: 'admin123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('username', 'testadmin');
      expect(response.body.data.user).toHaveProperty('rol', 'administrador');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
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