-- Benchmark: Performance Index Analysis
-- Purpose: Verify index usage and measure query performance

\timing on

-- Test 1: Search active patients by name (uses idx_pacientes_nombre_apellidos)
EXPLAIN ANALYZE
SELECT * FROM pacientes
WHERE nombre LIKE 'Juan%'
  AND apellido_paterno LIKE 'Gon%'
  AND activo = true
LIMIT 10;

-- Test 2: Get active accounts by patient with estado filter (uses idx_cuentas_paciente_id_estado)
EXPLAIN ANALYZE
SELECT * FROM cuentas_pacientes
WHERE paciente_id IN (SELECT id FROM pacientes WHERE activo = true LIMIT 10)
  AND estado = 'abierta'
ORDER BY fecha_apertura DESC;

-- Test 3: Get recent transactions for a cuenta (uses idx_transacciones_cuenta_fecha)
EXPLAIN ANALYZE
SELECT * FROM transacciones_cuenta
WHERE cuenta_id IN (SELECT id FROM cuentas_pacientes LIMIT 5)
ORDER BY fecha_transaccion DESC
LIMIT 100;

-- Test 4: Product inventory movements by date (uses idx_movimientos_producto_fecha)
EXPLAIN ANALYZE
SELECT * FROM movimientos_inventario
WHERE producto_id IN (SELECT id FROM productos LIMIT 10)
ORDER BY fecha_movimiento DESC
LIMIT 50;

-- Test 5: Active doctors by specialty (uses idx_empleados_tipo_empleado, idx_empleados_especialidad)
EXPLAIN ANALYZE
SELECT * FROM empleados
WHERE tipo_empleado IN ('medico_especialista', 'medico_residente')
  AND especialidad IS NOT NULL
  AND activo = true
ORDER BY fecha_ingreso DESC;

-- Test 6: Available rooms by type and state (uses idx_habitaciones_estado_tipo)
EXPLAIN ANALYZE
SELECT * FROM habitaciones
WHERE estado = 'disponible'
  AND tipo IN ('individual', 'suite')
ORDER BY numero;

-- Test 7: Upcoming medical appointments (uses idx_citas_medico_fecha)
EXPLAIN ANALYZE
SELECT * FROM citas_medicas
WHERE medico_id IN (SELECT id FROM empleados WHERE tipo_empleado = 'medico_especialista' LIMIT 3)
  AND fecha_cita >= NOW()
  AND estado = 'programada'
ORDER BY fecha_cita ASC
LIMIT 20;

-- Test 8: Pending invoices with balance (uses idx_facturas_estado_fecha, idx_facturas_saldo_pendiente)
EXPLAIN ANALYZE
SELECT * FROM facturas
WHERE estado IN ('pending', 'partial')
  AND saldo_pendiente > 0
ORDER BY fecha_factura DESC
LIMIT 50;

-- Test 9: Active urgent product requests (uses idx_solicitudes_estado_prioridad)
EXPLAIN ANALYZE
SELECT * FROM solicitudes_productos
WHERE estado IN ('SOLICITADO', 'NOTIFICADO', 'PREPARANDO')
  AND prioridad IN ('URGENTE', 'ALTA')
ORDER BY fecha_solicitud DESC;

-- Test 10: Products below minimum stock (uses idx_productos_stock_bajo)
EXPLAIN ANALYZE
SELECT * FROM productos
WHERE stock_actual <= stock_minimo
  AND activo = true
ORDER BY stock_actual ASC;

-- Test 11: Active hospitalizations by room (uses idx_hospitalizaciones_habitacion_estado)
EXPLAIN ANALYZE
SELECT * FROM hospitalizaciones
WHERE habitacion_id IN (SELECT id FROM habitaciones WHERE estado = 'ocupada')
  AND estado IN ('en_observacion', 'estable', 'critico')
ORDER BY fecha_ingreso DESC;

-- Test 12: Recent audit operations by user (uses existing idx auditoriaOperacion)
EXPLAIN ANALYZE
SELECT * FROM auditoria_operaciones
WHERE usuario_id IN (SELECT id FROM usuarios WHERE rol = 'administrador' LIMIT 3)
ORDER BY created_at DESC
LIMIT 100;

\echo 'Benchmark Complete: All queries executed with index analysis'
