const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateRoomServices() {
  console.log('🏥 Iniciando migración de servicios para habitaciones existentes...');
  
  try {
    // 1. Obtener todas las habitaciones
    const habitaciones = await prisma.habitacion.findMany({
      orderBy: { numero: 'asc' }
    });
    
    console.log(`📋 Encontradas ${habitaciones.length} habitaciones`);
    
    // 2. Para cada habitación, verificar si ya tiene servicio
    let serviciosCreados = 0;
    let serviciosExistentes = 0;
    
    for (const habitacion of habitaciones) {
      const codigoServicio = `HAB-${habitacion.numero}`;
      
      // Verificar si ya existe el servicio
      const servicioExistente = await prisma.servicio.findFirst({
        where: { codigo: codigoServicio }
      });
      
      if (servicioExistente) {
        console.log(`✅ Servicio ${codigoServicio} ya existe`);
        serviciosExistentes++;
        continue;
      }
      
      // Crear el servicio automáticamente
      const nombreServicio = `Habitación ${habitacion.numero} - ${habitacion.tipo} (por día)`;
      const descripcionServicio = `Cargo por uso de habitación ${habitacion.numero} tipo ${habitacion.tipo}. Tarifa diaria.`;
      
      await prisma.servicio.create({
        data: {
          codigo: codigoServicio,
          nombre: nombreServicio,
          descripcion: descripcionServicio,
          tipo: 'hospitalizacion',
          precio: parseFloat(habitacion.precioPorDia),
          activo: true
        }
      });
      
      console.log(`🆕 Servicio creado: ${codigoServicio} - $${habitacion.precioPorDia}/día`);
      serviciosCreados++;
    }
    
    console.log('\n📊 Resumen de migración:');
    console.log(`- Servicios creados: ${serviciosCreados}`);
    console.log(`- Servicios existentes: ${serviciosExistentes}`);
    console.log(`- Total habitaciones: ${habitaciones.length}`);
    
    console.log('\n✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
if (require.main === module) {
  migrateRoomServices()
    .then(() => {
      console.log('🎉 Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateRoomServices };