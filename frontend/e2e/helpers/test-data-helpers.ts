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

  // Navegar a pacientes usando sidebar (Material-UI ListItemButton con texto "Pacientes")
  // El sidebar usa nav#navigation con ListItemButton que contiene el texto del módulo
  const sidebarButton = page.locator('#navigation').getByRole('button', { name: 'Pacientes' });

  if (await sidebarButton.count() > 0) {
    await sidebarButton.click();
    // Esperar a que la URL cambie a /patients
    await page.waitForURL(/.*patients/, { timeout: 15000 });
  } else {
    // Fallback: usar goto directo
    await page.goto('http://localhost:3000/patients');
  }

  await page.waitForLoadState('networkidle');

  // Click en botón de nuevo paciente (el botón tiene el texto "Nuevo Paciente")
  await page.click('button:has-text("Nuevo Paciente")');

  // Esperar a que se abra el formulario
  await page.waitForSelector('input[name="nombre"]', { timeout: 10000 });

  // Datos del paciente - solo letras en nombre y apellidos (validación del formulario)
  const randomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const randomSuffix = `${randomLetter()}${randomLetter()}${randomLetter()}${randomLetter()}`;
  const patientData = {
    nombre: `PacienteTest`,
    apellidoPaterno: `Prueba${randomSuffix}`,
    apellidoMaterno: `Playwright`,
    fechaNacimiento: '1990-01-15',
    genero: 'M',
    telefono: '4431234567',
    email: `paciente${suffix}@test.com`,
    direccion: 'Calle de Prueba 123, Morelia',
    curp: `PATE${suffix.slice(-6)}HMCRRR01`,
  };

  // === PASO 1: Datos Personales ===
  await page.fill('input[name="nombre"]', patientData.nombre);
  await page.fill('input[name="apellidoPaterno"]', patientData.apellidoPaterno);
  await page.fill('input[name="apellidoMaterno"]', patientData.apellidoMaterno);

  // Fecha de nacimiento - usar label para encontrar el textbox correcto
  const fechaInput = page.getByRole('textbox', { name: /fecha de nacimiento/i });
  await fechaInput.fill(patientData.fechaNacimiento);

  // Género ya viene seleccionado por defecto (Masculino), no necesitamos cambiarlo

  // Click en "Siguiente" para ir al paso 2
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForTimeout(500);

  // === PASO 2: Información de Contacto ===
  await page.fill('input[name="telefono"]', patientData.telefono);
  await page.fill('input[name="email"]', patientData.email);

  // Dirección puede ser input o textarea
  const direccionInput = page.locator('input[name="direccion"], textarea[name="direccion"]');
  if (await direccionInput.count() > 0) {
    await direccionInput.fill(patientData.direccion);
  }

  // Click en "Siguiente" para ir al paso 3
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForTimeout(500);

  // === PASO 3: Información Médica ===
  // CURP puede estar en paso 2 o paso 3, intentar llenarlo si existe
  const curpInput = page.locator('input[name="curp"]');
  if (await curpInput.count() > 0) {
    await curpInput.fill(patientData.curp);
  }

  // Guardar paciente - buscar botón de guardar o registrar
  const guardarBtn = page.getByRole('button', { name: /guardar|registrar|crear/i });
  await guardarBtn.click();

  // Esperar confirmación
  await page.waitForSelector('text=/éxito|success|creado|registrado/i', { timeout: 15000 });
  await page.waitForTimeout(2000);

  return patientData;
}

/**
 * Crea un producto de prueba en inventario
 */
export async function createTestProduct(page: Page) {
  const { suffix } = generateUniqueData();

  // Navegar a inventario usando sidebar (Material-UI ListItemButton)
  const sidebarButton = page.locator('#navigation').getByRole('button', { name: 'Inventario' });

  if (await sidebarButton.count() > 0) {
    await sidebarButton.click();
    await page.waitForURL(/.*inventory/, { timeout: 15000 });
  } else {
    await page.goto('http://localhost:3000/inventory');
  }

  await page.waitForLoadState('networkidle');

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
  // Navegar a pacientes usando sidebar (Material-UI ListItemButton)
  const sidebarButton = page.locator('#navigation').getByRole('button', { name: 'Pacientes' });

  if (await sidebarButton.count() > 0) {
    await sidebarButton.click();
    await page.waitForURL(/.*patients/, { timeout: 15000 });
  } else {
    await page.goto('http://localhost:3000/patients');
  }

  await page.waitForLoadState('networkidle');

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
 * Usa click en sidebar (Material-UI ListItemButton) en lugar de goto directo
 */
export async function navigateToModule(page: Page, moduleName: string) {
  const moduleMap: Record<string, { path: string; sidebarText: string }> = {
    'patients': { path: '/patients', sidebarText: 'Pacientes' },
    'pacientes': { path: '/patients', sidebarText: 'Pacientes' },
    'pos': { path: '/pos', sidebarText: 'Punto de Venta' },
    'inventory': { path: '/inventory', sidebarText: 'Inventario' },
    'inventario': { path: '/inventory', sidebarText: 'Inventario' },
    'hospitalization': { path: '/hospitalization', sidebarText: 'Hospitalización' },
    'hospitalización': { path: '/hospitalization', sidebarText: 'Hospitalización' },
    'billing': { path: '/billing', sidebarText: 'Facturación' },
    'facturación': { path: '/billing', sidebarText: 'Facturación' },
    'reports': { path: '/reports', sidebarText: 'Reportes' },
    'reportes': { path: '/reports', sidebarText: 'Reportes' },
    'quirofanos': { path: '/quirofanos', sidebarText: 'Quirófanos' },
    'rooms': { path: '/rooms', sidebarText: 'Habitaciones' },
    'habitaciones': { path: '/rooms', sidebarText: 'Habitaciones' },
  };

  const module = moduleMap[moduleName.toLowerCase()];
  if (!module) {
    throw new Error(`Módulo desconocido: ${moduleName}`);
  }

  // Usar click en el sidebar (Material-UI ListItemButton dentro de nav#navigation)
  const sidebarButton = page.locator('#navigation').getByRole('button', { name: module.sidebarText });

  if (await sidebarButton.count() > 0) {
    await sidebarButton.click();
  } else {
    // Fallback: usar goto directo
    await page.goto(`http://localhost:3000${module.path}`);
  }

  // Esperar a que la URL contenga el path esperado
  await page.waitForURL(new RegExp(`.*${module.path.replace('/', '\\/')}`), { timeout: 15000 });
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
