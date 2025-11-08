-- ==============================================
-- SCRIPTS SQL PARA CORRECCIÓN EN PRODUCCIÓN
-- Sistema POS - Hospital Management
-- Fecha: 8 de noviembre de 2025
-- ==============================================

-- ⚠️ IMPORTANTE: Ejecutar EN ESTE ORDEN
-- 1. PASO 1: Diagnóstico (solo lectura)
-- 2. PASO 2: Backup (obligatorio)
-- 3. PASO 3: Corrección cuenta #1
-- 4. PASO 4: Corrección masiva
-- 5. PASO 5: Validación final

-- ==============================================
-- PASO 1: DIAGNÓSTICO (SOLO LECTURA)
-- ==============================================

-- 1.1 Identificar cuentas con totales incorrectos
SELECT
  c.id,
  c.estado,
  c.anticipo,
  c.total_servicios,
  c.total_productos,
  c.total_cuenta AS total_guardado,
  (c.total_servicios + c.total_productos) AS total_correcto,
  c.total_cuenta - (c.total_servicios + c.total_productos) AS diferencia,
  c.saldo_pendiente,
  c.fecha_cierre,
  c.fecha_apertura
FROM cuentas_pacientes c
WHERE c.estado = 'cerrada'
  AND c.total_cuenta != (c.total_servicios + c.total_productos)
ORDER BY ABS(c.total_cuenta - (c.total_servicios + c.total_productos)) DESC;

-- 1.2 Verificar transacciones de cuenta #1
SELECT
  t.id,
  t.tipo,
  t.concepto,
  t.cantidad,
  t.precio_unitario,
  t.subtotal,
  t.fecha_transaccion,
  t.observaciones
FROM transacciones_cuenta t
WHERE t.cuenta_id = 1
ORDER BY t.fecha_transaccion ASC;

-- 1.3 Contar transacciones por cuenta
SELECT
  c.id,
  c.estado,
  COUNT(t.id) AS num_transacciones,
  SUM(CASE WHEN t.tipo = 'servicio' THEN t.subtotal ELSE 0 END) AS sum_servicios,
  SUM(CASE WHEN t.tipo = 'producto' THEN t.subtotal ELSE 0 END) AS sum_productos,
  c.total_servicios AS total_servicios_guardado,
  c.total_productos AS total_productos_guardado
FROM cuentas_pacientes c
LEFT JOIN transacciones_cuenta t ON c.id = t.cuenta_id
WHERE c.estado = 'cerrada'
GROUP BY c.id
HAVING COUNT(t.id) = 0 OR
       SUM(CASE WHEN t.tipo = 'servicio' THEN t.subtotal ELSE 0 END) != c.total_servicios OR
       SUM(CASE WHEN t.tipo = 'producto' THEN t.subtotal ELSE 0 END) != c.total_productos
ORDER BY c.id;

-- ==============================================
-- PASO 2: BACKUP (OBLIGATORIO)
-- ==============================================

-- OPCIÓN A: Backup completo de PostgreSQL
-- Ejecutar en terminal (NO en psql):
-- pg_dump -h localhost -U postgres -d hospital_management_prod > backup_pos_$(date +%Y%m%d_%H%M%S).sql

-- OPCIÓN B: Backup solo de tablas afectadas
CREATE TABLE IF NOT EXISTS backup_cuentas_pacientes_20251108 AS
SELECT * FROM cuentas_pacientes WHERE estado = 'cerrada';

CREATE TABLE IF NOT EXISTS backup_transacciones_cuenta_20251108 AS
SELECT * FROM transacciones_cuenta
WHERE cuenta_id IN (SELECT id FROM cuentas_pacientes WHERE estado = 'cerrada');

-- Verificar backup
SELECT COUNT(*) AS cuentas_respaldadas FROM backup_cuentas_pacientes_20251108;
SELECT COUNT(*) AS transacciones_respaldadas FROM backup_transacciones_cuenta_20251108;

-- ==============================================
-- PASO 3: CORRECCIÓN CUENTA #1
-- ==============================================

-- 3.1 Ver estado actual de cuenta #1
SELECT
  id,
  anticipo,
  total_servicios,
  total_productos,
  total_cuenta,
  saldo_pendiente,
  estado,
  fecha_cierre
FROM cuentas_pacientes
WHERE id = 1;

-- 3.2 Corregir cuenta #1 (EJECUTAR DESPUÉS DE VERIFICAR)
BEGIN;

UPDATE cuentas_pacientes
SET
  total_cuenta = total_servicios + total_productos,
  saldo_pendiente = anticipo - (total_servicios + total_productos),
  observaciones = CONCAT(
    COALESCE(observaciones, ''),
    E'\n[Corrección 2025-11-08] Totales recalculados desde transacciones. ',
    'Total anterior: $', total_cuenta::text
  )
WHERE id = 1 AND estado = 'cerrada';

-- Verificar corrección
SELECT
  id,
  anticipo,
  total_servicios,
  total_productos,
  total_cuenta,
  saldo_pendiente,
  estado,
  observaciones
FROM cuentas_pacientes
WHERE id = 1;

-- Si todo está correcto, COMMIT
COMMIT;
-- Si hay error, ROLLBACK
-- ROLLBACK;

-- ==============================================
-- PASO 4: CORRECCIÓN MASIVA
-- ==============================================

-- 4.1 Vista previa de cambios (SIN EJECUTAR)
SELECT
  id,
  total_cuenta AS total_actual,
  (total_servicios + total_productos) AS total_nuevo,
  total_cuenta - (total_servicios + total_productos) AS diferencia,
  saldo_pendiente AS saldo_actual,
  (anticipo - (total_servicios + total_productos)) AS saldo_nuevo
FROM cuentas_pacientes
WHERE estado = 'cerrada'
  AND total_cuenta != (total_servicios + total_productos);

-- 4.2 Ejecutar corrección masiva (SOLO SI PASO 3 FUE EXITOSO)
BEGIN;

UPDATE cuentas_pacientes
SET
  total_cuenta = total_servicios + total_productos,
  saldo_pendiente = anticipo - (total_servicios + total_productos),
  observaciones = CONCAT(
    COALESCE(observaciones, ''),
    E'\n[Corrección masiva 2025-11-08] Totales recalculados. ',
    'Anterior: $', total_cuenta::text, ' → Nuevo: $', (total_servicios + total_productos)::text
  )
WHERE estado = 'cerrada'
  AND total_cuenta != (total_servicios + total_productos);

-- Verificar número de registros afectados
SELECT ROW_COUNT() AS registros_actualizados;

COMMIT;
-- Si hay error: ROLLBACK;

-- ==============================================
-- PASO 5: VALIDACIÓN FINAL
-- ==============================================

-- 5.1 Verificar que NO quedan cuentas corruptas
SELECT COUNT(*) AS cuentas_corruptas_restantes
FROM cuentas_pacientes
WHERE estado = 'cerrada'
  AND total_cuenta != (total_servicios + total_productos);

-- Resultado esperado: 0

-- 5.2 Estadísticas generales
SELECT
  estado,
  COUNT(*) AS total_cuentas,
  SUM(CASE WHEN total_cuenta = (total_servicios + total_productos) THEN 1 ELSE 0 END) AS cuentas_correctas,
  SUM(CASE WHEN total_cuenta != (total_servicios + total_productos) THEN 1 ELSE 0 END) AS cuentas_incorrectas,
  ROUND(100.0 * SUM(CASE WHEN total_cuenta = (total_servicios + total_productos) THEN 1 ELSE 0 END) / COUNT(*), 2) AS porcentaje_integridad
FROM cuentas_pacientes
GROUP BY estado
ORDER BY estado;

-- 5.3 Validar cuenta #1 específicamente
SELECT
  c.id,
  p.nombre || ' ' || p.apellido_paterno AS paciente,
  c.anticipo,
  c.total_servicios,
  c.total_productos,
  c.total_cuenta,
  c.saldo_pendiente,
  COUNT(t.id) AS num_transacciones,
  SUM(CASE WHEN t.tipo = 'servicio' THEN t.subtotal ELSE 0 END) AS sum_servicios_real,
  SUM(CASE WHEN t.tipo = 'producto' THEN t.subtotal ELSE 0 END) AS sum_productos_real
FROM cuentas_pacientes c
JOIN pacientes p ON c.paciente_id = p.id
LEFT JOIN transacciones_cuenta t ON c.id = t.cuenta_id
WHERE c.id = 1
GROUP BY c.id, p.nombre, p.apellido_paterno;

-- 5.4 Comparar con backup
SELECT
  'BACKUP' AS fuente,
  COUNT(*) AS total,
  SUM(CASE WHEN total_cuenta != (total_servicios + total_productos) THEN 1 ELSE 0 END) AS corruptas
FROM backup_cuentas_pacientes_20251108
UNION ALL
SELECT
  'ACTUAL' AS fuente,
  COUNT(*) AS total,
  SUM(CASE WHEN total_cuenta != (total_servicios + total_productos) THEN 1 ELSE 0 END) AS corruptas
FROM cuentas_pacientes
WHERE estado = 'cerrada';

-- ==============================================
-- ROLLBACK (EN CASO DE ERROR)
-- ==============================================

-- Si algo salió mal, restaurar desde backup:
/*
BEGIN;

-- Restaurar cuentas desde backup
UPDATE cuentas_pacientes c
SET
  anticipo = b.anticipo,
  total_servicios = b.total_servicios,
  total_productos = b.total_productos,
  total_cuenta = b.total_cuenta,
  saldo_pendiente = b.saldo_pendiente,
  observaciones = b.observaciones
FROM backup_cuentas_pacientes_20251108 b
WHERE c.id = b.id;

COMMIT;
*/

-- ==============================================
-- LIMPIEZA (DESPUÉS DE VALIDACIÓN EXITOSA)
-- ==============================================

-- Eliminar tablas de backup después de confirmar que todo está correcto
-- ESPERAR AL MENOS 7 DÍAS antes de ejecutar esto
/*
DROP TABLE IF EXISTS backup_cuentas_pacientes_20251108;
DROP TABLE IF EXISTS backup_transacciones_cuenta_20251108;
*/

-- ==============================================
-- NOTAS FINALES
-- ==============================================

/*
CHECKLIST DE EJECUCIÓN:

1. ✅ Ejecutar PASO 1 (Diagnóstico) y revisar resultados
2. ✅ Ejecutar PASO 2 (Backup) OBLIGATORIO
3. ✅ Ejecutar PASO 3 (Corrección cuenta #1) y verificar
4. ✅ Ejecutar PASO 4 (Corrección masiva) solo si paso 3 OK
5. ✅ Ejecutar PASO 5 (Validación) y confirmar integridad 100%
6. ✅ Guardar log de ejecución en archivo
7. ✅ Notificar a stakeholders
8. ⏳ Monitorear sistema por 24-48 horas
9. ⏳ Eliminar backups después de 7 días

CONTACTO:
Desarrollador: Alfredo Manuel Reyes
Empresa: AGNT
Teléfono: 443 104 7479

REFERENCIAS:
- Documentación: .claude/doc/pos_investigation/
- Commit: TBD (después de deployment)
- Fecha: 8 de noviembre de 2025
*/
