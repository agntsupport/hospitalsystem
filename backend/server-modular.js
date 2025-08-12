const express = require('express');
const cors = require('cors');
const { prisma } = require('./utils/database');

// ==============================================
// CONFIGURACIÓN DEL SERVIDOR MODULAR
// ==============================================

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    architecture: 'Modular Routes'
  });
});

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

// Configurar rutas con prefijos y auditoría
app.use('/api/auth', authRoutes);
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

// ==============================================
// ENDPOINTS LEGACY (COMPATIBILIDAD)
// ==============================================

// Servicios (compatibilidad con endpoints existentes)
app.get('/api/services', async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }]
    });

    const serviciosFormatted = servicios.map(servicio => ({
      id: servicio.id,
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      tipo: servicio.tipo,
      precio: parseFloat(servicio.precio.toString()),
      activo: servicio.activo
    }));

    res.json({
      success: true,
      data: { items: serviciosFormatted },
      message: 'Servicios obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Proveedores (compatibilidad)
app.get('/api/suppliers', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    const where = { activo: true };
    if (search) {
      where.OR = [
        { nombreEmpresa: { contains: search, mode: 'insensitive' } },
        { contactoNombre: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        orderBy: { nombreEmpresa: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.proveedor.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items: proveedores.map(p => ({
          id: p.id,
          nombreEmpresa: p.nombreEmpresa,
          contactoNombre: p.contactoNombre,
          telefono: p.telefono,
          email: p.email,
          direccion: p.direccion,
          activo: p.activo
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Patient Accounts (compatibilidad POS)
app.get('/api/patient-accounts', async (req, res) => {
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
            apellidoMaterno: true
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

    const cuentasFormatted = cuentas.map(cuenta => ({
      id: cuenta.id,
      paciente: {
        id: cuenta.paciente.id,
        nombreCompleto: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno} ${cuenta.paciente.apellidoMaterno || ''}`.trim()
      },
      tipoAtencion: cuenta.tipoAtencion,
      estado: cuenta.estado,
      anticipo: parseFloat(cuenta.anticipo || 0),
      totalServicios: parseFloat(cuenta.totalServicios || 0),
      totalProductos: parseFloat(cuenta.totalProductos || 0),
      totalCuenta: parseFloat(cuenta.totalCuenta || 0),
      saldoPendiente: parseFloat(cuenta.saldoPendiente || 0),
      fechaApertura: cuenta.fechaApertura,
      fechaCierre: cuenta.fechaCierre,
      cajeroApertura: cuenta.cajeroApertura,
      transacciones: cuenta.transacciones.map(t => ({
        id: t.id,
        tipo: t.tipo,
        concepto: t.concepto,
        subtotal: parseFloat(t.subtotal),
        fechaTransaccion: t.fechaTransaccion
      }))
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

// Exportar para testing
module.exports = { app };