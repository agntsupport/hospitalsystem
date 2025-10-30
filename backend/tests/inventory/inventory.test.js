const request = require('supertest');
const express = require('express');
const inventoryRoutes = require('../../routes/inventory.routes');
const { authenticateToken } = require('../../middleware/auth.middleware');
const testHelpers = require('../setupTests');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/inventory', authenticateToken, inventoryRoutes);

describe('Inventory Endpoints', () => {
  let testUser, authToken, testProduct, testSupplier;

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = await testHelpers.createTestUser({
      username: 'testalmacenista',
      rol: 'almacenista'
    });

    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUser.id, rol: testUser.rol },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create test supplier
    testSupplier = await testHelpers.createTestSupplier({
      nombre: 'Test Supplier',
      contacto: 'Test Contact',
      telefono: '5551234567',
      email: 'supplier@test.com'
    });

    // Create test product
    testProduct = await testHelpers.createTestProduct({
      nombre: 'Test Medicine',
      precio: 25.50,
      stock: 100,
      stockMinimo: 10,
      categoria: 'medicamento',
      proveedor_id: testSupplier.id
    });
  });

  describe('Products Endpoints', () => {
    describe('GET /api/inventory/products', () => {
      it('should get products list with pagination', async () => {
        const response = await request(app)
          .get('/api/inventory/products')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('products');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.products)).toBe(true);
      });

      it('should filter products by search term', async () => {
        const response = await request(app)
          .get('/api/inventory/products?search=Test Medicine')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.products).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Test Medicine'
            })
          ])
        );
      });

      it('should filter products by category', async () => {
        const response = await request(app)
          .get('/api/inventory/products?categoria=medicamento')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.products.every(item => item.categoria === 'medicamento')).toBe(true);
      });

      it('should filter products with low stock', async () => {
        const response = await request(app)
          .get('/api/inventory/products?stockBajo=true')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/inventory/products', () => {
      const validProductData = {
        codigo: 'TEST-NEW-001',
        nombre: 'New Test Product',
        categoria: 'material_medico',
        unidadMedida: 'pieza',
        precioVenta: 15.75,
        stockActual: 50,
        stockMinimo: 5,
        descripcion: 'Test product description',
        proveedorId: null // Will be set dynamically
      };

      beforeEach(() => {
        validProductData.proveedorId = testSupplier.id;
      });

      it('should create a new product with valid data', async () => {
        const response = await request(app)
          .post('/api/inventory/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validProductData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.producto).toHaveProperty('id');
        expect(response.body.data.producto.nombre).toBe(validProductData.nombre);
        expect(response.body.data.producto.precioVenta).toBe(validProductData.precioVenta);
        expect(response.body.data.producto.stockActual).toBe(validProductData.stockActual);
      });

      it('should fail with missing required fields', async () => {
        const incompleteData = {
          nombre: 'Incomplete Product'
          // Missing precio, stock, categoria
        };

        const response = await request(app)
          .post('/api/inventory/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with invalid price', async () => {
        const invalidData = {
          ...validProductData,
          precioVenta: -10 // Negative price
        };

        const response = await request(app)
          .post('/api/inventory/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with invalid category', async () => {
        const invalidData = {
          ...validProductData,
          categoria: 'invalid_category'
        };

        const response = await request(app)
          .post('/api/inventory/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/inventory/products/:id', () => {
      it('should update product successfully', async () => {
        const updateData = {
          precio: 30.00,
          stock: 150,
          descripcion: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/inventory/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.precio).toBe(updateData.precio);
        expect(response.body.data.stock).toBe(updateData.stock);
      });

      it('should return 404 for non-existent product', async () => {
        const response = await request(app)
          .put('/api/inventory/products/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ precio: 20.00 });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/inventory/products/:id', () => {
      it('should delete product successfully', async () => {
        const response = await request(app)
          .delete(`/api/inventory/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('eliminado');
      });

      it('should return 404 for non-existent product', async () => {
        const response = await request(app)
          .delete('/api/inventory/products/99999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Suppliers Endpoints', () => {
    describe('GET /api/inventory/suppliers', () => {
      it('should get suppliers list', async () => {
        const response = await request(app)
          .get('/api/inventory/suppliers')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('items');
        expect(Array.isArray(response.body.data.items)).toBe(true);
      });

      it('should filter suppliers by search term', async () => {
        const response = await request(app)
          .get('/api/inventory/suppliers?search=Test Supplier')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Test Supplier'
            })
          ])
        );
      });
    });

    describe('POST /api/inventory/suppliers', () => {
      const validSupplierData = {
        nombre: 'New Test Supplier',
        contacto: 'John Doe',
        telefono: '5559876543',
        email: 'newtest@supplier.com',
        direccion: 'Test Address 123'
      };

      it('should create a new supplier with valid data', async () => {
        const response = await request(app)
          .post('/api/inventory/suppliers')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validSupplierData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.nombre).toBe(validSupplierData.nombre);
        expect(response.body.data.contacto).toBe(validSupplierData.contacto);
      });

      it('should fail with missing required fields', async () => {
        const incompleteData = {
          nombre: 'Incomplete Supplier'
          // Missing contacto
        };

        const response = await request(app)
          .post('/api/inventory/suppliers')
          .set('Authorization', `Bearer ${authToken}`)
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with invalid email format', async () => {
        const invalidData = {
          ...validSupplierData,
          email: 'invalid-email'
        };

        const response = await request(app)
          .post('/api/inventory/suppliers')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Movements Endpoints', () => {
    describe('GET /api/inventory/movements', () => {
      it('should get movements list with pagination', async () => {
        const response = await request(app)
          .get('/api/inventory/movements')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('items');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.items)).toBe(true);
      });

      it('should filter movements by product', async () => {
        const response = await request(app)
          .get(`/api/inventory/movements?producto_id=${testProduct.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.items.every(item => item.producto_id === testProduct.id)).toBe(true);
      });

      it('should filter movements by type', async () => {
        const response = await request(app)
          .get('/api/inventory/movements?tipo=entrada')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.items.every(item => item.tipo === 'entrada')).toBe(true);
      });
    });

    describe('POST /api/inventory/movements', () => {
      const validMovementData = {
        producto_id: null, // Will be set dynamically
        tipo: 'entrada',
        cantidad: 50,
        motivo: 'Compra de inventario',
        referencia: 'TEST-001'
      };

      beforeEach(() => {
        validMovementData.producto_id = testProduct.id;
      });

      it('should create a new movement with valid data', async () => {
        const response = await request(app)
          .post('/api/inventory/movements')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validMovementData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.producto_id).toBe(validMovementData.producto_id);
        expect(response.body.data.tipo).toBe(validMovementData.tipo);
        expect(response.body.data.cantidad).toBe(validMovementData.cantidad);
      });

      it('should fail with missing required fields', async () => {
        const incompleteData = {
          tipo: 'entrada'
          // Missing producto_id, cantidad
        };

        const response = await request(app)
          .post('/api/inventory/movements')
          .set('Authorization', `Bearer ${authToken}`)
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with invalid movement type', async () => {
        const invalidData = {
          ...validMovementData,
          tipo: 'invalid_type'
        };

        const response = await request(app)
          .post('/api/inventory/movements')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with zero or negative quantity', async () => {
        const invalidData = {
          ...validMovementData,
          cantidad: -10
        };

        const response = await request(app)
          .post('/api/inventory/movements')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with non-existent product', async () => {
        const invalidData = {
          ...validMovementData,
          producto_id: 99999
        };

        const response = await request(app)
          .post('/api/inventory/movements')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Stats Endpoints', () => {
    describe('GET /api/inventory/stats', () => {
      it('should get inventory statistics', async () => {
        const response = await request(app)
          .get('/api/inventory/stats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalProductos');
        expect(response.body.data).toHaveProperty('valorInventario');
        expect(response.body.data).toHaveProperty('productosStockBajo');
        expect(typeof response.body.data.totalProductos).toBe('number');
        expect(typeof response.body.data.valorInventario).toBe('number');
      });
    });
  });

  describe('Authorization Tests', () => {
    let enfermeroToken;

    beforeEach(async () => {
      // Create enfermero user (should have read-only access)
      const enfermero = await testHelpers.createTestUser({
        username: 'testenfermero',
        rol: 'enfermero'
      });

      const jwt = require('jsonwebtoken');
      enfermeroToken = jwt.sign(
        { userId: enfermero.id, rol: enfermero.rol },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );
    });

    it('should allow enfermero to read products', async () => {
      const response = await request(app)
        .get('/api/inventory/products')
        .set('Authorization', `Bearer ${enfermeroToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny enfermero to create products', async () => {
      const response = await request(app)
        .post('/api/inventory/products')
        .set('Authorization', `Bearer ${enfermeroToken}`)
        .send({
          nombre: 'Test Product',
          precio: 10.00,
          stock: 5,
          categoria: 'material'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/inventory/products' },
        { method: 'post', path: '/api/inventory/products' },
        { method: 'get', path: '/api/inventory/suppliers' },
        { method: 'get', path: '/api/inventory/movements' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });
  });
});