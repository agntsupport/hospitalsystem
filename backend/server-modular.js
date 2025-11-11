const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config');
const { prisma } = require('./utils/database');
const { authenticateToken } = require('./middleware/auth.middleware');

// ==============================================
// CONFIGURACIÓN DEL SERVIDOR MODULAR
// ==============================================

const app = express();
const PORT = process.env.PORT || 3001;

// ==============================================
// TRUST PROXY (IMPORTANTE PARA EASYPANEL/NGINX)
// ==============================================
// Confiar en el proxy para headers como X-Forwarded-Proto
// Necesario cuando el servidor está detrás de un reverse proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
  console.log('✅ Trust proxy enabled (behind reverse proxy)');
}

// ==============================================
// SEGURIDAD: HELMET
// ==============================================
// Configurar headers de seguridad HTTP
const isProduction = process.env.NODE_ENV === 'production';
const isTestEnv = process.env.NODE_ENV === 'test';

app.use(helmet({
  contentSecurityPolicy: isProduction, // Habilitado en producción
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? {
    maxAge: 31536000, // 1 año en segundos
    includeSubDomains: true,
    preload: true
  } : false
}));

// ==============================================
// FORZAR HTTPS EN PRODUCCIÓN
// ==============================================
// Middleware para forzar HTTPS (solo en producción)
if (isProduction) {
  app.use((req, res, next) => {
    // Verificar si la conexión es segura
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isSecure) {
      // Redirigir a HTTPS
      const httpsUrl = `https://${req.hostname}${req.url}`;
      console.warn(`⚠️  HTTP request redirected to HTTPS: ${req.url}`);
      return res.redirect(301, httpsUrl);
    }

    next();
  });

  console.log('✅ HTTPS enforcement enabled (production mode)');
} else {
  console.log('⚠️  HTTPS enforcement disabled (development mode)');
}

// ==============================================
// COMPRESIÓN GZIP
// ==============================================
// Comprimir respuestas HTTP para reducir bandwidth
app.use(compression());

// ==============================================
// CORS
// ==============================================
// Middleware global de CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://hospital-management-system-frontend.1nse3e.easypanel.host' // Producción EasyPanel
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como curl, Postman, apps móviles)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight por 10 minutos
}));

// Manejo explícito de peticiones OPTIONS (preflight)
app.options('*', cors());

// ==============================================
// PARSERS DE BODY
// ==============================================
app.use(express.json({ limit: '1mb' })); // Reducido de 10mb a 1mb por seguridad
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ==============================================
// RATE LIMITING GLOBAL
// ==============================================
// Limitar requests generales a 100 por 15 minutos por IP
// NOTA: Desactivado en ambiente de testing para permitir E2E tests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intente después de 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

if (!isTestEnv) {
  app.use('/api/', generalLimiter);
  console.log('✅ Rate limiting global enabled (100 requests / 15 min)');
} else {
  console.log('⚠️  Rate limiting global DISABLED (test environment)');
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==============================================
// HEALTH CHECK
// ==============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sistema Hospitalario API (PostgreSQL + Arquitectura Modular)',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL con Prisma',
    architecture: 'Modular Routes',
    documentation: '/api-docs'
  });
});

// ==============================================
// SWAGGER API DOCUMENTATION
// ==============================================
/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Información básica del API
 *     responses:
 *       200:
 *         description: Información del servidor
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Sistema de Gestión Hospitalaria Integral - API',
    version: '2.0.0',
    author: 'Alfredo Manuel Reyes',
    company: 'agnt_ - Software Development Company',
    documentation: '/api-docs',
    health: '/health',
    endpoints: 121
  });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Hospital API Docs',
  customfavIcon: '/favicon.ico'
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('📚 Swagger documentation available at /api-docs');

// ==============================================
// MIDDLEWARE DE AUDITORÍA
// ==============================================

const { auditMiddleware, criticalOperationAudit, captureOriginalData } = require('./middleware/audit.middleware');

// ==============================================
// RUTAS MODULARES
// ==============================================

// Importar y configurar todas las rutas
const authRoutes = require('./routes/auth.routes');
const patientsRoutes = require('./routes/patients.routes');
const employeesRoutes = require('./routes/employees.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const roomsRoutes = require('./routes/rooms.routes');
const officesRoutes = require('./routes/offices.routes');
const quirofanosRoutes = require('./routes/quirofanos.routes');
const billingRoutes = require('./routes/billing.routes');
const hospitalizationRoutes = require('./routes/hospitalization.routes');
const posRoutes = require('./routes/pos.routes');
const reportsRoutes = require('./routes/reports.routes');
const auditRoutes = require('./routes/audit.routes');
const usersRoutes = require('./routes/users.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// ==============================================
// RATE LIMITING ESPECÍFICO PARA LOGIN
// ==============================================
// Limitar intentos de login a 5 por 15 minutos para prevenir brute force
// NOTA: Desactivado en ambiente de testing para permitir E2E tests
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login por ventana
  message: 'Demasiados intentos de inicio de sesión desde esta IP, por favor intente después de 15 minutos',
  skipSuccessfulRequests: true, // No contar logins exitosos
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiter específico al endpoint de login (excepto en testing)
if (!isTestEnv) {
  app.use('/api/auth/login', loginLimiter);
  console.log('✅ Rate limiting login enabled (5 attempts / 15 min)');
} else {
  console.log('⚠️  Rate limiting login DISABLED (test environment)');
}

// ==============================================
// CONFIGURACIÓN DE RUTAS
// ==============================================
// Configurar rutas con prefijos y auditoría
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes); // Tabla de ocupación en tiempo real
app.use('/api/patients', patientsRoutes);
app.use('/api/employees', employeesRoutes);

// Rutas con auditoría completa (módulos críticos)
app.use('/api/inventory', inventoryRoutes);

app.use('/api/pos',
  criticalOperationAudit,
  auditMiddleware('pos'),
  captureOriginalData('cuenta'),
  posRoutes
);

app.use('/api/hospitalization',
  criticalOperationAudit,
  auditMiddleware('hospitalizacion'),
  captureOriginalData('hospitalizacion'),
  hospitalizationRoutes
);

app.use('/api/billing',
  criticalOperationAudit,
  auditMiddleware('facturacion'),
  billingRoutes
);

// Rutas sin auditoría crítica
app.use('/api/rooms', roomsRoutes);
app.use('/api/offices', officesRoutes);
app.use('/api/quirofanos', quirofanosRoutes);
app.use('/api/reports', reportsRoutes);

// Ruta de consulta de auditoría
app.use('/api/audit', auditRoutes);

// Ruta de gestión de usuarios (solo administradores)
app.use('/api/users', usersRoutes);

// Rutas de solicitudes de productos con auditoría crítica
app.use('/api/solicitudes',
  criticalOperationAudit,
  auditMiddleware('solicitudes_productos'),
  solicitudesRoutes
);

// Rutas de notificaciones
app.use('/api/notificaciones', notificacionesRoutes);

// ==============================================
// ENDPOINTS LEGACY (COMPATIBILIDAD POS)
// ==============================================
// NOTA FASE 1: Los endpoints /api/services y /api/suppliers fueron migrados exitosamente a:
//   - routes/inventory.routes.js (GET /api/inventory/services y GET /api/inventory/suppliers)
//   - routes/pos.routes.js (GET /api/pos/services para POS)
// Los endpoints patient-accounts permanecen aquí temporalmente y serán migrados a billing.routes.js en FASE 2

// Patient Accounts (compatibilidad POS)
app.get('/api/patient-accounts', authenticateToken, async (req, res) => {
  try {
    const { estado = 'abierta', limit = 50 } = req.query;

    const cuentas = await prisma.cuentaPaciente.findMany({
      where: { estado },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            telefono: true,
            email: true
          }
        },
        medicoTratante: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true
          }
        },
        habitacion: {
          select: {
            id: true,
            numero: true,
            tipo: true
          }
        },
        cajeroApertura: {
          select: {
            id: true,
            username: true
          }
        },
        transacciones: {
          orderBy: { fechaTransaccion: 'desc' }
        }
      },
      orderBy: { fechaApertura: 'desc' },
      take: parseInt(limit)
    });

    // Recalcular totales en tiempo real para cada cuenta
    const cuentasFormatted = await Promise.all(cuentas.map(async (cuenta) => {
      // Calcular totales actualizados desde transacciones reales
      const [servicios, productos] = await Promise.all([
        prisma.transaccionCuenta.aggregate({
          where: { cuentaId: cuenta.id, tipo: 'servicio' },
          _sum: { subtotal: true }
        }),
        prisma.transaccionCuenta.aggregate({
          where: { cuentaId: cuenta.id, tipo: 'producto' },
          _sum: { subtotal: true }
        })
      ]);

      const totalServicios = parseFloat(servicios._sum.subtotal || 0);
      const totalProductos = parseFloat(productos._sum.subtotal || 0);
      const totalCuenta = totalServicios + totalProductos;
      const anticipo = parseFloat(cuenta.anticipo || 0);
      const saldoPendiente = anticipo - totalCuenta;

      return {
        id: cuenta.id,
        pacienteId: cuenta.pacienteId,
        tipoAtencion: cuenta.tipoAtencion,
        estado: cuenta.estado,
        anticipo,
        totalServicios,
        totalProductos,
        totalCuenta,
        saldoPendiente,
        habitacionId: cuenta.habitacionId,
        medicoTratanteId: cuenta.medicoTratanteId,
        cajeroAperturaId: cuenta.cajeroAperturaId,
        fechaApertura: cuenta.fechaApertura,
        fechaCierre: cuenta.fechaCierre,
        observaciones: cuenta.observaciones,
        // Datos enriquecidos
        paciente: cuenta.paciente ? {
          id: cuenta.paciente.id,
          nombre: cuenta.paciente.nombre,
          apellidoPaterno: cuenta.paciente.apellidoPaterno,
          apellidoMaterno: cuenta.paciente.apellidoMaterno,
          telefono: cuenta.paciente.telefono,
          email: cuenta.paciente.email
        } : null,
        medicoTratante: cuenta.medicoTratante ? {
          id: cuenta.medicoTratante.id,
          nombre: cuenta.medicoTratante.nombre,
          apellidoPaterno: cuenta.medicoTratante.apellidoPaterno,
          apellidoMaterno: cuenta.medicoTratante.apellidoMaterno,
          especialidad: cuenta.medicoTratante.especialidad
        } : null,
        habitacion: cuenta.habitacion ? {
          id: cuenta.habitacion.id,
          numero: cuenta.habitacion.numero,
          tipo: cuenta.habitacion.tipo
        } : null,
        cajeroApertura: cuenta.cajeroApertura,
        transacciones: cuenta.transacciones.map(t => ({
          id: t.id,
          tipo: t.tipo,
          concepto: t.concepto,
          cantidad: t.cantidad || 1,
          precioUnitario: parseFloat(t.subtotal || 0),
          subtotal: parseFloat(t.subtotal || 0),
          servicioId: t.servicioId,
          productoId: t.productoId,
          fechaTransaccion: t.fechaTransaccion
        }))
      };
    }));

    res.json({
      success: true,
      data: { accounts: cuentasFormatted },
      message: 'Cuentas obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ==============================================
// ⚠️ ENDPOINT LEGACY ELIMINADO: PUT /api/patient-accounts/:id/close
// ==============================================
// Este endpoint ha sido migrado a: PUT /api/pos/cuentas/:id/close (routes/pos.routes.js)
// Razón: Mejor lógica de negocio, snapshots históricos inmutables, validación de nota de alta
// Fecha de migración: 16 Enero 2025
// Migrado por: Opción 2 completa (sin excepciones)
// ==============================================

// POST /api/patient-accounts/:id/transactions - Agregar transacción a cuenta
app.post('/api/patient-accounts/:id/transactions', authenticateToken, auditMiddleware('transacciones_cuenta'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, cantidad = 1, servicioId, productoId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const cuenta = await prisma.cuentaPaciente.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    if (cuenta.estado === 'cerrada') {
      return res.status(400).json({
        success: false,
        message: 'No se pueden agregar transacciones a una cuenta cerrada'
      });
    }

    let transaccion;
    let concepto = '';
    let subtotal = 0;

    if (tipo === 'servicio' && servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId }
      });

      if (!servicio) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      concepto = servicio.nombre;
      subtotal = parseFloat(servicio.precio) * cantidad;

      transaccion = await prisma.transaccionCuenta.create({
        data: {
          cuentaId: parseInt(id),
          tipo: 'servicio',
          concepto,
          cantidad,
          precioUnitario: parseFloat(servicio.precio),
          subtotal,
          servicioId,
          empleadoCargoId: userId
        }
      });

      // Obtener cuenta actualizada con todas las transacciones incluyendo la nueva
      const cuentaActualConTransacciones = await prisma.cuentaPaciente.findUnique({
        where: { id: parseInt(id) },
        include: { transacciones: true }
      });

      const totalAnticipos = cuentaActualConTransacciones.transacciones
        .filter(t => t.tipo === 'anticipo')
        .reduce((sum, t) => sum + parseFloat(t.subtotal.toString()), 0);

      const nuevoTotalServicios = parseFloat(cuentaActualConTransacciones.totalServicios.toString()) + subtotal;
      const nuevoTotalCuenta = parseFloat(cuentaActualConTransacciones.totalCuenta.toString()) + subtotal;
      const nuevoSaldoPendiente = (nuevoTotalServicios + parseFloat(cuentaActualConTransacciones.totalProductos.toString())) - totalAnticipos;

      // Actualizar totales de la cuenta
      await prisma.cuentaPaciente.update({
        where: { id: parseInt(id) },
        data: {
          totalServicios: nuevoTotalServicios,
          totalCuenta: nuevoTotalCuenta,
          saldoPendiente: Math.max(0, nuevoSaldoPendiente) // No puede ser negativo
        }
      });

    } else if (tipo === 'producto' && productoId) {
      const producto = await prisma.producto.findUnique({
        where: { id: productoId }
      });

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      if (producto.stockActual < cantidad) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente'
        });
      }

      concepto = producto.nombre;
      subtotal = parseFloat(producto.precioVenta) * cantidad;

      transaccion = await prisma.transaccionCuenta.create({
        data: {
          cuentaId: parseInt(id),
          tipo: 'producto',
          concepto,
          cantidad,
          precioUnitario: parseFloat(producto.precioVenta),
          subtotal,
          productoId,
          empleadoCargoId: userId
        }
      });

      // Actualizar stock del producto
      await prisma.producto.update({
        where: { id: productoId },
        data: {
          stockActual: { decrement: cantidad }
        }
      });

      // Registrar movimiento de inventario
      await prisma.movimientoInventario.create({
        data: {
          productoId,
          tipoMovimiento: 'salida',
          cantidad,
          precioUnitario: parseFloat(producto.precioVenta),
          motivo: 'cuenta_paciente',
          usuarioId: userId,
          observaciones: `Cuenta paciente #${id} - ${concepto}`
        }
      });

      // Obtener cuenta actualizada con todas las transacciones incluyendo la nueva
      const cuentaActualConTransacciones = await prisma.cuentaPaciente.findUnique({
        where: { id: parseInt(id) },
        include: { transacciones: true }
      });

      const totalAnticipos = cuentaActualConTransacciones.transacciones
        .filter(t => t.tipo === 'anticipo')
        .reduce((sum, t) => sum + parseFloat(t.subtotal.toString()), 0);

      const nuevoTotalProductos = parseFloat(cuentaActualConTransacciones.totalProductos.toString()) + subtotal;
      const nuevoTotalCuenta = parseFloat(cuentaActualConTransacciones.totalCuenta.toString()) + subtotal;
      const nuevoSaldoPendiente = (parseFloat(cuentaActualConTransacciones.totalServicios.toString()) + nuevoTotalProductos) - totalAnticipos;

      // Actualizar totales de la cuenta
      await prisma.cuentaPaciente.update({
        where: { id: parseInt(id) },
        data: {
          totalProductos: nuevoTotalProductos,
          totalCuenta: nuevoTotalCuenta,
          saldoPendiente: Math.max(0, nuevoSaldoPendiente) // No puede ser negativo
        }
      });

    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo de transacción o ID de item inválido'
      });
    }

    // Obtener cuenta actualizada
    const cuentaActualizada = await prisma.cuentaPaciente.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: true,
        medicoTratante: true,
        transacciones: {
          orderBy: { fechaTransaccion: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: { 
        transaction: transaccion,
        account: cuentaActualizada 
      },
      message: 'Transacción agregada exitosamente'
    });

  } catch (error) {
    console.error('Error agregando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/patient-accounts/consistency-check - Verificar y corregir inconsistencias
app.get('/api/patient-accounts/consistency-check', authenticateToken, async (req, res) => {
  try {
    const inconsistencies = [];
    const fixes = [];

    // 1. Buscar hospitalizaciones activas con cuentas cerradas
    const hospitalizacionesActivasConCuentasCerradas = await prisma.hospitalizacion.findMany({
      where: {
        estado: {
          notIn: ['alta_medica', 'alta_voluntaria']
        }
      },
      include: {
        cuentaPaciente: {
          include: {
            paciente: true
          }
        },
        habitacion: true
      }
    });

    for (const hosp of hospitalizacionesActivasConCuentasCerradas) {
      if (hosp.cuentaPaciente?.estado === 'cerrada') {
        inconsistencies.push({
          type: 'cuenta_cerrada_con_hospitalizacion_activa',
          hospitalizacionId: hosp.id,
          cuentaId: hosp.cuentaPaciente.id,
          paciente: `${hosp.cuentaPaciente.paciente.nombre} ${hosp.cuentaPaciente.paciente.apellidoPaterno}`,
          habitacion: hosp.habitacion.numero,
          estadoHospitalizacion: hosp.estado,
          estadoCuenta: hosp.cuentaPaciente.estado
        });

        // Opción de autofix
        if (req.query.autofix === 'true') {
          await prisma.cuentaPaciente.update({
            where: { id: hosp.cuentaPaciente.id },
            data: {
              estado: 'abierta',
              fechaCierre: null,
              cajeroCierreId: null,
              saldoPendiente: hosp.cuentaPaciente.totalCuenta
            }
          });

          fixes.push({
            type: 'cuenta_reabierta',
            cuentaId: hosp.cuentaPaciente.id,
            hospitalizacionId: hosp.id
          });
        }
      }
    }

    // 2. Buscar cuentas abiertas sin hospitalización activa (solo para tipo hospitalización)
    const cuentasAbiertasHospitalizacion = await prisma.cuentaPaciente.findMany({
      where: {
        estado: 'abierta',
        tipoAtencion: 'hospitalizacion'
      },
      include: {
        paciente: true,
        hospitalizacion: true
      }
    });

    for (const cuenta of cuentasAbiertasHospitalizacion) {
      const hospitalizacionActiva = cuenta.hospitalizacion && 
        !['alta_medica', 'alta_voluntaria'].includes(cuenta.hospitalizacion.estado) ? 
        cuenta.hospitalizacion : null;

      if (!hospitalizacionActiva) {
        inconsistencies.push({
          type: 'cuenta_abierta_sin_hospitalizacion_activa',
          cuentaId: cuenta.id,
          paciente: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno}`,
          tipoAtencion: cuenta.tipoAtencion,
          estadoCuenta: cuenta.estado
        });
      }
    }

    // 3. Buscar habitaciones ocupadas sin hospitalización activa
    const habitacionesOcupadas = await prisma.habitacion.findMany({
      where: { estado: 'ocupada' },
      include: {
        hospitalizaciones: true
      }
    });

    for (const habitacion of habitacionesOcupadas) {
      const hospitalizacionActiva = habitacion.hospitalizaciones?.find(h => 
        !['alta_medica', 'alta_voluntaria'].includes(h.estado)
      );

      if (!hospitalizacionActiva) {
        inconsistencies.push({
          type: 'habitacion_ocupada_sin_hospitalizacion_activa',
          habitacionId: habitacion.id,
          numero: habitacion.numero,
          estado: habitacion.estado
        });

        // Opción de autofix
        if (req.query.autofix === 'true') {
          await prisma.habitacion.update({
            where: { id: habitacion.id },
            data: { estado: 'disponible' }
          });

          fixes.push({
            type: 'habitacion_liberada',
            habitacionId: habitacion.id,
            numero: habitacion.numero
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        inconsistencies,
        fixes,
        summary: {
          totalInconsistencies: inconsistencies.length,
          totalFixes: fixes.length,
          autofix: req.query.autofix === 'true'
        }
      },
      message: inconsistencies.length === 0 ? 
        'No se encontraron inconsistencias' : 
        `Se encontraron ${inconsistencies.length} inconsistencias${req.query.autofix === 'true' ? `, se aplicaron ${fixes.length} correcciones automáticas` : ''}`
    });

  } catch (error) {
    console.error('Error en verificación de consistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// ==============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint no encontrado',
    path: req.path,
    suggestion: 'Verifica la documentación de la API'
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Violación de unicidad en la base de datos'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro no encontrado'
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================

// Solo iniciar servidor si no estamos en modo test
if (require.main === module) {
  // Iniciar servicio de limpieza de tokens JWT blacklist
  const TokenCleanupService = require('./utils/token-cleanup');
  TokenCleanupService.startAutoCleanup(24); // Limpiar cada 24 horas

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 Servidor Hospital con Arquitectura Modular iniciado`);
    console.log(`🚀 Ejecutándose en: http://localhost:${PORT}`);
    console.log(`🗄️  Base de datos: PostgreSQL con Prisma ORM`);
    console.log(`🏗️  Arquitectura: Rutas Modulares`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`\n📚 Credenciales de prueba (desde BD):`);
    console.log(`   👨‍💼 admin / admin123`);
    console.log(`   💰 cajero1 / cajero123`);
    console.log(`   👩‍⚕️ enfermero1 / enfermero123`);
    console.log(`   👨‍⚕️ especialista1 / medico123`);
    console.log(`   👩‍⚕️ residente1 / residente123`);
    console.log(`   📦 almacen1 / almacen123`);
    console.log(`   👔 socio1 / socio123`);
    console.log(`\n🎯 Rutas disponibles:`);
    console.log(`   📋 /api/auth/* - Autenticación`);
    console.log(`   👥 /api/patients/* - Pacientes`);
    console.log(`   👨‍⚕️ /api/employees/* - Empleados`);
    console.log(`   📦 /api/inventory/* - Inventario`);
    console.log(`   🏠 /api/rooms/* - Habitaciones`);
    console.log(`   🏢 /api/offices/* - Consultorios`);
    console.log(`   🏥 /api/quirofanos/* - Quirófanos`);
    console.log(`   💰 /api/billing/* - Facturación`);
    console.log(`   🏥 /api/hospitalization/* - Hospitalización`);
    console.log(`   💳 /api/pos/* - Punto de Venta`);
    console.log(`   📊 /api/reports/* - Reportes`);
  });

  // Manejo de señales para cierre correcto
  process.on('SIGTERM', async () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT recibido, cerrando servidor...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  });
}

// Exportar para testing
module.exports = { app };