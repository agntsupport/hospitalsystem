// ABOUTME: Tests comprehensivos para stockAlertService
// ABOUTME: Cubre generación de alertas, recomendaciones y configuración

import { stockAlertService } from '../stockAlertService';
import { Product } from '@/types/inventory.types';

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  codigo: 'TEST-001',
  nombre: 'Test Product',
  descripcion: 'Test',
  categoria: 'medicamento',
  unidadMedida: 'pieza',
  stockActual: 50,
  stockMinimo: 10,
  stockMaximo: 100,
  precioCompra: 100,
  precioVenta: 150,
  proveedorId: 1,
  activo: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  proveedor: { id: 1, razonSocial: 'Test Supplier', rfc: 'TEST123456', activo: true },
  ...overrides
});

describe('stockAlertService', () => {
  beforeEach(() => {
    stockAlertService.updateConfig({
      enableLowStockAlerts: true,
      enableExpirationAlerts: true,
      lowStockThresholdType: 'absolute',
      lowStockThresholdValue: 10,
      expirationWarningDays: 30,
      criticalExpirationDays: 7
    });
  });

  describe('generateAlerts', () => {
    it('should generate alerts for products', () => {
      const products = [
        createMockProduct({ stockActual: 5, stockMinimo: 10 }),
        createMockProduct({ id: 2, stockActual: 0 }),
        createMockProduct({ id: 3, stockActual: 50, fechaCaducidad: '2025-01-05' })
      ];

      const alerts = stockAlertService.generateAlerts(products);

      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should not generate alerts when disabled', () => {
      stockAlertService.updateConfig({ enableLowStockAlerts: false, enableExpirationAlerts: false });

      const products = [createMockProduct({ stockActual: 0 })];
      const alerts = stockAlertService.generateAlerts(products);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkStockLevel', () => {
    it('should alert for out of stock', () => {
      const products = [createMockProduct({ stockActual: 0 })];
      const alerts = stockAlertService.generateAlerts(products);

      const outOfStockAlert = alerts.find(a => a.type === 'out_of_stock');
      expect(outOfStockAlert).toBeDefined();
      expect(outOfStockAlert?.severity).toBe('error');
      expect(outOfStockAlert?.priority).toBe(1);
    });

    it('should alert for low stock', () => {
      const products = [createMockProduct({ stockActual: 5, stockMinimo: 10 })];
      const alerts = stockAlertService.generateAlerts(products);

      const lowStockAlert = alerts.find(a => a.type === 'low_stock');
      expect(lowStockAlert).toBeDefined();
      expect(lowStockAlert?.severity).toBe('error');
    });

    it('should not alert for sufficient stock', () => {
      const products = [createMockProduct({ stockActual: 50, stockMinimo: 10 })];
      const alerts = stockAlertService.generateAlerts(products);

      const stockAlert = alerts.find(a => a.type === 'low_stock' || a.type === 'out_of_stock');
      expect(stockAlert).toBeUndefined();
    });
  });

  describe('checkExpiration', () => {
    it('should alert for expired products', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const products = [createMockProduct({ fechaCaducidad: yesterday.toISOString() })];
      const alerts = stockAlertService.generateAlerts(products);

      const expiredAlert = alerts.find(a => a.type === 'expired');
      expect(expiredAlert).toBeDefined();
      expect(expiredAlert?.severity).toBe('error');
      expect(expiredAlert?.priority).toBe(1);
    });

    it('should alert for critical expiring soon', () => {
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);

      const products = [createMockProduct({ fechaCaducidad: inFiveDays.toISOString() })];
      const alerts = stockAlertService.generateAlerts(products);

      const expiringAlert = alerts.find(a => a.type === 'expiring_soon');
      expect(expiringAlert).toBeDefined();
      expect(expiringAlert?.severity).toBe('error');
    });

    it('should alert for warning expiring soon', () => {
      const inTwentyDays = new Date();
      inTwentyDays.setDate(inTwentyDays.getDate() + 20);

      const products = [createMockProduct({ fechaCaducidad: inTwentyDays.toISOString() })];
      const alerts = stockAlertService.generateAlerts(products);

      const expiringAlert = alerts.find(a => a.type === 'expiring_soon');
      expect(expiringAlert).toBeDefined();
      expect(expiringAlert?.severity).toBe('warning');
    });

    it('should not alert for products without expiration', () => {
      const products = [createMockProduct({ fechaCaducidad: undefined })];
      const alerts = stockAlertService.generateAlerts(products);

      const expirationAlert = alerts.find(a => a.type === 'expiring_soon' || a.type === 'expired');
      expect(expirationAlert).toBeUndefined();
    });
  });

  describe('filtering methods', () => {
    const mockAlerts = [
      { id: '1', type: 'low_stock' as const, severity: 'warning' as const, priority: 4, product: {} as Product, message: '', createdAt: new Date() },
      { id: '2', type: 'expired' as const, severity: 'error' as const, priority: 1, product: {} as Product, message: '', createdAt: new Date() },
      { id: '3', type: 'out_of_stock' as const, severity: 'error' as const, priority: 1, product: {} as Product, message: '', createdAt: new Date() }
    ];

    it('should filter by type', () => {
      const lowStockAlerts = stockAlertService.getAlertsByType(mockAlerts, 'low_stock');
      expect(lowStockAlerts).toHaveLength(1);
      expect(lowStockAlerts[0].type).toBe('low_stock');
    });

    it('should filter by severity', () => {
      const errorAlerts = stockAlertService.getAlertsBySeverity(mockAlerts, 'error');
      expect(errorAlerts).toHaveLength(2);
    });

    it('should get critical alerts', () => {
      const criticalAlerts = stockAlertService.getCriticalAlerts(mockAlerts);
      expect(criticalAlerts).toHaveLength(2);
      expect(criticalAlerts.every(a => a.priority <= 3)).toBe(true);
    });
  });

  describe('generateOrderRecommendations', () => {
    it('should generate recommendations', () => {
      const alerts = [
        {
          id: '1',
          type: 'out_of_stock' as const,
          severity: 'error' as const,
          priority: 1,
          product: createMockProduct({ stockActual: 0, stockMinimo: 10, stockMaximo: 100 }),
          message: '',
          createdAt: new Date()
        }
      ];

      const recommendations = stockAlertService.generateOrderRecommendations(alerts);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].recommendedQuantity).toBeGreaterThan(0);
    });

    it('should prioritize high priority items', () => {
      const alerts = [
        {
          id: '1',
          type: 'out_of_stock' as const,
          severity: 'error' as const,
          priority: 1,
          product: createMockProduct({ id: 1, stockActual: 0, stockMinimo: 10, stockMaximo: 100 }),
          message: '',
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'low_stock' as const,
          severity: 'warning' as const,
          priority: 4,
          product: createMockProduct({ id: 2, stockActual: 5, stockMinimo: 10, stockMaximo: 50 }),
          message: '',
          createdAt: new Date()
        }
      ];

      const recommendations = stockAlertService.generateOrderRecommendations(alerts);

      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[1].priority).toBe('high');
    });

    it('should return empty for non-stock alerts', () => {
      const alerts = [
        {
          id: '1',
          type: 'expired' as const,
          severity: 'error' as const,
          priority: 1,
          product: createMockProduct(),
          message: '',
          createdAt: new Date()
        }
      ];

      const recommendations = stockAlertService.generateOrderRecommendations(alerts);

      expect(recommendations).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      stockAlertService.updateConfig({ lowStockThresholdValue: 20 });

      const config = stockAlertService.getConfig();

      expect(config.lowStockThresholdValue).toBe(20);
    });

    it('should preserve other config values', () => {
      stockAlertService.updateConfig({ lowStockThresholdValue: 20 });

      const config = stockAlertService.getConfig();

      expect(config.enableLowStockAlerts).toBe(true);
      expect(config.expirationWarningDays).toBe(30);
    });
  });

  describe('getAlertStats', () => {
    const mockAlerts = [
      { id: '1', type: 'low_stock' as const, severity: 'warning' as const, priority: 4, product: {} as Product, message: '', createdAt: new Date() },
      { id: '2', type: 'expired' as const, severity: 'error' as const, priority: 1, product: {} as Product, message: '', createdAt: new Date() },
      { id: '3', type: 'out_of_stock' as const, severity: 'error' as const, priority: 1, product: {} as Product, message: '', createdAt: new Date() }
    ];

    it('should calculate stats', () => {
      const stats = stockAlertService.getAlertStats(mockAlerts);

      expect(stats.total).toBe(3);
      expect(stats.critical).toBe(2);
      expect(stats.warning).toBe(1);
    });

    it('should count by type', () => {
      const stats = stockAlertService.getAlertStats(mockAlerts);

      expect(stats.byType.low_stock).toBe(1);
      expect(stats.byType.expired).toBe(1);
      expect(stats.byType.out_of_stock).toBe(1);
    });

    it('should calculate trend', () => {
      const stats = stockAlertService.getAlertStats(mockAlerts);

      expect(stats.trend).toBe('worsening');
    });

    it('should handle empty alerts', () => {
      const stats = stockAlertService.getAlertStats([]);

      expect(stats.total).toBe(0);
      expect(stats.critical).toBe(0);
      expect(stats.trend).toBe('improving');
    });
  });
});
