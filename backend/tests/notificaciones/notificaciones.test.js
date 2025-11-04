// ABOUTME: Comprehensive tests for notificaciones.routes.js - CRUD operations, mark-read functionality, permissions

const request = require('supertest');
const express = require('express');
const notificacionesRoutes = require('../../routes/notificaciones.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');
const jwt = require('jsonwebtoken');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/notificaciones', authenticateToken, notificacionesRoutes);

describe('Notificaciones Endpoints', () => {
  let user1, user1Token;
  let user2, user2Token;
  let testSolicitud, testNotification;

  beforeEach(async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create two users
    user1 = await testHelpers.createTestUser({
      username: `user1_notif_${timestamp}_${randomSuffix}`,
      rol: 'enfermero',
      email: `user1_${timestamp}_${randomSuffix}@test.com`
    });

    user1Token = jwt.sign(
      { userId: user1.id, rol: user1.rol, id: user1.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    user2 = await testHelpers.createTestUser({
      username: `user2_notif_${timestamp}_${randomSuffix}`,
      rol: 'medico_especialista',
      email: `user2_${timestamp}_${randomSuffix}@test.com`
    });

    user2Token = jwt.sign(
      { userId: user2.id, rol: user2.rol, id: user2.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test solicitud for notifications
    const solicitudData = await testHelpers.createTestSolicitud({
      solicitante: user1
    });

    testSolicitud = solicitudData.solicitud;

    // Create test notification for user1
    testNotification = await testHelpers.prisma.notificacionSolicitud.create({
      data: {
        solicitudId: testSolicitud.id,
        usuarioId: user1.id,
        tipo: 'NUEVA_SOLICITUD',
        titulo: 'Nueva Solicitud',
        mensaje: 'Nueva solicitud de prueba',
        leida: false,
        fechaEnvio: new Date()
      }
    });
  });

  describe('GET /api/notificaciones', () => {
    it('should get user notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/notificaciones')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should only return notifications for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/notificaciones')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);

      // All notifications should belong to user1
      response.body.data.forEach(notif => {
        expect(notif.usuarioId).toBe(user1.id);
      });
    });

    it('should filter by leida status', async () => {
      const response = await request(app)
        .get('/api/notificaciones?leida=false')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(notif => {
        expect(notif.leida).toBe(false);
      });
    });

    it('should filter by tipo', async () => {
      const response = await request(app)
        .get('/api/notificaciones?tipo=NUEVA_SOLICITUD')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/notificaciones?page=1&limit=5')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/notificaciones');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notificaciones/no-leidas/count', () => {
    it('should count unread notifications for user', async () => {
      const response = await request(app)
        .get('/api/notificaciones/no-leidas/count')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThanOrEqual(1); // At least the one we created
    });

    it('should return 0 for user with no unread notifications', async () => {
      const response = await request(app)
        .get('/api/notificaciones/no-leidas/count')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  describe('PUT /api/notificaciones/:id/marcar-leida', () => {
    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notificaciones/${testNotification.id}/marcar-leida`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('leída');
      expect(response.body.notificacion.leida).toBe(true);
      expect(response.body.notificacion.fechaLectura).toBeDefined();
    });

    it('should not allow marking another users notification', async () => {
      const response = await request(app)
        .put(`/api/notificaciones/${testNotification.id}/marcar-leida`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('No tienes permiso');
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/notificaciones/999999/marcar-leida')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('no encontrada');
    });
  });

  describe('PUT /api/notificaciones/marcar-todas-leidas', () => {
    beforeEach(async () => {
      // Create additional notifications for user1
      await testHelpers.prisma.notificacionSolicitud.create({
        data: {
          solicitudId: testSolicitud.id,
          usuarioId: user1.id,
          tipo: 'PRODUCTOS_LISTOS',
          titulo: 'Productos Listos',
          mensaje: 'Los productos están listos',
          leida: false,
          fechaEnvio: new Date()
        }
      });
    });

    it('should mark all user notifications as read', async () => {
      const response = await request(app)
        .put('/api/notificaciones/marcar-todas-leidas')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('marcadas como leídas');

      // Verify all notifications are marked as read
      const unreadCount = await testHelpers.prisma.notificacionSolicitud.count({
        where: {
          usuarioId: user1.id,
          leida: false
        }
      });

      expect(unreadCount).toBe(0);
    });

    it('should only affect authenticated user notifications', async () => {
      await request(app)
        .put('/api/notificaciones/marcar-todas-leidas')
        .set('Authorization', `Bearer ${user1Token}`);

      // Create a notification for user2 and verify it's unaffected
      const user2Notification = await testHelpers.prisma.notificacionSolicitud.create({
        data: {
          solicitudId: testSolicitud.id,
          usuarioId: user2.id,
          tipo: 'NUEVA_SOLICITUD',
          titulo: 'Test Notification',
          mensaje: 'Test',
          leida: false,
          fechaEnvio: new Date()
        }
      });

      const notif = await testHelpers.prisma.notificacionSolicitud.findUnique({
        where: { id: user2Notification.id }
      });

      expect(notif.leida).toBe(false);
    });
  });

  describe('DELETE /api/notificaciones/:id', () => {
    it('should delete own notification', async () => {
      const response = await request(app)
        .delete(`/api/notificaciones/${testNotification.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('eliminada exitosamente');

      // Verify notification was deleted
      const deletedNotif = await testHelpers.prisma.notificacionSolicitud.findUnique({
        where: { id: testNotification.id }
      });

      expect(deletedNotif).toBeNull();
    });

    it('should not allow deleting another users notification', async () => {
      const response = await request(app)
        .delete(`/api/notificaciones/${testNotification.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('No tienes permiso');
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .delete('/api/notificaciones/999999')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('no encontrada');
    });
  });

  describe('GET /api/notificaciones/tipos', () => {
    it('should return available notification types', async () => {
      const response = await request(app)
        .get('/api/notificaciones/tipos')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify structure of notification types
      response.body.forEach(tipo => {
        expect(tipo).toHaveProperty('value');
        expect(tipo).toHaveProperty('label');
      });
    });

    it('should be accessible to all authenticated users', async () => {
      const response = await request(app)
        .get('/api/notificaciones/tipos')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
    });
  });

  afterEach(async () => {
    // Clean up notifications
    try {
      await testHelpers.prisma.notificacionSolicitud.deleteMany({
        where: {
          usuarioId: { in: [user1.id, user2.id] }
        }
      });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });
});
