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

  beforeAll(async () => {
    // Crear admin para autenticación
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.usuario.create({
      data: {
        username: 'test_hosp_admin',
        passwordHash: adminHash,
        email: 'hosp_admin@test.com',
        rol: 'administrador',
        activo: true
      }
    });

    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_hosp_admin', password: 'admin123' });
    adminToken = loginRes.body.data.token;

    // Crear paciente de prueba
    testPatient = await prisma.paciente.create({
      data: {
        nombre: 'Test',
        apellidoPaterno: 'Hospitalization',
        fechaNacimiento: new Date('1990-01-01'),
        genero: 'M',
        telefono: '1234567890',
        activo: true
      }
    });

    // Crear habitación de prueba
    testRoom = await prisma.habitacion.create({
      data: {
        numero: 'TEST-101',
        tipo: 'individual',
        piso: 1,
        estado: 'disponible',
        precioNoche: 1500,
        caracteristicas: 'Test room'
      }
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.notaHospitalizacion.deleteMany({ where: { hospitalizacionId: { gt: 1000 } } });
    await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: { gt: 1000 } } });
    await prisma.cuentaPaciente.deleteMany({ where: { pacienteId: testPatient.id } });
    await prisma.hospitalizacion.deleteMany({ where: { pacienteId: testPatient.id } });
    await prisma.paciente.delete({ where: { id: testPatient.id } });
    await prisma.habitacion.delete({ where: { id: testRoom.id } });
    await prisma.usuario.deleteMany({ where: { username: 'test_hosp_admin' } });
  });

  describe('POST /api/hospitalization/admissions - Create Admission', () => {
    it('should create admission with automatic $10,000 MXN advance payment', async () => {
      const response = await request(app)
        .post('/api/hospitalization/admissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pacienteId: testPatient.id,
          habitacionId: testRoom.id,
          motivoIngreso: 'Test admission',
          diagnosticoIngreso: 'Test diagnosis'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hospitalizacion).toBeDefined();

      const hospitalizacionId = response.body.data.hospitalizacion.id;

      // Verificar que se creó la cuenta del paciente con anticipo
      const cuenta = await prisma.cuentaPaciente.findFirst({
        where: { hospitalizacionId }
      });

      expect(cuenta).toBeTruthy();
      expect(cuenta.anticipo).toBe(10000); // $10,000 MXN
      expect(cuenta.saldo).toBe(10000);
      expect(cuenta.estado).toBe('abierta');

      // Limpiar
      await prisma.notaHospitalizacion.deleteMany({ where: { hospitalizacionId } });
      await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: cuenta.id } });
      await prisma.cuentaPaciente.delete({ where: { id: cuenta.id } });
      await prisma.hospitalizacion.delete({ where: { id: hospitalizacionId } });
    });

    it('should prevent admission when room is already occupied', async () => {
      // Crear primera admisión
      const firstAdmission = await prisma.hospitalizacion.create({
        data: {
          pacienteId: testPatient.id,
          habitacionId: testRoom.id,
          fechaIngreso: new Date(),
          motivoIngreso: 'First admission',
          diagnosticoIngreso: 'Test'
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
          pacienteId: testPatient.id,
          habitacionId: testRoom.id,
          fechaIngreso: new Date(),
          motivoIngreso: 'Test',
          diagnosticoIngreso: 'Test'
        }
      });

      const cuenta = await prisma.cuentaPaciente.create({
        data: {
          pacienteId: testPatient.id,
          hospitalizacionId: admission.id,
          anticipo: 10000,
          saldo: 10000,
          estado: 'abierta'
        }
      });

      // Agregar cargo adicional
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: cuenta.id,
          tipo: 'cargo',
          monto: 5000,
          concepto: 'Extra charge',
          saldoAnterior: 10000,
          saldoNuevo: 5000
        }
      });

      // Alta del paciente
      const response = await request(app)
        .put('/api/hospitalization/discharge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hospitalizacionId: admission.id,
          diagnosticoAlta: 'Recovered',
          indicacionesAlta: 'Rest at home'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar alta
      const updatedAdmission = await prisma.hospitalizacion.findUnique({
        where: { id: admission.id }
      });
      expect(updatedAdmission.fechaAlta).not.toBeNull();

      // Limpiar
      await prisma.transaccionCuenta.deleteMany({ where: { cuentaId: cuenta.id } });
      await prisma.cuentaPaciente.delete({ where: { id: cuenta.id } });
      await prisma.hospitalizacion.delete({ where: { id: admission.id } });
    });
  });

  describe('POST /api/hospitalization/notes - Medical Notes', () => {
    it('should create medical note for active hospitalization', async () => {
      // Crear admisión
      const admission = await prisma.hospitalizacion.create({
        data: {
          pacienteId: testPatient.id,
          habitacionId: testRoom.id,
          fechaIngreso: new Date(),
          motivoIngreso: 'Test',
          diagnosticoIngreso: 'Test'
        }
      });

      const response = await request(app)
        .post('/api/hospitalization/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hospitalizacionId: admission.id,
          tipoNota: 'evolucion',
          nota: 'Patient is recovering well'
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
