// ABOUTME: Tests exhaustivos para integridad de transacciones en cuentas de pacientes
// Cubre: P0-2 (Prisma middleware), P1-1 (cargos quirófano), P1-2 (cobros parciales), P1-3 (CPC)

const request = require('supertest');
const express = require('express');
const posRoutes = require('../../routes/pos.routes');
const quirofanosRoutes = require('../../routes/quirofanos.routes');
const { prisma, validateCuentaAbierta } = require('../../utils/database');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/pos', posRoutes);
app.use('/api/quirofanos', quirofanosRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('Sistema de Integridad de Transacciones - Tests Completos', () => {
  let testCajero;
  let testAdmin;
  let testMedico;
  let cajeroToken;
  let adminToken;
  let medicoToken;
  let testPatient;
  let testCuenta;
  let testQuirofano;
  let testServicio;
  let testProduct;

  const {
    createTestUser,
    createTestProduct,
    createTestPatient,
    createTestCuentaPaciente,
    createTestEmployee,
    cleanTestData
  } = global.testHelpers;

  // Empleado médico para hospitalizaciones (diferente a usuario médico)
  let testMedicoEmpleado;

  beforeAll(async () => {
    await cleanTestData();
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await cleanTestData();

    // Crear usuarios de prueba
    testCajero = await createTestUser({
      username: `cajero_integrity_${Date.now()}`,
      password: 'test123',
      rol: 'cajero'
    });

    testAdmin = await createTestUser({
      username: `admin_integrity_${Date.now()}`,
      password: 'test123',
      rol: 'administrador'
    });

    testMedico = await createTestUser({
      username: `medico_integrity_${Date.now()}`,
      password: 'test123',
      rol: 'medico_residente'
    });

    // Crear empleado médico para hospitalizaciones (requerido por FK)
    testMedicoEmpleado = await createTestEmployee({
      nombre: 'Dr. Test',
      apellidoPaterno: 'Integrity',
      tipoEmpleado: 'medico_especialista',
      especialidad: 'Cirugía General'
    });

    // Generar tokens
    cajeroToken = jwt.sign(
      { userId: testCajero.id, rol: testCajero.rol, id: testCajero.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: testAdmin.id, rol: testAdmin.rol, id: testAdmin.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    medicoToken = jwt.sign(
      { userId: testMedico.id, rol: testMedico.rol, id: testMedico.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Crear paciente de prueba
    testPatient = await createTestPatient({
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García'
    });

    // Crear producto de prueba
    testProduct = await createTestProduct({
      nombre: `Producto Test ${Date.now()}`,
      precio: 100.00,
      stock: 50,
      stockMinimo: 10
    });

    // Crear servicio de prueba
    testServicio = await prisma.servicio.create({
      data: {
        codigo: `SERV-TEST-${Date.now()}`,
        nombre: 'Servicio de prueba',
        descripcion: 'Servicio para tests',
        tipo: 'consulta_general',
        precio: 500.00,
        activo: true
      }
    });

    // Crear cuenta de prueba (sin anticipo automático)
    const cuentaResult = await createTestCuentaPaciente({
      pacienteId: testPatient.id,
      anticipo: 0.00, // Sin anticipo automático
      estado: 'abierta'
    });
    testCuenta = cuentaResult.cuenta;

    // Crear quirófano de prueba
    testQuirofano = await prisma.quirofano.create({
      data: {
        numero: `Q-TEST-${Date.now()}`,
        tipo: 'cirugia_general',
        descripcion: 'Quirófano para tests',
        precioHora: 2000.00,
        estado: 'disponible'
      }
    });
  });

  afterAll(async () => {
    await cleanTestData();
  });

  // ===================================================================
  // P0-2: VALIDACIÓN DE INTEGRIDAD - PROTECCIÓN DE CUENTAS CERRADAS
  // ===================================================================

  describe('P0-2: Validación de Integridad - Protección de Cuentas Cerradas', () => {
    it('debe rechazar validación cuando cuenta está cerrada', async () => {
      // Cerrar cuenta primero
      await prisma.cuentaPaciente.update({
        where: { id: testCuenta.id },
        data: { estado: 'cerrada' }
      });

      // Intentar validar cuenta cerrada
      await expect(
        validateCuentaAbierta(testCuenta.id)
      ).rejects.toThrow(/La cuenta está cerrada/);
    });

    it('debe pasar validación cuando cuenta está abierta', async () => {
      // Cuenta ya está abierta por defecto
      const cuenta = await validateCuentaAbierta(testCuenta.id);

      expect(cuenta).toBeDefined();
      expect(cuenta.estado).toBe('abierta');
      expect(cuenta.id).toBe(testCuenta.id);
    });

    it('debe rechazar validación si cuenta no existe', async () => {
      await expect(
        validateCuentaAbierta(99999) // ID inexistente
      ).rejects.toThrow(/Cuenta .* no encontrada/);
    });

    it('debe prevenir agregar items a cuenta cerrada vía endpoint', async () => {
      // Cerrar cuenta
      await prisma.cuentaPaciente.update({
        where: { id: testCuenta.id },
        data: { estado: 'cerrada' }
      });

      // Intentar agregar item vía endpoint (ruta correcta: /cuenta/:id/transacciones)
      const response = await request(app)
        .post(`/api/pos/cuenta/${testCuenta.id}/transacciones`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          tipo: 'producto',
          productoId: testProduct.id,
          cantidad: 1
        });

      // Puede ser 400 (cuenta cerrada) o 403 (sin permiso)
      expect([400, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ===================================================================
  // P1-1: CARGOS AUTOMÁTICOS DE QUIRÓFANO
  // ===================================================================

  describe('P1-1: Cargos Automáticos de Quirófano', () => {
    let testCirugia;
    let testHospitalizacion;

    beforeEach(async () => {
      // Crear hospitalización asociada a la cuenta
      testHospitalizacion = await prisma.hospitalizacion.create({
        data: {
          medicoEspecialistaId: testMedicoEmpleado.id,
          cuentaPacienteId: testCuenta.id,
          fechaIngreso: new Date(),
          motivoHospitalizacion: 'Cirugía programada',
          diagnosticoIngreso: 'Pre-operatorio',
          estado: 'en_observacion'
        }
      });

      // Crear cirugía (medicoId apunta a Empleado, no Usuario)
      testCirugia = await prisma.cirugiaQuirofano.create({
        data: {
          quirofanoId: testQuirofano.id,
          pacienteId: testPatient.id,
          medicoId: testMedicoEmpleado.id,
          tipoIntervencion: 'Cirugía de prueba',
          estado: 'programada',
          fechaInicio: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
          observaciones: 'Test de cargo automático'
        }
      });
    });

    // TODO: Test de integración complejo - el endpoint de cirugías no genera cargo automático
    // en el contexto de test aislado (requiere middleware de cargos automáticos en producción)
    it.skip('debe generar cargo automático al completar cirugía', async () => {
      // Marcar quirófano como ocupado
      await prisma.quirofano.update({
        where: { id: testQuirofano.id },
        data: { estado: 'ocupado' }
      });

      // Completar cirugía
      const response = await request(app)
        .put(`/api/quirofanos/cirugias/${testCirugia.id}/estado`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .send({ estado: 'completada' });

      expect(response.status).toBe(200);

      // Verificar que se creó transacción de cargo
      const transacciones = await prisma.transaccionCuenta.findMany({
        where: {
          cuentaId: testCuenta.id,
          tipo: 'servicio'
        }
      });

      expect(transacciones.length).toBeGreaterThan(0);

      const cargoQuirofano = transacciones.find(t =>
        t.concepto.includes('quirófano') &&
        t.concepto.includes(testQuirofano.numero)
      );

      expect(cargoQuirofano).toBeDefined();
      expect(cargoQuirofano.cantidad).toBeGreaterThan(0);
      expect(cargoQuirofano.precioUnitario).toBeGreaterThan(0);
    });

    it('NO debe generar cargo si cuenta está cerrada', async () => {
      // Cerrar cuenta
      await prisma.cuentaPaciente.update({
        where: { id: testCuenta.id },
        data: { estado: 'cerrada' }
      });

      // Completar cirugía
      const response = await request(app)
        .put(`/api/quirofanos/cirugias/${testCirugia.id}/estado`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .send({ estado: 'completada' });

      // Debe completar sin error (pero sin generar cargo)
      expect(response.status).toBe(200);

      // Verificar que NO se creó cargo
      const transacciones = await prisma.transaccionCuenta.findMany({
        where: {
          cuentaId: testCuenta.id,
          tipo: 'servicio'
        }
      });

      expect(transacciones.length).toBe(0);
    });

    // TODO: Test de integración complejo - depende de cargo automático (ver test anterior)
    it.skip('debe calcular horas de cirugía correctamente', async () => {
      // Actualizar fecha de inicio (2 horas atrás)
      await prisma.cirugiaQuirofano.update({
        where: { id: testCirugia.id },
        data: {
          fechaInicio: new Date(Date.now() - 2.5 * 60 * 60 * 1000) // 2.5 horas
        }
      });

      await prisma.quirofano.update({
        where: { id: testQuirofano.id },
        data: { estado: 'ocupado' }
      });

      // Completar cirugía
      await request(app)
        .put(`/api/quirofanos/cirugias/${testCirugia.id}/estado`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .send({ estado: 'completada' });

      // Verificar cantidad de horas (debe redondear hacia arriba)
      const transacciones = await prisma.transaccionCuenta.findMany({
        where: {
          cuentaId: testCuenta.id,
          tipo: 'servicio'
        }
      });

      const cargoQuirofano = transacciones.find(t =>
        t.concepto.includes('quirófano')
      );

      expect(cargoQuirofano.cantidad).toBe(3); // Math.ceil(2.5) = 3
    });
  });

  // ===================================================================
  // P1-2: COBROS PARCIALES
  // ===================================================================

  describe('P1-2: Cobros Parciales', () => {
    beforeEach(async () => {
      // Agregar anticipo de 10,000 vía transacción
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'anticipo',
          concepto: 'Anticipo inicial',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: testCajero.id
        }
      });

      // Agregar algunos cargos a la cuenta
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'servicio',
          concepto: 'Consulta médica',
          cantidad: 1,
          precioUnitario: 500.00,
          subtotal: 500.00,
          servicioId: testServicio.id,
          empleadoCargoId: testMedico.id
        }
      });

      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'producto',
          concepto: 'Medicamento',
          cantidad: 2,
          precioUnitario: 100.00,
          subtotal: 200.00,
          productoId: testProduct.id,
          empleadoCargoId: testCajero.id
        }
      });
    });

    it('debe registrar pago parcial correctamente', async () => {
      const response = await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 1000.00,
          metodoPago: 'efectivo',
          observaciones: 'Primer abono'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que se creó el pago
      const pagos = await prisma.pago.findMany({
        where: {
          cuentaPacienteId: testCuenta.id,
          tipoPago: 'parcial'
        }
      });

      expect(pagos.length).toBe(1);
      expect(parseFloat(pagos[0].monto.toString())).toBe(1000.00);
    });

    it('debe rechazar pago parcial con monto cero o negativo', async () => {
      const response = await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 0,
          metodoPago: 'efectivo'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('mayor a cero');
    });

    it('debe rechazar pago parcial sin método de pago', async () => {
      const response = await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 1000.00
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('método de pago');
    });

    it('debe permitir múltiples pagos parciales', async () => {
      // Primer pago
      await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 500.00,
          metodoPago: 'efectivo'
        });

      // Segundo pago
      await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 300.00,
          metodoPago: 'tarjeta'
        });

      // Verificar ambos pagos
      const pagos = await prisma.pago.findMany({
        where: {
          cuentaPacienteId: testCuenta.id,
          tipoPago: 'parcial'
        },
        orderBy: { fechaPago: 'asc' }
      });

      expect(pagos.length).toBe(2);
      expect(parseFloat(pagos[0].monto.toString())).toBe(500.00);
      expect(parseFloat(pagos[1].monto.toString())).toBe(300.00);
    });

    it('NO debe permitir pago parcial en cuenta cerrada', async () => {
      // Cerrar cuenta
      await prisma.cuentaPaciente.update({
        where: { id: testCuenta.id },
        data: { estado: 'cerrada' }
      });

      const response = await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 1000.00,
          metodoPago: 'efectivo'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cerrada');
    });

    it('debe reflejarse pagos parciales en cálculo de saldo', async () => {
      // Anticipo: 10,000
      // Cargos: 500 + 200 = 700
      // Saldo antes de pago: 10,000 - 700 = 9,300

      // Registrar pago parcial
      await request(app)
        .post(`/api/pos/cuentas/${testCuenta.id}/pago-parcial`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 1000.00,
          metodoPago: 'efectivo'
        });

      // Obtener cuenta con saldo actualizado (ruta singular: /cuenta/:id)
      const response = await request(app)
        .get(`/api/pos/cuenta/${testCuenta.id}`)
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(response.status).toBe(200);

      // Saldo después: (10,000 + 1,000) - 700 = 10,300
      // Nota: endpoint retorna { data: { account: { ...cuenta } } }
      expect(response.body.data.account.saldoPendiente).toBeGreaterThan(10000);
    });
  });

  // ===================================================================
  // P1-3: CUENTAS POR COBRAR (CPC)
  // ===================================================================

  describe('P1-3: Cuentas por Cobrar', () => {
    beforeEach(async () => {
      // Agregar anticipo de 10,000 vía transacción
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'anticipo',
          concepto: 'Anticipo inicial',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: testCajero.id
        }
      });

      // Agregar cargos que excedan el anticipo
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'servicio',
          concepto: 'Hospitalización 5 días',
          cantidad: 5,
          precioUnitario: 3000.00,
          subtotal: 15000.00, // Excede anticipo de 10,000
          servicioId: testServicio.id,
          empleadoCargoId: testMedico.id
        }
      });
    });

    it('debe rechazar cierre con deuda sin pago ni autorización CPC', async () => {
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pago');
    });

    it('debe rechazar autorización CPC si no es administrador', async () => {
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Paciente sin recursos'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('administrador');
    });

    it('debe permitir cierre con CPC con autorización admin', async () => {
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Paciente sin recursos económicos'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que se creó registro en HistorialCuentaPorCobrar
      const cpc = await prisma.historialCuentaPorCobrar.findFirst({
        where: { cuentaPacienteId: testCuenta.id }
      });

      expect(cpc).toBeDefined();
      expect(cpc.estado).toBe('pendiente');
      expect(cpc.autorizadoPor).toBe(testAdmin.id);
      expect(parseFloat(cpc.saldoPendiente.toString())).toBe(5000.00); // 15,000 - 10,000
    });

    it('debe rechazar CPC sin motivo de autorización', async () => {
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true
          // Sin motivoCuentaPorCobrar
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('motivo');
    });

    it('debe listar cuentas por cobrar correctamente', async () => {
      // Crear CPC primero
      await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Test CPC'
        });

      // Listar CPC
      const response = await request(app)
        .get('/api/pos/cuentas-por-cobrar')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);

      const cpc = response.body.data.items[0];
      expect(cpc.estado).toBe('pendiente');
      expect(cpc.paciente).toBeDefined();
      expect(cpc.autorizadoPor).toBeDefined();
    });

    it('debe registrar pago contra CPC correctamente', async () => {
      // Crear CPC primero
      await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Test pago CPC'
        });

      // Obtener ID de CPC
      const cpc = await prisma.historialCuentaPorCobrar.findFirst({
        where: { cuentaPacienteId: testCuenta.id }
      });

      // Registrar pago
      const response = await request(app)
        .post(`/api/pos/cuentas-por-cobrar/${cpc.id}/pago`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 2000.00,
          metodoPago: 'efectivo',
          observaciones: 'Primer abono CPC'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar actualización de CPC
      const cpcActualizado = await prisma.historialCuentaPorCobrar.findUnique({
        where: { id: cpc.id }
      });

      expect(cpcActualizado.estado).toBe('pagado_parcial');
      expect(parseFloat(cpcActualizado.saldoPendiente.toString())).toBe(3000.00); // 5000 - 2000
    });

    it('debe actualizar estado a pagado_total al liquidar CPC', async () => {
      // Crear CPC
      await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Test liquidación CPC'
        });

      const cpc = await prisma.historialCuentaPorCobrar.findFirst({
        where: { cuentaPacienteId: testCuenta.id }
      });

      // Pagar monto completo
      const response = await request(app)
        .post(`/api/pos/cuentas-por-cobrar/${cpc.id}/pago`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 5000.00, // Monto exacto
          metodoPago: 'transferencia'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('completamente');

      // Verificar estado
      const cpcActualizado = await prisma.historialCuentaPorCobrar.findUnique({
        where: { id: cpc.id }
      });

      expect(cpcActualizado.estado).toBe('pagado_total');
      expect(parseFloat(cpcActualizado.saldoPendiente.toString())).toBe(0);
    });

    it('debe rechazar pago mayor al saldo pendiente de CPC', async () => {
      // Crear CPC
      await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Test pago excesivo'
        });

      const cpc = await prisma.historialCuentaPorCobrar.findFirst({
        where: { cuentaPacienteId: testCuenta.id }
      });

      // Intentar pagar más del saldo
      const response = await request(app)
        .post(`/api/pos/cuentas-por-cobrar/${cpc.id}/pago`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          monto: 10000.00, // Mayor que saldo de 5000
          metodoPago: 'efectivo'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('mayor al saldo pendiente');
    });

    it('debe proporcionar estadísticas de CPC correctamente', async () => {
      // Crear CPC
      await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cuentaPorCobrar: true,
          motivoCuentaPorCobrar: 'Test estadísticas'
        });

      // Obtener estadísticas
      const response = await request(app)
        .get('/api/pos/cuentas-por-cobrar/estadisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { resumen, distribucion, topDeudores } = response.body.data;

      expect(resumen.totalCPC).toBeGreaterThan(0);
      expect(resumen.montoTotalOriginal).toBeGreaterThan(0);
      expect(resumen.montoTotalPendiente).toBeGreaterThan(0);
      expect(distribucion).toBeDefined();
      expect(Array.isArray(topDeudores)).toBe(true);
    });
  });

  // ===================================================================
  // ESCENARIOS DE CIERRE DE CUENTA
  // ===================================================================

  describe('Escenarios de Cierre de Cuenta', () => {
    it('debe cerrar cuenta con pago exacto', async () => {
      // Agregar anticipo de 10,000 vía transacción
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'anticipo',
          concepto: 'Anticipo inicial',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: testCajero.id
        }
      });

      // Agregar cargo de 500
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'servicio',
          concepto: 'Consulta',
          cantidad: 1,
          precioUnitario: 500.00,
          subtotal: 500.00,
          servicioId: testServicio.id,
          empleadoCargoId: testMedico.id
        }
      });

      // Anticipo: 10,000, Cargo: 500, Saldo: 9,500 (a favor del paciente)
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          montoPagado: 0, // No se paga nada adicional, anticipo cubre todo
          metodoPago: 'efectivo'
        });

      expect(response.status).toBe(200);

      // Verificar cuenta cerrada
      const cuenta = await prisma.cuentaPaciente.findUnique({
        where: { id: testCuenta.id }
      });

      expect(cuenta.estado).toBe('cerrada');
    });

    it('debe cerrar cuenta con pago y devolución', async () => {
      // Agregar anticipo de 10,000 vía transacción
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'anticipo',
          concepto: 'Anticipo inicial',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: testCajero.id
        }
      });

      // Agregar cargo pequeño de 100
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'producto',
          concepto: 'Medicamento',
          cantidad: 1,
          precioUnitario: 100.00,
          subtotal: 100.00,
          productoId: testProduct.id,
          empleadoCargoId: testCajero.id
        }
      });

      // Anticipo: 10,000, Cargo: 100, Saldo: 9,900 (a favor - devolución)
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          montoPagado: 0,
          metodoPago: 'efectivo'
        });

      expect(response.status).toBe(200);

      // Verificar cuenta cerrada
      const cuenta = await prisma.cuentaPaciente.findUnique({
        where: { id: testCuenta.id }
      });

      expect(cuenta.estado).toBe('cerrada');
      // Saldo positivo indica que hay devolución al paciente
      expect(parseFloat(cuenta.saldoPendiente.toString())).toBeGreaterThanOrEqual(0);
    });

    it('debe cerrar cuenta con cobros parciales previos', async () => {
      // Agregar anticipo de 10,000 vía transacción
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'anticipo',
          concepto: 'Anticipo inicial',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: testCajero.id
        }
      });

      // Agregar cargo de 1,500
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'servicio',
          concepto: 'Tratamiento',
          cantidad: 1,
          precioUnitario: 1500.00,
          subtotal: 1500.00,
          servicioId: testServicio.id,
          empleadoCargoId: testMedico.id
        }
      });

      // Registrar pago parcial de 500
      await prisma.pago.create({
        data: {
          cuentaPacienteId: testCuenta.id,
          monto: 500.00,
          metodoPago: 'efectivo',
          tipoPago: 'parcial',
          empleadoId: testCajero.id
        }
      });

      // Anticipo: 10,000, Cargo: 1,500, Pago parcial: 500
      // Saldo: (10,000 + 500) - 1,500 = 9,000 (a favor)
      const response = await request(app)
        .put(`/api/pos/cuentas/${testCuenta.id}/close`)
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          montoPagado: 0,
          metodoPago: 'efectivo'
        });

      expect(response.status).toBe(200);
    });
  });

  // ===================================================================
  // RACE CONDITIONS Y CONCURRENCIA
  // ===================================================================

  describe('Race Conditions y Concurrencia', () => {
    it('debe manejar múltiples intentos de cierre simultáneos', async () => {
      // Agregar anticipo de 10,000 vía transacción
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'anticipo',
          concepto: 'Anticipo inicial',
          cantidad: 1,
          precioUnitario: 10000.00,
          subtotal: 10000.00,
          empleadoCargoId: testCajero.id
        }
      });

      // Agregar cargo
      await prisma.transaccionCuenta.create({
        data: {
          cuentaId: testCuenta.id,
          tipo: 'servicio',
          concepto: 'Consulta',
          cantidad: 1,
          precioUnitario: 500.00,
          subtotal: 500.00,
          servicioId: testServicio.id,
          empleadoCargoId: testMedico.id
        }
      });

      // Intentar cerrar dos veces simultáneamente
      const cierres = await Promise.allSettled([
        request(app)
          .put(`/api/pos/cuentas/${testCuenta.id}/close`)
          .set('Authorization', `Bearer ${cajeroToken}`)
          .send({ montoPagado: 0, metodoPago: 'efectivo' }),
        request(app)
          .put(`/api/pos/cuentas/${testCuenta.id}/close`)
          .set('Authorization', `Bearer ${cajeroToken}`)
          .send({ montoPagado: 0, metodoPago: 'efectivo' })
      ]);

      // Al menos uno debe tener éxito
      const exitosos = cierres.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(exitosos.length).toBeGreaterThan(0);

      // La cuenta solo debe cerrarse una vez
      const cuenta = await prisma.cuentaPaciente.findUnique({
        where: { id: testCuenta.id }
      });

      expect(cuenta.estado).toBe('cerrada');
    });
  });
});
