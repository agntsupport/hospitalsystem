const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAuditoria() {
  console.log('🌱 Insertando causas de cancelación iniciales...');

  // Datos de causas de cancelación
  const causas = [
    {
      codigo: 'ERROR_CAPTURA',
      descripcion: 'Error en la captura de datos',
      categoria: 'administrativo',
      requiereNota: true,
      requiereAutorizacion: false
    },
    {
      codigo: 'DUPLICADO',
      descripcion: 'Registro duplicado',
      categoria: 'administrativo',
      requiereNota: true,
      requiereAutorizacion: false
    },
    {
      codigo: 'DEVOLUCION',
      descripcion: 'Devolución de producto o servicio',
      categoria: 'operativo',
      requiereNota: true,
      requiereAutorizacion: true
    },
    {
      codigo: 'INDICACION_MEDICA',
      descripcion: 'Cancelación por indicación médica',
      categoria: 'medico',
      requiereNota: true,
      requiereAutorizacion: false
    },
    {
      codigo: 'NO_DEDUCIBLE',
      descripcion: 'Consumible no deducible de inventario',
      categoria: 'administrativo',
      requiereNota: true,
      requiereAutorizacion: true
    },
    {
      codigo: 'CAMBIO_TRATAMIENTO',
      descripcion: 'Cambio en el plan de tratamiento',
      categoria: 'medico',
      requiereNota: true,
      requiereAutorizacion: false
    },
    {
      codigo: 'ERROR_SISTEMA',
      descripcion: 'Error del sistema informático',
      categoria: 'tecnico',
      requiereNota: true,
      requiereAutorizacion: false
    },
    {
      codigo: 'ALTA_VOLUNTARIA',
      descripcion: 'Alta voluntaria del paciente',
      categoria: 'medico',
      requiereNota: true,
      requiereAutorizacion: false
    }
  ];

  // Insertar causas usando upsert para evitar duplicados
  for (const causa of causas) {
    await prisma.causaCancelacion.upsert({
      where: { codigo: causa.codigo },
      update: {},
      create: causa
    });
  }

  console.log('✅ Causas de cancelación insertadas correctamente');

  // Crear auditoría de ejemplo (opcional)
  console.log('🌱 Creando ejemplo de auditoría...');
  
  // Obtener el primer usuario administrador
  const admin = await prisma.usuario.findFirst({
    where: { rol: 'administrador' }
  });

  if (admin) {
    await prisma.auditoriaOperacion.create({
      data: {
        modulo: 'sistema',
        tipoOperacion: 'SEED',
        entidadTipo: 'inicializacion',
        entidadId: 1,
        usuarioId: admin.id,
        usuarioNombre: admin.username,
        rolUsuario: admin.rol,
        datosNuevos: { accion: 'Inicialización del sistema de auditoría' },
        motivo: 'Configuración inicial del sistema de trazabilidad'
      }
    });
    
    console.log('✅ Ejemplo de auditoría creado');
  }

  console.log('🎉 Seed de auditoría completado');
}

seedAuditoria()
  .catch((e) => {
    console.error('❌ Error en seed de auditoría:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });