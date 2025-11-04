// ABOUTME: Comprehensive tests for users.routes.js - CRUD operations, password management, role history, stats

const request = require('supertest');
const express = require('express');
const usersRoutes = require('../../routes/users.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', authenticateToken, usersRoutes);

describe('Users Endpoints', () => {
  let adminUser, adminToken;
  let regularUser, regularToken;

  beforeEach(async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create admin user
    adminUser = await testHelpers.createTestUser({
      username: `admin_users_${timestamp}_${randomSuffix}`,
      rol: 'administrador',
      email: `admin_${timestamp}_${randomSuffix}@test.com`
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, rol: adminUser.rol, id: adminUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create regular user
    regularUser = await testHelpers.createTestUser({
      username: `user_test_${timestamp}_${randomSuffix}`,
      rol: 'enfermero',
      email: `user_${timestamp}_${randomSuffix}@test.com`
    });

    regularToken = jwt.sign(
      { userId: regularUser.id, rol: regularUser.rol, id: regularUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/users', () => {
    it('should get all users with pagination (admin only)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should filter users by search term', async () => {
      const response = await request(app)
        .get(`/api/users?search=admin_users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should filter users by rol', async () => {
      const response = await request(app)
        .get('/api/users?rol=administrador')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should filter users by activo status', async () => {
      const response = await request(app)
        .get('/api/users?activo=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID with role history (admin only)', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', regularUser.id);
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('rol');
      expect(response.body).toHaveProperty('historialRoles');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('no encontrado');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/users', () => {
    const validUserData = {
      username: 'newuser',
      password: 'password123',
      email: 'newuser@test.com',
      nombre: 'New',
      apellidos: 'User',
      telefono: '5551234567',
      rol: 'enfermero'
    };

    it('should create new user with valid data (admin only)', async () => {
      const timestamp = Date.now();
      const userData = {
        ...validUserData,
        username: `newuser_${timestamp}`,
        email: `newuser_${timestamp}@test.com`
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.usuario).toHaveProperty('id');
      expect(response.body.usuario.username).toBe(userData.username);
      expect(response.body.usuario).not.toHaveProperty('passwordHash');
    });

    it('should fail with missing required fields', async () => {
      const incompleteData = {
        username: 'testuser'
        // Missing password and rol
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('requeridos');
    });

    it('should fail with duplicate username', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: adminUser.username,
          password: 'test123',
          rol: 'enfermero'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ya está en uso');
    });

    it('should fail with duplicate email', async () => {
      const timestamp = Date.now();
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `newuser_${timestamp}`,
          password: 'test123',
          email: adminUser.email,
          rol: 'enfermero'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email ya está registrado');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(validUserData);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user data (admin only)', async () => {
      const updateData = {
        nombre: 'Updated Name',
        apellidos: 'Updated Surname',
        telefono: '5559999999'
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.usuario.nombre).toBe(updateData.nombre);
    });

    it('should update password when provided', async () => {
      const newPassword = 'newpassword456';

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: newPassword });

      expect(response.status).toBe(200);

      // Verify password was updated by checking hash
      const updatedUser = await testHelpers.prisma.usuario.findUnique({
        where: { id: regularUser.id }
      });

      const passwordMatches = await bcrypt.compare(newPassword, updatedUser.passwordHash);
      expect(passwordMatches).toBe(true);
    });

    it('should create role history when role changes', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rol: 'medico_especialista' });

      expect(response.status).toBe(200);

      // Check role history was created
      const roleHistory = await testHelpers.prisma.historialRolUsuario.findMany({
        where: { usuarioId: regularUser.id }
      });

      expect(roleHistory.length).toBeGreaterThan(0);
    });

    it('should fail with duplicate username', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: adminUser.username });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ya está en uso');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should deactivate user (soft delete, admin only)', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('desactivado');

      // Verify user is deactivated
      const deactivatedUser = await testHelpers.prisma.usuario.findUnique({
        where: { id: regularUser.id }
      });

      expect(deactivatedUser.activo).toBe(false);
    });

    it('should prevent self-deletion', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('propia cuenta');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id/reactivate', () => {
    beforeEach(async () => {
      // Deactivate user first
      await testHelpers.prisma.usuario.update({
        where: { id: regularUser.id },
        data: { activo: false }
      });
    });

    it('should reactivate inactive user (admin only)', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('reactivado');
      expect(response.body.usuario.activo).toBe(true);
    });

    it('should fail when user is already active', async () => {
      // Reactivate first
      await testHelpers.prisma.usuario.update({
        where: { id: regularUser.id },
        data: { activo: true }
      });

      const response = await request(app)
        .put(`/api/users/${regularUser.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ya está activo');
    });
  });

  describe('PUT /api/users/:id/reset-password', () => {
    it('should reset user password (admin only)', async () => {
      const newPassword = 'resetpassword123';

      const response = await request(app)
        .put(`/api/users/${regularUser.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('reseteada');

      // Verify password was changed
      const updatedUser = await testHelpers.prisma.usuario.findUnique({
        where: { id: regularUser.id }
      });

      const passwordMatches = await bcrypt.compare(newPassword, updatedUser.passwordHash);
      expect(passwordMatches).toBe(true);
      expect(updatedUser.intentosFallidos).toBe(0);
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('al menos 6 caracteres');
    });
  });

  describe('GET /api/users/:id/role-history', () => {
    it('should get role change history (admin only)', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}/role-history`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}/role-history`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/stats/summary', () => {
    it('should get users statistics (admin only)', async () => {
      const response = await request(app)
        .get('/api/users/stats/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsuarios');
      expect(response.body).toHaveProperty('usuariosActivos');
      expect(response.body).toHaveProperty('usuariosInactivos');
      expect(response.body).toHaveProperty('usuariosPorRol');
      expect(response.body).toHaveProperty('usuariosCreados30Dias');
      expect(Array.isArray(response.body.usuariosPorRol)).toBe(true);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/users/stats/summary')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  afterEach(async () => {
    // Clean up role history
    try {
      await testHelpers.prisma.historialRolUsuario.deleteMany({
        where: {
          usuarioId: { in: [adminUser.id, regularUser.id] }
        }
      });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });
});
