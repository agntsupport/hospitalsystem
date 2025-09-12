const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../server-modular');

const prisma = new PrismaClient();

// ==============================================
// TESTS DEL SISTEMA DE SOLICITUDES DE PRODUCTOS
// ==============================================

describe('Sistema de Solicitudes de Productos', () => {
  let authTokenEnfermero;
  let authTokenAlmacenista;
  let pacienteId;
  let cuentaPacienteId;
  let productoId;
  let solicitudId;

  // Setup inicial - Autenticación y datos base
  beforeAll(async () => {
    // Limpiar datos de prueba anteriores
    await prisma.notificacionSolicitud.deleteMany({});
    await prisma.historialSolicitud.deleteMany({});
    await prisma.detalleSolicitudProducto.deleteMany({});
    await prisma.solicitudProductos.deleteMany({});

    // Obtener tokens de autenticación
    const loginEnfermero = await request(app)
      .post('/api/auth/login')
      .send({ username: 'enfermero1', password: 'enfermero123' });
    authTokenEnfermero = loginEnfermero.body.data.token;

    const loginAlmacenista = await request(app)
      .post('/api/auth/login')
      .send({ username: 'almacen1', password: 'almacen123' });
    authTokenAlmacenista = loginAlmacenista.body.data.token;

    // Obtener paciente de prueba
    const paciente = await prisma.paciente.findFirst({
      where: { activo: true }
    });
    pacienteId = paciente.id;

    // Crear cuenta de paciente de prueba
    const cuenta = await prisma.cuentaPaciente.create({
      data: {
        pacienteId: pacienteId,
        tipoAtencion: 'hospitalizacion',
        estado: 'abierta',
        anticipo: 0,
        totalServicios: 0,
        totalProductos: 0,
        totalCuenta: 0,
        saldoPendiente: 0,
        cajeroAperturaId: 1,
        habitacionId: 1
      }
    });
    cuentaPacienteId = cuenta.id;

    // Obtener producto de prueba
    const producto = await prisma.producto.findFirst({
      where: { 
        activo: true,
        stock: { gte: 10 }
      }
    });
    productoId = producto.id;
  });

  // Limpiar después de los tests
  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.notificacionSolicitud.deleteMany({});
    await prisma.historialSolicitud.deleteMany({});
    await prisma.detalleSolicitudProducto.deleteMany({});
    await prisma.solicitudProductos.deleteMany({});
    
    // Eliminar cuenta de prueba
    if (cuentaPacienteId) {
      await prisma.cuentaPaciente.delete({
        where: { id: cuentaPacienteId }
      });
    }
    
    await prisma.$disconnect();
  });

  // ==============================================
  // TESTS DE CREACIÓN DE SOLICITUDES
  // ==============================================

  describe('POST /api/solicitudes - Crear solicitud', () => {
    test('Debe crear una solicitud exitosamente como enfermero', async () => {
      const nuevaSolicitud = {
        pacienteId: pacienteId,
        cuentaPacienteId: cuentaPacienteId,
        prioridad: 'ALTA',
        observaciones: 'Solicitud urgente para paciente en UCI',
        productos: [
          {
            productoId: productoId,
            cantidadSolicitada: 5,
            observaciones: 'Para administración inmediata'
          }
        ]
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${authTokenEnfermero}`)
        .send(nuevaSolicitud);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Solicitud creada exitosamente');
      expect(response.body.solicitud).toHaveProperty('id');
      expect(response.body.solicitud.numero).toMatch(/^SP-/);
      expect(response.body.solicitud.estado).toBe('SOLICITADO');
      expect(response.body.solicitud.prioridad).toBe('ALTA');
      expect(response.body.solicitud.detalles).toHaveLength(1);
      
      solicitudId = response.body.solicitud.id;
    });

    test('Debe rechazar solicitud sin productos', async () => {
      const solicitudInvalida = {
        pacienteId: pacienteId,
        cuentaPacienteId: cuentaPacienteId,
        prioridad: 'NORMAL',
        productos: []
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${authTokenEnfermero}`)
        .send(solicitudInvalida);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('productos son requeridos');
    });

    test('Debe rechazar solicitud de almacenista (sin permisos)', async () => {
      const nuevaSolicitud = {
        pacienteId: pacienteId,
        cuentaPacienteId: cuentaPacienteId,
        prioridad: 'NORMAL',
        productos: [
          {
            productoId: productoId,
            cantidadSolicitada: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${authTokenAlmacenista}`)
        .send(nuevaSolicitud);

      expect(response.status).toBe(403);
    });
  });

  // ==============================================
  // TESTS DE CONSULTA DE SOLICITUDES
  // ==============================================

  describe('GET /api/solicitudes - Listar solicitudes', () => {
    test('Enfermero debe ver solo sus solicitudes', async () => {
      const response = await request(app)
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verificar que todas las solicitudes son del enfermero
      const solicitudesDelEnfermero = response.body.data.every(s => 
        s.solicitante.username === 'enfermero1'
      );
      expect(solicitudesDelEnfermero).toBe(true);
    });

    test('Almacenista debe ver solicitudes no asignadas', async () => {
      const response = await request(app)
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Debe incluir solicitudes sin asignar
      const tieneSolicitudesSinAsignar = response.body.data.some(s => 
        s.almacenistaId === null
      );
      expect(tieneSolicitudesSinAsignar).toBe(true);
    });

    test('Debe filtrar por estado correctamente', async () => {
      const response = await request(app)
        .get('/api/solicitudes?estado=SOLICITADO')
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(200);
      const todasSolicitadas = response.body.data.every(s => 
        s.estado === 'SOLICITADO'
      );
      expect(todasSolicitadas).toBe(true);
    });

    test('Debe filtrar por prioridad correctamente', async () => {
      const response = await request(app)
        .get('/api/solicitudes?prioridad=ALTA')
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(200);
      const todasPrioridadAlta = response.body.data.every(s => 
        s.prioridad === 'ALTA'
      );
      expect(todasPrioridadAlta).toBe(true);
    });
  });

  // ==============================================
  // TESTS DE DETALLE DE SOLICITUD
  // ==============================================

  describe('GET /api/solicitudes/:id - Ver detalle', () => {
    test('Debe obtener detalle completo de solicitud', async () => {
      const response = await request(app)
        .get(`/api/solicitudes/${solicitudId}`)
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(solicitudId);
      expect(response.body).toHaveProperty('paciente');
      expect(response.body).toHaveProperty('solicitante');
      expect(response.body).toHaveProperty('detalles');
      expect(response.body).toHaveProperty('historial');
      expect(response.body.historial).toBeInstanceOf(Array);
    });

    test('Debe rechazar acceso a solicitud de otro usuario', async () => {
      // Crear solicitud con otro usuario
      const otraSolicitud = await prisma.solicitudProductos.create({
        data: {
          numero: `SP-TEST-${Date.now()}`,
          pacienteId: pacienteId,
          cuentaPacienteId: cuentaPacienteId,
          solicitanteId: 2, // Otro usuario
          estado: 'SOLICITADO',
          prioridad: 'NORMAL',
          detalles: {
            create: {
              productoId: productoId,
              cantidadSolicitada: 1
            }
          }
        }
      });

      const response = await request(app)
        .get(`/api/solicitudes/${otraSolicitud.id}`)
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(403);

      // Limpiar
      await prisma.detalleSolicitudProducto.deleteMany({
        where: { solicitudId: otraSolicitud.id }
      });
      await prisma.solicitudProductos.delete({
        where: { id: otraSolicitud.id }
      });
    });
  });

  // ==============================================
  // TESTS DE ASIGNACIÓN (ALMACENISTA)
  // ==============================================

  describe('PUT /api/solicitudes/:id/asignar - Asignar solicitud', () => {
    test('Almacenista debe poder asignarse una solicitud', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/asignar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Solicitud asignada exitosamente');
      expect(response.body.solicitud.estado).toBe('EN_PREPARACION');
      expect(response.body.solicitud.almacenista).toBeDefined();
    });

    test('No debe poder asignar solicitud ya asignada', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/asignar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ya está asignada');
    });

    test('Enfermero no debe poder asignar solicitud', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/asignar`)
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(403);
    });
  });

  // ==============================================
  // TESTS DE ENTREGA (ALMACENISTA)
  // ==============================================

  describe('PUT /api/solicitudes/:id/entregar - Marcar como entregado', () => {
    test('Almacenista asignado debe poder marcar como entregado', async () => {
      // Obtener stock inicial
      const productoAntes = await prisma.producto.findUnique({
        where: { id: productoId }
      });
      const stockInicial = productoAntes.stock;

      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/entregar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`)
        .send({
          observaciones: 'Productos entregados en habitación 101'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Solicitud entregada exitosamente');

      // Verificar actualización de stock
      const productoDespues = await prisma.producto.findUnique({
        where: { id: productoId }
      });
      expect(productoDespues.stock).toBe(stockInicial - 5);

      // Verificar movimiento de inventario
      const movimiento = await prisma.movimientoInventario.findFirst({
        where: {
          productoId: productoId,
          tipoMovimiento: 'salida',
          numeroDocumento: { contains: 'SP-' }
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(movimiento).toBeDefined();
      expect(movimiento.cantidad).toBe(5);
    });

    test('No debe poder entregar solicitud ya entregada', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/entregar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Solo se pueden entregar solicitudes en preparación');
    });
  });

  // ==============================================
  // TESTS DE CONFIRMACIÓN (ENFERMERO)
  // ==============================================

  describe('PUT /api/solicitudes/:id/confirmar - Confirmar recepción', () => {
    test('Solicitante debe poder confirmar recepción', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/confirmar`)
        .set('Authorization', `Bearer ${authTokenEnfermero}`)
        .send({
          observaciones: 'Productos recibidos completos y en buen estado'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Recepción confirmada exitosamente');
      expect(response.body.solicitud.estado).toBe('COMPLETADO');
    });

    test('No debe poder confirmar solicitud ya completada', async () => {
      const response = await request(app)
        .put(`/api/solicitudes/${solicitudId}/confirmar`)
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Solo se pueden confirmar solicitudes entregadas');
    });

    test('Almacenista no debe poder confirmar recepción', async () => {
      // Crear otra solicitud para este test
      const otraSolicitud = await prisma.solicitudProductos.create({
        data: {
          numero: `SP-TEST2-${Date.now()}`,
          pacienteId: pacienteId,
          cuentaPacienteId: cuentaPacienteId,
          solicitanteId: 3, // ID del enfermero
          estado: 'ENTREGADO',
          prioridad: 'NORMAL',
          fechaEntrega: new Date(),
          detalles: {
            create: {
              productoId: productoId,
              cantidadSolicitada: 1
            }
          }
        }
      });

      const response = await request(app)
        .put(`/api/solicitudes/${otraSolicitud.id}/confirmar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(403);

      // Limpiar
      await prisma.detalleSolicitudProducto.deleteMany({
        where: { solicitudId: otraSolicitud.id }
      });
      await prisma.solicitudProductos.delete({
        where: { id: otraSolicitud.id }
      });
    });
  });

  // ==============================================
  // TESTS DE ESTADÍSTICAS
  // ==============================================

  describe('GET /api/solicitudes/stats/resumen - Estadísticas', () => {
    test('Debe obtener estadísticas correctamente', async () => {
      const response = await request(app)
        .get('/api/solicitudes/stats/resumen')
        .set('Authorization', `Bearer ${authTokenEnfermero}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSolicitudes');
      expect(response.body).toHaveProperty('solicitudesPorEstado');
      expect(response.body).toHaveProperty('solicitudesPorPrioridad');
      expect(response.body).toHaveProperty('solicitudesHoy');
      expect(response.body.solicitudesPorEstado).toBeInstanceOf(Array);
      expect(response.body.solicitudesPorPrioridad).toBeInstanceOf(Array);
    });
  });

  // ==============================================
  // TESTS DE NOTIFICACIONES
  // ==============================================

  describe('Sistema de Notificaciones', () => {
    test('Debe crear notificación al crear solicitud', async () => {
      // Verificar que se creó notificación para almacenista
      const notificaciones = await prisma.notificacionSolicitud.findMany({
        where: {
          tipo: 'NUEVA_SOLICITUD',
          solicitudId: solicitudId
        }
      });

      expect(notificaciones.length).toBeGreaterThan(0);
      expect(notificaciones[0].mensaje).toContain('Nueva solicitud de productos');
    });

    test('GET /api/notificaciones - Listar notificaciones del usuario', async () => {
      const response = await request(app)
        .get('/api/notificaciones')
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/notificaciones/no-leidas/count - Contar no leídas', async () => {
      const response = await request(app)
        .get('/api/notificaciones/no-leidas/count')
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });

    test('PUT /api/notificaciones/:id/marcar-leida - Marcar como leída', async () => {
      // Obtener una notificación
      const notificacion = await prisma.notificacionSolicitud.findFirst({
        where: {
          usuarioId: 4, // ID del almacenista
          leida: false
        }
      });

      if (notificacion) {
        const response = await request(app)
          .put(`/api/notificaciones/${notificacion.id}/marcar-leida`)
          .set('Authorization', `Bearer ${authTokenAlmacenista}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Notificación marcada como leída');

        // Verificar en BD
        const notificacionActualizada = await prisma.notificacionSolicitud.findUnique({
          where: { id: notificacion.id }
        });
        expect(notificacionActualizada.leida).toBe(true);
        expect(notificacionActualizada.fechaLectura).toBeDefined();
      }
    });
  });

  // ==============================================
  // TESTS DE VALIDACIÓN DE STOCK
  // ==============================================

  describe('Validación de Stock', () => {
    test('Debe validar stock insuficiente', async () => {
      // Intentar crear solicitud con cantidad mayor al stock
      const productoConPocoStock = await prisma.producto.findFirst({
        where: {
          activo: true,
          stock: { lte: 2 }
        }
      });

      if (productoConPocoStock) {
        const solicitudExcesiva = {
          pacienteId: pacienteId,
          cuentaPacienteId: cuentaPacienteId,
          prioridad: 'NORMAL',
          productos: [
            {
              productoId: productoConPocoStock.id,
              cantidadSolicitada: productoConPocoStock.stock + 10
            }
          ]
        };

        const response = await request(app)
          .post('/api/solicitudes')
          .set('Authorization', `Bearer ${authTokenEnfermero}`)
          .send(solicitudExcesiva);

        // La solicitud se crea pero con advertencia
        expect(response.status).toBe(201);
        
        // Al intentar entregarla debe fallar
        const solicitudCreada = response.body.solicitud;
        
        // Asignar primero
        await request(app)
          .put(`/api/solicitudes/${solicitudCreada.id}/asignar`)
          .set('Authorization', `Bearer ${authTokenAlmacenista}`);

        // Intentar entregar
        const entregaResponse = await request(app)
          .put(`/api/solicitudes/${solicitudCreada.id}/entregar`)
          .set('Authorization', `Bearer ${authTokenAlmacenista}`);

        expect(entregaResponse.status).toBe(400);
        expect(entregaResponse.body.error).toContain('Stock insuficiente');

        // Limpiar
        await prisma.detalleSolicitudProducto.deleteMany({
          where: { solicitudId: solicitudCreada.id }
        });
        await prisma.historialSolicitud.deleteMany({
          where: { solicitudId: solicitudCreada.id }
        });
        await prisma.notificacionSolicitud.deleteMany({
          where: { solicitudId: solicitudCreada.id }
        });
        await prisma.solicitudProductos.delete({
          where: { id: solicitudCreada.id }
        });
      }
    });
  });

  // ==============================================
  // TESTS DE INTEGRACIÓN CON CUENTA DE PACIENTE
  // ==============================================

  describe('Integración con Cuenta de Paciente', () => {
    test('Debe registrar productos en cuenta del paciente al entregar', async () => {
      // Crear nueva solicitud para este test
      const nuevaSolicitud = await request(app)
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${authTokenEnfermero}`)
        .send({
          pacienteId: pacienteId,
          cuentaPacienteId: cuentaPacienteId,
          prioridad: 'NORMAL',
          productos: [
            {
              productoId: productoId,
              cantidadSolicitada: 2
            }
          ]
        });

      const solicitudTestId = nuevaSolicitud.body.solicitud.id;

      // Asignar
      await request(app)
        .put(`/api/solicitudes/${solicitudTestId}/asignar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      // Entregar
      await request(app)
        .put(`/api/solicitudes/${solicitudTestId}/entregar`)
        .set('Authorization', `Bearer ${authTokenAlmacenista}`);

      // Verificar transacciones en cuenta
      const transacciones = await prisma.transaccionCuenta.findMany({
        where: {
          cuentaPacienteId: cuentaPacienteId,
          descripcion: { contains: `SP-` }
        }
      });

      expect(transacciones.length).toBeGreaterThan(0);
      expect(transacciones[0].tipoTransaccion).toBe('producto');
      expect(transacciones[0].cantidad).toBe(2);

      // Limpiar
      await prisma.transaccionCuenta.deleteMany({
        where: {
          cuentaPacienteId: cuentaPacienteId,
          descripcion: { contains: `SP-` }
        }
      });
      
      await prisma.detalleSolicitudProducto.deleteMany({
        where: { solicitudId: solicitudTestId }
      });
      await prisma.historialSolicitud.deleteMany({
        where: { solicitudId: solicitudTestId }
      });
      await prisma.notificacionSolicitud.deleteMany({
        where: { solicitudId: solicitudTestId }
      });
      await prisma.solicitudProductos.delete({
        where: { id: solicitudTestId }
      });
    });
  });
});

// ==============================================
// RESUMEN DE COBERTURA DE TESTS
// ==============================================

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        TESTS DEL SISTEMA DE SOLICITUDES DE PRODUCTOS         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ✓ Creación de solicitudes (permisos y validaciones)         ║
║  ✓ Consulta y filtrado de solicitudes                        ║
║  ✓ Asignación de solicitudes a almacenistas                  ║
║  ✓ Entrega de productos y actualización de inventario        ║
║  ✓ Confirmación de recepción por solicitante                 ║
║  ✓ Sistema de notificaciones automáticas                     ║
║  ✓ Validación de stock disponible                            ║
║  ✓ Integración con cuentas de pacientes                      ║
║  ✓ Permisos por rol (enfermero vs almacenista)              ║
║  ✓ Historial completo de estados                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);