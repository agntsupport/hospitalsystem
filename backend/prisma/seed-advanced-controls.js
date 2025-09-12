const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAdvancedControls() {
  console.log('🌱 Seeding advanced controls configuration...');

  try {
    // 1. LÍMITES DE AUTORIZACIÓN POR ROL
    console.log('Insertando límites de autorización...');
    
    const limites = [
      // Regla especial: Solo administradores pueden aplicar descuentos en cuentas
      {
        rol: 'administrador',
        tipoOperacion: 'descuento',
        limiteSinAutorizacion: 999999.99,
        limiteMaximo: null,
        rolesAutorizadores: []
      },
      // Otros roles NO pueden aplicar descuentos
      {
        rol: 'cajero',
        tipoOperacion: 'descuento',
        limiteSinAutorizacion: 0.00,
        limiteMaximo: 0.00,
        rolesAutorizadores: ['administrador']
      },
      {
        rol: 'medico_especialista',
        tipoOperacion: 'descuento',
        limiteSinAutorizacion: 0.00,
        limiteMaximo: 0.00,
        rolesAutorizadores: ['administrador']
      },
      
      // Límites para cancelaciones
      {
        rol: 'cajero',
        tipoOperacion: 'cancelacion',
        limiteSinAutorizacion: 200.00,
        limiteMaximo: 1000.00,
        rolesAutorizadores: ['administrador']
      },
      {
        rol: 'medico_especialista',
        tipoOperacion: 'cancelacion',
        limiteSinAutorizacion: 500.00,
        limiteMaximo: 2000.00,
        rolesAutorizadores: ['administrador']
      },
      {
        rol: 'administrador',
        tipoOperacion: 'cancelacion',
        limiteSinAutorizacion: 999999.99,
        limiteMaximo: null,
        rolesAutorizadores: []
      },
      
      // Límites para ajustes de inventario
      {
        rol: 'almacenista',
        tipoOperacion: 'ajuste_inventario',
        limiteSinAutorizacion: 500.00,
        limiteMaximo: 2000.00,
        rolesAutorizadores: ['administrador']
      },
      {
        rol: 'enfermero',
        tipoOperacion: 'ajuste_inventario',
        limiteSinAutorizacion: 50.00,
        limiteMaximo: 200.00,
        rolesAutorizadores: ['almacenista', 'administrador']
      },
      {
        rol: 'administrador',
        tipoOperacion: 'ajuste_inventario',
        limiteSinAutorizacion: 999999.99,
        limiteMaximo: null,
        rolesAutorizadores: []
      }
    ];

    for (const limite of limites) {
      await prisma.limiteAutorizacion.upsert({
        where: {
          id: 0 // Dummy where, usamos create/update manual
        },
        update: {},
        create: limite
      }).catch(async () => {
        // Si falla el upsert, intentamos actualizar o crear manualmente
        const existente = await prisma.limiteAutorizacion.findFirst({
          where: {
            rol: limite.rol,
            tipoOperacion: limite.tipoOperacion
          }
        });

        if (existente) {
          await prisma.limiteAutorizacion.update({
            where: { id: existente.id },
            data: limite
          });
        } else {
          await prisma.limiteAutorizacion.create({
            data: limite
          });
        }
      });
    }

    console.log(`✅ Insertados ${limites.length} límites de autorización`);

    // 2. DATOS DE EJEMPLO PARA ALERTAS DE INVENTARIO
    console.log('Configurando alertas de inventario...');
    
    // Obtener algunos productos para crear alertas de ejemplo
    const productos = await prisma.producto.findMany({
      take: 3,
      where: { activo: true }
    });

    const alertasEjemplo = [];
    
    for (const producto of productos) {
      // Alerta de stock bajo si el stock actual está por debajo del mínimo
      if (producto.stockActual <= producto.stockMinimo) {
        alertasEjemplo.push({
          productoId: producto.id,
          tipoAlerta: 'stock_bajo',
          umbral: producto.stockMinimo,
          valorActual: producto.stockActual,
          mensaje: `Stock bajo para ${producto.nombre}. Actual: ${producto.stockActual}, Mínimo: ${producto.stockMinimo}`,
          criticidad: producto.stockActual === 0 ? 'critica' : 'alta',
          activa: true
        });
      }
      
      // Alerta de precio si el precio de venta es muy alto comparado con el de compra
      if (producto.precioCompra && producto.precioVenta) {
        const margen = ((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100;
        if (margen > 300) { // Si el margen es mayor al 300%
          alertasEjemplo.push({
            productoId: producto.id,
            tipoAlerta: 'precio_modificado',
            umbral: producto.precioCompra * 3, // 300% del costo
            valorActual: producto.precioVenta,
            mensaje: `Margen de ganancia muy alto para ${producto.nombre}. Margen: ${margen.toFixed(1)}%`,
            criticidad: 'media',
            activa: true
          });
        }
      }
    }

    // Insertar alertas de ejemplo
    for (const alerta of alertasEjemplo) {
      await prisma.alertaInventario.create({
        data: alerta
      }).catch(err => {
        console.log('Alerta ya existe o error:', err.message);
      });
    }

    console.log(`✅ Creadas ${alertasEjemplo.length} alertas de inventario de ejemplo`);

    // 3. CAUSAS DE CANCELACIÓN ADICIONALES
    console.log('Agregando causas de cancelación adicionales...');
    
    const nuevasCausas = [
      {
        codigo: 'DESC_ADMIN',
        descripcion: 'Descuento autorizado por administrador',
        categoria: 'descuentos',
        requiereNota: true,
        requiereAutorizacion: false // Ya está autorizado por el administrador
      },
      {
        codigo: 'AJUSTE_PRECIO',
        descripcion: 'Ajuste de precio por error de captura',
        categoria: 'precios',
        requiereNota: true,
        requiereAutorizacion: true
      },
      {
        codigo: 'STOCK_CRITICO',
        descripcion: 'Cancelación por stock insuficiente',
        categoria: 'inventario',
        requiereNota: false,
        requiereAutorizacion: false
      },
      {
        codigo: 'MOVIMIENTO_NOCTURNO',
        descripcion: 'Movimiento realizado fuera de horario normal',
        categoria: 'horario',
        requiereNota: true,
        requiereAutorizacion: true
      }
    ];

    for (const causa of nuevasCausas) {
      await prisma.causaCancelacion.upsert({
        where: { codigo: causa.codigo },
        update: causa,
        create: causa
      });
    }

    console.log(`✅ Agregadas ${nuevasCausas.length} causas de cancelación`);

    console.log('🎉 Seed de controles avanzados completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en seed de controles avanzados:', error);
    throw error;
  }
}

// Ejecutar el seed
async function main() {
  try {
    await seedAdvancedControls();
  } catch (error) {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { seedAdvancedControls };