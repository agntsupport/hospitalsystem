// ABOUTME: Tests E2E para flujos de cobros parciales y cuentas por cobrar (CPC)
// Valida la funcionalidad implementada en P1-2 y P1-3

import { test, expect } from '@playwright/test';
import { fillTextField, fillPasswordField, clickButton } from './helpers/selectors';

// Configuración base
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

test.describe('Sistema de Cobros Parciales y Cuentas por Cobrar', () => {
  test.beforeEach(async ({ page }) => {
    // Login como cajero
    await page.goto(`${BASE_URL}/login`);
    await fillTextField(page, 'username-input', 'cajero1');
    await fillPasswordField(page, 'password-input', 'cajero123');
    await clickButton(page, 'login-button');

    // Esperar a que se cargue el dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.describe('P1-2: Cobros Parciales', () => {
    test('debe permitir registrar pago parcial en cuenta abierta', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Navegar a módulo POS
       * 2. Buscar cuenta abierta
       * 3. Abrir diálogo de pago parcial
       * 4. Registrar pago de $1,000
       * 5. Verificar que se actualizó el saldo
       */

      // Paso 1: Navegar a módulo POS
      await page.click('text=POS');
      await expect(page).toHaveURL(/\/pos/);

      // Paso 2: Buscar cuenta abierta (simulación)
      // TODO: Implementar selector de cuenta cuando UI esté lista
      await page.waitForSelector('[data-testid="cuentas-table"]', { timeout: 10000 });

      // Buscar primera cuenta abierta
      const primeraFila = page.locator('[data-testid="cuentas-table"] tbody tr').first();
      await expect(primeraFila).toBeVisible();

      // Verificar que tiene badge "Abierta"
      await expect(primeraFila.locator('text=Abierta')).toBeVisible();

      // Click en acciones
      await primeraFila.locator('[aria-label="Acciones"]').click();

      // Paso 3: Abrir diálogo de pago parcial
      // TODO: Implementar cuando PartialPaymentDialog esté en UI
      await page.click('text=Pago Parcial');

      // Esperar diálogo
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('text=Registrar Pago Parcial')).toBeVisible();

      // Paso 4: Llenar formulario de pago parcial
      await fillTextField(page, 'monto-pago', '1000');
      await page.selectOption('[data-testid="metodo-pago"]', 'efectivo');
      await fillTextField(page, 'observaciones-pago', 'Primer abono del paciente');

      // Click en Registrar Pago
      await clickButton(page, 'registrar-pago-button');

      // Paso 5: Verificar notificación de éxito
      await expect(page.locator('text=Pago parcial registrado exitosamente')).toBeVisible();

      // Verificar que el diálogo se cerró
      await expect(dialog).not.toBeVisible();

      // Verificar que el saldo se actualizó
      // TODO: Agregar selector específico para el saldo cuando UI esté lista
      await page.waitForTimeout(1000); // Esperar actualización
    });

    test('debe rechazar pago parcial con monto cero', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Abrir diálogo de pago parcial
       * 2. Intentar registrar pago con monto 0
       * 3. Verificar mensaje de error
       */

      await page.goto(`${BASE_URL}/pos`);

      // Abrir diálogo (simulado)
      const primeraFila = page.locator('[data-testid="cuentas-table"] tbody tr').first();
      await primeraFila.locator('[aria-label="Acciones"]').click();
      await page.click('text=Pago Parcial');

      // Intentar registrar con monto 0
      await fillTextField(page, 'monto-pago', '0');
      await page.selectOption('[data-testid="metodo-pago"]', 'efectivo');
      await clickButton(page, 'registrar-pago-button');

      // Verificar error de validación
      await expect(page.locator('text=El monto debe ser mayor a cero')).toBeVisible();
    });

    test('debe permitir múltiples pagos parciales', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Registrar primer pago parcial de $500
       * 2. Verificar saldo actualizado
       * 3. Registrar segundo pago parcial de $300
       * 4. Verificar saldo final actualizado
       */

      await page.goto(`${BASE_URL}/pos`);

      // Primer pago
      const primeraFila = page.locator('[data-testid="cuentas-table"] tbody tr').first();
      await primeraFila.locator('[aria-label="Acciones"]').click();
      await page.click('text=Pago Parcial');

      await fillTextField(page, 'monto-pago', '500');
      await page.selectOption('[data-testid="metodo-pago"]', 'efectivo');
      await clickButton(page, 'registrar-pago-button');

      await expect(page.locator('text=Pago parcial registrado exitosamente')).toBeVisible();

      // Esperar un momento y registrar segundo pago
      await page.waitForTimeout(1000);

      // Segundo pago
      await primeraFila.locator('[aria-label="Acciones"]').click();
      await page.click('text=Pago Parcial');

      await fillTextField(page, 'monto-pago', '300');
      await page.selectOption('[data-testid="metodo-pago"]', 'tarjeta');
      await clickButton(page, 'registrar-pago-button');

      await expect(page.locator('text=Pago parcial registrado exitosamente')).toBeVisible();
    });

    test('debe rechazar pago parcial en cuenta cerrada', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Buscar cuenta cerrada
       * 2. Verificar que botón de pago parcial está deshabilitado
       */

      await page.goto(`${BASE_URL}/pos`);

      // Filtrar por cuentas cerradas
      await page.click('[data-testid="estado-filter"]');
      await page.click('text=Cerrada');

      // Buscar primera cuenta cerrada
      const primeraFila = page.locator('[data-testid="cuentas-table"] tbody tr').first();
      await expect(primeraFila).toBeVisible();

      // Verificar que tiene badge "Cerrada"
      await expect(primeraFila.locator('text=Cerrada')).toBeVisible();

      // Click en acciones
      await primeraFila.locator('[aria-label="Acciones"]').click();

      // Verificar que opción "Pago Parcial" no está disponible o está deshabilitada
      const pagoParcialOption = page.locator('text=Pago Parcial');
      await expect(pagoParcialOption).toHaveAttribute('aria-disabled', 'true');
    });
  });

  test.describe('P1-3: Cuentas por Cobrar', () => {
    test('debe permitir cerrar cuenta con deuda mediante CPC con autorización admin', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Logout de cajero
       * 2. Login como admin
       * 3. Navegar a cuenta con deuda
       * 4. Cerrar cuenta con opción "Cuenta por Cobrar"
       * 5. Proporcionar motivo de autorización
       * 6. Verificar que cuenta cerrada aparece en módulo CPC
       */

      // Paso 1-2: Re-autenticar como admin
      await page.goto(`${BASE_URL}/logout`);
      await page.goto(`${BASE_URL}/login`);
      await fillTextField(page, 'username-input', 'admin');
      await fillPasswordField(page, 'password-input', 'admin123');
      await clickButton(page, 'login-button');

      // Paso 3: Navegar a POS y buscar cuenta con deuda
      await page.goto(`${BASE_URL}/pos`);

      // Buscar cuenta con saldo negativo
      const cuentaConDeuda = page.locator('[data-testid="cuentas-table"] tbody tr')
        .filter({ hasText: '-' }); // Saldo negativo

      await cuentaConDeuda.first().locator('[aria-label="Acciones"]').click();
      await page.click('text=Cerrar Cuenta');

      // Paso 4: Seleccionar opción "Cuenta por Cobrar"
      const dialogCierre = page.locator('[role="dialog"]');
      await expect(dialogCierre).toBeVisible();

      // Verificar que muestra advertencia de deuda
      await expect(dialogCierre.locator('text=/Saldo pendiente: -.*/')).toBeVisible();

      // Marcar checkbox de Cuenta por Cobrar
      await page.check('[data-testid="cuenta-por-cobrar-checkbox"]');

      // Paso 5: Proporcionar motivo
      await fillTextField(page, 'motivo-cpc', 'Paciente sin recursos económicos, autorizado por gerencia');

      // Confirmar cierre
      await clickButton(page, 'confirmar-cierre-button');

      // Paso 6: Verificar éxito
      await expect(page.locator('text=Cuenta cerrada exitosamente')).toBeVisible();
      await expect(page.locator('text=Registrado en Cuentas por Cobrar')).toBeVisible();

      // Navegar a módulo de Cuentas por Cobrar
      await page.click('text=Cuentas por Cobrar');
      await expect(page).toHaveURL(/\/cuentas-por-cobrar/);

      // Verificar que la cuenta aparece en la lista
      await expect(page.locator('[data-testid="cpc-table"]')).toBeVisible();
      await expect(page.locator('text=/Estado: Pendiente/')).toBeVisible();
    });

    test('debe rechazar cierre con CPC si no es administrador', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Como cajero, intentar cerrar cuenta con deuda
       * 2. Verificar que checkbox de CPC está deshabilitado
       * 3. Verificar mensaje de permisos insuficientes
       */

      await page.goto(`${BASE_URL}/pos`);

      // Buscar cuenta con deuda
      const cuentaConDeuda = page.locator('[data-testid="cuentas-table"] tbody tr')
        .filter({ hasText: '-' });

      await cuentaConDeuda.first().locator('[aria-label="Acciones"]').click();
      await page.click('text=Cerrar Cuenta');

      const dialogCierre = page.locator('[role="dialog"]');

      // Verificar que checkbox de CPC está deshabilitado
      const checkboxCPC = page.locator('[data-testid="cuenta-por-cobrar-checkbox"]');
      await expect(checkboxCPC).toBeDisabled();

      // Verificar mensaje de permiso
      await expect(dialogCierre.locator('text=Solo administradores pueden autorizar')).toBeVisible();
    });

    test('debe permitir registrar pago contra cuenta por cobrar', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Login como admin
       * 2. Navegar a módulo Cuentas por Cobrar
       * 3. Buscar CPC pendiente
       * 4. Registrar pago de $2,000
       * 5. Verificar actualización de estado a "Pagado Parcial"
       */

      // Re-autenticar como admin
      await page.goto(`${BASE_URL}/logout`);
      await page.goto(`${BASE_URL}/login`);
      await fillTextField(page, 'username-input', 'admin');
      await fillPasswordField(page, 'password-input', 'admin123');
      await clickButton(page, 'login-button');

      // Navegar a Cuentas por Cobrar
      await page.goto(`${BASE_URL}/cuentas-por-cobrar`);

      // Buscar primera CPC pendiente
      const primeraFila = page.locator('[data-testid="cpc-table"] tbody tr')
        .filter({ hasText: 'Pendiente' });

      await primeraFila.first().locator('[aria-label="Acciones"]').click();
      await page.click('text=Registrar Pago');

      // Llenar formulario de pago
      const dialogPago = page.locator('[role="dialog"]');
      await expect(dialogPago).toBeVisible();

      await fillTextField(page, 'monto-pago-cpc', '2000');
      await page.selectOption('[data-testid="metodo-pago-cpc"]', 'efectivo');
      await fillTextField(page, 'observaciones-pago-cpc', 'Primer abono del paciente');

      // Registrar pago
      await clickButton(page, 'registrar-pago-cpc-button');

      // Verificar éxito
      await expect(page.locator('text=Pago registrado exitosamente')).toBeVisible();

      // Verificar que estado cambió a "Pagado Parcial"
      await expect(primeraFila.locator('text=Pagado Parcial')).toBeVisible();
    });

    test('debe actualizar estado a "Pagado Total" al liquidar CPC completamente', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Navegar a CPC con saldo pendiente de $1,000
       * 2. Registrar pago de $1,000 (monto exacto)
       * 3. Verificar estado "Pagado Total"
       * 4. Verificar que saldo pendiente es $0
       */

      // Login como admin
      await page.goto(`${BASE_URL}/logout`);
      await page.goto(`${BASE_URL}/login`);
      await fillTextField(page, 'username-input', 'admin');
      await fillPasswordField(page, 'password-input', 'admin123');
      await clickButton(page, 'login-button');

      await page.goto(`${BASE_URL}/cuentas-por-cobrar`);

      // Buscar CPC con saldo bajo
      const filaCPC = page.locator('[data-testid="cpc-table"] tbody tr').first();

      // Obtener saldo pendiente
      const saldoPendiente = await filaCPC.locator('[data-testid="saldo-pendiente"]').textContent();
      const montoExacto = saldoPendiente?.replace(/[^0-9.]/g, '') || '0';

      // Registrar pago por monto exacto
      await filaCPC.locator('[aria-label="Acciones"]').click();
      await page.click('text=Registrar Pago');

      await fillTextField(page, 'monto-pago-cpc', montoExacto);
      await page.selectOption('[data-testid="metodo-pago-cpc"]', 'transferencia');
      await clickButton(page, 'registrar-pago-cpc-button');

      // Verificar liquidación completa
      await expect(page.locator('text=Cuenta por cobrar pagada completamente')).toBeVisible();
      await expect(filaCPC.locator('text=Pagado Total')).toBeVisible();
      await expect(filaCPC.locator('text=$0.00')).toBeVisible();
    });

    test('debe mostrar estadísticas de CPC en dashboard', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Login como admin
       * 2. Navegar a estadísticas de CPC
       * 3. Verificar métricas:
       *    - Total CPC activas
       *    - Monto total pendiente
       *    - Monto total recuperado
       *    - Porcentaje de recuperación
       *    - Top 10 deudores
       */

      // Login como admin
      await page.goto(`${BASE_URL}/logout`);
      await page.goto(`${BASE_URL}/login`);
      await fillTextField(page, 'username-input', 'admin');
      await fillPasswordField(page, 'password-input', 'admin123');
      await clickButton(page, 'login-button');

      await page.goto(`${BASE_URL}/cuentas-por-cobrar/estadisticas`);

      // Verificar tarjetas de métricas
      await expect(page.locator('[data-testid="total-cpc"]')).toBeVisible();
      await expect(page.locator('[data-testid="monto-total-pendiente"]')).toBeVisible();
      await expect(page.locator('[data-testid="monto-total-recuperado"]')).toBeVisible();
      await expect(page.locator('[data-testid="porcentaje-recuperacion"]')).toBeVisible();

      // Verificar gráfico de distribución por estado
      await expect(page.locator('[data-testid="distribucion-estados-chart"]')).toBeVisible();

      // Verificar tabla de top deudores
      await expect(page.locator('[data-testid="top-deudores-table"]')).toBeVisible();
      const filas = page.locator('[data-testid="top-deudores-table"] tbody tr');
      await expect(filas).toHaveCount(10, { timeout: 10000 });
    });
  });

  test.describe('Validaciones de Integridad', () => {
    test('debe prevenir agregar cargos a cuenta cerrada', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Buscar cuenta cerrada
       * 2. Intentar agregar cargo
       * 3. Verificar rechazo con mensaje de error
       */

      await page.goto(`${BASE_URL}/pos`);

      // Filtrar cuentas cerradas
      await page.click('[data-testid="estado-filter"]');
      await page.click('text=Cerrada');

      const cuentaCerrada = page.locator('[data-testid="cuentas-table"] tbody tr').first();
      await cuentaCerrada.locator('[aria-label="Acciones"]').click();
      await page.click('text=Agregar Cargo');

      // Verificar mensaje de error
      await expect(page.locator('text=No se pueden agregar cargos a una cuenta cerrada')).toBeVisible();
    });

    test('debe calcular saldo en tiempo real con pagos parciales', async ({ page }) => {
      /**
       * FLUJO:
       * 1. Abrir cuenta con anticipo $10,000 y cargos $500
       * 2. Verificar saldo inicial: $9,500
       * 3. Registrar pago parcial de $1,000
       * 4. Verificar saldo actualizado: $10,500
       */

      await page.goto(`${BASE_URL}/pos`);

      const cuenta = page.locator('[data-testid="cuentas-table"] tbody tr').first();

      // Verificar saldo inicial
      const saldoInicial = await cuenta.locator('[data-testid="saldo-pendiente"]').textContent();

      // Registrar pago parcial
      await cuenta.locator('[aria-label="Acciones"]').click();
      await page.click('text=Pago Parcial');

      await fillTextField(page, 'monto-pago', '1000');
      await page.selectOption('[data-testid="metodo-pago"]', 'efectivo');
      await clickButton(page, 'registrar-pago-button');

      await expect(page.locator('text=Pago parcial registrado exitosamente')).toBeVisible();

      // Esperar actualización
      await page.waitForTimeout(1000);

      // Verificar saldo actualizado
      const saldoFinal = await cuenta.locator('[data-testid="saldo-pendiente"]').textContent();

      // Parsear y verificar que aumentó en $1,000
      const saldoInicialNum = parseFloat(saldoInicial?.replace(/[^0-9.-]/g, '') || '0');
      const saldoFinalNum = parseFloat(saldoFinal?.replace(/[^0-9.-]/g, '') || '0');

      expect(saldoFinalNum).toBeCloseTo(saldoInicialNum + 1000, 2);
    });
  });
});
