// ABOUTME: Helper functions para cálculos financieros del módulo POS
// Contiene lógica reutilizable para calcular totales, saldos y anticipos de cuentas de pacientes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calcula los totales financieros de una cuenta de paciente
 * @param {Object} cuenta - Objeto de cuenta de paciente de Prisma
 * @param {PrismaClient} [prismaInstance] - Instancia de Prisma (opcional, para transacciones)
 * @returns {Promise<Object>} - Totales calculados
 */
async function calcularTotalesCuenta(cuenta, prismaInstance = prisma) {
  // Cuenta CERRADA: usar snapshot histórico (valores almacenados)
  if (cuenta.estado === 'cerrada') {
    const anticipo = parseFloat(cuenta.anticipo?.toString() || 0);
    const totalServicios = parseFloat(cuenta.totalServicios?.toString() || 0);
    const totalProductos = parseFloat(cuenta.totalProductos?.toString() || 0);
    const totalCuenta = totalServicios + totalProductos;
    const saldoPendiente = anticipo - totalCuenta;

    return {
      anticipo,
      totalServicios,
      totalProductos,
      totalCuenta,
      saldoPendiente,
      totalPagosParciales: 0, // Cuentas cerradas no tienen pagos parciales pendientes
      fuente: 'snapshot' // Indica que los datos vienen del snapshot histórico
    };
  }

  // Cuenta ABIERTA: recalcular desde transacciones reales
  const [servicios, productos, anticipos, pagosParciales] = await Promise.all([
    prismaInstance.transaccionCuenta.aggregate({
      where: { cuentaPacienteId: cuenta.id, tipo: 'servicio' },
      _sum: { subtotal: true }
    }),
    prismaInstance.transaccionCuenta.aggregate({
      where: { cuentaPacienteId: cuenta.id, tipo: 'producto' },
      _sum: { subtotal: true }
    }),
    prismaInstance.transaccionCuenta.aggregate({
      where: { cuentaPacienteId: cuenta.id, tipo: 'anticipo' },
      _sum: { subtotal: true }
    }),
    prismaInstance.pago.aggregate({
      where: { cuentaPacienteId: cuenta.id, tipoPago: 'parcial' },
      _sum: { monto: true }
    })
  ]);

  const totalServicios = parseFloat(servicios._sum.subtotal || 0);
  const totalProductos = parseFloat(productos._sum.subtotal || 0);
  const totalCuenta = totalServicios + totalProductos;

  // Usar anticipos de transacciones si existen, sino usar el campo de la cuenta (compatibilidad legacy)
  const anticiposTransacciones = parseFloat(anticipos._sum.subtotal || 0);
  const anticipo = anticiposTransacciones > 0 ? anticiposTransacciones : parseFloat(cuenta.anticipo || 0);

  const totalPagosParciales = parseFloat(pagosParciales._sum.monto || 0);

  // Fórmula unificada (FASE 10): saldo = (anticipo + pagos_parciales) - cargos
  const saldoPendiente = (anticipo + totalPagosParciales) - totalCuenta;

  return {
    anticipo,
    totalServicios,
    totalProductos,
    totalCuenta,
    saldoPendiente,
    totalPagosParciales,
    fuente: 'transacciones' // Indica que los datos vienen de cálculo en tiempo real
  };
}

/**
 * Formatea los totales financieros con precisión decimal
 * @param {Object} totales - Totales calculados por calcularTotalesCuenta
 * @param {number} [decimals=2] - Número de decimales (default: 2)
 * @returns {Object} - Totales formateados
 */
function formatearTotales(totales, decimals = 2) {
  return {
    anticipo: parseFloat(totales.anticipo.toFixed(decimals)),
    totalServicios: parseFloat(totales.totalServicios.toFixed(decimals)),
    totalProductos: parseFloat(totales.totalProductos.toFixed(decimals)),
    totalCuenta: parseFloat(totales.totalCuenta.toFixed(decimals)),
    saldoPendiente: parseFloat(totales.saldoPendiente.toFixed(decimals)),
    totalPagosParciales: parseFloat(totales.totalPagosParciales.toFixed(decimals)),
    fuente: totales.fuente
  };
}

module.exports = {
  calcularTotalesCuenta,
  formatearTotales
};
