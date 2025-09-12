const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalcularTodasLasCuentas() {
  try {
    console.log('🔧 Iniciando recálculo de todas las cuentas abiertas...');
    
    // Obtener todas las cuentas abiertas
    const cuentasAbiertas = await prisma.cuentaPaciente.findMany({
      where: { estado: 'abierta' }
    });

    console.log(`📋 Encontradas ${cuentasAbiertas.length} cuentas abiertas para recalcular`);

    for (const cuenta of cuentasAbiertas) {
      console.log(`\n🔍 Procesando cuenta #${cuenta.id}...`);
      
      // Calcular totales por tipo de transacción
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
      const saldoPendiente = parseFloat(cuenta.anticipo) - totalCuenta;

      // Mostrar cambios
      console.log('  Totales anteriores:');
      console.log(`    Servicios: ${cuenta.totalServicios} -> ${totalServicios}`);
      console.log(`    Productos: ${cuenta.totalProductos} -> ${totalProductos}`);
      console.log(`    Total: ${cuenta.totalCuenta} -> ${totalCuenta}`);
      console.log(`    Saldo: ${cuenta.saldoPendiente} -> ${saldoPendiente}`);

      // Actualizar cuenta
      await prisma.cuentaPaciente.update({
        where: { id: cuenta.id },
        data: {
          totalServicios,
          totalProductos,
          totalCuenta,
          saldoPendiente
        }
      });

      console.log('  ✅ Cuenta actualizada correctamente');
    }

    console.log('\n🎉 ¡Recálculo completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante el recálculo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
recalcularTodasLasCuentas();