// Seed específico para producción - Solo datos esenciales
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Inicializando base de datos para PRODUCCIÓN...');

  // Solo crear usuario administrador
  const adminPassword = await bcrypt.hash('AdminSecure2025!', 10);
  
  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {
      password: adminPassword,
      isActive: true
    },
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@hospital.com',
      role: 'administrador',
      isActive: true,
      empleado: {
        create: {
          nombres: 'Administrador',
          apellidos: 'del Sistema',
          tipoEmpleado: 'administrativo',
          telefono: '0000000000',
          isActive: true
        }
      }
    }
  });

  // Servicios básicos del hospital
  const servicios = [
    { nombre: 'Consulta General', precio: 500.00, categoria: 'consulta', descripcion: 'Consulta médica general' },
    { nombre: 'Consulta Especializada', precio: 800.00, categoria: 'consulta', descripcion: 'Consulta con especialista' },
    { nombre: 'Consulta Urgencias', precio: 1200.00, categoria: 'urgencia', descripcion: 'Atención de urgencias' },
    { nombre: 'Día de Hospitalización', precio: 2500.00, categoria: 'hospitalizacion', descripcion: 'Costo por día de hospitalización' },
    { nombre: 'Hora de Quirófano', precio: 5000.00, categoria: 'cirugia', descripcion: 'Costo por hora de quirófano' }
  ];

  for (const servicio of servicios) {
    await prisma.servicio.upsert({
      where: { nombre: servicio.nombre },
      update: servicio,
      create: {
        ...servicio,
        isActive: true
      }
    });
  }

  console.log('✅ Base de datos inicializada para PRODUCCIÓN');
  console.log('👤 Usuario administrador creado: admin / AdminSecure2025!');
  console.log('📋 Servicios básicos configurados');
  console.log('');
  console.log('🎯 SIGUIENTE PASO:');
  console.log('   El administrador debe configurar:');
  console.log('   - Empleados del hospital');
  console.log('   - Habitaciones y consultorios');
  console.log('   - Productos de inventario');
  console.log('   - Proveedores');
  console.log('   - Quirófanos si aplica');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });