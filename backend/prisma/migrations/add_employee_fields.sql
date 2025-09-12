-- Migración para agregar campos faltantes a la tabla empleados
-- Estos campos son importantes para la gestión completa del personal hospitalario

ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS genero VARCHAR(10) CHECK (genero IN ('M', 'F', 'Otro')),
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS turno VARCHAR(20) CHECK (turno IN ('matutino', 'vespertino', 'nocturno', 'mixto'));

-- Agregar comentarios para documentación
COMMENT ON COLUMN empleados.fecha_nacimiento IS 'Fecha de nacimiento del empleado para cálculos de edad y requisitos legales';
COMMENT ON COLUMN empleados.genero IS 'Género del empleado para estadísticas y reportes de diversidad';
COMMENT ON COLUMN empleados.direccion IS 'Dirección completa del empleado para contacto de emergencia';
COMMENT ON COLUMN empleados.turno IS 'Turno de trabajo asignado al empleado para gestión de horarios';