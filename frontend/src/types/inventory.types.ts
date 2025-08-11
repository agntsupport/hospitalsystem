// ========================================
// TIPOS PARA MÓDULO DE INVENTARIO
// ========================================

// Proveedor/Supplier
export interface Supplier {
  id: number;
  codigo: string;
  razonSocial: string;
  nombreComercial?: string;
  rfc: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  contacto?: {
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
  };
  condicionesPago?: string;
  diasCredito?: number;
  activo: boolean;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface CreateSupplierRequest {
  razonSocial: string;
  nombreComercial?: string;
  rfc: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  contacto?: {
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
  };
  condicionesPago?: string;
  diasCredito?: number;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  activo?: boolean;
}

// Tipos de categoría de productos
export type CategoriaProducto = 'medicamento' | 'material_medico' | 'insumo';

// Categoría de Productos
export interface ProductCategory {
  id: CategoriaProducto;
  nombre: string;
  descripcion?: string;
}

// Producto
export interface Product {
  id: number;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaProducto;
  proveedor: Supplier;
  unidadMedida: string;
  contenidoPorUnidad?: string;
  precioCompra: number;
  precioVenta: number;
  margenGanancia: number;
  stockMinimo: number;
  stockMaximo: number;
  stockActual: number;
  ubicacion?: string;
  requiereReceta: boolean;
  fechaCaducidad?: string;
  lote?: string;
  activo: boolean;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface CreateProductRequest {
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  categoriaId: CategoriaProducto;
  proveedorId: number;
  unidadMedida: string;
  contenidoPorUnidad?: string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  stockMaximo: number;
  stockActual: number;
  ubicacion?: string;
  requiereReceta?: boolean;
  fechaCaducidad?: string;
  lote?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  activo?: boolean;
}

// Movimiento de Stock
export interface StockMovement {
  id: number;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
  };
  tipo: 'entrada' | 'salida' | 'ajuste' | 'merma';
  cantidad: number;
  motivo: string;
  observaciones?: string;
  usuario: {
    id: number;
    username: string;
  };
  fecha: string;
}

export interface CreateStockMovementRequest {
  productoId: number;
  tipoMovimiento: 'entrada' | 'salida' | 'ajuste' | 'merma';
  cantidad: number;
  costo?: number;
  razon: string;
  referencia?: string;
  observaciones?: string;
}

// Estadísticas de Inventario
export interface InventoryStats {
  totalProducts: number;
  totalSuppliers: number;
  totalValue: number;
  lowStockProducts: number;
  expiredProducts: number;
  productsByCategory: Record<string, number>;
  topProducts: Array<{
    producto: Product;
    cantidadVendida: number;
    ingresoTotal: number;
  }>;
  recentMovements: StockMovement[];
  monthlyMovements: Record<string, number>;
}

// Filtros
export interface SupplierFilters {
  search?: string;
  activo?: boolean;
  ciudad?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}

export interface ProductFilters {
  search?: string;
  categoriaId?: CategoriaProducto;
  proveedorId?: number;
  stockBajo?: boolean;
  proximosVencer?: boolean;
  activo?: boolean;
  requiereReceta?: boolean;
  limit?: number;
  offset?: number;
}

export interface StockMovementFilters {
  productoId?: number;
  tipo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioId?: number;
  limit?: number;
  offset?: number;
}

// Respuestas API
export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

export interface StockMovementsResponse {
  movements: StockMovement[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Constantes
export const UNIT_TYPES = [
  'pieza',
  'caja',
  'frasco',
  'ampolla',
  'vial',
  'tableta',
  'cápsula',
  'sobre',
  'paquete',
  'litro',
  'mililitro',
  'gramo',
  'kilogramo',
  'metro',
  'unidad'
] as const;

export const MOVEMENT_TYPES = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  merma: 'Merma',
  venta: 'Venta'
} as const;

export const PAYMENT_TERMS = [
  'Contado',
  '8 días',
  '15 días',
  '30 días',
  '45 días',
  '60 días',
  '90 días'
] as const;

export const PRODUCT_CATEGORIES = [
  { id: 'medicamento', nombre: 'Medicamentos', descripcion: 'Medicamentos y fármacos' },
  { id: 'material_medico', nombre: 'Material Médico', descripcion: 'Material médico desechable' },
  { id: 'insumo', nombre: 'Insumos', descripcion: 'Insumos generales' }
] as const;