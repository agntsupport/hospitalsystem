// ABOUTME: Constantes compartidas para tests E2E del Sistema Hospitalario
// ABOUTME: Define claves de localStorage y configuración de timeouts

// Claves de localStorage (deben coincidir con APP_CONFIG en src/utils/constants.ts)
export const TOKEN_KEY = 'hospital_token';
export const USER_KEY = 'hospital_user';

// Timeouts para tests E2E
export const TIMEOUTS = {
  NAVIGATION: 30000,
  ACTION: 15000,
  SHORT: 5000,
};

// Credenciales de prueba
export const TEST_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  cajero: { username: 'cajero1', password: 'cajero123' },
  enfermero: { username: 'enfermero1', password: 'enfermero123' },
  especialista: { username: 'especialista1', password: 'medico123' },
  almacen: { username: 'almacen1', password: 'almacen123' },
};
