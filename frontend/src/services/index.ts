// ABOUTME: Centralized exports for all frontend services
// ABOUTME: Provides barrel exports for cleaner imports across the application

// Auth & Users
export { default as usersService } from './usersService';

// Patients & Hospitalization
export { patientsService } from './patientsService';
export { default as hospitalizationService } from './hospitalizationService';

// Billing & POS
export { default as billingService } from './billingService';
export { default as posService } from './posService';

// Inventory & Stock
export { inventoryService } from './inventoryService';
export { stockAlertService } from './stockAlertService';
export { default as solicitudesService } from './solicitudesService';

// Facilities & Resources
export { roomsService } from './roomsService';
export { default as quirofanosService } from './quirofanosService';

// Staff
export { employeeService } from './employeeService';

// Reporting & Audit
export { default as reportsService } from './reportsService';
export { default as auditService } from './auditService';

// Notifications
export { default as notificacionesService } from './notificacionesService';

// Utilities
export { PostalCodeService } from './postalCodeService';
