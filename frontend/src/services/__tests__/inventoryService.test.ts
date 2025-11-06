// ABOUTME: Tests comprehensivos para inventoryService
// ABOUTME: Cubre gestión de inventario, productos, proveedores y servicios

import { inventoryService } from '../inventoryService';
import { api } from '@/utils/api';
import { Product } from '@/types/inventory.types';

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

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

describe('inventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('suppliers', () => {
    it('should fetch suppliers', async () => {
      const mockResponse = { data: { items: [{ id: 1, razonSocial: 'Test' }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await inventoryService.getSuppliers();

      expect(mockedApi.get).toHaveBeenCalledWith('/inventory/suppliers?');
      expect(result).toEqual(mockResponse);
    });

    it('should create supplier', async () => {
      const supplierData = { razonSocial: 'Test', nombreComercial: 'Test', rfc: 'TEST123456', contacto: { nombre: 'John', telefono: '555-1234', email: 'test@test.com' }, direccion: 'Test Address', condicionesPago: 'Contado' };
      mockedApi.post.mockResolvedValue({ data: { id: 1 } });

      const result = await inventoryService.createSupplier(supplierData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/inventory/suppliers', expect.objectContaining({
        nombreEmpresa: 'Test',
        contactoNombre: 'John'
      }));
    });

    it('should update supplier', async () => {
      const updateData = { razonSocial: 'Updated', contacto: { nombre: 'Jane' } };
      mockedApi.put.mockResolvedValue({ data: { id: 1 } });

      await inventoryService.updateSupplier(1, updateData as any);

      expect(mockedApi.put).toHaveBeenCalledWith('/inventory/suppliers/1', expect.objectContaining({
        nombreEmpresa: 'Updated'
      }));
    });

    it('should delete supplier', async () => {
      mockedApi.delete.mockResolvedValue({ success: true });

      await inventoryService.deleteSupplier(1, 'Test reason');

      expect(mockedApi.delete).toHaveBeenCalledWith('/inventory/suppliers/1', { data: { motivo: 'Test reason' } });
    });
  });

  describe('products', () => {
    it('should fetch products', async () => {
      const mockResponse = { data: { items: [createMockProduct()] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await inventoryService.getProducts();

      expect(mockedApi.get).toHaveBeenCalledWith('/inventory/products?');
      expect(result).toEqual(mockResponse);
    });

    it('should create product', async () => {
      const productData = { codigo: 'TEST-001', nombre: 'Test', categoria: 'medicamento', unidadMedida: 'pieza', stockMinimo: 10, stockMaximo: 100, precioCompra: 100, precioVenta: 150, proveedorId: 1 };
      mockedApi.post.mockResolvedValue({ data: { id: 1, ...productData } });

      const result = await inventoryService.createProduct(productData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/inventory/products', productData);
    });

    it('should update product', async () => {
      const updateData = { precioVenta: 175 };
      mockedApi.put.mockResolvedValue({ data: { id: 1, ...updateData } });

      await inventoryService.updateProduct(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/inventory/products/1', updateData);
    });

    it('should delete product', async () => {
      mockedApi.delete.mockResolvedValue({ success: true });

      await inventoryService.deleteProduct(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/inventory/products/1');
    });
  });

  describe('stock movements', () => {
    it('should fetch movements', async () => {
      const mockResponse = { data: { items: [{ id: 1, tipo: 'entrada', cantidad: 10 }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await inventoryService.getStockMovements();

      expect(mockedApi.get).toHaveBeenCalledWith('/inventory/movements?');
      expect(result).toEqual(mockResponse);
    });

    it('should create movement', async () => {
      const movementData = { productoId: 1, tipo: 'entrada', cantidad: 10, motivo: 'Compra' };
      mockedApi.post.mockResolvedValue({ data: { id: 1, ...movementData } });

      await inventoryService.createStockMovement(movementData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/inventory/movements', movementData);
    });
  });

  describe('services', () => {
    it('should fetch services', async () => {
      const mockResponse = { data: { items: [{ id: 1, nombre: 'Test Service' }] } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await inventoryService.getServices();

      expect(mockedApi.get).toHaveBeenCalledWith('/inventory/services?');
      expect(result).toEqual(mockResponse);
    });

    it('should create service', async () => {
      const serviceData = { codigo: 'SRV-001', nombre: 'Test Service', tipo: 'consulta', precio: 500 };
      mockedApi.post.mockResolvedValue({ data: { id: 1, ...serviceData } });

      await inventoryService.createService(serviceData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/inventory/services', serviceData);
    });

    it('should update service', async () => {
      const updateData = { precio: 600 };
      mockedApi.put.mockResolvedValue({ data: { id: 1, ...updateData } });

      await inventoryService.updateService(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/inventory/services/1', updateData);
    });

    it('should delete service', async () => {
      mockedApi.delete.mockResolvedValue({ success: true });

      await inventoryService.deleteService(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/inventory/services/1');
    });
  });

  describe('utility methods', () => {
    it('should calculate inventory value', () => {
      const products = [
        createMockProduct({ stockActual: 10, precioCompra: 100 }),
        createMockProduct({ id: 2, stockActual: 20, precioCompra: 50 })
      ];

      const value = inventoryService.calculateInventoryValue(products);

      expect(value).toBe(2000);
    });

    it('should get low stock products', () => {
      const products = [
        createMockProduct({ stockActual: 5, stockMinimo: 10 }),
        createMockProduct({ id: 2, stockActual: 50, stockMinimo: 10 })
      ];

      const lowStock = inventoryService.getLowStockProducts(products);

      expect(lowStock).toHaveLength(1);
      expect(lowStock[0].id).toBe(1);
    });

    it('should get expiring products', () => {
      const inTwentyDays = new Date();
      inTwentyDays.setDate(inTwentyDays.getDate() + 20);

      const products = [
        createMockProduct({ fechaCaducidad: inTwentyDays.toISOString() }),
        createMockProduct({ id: 2, fechaCaducidad: undefined })
      ];

      const expiring = inventoryService.getExpiringProducts(products);

      expect(expiring).toHaveLength(1);
    });

    it('should get expired products', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const products = [
        createMockProduct({ fechaCaducidad: yesterday.toISOString() }),
        createMockProduct({ id: 2, fechaCaducidad: undefined })
      ];

      const expired = inventoryService.getExpiredProducts(products);

      expect(expired).toHaveLength(1);
    });

    it('should calculate margin', () => {
      expect(inventoryService.calculateMargin(100, 150)).toBe(50);
      expect(inventoryService.calculateMargin(0, 150)).toBe(0);
    });

    it('should format price', () => {
      const formatted = inventoryService.formatPrice(1500);
      expect(formatted).toContain('1,500');
    });

    it('should get stock status color', () => {
      expect(inventoryService.getStockStatusColor(createMockProduct({ stockActual: 0 }))).toBe('error');
      expect(inventoryService.getStockStatusColor(createMockProduct({ stockActual: 5, stockMinimo: 10 }))).toBe('warning');
      expect(inventoryService.getStockStatusColor(createMockProduct({ stockActual: 95, stockMaximo: 100 }))).toBe('success');
    });

    it('should validate stock exit', () => {
      const product = createMockProduct({ stockActual: 50 });
      expect(inventoryService.canPerformStockExit(product, 30)).toBe(true);
      expect(inventoryService.canPerformStockExit(product, 60)).toBe(false);
    });

    it('should search products', () => {
      const products = [
        createMockProduct({ nombre: 'Aspirina' }),
        createMockProduct({ id: 2, nombre: 'Paracetamol' })
      ];

      const results = inventoryService.searchProducts(products, 'aspi');

      expect(results).toHaveLength(1);
      expect(results[0].nombre).toBe('Aspirina');
    });

    it('should generate barcode', () => {
      const barcode = inventoryService.generateBarcode();

      expect(barcode).toMatch(/^750\d{10}$/);
    });

    it('should validate barcode', () => {
      expect(inventoryService.validateBarcode('7501234567890')).toBe(true);
      expect(inventoryService.validateBarcode('123')).toBe(false);
      expect(inventoryService.validateBarcode('abcdefgh')).toBe(false);
    });
  });

  describe('getInventoryStats', () => {
    it('should fetch and transform stats', async () => {
      const mockResponse = {
        success: true,
        data: { resumen: { totalProductos: 100, valorTotalInventario: 50000, productosStockBajo: 5 }, distribucion: { categorias: { medicamento: 50 } } }
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await inventoryService.getInventoryStats();

      expect(result.success).toBe(true);
      expect(result.data?.totalProducts).toBe(100);
      expect(result.data?.totalValue).toBe(50000);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Error'));

      const result = await inventoryService.getInventoryStats();

      expect(result.success).toBe(false);
      expect(result.data?.totalProducts).toBe(0);
    });
  });
});
