/**
 * Global teardown para Jest
 * Se ejecuta una vez al final de todos los tests
 * Cierra correctamente las conexiones de Prisma
 */

const { prisma } = require('../utils/database');

module.exports = async () => {
  console.log('\n🧹 Limpiando recursos globales de tests...');

  try {
    // Desconectar Prisma
    await prisma.$disconnect();
    console.log('✅ Prisma desconectado correctamente');
  } catch (error) {
    console.error('❌ Error al desconectar Prisma:', error);
  }
};
