import { api } from '@/utils/api';
import { 
  Supplier, 
  CreateSupplierRequest, 
  UpdateSupplierRequest,
  SupplierFilters,
  SuppliersResponse,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  ProductsResponse,
  StockMovement,
  CreateStockMovementRequest,
  StockMovementFilters,
  StockMovementsResponse,
  InventoryStats,
  ProductCategory,
  ApiResponse,
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceFilters,
  ServicesResponse
} from '@/types/inventory.types';

class InventoryService {
  // ========== PROVEEDORES ==========
  
  async getSuppliers(filters: SupplierFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory/suppliers?${params.toString()}`);
    return response;
  }

  async createSupplier(supplierData: CreateSupplierRequest) {
    // Transform frontend data to backend expected format
    const backendData = {
      nombreEmpresa: supplierData.razonSocial,
      nombreComercial: supplierData.nombreComercial,
      rfc: supplierData.rfc,
      contactoNombre: supplierData.contacto?.nombre || '',
      contactoTelefono: supplierData.contacto?.telefono,
      contactoEmail: supplierData.contacto?.email,
      direccion: supplierData.direccion,
      condicionesPago: supplierData.condicionesPago || 'Contado'
    };
    
    const response = await api.post('/inventory/suppliers', backendData);
    return response;
  }

  async updateSupplier(id: number, supplierData: UpdateSupplierRequest) {
    // Transform frontend data to backend expected format
    const backendData = {
      nombreEmpresa: supplierData.razonSocial,
      nombreComercial: supplierData.nombreComercial,
      rfc: supplierData.rfc,
      contactoNombre: supplierData.contacto?.nombre,
      contactoTelefono: supplierData.contacto?.telefono,
      contactoEmail: supplierData.contacto?.email,
      direccion: supplierData.direccion,
      condicionesPago: supplierData.condicionesPago
    };
    
    const response = await api.put(`/inventory/suppliers/${id}`, backendData);
    return response;
  }

  async deleteSupplier(id: number, motivo: string) {
    const response = await api.delete(`/inventory/suppliers/${id}`, { 
      data: { motivo } 
    });
    return response;
  }

  // ========== PRODUCTOS ==========
  
  async getProducts(filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory/products?${params.toString()}`);
    return response;
  }

  async createProduct(productData: CreateProductRequest) {
    const response = await api.post('/inventory/products', productData);
    return response;
  }

  async updateProduct(id: number, productData: UpdateProductRequest) {
    const response = await api.put(`/inventory/products/${id}`, productData);
    return response;
  }

  async deleteProduct(id: number) {
    const response = await api.delete(`/inventory/products/${id}`);
    return response;
  }

  // ========== MOVIMIENTOS DE STOCK ==========
  
  async getStockMovements(filters: StockMovementFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory/movements?${params.toString()}`);
    return response;
  }

  async createStockMovement(movementData: CreateStockMovementRequest) {
    const response = await api.post('/inventory/movements', movementData);
    return response;
  }

  // ========== CATEGORÍAS ==========
  
  async getCategories() {
    const response = await api.get('/inventory/categories');
    return response;
  }

  // ========== UTILIDADES ==========
  
  /**
   * Calcula el valor total del inventario
   */
  calculateInventoryValue(products: Product[]): number {
    return products.reduce((total, product) => {
      return total + (product.stockActual * product.precioCompra);
    }, 0);
  }

  /**
   * Obtiene productos con stock bajo
   */
  getLowStockProducts(products: Product[]): Product[] {
    return products.filter(product => 
      product.activo && product.stockActual <= product.stockMinimo
    );
  }

  /**
   * Obtiene productos próximos a vencer
   */
  getExpiringProducts(products: Product[], daysThreshold: number = 30): Product[] {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return products.filter(product => 
      product.activo && 
      product.fechaCaducidad && 
      new Date(product.fechaCaducidad) <= thresholdDate &&
      new Date(product.fechaCaducidad) >= new Date()
    );
  }

  // ========== SERVICIOS ==========
  
  async getServices(filters: ServiceFilters = {}): Promise<ServicesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory/services?${params.toString()}`);
    return response as unknown as ServicesResponse;
  }

  async createService(serviceData: CreateServiceRequest) {
    const response = await api.post('/inventory/services', serviceData);
    return response;
  }

  async updateService(id: number, serviceData: UpdateServiceRequest) {
    const response = await api.put(`/inventory/services/${id}`, serviceData);
    return response;
  }

  async deleteService(id: number) {
    const response = await api.delete(`/inventory/services/${id}`);
    return response;
  }

  /**
   * Obtiene productos vencidos
   */
  getExpiredProducts(products: Product[]): Product[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return products.filter(product => 
      product.activo && 
      product.fechaCaducidad && 
      new Date(product.fechaCaducidad) < today
    );
  }

  /**
   * Calcula el margen de ganancia
   */
  calculateMargin(precioCompra: number, precioVenta: number): number {
    if (precioCompra <= 0) return 0;
    return ((precioVenta - precioCompra) / precioCompra) * 100;
  }

  /**
   * Formatea el precio para mostrar
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(price);
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Formatea la fecha y hora para mostrar
   */
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el color del estado del stock
   */
  getStockStatusColor(product: Product): 'error' | 'warning' | 'success' | 'default' {
    if (product.stockActual <= 0) return 'error';
    if (product.stockActual <= product.stockMinimo) return 'warning';
    if (product.stockActual >= product.stockMaximo * 0.8) return 'success';
    return 'default';
  }

  /**
   * Obtiene el texto del estado del stock
   */
  getStockStatusText(product: Product): string {
    if (product.stockActual <= 0) return 'Sin stock';
    if (product.stockActual <= product.stockMinimo) return 'Stock bajo';
    if (product.stockActual >= product.stockMaximo * 0.8) return 'Stock óptimo';
    return 'Stock normal';
  }

  /**
   * Valida si se puede realizar una salida de stock
   */
  canPerformStockExit(product: Product, quantity: number): boolean {
    return product.stockActual >= quantity;
  }

  /**
   * Obtiene productos por categoría
   */
  getProductsByCategory(products: Product[], categoryId: CategoriaProducto): Product[] {
    return products.filter(product =>
      product.activo && product.categoria === categoryId
    );
  }

  /**
   * Obtiene productos por proveedor
   */
  getProductsBySupplier(products: Product[], supplierId: number): Product[] {
    return products.filter(product => 
      product.activo && product.proveedor.id === supplierId
    );
  }

  /**
   * Busca productos por texto
   */
  searchProducts(products: Product[], searchTerm: string): Product[] {
    if (!searchTerm.trim()) return products;

    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.nombre.toLowerCase().includes(term) ||
      product.codigo.toLowerCase().includes(term) ||
      product.codigoBarras?.toLowerCase().includes(term) ||
      product.descripcion?.toLowerCase().includes(term) ||
      product.categoria.toLowerCase().includes(term) ||
      product.proveedor.razonSocial.toLowerCase().includes(term)
    );
  }

  /**
   * Obtiene el historial de movimientos de un producto
   */
  getProductMovementHistory(movements: StockMovement[], productId: number): StockMovement[] {
    return movements
      .filter(movement => movement.producto.id === productId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  /**
   * Calcula estadísticas de movimientos por período
   */
  getMovementStatsByPeriod(movements: StockMovement[], startDate: Date, endDate: Date) {
    const filteredMovements = movements.filter(movement => {
      const movementDate = new Date(movement.fecha);
      return movementDate >= startDate && movementDate <= endDate;
    });

    const stats = filteredMovements.reduce((acc, movement) => {
      acc[movement.tipo] = (acc[movement.tipo] || 0) + movement.cantidad;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMovements: filteredMovements.length,
      movementsByType: stats,
      movements: filteredMovements
    };
  }

  /**
   * Genera código de barras automático
   */
  generateBarcode(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `750${timestamp.slice(-7)}${random}`;
  }

  /**
   * Valida código de barras
   */
  validateBarcode(barcode: string): boolean {
    // Validación básica: debe tener entre 8 y 13 dígitos
    const barcodeRegex = /^\d{8,13}$/;
    return barcodeRegex.test(barcode);
  }

  /**
   * Obtiene resumen de alertas del inventario
   */
  getInventoryAlerts(products: Product[]) {
    const lowStock = this.getLowStockProducts(products);
    const expiring = this.getExpiringProducts(products);
    const expired = this.getExpiredProducts(products);
    
    return {
      lowStock: {
        count: lowStock.length,
        products: lowStock
      },
      expiring: {
        count: expiring.length,
        products: expiring
      },
      expired: {
        count: expired.length,
        products: expired
      },
      total: lowStock.length + expiring.length + expired.length
    };
  }

  // ========== ESTADÍSTICAS ==========
  
  /**
   * Obtiene estadísticas del inventario
   */
  async getInventoryStats(): Promise<ApiResponse<InventoryStats>> {
    try {
      const response = await api.get('/inventory/stats');
      
      if (response.success && response.data) {
        const backendData = response.data;
        
        // Transformar datos del backend al formato esperado por el frontend
        const transformedStats: InventoryStats = {
          totalProducts: backendData.resumen?.totalProductos || 0,
          totalSuppliers: 0, // No disponible en backend, usar valor por defecto
          totalValue: backendData.resumen?.valorTotalInventario || 0,
          lowStockProducts: backendData.resumen?.productosStockBajo || 0,
          expiredProducts: 0, // No disponible en backend, usar valor por defecto
          productsByCategory: backendData.distribucion?.categorias || {},
          topProducts: [], // No disponible en backend, usar array vacío
          recentMovements: [], // No disponible en backend, usar array vacío
          monthlyMovements: {} // No disponible en backend, usar objeto vacío
        };
        
        return {
          success: true,
          data: transformedStats,
          message: response.message || "Operación exitosa"
        };
      }

      return response as ApiResponse<InventoryStats>;
    } catch (error: any) {
      console.error('Error getting inventory stats:', error);
      return {
        success: false,
        message: error?.message || 'Error al obtener estadísticas del inventario',
        data: {
          totalProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          expiringProducts: 0,
          totalValue: 0,
          categoriesCount: 0,
          suppliersCount: 0
        }
      };
    }
  }
}

export const inventoryService = new InventoryService();