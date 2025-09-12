// Script para limpiar datos de prueba y preparar sistema para producción
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function cleanForProduction() {
  try {
    console.log('🧹 Iniciando limpieza para producción...');

    // 1. Eliminar todos los datos de prueba (manteniendo estructura)
    await prisma.$transaction([
      // Limpiar transacciones y datos operativos
      prisma.auditLog.deleteMany(),
      prisma.notasMedicas.deleteMany(),
      prisma.ingresoHospitalario.deleteMany(),
      prisma.cirugia.deleteMany(),
      prisma.factura.deleteMany(),
      prisma.cuentaPOS.deleteMany(),
      prisma.movimientoInventario.deleteMany(),
      
      // Limpiar datos maestros de prueba
      prisma.paciente.deleteMany(),
      prisma.proveedor.deleteMany(),
      prisma.producto.deleteMany(),
      prisma.servicio.deleteMany(),
      
      // Limpiar habitaciones y quirófanos de prueba (opcional)
      // prisma.quirofano.deleteMany(),
      // prisma.habitacion.deleteMany(),
      // prisma.consultorio.deleteMany(),
      
      // Limpiar empleados de prueba (mantener algunos roles base)
      prisma.empleado.deleteMany({
        where: {
          usuario: {
            username: {
              not: {
                in: ['admin', 'superadmin']
              }
            }
          }
        }
      }),
      
      // Limpiar usuarios de prueba (mantener admin)
      prisma.usuario.deleteMany({
        where: {
          username: {
            not: {
              in: ['admin', 'superadmin']
            }
          }
        }
      })
    ]);

    // 2. Crear usuario administrador para producción
    const hashedPassword = await bcrypt.hash('AdminSecure2025!', 10);
    
    await prisma.usuario.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        username: 'admin',
        password: hashedPassword,
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

    // 3. Crear algunos servicios básicos del hospital
    const serviciosBasicos = [
      { nombre: 'Consulta General', precio: 500.00, categoria: 'consulta' },
      { nombre: 'Consulta Especializada', precio: 800.00, categoria: 'consulta' },
      { nombre: 'Urgencias', precio: 1200.00, categoria: 'urgencia' },
      { nombre: 'Hospitalización por día', precio: 2500.00, categoria: 'hospitalizacion' },
      { nombre: 'Uso de Quirófano por hora', precio: 5000.00, categoria: 'cirugia' }
    ];

    for (const servicio of serviciosBasicos) {
      await prisma.servicio.upsert({
        where: { nombre: servicio.nombre },
        update: servicio,
        create: {
          ...servicio,
          isActive: true
        }
      });
    }

    console.log('✅ Sistema limpiado y preparado para producción');
    console.log('👤 Usuario administrador: admin / AdminSecure2025!');
    console.log('📋 Servicios básicos creados');
    console.log('🎯 El sistema está listo para datos reales');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanForProduction();