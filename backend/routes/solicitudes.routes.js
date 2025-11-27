const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ==============================================
// ENDPOINTS DE SOLICITUDES DE PRODUCTOS
// ==============================================

// GET /api/solicitudes - Obtener todas las solicitudes
router.get('/', 
  authenticateToken, 
  authorizeRoles(['administrador', 'enfermero', 'medico_especialista', 'medico_residente', 'almacenista']),
  async (req, res) => {
    try {
      const { 
        estado, 
        prioridad,
        solicitanteId,
        almacenistaId,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir filtros
      const where = {};
      
      if (estado) {
        where.estado = estado;
      }
      
      if (prioridad) {
        where.prioridad = prioridad;
      }
      
      if (solicitanteId) {
        where.solicitanteId = parseInt(solicitanteId);
      }
      
      if (almacenistaId) {
        where.almacenistaId = parseInt(almacenistaId);
      }

      // Filtrar por rol del usuario
      if (req.user.rol === 'almacenista') {
        // Almacenistas solo ven solicitudes asignadas a ellos o sin asignar
        where.OR = [
          { almacenistaId: req.user.id },
          { almacenistaId: null }
        ];
      } else if (['enfermero', 'medico_especialista', 'medico_residente'].includes(req.user.rol)) {
        // Personal médico solo ve sus propias solicitudes
        where.solicitanteId = req.user.id;
      }

      // Obtener solicitudes
      const [solicitudes, total] = await Promise.all([
        prisma.solicitudProductos.findMany({
          where,
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                numeroExpediente: true
              }
            },
            cuentaPaciente: {
              select: {
                id: true,
                tipoAtencion: true,
                estado: true
              }
            },
            solicitante: {
              select: {
                id: true,
                username: true,
                nombre: true,
                apellidos: true,
                rol: true
              }
            },
            almacenista: {
              select: {
                id: true,
                username: true,
                nombre: true,
                apellidos: true
              }
            },
            detalles: {
              include: {
                producto: {
                  select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    unidadMedida: true,
                    stockActual: true
                  }
                }
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { prioridad: 'desc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.solicitudProductos.count({ where })
      ]);

      res.json({
        data: solicitudes,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      logger.logError('GET_REQUESTS', error, { filters: req.query });
      res.status(500).json({ 
        error: 'Error al obtener solicitudes',
        details: error.message 
      });
    }
  }
);

// GET /api/solicitudes/:id - Obtener una solicitud específica
router.get('/:id',
  authenticateToken,
  authorizeRoles(['administrador', 'enfermero', 'medico_especialista', 'medico_residente', 'almacenista']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const solicitud = await prisma.solicitudProductos.findUnique({
        where: { id: parseInt(id) },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              numeroExpediente: true
            }
          },
          cuentaPaciente: {
            select: {
              id: true,
              tipoAtencion: true,
              estado: true
            }
          },
          solicitante: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellidos: true,
              rol: true
            }
          },
          almacenista: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellidos: true
            }
          },
          detalles: {
            include: {
              producto: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  descripcion: true,
                  unidadMedida: true,
                  stockActual: true,
                  stockMinimo: true
                }
              }
            },
            orderBy: { id: 'asc' }
          },
          historial: {
            include: {
              usuario: {
                select: {
                  id: true,
                  username: true,
                  nombre: true,
                  apellidos: true,
                  rol: true
                }
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      // Verificar permisos
      if (!['administrador'].includes(req.user.rol)) {
        if (req.user.rol === 'almacenista' && solicitud.almacenistaId && solicitud.almacenistaId !== req.user.id) {
          return res.status(403).json({ error: 'No tienes permiso para ver esta solicitud' });
        } else if (['enfermero', 'medico_especialista', 'medico_residente'].includes(req.user.rol) && solicitud.solicitanteId !== req.user.id) {
          return res.status(403).json({ error: 'No tienes permiso para ver esta solicitud' });
        }
      }

      res.json(solicitud);
    } catch (error) {
      logger.logError('GET_REQUEST_BY_ID', error, { requestId: req.params.id });
      res.status(500).json({ 
        error: 'Error al obtener solicitud',
        details: error.message 
      });
    }
  }
);

// POST /api/solicitudes - Crear nueva solicitud
router.post('/',
  authenticateToken,
  authorizeRoles(['enfermero', 'medico_especialista', 'medico_residente']),
  auditMiddleware('solicitudes_productos', 'crear'),
  async (req, res) => {
    try {
      const { 
        pacienteId,
        cuentaPacienteId,
        prioridad = 'NORMAL',
        observaciones,
        productos // Array de { productoId, cantidadSolicitada, observaciones }
      } = req.body;

      // Validaciones
      if (!pacienteId || !cuentaPacienteId || !productos || productos.length === 0) {
        return res.status(400).json({ 
          error: 'pacienteId, cuentaPacienteId y productos son requeridos' 
        });
      }

      // Verificar que el paciente existe
      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(pacienteId) }
      });

      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Verificar que la cuenta del paciente existe y está abierta
      const cuentaPaciente = await prisma.cuentaPaciente.findUnique({
        where: { id: parseInt(cuentaPacienteId) }
      });

      if (!cuentaPaciente) {
        return res.status(404).json({ error: 'Cuenta del paciente no encontrada' });
      }

      if (cuentaPaciente.estado !== 'abierta') {
        return res.status(400).json({ error: 'La cuenta del paciente debe estar abierta' });
      }

      // Verificar que los productos existen
      const productosIds = productos.map(p => parseInt(p.productoId));
      const productosExistentes = await prisma.producto.findMany({
        where: {
          id: { in: productosIds },
          activo: true
        }
      });

      if (productosExistentes.length !== productosIds.length) {
        return res.status(400).json({ error: 'Algunos productos no existen o están inactivos' });
      }

      // Verificar stock disponible y crear advertencias
      const advertencias = [];
      for (const producto of productos) {
        const productoData = productosExistentes.find(p => p.id === parseInt(producto.productoId));
        if (productoData && productoData.stockActual < parseInt(producto.cantidadSolicitada)) {
          advertencias.push({
            productoId: productoData.id,
            productoNombre: productoData.nombre,
            stockActual: productoData.stockActual,
            cantidadSolicitada: parseInt(producto.cantidadSolicitada),
            mensaje: `Stock insuficiente para ${productoData.nombre}. Disponible: ${productoData.stockActual}, Solicitado: ${parseInt(producto.cantidadSolicitada)}`
          });
        }
      }

      // Generar número de solicitud
      const timestamp = Date.now();
      const numero = `SP-${timestamp}`;

      // Crear solicitud con detalles
      const solicitud = await prisma.solicitudProductos.create({
        data: {
          numero,
          pacienteId: parseInt(pacienteId),
          cuentaPacienteId: parseInt(cuentaPacienteId),
          solicitanteId: req.user.id,
          prioridad,
          observaciones,
          detalles: {
            create: productos.map(p => ({
              productoId: parseInt(p.productoId),
              cantidadSolicitada: parseInt(p.cantidadSolicitada),
              observaciones: p.observaciones
            }))
          },
          historial: {
            create: {
              estadoAnterior: null,
              estadoNuevo: 'SOLICITADO',
              usuarioId: req.user.id,
              observaciones: 'Solicitud creada'
            }
          }
        },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              numeroExpediente: true
            }
          },
          solicitante: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellidos: true,
              rol: true
            }
          },
          detalles: {
            include: {
              producto: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  unidadMedida: true
                }
              }
            }
          }
        }
      });

      // Crear notificación para almacenistas
      const almacenistas = await prisma.usuario.findMany({
        where: { 
          rol: 'almacenista',
          activo: true
        }
      });

      if (almacenistas.length > 0) {
        await prisma.notificacionSolicitud.createMany({
          data: almacenistas.map(almacenista => ({
            solicitudId: solicitud.id,
            usuarioId: almacenista.id,
            tipo: 'NUEVA_SOLICITUD',
            titulo: 'Nueva Solicitud de Productos',
            mensaje: `Nueva solicitud de productos #${numero} para paciente ${paciente.nombre} ${paciente.apellidoPaterno}`,
            leida: false
          }))
        });
      }

      // Registrar en auditoría
      req.auditData = {
        entidadId: solicitud.id,
        datosNuevos: solicitud
      };

      const response = {
        message: 'Solicitud creada exitosamente',
        solicitud
      };

      // Agregar advertencias si existen
      if (advertencias.length > 0) {
        response.advertencias = advertencias;
        response.message = 'Solicitud creada con advertencias de stock';
      }

      res.status(201).json(response);
    } catch (error) {
      logger.logError('CREATE_REQUEST', error, { solicitanteId: req.user.id });
      res.status(500).json({ 
        error: 'Error al crear solicitud',
        details: error.message 
      });
    }
  }
);

// PUT /api/solicitudes/:id/asignar - Asignar solicitud a almacenista
router.put('/:id/asignar',
  authenticateToken,
  authorizeRoles(['almacenista']),
  auditMiddleware('solicitudes_productos', 'asignar'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const solicitud = await prisma.solicitudProductos.findUnique({
        where: { id: parseInt(id) }
      });

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud.estado !== 'SOLICITADO') {
        return res.status(400).json({ error: 'Solo se pueden asignar solicitudes en estado SOLICITADO' });
      }

      if (solicitud.almacenistaId) {
        return res.status(400).json({ error: 'La solicitud ya está asignada' });
      }

      // Actualizar solicitud
      const solicitudActualizada = await prisma.solicitudProductos.update({
        where: { id: parseInt(id) },
        data: {
          almacenistaId: req.user.id,
          estado: 'PREPARANDO',
          historial: {
            create: {
              estadoAnterior: 'SOLICITADO',
              estadoNuevo: 'PREPARANDO',
              usuarioId: req.user.id,
              observaciones: 'Solicitud asignada para preparación'
            }
          }
        },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true
            }
          },
          solicitante: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellidos: true
            }
          }
        }
      });

      // Crear notificación para el solicitante
      await prisma.notificacionSolicitud.create({
        data: {
          solicitudId: solicitud.id,
          usuarioId: solicitud.solicitanteId,
          tipo: 'SOLICITUD_ASIGNADA',
          titulo: 'Solicitud en Preparación',
          mensaje: `Su solicitud #${solicitud.numero} ha sido asignada a un almacenista y está en preparación`,
          leida: false
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: solicitud,
        datosNuevos: solicitudActualizada
      };

      res.json({
        message: 'Solicitud asignada exitosamente',
        solicitud: solicitudActualizada
      });
    } catch (error) {
      logger.logError('ASSIGN_REQUEST', error, { requestId: req.params.id });
      res.status(500).json({ 
        error: 'Error al asignar solicitud',
        details: error.message 
      });
    }
  }
);

// PUT /api/solicitudes/:id/listo - Marcar como listo para entrega (notifica al enfermero)
router.put('/:id/listo',
  authenticateToken,
  authorizeRoles(['almacenista']),
  auditMiddleware('solicitudes_productos', 'listo'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const solicitud = await prisma.solicitudProductos.findUnique({
        where: { id: parseInt(id) },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true
            }
          },
          solicitante: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellidos: true
            }
          }
        }
      });

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud.almacenistaId !== req.user.id) {
        return res.status(403).json({ error: 'Solo el almacenista asignado puede marcar la solicitud como lista' });
      }

      if (solicitud.estado !== 'PREPARANDO') {
        return res.status(400).json({ error: 'Solo se pueden marcar como listas las solicitudes en preparación' });
      }

      // Actualizar solicitud a estado LISTO_ENTREGA
      const solicitudActualizada = await prisma.solicitudProductos.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'LISTO_ENTREGA',
          fechaPreparacion: new Date(),
          historial: {
            create: {
              estadoAnterior: 'PREPARANDO',
              estadoNuevo: 'LISTO_ENTREGA',
              usuarioId: req.user.id,
              observaciones: 'Productos preparados y listos para entrega'
            }
          }
        },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true
            }
          },
          solicitante: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellidos: true
            }
          }
        }
      });

      // Crear notificación para el solicitante (enfermero/médico) - PRODUCTOS_LISTOS
      await prisma.notificacionSolicitud.create({
        data: {
          solicitudId: solicitud.id,
          usuarioId: solicitud.solicitanteId,
          tipo: 'PRODUCTOS_LISTOS',
          titulo: 'Pedido Listo para Recoger',
          mensaje: `Su solicitud #${solicitud.numero} está lista. Por favor pase a almacén a recoger los productos para el paciente ${solicitud.paciente.nombre} ${solicitud.paciente.apellidoPaterno}`,
          leida: false
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: { estado: solicitud.estado },
        datosNuevos: { estado: 'LISTO_ENTREGA', fechaPreparacion: new Date() }
      };

      res.json({
        message: 'Solicitud marcada como lista para entrega. Se ha notificado al solicitante.',
        solicitud: solicitudActualizada
      });
    } catch (error) {
      logger.logError('READY_REQUEST', error, { requestId: req.params.id });
      res.status(500).json({
        error: 'Error al marcar solicitud como lista',
        details: error.message
      });
    }
  }
);

// PUT /api/solicitudes/:id/entregar - Marcar como entregado
router.put('/:id/entregar',
  authenticateToken,
  authorizeRoles(['almacenista']),
  auditMiddleware('solicitudes_productos', 'entregar'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;

      const solicitud = await prisma.solicitudProductos.findUnique({
        where: { id: parseInt(id) },
        include: {
          detalles: {
            include: {
              producto: true
            }
          }
        }
      });

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud.almacenistaId !== req.user.id) {
        return res.status(403).json({ error: 'Solo el almacenista asignado puede entregar la solicitud' });
      }

      if (!['PREPARANDO', 'LISTO_ENTREGA'].includes(solicitud.estado)) {
        return res.status(400).json({ error: 'Solo se pueden entregar solicitudes en preparación o listas para entrega' });
      }

      // Verificar stock disponible
      for (const detalle of solicitud.detalles) {
        if (detalle.producto.stockActual < detalle.cantidadSolicitada) {
          return res.status(400).json({
            error: `Stock insuficiente para el producto ${detalle.producto.nombre}. Stock actual: ${detalle.producto.stockActual}, solicitado: ${detalle.cantidadSolicitada}`
          });
        }
      }

      // Verificar que la cuenta del paciente esté abierta
      const cuenta = await prisma.cuentaPaciente.findUnique({
        where: { id: solicitud.cuentaPacienteId }
      });

      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta de paciente no encontrada' });
      }

      if (cuenta.estado === 'cerrada') {
        return res.status(400).json({
          error: 'No se pueden agregar cargos a una cuenta cerrada. La cuenta debe estar abierta.'
        });
      }

      // Actualizar solicitud y registrar movimientos de inventario
      await prisma.$transaction(async (tx) => {
        // Actualizar estado de solicitud
        await tx.solicitudProductos.update({
          where: { id: parseInt(id) },
          data: {
            estado: 'ENTREGADO',
            fechaEntrega: new Date(),
            historial: {
              create: {
                estadoAnterior: solicitud.estado,
                estadoNuevo: 'ENTREGADO',
                usuarioId: req.user.id,
                observaciones: observaciones || 'Productos entregados'
              }
            }
          }
        });

        // Registrar movimientos de inventario y actualizar stock
        for (const detalle of solicitud.detalles) {
          // Crear movimiento de salida
          await tx.movimientoInventario.create({
            data: {
              productoId: detalle.productoId,
              tipoMovimiento: 'salida',
              cantidad: detalle.cantidadSolicitada,
              motivo: `Entrega solicitud #${solicitud.numero}`,
              usuarioId: req.user.id,
              precioUnitario: detalle.producto.precioVenta || 0
            }
          });

          // Actualizar stock del producto
          await tx.producto.update({
            where: { id: detalle.productoId },
            data: {
              stockActual: {
                decrement: detalle.cantidadSolicitada
              }
            }
          });

          // Registrar en cuenta del paciente
          await tx.transaccionCuenta.create({
            data: {
              cuentaId: solicitud.cuentaPacienteId,
              tipo: 'producto',
              concepto: `${detalle.producto.nombre} - Solicitud #${solicitud.numero}`,
              cantidad: detalle.cantidadSolicitada,
              precioUnitario: detalle.producto.precioVenta || 0,
              subtotal: (detalle.producto.precioVenta || 0) * detalle.cantidadSolicitada,
              productoId: detalle.productoId
            }
          });
        }

        // Actualizar total de productos en cuenta
        const totalProductos = await tx.transaccionCuenta.aggregate({
          where: {
            cuentaId: solicitud.cuentaPacienteId,
            tipo: 'producto'
          },
          _sum: {
            subtotal: true
          }
        });

        // Obtener también el total de servicios para recalcular cuenta completa
        const totalServicios = await tx.transaccionCuenta.aggregate({
          where: {
            cuentaId: solicitud.cuentaPacienteId,
            tipo: 'servicio'
          },
          _sum: {
            subtotal: true
          }
        });

        const totalProductosValue = totalProductos._sum.subtotal || 0;
        const totalServiciosValue = totalServicios._sum.subtotal || 0;
        const totalCuentaValue = totalServiciosValue + totalProductosValue;

        // Obtener anticipo actual para calcular saldo
        const cuentaActual = await tx.cuentaPaciente.findUnique({
          where: { id: solicitud.cuentaPacienteId },
          select: { anticipo: true }
        });

        const saldoPendiente = parseFloat(cuentaActual.anticipo) - totalCuentaValue;

        await tx.cuentaPaciente.update({
          where: { id: solicitud.cuentaPacienteId },
          data: {
            totalProductos: totalProductosValue,
            totalCuenta: totalCuentaValue,
            saldoPendiente: saldoPendiente
          }
        });
      }, {
        maxWait: 5000,
        timeout: 10000
      });

      // Crear notificación para el solicitante
      await prisma.notificacionSolicitud.create({
        data: {
          solicitudId: solicitud.id,
          usuarioId: solicitud.solicitanteId,
          tipo: 'ENTREGA_CONFIRMADA',
          titulo: 'Productos Entregados',
          mensaje: `Su solicitud #${solicitud.numero} ha sido entregada y está lista para confirmar recepción`,
          leida: false
        }
      });

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: { estado: solicitud.estado },
        datosNuevos: { estado: 'ENTREGADO', fechaEntrega: new Date() }
      };

      res.json({
        message: 'Solicitud entregada exitosamente'
      });
    } catch (error) {
      logger.logError('DELIVER_REQUEST', error, { requestId: req.params.id });
      res.status(500).json({ 
        error: 'Error al entregar solicitud',
        details: error.message 
      });
    }
  }
);

// PUT /api/solicitudes/:id/confirmar - Confirmar recepción
router.put('/:id/confirmar',
  authenticateToken,
  authorizeRoles(['enfermero', 'medico_especialista', 'medico_residente']),
  auditMiddleware('solicitudes_productos', 'confirmar'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;

      const solicitud = await prisma.solicitudProductos.findUnique({
        where: { id: parseInt(id) }
      });

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud.solicitanteId !== req.user.id) {
        return res.status(403).json({ error: 'Solo el solicitante puede confirmar la recepción' });
      }

      if (solicitud.estado !== 'ENTREGADO') {
        return res.status(400).json({ error: 'Solo se pueden confirmar solicitudes entregadas' });
      }

      // Actualizar solicitud
      const solicitudActualizada = await prisma.solicitudProductos.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'RECIBIDO',
          fechaRecepcion: new Date(),
          historial: {
            create: {
              estadoAnterior: 'ENTREGADO',
              estadoNuevo: 'RECIBIDO',
              usuarioId: req.user.id,
              observaciones: observaciones || 'Recepción confirmada'
            }
          }
        }
      });

      // Crear notificación para el almacenista
      if (solicitud.almacenistaId) {
        await prisma.notificacionSolicitud.create({
          data: {
            solicitudId: solicitud.id,
            usuarioId: solicitud.almacenistaId,
            tipo: 'PRODUCTOS_APLICADOS',
            titulo: 'Solicitud Completada',
            mensaje: `La solicitud #${solicitud.numero} ha sido recibida y completada exitosamente`,
            leida: false
          }
        });
      }

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: solicitud,
        datosNuevos: solicitudActualizada
      };

      res.json({
        message: 'Recepción confirmada exitosamente',
        solicitud: solicitudActualizada
      });
    } catch (error) {
      logger.logError('CONFIRM_RECEPTION', error, { requestId: req.params.id });
      res.status(500).json({ 
        error: 'Error al confirmar recepción',
        details: error.message 
      });
    }
  }
);

// PUT /api/solicitudes/:id/cancelar - Cancelar solicitud
router.put('/:id/cancelar',
  authenticateToken,
  authorizeRoles(['administrador', 'enfermero', 'medico_especialista', 'medico_residente', 'almacenista']),
  auditMiddleware('solicitudes_productos', 'cancelar'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const solicitud = await prisma.solicitudProductos.findUnique({
        where: { id: parseInt(id) }
      });

      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      // Validar que la solicitud no esté ya entregada o recibida
      if (['ENTREGADO', 'RECIBIDO', 'APLICADO'].includes(solicitud.estado)) {
        return res.status(400).json({
          error: 'No se puede cancelar una solicitud que ya fue entregada o recibida'
        });
      }

      // Validar que la solicitud no esté ya cancelada
      if (solicitud.estado === 'CANCELADO') {
        return res.status(400).json({ error: 'La solicitud ya está cancelada' });
      }

      // Solo el solicitante o un administrador pueden cancelar
      if (req.user.rol !== 'administrador' && solicitud.solicitanteId !== req.user.id) {
        return res.status(403).json({
          error: 'Solo el solicitante o un administrador pueden cancelar la solicitud'
        });
      }

      // Actualizar solicitud
      const solicitudActualizada = await prisma.solicitudProductos.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'CANCELADO',
          historial: {
            create: {
              estadoAnterior: solicitud.estado,
              estadoNuevo: 'CANCELADO',
              usuarioId: req.user.id,
              observaciones: motivo || 'Solicitud cancelada'
            }
          }
        }
      });

      // Crear notificación para el almacenista si está asignado
      if (solicitud.almacenistaId) {
        await prisma.notificacionSolicitud.create({
          data: {
            solicitudId: solicitud.id,
            usuarioId: solicitud.almacenistaId,
            tipo: 'SOLICITUD_CANCELADA',
            titulo: 'Solicitud Cancelada',
            mensaje: `La solicitud #${solicitud.numero} ha sido cancelada. Motivo: ${motivo || 'No especificado'}`,
            leida: false
          }
        });
      }

      // Registrar en auditoría
      req.auditData = {
        entidadId: parseInt(id),
        datosAnteriores: solicitud,
        datosNuevos: solicitudActualizada
      };

      res.json({
        success: true,
        message: 'Solicitud cancelada exitosamente',
        solicitud: solicitudActualizada
      });
    } catch (error) {
      logger.logError('CANCEL_REQUEST', error, { requestId: req.params.id });
      res.status(500).json({
        error: 'Error al cancelar solicitud',
        details: error.message
      });
    }
  }
);

// GET /api/solicitudes/stats/resumen - Estadísticas de solicitudes
router.get('/stats/resumen',
  authenticateToken,
  authorizeRoles(['administrador', 'enfermero', 'medico_especialista', 'medico_residente', 'almacenista']),
  async (req, res) => {
    try {
      const where = {};

      // Filtrar por rol del usuario
      if (req.user.rol === 'almacenista') {
        where.OR = [
          { almacenistaId: req.user.id },
          { almacenistaId: null }
        ];
      } else if (['enfermero', 'medico_especialista', 'medico_residente'].includes(req.user.rol)) {
        where.solicitanteId = req.user.id;
      }

      const [
        totalSolicitudes,
        solicitudesPorEstado,
        solicitudesPorPrioridad,
        solicitudesHoy
      ] = await Promise.all([
        prisma.solicitudProductos.count({ where }),
        prisma.solicitudProductos.groupBy({
          by: ['estado'],
          where,
          _count: true
        }),
        prisma.solicitudProductos.groupBy({
          by: ['prioridad'],
          where,
          _count: true
        }),
        prisma.solicitudProductos.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      res.json({
        totalSolicitudes,
        solicitudesPorEstado: solicitudesPorEstado.map(item => ({
          estado: item.estado,
          cantidad: item._count
        })),
        solicitudesPorPrioridad: solicitudesPorPrioridad.map(item => ({
          prioridad: item.prioridad,
          cantidad: item._count
        })),
        solicitudesHoy
      });
    } catch (error) {
      logger.logError('GET_REQUESTS_STATS', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        details: error.message 
      });
    }
  }
);

module.exports = router;