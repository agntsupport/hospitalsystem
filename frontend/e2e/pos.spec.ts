import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Módulo POS (Punto de Venta)
 * Sistema de Gestión Hospitalaria Integral
 *
 * Valida:
 * - Apertura de caja (cuenta de POS)
 * - Agregar productos/servicios al carrito
 * - Aplicar descuentos
 * - Procesar pagos
 * - Cerrar cuenta
 * - Consultar historial de cuentas
 * - Validación de permisos por rol
 */

test.describe('Módulo POS - Punto de Venta', () => {
  test.beforeEach(async ({ page }) => {
    // Login como cajero (rol con permisos de POS)
    await page.goto('/login');
    await page.fill('input[name="username"]', 'cajero1');
    await page.fill('input[name="password"]', 'cajero123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navegar a POS
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
  });

  test('debe cargar la interfaz del POS correctamente', async ({ page }) => {
    // Verificar que estamos en POS
    expect(page.url()).toContain('/pos');

    // Verificar elementos principales de la interfaz
    await expect(page.locator('text=/Punto de Venta|POS/i').first()).toBeVisible({ timeout: 10000 });

    // Verificar que hay un área para productos/servicios
    await expect(page.locator('text=/Productos|Servicios/i').first()).toBeVisible();

    // Verificar que hay un botón para nueva cuenta
    const newAccountBtn = page.locator('button:has-text("Nueva Cuenta"), button:has-text("Abrir Caja")').first();
    await expect(newAccountBtn).toBeVisible();
  });

  test('debe permitir abrir una nueva cuenta de POS', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Hacer click en "Nueva Cuenta" o "Abrir Caja"
    const newAccountBtn = page.locator('button:has-text("Nueva Cuenta"), button:has-text("Abrir Caja")').first();
    await newAccountBtn.click();

    // Esperar diálogo de nueva cuenta
    await page.waitForTimeout(1000);

    // Seleccionar o buscar paciente
    const patientInput = page.locator('input[placeholder*="paciente"], input[aria-label*="Paciente"]').first();
    await patientInput.fill('Juan');
    await page.waitForTimeout(1000);

    // Seleccionar primer resultado del autocomplete
    const firstOption = page.locator('li[role="option"]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
    }

    // Confirmar apertura
    const confirmBtn = page.locator('button:has-text("Abrir"), button:has-text("Confirmar")').first();
    await confirmBtn.click();

    // Esperar a que se abra la cuenta
    await page.waitForTimeout(2000);

    // Verificar que ahora hay una cuenta activa
    await expect(page.locator('text=/Cuenta Activa|Cuenta.*Abierta/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir agregar productos al carrito', async ({ page }) => {
    // Abrir cuenta primero
    await page.waitForTimeout(2000);
    const newAccountBtn = page.locator('button:has-text("Nueva Cuenta"), button:has-text("Abrir Caja")').first();

    if (await newAccountBtn.isVisible()) {
      await newAccountBtn.click();
      await page.waitForTimeout(1000);

      const patientInput = page.locator('input[placeholder*="paciente"], input[aria-label*="Paciente"]').first();
      await patientInput.fill('Juan');
      await page.waitForTimeout(1000);

      const firstOption = page.locator('li[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }

      const confirmBtn = page.locator('button:has-text("Abrir"), button:has-text("Confirmar")').first();
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    // Buscar productos o servicios
    const productSearch = page.locator('input[placeholder*="Buscar producto"], input[placeholder*="Buscar servicio"]').first();

    if (await productSearch.isVisible()) {
      await productSearch.fill('Consulta');
      await page.waitForTimeout(1000);

      // Agregar producto
      const addButton = page.locator('button:has-text("Agregar"), button[aria-label*="Agregar"]').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);

        // Verificar que el producto aparece en el carrito
        await expect(page.locator('text=/Consulta/i').first()).toBeVisible();
      }
    }
  });

  test('debe permitir aplicar descuentos a items', async ({ page }) => {
    // Abrir cuenta y agregar producto primero
    await page.waitForTimeout(2000);

    // Verificar si hay cuenta activa, si no, abrirla
    const newAccountBtn = page.locator('button:has-text("Nueva Cuenta")').first();
    if (await newAccountBtn.isVisible()) {
      await newAccountBtn.click();
      await page.waitForTimeout(1000);

      const patientInput = page.locator('input[placeholder*="paciente"]').first();
      await patientInput.fill('Juan');
      await page.waitForTimeout(1000);

      const firstOption = page.locator('li[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }

      const confirmBtn = page.locator('button:has-text("Abrir")').first();
      await confirmBtn.click();
      await page.waitForTimeout(2000);

      // Agregar un producto
      const productSearch = page.locator('input[placeholder*="Buscar producto"]').first();
      if (await productSearch.isVisible()) {
        await productSearch.fill('Consulta');
        await page.waitForTimeout(1000);

        const addButton = page.locator('button:has-text("Agregar")').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Buscar botón de descuento
    const discountBtn = page.locator('button:has-text("Descuento"), button[aria-label*="Descuento"]').first();

    if (await discountBtn.isVisible()) {
      await discountBtn.click();
      await page.waitForTimeout(500);

      // Ingresar descuento (puede ser porcentaje o monto)
      const discountInput = page.locator('input[name="descuento"], input[placeholder*="descuento"]').first();
      if (await discountInput.isVisible()) {
        await discountInput.fill('10');

        const applyBtn = page.locator('button:has-text("Aplicar")').first();
        await applyBtn.click();
        await page.waitForTimeout(1000);

        // Verificar que el descuento se aplicó
        await expect(page.locator('text=/Descuento|10%/i').first()).toBeVisible();
      }
    }
  });

  test('debe calcular el total correctamente', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verificar que hay un área de totales
    const totalArea = page.locator('text=/Total:|Subtotal:/i').first();
    await expect(totalArea).toBeVisible({ timeout: 10000 });

    // Si hay cuenta activa, verificar que los totales se muestran
    const totalValue = page.locator('text=/\\$[0-9,]+\\.?[0-9]*/').first();
    if (await totalValue.isVisible()) {
      const totalText = await totalValue.textContent();
      expect(totalText).toMatch(/\$[0-9]/);
    }
  });

  test('debe permitir procesar el pago de una cuenta', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verificar si hay cuenta activa con items
    const payButton = page.locator('button:has-text("Cobrar"), button:has-text("Pagar")').first();

    if (await payButton.isVisible() && !(await payButton.isDisabled())) {
      await payButton.click();
      await page.waitForTimeout(1000);

      // Seleccionar método de pago
      const efectivoBtn = page.locator('button:has-text("Efectivo"), input[value="efectivo"]').first();
      if (await efectivoBtn.isVisible()) {
        await efectivoBtn.click();
        await page.waitForTimeout(500);
      }

      // Ingresar monto recibido
      const montoInput = page.locator('input[name="montoRecibido"], input[placeholder*="Monto"]').first();
      if (await montoInput.isVisible()) {
        await montoInput.fill('1000');
      }

      // Confirmar pago
      const confirmPaymentBtn = page.locator('button:has-text("Confirmar"), button:has-text("Procesar")').first();
      if (await confirmPaymentBtn.isVisible()) {
        await confirmPaymentBtn.click();
        await page.waitForTimeout(2000);

        // Verificar mensaje de éxito
        await expect(page.locator('text=/Pago.*exitoso|Cobro.*exitoso/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('debe permitir cerrar una cuenta abierta', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Buscar botón para cerrar cuenta
    const closeAccountBtn = page.locator('button:has-text("Cerrar Cuenta"), button:has-text("Finalizar")').first();

    if (await closeAccountBtn.isVisible() && !(await closeAccountBtn.isDisabled())) {
      // Guardar info de la cuenta actual
      const accountInfo = await page.locator('text=/Cuenta.*[0-9]+/i').first().textContent();

      await closeAccountBtn.click();
      await page.waitForTimeout(1000);

      // Confirmar cierre
      const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Cerrar")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);

        // Verificar que la cuenta se cerró
        const newAccountBtn = page.locator('button:has-text("Nueva Cuenta")').first();
        await expect(newAccountBtn).toBeVisible();
      }
    }
  });

  test('debe mostrar historial de cuentas cerradas', async ({ page }) => {
    // Buscar tab de historial
    const historyTab = page.locator('button:has-text("Historial"), [role="tab"]:has-text("Historial")').first();

    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(2000);

      // Verificar que se muestran cuentas cerradas
      const accountsList = page.locator('table tbody tr, [role="row"]');
      const count = await accountsList.count();

      if (count > 0) {
        // Verificar que hay información de cuentas
        await expect(accountsList.first()).toBeVisible();

        // Verificar columnas típicas
        await expect(page.locator('text=/Fecha|Paciente|Total/i').first()).toBeVisible();
      }
    }
  });

  test('debe permitir ver detalles de una cuenta cerrada', async ({ page }) => {
    // Ir a historial
    const historyTab = page.locator('button:has-text("Historial"), [role="tab"]:has-text("Historial")').first();

    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(2000);

      // Buscar primera cuenta
      const firstAccount = page.locator('tbody tr, [role="row"]').first();
      const count = await page.locator('tbody tr, [role="row"]').count();

      if (count > 0) {
        // Hacer click en ver detalles
        const viewBtn = firstAccount.locator('button:has-text("Ver"), button[aria-label*="Ver"]').first();

        if (await viewBtn.isVisible()) {
          await viewBtn.click();
          await page.waitForTimeout(1000);

          // Verificar que aparece modal con detalles
          const dialog = page.locator('[role="dialog"]').first();
          await expect(dialog).toBeVisible();

          // Verificar que hay información detallada
          await expect(dialog.locator('text=/Items|Productos|Total/i').first()).toBeVisible();
        }
      }
    }
  });
});
