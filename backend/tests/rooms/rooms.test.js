const request = require('supertest');
const express = require('express');
const roomsRoutes = require('../../routes/rooms.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');
const { prisma } = require('../../utils/database');

const app = express();
app.use(express.json());
app.use('/api/rooms', authenticateToken, roomsRoutes);

describe('Rooms Endpoints', () => {
  let testUser, authToken, testRoom;

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

  describe('GET /api/rooms', () => {
    it('should get rooms list with pagination', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should filter rooms by type', async () => {
      const response = await request(app)
        .get('/api/rooms?tipo=individual')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter rooms by status', async () => {
      const response = await request(app)
        .get('/api/rooms?estado=disponible')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should show only available rooms', async () => {
      const response = await request(app)
        .get('/api/rooms?disponibles=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/rooms?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/rooms', () => {
    it('should create a new room with auto-generated service', async () => {
      const roomData = {
        numero: `TEST-${Date.now()}`,
        tipo: 'individual',
        precioPorDia: 1500.00,
        descripcion: 'Habitación de prueba'
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.habitacion).toBeDefined();
      expect(response.body.data.servicio).toBeDefined();
      expect(response.body.data.servicio.codigo).toBe(`HAB-${roomData.numero}`);

      testRoom = response.body.data.habitacion;
    });

    it('should not allow duplicate room numbers', async () => {
      const roomData = {
        numero: `DUP-${Date.now()}`,
        tipo: 'doble',
        precioPorDia: 2000.00
      };

      // Create first room
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe');
    });

    it('should require room number', async () => {
      const roomData = {
        tipo: 'individual',
        precioPorDia: 1500.00
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require room type', async () => {
      const roomData = {
        numero: `TEST-${Date.now()}`,
        precioPorDia: 1500.00
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require price per day', async () => {
      const roomData = {
        numero: `TEST-${Date.now()}`,
        tipo: 'individual'
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate positive price', async () => {
      const roomData = {
        numero: `TEST-${Date.now()}`,
        tipo: 'individual',
        precioPorDia: -500
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/rooms/:id', () => {
    beforeEach(async () => {
      const roomData = {
        numero: `UPDATE-${Date.now()}`,
        tipo: 'individual',
        precioPorDia: 1200.00
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      testRoom = response.body.data.habitacion;
    });

    it('should update room details', async () => {
      const updateData = {
        numero: testRoom.numero,
        tipo: 'doble',
        precioPorDia: 1800.00,
        descripcion: 'Actualizada'
      };

      const response = await request(app)
        .put(`/api/rooms/${testRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.habitacion.tipo).toBe('doble');
      expect(parseFloat(response.body.data.habitacion.precioPorDia)).toBe(1800.00);
    });

    it('should update room status', async () => {
      const updateData = {
        numero: testRoom.numero,
        tipo: testRoom.tipo,
        precioPorDia: testRoom.precioPorDia,
        estado: 'mantenimiento'
      };

      const response = await request(app)
        .put(`/api/rooms/${testRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.habitacion.estado).toBe('mantenimiento');
    });
  });

  describe('PUT /api/rooms/:id/assign', () => {
    beforeEach(async () => {
      const roomData = {
        numero: `ASSIGN-${Date.now()}`,
        tipo: 'individual',
        precioPorDia: 1500.00
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      testRoom = response.body.data.habitacion;
    });

    it('should assign room to patient', async () => {
      const patient = await testHelpers.createTestPatient({
        nombre: 'Test',
        apellidoPaterno: 'Patient',
        email: `test_${Date.now()}@test.com`
      });

      const response = await request(app)
        .put(`/api/rooms/${testRoom.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pacienteId: patient.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.habitacion.estado).toBe('ocupada');
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    beforeEach(async () => {
      const roomData = {
        numero: `DELETE-${Date.now()}`,
        tipo: 'individual',
        precioPorDia: 1000.00
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      testRoom = response.body.data.habitacion;
    });

    it('should delete available room', async () => {
      const response = await request(app)
        .delete(`/api/rooms/${testRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not delete occupied room', async () => {
      // Mark room as occupied
      await prisma.habitacion.update({
        where: { id: testRoom.id },
        data: { estado: 'ocupada' }
      });

      const response = await request(app)
        .delete(`/api/rooms/${testRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rooms/available-numbers', () => {
    it('should get available room numbers', async () => {
      const response = await request(app)
        .get('/api/rooms/available-numbers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('existingNumbers');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('GET /api/rooms/stats', () => {
    it('should get rooms statistics', async () => {
      const response = await request(app)
        .get('/api/rooms/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('porTipo');
      expect(response.body.data).toHaveProperty('porEstado');
    });
  });
});
