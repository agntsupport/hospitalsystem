const request = require('supertest');
const express = require('express');
const employeesRoutes = require('../../routes/employees.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');

const app = express();
app.use(express.json());
app.use('/api/employees', authenticateToken, employeesRoutes);

describe('Employees Endpoints', () => {
  let testUser, authToken, testEmployee;

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

  describe('GET /api/employees', () => {
    it('should get employees list with pagination', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should filter by employee type', async () => {
      const response = await request(app)
        .get('/api/employees?tipoEmpleado=medico')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by specialization', async () => {
      const response = await request(app)
        .get('/api/employees?especializacion=cardiologia')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/employees?search=Juan')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/employees?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        nombre: 'Dr. Carlos',
        apellidoPaterno: 'González',
        apellidoMaterno: 'López',
        tipoEmpleado: 'medico',
        especializacion: 'medicina general',
        telefono: '5551234567',
        email: `carlos.gonzalez_${Date.now()}@hospital.com`,
        numeroLicencia: `LIC-${Date.now()}`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.empleado).toBeDefined();
      expect(response.body.data.empleado.nombre).toBe('Dr. Carlos');

      testEmployee = response.body.data.empleado;
    });

    it('should require employee name', async () => {
      const employeeData = {
        apellidoPaterno: 'González',
        tipoEmpleado: 'enfermero',
        telefono: '5551234567'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require employee type', async () => {
      const employeeData = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        telefono: '5551234567'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const employeeData = {
        nombre: 'María',
        apellidoPaterno: 'García',
        tipoEmpleado: 'administrativo',
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow duplicate license numbers', async () => {
      const licenseNumber = `LIC-DUP-${Date.now()}`;

      const employeeData = {
        nombre: 'Dr. Pedro',
        apellidoPaterno: 'Martínez',
        tipoEmpleado: 'medico',
        numeroLicencia: licenseNumber,
        email: `pedro.martinez_${Date.now()}@hospital.com`
      };

      // Create first employee
      await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      // Try to create duplicate
      const duplicateData = {
        ...employeeData,
        nombre: 'Dr. Juan',
        email: `juan.different_${Date.now()}@hospital.com`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/employees/:id', () => {
    beforeEach(async () => {
      const employeeData = {
        nombre: 'Test',
        apellidoPaterno: 'Employee',
        tipoEmpleado: 'enfermero',
        email: `test.employee_${Date.now()}@hospital.com`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      testEmployee = response.body.data.empleado;
    });

    it('should get employee by ID', async () => {
      const response = await request(app)
        .get(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.empleado.id).toBe(testEmployee.id);
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/employees/:id', () => {
    beforeEach(async () => {
      const employeeData = {
        nombre: 'Update',
        apellidoPaterno: 'Test',
        tipoEmpleado: 'administrativo',
        email: `update.test_${Date.now()}@hospital.com`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      testEmployee = response.body.data.empleado;
    });

    it('should update employee details', async () => {
      const updateData = {
        nombre: 'Updated Name',
        apellidoPaterno: 'Updated Lastname',
        tipoEmpleado: 'administrativo',
        telefono: '5559998877'
      };

      const response = await request(app)
        .put(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.empleado.nombre).toBe('Updated Name');
      expect(response.body.data.empleado.telefono).toBe('5559998877');
    });

    it('should update specialization for doctors', async () => {
      // Create doctor first
      const doctorData = {
        nombre: 'Dr. Especialista',
        apellidoPaterno: 'Test',
        tipoEmpleado: 'medico',
        especializacion: 'pediatria',
        email: `dr.especialista_${Date.now()}@hospital.com`
      };

      const createResponse = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(doctorData);

      const doctor = createResponse.body.data.empleado;

      const updateData = {
        ...doctorData,
        especializacion: 'cardiologia'
      };

      const response = await request(app)
        .put(`/api/employees/${doctor.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.empleado.especializacion).toBe('cardiologia');
    });
  });

  describe('DELETE /api/employees/:id', () => {
    beforeEach(async () => {
      const employeeData = {
        nombre: 'Delete',
        apellidoPaterno: 'Test',
        tipoEmpleado: 'administrativo',
        email: `delete.test_${Date.now()}@hospital.com`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      testEmployee = response.body.data.empleado;
    });

    it('should soft delete employee', async () => {
      const response = await request(app)
        .delete(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .delete('/api/employees/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/employees/stats', () => {
    it('should get employees statistics', async () => {
      const response = await request(app)
        .get('/api/employees/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('porTipo');
    });
  });

  describe('GET /api/employees/doctors', () => {
    it('should get only doctors', async () => {
      const response = await request(app)
        .get('/api/employees/doctors')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter doctors by specialization', async () => {
      const response = await request(app)
        .get('/api/employees/doctors?especializacion=cardiologia')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/employees/nurses', () => {
    it('should get only nurses', async () => {
      const response = await request(app)
        .get('/api/employees/nurses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/employees/schedule/:id', () => {
    beforeEach(async () => {
      const employeeData = {
        nombre: 'Schedule',
        apellidoPaterno: 'Test',
        tipoEmpleado: 'medico',
        email: `schedule.test_${Date.now()}@hospital.com`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      testEmployee = response.body.data.empleado;
    });

    it('should get employee schedule', async () => {
      const response = await request(app)
        .get(`/api/employees/schedule/${testEmployee.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter schedule by date range', async () => {
      const fechaInicio = '2024-01-01';
      const fechaFin = '2024-12-31';

      const response = await request(app)
        .get(`/api/employees/schedule/${testEmployee.id}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/employees/:id/activate', () => {
    beforeEach(async () => {
      const employeeData = {
        nombre: 'Activate',
        apellidoPaterno: 'Test',
        tipoEmpleado: 'administrativo',
        email: `activate.test_${Date.now()}@hospital.com`
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      testEmployee = response.body.data.empleado;

      // Deactivate first
      await request(app)
        .delete(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should reactivate deactivated employee', async () => {
      const response = await request(app)
        .put(`/api/employees/${testEmployee.id}/activate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
