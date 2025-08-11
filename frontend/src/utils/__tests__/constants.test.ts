import { ROLES, ROLE_LABELS, API_ROUTES, APP_CONFIG } from '../__mocks__/constants';

describe('Constants', () => {
  describe('ROLES', () => {
    it('should have all expected roles', () => {
      expect(ROLES.CAJERO).toBe('cajero');
      expect(ROLES.ENFERMERO).toBe('enfermero');
      expect(ROLES.ALMACENISTA).toBe('almacenista');
      expect(ROLES.ADMINISTRADOR).toBe('administrador');
      expect(ROLES.SOCIO).toBe('socio');
      expect(ROLES.MEDICO_RESIDENTE).toBe('medico_residente');
      expect(ROLES.MEDICO_ESPECIALISTA).toBe('medico_especialista');
    });

    it('should have corresponding role labels', () => {
      expect(ROLE_LABELS[ROLES.CAJERO]).toBe('Cajero');
      expect(ROLE_LABELS[ROLES.ENFERMERO]).toBe('Enfermero');
      expect(ROLE_LABELS[ROLES.ALMACENISTA]).toBe('Almacenista');
      expect(ROLE_LABELS[ROLES.ADMINISTRADOR]).toBe('Administrador');
      expect(ROLE_LABELS[ROLES.SOCIO]).toBe('Socio');
      expect(ROLE_LABELS[ROLES.MEDICO_RESIDENTE]).toBe('Médico Residente');
      expect(ROLE_LABELS[ROLES.MEDICO_ESPECIALISTA]).toBe('Médico Especialista');
    });
  });

  describe('API_ROUTES', () => {
    it('should have auth routes', () => {
      expect(API_ROUTES.AUTH.LOGIN).toBe('/auth/login');
      expect(API_ROUTES.AUTH.REGISTER).toBe('/auth/register');
      expect(API_ROUTES.AUTH.PROFILE).toBe('/auth/profile');
      expect(API_ROUTES.AUTH.VERIFY_TOKEN).toBe('/auth/verify-token');
    });

    it('should have dynamic patient routes', () => {
      expect(API_ROUTES.PATIENTS.BY_ID(123)).toBe('/patients/123');
      expect(API_ROUTES.PATIENTS.HISTORY('abc')).toBe('/patients/abc/history');
      expect(API_ROUTES.PATIENTS.RESPONSIBLE(456)).toBe('/patients/456/responsible');
    });

    it('should have employee routes', () => {
      expect(API_ROUTES.EMPLOYEES.BASE).toBe('/employees');
      expect(API_ROUTES.EMPLOYEES.SEARCH).toBe('/employees/search');
      expect(API_ROUTES.EMPLOYEES.BY_ID(789)).toBe('/employees/789');
    });

    it('should have patient account routes', () => {
      expect(API_ROUTES.PATIENT_ACCOUNTS.BASE).toBe('/patient-accounts');
      expect(API_ROUTES.PATIENT_ACCOUNTS.BY_ID(1)).toBe('/patient-accounts/1');
      expect(API_ROUTES.PATIENT_ACCOUNTS.TRANSACTIONS(2)).toBe('/patient-accounts/2/transactions');
      expect(API_ROUTES.PATIENT_ACCOUNTS.CLOSE(3)).toBe('/patient-accounts/3/close');
    });
  });

  describe('APP_CONFIG', () => {
    it('should have default configuration values', () => {
      expect(APP_CONFIG.API_BASE_URL).toBe('http://localhost:3001/api');
      expect(APP_CONFIG.APP_NAME).toBe('Sistema Hospitalario');
      expect(APP_CONFIG.APP_VERSION).toBe('1.0.0');
      expect(APP_CONFIG.TOKEN_KEY).toBe('hospital_token');
      expect(APP_CONFIG.USER_KEY).toBe('hospital_user');
    });

    it('should have pagination settings', () => {
      expect(APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
      expect(APP_CONFIG.PAGINATION.MAX_PAGE_SIZE).toBe(100);
    });
  });

  describe('Type Safety', () => {
    it('should have immutable role constants', () => {
      // TypeScript should prevent modification, but we can test the values exist
      expect(typeof ROLES.CAJERO).toBe('string');
      expect(Object.keys(ROLES)).toHaveLength(7);
    });

    it('should have complete role label mapping', () => {
      const roleKeys = Object.keys(ROLES);
      const roleLabelKeys = Object.keys(ROLE_LABELS);
      
      // Every role should have a corresponding label
      roleKeys.forEach(key => {
        const roleValue = ROLES[key as keyof typeof ROLES];
        expect(ROLE_LABELS[roleValue as keyof typeof ROLE_LABELS]).toBeDefined();
      });
    });
  });

  describe('Consistency Checks', () => {
    it('should have consistent API route structure', () => {
      expect(API_ROUTES.AUTH).toBeDefined();
      expect(API_ROUTES.PATIENTS).toBeDefined();
      expect(API_ROUTES.EMPLOYEES).toBeDefined();
      expect(API_ROUTES.PATIENT_ACCOUNTS).toBeDefined();
      
      // Check that dynamic route functions work correctly
      expect(typeof API_ROUTES.PATIENTS.BY_ID).toBe('function');
      expect(typeof API_ROUTES.EMPLOYEES.BY_ID).toBe('function');
      expect(typeof API_ROUTES.PATIENT_ACCOUNTS.BY_ID).toBe('function');
    });

    it('should have valid URL patterns', () => {
      // All static routes should start with /
      expect(API_ROUTES.AUTH.LOGIN).toMatch(/^\/.*$/);
      expect(API_ROUTES.PATIENTS.BASE).toMatch(/^\/.*$/);
      expect(API_ROUTES.EMPLOYEES.BASE).toMatch(/^\/.*$/);
      
      // Dynamic routes should return valid URLs
      expect(API_ROUTES.PATIENTS.BY_ID(1)).toMatch(/^\/patients\/\d+$/);
      expect(API_ROUTES.EMPLOYEES.BY_ID('test')).toMatch(/^\/employees\/.*$/);
    });
  });
});