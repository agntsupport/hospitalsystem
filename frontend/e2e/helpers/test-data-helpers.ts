// ABOUTME: Helpers para crear datos de prueba en tests E2E
// ABOUTME: Funciones reutilizables para crear pacientes, productos, hospitalizaciones, etc.

import { Page } from '@playwright/test';

/**
 * Genera datos únicos para evitar colisiones entre tests
 */
export function generateUniqueData() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return {
    timestamp,
    random,
    suffix: `${timestamp}${random}`,
  };
}

/**
 * Crea un paciente de prueba y retorna sus datos
 */
export async function createTestPatient(page: Page) {
  const { suffix } = generateUniqueData();

  await page.goto('http://localhost:3000/patients');

  // Click en botón de nuevo paciente
  await page.click('button:has-text("Nuevo"), button:has-text("Agregar")');

  // Esperar a que se abra el formulario
  await page.waitForSelector('input[name="nombre"]', { timeout: 10000 });

  // Datos del paciente
  const patientData = {
    nombre: `PacienteE2E`,
    apellidoPaterno: `Test${suffix}`,
    apellidoMaterno: `Playwright`,
    fechaNacimiento: '1990-01-15',
    genero: 'M',
    telefono: '4431234567',
    email: `paciente${suffix}@test.com`,
    direccion: 'Calle de Prueba 123, Morelia',
    curp: `PATE${suffix.slice(-6)}HMCRRR01`,
  };

  // Llenar formulario
  await page.fill('input[name="nombre"]', patientData.nombre);
  await page.fill('input[name="apellidoPaterno"]', patientData.apellidoPaterno);
  await page.fill('input[name="apellidoMaterno"]', patientData.apellidoMaterno);
  await page.fill('input[name="fechaNacimiento"], input[type="date"]', patientData.fechaNacimiento);

  // Género (puede ser select o radio)
  const generoSelect = page.locator('select[name="genero"]');
  const generoRadio = page.locator('input[value="M"]');

  if (await generoSelect.count() > 0) {
    await generoSelect.selectOption('M');
  } else if (await generoRadio.count() > 0) {
    await generoRadio.click();
  }

  await page.fill('input[name="telefono"]', patientData.telefono);
  await page.fill('input[name="email"]', patientData.email);
  await page.fill('input[name="direccion"], textarea[name="direccion"]', patientData.direccion);
  await page.fill('input[name="curp"]', patientData.curp);

  // Guardar paciente
  await page.click('button[type="submit"]:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")');

  // Esperar confirmación
  await page.waitForSelector('text=/éxito|success|creado|registrado/i', { timeout: 10000 });
  await page.waitForTimeout(2000);

  return patientData;
}

/**
 * Crea un producto de prueba en inventario
 */
export async function createTestProduct(page: Page) {
  const { suffix } = generateUniqueData();

  await page.goto('http://localhost:3000/inventory');

  // Click en botón de nuevo producto
  await page.click('button:has-text("Nuevo"), button:has-text("Agregar")');

  // Esperar formulario
  await page.waitForSelector('input[name="codigo"]', { timeout: 10000 });

  const productData = {
    codigo: `TEST-MED-${suffix}`,
    nombre: `Medicamento Test E2E ${suffix}`,
    descripcion: 'Medicamento de prueba para test E2E',
    categoria: 'medicamento',
    unidadMedida: 'tableta',
    precioCompra: '15.50',
    precioVenta: '35.00',
    stockMinimo: '50',
    stockMaximo: '500',
    stockActual: '100',
  };

  // Llenar formulario
  await page.fill('input[name="codigo"]', productData.codigo);
  await page.fill('input[name="nombre"]', productData.nombre);
  await page.fill('input[name="descripcion"], textarea[name="descripcion"]', productData.descripcion);

  // Categoría
  const categoriaSelect = page.locator('select[name="categoria"]');
  if (await categoriaSelect.count() > 0) {
    await categoriaSelect.selectOption('medicamento');
  }

  await page.fill('input[name="unidadMedida"]', productData.unidadMedida);
  await page.fill('input[name="precioCompra"], input[name="costo"]', productData.precioCompra);
  await page.fill('input[name="precioVenta"], input[name="precio"]', productData.precioVenta);
  await page.fill('input[name="stockMinimo"]', productData.stockMinimo);
  await page.fill('input[name="stockMaximo"]', productData.stockMaximo);
  await page.fill('input[name="stock"], input[name="stockActual"]', productData.stockActual);

  // Guardar producto
  await page.click('button[type="submit"]:has-text("Guardar"), button:has-text("Crear")');

  // Esperar confirmación
  await page.waitForSelector('text=/éxito|success|creado|registrado/i', { timeout: 10000 });
  await page.waitForTimeout(2000);

  return productData;
}

/**
 * Busca y selecciona un paciente por apellido
 */
export async function findAndSelectPatient(page: Page, apellidoPaterno: string) {
  await page.goto('http://localhost:3000/patients');

  // Buscar paciente
  const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]');
  await searchInput.fill(apellidoPaterno);
  await page.waitForTimeout(1000);

  // Click en el primer resultado
  const firstRow = page.locator('tbody tr').first();
  await firstRow.waitFor({ state: 'visible', timeout: 5000 });

  return firstRow;
}

/**
 * Navega a un módulo específico del sistema
 */
export async function navigateToModule(page: Page, moduleName: string) {
  const moduleMap: Record<string, string> = {
    'patients': '/patients',
    'pacientes': '/patients',
    'pos': '/pos',
    'inventory': '/inventory',
    'inventario': '/inventory',
    'hospitalization': '/hospitalization',
    'hospitalización': '/hospitalization',
    'billing': '/billing',
    'facturación': '/billing',
    'reports': '/reports',
    'reportes': '/reports',
    'quirofanos': '/quirofanos',
    'rooms': '/rooms',
    'habitaciones': '/rooms',
  };

  const path = moduleMap[moduleName.toLowerCase()];
  if (!path) {
    throw new Error(`Módulo desconocido: ${moduleName}`);
  }

  await page.goto(`http://localhost:3000${path}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Espera a que un selector esté visible con retry
 */
export async function waitForSelectorWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 5000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await page.waitForTimeout(1000);
    }
  }

  return false;
}
