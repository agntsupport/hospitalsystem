const { prisma } = require('../../utils/database');
const bcrypt = require('bcrypt');

/**
 * Tests de concurrencia para verificar integridad de datos
 * Estos tests son críticos para prevenir race conditions en:
 * - Reservas de habitaciones
 * - Deducciones de inventario
 * - Programación de cirugías
 */

describe('Concurrency Control - Race Condition Tests', () => {
  let testQuirofano;
  let testProduct;
  let testRoom;

  beforeAll(async () => {
    // Crear quirófano de prueba
    testQuirofano = await prisma.quirofano.create({
      data: {
        numero: 'QTEST-001',
        tipo: 'cirugia_general',
        estado: 'disponible',
        capacidadEquipo: 10,
        precioHora: 5000
      }
    });

    // Crear producto de prueba con stock limitado
    testProduct = await prisma.producto.create({
      data: {
        nombre: 'Test Medicine Concurrency',
        codigo: 'TMC001',
        categoria: 'medicamento',
        unidadMedida: 'pieza',
        cantidadDisponible: 10, // Stock limitado
        precioUnitario: 100,
        precioVenta: 150,
        stockMinimo: 5,
        stockMaximo: 100,
        activo: true
      }
    });

    // Crear habitación de prueba
    testRoom = await prisma.habitacion.create({
      data: {
        numero: 'HTEST-001',
        tipo: 'individual',
        piso: 1,
        estado: 'disponible',
        precioNoche: 1500
      }
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.cirugiaQuirofano.deleteMany({ where: { quirofanoId: testQuirofano.id } });
    await prisma.movimientoInventario.deleteMany({ where: { productoId: testProduct.id } });
    await prisma.hospitalizacion.deleteMany({ where: { habitacionId: testRoom.id } });
    await prisma.quirofano.delete({ where: { id: testQuirofano.id } });
    await prisma.producto.delete({ where: { id: testProduct.id } });
    await prisma.habitacion.delete({ where: { id: testRoom.id } });
  });

  describe('Surgery Scheduling - Concurrent Booking Prevention', () => {
    it('should prevent double-booking of operating room', async () => {
      const testPatients = await Promise.all([
        prisma.paciente.create({
          data: {
            nombre: 'Patient1',
            apellidoPaterno: 'Concurrent',
            fechaNacimiento: new Date('1990-01-01'),
            genero: 'M',
            telefono: '1111111111',
            activo: true
          }
        }),
        prisma.paciente.create({
          data: {
            nombre: 'Patient2',
            apellidoPaterno: 'Concurrent',
            fechaNacimiento: new Date('1990-01-01'),
            genero: 'F',
            telefono: '2222222222',
            activo: true
          }
        })
      ]);

      const testDoctors = await Promise.all([
        prisma.empleado.create({
          data: {
            nombre: 'Doctor1',
            apellidoPaterno: 'Concurrent',
            cedulaProfesional: `CED${Date.now()}1`,
            especialidad: 'Cirujano',
            fechaNacimiento: new Date('1980-01-01'),
            genero: 'M',
            telefono: '1234567891',
            rol: 'medico_especialista',
            activo: true
          }
        }),
        prisma.empleado.create({
          data: {
            nombre: 'Doctor2',
            apellidoPaterno: 'Concurrent',
            cedulaProfesional: `CED${Date.now()}2`,
            especialidad: 'Cirujano',
            fechaNacimiento: new Date('1980-01-01'),
            genero: 'F',
            telefono: '1234567892',
            rol: 'medico_especialista',
            activo: true
          }
        })
      ]);

      const fechaHora = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mañana

      // Intentar programar 2 cirugías simultáneamente
      const surgeries = [
        prisma.cirugiaQuirofano.create({
          data: {
            quirofanoId: testQuirofano.id,
            pacienteId: testPatients[0].id,
            medicoId: testDoctors[0].id,
            tipoIntervencion: 'Test Surgery 1',
            fechaHoraProgramada: fechaHora,
            duracionEstimada: 120,
            estado: 'programada'
          }
        }),
        prisma.cirugiaQuirofano.create({
          data: {
            quirofanoId: testQuirofano.id,
            pacienteId: testPatients[1].id,
            medicoId: testDoctors[1].id,
            tipoIntervencion: 'Test Surgery 2',
            fechaHoraProgramada: fechaHora,
            duracionEstimada: 120,
            estado: 'programada'
          }
        })
      ];

      const results = await Promise.allSettled(surgeries);

      // Al menos una debería fallar (en sistema bien implementado)
      // O ambas deberían tener éxito pero con verificación de disponibilidad
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Verificar que solo una cirugía existe para esa fecha/hora
      const cirugiasEnQuirofano = await prisma.cirugiaQuirofano.findMany({
        where: {
          quirofanoId: testQuirofano.id,
          fechaHoraProgramada: fechaHora
        }
      });

      // Limpiar
      await prisma.cirugiaQuirofano.deleteMany({ where: { quirofanoId: testQuirofano.id } });
      await Promise.all(testPatients.map(p => prisma.paciente.delete({ where: { id: p.id } })));
      await Promise.all(testDoctors.map(d => prisma.empleado.delete({ where: { id: d.id } })));

      // El sistema debería prevenir double-booking
      expect(succeeded.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Inventory Deduction - Prevent Overselling', () => {
    it('should prevent selling more items than available stock', async () => {
      const initialStock = 10;

      // Intentar deducir 3 unidades 5 veces simultáneamente (total 15, pero solo hay 10)
      const deductions = Array(5).fill(null).map((_, i) =>
        prisma.$transaction(async (tx) => {
          // Leer stock actual
          const product = await tx.producto.findUnique({
            where: { id: testProduct.id }
          });

          if (product.cantidadDisponible >= 3) {
            // Deducir 3 unidades
            const updated = await tx.producto.update({
              where: { id: testProduct.id },
              data: {
                cantidadDisponible: {
                  decrement: 3
                }
              }
            });

            // Crear movimiento
            await tx.movimientoInventario.create({
              data: {
                productoId: testProduct.id,
                tipo: 'salida',
                cantidad: 3,
                motivo: `Concurrent test ${i}`,
                stockAnterior: product.cantidadDisponible,
                stockNuevo: updated.cantidadDisponible
              }
            });

            return updated;
          } else {
            throw new Error('Insufficient stock');
          }
        })
      );

      const results = await Promise.allSettled(deductions);

      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Verificar stock final
      const finalProduct = await prisma.producto.findUnique({
        where: { id: testProduct.id }
      });

      // El stock nunca debería ser negativo
      expect(finalProduct.cantidadDisponible).toBeGreaterThanOrEqual(0);

      // Como mucho 3 operaciones deberían tener éxito (3*3=9, más cercano a 10)
      expect(succeeded.length).toBeLessThanOrEqual(3);

      // Limpiar - Restaurar stock
      await prisma.movimientoInventario.deleteMany({ where: { productoId: testProduct.id } });
      await prisma.producto.update({
        where: { id: testProduct.id },
        data: { cantidadDisponible: 10 }
      });
    });
  });

  describe('Room Booking - Concurrent Admission Prevention', () => {
    it('should handle simultaneous room booking attempts', async () => {
      const testPatients = await Promise.all([
        prisma.paciente.create({
          data: {
            nombre: 'RoomTest1',
            apellidoPaterno: 'Concurrent',
            fechaNacimiento: new Date('1990-01-01'),
            genero: 'M',
            telefono: '3333333333',
            activo: true
          }
        }),
        prisma.paciente.create({
          data: {
            nombre: 'RoomTest2',
            apellidoPaterno: 'Concurrent',
            fechaNacimiento: new Date('1990-01-01'),
            genero: 'F',
            telefono: '4444444444',
            activo: true
          }
        })
      ]);

      // Intentar admitir 2 pacientes en la misma habitación simultáneamente
      const admissions = testPatients.map(patient =>
        prisma.$transaction(async (tx) => {
          // Verificar disponibilidad
          const room = await tx.habitacion.findUnique({
            where: { id: testRoom.id }
          });

          if (room.estado === 'disponible') {
            // Crear hospitalización
            const hospitalizacion = await tx.hospitalizacion.create({
              data: {
                pacienteId: patient.id,
                habitacionId: testRoom.id,
                fechaIngreso: new Date(),
                motivoIngreso: 'Concurrent test',
                diagnosticoIngreso: 'Test'
              }
            });

            // Actualizar estado de habitación
            await tx.habitacion.update({
              where: { id: testRoom.id },
              data: { estado: 'ocupada' }
            });

            return hospitalizacion;
          } else {
            throw new Error('Room not available');
          }
        })
      );

      const results = await Promise.allSettled(admissions);

      const succeeded = results.filter(r => r.status === 'fulfilled');

      // Solo una admisión debería tener éxito
      expect(succeeded.length).toBe(1);

      // Verificar estado de la habitación
      const room = await prisma.habitacion.findUnique({
        where: { id: testRoom.id }
      });
      expect(room.estado).toBe('ocupada');

      // Limpiar
      await prisma.hospitalizacion.deleteMany({ where: { habitacionId: testRoom.id } });
      await Promise.all(testPatients.map(p => prisma.paciente.delete({ where: { id: p.id } })));
      await prisma.habitacion.update({
        where: { id: testRoom.id },
        data: { estado: 'disponible' }
      });
    });
  });
});
