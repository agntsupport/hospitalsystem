-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "codigo_barras" TEXT,
ADD COLUMN     "contenido_por_unidad" TEXT,
ADD COLUMN     "fecha_caducidad" TEXT,
ADD COLUMN     "lote" TEXT,
ADD COLUMN     "requiere_receta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock_maximo" INTEGER DEFAULT 100,
ADD COLUMN     "ubicacion" TEXT;
