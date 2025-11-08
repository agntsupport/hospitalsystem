# Manual de Usuario: Cobros Parciales y Cuentas por Cobrar

**Sistema de Gestión Hospitalaria Integral**
**Versión:** 1.0
**Fecha:** 7 de noviembre de 2025
**Desarrollado por:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Cobros Parciales](#cobros-parciales)
   - [¿Qué son los Cobros Parciales?](#qué-son-los-cobros-parciales)
   - [Cómo Registrar un Pago Parcial](#cómo-registrar-un-pago-parcial)
   - [Casos de Uso Comunes](#casos-de-uso-comunes-cobros-parciales)
3. [Cuentas por Cobrar](#cuentas-por-cobrar)
   - [¿Qué son las Cuentas por Cobrar?](#qué-son-las-cuentas-por-cobrar)
   - [Autorización de Cuenta por Cobrar](#autorización-de-cuenta-por-cobrar)
   - [Gestión de Pagos contra CPC](#gestión-de-pagos-contra-cpc)
   - [Estadísticas y Reportes](#estadísticas-y-reportes)
4. [Preguntas Frecuentes](#preguntas-frecuentes)
5. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

Este manual describe las nuevas funcionalidades del sistema de POS (Punto de Venta) del Hospital:

1. **Cobros Parciales:** Permite registrar pagos parciales en cuentas abiertas antes del cierre final.
2. **Cuentas por Cobrar:** Permite cerrar cuentas con deuda pendiente mediante autorización administrativa.

Estas funcionalidades mejoran la flexibilidad financiera del hospital y facilitan el manejo de pacientes con dificultades económicas.

---

## Cobros Parciales

### ¿Qué son los Cobros Parciales?

Los **cobros parciales** (también llamados "abonos" o "pagos parciales") permiten que un paciente realice pagos antes del cierre final de su cuenta hospitalaria.

**Beneficios:**
- ✅ El paciente puede pagar de forma escalonada
- ✅ Se reduce la deuda al momento del cierre final
- ✅ Se mantiene un registro detallado de todos los pagos
- ✅ El saldo se actualiza automáticamente

**Roles autorizados:**
- Cajero
- Administrador

---

### Cómo Registrar un Pago Parcial

#### Paso 1: Acceder al Módulo POS

1. Inicie sesión en el sistema con su usuario de cajero
2. En el menú lateral, haga click en **"POS"**
3. Verá la lista de cuentas de pacientes

#### Paso 2: Seleccionar la Cuenta

1. Busque la cuenta del paciente en la tabla
2. Verifique que el estado sea **"Abierta"** (badge verde)
3. Haga click en el botón de **"Acciones"** (tres puntos verticales)

#### Paso 3: Registrar el Pago

1. En el menú de acciones, seleccione **"Pago Parcial"**
2. Se abrirá un diálogo con el formulario de pago
3. Complete los campos:
   - **Monto:** Cantidad que el paciente está pagando (debe ser mayor a $0)
   - **Método de Pago:** Seleccione efectivo, tarjeta o transferencia
   - **Observaciones (opcional):** Notas adicionales sobre el pago

4. Haga click en **"Registrar Pago"**

#### Paso 4: Verificación

1. Verá una notificación de éxito: **"Pago parcial registrado exitosamente"**
2. El diálogo se cerrará automáticamente
3. El **saldo pendiente** de la cuenta se actualizará inmediatamente

**Ejemplo:**
- Anticipo inicial: $10,000
- Cargos acumulados: $500
- Saldo antes del pago: $9,500
- Pago parcial registrado: +$1,000
- **Saldo nuevo: $10,500**

---

### Casos de Uso Comunes: Cobros Parciales

#### Caso 1: Paciente Paga en Dos Abonos

**Situación:** Paciente con cuenta de $15,000 puede pagar en dos partes.

**Flujo:**
1. Primer abono: Registrar pago parcial de $8,000
2. Segundo abono: Registrar pago parcial de $7,000
3. Al cierre: No se requiere pago adicional (saldo cubierto)

**Resultado:** Cuenta cerrada sin deuda pendiente.

---

#### Caso 2: Reducir Deuda para Cuenta por Cobrar

**Situación:** Paciente con cuenta de $20,000 pero solo puede pagar $10,000.

**Flujo:**
1. Registrar pago parcial de $10,000
2. Cierre con Cuenta por Cobrar autorizada por admin
3. Deuda pendiente reducida: solo $10,000 en CPC

**Resultado:** Deuda menor en cuentas por cobrar.

---

#### Caso 3: Múltiples Pagos Durante Hospitalización

**Situación:** Paciente hospitalizado 5 días, paga diariamente.

**Flujo:**
1. Día 1: Pago parcial de $2,000
2. Día 2: Pago parcial de $2,000
3. Día 3: Pago parcial de $2,000
4. Día 4: Pago parcial de $2,000
5. Día 5: Cierre con pago final o cuenta por cobrar

**Resultado:** Pagos registrados correctamente, saldo actualizado diariamente.

---

### ⚠️ Restricciones de Cobros Parciales

1. **Solo cuentas abiertas:** No se pueden registrar pagos parciales en cuentas cerradas.
2. **Monto mayor a cero:** El sistema rechazará intentos de registrar pagos de $0 o negativos.
3. **Método de pago obligatorio:** Debe seleccionar efectivo, tarjeta o transferencia.
4. **Sin límite de pagos:** Puede registrar tantos pagos parciales como sea necesario.

---

## Cuentas por Cobrar

### ¿Qué son las Cuentas por Cobrar?

Las **Cuentas por Cobrar (CPC)** permiten cerrar cuentas de pacientes con deuda pendiente cuando:

- El paciente no puede pagar el monto total al momento del alta
- Existe una justificación válida (falta de recursos, emergencia, etc.)
- Un administrador autoriza explícitamente la operación

**Características:**
- ✅ Requiere autorización de administrador
- ✅ Se registra el motivo de la autorización
- ✅ Se crea un registro en el módulo "Cuentas por Cobrar"
- ✅ El hospital puede gestionar el cobro posteriorm ente
- ✅ Se puede recibir pagos parciales contra la CPC

**Roles autorizados:**
- **Administrador:** Autorizar cierre con CPC
- **Cajero:** Ver lista de CPC y registrar pagos

---

### Autorización de Cuenta por Cobrar

#### Requisitos Previos

1. Cuenta de paciente con deuda pendiente (saldo negativo)
2. Usuario con rol de **Administrador**
3. Motivo válido para autorización

#### Paso 1: Iniciar Cierre de Cuenta

1. Inicie sesión como **admin**
2. Navegue al módulo **POS**
3. Busque la cuenta del paciente con deuda
4. Haga click en **"Acciones" → "Cerrar Cuenta"**

#### Paso 2: Verificar Deuda

1. El sistema mostrará un **resumen de la cuenta**:
   - Anticipo: $10,000
   - Total de cargos: $15,000
   - Saldo pendiente: **-$5,000** (deuda)

2. Verá una advertencia en rojo:
   > ⚠️ **La cuenta tiene una deuda de $5,000. Se requiere pago o autorización de Cuenta por Cobrar.**

#### Paso 3: Autorizar Cuenta por Cobrar

1. Marque el checkbox **"Autorizar como Cuenta por Cobrar"**
2. Se habilitará el campo **"Motivo de Autorización"**
3. Ingrese un motivo claro y detallado:
   - ✅ Correcto: "Paciente sin recursos económicos, familiar desempleado, autorizado por gerencia"
   - ❌ Incorrecto: "Sin dinero" (muy vago)

4. Haga click en **"Confirmar Cierre"**

#### Paso 4: Confirmación

1. Verá dos notificaciones de éxito:
   - **"Cuenta cerrada exitosamente"**
   - **"Registrado en Cuentas por Cobrar"**

2. La cuenta cambiará a estado **"Cerrada"**
3. Se creará un registro en **Cuentas por Cobrar** con estado **"Pendiente"**

---

### Gestión de Pagos contra CPC

#### Ver Lista de Cuentas por Cobrar

1. Inicie sesión (admin o cajero)
2. En el menú lateral, haga click en **"Cuentas por Cobrar"**
3. Verá una tabla con todas las CPC:
   - Nombre del paciente
   - Monto original de la deuda
   - Saldo pendiente
   - Monto pagado
   - Porcentaje pagado
   - Estado (Pendiente, Pagado Parcial, Pagado Total)
   - Fecha de creación
   - Autorizador

#### Registrar Pago contra CPC

**Paso 1: Seleccionar CPC**

1. En la lista de CPC, busque la cuenta del paciente
2. Haga click en **"Acciones" → "Registrar Pago"**

**Paso 2: Llenar Formulario de Pago**

1. Se abrirá un diálogo con el formulario:
   - **Saldo pendiente actual:** Se muestra en la parte superior
   - **Monto a pagar:** Ingrese el monto del pago
   - **Método de pago:** Efectivo, tarjeta o transferencia
   - **Observaciones:** Notas sobre el pago

2. **Validaciones:**
   - El monto debe ser mayor a $0
   - El monto NO puede ser mayor al saldo pendiente
   - Si paga el monto exacto, la CPC se marcará como "Pagado Total"

**Paso 3: Confirmar Pago**

1. Haga click en **"Registrar Pago"**
2. Verá una notificación de éxito
3. El **estado de la CPC** se actualizará:
   - Si aún hay deuda: **"Pagado Parcial"**
   - Si pagó el total: **"Pagado Total"**

**Ejemplo de Liquidación:**
- Deuda original: $5,000
- Primer pago: $2,000 → Estado: "Pagado Parcial", Saldo: $3,000
- Segundo pago: $3,000 → Estado: "Pagado Total", Saldo: $0

---

### Estadísticas y Reportes

#### Dashboard de Cuentas por Cobrar

Los administradores y socios pueden ver un dashboard con métricas completas:

**Métricas Principales:**
1. **Total de CPC Activas:** Número de cuentas pendientes o parcialmente pagadas
2. **Monto Total Pendiente:** Suma de todos los saldos pendientes
3. **Monto Total Recuperado:** Suma de todos los pagos recibidos
4. **Porcentaje de Recuperación:** (Recuperado / Original) × 100

**Distribución por Estado:**
- Pendiente: X cuentas, $Y
- Pagado Parcial: X cuentas, $Y
- Pagado Total: X cuentas, $Y
- Cancelado: X cuentas, $Y

**Top 10 Deudores:**
Tabla ordenada por saldo pendiente (mayor a menor):
- Nombre del paciente
- Teléfono de contacto
- Monto original
- Saldo pendiente
- Fecha de creación

---

### ⚠️ Restricciones de Cuentas por Cobrar

1. **Solo administradores pueden autorizar:** Los cajeros NO pueden crear CPC.
2. **Motivo obligatorio:** No se puede autorizar sin proporcionar un motivo detallado.
3. **CPC pagada es inmutable:** Una vez que una CPC está en "Pagado Total", no se pueden registrar más pagos.
4. **No se puede cancelar sin autorización:** Si necesita cancelar una CPC, requiere aprobación de gerencia.
5. **Pagos no pueden exceder saldo:** El sistema rechazará pagos mayores al saldo pendiente.

---

## Preguntas Frecuentes

### General

**P: ¿Qué es la diferencia entre un pago parcial y una cuenta por cobrar?**
R: Un **pago parcial** es un abono que el paciente realiza mientras la cuenta está abierta. Una **cuenta por cobrar** es una deuda pendiente que queda registrada después de cerrar la cuenta.

**P: ¿Puedo combinar pagos parciales y cuenta por cobrar?**
R: Sí. Puede registrar varios pagos parciales para reducir la deuda y luego cerrar el resto como cuenta por cobrar.

---

### Cobros Parciales

**P: ¿Cuántos pagos parciales puedo registrar?**
R: No hay límite. Puede registrar tantos pagos parciales como sea necesario.

**P: ¿Puedo registrar un pago parcial mayor al monto adeudado?**
R: Sí. Si el paciente paga más del adeudo, el excedente quedará como saldo a favor y se devolverá al momento del cierre.

**P: ¿Qué pasa si me equivoco al registrar un pago parcial?**
R: Contacte inmediatamente al administrador del sistema. Los pagos parciales NO se pueden eliminar, pero se puede hacer una corrección con nota explicativa.

**P: ¿El pago parcial se resta del anticipo o de los cargos?**
R: El pago parcial se suma al anticipo inicial. Por ejemplo:
- Anticipo: $10,000
- Cargos: $500
- Pago parcial: +$1,000
- Saldo: ($10,000 + $1,000) - $500 = $10,500

---

### Cuentas por Cobrar

**P: ¿Un cajero puede autorizar una cuenta por cobrar?**
R: NO. Solo los usuarios con rol de **Administrador** pueden autorizar cuentas por cobrar.

**P: ¿Qué pasa si el paciente nunca paga la cuenta por cobrar?**
R: La CPC permanecerá en estado "Pendiente" y aparecerá en los reportes del hospital. El hospital debe hacer seguimiento para gestionar el cobro.

**P: ¿Puedo cerrar una cuenta con deuda sin autorización?**
R: NO. El sistema rechazará el intento de cierre y mostrará el mensaje: "Se requiere pago o autorización de administrador".

**P: ¿Qué información necesito para autorizar una CPC?**
R:
1. Motivo detallado (¿por qué el paciente no puede pagar?)
2. Contexto de la situación
3. Aprobación verbal de gerencia (recomendado)

**P: ¿Cómo sé si una CPC está vencida?**
R: El sistema muestra la fecha de creación de cada CPC. El hospital debe definir sus propias políticas de vencimiento (ej. 30 días, 60 días).

---

## Solución de Problemas

### Error: "El monto debe ser mayor a cero"

**Problema:** Intentó registrar un pago parcial con monto $0 o negativo.
**Solución:** Ingrese un monto válido mayor a $0.

---

### Error: "No se pueden agregar cargos a una cuenta cerrada"

**Problema:** Intentó registrar un pago parcial en una cuenta ya cerrada.
**Solución:** Las cuentas cerradas son inmutables. Si necesita hacer una corrección, contacte al administrador del sistema.

---

### Error: "Solo administradores pueden autorizar cuentas por cobrar"

**Problema:** Intentó cerrar una cuenta con deuda como cajero.
**Solución:** Solicite a un administrador que autorice la cuenta por cobrar o pida al paciente que realice el pago completo.

---

### Error: "El monto de pago no puede ser mayor al saldo pendiente"

**Problema:** Intentó registrar un pago contra una CPC por un monto mayor al adeudo.
**Solución:** Verifique el saldo pendiente actual y registre un monto igual o menor.

---

### No puedo ver el módulo "Cuentas por Cobrar"

**Problema:** El menú no muestra la opción "Cuentas por Cobrar".
**Solución:** Verifique su rol de usuario. Solo administradores, cajeros y socios tienen acceso a este módulo.

---

## Soporte Técnico

Si tiene problemas técnicos o necesita asistencia:

**Desarrollador:** Alfredo Manuel Reyes
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Teléfono:** 443 104 7479
**Email:** [Por definir]

---

## Registro de Cambios

### Versión 1.0 (7 de noviembre de 2025)
- ✅ Implementación inicial de Cobros Parciales
- ✅ Implementación inicial de Cuentas por Cobrar
- ✅ Dashboard de estadísticas de CPC
- ✅ Validaciones de integridad completas

---

**© 2025 AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial. Todos los derechos reservados.**
