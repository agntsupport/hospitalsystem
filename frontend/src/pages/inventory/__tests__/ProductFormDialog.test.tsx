import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ProductFormDialog from '../ProductFormDialog';
import { inventoryService } from '@/services/inventoryService';
import authSlice from '@/store/slices/authSlice';
import uiSlice from '@/store/slices/uiSlice';

// Mock services
jest.mock('@/services/inventoryService');
const mockedInventoryService = inventoryService as jest.Mocked<typeof inventoryService>;

// Test data
const mockSuppliers = [
  { id: 1, nombre: 'Proveedor 1', contacto: 'Contacto 1' },
  { id: 2, nombre: 'Proveedor 2', contacto: 'Contacto 2' },
];

const mockProduct = {
  id: 1,
  nombre: 'Test Product',
  precio: 25.99,
  stock: 100,
  stockMinimo: 10,
  categoria: 'medicamento' as const,
  descripcion: 'Test product description',
  proveedor_id: 1,
  contenido: '500mg',
  stockMaximo: 1000,
  codigoBarras: '1234567890',
  ubicacion: 'A1-B2',
  requiereReceta: true,
  fechaCaducidad: '2025-12-31',
  lote: 'LOT001',
  createdAt: '2025-01-01',
  proveedor: mockSuppliers[0],
};

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          nombreUsuario: 'testuser',
          rol: 'almacenista',
          email: 'test@test.com',
          activo: true,
          createdAt: '2025-01-01',
        },
        token: 'mock-token',
        loading: false,
        error: null,
      },
      ui: {
        sidebarOpen: false,
        loading: false,
        error: null,
        success: null,
      },
    },
  });
};

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement, { store = createTestStore() } = {}) => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('ProductFormDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedInventoryService.getSuppliers.mockResolvedValue({
      success: true,
      data: { items: mockSuppliers },
    });

    mockedInventoryService.createProduct.mockResolvedValue({
      success: true,
      data: mockProduct,
    });

    mockedInventoryService.updateProduct.mockResolvedValue({
      success: true,
      data: { ...mockProduct, nombre: 'Updated Product' },
    });
  });

  describe('Rendering', () => {
    it('should render create product dialog when no product is provided', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('➕ Nuevo Producto')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
      expect(screen.getByText('Crear Producto')).toBeInTheDocument();
    });

    it('should render edit product dialog when product is provided', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} product={mockProduct} />);
      
      await waitFor(() => {
        expect(screen.getByText('✏️ Editar Producto')).toBeInTheDocument();
      });
      
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25.99')).toBeInTheDocument();
      expect(screen.getByText('Actualizar Producto')).toBeInTheDocument();
    });

    it('should load suppliers on mount', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockedInventoryService.getSuppliers).toHaveBeenCalled();
      });
    });

    it('should render all form fields', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/stock actual/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/stock mínimo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/proveedor/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Crear Producto')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
        expect(screen.getByText('El precio es requerido')).toBeInTheDocument();
        expect(screen.getByText('El stock es requerido')).toBeInTheDocument();
        expect(screen.getByText('La categoría es requerida')).toBeInTheDocument();
      });
    });

    it('should validate positive prices', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(async () => {
        const priceField = screen.getByLabelText(/precio/i);
        await userEvent.type(priceField, '-10');
      });
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El precio debe ser mayor a 0')).toBeInTheDocument();
      });
    });

    it('should validate stock values', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(async () => {
        const stockField = screen.getByLabelText(/stock actual/i);
        await userEvent.type(stockField, '-5');
      });
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El stock no puede ser negativo')).toBeInTheDocument();
      });
    });

    it('should validate stock minimum vs maximum', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const stockMinField = screen.getByLabelText(/stock mínimo/i);
        const stockMaxField = screen.getByLabelText(/stock máximo/i);
        
        await userEvent.type(stockMinField, '100');
        await userEvent.type(stockMaxField, '50');
      });
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El stock máximo debe ser mayor al mínimo')).toBeInTheDocument();
      });
    });

    it('should validate expiration date is in the future', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await waitFor(() => {
        const expirationField = screen.getByLabelText(/fecha de caducidad/i);
        fireEvent.change(expirationField, { 
          target: { value: yesterday.toISOString().split('T')[0] } 
        });
      });
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La fecha de caducidad debe ser futura')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new product successfully', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      });

      // Fill required fields
      await userEvent.type(screen.getByLabelText(/nombre del producto/i), 'New Product');
      await userEvent.type(screen.getByLabelText(/precio/i), '15.99');
      await userEvent.type(screen.getByLabelText(/stock actual/i), '50');
      await userEvent.type(screen.getByLabelText(/stock mínimo/i), '5');
      
      // Select category
      const categoryField = screen.getByLabelText(/categoría/i);
      fireEvent.mouseDown(categoryField);
      const medicamentoOption = screen.getByText('Medicamento');
      fireEvent.click(medicamentoOption);
      
      // Submit form
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedInventoryService.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: 'New Product',
            precio: 15.99,
            stock: 50,
            stockMinimo: 5,
            categoria: 'medicamento',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should update existing product successfully', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} product={mockProduct} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      });

      // Update name
      const nameField = screen.getByDisplayValue('Test Product');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Product');
      
      // Submit form
      const submitButton = screen.getByText('Actualizar Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedInventoryService.updateProduct).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            nombre: 'Updated Product',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedInventoryService.createProduct.mockRejectedValue({
        response: {
          data: {
            message: 'Product with this name already exists',
          },
        },
      });

      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      });

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/nombre del producto/i), 'Duplicate Product');
      await userEvent.type(screen.getByLabelText(/precio/i), '15.99');
      await userEvent.type(screen.getByLabelText(/stock actual/i), '50');
      await userEvent.type(screen.getByLabelText(/stock mínimo/i), '5');
      
      const categoryField = screen.getByLabelText(/categoría/i);
      fireEvent.mouseDown(categoryField);
      const medicamentoOption = screen.getByText('Medicamento');
      fireEvent.click(medicamentoOption);
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Product with this name already exists')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockedInventoryService.createProduct.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockProduct
        }), 100))
      );

      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      });

      // Fill and submit form quickly
      await userEvent.type(screen.getByLabelText(/nombre del producto/i), 'Test Product');
      await userEvent.type(screen.getByLabelText(/precio/i), '15.99');
      await userEvent.type(screen.getByLabelText(/stock actual/i), '50');
      await userEvent.type(screen.getByLabelText(/stock mínimo/i), '5');
      
      const categoryField = screen.getByLabelText(/categoría/i);
      fireEvent.mouseDown(categoryField);
      const medicamentoOption = screen.getByText('Medicamento');
      fireEvent.click(medicamentoOption);
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Advanced Fields', () => {
    it('should handle optional fields correctly', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/contenido/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/código de barras/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/ubicación/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/lote/i)).toBeInTheDocument();
      });

      // Fill optional fields
      await userEvent.type(screen.getByLabelText(/contenido/i), '250mg');
      await userEvent.type(screen.getByLabelText(/código de barras/i), '1234567890');
      await userEvent.type(screen.getByLabelText(/ubicación/i), 'A1-B2');
      await userEvent.type(screen.getByLabelText(/lote/i), 'LOT123');
    });

    it('should handle prescription requirement checkbox', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const prescriptionCheckbox = screen.getByLabelText(/requiere receta/i);
        expect(prescriptionCheckbox).toBeInTheDocument();
        
        fireEvent.click(prescriptionCheckbox);
        expect(prescriptionCheckbox).toBeChecked();
      });
    });

    it('should populate supplier dropdown', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const supplierField = screen.getByLabelText(/proveedor/i);
        fireEvent.mouseDown(supplierField);
        
        expect(screen.getByText('Proveedor 1')).toBeInTheDocument();
        expect(screen.getByText('Proveedor 2')).toBeInTheDocument();
      });
    });

    it('should handle supplier selection', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const supplierField = screen.getByLabelText(/proveedor/i);
        fireEvent.mouseDown(supplierField);
        
        const supplier1Option = screen.getByText('Proveedor 1');
        fireEvent.click(supplier1Option);
      });

      // Fill required fields and submit to test supplier is included
      await userEvent.type(screen.getByLabelText(/nombre del producto/i), 'Test Product');
      await userEvent.type(screen.getByLabelText(/precio/i), '15.99');
      await userEvent.type(screen.getByLabelText(/stock actual/i), '50');
      await userEvent.type(screen.getByLabelText(/stock mínimo/i), '5');
      
      const categoryField = screen.getByLabelText(/categoría/i);
      fireEvent.mouseDown(categoryField);
      const medicamentoOption = screen.getByText('Medicamento');
      fireEvent.click(medicamentoOption);
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedInventoryService.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            proveedor_id: 1,
          })
        );
      });
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when cancel button is clicked', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
        
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should reset form when dialog is reopened', async () => {
      const { rerender } = renderWithProviders(<ProductFormDialog {...defaultProps} open={false} />);
      
      // Reopen dialog
      rerender(
        <Provider store={createTestStore()}>
          <ThemeProvider theme={theme}>
            <BrowserRouter>
              <ProductFormDialog {...defaultProps} open={true} />
            </BrowserRouter>
          </ThemeProvider>
        </Provider>
      );
      
      await waitFor(() => {
        // Form should be empty
        expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue('');
        expect(screen.getByLabelText(/precio/i)).toHaveValue('');
      });
    });
  });

  describe('Category Options', () => {
    it('should display all category options', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const categoryField = screen.getByLabelText(/categoría/i);
        fireEvent.mouseDown(categoryField);
        
        expect(screen.getByText('Medicamento')).toBeInTheDocument();
        expect(screen.getByText('Material')).toBeInTheDocument();
        expect(screen.getByText('Equipo')).toBeInTheDocument();
        expect(screen.getByText('Insumo')).toBeInTheDocument();
      });
    });

    it('should select category correctly', async () => {
      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        const categoryField = screen.getByLabelText(/categoría/i);
        fireEvent.mouseDown(categoryField);
        
        const materialOption = screen.getByText('Material');
        fireEvent.click(materialOption);
        
        expect(categoryField).toHaveValue('material');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle supplier loading error', async () => {
      mockedInventoryService.getSuppliers.mockRejectedValue({
        message: 'Failed to load suppliers'
      });

      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error.*proveedores/i)).toBeInTheDocument();
      });
    });

    it('should display network errors appropriately', async () => {
      mockedInventoryService.createProduct.mockRejectedValue({
        message: 'Network Error'
      });

      renderWithProviders(<ProductFormDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      });

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/nombre del producto/i), 'Test Product');
      await userEvent.type(screen.getByLabelText(/precio/i), '15.99');
      await userEvent.type(screen.getByLabelText(/stock actual/i), '50');
      await userEvent.type(screen.getByLabelText(/stock mínimo/i), '5');
      
      const categoryField = screen.getByLabelText(/categoría/i);
      fireEvent.mouseDown(categoryField);
      const medicamentoOption = screen.getByText('Medicamento');
      fireEvent.click(medicamentoOption);
      
      const submitButton = screen.getByText('Crear Producto');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error.*guardar/i)).toBeInTheDocument();
      });
    });
  });
});