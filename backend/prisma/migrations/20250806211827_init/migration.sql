-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('cajero', 'enfermero', 'almacenista', 'administrador', 'socio', 'medico_residente', 'medico_especialista');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('M', 'F', 'Otro');

-- CreateEnum
CREATE TYPE "TipoEmpleado" AS ENUM ('enfermero', 'medico_residente', 'medico_especialista');

-- CreateEnum
CREATE TYPE "TipoHabitacion" AS ENUM ('individual', 'doble', 'suite', 'terapia_intensiva');

-- CreateEnum
CREATE TYPE "EstadoHabitacion" AS ENUM ('disponible', 'ocupada', 'mantenimiento');

-- CreateEnum
CREATE TYPE "EstadoConsultorio" AS ENUM ('disponible', 'ocupado', 'mantenimiento');

-- CreateEnum
CREATE TYPE "CategoriaProducto" AS ENUM ('medicamento', 'material_medico', 'insumo');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('consulta_general', 'consulta_especialidad', 'urgencia', 'curacion', 'hospitalizacion');

-- CreateEnum
CREATE TYPE "TipoAtencion" AS ENUM ('consulta_general', 'urgencia', 'hospitalizacion');

-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('abierta', 'cerrada');

-- CreateEnum
CREATE TYPE "EstadoHospitalizacion" AS ENUM ('en_observacion', 'estable', 'critico', 'alta_medica', 'alta_voluntaria');

-- CreateEnum
CREATE TYPE "TipoOrden" AS ENUM ('medicamento', 'procedimiento', 'dieta', 'cuidados', 'laboratorio', 'interconsulta');

-- CreateEnum
CREATE TYPE "PrioridadOrden" AS ENUM ('rutina', 'urgente', 'inmediata');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('activa', 'completada', 'suspendida', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoNota" AS ENUM ('evolucion_medica', 'nota_enfermeria', 'interconsulta', 'procedimiento');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('matutino', 'vespertino', 'nocturno');

-- CreateEnum
CREATE TYPE "ViaAdministracion" AS ENUM ('oral', 'intravenosa', 'intramuscular', 'subcutanea', 'topica', 'inhalatoria');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('servicio', 'producto', 'anticipo', 'pago', 'medicamento_hospitalizado');

-- CreateEnum
CREATE TYPE "TipoCita" AS ENUM ('consulta_general', 'seguimiento', 'urgencia', 'control_post_hospitalizacion');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('programada', 'confirmada', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoConsulta" AS ENUM ('ambulatoria', 'urgencia', 'hospitalizacion');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('entrada', 'salida', 'ajuste', 'aplicacion_paciente');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsables" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "parentesco" TEXT NOT NULL,
    "identificacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responsables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "fecha_nacimiento" DATE NOT NULL,
    "genero" "Genero" NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "curp" TEXT,
    "nss" TEXT,
    "es_menor_edad" BOOLEAN NOT NULL DEFAULT false,
    "responsable_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "tipo_empleado" "TipoEmpleado" NOT NULL,
    "cedula_profesional" TEXT,
    "especialidad" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "salario" DECIMAL(10,2),
    "fecha_ingreso" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitaciones" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "TipoHabitacion" NOT NULL,
    "precio_por_dia" DECIMAL(8,2) NOT NULL,
    "estado" "EstadoHabitacion" NOT NULL DEFAULT 'disponible',
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultorios" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "especialidad" TEXT,
    "estado" "EstadoConsultorio" NOT NULL DEFAULT 'disponible',
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "contacto_nombre" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "rfc" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" "CategoriaProducto" NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "precio_compra" DECIMAL(8,2),
    "precio_venta" DECIMAL(8,2) NOT NULL,
    "stock_minimo" INTEGER NOT NULL DEFAULT 10,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "proveedor_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoServicio" NOT NULL,
    "precio" DECIMAL(8,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_pacientes" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tipo_atencion" "TipoAtencion" NOT NULL,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'abierta',
    "anticipo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_servicios" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_productos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_cuenta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "habitacion_id" INTEGER,
    "medico_tratante_id" INTEGER,
    "cajero_apertura_id" INTEGER NOT NULL,
    "cajero_cierre_id" INTEGER,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "observaciones" TEXT,

    CONSTRAINT "cuentas_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalizaciones" (
    "id" SERIAL NOT NULL,
    "cuenta_paciente_id" INTEGER NOT NULL,
    "habitacion_id" INTEGER NOT NULL,
    "medico_especialista_id" INTEGER NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_alta" TIMESTAMP(3),
    "motivo_hospitalizacion" TEXT NOT NULL,
    "diagnostico_ingreso" TEXT NOT NULL,
    "diagnostico_alta" TEXT,
    "estado" "EstadoHospitalizacion" NOT NULL DEFAULT 'en_observacion',
    "indicaciones_generales" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitalizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_medicas" (
    "id" SERIAL NOT NULL,
    "hospitalizacion_id" INTEGER NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "tipo_orden" "TipoOrden" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "frecuencia" TEXT,
    "duracion" TEXT,
    "prioridad" "PrioridadOrden" NOT NULL DEFAULT 'rutina',
    "estado" "EstadoOrden" NOT NULL DEFAULT 'activa',
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_hospitalizacion" (
    "id" SERIAL NOT NULL,
    "hospitalizacion_id" INTEGER NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "tipo_nota" "TipoNota" NOT NULL,
    "turno" "Turno" NOT NULL,
    "fecha_nota" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatura" DECIMAL(4,2),
    "presion_sistolica" INTEGER,
    "presion_diastolica" INTEGER,
    "frecuencia_cardiaca" INTEGER,
    "frecuencia_respiratoria" INTEGER,
    "saturacion_oxigeno" INTEGER,
    "estado_general" TEXT,
    "sintomas" TEXT,
    "examen_fisico" TEXT,
    "plan_tratamiento" TEXT,
    "observaciones" TEXT,
    "orden_medica_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_hospitalizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicacion_medicamentos" (
    "id" SERIAL NOT NULL,
    "orden_medica_id" INTEGER NOT NULL,
    "enfermero_id" INTEGER NOT NULL,
    "producto_id" INTEGER,
    "dosis_aplicada" TEXT NOT NULL,
    "via_administracion" "ViaAdministracion" NOT NULL,
    "fecha_aplicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reaccion_adversa" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicacion_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento_ordenes" (
    "id" SERIAL NOT NULL,
    "orden_medica_id" INTEGER NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "fecha_seguimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_anterior" "EstadoOrden" NOT NULL,
    "estado_nuevo" "EstadoOrden" NOT NULL,
    "motivo_cambio" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "seguimiento_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_cuenta" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "concepto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(8,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "servicio_id" INTEGER,
    "producto_id" INTEGER,
    "aplicacion_medicamento_id" INTEGER,
    "empleado_cargo_id" INTEGER,
    "fecha_transaccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "transacciones_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas_medicas" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "consultorio_id" INTEGER,
    "fecha_cita" TIMESTAMP(3) NOT NULL,
    "tipo_cita" "TipoCita" NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'programada',
    "motivo" TEXT,
    "observaciones" TEXT,
    "hospitalizacion_relacionada_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historiales_medicos" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "medico_id" INTEGER NOT NULL,
    "fecha_consulta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_consulta" "TipoConsulta" NOT NULL,
    "motivo_consulta" TEXT NOT NULL,
    "sintomas" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "medicamentos_recetados" TEXT,
    "observaciones" TEXT,
    "proxima_cita" DATE,
    "hospitalizacion_id" INTEGER,

    CONSTRAINT "historiales_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "tipo_movimiento" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(8,2),
    "motivo" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "cuenta_paciente_id" INTEGER,
    "aplicacion_medicamento_id" INTEGER,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_curp_key" ON "pacientes"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "habitaciones_numero_key" ON "habitaciones"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "consultorios_numero_key" ON "consultorios"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_codigo_key" ON "servicios"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "hospitalizaciones_cuenta_paciente_id_key" ON "hospitalizaciones"("cuenta_paciente_id");

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "responsables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_pacientes" ADD CONSTRAINT "cuentas_pacientes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_pacientes" ADD CONSTRAINT "cuentas_pacientes_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_pacientes" ADD CONSTRAINT "cuentas_pacientes_medico_tratante_id_fkey" FOREIGN KEY ("medico_tratante_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_pacientes" ADD CONSTRAINT "cuentas_pacientes_cajero_apertura_id_fkey" FOREIGN KEY ("cajero_apertura_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_pacientes" ADD CONSTRAINT "cuentas_pacientes_cajero_cierre_id_fkey" FOREIGN KEY ("cajero_cierre_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_cuenta_paciente_id_fkey" FOREIGN KEY ("cuenta_paciente_id") REFERENCES "cuentas_pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_medico_especialista_id_fkey" FOREIGN KEY ("medico_especialista_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_medicas" ADD CONSTRAINT "ordenes_medicas_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_hospitalizacion" ADD CONSTRAINT "notas_hospitalizacion_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_hospitalizacion" ADD CONSTRAINT "notas_hospitalizacion_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_hospitalizacion" ADD CONSTRAINT "notas_hospitalizacion_orden_medica_id_fkey" FOREIGN KEY ("orden_medica_id") REFERENCES "ordenes_medicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacion_medicamentos" ADD CONSTRAINT "aplicacion_medicamentos_orden_medica_id_fkey" FOREIGN KEY ("orden_medica_id") REFERENCES "ordenes_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacion_medicamentos" ADD CONSTRAINT "aplicacion_medicamentos_enfermero_id_fkey" FOREIGN KEY ("enfermero_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacion_medicamentos" ADD CONSTRAINT "aplicacion_medicamentos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_ordenes" ADD CONSTRAINT "seguimiento_ordenes_orden_medica_id_fkey" FOREIGN KEY ("orden_medica_id") REFERENCES "ordenes_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_ordenes" ADD CONSTRAINT "seguimiento_ordenes_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_aplicacion_medicamento_id_fkey" FOREIGN KEY ("aplicacion_medicamento_id") REFERENCES "aplicacion_medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_empleado_cargo_id_fkey" FOREIGN KEY ("empleado_cargo_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_medicas" ADD CONSTRAINT "citas_medicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_medicas" ADD CONSTRAINT "citas_medicas_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_medicas" ADD CONSTRAINT "citas_medicas_consultorio_id_fkey" FOREIGN KEY ("consultorio_id") REFERENCES "consultorios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historiales_medicos" ADD CONSTRAINT "historiales_medicos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historiales_medicos" ADD CONSTRAINT "historiales_medicos_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_cuenta_paciente_id_fkey" FOREIGN KEY ("cuenta_paciente_id") REFERENCES "cuentas_pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_aplicacion_medicamento_id_fkey" FOREIGN KEY ("aplicacion_medicamento_id") REFERENCES "aplicacion_medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
