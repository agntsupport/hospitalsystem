// ABOUTME: Comprehensive tests for offices.routes.js - CRUD operations, state management, unique numero validation

const request = require('supertest');
const express = require('express');
const officesRoutes = require('../../routes/offices.routes');
const testHelpers = require('../setupTests');

// Create test app (no authentication middleware for this module)
const app = express();
app.use(express.json());
app.use('/api/offices', officesRoutes);

describe('Offices Endpoints', () => {
  let testOffice;

  beforeEach(async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);

    // Create test office
    testOffice = await testHelpers.prisma.consultorio.create({
      data: {
        numero: `TEST-${timestamp}-${randomSuffix}`,
        tipo: 'consulta_general',
        especialidad: 'Medicina General',
        estado: 'disponible',
        descripcion: 'Consultorio de prueba'
      }
    });
  });

  describe('GET /api/offices/stats', () => {
    it('should return office statistics', async () => {
      const response = await request(app)
        .get('/api/offices/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data).toHaveProperty('occupied');
      expect(response.body.data).toHaveProperty('maintenance');
      expect(response.body.data).toHaveProperty('distribution');
    });

    it('should return correct counts for office states', async () => {
      const response = await request(app)
        .get('/api/offices/stats');

      expect(response.status).toBe(200);
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.available).toBe('number');
      expect(typeof response.body.data.occupied).toBe('number');
      expect(typeof response.body.data.maintenance).toBe('number');
    });
  });

  describe('GET /api/offices', () => {
    it('should get all offices with pagination', async () => {
      const response = await request(app)
        .get('/api/offices');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by especialidad', async () => {
      const response = await request(app)
        .get('/api/offices?especialidad=Medicina General');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by estado', async () => {
      const response = await request(app)
        .get('/api/offices?estado=disponible');

      expect(response.status).toBe(200);
      response.body.data.items.forEach(office => {
        expect(office.estado).toBe('disponible');
      });
    });

    it('should filter disponibles only', async () => {
      const response = await request(app)
        .get('/api/offices?disponibles=true');

      expect(response.status).toBe(200);
      response.body.data.items.forEach(office => {
        expect(office.estado).toBe('disponible');
      });
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/offices?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/offices', () => {
    it('should create new office with valid data', async () => {
      const timestamp = Date.now();
      const officeData = {
        numero: `NEW-${timestamp}`,
        tipo: 'especialidad',
        especialidad: 'Cardiología',
        descripcion: 'Consultorio de cardiología',
        estado: 'disponible'
      };

      const response = await request(app)
        .post('/api/offices')
        .send(officeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.numero).toBe(officeData.numero);
      expect(response.body.data.tipo).toBe(officeData.tipo);
    });

    it('should fail with missing required field (numero)', async () => {
      const invalidData = {
        tipo: 'consulta_general',
        especialidad: 'Test'
      };

      const response = await request(app)
        .post('/api/offices')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate numero', async () => {
      const duplicateData = {
        numero: testOffice.numero, // Use existing numero
        tipo: 'consulta_general'
      };

      const response = await request(app)
        .post('/api/offices')
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Ya existe');
    });

    it('should use default values when not provided', async () => {
      const timestamp = Date.now();
      const minimalData = {
        numero: `MIN-${timestamp}`
      };

      const response = await request(app)
        .post('/api/offices')
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.data.tipo).toBe('consulta_general');
      expect(response.body.data.estado).toBe('disponible');
    });
  });

  describe('GET /api/offices/:id', () => {
    it('should get office by ID', async () => {
      const response = await request(app)
        .get(`/api/offices/${testOffice.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOffice.id);
      expect(response.body.data.numero).toBe(testOffice.numero);
    });

    it('should return 404 for non-existent office', async () => {
      const response = await request(app)
        .get('/api/offices/999999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no encontrado');
    });
  });

  describe('PUT /api/offices/:id', () => {
    it('should update office data', async () => {
      const updateData = {
        descripcion: 'Descripción actualizada',
        especialidad: 'Pediatría'
      };

      const response = await request(app)
        .put(`/api/offices/${testOffice.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.descripcion).toBe(updateData.descripcion);
      expect(response.body.data.especialidad).toBe(updateData.especialidad);
    });

    it('should validate unique numero when changing', async () => {
      // Create another office
      const timestamp = Date.now();
      const office2 = await testHelpers.prisma.consultorio.create({
        data: {
          numero: `TEST2-${timestamp}`,
          tipo: 'consulta_general',
          estado: 'disponible'
        }
      });

      // Try to update testOffice with office2's numero
      const response = await request(app)
        .put(`/api/offices/${testOffice.id}`)
        .send({ numero: office2.numero });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Ya existe');
    });

    it('should return 404 for non-existent office', async () => {
      const response = await request(app)
        .put('/api/offices/999999')
        .send({ descripcion: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/offices/:id', () => {
    it('should delete office', async () => {
      const response = await request(app)
        .delete(`/api/offices/${testOffice.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');

      // Verify office was deleted
      const deletedOffice = await testHelpers.prisma.consultorio.findUnique({
        where: { id: testOffice.id }
      });

      expect(deletedOffice).toBeNull();
    });

    it('should return 404 for non-existent office', async () => {
      const response = await request(app)
        .delete('/api/offices/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/offices/:id/assign', () => {
    it('should assign available office', async () => {
      const assignData = {
        medicoId: 123,
        especialidad: 'Cardiología',
        observaciones: 'Asignado para consulta especializada'
      };

      const response = await request(app)
        .put(`/api/offices/${testOffice.id}/assign`)
        .send(assignData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('ocupado');
      expect(response.body.data.especialidad).toBe(assignData.especialidad);
    });

    it('should fail when office is not disponible', async () => {
      // Update office to ocupado
      await testHelpers.prisma.consultorio.update({
        where: { id: testOffice.id },
        data: { estado: 'ocupado' }
      });

      const response = await request(app)
        .put(`/api/offices/${testOffice.id}/assign`)
        .send({ medicoId: 123 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('no está disponible');
    });

    it('should return 404 for non-existent office', async () => {
      const response = await request(app)
        .put('/api/offices/999999/assign')
        .send({ medicoId: 123 });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/offices/:id/release', () => {
    beforeEach(async () => {
      // Set office to ocupado first
      await testHelpers.prisma.consultorio.update({
        where: { id: testOffice.id },
        data: { estado: 'ocupado' }
      });
    });

    it('should release office', async () => {
      const response = await request(app)
        .put(`/api/offices/${testOffice.id}/release`)
        .send({ observaciones: 'Liberado después de consulta' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('disponible');
    });

    it('should return 404 for non-existent office', async () => {
      const response = await request(app)
        .put('/api/offices/999999/release')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/offices/:id/maintenance', () => {
    it('should set office to maintenance state', async () => {
      const response = await request(app)
        .put(`/api/offices/${testOffice.id}/maintenance`)
        .send({ observaciones: 'Mantenimiento preventivo programado' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('mantenimiento');
    });

    it('should return 404 for non-existent office', async () => {
      const response = await request(app)
        .put('/api/offices/999999/maintenance')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  afterEach(async () => {
    // Clean up test offices
    try {
      await testHelpers.prisma.consultorio.deleteMany({
        where: {
          numero: {
            startsWith: 'TEST'
          }
        }
      });

      await testHelpers.prisma.consultorio.deleteMany({
        where: {
          numero: {
            startsWith: 'NEW'
          }
        }
      });

      await testHelpers.prisma.consultorio.deleteMany({
        where: {
          numero: {
            startsWith: 'MIN'
          }
        }
      });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });
});
