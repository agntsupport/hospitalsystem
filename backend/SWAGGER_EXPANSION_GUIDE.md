# Guía de Expansión de Swagger - Sistema Hospitalario

## Estado Actual

✅ **Swagger UI implementado y funcional** en `/api-docs`
✅ Configuración base completa en `swagger.config.js`
✅ 15 tags definidos para todos los módulos
✅ Esquemas comunes configurados (Error, PaginationInfo, etc.)
✅ Ejemplo de documentación completa: `POST /api/auth/login`

**Acceso:** http://localhost:3001/api-docs

---

## Cómo Agregar Documentación a Nuevos Endpoints

### Plantilla Base

```javascript
/**
 * @swagger
 * /api/ruta/endpoint:
 *   get:
 *     tags:
 *       - NombreTag
 *     summary: Descripción corta
 *     description: Descripción detallada (opcional)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/endpoint', authenticateToken, async (req, res) => {
  // ...código
});
```

---

## Ejemplos por Tipo de Endpoint

### 1. GET con Paginación

```javascript
/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags:
 *       - Pacientes
 *     summary: Listar todos los pacientes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, apellido o teléfono
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### 2. POST con Body

```javascript
/**
 * @swagger
 * /api/patients:
 *   post:
 *     tags:
 *       - Pacientes
 *     summary: Crear nuevo paciente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - telefono
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan
 *               apellido:
 *                 type: string
 *                 example: Pérez
 *               telefono:
 *                 type: string
 *                 example: "5512345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *     responses:
 *       201:
 *         description: Paciente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### 3. GET con Parámetro de Ruta

```javascript
/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     tags:
 *       - Pacientes
 *     summary: Obtener detalles de un paciente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Detalles del paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### 4. PUT para Actualizar

```javascript
/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     tags:
 *       - Pacientes
 *     summary: Actualizar paciente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### 5. DELETE

```javascript
/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     tags:
 *       - Pacientes
 *     summary: Eliminar paciente (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente eliminado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

---

## Tags Disponibles

Los siguientes tags están configurados en `swagger.config.js`:

1. **Autenticación** - Login, logout, tokens
2. **Pacientes** - CRUD pacientes
3. **Empleados** - Gestión personal
4. **Usuarios** - Administración usuarios
5. **Hospitalización** - Ingresos, altas, notas
6. **Quirófanos** - Quirófanos y cirugías
7. **Habitaciones** - Gestión habitaciones
8. **Consultorios** - Consultorios médicos
9. **Inventario** - Productos, proveedores
10. **POS** - Punto de venta
11. **Facturación** - Facturas y pagos
12. **Reportes** - Reportes financieros
13. **Auditoría** - Trazabilidad
14. **Solicitudes** - Solicitudes internas
15. **Notificaciones** - Sistema notificaciones

---

## Responses Reutilizables

Ya configurados en `swagger.config.js`, úsalos con `$ref`:

```javascript
responses:
  401:
    $ref: '#/components/responses/UnauthorizedError'
  403:
    $ref: '#/components/responses/ForbiddenError'
  404:
    $ref: '#/components/responses/NotFoundError'
  400:
    $ref: '#/components/responses/ValidationError'
  500:
    $ref: '#/components/responses/ServerError'
```

---

## Schemas Reutilizables

```javascript
// Paginación
pagination:
  $ref: '#/components/schemas/PaginationInfo'

// Error genérico
error:
  $ref: '#/components/schemas/Error'

// Success genérico
success:
  $ref: '#/components/schemas/SuccessResponse'
```

---

## Workflow Recomendado

1. **Abrir Swagger UI** en http://localhost:3001/api-docs
2. **Agregar documentación** a un archivo de rutas (ej: `patients.routes.js`)
3. **Reiniciar servidor** (`npm run dev`)
4. **Refrescar Swagger UI** - La documentación aparece automáticamente
5. **Probar endpoint** directamente desde Swagger UI

---

## Tips y Best Practices

### ✅ DO

- Usa `$ref` para responses comunes (evita duplicación)
- Incluye ejemplos realistas en schemas
- Documenta parámetros opcionales con `required: false`
- Especifica formatos (`format: date`, `format: email`)
- Agrupa endpoints por tag lógico

### ❌ DON'T

- No documentes endpoints internos/debug
- No expongas información sensible en ejemplos
- No uses tipos genéricos (`object`) sin propiedades
- No olvides `security: [{ bearerAuth: [] }]` en endpoints protegidos

---

## Testing de Endpoints desde Swagger

1. Click en endpoint → "Try it out"
2. Para endpoints protegidos:
   - Click "Authorize" (🔒 arriba a la derecha)
   - Ingresa: `Bearer {tu_token}`
   - Click "Authorize"
3. Llena parámetros
4. Click "Execute"
5. Ve respuesta en tiempo real

---

## Ejemplo Completo: Módulo Pacientes

Ver `routes/auth.routes.js` líneas 21-112 para ejemplo completo de documentación del endpoint `/api/auth/login`.

Copia ese patrón y adapta:
- Cambia tag
- Cambia path
- Cambia requestBody/parameters según tu endpoint
- Cambia responses según tu lógica

---

## Expansión Futura

### Prioridad Alta (15-20 endpoints):

- [ ] `GET /api/patients` - Listar pacientes
- [ ] `POST /api/patients` - Crear paciente
- [ ] `GET /api/employees` - Listar empleados
- [ ] `POST /api/inventory/products` - Crear producto
- [ ] `GET /api/quirofanos` - Listar quirófanos
- [ ] `POST /api/quirofanos/cirugias` - Programar cirugía
- [ ] `GET /api/hospitalization/admissions` - Listar ingresos
- [ ] `POST /api/billing/invoices` - Crear factura
- [ ] `GET /api/reports/financial` - Reporte financiero

### Prioridad Media (30-40 endpoints):

- Completar CRUD de módulos principales
- Endpoints de estadísticas
- Endpoints de búsqueda avanzada

### Prioridad Baja (60-70 endpoints):

- Endpoints administrativos
- Endpoints de configuración
- Endpoints de mantenimiento

---

## Recursos

- **Swagger UI:** http://localhost:3001/api-docs
- **Swagger JSON:** http://localhost:3001/api-docs.json
- **OpenAPI 3.0 Spec:** https://swagger.io/specification/
- **Swagger JSDoc:** https://github.com/Surnet/swagger-jsdoc

---

**Documentación creada:** 3 de noviembre de 2025
**Sprint 1 completado** - Sistema backend alcanza **9.0/10** ⭐⭐

**Próximos pasos:** Expandir documentación de endpoints restantes siguiendo esta guía.
