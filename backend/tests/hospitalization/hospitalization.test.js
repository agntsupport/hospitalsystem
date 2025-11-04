const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const { prisma } = require('../../utils/database');
const hospitalizationRoutes = require('../../routes/hospitalization.routes');
const authRoutes = require('../../routes/auth.routes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/hospitalization', hospitalizationRoutes);

describe('Hospitalization Module - Critical Tests', () => {
  let adminToken;
  let testPatient;
  let testRoom;
  let adminUser;
  let testMedico;
  let testCuentaPaciente;

  beforeAll(async () => {
    const timestamp = Date.now();
    const testHelpers = global.testHelpers;

    // Crear admin para autenticación usando testHelpers (solo una vez)
    adminUser = await testHelpers.createTestUser({
      username: `hosp_admin_${timestamp}`,
      password: 'admin123',
      rol: 'administrador',
      email: `hosp_admin_${timestamp}@test.com`
    });

    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUser.username, password: 'admin123' });
    adminToken = loginRes.body.data.token;
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const testHelpers = global.testHelpers;

    // Crear paciente de prueba
    testPatient = await prisma.paciente.create({
      data: {
        nombre: 'Test',
        apellidoPaterno: 'Hospitalization',
        fechaNacimiento: new Date('1990-01-01'),
        genero: 'M',
        telefono: `${timestamp}${randomSuffix}`,
        activo: true
      }
    });

    // Crear habitación de prueba
    testRoom = await prisma.habitacion.create({
      data: {
        numero: `TEST-${timestamp}-${randomSuffix}`,
        tipo: 'individual',
        precioPorDia: 1500.00,
        estado: 'disponible',
        descripcion: 'Test room'
      }
    });

    // Crear médico especialista de prueba
    testMedico = await testHelpers.createTestEmployee({
      nombre: 'Dr Test',
      apellidoPaterno: 'Hospital',
      tipoEmpleado: 'medico_especialista'
    });

    // Crear cuenta paciente de prueba
    const { cuenta } = await testHelpers.createTestCuentaPaciente({
      paciente: testPatient,
      cajeroAperturaId: adminUser.id,
      anticipo: 10000
    });
    testCuentaPaciente = cuenta;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    try {
      await prisma.notaHospitalizacion.deleteMany({ where: { hospitalizacionId: { gt: 1000 } } });
      await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: { gt: 1000 } } });

      if (testPatient) {
        // Eliminar hospitalizaciones relacionadas a través de cuentaPaciente
        const cuentas = await prisma.cuentaPaciente.findMany({
          where: { pacienteId: testPatient.id },
          select: { id: true }
        });
        const cuentaIds = cuentas.map(c => c.id);

        if (cuentaIds.length > 0) {
          await prisma.hospitalizacion.deleteMany({ where: { cuentaPacienteId: { in: cuentaIds } } });
        }

        await prisma.cuentaPaciente.deleteMany({ where: { pacienteId: testPatient.id } });
        await prisma.paciente.delete({ where: { id: testPatient.id } });
      }

      if (testRoom) {
        await prisma.habitacion.delete({ where: { id: testRoom.id } });
      }

      if (adminUser) {
        await prisma.usuario.deleteMany({ where: { id: adminUser.id } });
      }
    } catch (error) {
      console.warn('Cleanup warning in hospitalization.test.js:', error.message);
    }
  });

  describe('POST /api/hospitalization/admissions - Create Admission', () => {
    it('should create admission with automatic $10,000 MXN advance payment', async () => {
      const response = await request(app)
        .post('/api/hospitalization/admissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pacienteId: testPatient.id,
          habitacionId: testRoom.id,
          medicoTratanteId: testMedico.id,
          motivoIngreso: 'Test admission',
          diagnosticoIngreso: 'Test diagnosis'
        });

      if (response.status !== 201) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.admission).toBeDefined();

      const hospitalizacionId = response.body.data.admission.id;

      // Verificar que se creó la cuenta del paciente con anticipo
      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: hospitalizacionId },
        include: { cuentaPaciente: true }
      });
      const cuenta = hospitalizacion.cuentaPaciente;

      expect(cuenta).toBeTruthy();
      expect(parseFloat(cuenta.anticipo)).toBe(10000); // $10,000 MXN
      expect(cuenta.estado).toBe('abierta');

      // Limpiar (orden correcto para FK constraints)
      await prisma.notaHospitalizacion.deleteMany({ where: { hospitalizacionId } });
      await prisma.hospitalizacion.delete({ where: { id: hospitalizacionId } });
      await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: cuenta.id } });
      await prisma.cuentaPaciente.delete({ where: { id: cuenta.id } });
    });

    it('should prevent admission when room is already occupied', async () => {
      // Crear primera admisión
      const firstAdmission = await prisma.hospitalizacion.create({
        data: {
          habitacionId: testRoom.id,
          fechaIngreso: new Date(),
          motivoHospitalizacion: 'First admission',
          diagnosticoIngreso: 'Test',
          medicoEspecialistaId: testMedico.id,
          cuentaPacienteId: testCuentaPaciente.id
        }
      });

      // Actualizar habitación a ocupada
      await prisma.habitacion.update({
        where: { id: testRoom.id },
        data: { estado: 'ocupada' }
      });

      // Intentar segunda admisión
      const response = await request(app)
        .post('/api/hospitalization/admissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pacienteId: testPatient.id,
          habitacionId: testRoom.id,
          medicoTratanteId: testMedico.id,
          motivoIngreso: 'Second admission',
          diagnosticoIngreso: 'Test'
        });

      expect([400, 409]).toContain(response.status);
      expect(response.body.success).toBe(false);

      // Limpiar
      await prisma.hospitalizacion.delete({ where: { id: firstAdmission.id } });
      await prisma.habitacion.update({
        where: { id: testRoom.id },
        data: { estado: 'disponible' }
      });
    });
  });

  describe('PUT /api/hospitalization/discharge - Discharge Patient', () => {
    it('should allow discharge with outstanding balance', async () => {
      // Crear admisión con cuenta
      const admission = await prisma.hospitalizacion.create({
        data: {
          habitacionId: testRoom.id,
          fechaIngreso: new Date(),
          motivoHospitalizacion: 'Test',
          diagnosticoIngreso: 'Test',
          medicoEspecialistaId: testMedico.id,
          cuentaPacienteId: testCuentaPaciente.id
        }
      });

      // Agregar cargo adicional
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuentaPaciente.id,
          tipo: 'servicio',
          concepto: 'Extra charge',
          cantidad: 1,
          precioUnitario: 5000,
          subtotal: 5000
        }
      });

      // Alta del paciente
      const response = await request(app)
        .put(`/api/hospitalization/admissions/${admission.id}/discharge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          diagnosticoAlta: 'Recovered',
          observacionesAlta: 'Rest at home'
        });

      if (response.status !== 200) {
        console.log('Discharge error:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar alta
      const updatedAdmission = await prisma.hospitalizacion.findUnique({
        where: { id: admission.id }
      });
      expect(updatedAdmission.fechaAlta).not.toBeNull();

      // Limpiar
      await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: testCuentaPaciente.id } });
      await prisma.hospitalizacion.delete({ where: { id: admission.id } });
    });
  });

  describe('POST /api/hospitalization/notes - Medical Notes', () => {
    it('should create medical note for active hospitalization', async () => {
      // Crear admisión
      const admission = await prisma.hospitalizacion.create({
        data: {
          habitacionId: testRoom.id,
          fechaIngreso: new Date(),
          motivoHospitalizacion: 'Test',
          diagnosticoIngreso: 'Test',
          medicoEspecialistaId: testMedico.id,
          cuentaPacienteId: testCuentaPaciente.id
        }
      });

      const response = await request(app)
        .post(`/api/hospitalization/admissions/${admission.id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipoNota: 'evolucion',
          turno: 'matutino',
          estadoGeneral: 'Patient is recovering well',
          temperatura: 36.5,
          empleadoId: testMedico.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verificar nota
      const notas = await prisma.notaHospitalizacion.findMany({
        where: { hospitalizacionId: admission.id }
      });
      expect(notas.length).toBeGreaterThan(0);

      // Limpiar
      await prisma.notaHospitalizacion.deleteMany({ where: { hospitalizacionId: admission.id } });
      await prisma.hospitalizacion.delete({ where: { id: admission.id } });
    });
  });
});
