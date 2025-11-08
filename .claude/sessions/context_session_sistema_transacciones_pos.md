# Contexto de Sesión: Sistema de Transacciones POS - Integridad Total

**Fecha Inicio:** 7 de noviembre de 2025
**Desarrollador:** Alfredo Manuel Reyes
**Agente:** Claude (Anthropic)

---

## 📋 OBJETIVO DE LA SESIÓN

Implementar un sistema completo de integridad de transacciones de cuentas de pacientes, garantizando que:
1. ✅ Las cuentas cerradas sean absolutamente inmutables
2. ✅ Todos los movimientos estén registrados y auditados
3. ✅ Solo se puedan recalcular cuentas abiertas
4. ✅ El historial de transacciones sea recuperable para aclaraciones
5. ✅ Todos los cálculos estén sincronizados desde la misma fuente

---

## 🔍 ANÁLISIS REALIZADO

Se completó un análisis exhaustivo de 99 páginas documentado en:
```
/Users/alfredo/agntsystemsc/.claude/doc/ANALISIS_SISTEMA_TRANSACCIONES_POS_2025.md
```

**Hallazgos principales:**
- ✅ Single Source of Truth implementado correctamente
- ✅ Auditoría completa con middleware automático
- ❌ Validación incompleta en entrega de solicitudes (P0-1)
- ❌ Falta constraint de BD para prevenir bypass (P0-2)
- ⚠️ Funcionalidad incompleta (cobros parciales, cuentas por cobrar)

**Calificación General:** 8.2/10
**Riesgo de Integridad:** 🟡 MEDIO

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Correcciones Críticas (P0) - 1.5 horas**

#### P0-1: Validación en Solicitudes (30 min)
**Problema:** Endpoint de entrega de solicitudes NO valida si cuenta está cerrada
**Ubicación:** `backend/routes/inventory.routes.js` o `backend/routes/solicitudes.routes.js`
**Solución:** Agregar validación antes de crear transacciones

```javascript
// ANTES de agregar transacciones:
const cuenta = await tx.cuentaPaciente.findUnique({
  where: { id: solicitud.cuentaPacienteId }
});

if (cuenta.estado === 'cerrada') {
  throw new Error('No se pueden agregar cargos a una cuenta cerrada. La cuenta debe estar abierta.');
}
```

#### P0-2: Middleware Prisma (1 hora)
**Problema:** No hay barrera final que prevenga INSERT en TransaccionCuenta si cuenta cerrada
**Ubicación:** `backend/utils/database.js` o `backend/server-modular.js`
**Solución:** Implementar middleware Prisma global

```javascript
prisma.$use(async (params, next) => {
  if (params.model === 'TransaccionCuenta' && params.action === 'create') {
    const cuentaId = params.args.data.cuentaId;
    const cuenta = await prisma.cuentaPaciente.findUnique({
      where: { id: cuentaId },
      select: { estado: true, id: true }
    });

    if (!cuenta) {
      throw new Error(`Cuenta ${cuentaId} no encontrada`);
    }

    if (cuenta.estado === 'cerrada') {
      throw new Error(
        `No se pueden agregar transacciones a la cuenta ${cuentaId}. La cuenta está cerrada.`
      );
    }
  }

  return next(params);
});
```

---

### **FASE 2: Funcionalidad Alta Prioridad (P1) - 9 horas**

#### P1-1: Cargos Automáticos de Quirófano (2 horas)
**Problema:** Completar cirugía NO genera cargo automático
**Ubicación:** `backend/routes/quirofanos.routes.js` líneas 725-829
**Solución:**
1. Agregar `cuentaPacienteId` a schema `CirugiaQuirofano`
2. Poblar al crear cirugía (obtener de hospitalización)
3. Generar cargo al completar cirugía

```javascript
// PUT /cirugias/:id/estado
if (estado === 'completada') {
  const horasCirugia = (cirugia.fechaFin - cirugia.fechaInicio) / (1000 * 60 * 60);

  const servicio = await tx.servicio.findFirst({
    where: { codigo: `QUIR-${cirugia.quirofano.numero}` }
  });

  await tx.transaccionCuenta.create({
    data: {
      cuentaId: cirugia.cuentaPacienteId,
      tipo: 'servicio',
      concepto: `Uso de quirófano ${cirugia.quirofano.numero}`,
      cantidad: Math.ceil(horasCirugia),
      precioUnitario: servicio.precio,
      subtotal: Math.ceil(horasCirugia) * servicio.precio,
      servicioId: servicio.id,
      empleadoCargoId: req.user.id
    }
  });
}
```

#### P1-2: Cobros Parciales (3 horas)
**Problema:** Solo se puede cerrar cuenta con pago total
**Solución:** Crear endpoint `POST /pos/cuentas/:id/pago-parcial`

**Cambios requeridos:**
1. Modificar schema `Pago` para agregar `tipoPago: 'parcial' | 'total'`
2. Crear endpoint de pago parcial
3. Actualizar cálculo de saldo para restar pagos parciales
4. Crear componente frontend `PartialPaymentDialog.tsx`

#### P1-3: Cuentas por Cobrar (4 horas)
**Problema:** No se puede cerrar cuenta sin pago inmediato
**Solución:** Implementar módulo completo de cuentas por cobrar

**Cambios requeridos:**
1. Agregar campos a `CuentaPaciente`:
   - `cuentaPorCobrar: Boolean`
   - `autorizacionCPCId: Int?`
   - `motivoCuentaPorCobrar: String?`

2. Crear tabla `HistorialCuentasPorCobrar`:
   ```prisma
   model HistorialCuentasPorCobrar {
     id                Int      @id @default(autoincrement())
     cuentaPacienteId  Int
     montoOriginal     Decimal  @db.Decimal(10, 2)
     saldoPendiente    Decimal  @db.Decimal(10, 2)
     autorizadoPor     Int
     motivoAutorizacion String
     fechaCreacion     DateTime @default(now())
   }
   ```

3. Crear endpoints:
   - `GET /pos/cuentas-por-cobrar`
   - `POST /pos/cuentas-por-cobrar/:id/pago`
   - `GET /pos/cuentas-por-cobrar/estadisticas`

4. Modificar endpoint de cierre para soportar opción `cuentaPorCobrar`

---

### **FASE 3: Tests (2.5 horas)**

#### Tests E2E (2 horas)
Crear `frontend/e2e/pos-cierre-cuenta.spec.ts`:

1. Test: Cierre con pago completo
2. Test: Cierre con devolución
3. Test: Rechazo de cierre sin pago suficiente
4. Test: Rechazo de cargos a cuenta cerrada
5. Test: Pago parcial
6. Test: Cuenta por cobrar (con autorización admin)

#### Tests Backend (30 min)
Crear `backend/tests/pos/transacciones-inmutables.test.js`:

1. Test: Middleware Prisma bloquea INSERT en cuenta cerrada
2. Test: Endpoint de solicitudes rechaza cuenta cerrada
3. Test: Race condition en cierre de cuenta
4. Test: Recálculo solo afecta cuentas abiertas

---

## 📝 PROGRESO DE IMPLEMENTACIÓN

### ✅ Completado
- [x] Análisis exhaustivo del sistema (99 páginas)
- [x] Documentación de problemas identificados
- [x] Plan de acción detallado

### 🔄 En Progreso
- [ ] P0-1: Validación en solicitudes
- [ ] P0-2: Middleware Prisma
- [ ] P1-1: Cargos de quirófano
- [ ] P1-2: Cobros parciales
- [ ] P1-3: Cuentas por cobrar
- [ ] Tests E2E
- [ ] Tests Backend

---

## 🔧 ARCHIVOS MODIFICADOS

### Backend
- [ ] `backend/routes/inventory.routes.js` (o `solicitudes.routes.js`)
- [ ] `backend/utils/database.js` (middleware Prisma)
- [ ] `backend/routes/quirofanos.routes.js` (cargos automáticos)
- [ ] `backend/routes/pos.routes.js` (cobros parciales, cuentas por cobrar)
- [ ] `backend/prisma/schema.prisma` (nuevos campos y tablas)

### Frontend
- [ ] `frontend/src/components/pos/PartialPaymentDialog.tsx` (nuevo)
- [ ] `frontend/src/components/pos/AccountsReceivableDialog.tsx` (nuevo)
- [ ] `frontend/src/services/posService.ts` (nuevos endpoints)

### Tests
- [ ] `frontend/e2e/pos-cierre-cuenta.spec.ts` (nuevo)
- [ ] `backend/tests/pos/transacciones-inmutables.test.js` (nuevo)

---

## 🎯 CRITERIOS DE ÉXITO

1. ✅ Todas las cuentas cerradas son inmutables (validación + constraint BD)
2. ✅ Sistema soporta cobros parciales
3. ✅ Sistema soporta cuentas por cobrar con autorización
4. ✅ Cargos de quirófano se generan automáticamente
5. ✅ Tests E2E cubren todos los escenarios de cierre
6. ✅ Tests backend validan inmutabilidad
7. ✅ Calificación de integridad: 8.2/10 → 9.5/10
8. ✅ Riesgo de integridad: 🟡 MEDIO → 🟢 BAJO

---

## 📚 REFERENCIAS

- Análisis completo: `.claude/doc/ANALISIS_SISTEMA_TRANSACCIONES_POS_2025.md`
- Flujos críticos: `.claude/doc/FLUJOS_TRABAJO_CRITICOS.md`
- Estado del sistema: `CLAUDE.md`

---

**Última actualización:** 7 de noviembre de 2025 - Inicio de implementación
