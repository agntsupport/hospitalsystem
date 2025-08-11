import { Product } from '@/types/inventory.types';

export interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  product: Product;
  message: string;
  severity: 'warning' | 'error' | 'info';
  daysToExpire?: number;
  stockLevel?: number;
  createdAt: Date;
  priority: number; // 1 = highest priority
}

export interface StockAlertConfig {
  enableLowStockAlerts: boolean;
  enableExpirationAlerts: boolean;
  lowStockThresholdType: 'percentage' | 'absolute';
  lowStockThresholdValue: number; // percentage (0-100) or absolute number
  expirationWarningDays: number; // days before expiration to warn
  criticalExpirationDays: number; // days before expiration for critical alert
}

class StockAlertService {
  private config: StockAlertConfig = {
    enableLowStockAlerts: true,
    enableExpirationAlerts: true,
    lowStockThresholdType: 'absolute', // usar stock mínimo del producto
    lowStockThresholdValue: 10, // 10% por encima del stock mínimo
    expirationWarningDays: 30, // alertar 30 días antes
    criticalExpirationDays: 7 // crítico 7 días antes
  };

  /**
   * Genera todas las alertas para una lista de productos
   */
  generateAlerts(products: Product[]): StockAlert[] {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      // Verificar alertas de stock
      if (this.config.enableLowStockAlerts) {
        const stockAlert = this.checkStockLevel(product);
        if (stockAlert) {
          alerts.push(stockAlert);
        }
      }

      // Verificar alertas de caducidad
      if (this.config.enableExpirationAlerts && product.fechaCaducidad) {
        const expirationAlert = this.checkExpiration(product);
        if (expirationAlert) {
          alerts.push(expirationAlert);
        }
      }
    });

    // Ordenar por prioridad (menor número = mayor prioridad)
    return alerts.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Verifica el nivel de stock de un producto
   */
  private checkStockLevel(product: Product): StockAlert | null {
    const stockActual = product.stockActual;
    const stockMinimo = product.stockMinimo;

    // Sin stock
    if (stockActual <= 0) {
      return {
        id: `stock_${product.id}_${Date.now()}`,
        type: 'out_of_stock',
        product,
        message: `Producto sin stock disponible`,
        severity: 'error',
        stockLevel: stockActual,
        createdAt: new Date(),
        priority: 1
      };
    }

    // Stock bajo
    let threshold = stockMinimo;
    if (this.config.lowStockThresholdType === 'percentage') {
      threshold = stockMinimo * (1 + this.config.lowStockThresholdValue / 100);
    } else {
      threshold = stockMinimo + this.config.lowStockThresholdValue;
    }

    if (stockActual <= threshold) {
      return {
        id: `stock_${product.id}_${Date.now()}`,
        type: 'low_stock',
        product,
        message: `Stock bajo: ${stockActual} ${product.unidadMedida} (mínimo: ${stockMinimo})`,
        severity: stockActual <= stockMinimo ? 'error' : 'warning',
        stockLevel: stockActual,
        createdAt: new Date(),
        priority: stockActual <= stockMinimo ? 2 : 4
      };
    }

    return null;
  }

  /**
   * Verifica la fecha de caducidad de un producto
   */
  private checkExpiration(product: Product): StockAlert | null {
    if (!product.fechaCaducidad) return null;

    const today = new Date();
    const expirationDate = new Date(product.fechaCaducidad);
    const daysToExpire = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Producto ya vencido
    if (daysToExpire < 0) {
      return {
        id: `expiry_${product.id}_${Date.now()}`,
        type: 'expired',
        product,
        message: `Producto vencido hace ${Math.abs(daysToExpire)} días`,
        severity: 'error',
        daysToExpire,
        createdAt: new Date(),
        priority: 1
      };
    }

    // Próximo a vencer - crítico
    if (daysToExpire <= this.config.criticalExpirationDays) {
      return {
        id: `expiry_${product.id}_${Date.now()}`,
        type: 'expiring_soon',
        product,
        message: `Vence en ${daysToExpire} días (${this.formatDate(expirationDate)})`,
        severity: 'error',
        daysToExpire,
        createdAt: new Date(),
        priority: 3
      };
    }

    // Próximo a vencer - advertencia
    if (daysToExpire <= this.config.expirationWarningDays) {
      return {
        id: `expiry_${product.id}_${Date.now()}`,
        type: 'expiring_soon',
        product,
        message: `Vence en ${daysToExpire} días (${this.formatDate(expirationDate)})`,
        severity: 'warning',
        daysToExpire,
        createdAt: new Date(),
        priority: 5
      };
    }

    return null;
  }

  /**
   * Obtiene alertas filtradas por tipo
   */
  getAlertsByType(alerts: StockAlert[], type: StockAlert['type']): StockAlert[] {
    return alerts.filter(alert => alert.type === type);
  }

  /**
   * Obtiene alertas filtradas por severidad
   */
  getAlertsBySeverity(alerts: StockAlert[], severity: StockAlert['severity']): StockAlert[] {
    return alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Obtiene alertas críticas (prioridad 1-3)
   */
  getCriticalAlerts(alerts: StockAlert[]): StockAlert[] {
    return alerts.filter(alert => alert.priority <= 3);
  }

  /**
   * Genera recomendaciones de pedidos basadas en alertas
   */
  generateOrderRecommendations(alerts: StockAlert[]): {
    productId: number;
    productName: string;
    currentStock: number;
    recommendedQuantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[] {
    const recommendations: {
      productId: number;
      productName: string;
      currentStock: number;
      recommendedQuantity: number;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[] = [];

    // Filtrar alertas relacionadas con stock
    const stockAlerts = alerts.filter(alert => 
      alert.type === 'out_of_stock' || alert.type === 'low_stock'
    );

    stockAlerts.forEach(alert => {
      const product = alert.product;
      let recommendedQuantity = product.stockMaximo - product.stockActual;
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let reason = 'Reposición normal de stock';

      if (alert.type === 'out_of_stock') {
        recommendedQuantity = Math.max(product.stockMaximo, product.stockMinimo * 2);
        priority = 'high';
        reason = 'URGENTE: Producto sin stock';
      } else if (product.stockActual <= product.stockMinimo) {
        recommendedQuantity = product.stockMaximo - product.stockActual;
        priority = 'high';
        reason = 'Stock por debajo del mínimo';
      }

      recommendations.push({
        productId: product.id,
        productName: product.nombre,
        currentStock: product.stockActual,
        recommendedQuantity,
        reason,
        priority
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Actualiza la configuración de alertas
   */
  updateConfig(newConfig: Partial<StockAlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): StockAlertConfig {
    return { ...this.config };
  }

  /**
   * Formatea una fecha para mostrar
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Obtiene estadísticas de alertas
   */
  getAlertStats(alerts: StockAlert[]): {
    total: number;
    critical: number;
    warning: number;
    byType: Record<StockAlert['type'], number>;
    trend: 'improving' | 'stable' | 'worsening';
  } {
    const stats = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'error').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      byType: {
        out_of_stock: 0,
        low_stock: 0,
        expiring_soon: 0,
        expired: 0
      } as Record<StockAlert['type'], number>,
      trend: 'stable' as 'improving' | 'stable' | 'worsening'
    };

    alerts.forEach(alert => {
      stats.byType[alert.type]++;
    });

    // Simple trend calculation based on critical alerts ratio
    const criticalRatio = stats.total > 0 ? stats.critical / stats.total : 0;
    if (criticalRatio > 0.5) {
      stats.trend = 'worsening';
    } else if (criticalRatio < 0.2) {
      stats.trend = 'improving';
    }

    return stats;
  }
}

export const stockAlertService = new StockAlertService();