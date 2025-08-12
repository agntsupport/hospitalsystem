const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Limpiar datos existentes (opcional en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Limpiando datos existentes...');
      
      // Limpiar en orden inverso de dependencias para evitar violaciones de foreign key
      await prisma.auditoriaOperacion.deleteMany({});
      await prisma.cancelacion.deleteMany({});
      await prisma.causaCancelacion.deleteMany({});
      
      // Limpiar tablas de ventas y transacciones
      await prisma.itemVentaRapida.deleteMany({});
      await prisma.ventaRapida.deleteMany({});
      await prisma.pagoFactura.deleteMany({});
      await prisma.detalleFactura.deleteMany({});
      await prisma.factura.deleteMany({});
      
      // Limpiar otros datos transaccionales
      await prisma.movimientoInventario.deleteMany({});
      await prisma.transaccionCuenta.deleteMany({});
      await prisma.aplicacionMedicamento.deleteMany({});
      await prisma.seguimientoOrden.deleteMany({});
      await prisma.notaHospitalizacion.deleteMany({});
      await prisma.ordenMedica.deleteMany({});
      await prisma.hospitalizacion.deleteMany({});
      await prisma.historialMedico.deleteMany({});
      await prisma.citaMedica.deleteMany({});
      await prisma.cuentaPaciente.deleteMany({});
      
      // Limpiar datos maestros
      await prisma.producto.deleteMany({});
      await prisma.servicio.deleteMany({});
      await prisma.proveedor.deleteMany({});
      await prisma.consultorio.deleteMany({});
      await prisma.quirofano.deleteMany({});
      await prisma.habitacion.deleteMany({});
      await prisma.empleado.deleteMany({});
      await prisma.paciente.deleteMany({});
      await prisma.responsable.deleteMany({});
      await prisma.usuario.deleteMany({});
    }

    // Crear usuarios del sistema
    console.log('👥 Creando usuarios del sistema...');
    
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.usuario.create({
      data: {
        username: 'admin',
        passwordHash,
        email: 'admin@hospital.com',
        rol: 'administrador',
        activo: true
      }
    });

    const cajero = await prisma.usuario.create({
      data: {
        username: 'cajero1',
        passwordHash: await bcrypt.hash('cajero123', 12),
        email: 'cajero@hospital.com',
        rol: 'cajero',
        activo: true
      }
    });

    const enfermero = await prisma.usuario.create({
      data: {
        username: 'enfermero1',
        passwordHash: await bcrypt.hash('enfermero123', 12),
        email: 'enfermero@hospital.com',
        rol: 'enfermero',
        activo: true
      }
    });

    const medicoEspecialista = await prisma.usuario.create({
      data: {
        username: 'especialista1',
        passwordHash: await bcrypt.hash('medico123', 12),
        email: 'especialista@hospital.com',
        rol: 'medico_especialista',
        activo: true
      }
    });

    const medicoResidente = await prisma.usuario.create({
      data: {
        username: 'residente1',
        passwordHash: await bcrypt.hash('residente123', 12),
        email: 'residente@hospital.com',
        rol: 'medico_residente',
        activo: true
      }
    });

    const almacenista = await prisma.usuario.create({
      data: {
        username: 'almacen1',
        passwordHash: await bcrypt.hash('almacen123', 12),
        email: 'almacen@hospital.com',
        rol: 'almacenista',
        activo: true
      }
    });

    const socio = await prisma.usuario.create({
      data: {
        username: 'socio1',
        passwordHash: await bcrypt.hash('socio123', 12),
        email: 'socio@hospital.com',
        rol: 'socio',
        activo: true
      }
    });

    console.log('👥 Usuarios creados exitosamente');

    // Crear empleados
    console.log('👨‍⚕️ Creando empleados...');

    const empleadoEnfermero = await prisma.empleado.create({
      data: {
        nombre: 'María',
        apellidoPaterno: 'González',
        apellidoMaterno: 'López',
        tipoEmpleado: 'enfermero',
        telefono: '5551234567',
        email: 'maria.gonzalez@hospital.com',
        salario: 15000,
        fechaIngreso: new Date('2023-01-15'),
        activo: true
      }
    });

    const empleadoEspecialista = await prisma.empleado.create({
      data: {
        nombre: 'Dr. Carlos',
        apellidoPaterno: 'Rodríguez',
        apellidoMaterno: 'Morales',
        tipoEmpleado: 'medico_especialista',
        cedulaProfesional: '1234567',
        especialidad: 'Medicina Interna',
        telefono: '5559876543',
        email: 'carlos.rodriguez@hospital.com',
        salario: 45000,
        fechaIngreso: new Date('2020-03-01'),
        activo: true
      }
    });

    const empleadoResidente = await prisma.empleado.create({
      data: {
        nombre: 'Dra. Ana',
        apellidoPaterno: 'Martínez',
        apellidoMaterno: 'Hernández',
        tipoEmpleado: 'medico_residente',
        cedulaProfesional: '7654321',
        telefono: '5555678901',
        email: 'ana.martinez@hospital.com',
        salario: 25000,
        fechaIngreso: new Date('2023-07-01'),
        activo: true
      }
    });

    console.log('👨‍⚕️ Empleados creados exitosamente');

    // Crear habitaciones
    console.log('🏠 Creando habitaciones...');

    const habitaciones = [];
    for (let i = 101; i <= 110; i++) {
      const habitacion = await prisma.habitacion.create({
        data: {
          numero: i.toString(),
          tipo: i <= 105 ? 'individual' : 'doble',
          precioPorDia: i <= 105 ? 1500 : 2500,
          estado: 'disponible',
          descripcion: `Habitación ${i} - ${i <= 105 ? 'Individual' : 'Doble'}`
        }
      });
      habitaciones.push(habitacion);
    }

    // Crear una habitación de terapia intensiva
    const terapiaIntensiva = await prisma.habitacion.create({
      data: {
        numero: '201',
        tipo: 'terapia_intensiva',
        precioPorDia: 5000,
        estado: 'disponible',
        descripcion: 'Terapia Intensiva - Equipamiento completo'
      }
    });

    console.log('🏠 Habitaciones creadas exitosamente');

    // Crear consultorios
    console.log('🏢 Creando consultorios...');

    const consultorios = [];
    const especialidades = ['Medicina General', 'Cardiología', 'Pediatría', 'Ginecología', 'Traumatología'];
    
    // Mapeo de especialidades a tipos
    const tiposConsultorio = ['consulta_general', 'especialidad', 'especialidad', 'especialidad', 'urgencias'];
    
    for (let i = 1; i <= 5; i++) {
      const consultorio = await prisma.consultorio.create({
        data: {
          numero: `C${i}`,
          tipo: tiposConsultorio[i - 1],
          especialidad: especialidades[i - 1],
          estado: 'disponible',
          descripcion: `Consultorio ${i} - ${especialidades[i - 1]}`
        }
      });
      consultorios.push(consultorio);
    }

    console.log('🏢 Consultorios creados exitosamente');

    // Crear quirófanos
    console.log('🏥 Creando quirófanos...');
    const quirofanos = [];
    const tiposQuirofano = [
      { tipo: 'cirugia_general', especialidad: 'Cirugía General', equipamiento: 'Mesa quirúrgica universal, lámpara cialítica, monitor multiparámetros', precio: 1500.00 },
      { tipo: 'cirugia_cardiaca', especialidad: 'Cirugía Cardiovascular', equipamiento: 'Bomba de circulación extracorpórea, monitor cardíaco avanzado, desfibrilador', precio: 3000.00 },
      { tipo: 'cirugia_neurologica', especialidad: 'Neurocirugía', equipamiento: 'Microscopio quirúrgico, navegador estereotáctico, monitor neurológico', precio: 4000.00 },
      { tipo: 'cirugia_ortopedica', especialidad: 'Cirugía Ortopédica', equipamiento: 'Mesa de tracción, intensificador de imágenes, instrumental ortopédico', precio: 2000.00 },
      { tipo: 'cirugia_ambulatoria', especialidad: 'Cirugía Ambulatoria', equipamiento: 'Mesa quirúrgica básica, lámpara cialítica, monitor básico', precio: 800.00 }
    ];
    
    for (let i = 1; i <= 5; i++) {
      const quirofanoData = tiposQuirofano[i - 1];
      const quirofano = await prisma.quirofano.create({
        data: {
          numero: `Q${i}`,
          tipo: quirofanoData.tipo,
          especialidad: quirofanoData.especialidad,
          estado: 'disponible',
          descripcion: `Quirófano ${i} - ${quirofanoData.especialidad}`,
          equipamiento: quirofanoData.equipamiento,
          capacidadEquipo: i === 1 ? 8 : i === 2 ? 10 : 6, // Más capacidad para los quirófanos más especializados
          precioHora: quirofanoData.precio
        }
      });
      quirofanos.push(quirofano);
    }
    console.log('🏥 Quirófanos creados exitosamente');

    // Crear proveedores
    console.log('🏭 Creando proveedores...');

    const proveedor1 = await prisma.proveedor.create({
      data: {
        nombreEmpresa: 'Farmacia Nacional S.A.',
        contactoNombre: 'Juan Pérez',
        telefono: '5551111111',
        email: 'ventas@farmacanacional.com',
        direccion: 'Av. Principal 123, CDMX',
        rfc: 'FNA850101ABC',
        activo: true
      }
    });

    const proveedor2 = await prisma.proveedor.create({
      data: {
        nombreEmpresa: 'Suministros Médicos GAMMA',
        contactoNombre: 'Laura Sánchez',
        telefono: '5552222222',
        email: 'contacto@gamma.com.mx',
        direccion: 'Calle Secundaria 456, CDMX',
        rfc: 'SMG900201DEF',
        activo: true
      }
    });

    console.log('🏭 Proveedores creados exitosamente');

    // Crear productos
    console.log('💊 Creando productos...');

    const productos = [
      {
        codigo: 'MED001',
        nombre: 'Paracetamol 500mg',
        descripcion: 'Analgésico y antipirético',
        categoria: 'medicamento',
        unidadMedida: 'tableta',
        precioCompra: 0.50,
        precioVenta: 1.00,
        stockMinimo: 100,
        stockActual: 500,
        proveedorId: proveedor1.id
      },
      {
        codigo: 'MED002',
        nombre: 'Ibuprofeno 400mg',
        descripcion: 'Antiinflamatorio no esteroideo',
        categoria: 'medicamento',
        unidadMedida: 'tableta',
        precioCompra: 0.75,
        precioVenta: 1.50,
        stockMinimo: 50,
        stockActual: 200,
        proveedorId: proveedor1.id
      },
      {
        codigo: 'MAT001',
        nombre: 'Jeringa 5ml',
        descripcion: 'Jeringa desechable estéril',
        categoria: 'material_medico',
        unidadMedida: 'pieza',
        precioCompra: 1.25,
        precioVenta: 2.50,
        stockMinimo: 100,
        stockActual: 300,
        proveedorId: proveedor2.id
      },
      {
        codigo: 'MAT002',
        nombre: 'Gasa estéril 10x10cm',
        descripcion: 'Gasa estéril para curaciones',
        categoria: 'material_medico',
        unidadMedida: 'paquete',
        precioCompra: 5.00,
        precioVenta: 8.00,
        stockMinimo: 20,
        stockActual: 80,
        proveedorId: proveedor2.id
      },
      {
        codigo: 'INS001',
        nombre: 'Alcohol etílico 70%',
        descripcion: 'Antiséptico de uso médico',
        categoria: 'insumo',
        unidadMedida: 'litro',
        precioCompra: 15.00,
        precioVenta: 25.00,
        stockMinimo: 10,
        stockActual: 50,
        proveedorId: proveedor2.id
      }
    ];

    for (const producto of productos) {
      await prisma.producto.create({ data: producto });
    }

    console.log('💊 Productos creados exitosamente');

    // Crear servicios
    console.log('🏥 Creando servicios...');

    const servicios = [
      {
        codigo: 'SERV001',
        nombre: 'Consulta General',
        descripcion: 'Consulta médica general',
        tipo: 'consulta_general',
        precio: 350.00,
        activo: true
      },
      {
        codigo: 'SERV002',
        nombre: 'Consulta Especialidad',
        descripcion: 'Consulta con médico especialista',
        tipo: 'consulta_especialidad',
        precio: 650.00,
        activo: true
      },
      {
        codigo: 'SERV003',
        nombre: 'Atención de Urgencia',
        descripcion: 'Atención médica de urgencia',
        tipo: 'urgencia',
        precio: 800.00,
        activo: true
      },
      {
        codigo: 'SERV004',
        nombre: 'Curación Simple',
        descripcion: 'Curación de heridas menores',
        tipo: 'curacion',
        precio: 200.00,
        activo: true
      },
      {
        codigo: 'SERV005',
        nombre: 'Hospitalización',
        descripcion: 'Servicio de hospitalización por día',
        tipo: 'hospitalizacion',
        precio: 1500.00,
        activo: true
      }
    ];

    for (const servicio of servicios) {
      await prisma.servicio.create({ data: servicio });
    }

    console.log('🏥 Servicios creados exitosamente');

    // Crear algunos pacientes de ejemplo
    console.log('👤 Creando pacientes de ejemplo...');

    const paciente1 = await prisma.paciente.create({
      data: {
        nombre: 'José',
        apellidoPaterno: 'Ramírez',
        apellidoMaterno: 'García',
        fechaNacimiento: new Date('1985-05-15'),
        genero: 'M',
        telefono: '5554567890',
        email: 'jose.ramirez@email.com',
        direccion: 'Calle Ejemplo 789, Col. Centro',
        curp: 'RAGJ850515HDFMRR01',
        nss: '12345678901',
        esMenorEdad: false
      }
    });

    // Crear responsable para menor de edad
    const responsable = await prisma.responsable.create({
      data: {
        nombre: 'María',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Vargas',
        telefono: '5556789012',
        email: 'maria.lopez@email.com',
        parentesco: 'Madre',
        identificacion: 'INE123456789'
      }
    });

    const pacienteMenor = await prisma.paciente.create({
      data: {
        nombre: 'Sofía',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Torres',
        fechaNacimiento: new Date('2015-03-20'),
        genero: 'F',
        direccion: 'Av. Niños Héroes 456',
        esMenorEdad: true,
        responsableId: responsable.id
      }
    });

    console.log('👤 Pacientes creados exitosamente');

    // ==============================================
    // CAUSAS DE CANCELACIÓN
    // ==============================================
    console.log('🚫 Creando causas de cancelación...');

    const causasCancelacion = await Promise.all([
      prisma.causaCancelacion.create({
        data: {
          codigo: 'ERROR_CAPTURA',
          descripcion: 'Error en la captura de datos',
          categoria: 'OPERATIVO',
          requiereNota: false,
          requiereAutorizacion: false
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'ORDEN_MEDICA',
          descripcion: 'Cancelación por orden médica',
          categoria: 'MEDICO',
          requiereNota: true,
          requiereAutorizacion: true
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'PACIENTE_SOLICITA',
          descripcion: 'Solicitud del paciente',
          categoria: 'VOLUNTARIO',
          requiereNota: false,
          requiereAutorizacion: false
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'DUPLICADO',
          descripcion: 'Registro duplicado',
          categoria: 'OPERATIVO',
          requiereNota: false,
          requiereAutorizacion: false
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'DEVOLUCION',
          descripcion: 'Devolución de producto',
          categoria: 'COMERCIAL',
          requiereNota: true,
          requiereAutorizacion: true
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'NO_DEDUCIBLE',
          descripcion: 'Producto no deducible',
          categoria: 'COMERCIAL',
          requiereNota: true,
          requiereAutorizacion: true
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'FALTA_STOCK',
          descripcion: 'Producto agotado o sin stock',
          categoria: 'OPERATIVO',
          requiereNota: false,
          requiereAutorizacion: false
        }
      }),
      prisma.causaCancelacion.create({
        data: {
          codigo: 'CAMBIO_TRATAMIENTO',
          descripcion: 'Cambio en el plan de tratamiento',
          categoria: 'MEDICO',
          requiereNota: true,
          requiereAutorizacion: true
        }
      })
    ]);

    console.log(`🚫 ${causasCancelacion.length} causas de cancelación creadas`);

    console.log('✅ Seed completado exitosamente');
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('👨‍💼 Administrador: admin / admin123');
    console.log('💰 Cajero: cajero1 / cajero123');
    console.log('👩‍⚕️ Enfermero: enfermero1 / enfermero123');
    console.log('👨‍⚕️ Especialista: especialista1 / medico123');
    console.log('👩‍⚕️ Residente: residente1 / residente123');
    console.log('📦 Almacenista: almacen1 / almacen123');
    console.log('👔 Socio: socio1 / socio123');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });