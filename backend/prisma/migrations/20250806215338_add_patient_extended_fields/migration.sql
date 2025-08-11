-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('soltero', 'casado', 'divorciado', 'viudo', 'union_libre');

-- AlterTable
ALTER TABLE "pacientes" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alergias" TEXT,
ADD COLUMN     "antecedentes_familiares" TEXT,
ADD COLUMN     "antecedentes_patologicos" TEXT,
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "codigo_postal" TEXT,
ADD COLUMN     "contacto_emergencia_nombre" TEXT,
ADD COLUMN     "contacto_emergencia_relacion" TEXT,
ADD COLUMN     "contacto_emergencia_telefono" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "estado_civil" "EstadoCivil",
ADD COLUMN     "medicamentos_actuales" TEXT,
ADD COLUMN     "numero_expediente" TEXT,
ADD COLUMN     "ocupacion" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "seguro_aseguradora" TEXT,
ADD COLUMN     "seguro_numero_poliza" TEXT,
ADD COLUMN     "seguro_vigencia" TEXT,
ADD COLUMN     "tipo_sangre" TEXT,
ADD COLUMN     "ultima_visita" DATE;
