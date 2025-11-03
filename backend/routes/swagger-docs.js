/**
 * DOCUMENTACIÓN SWAGGER ADICIONAL
 *
 * Este archivo contiene documentación OpenAPI adicional para endpoints principales
 * que complementa la documentación inline en los archivos de rutas.
 *
 * Sprint 1 - Backend 9.0/10
 */

/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags:
 *       - Empleados
 *     summary: Listar empleados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipoEmpleado
 *         schema:
 *           type: string
 *           enum: [doctor, enfermero, administrativo, otro]
 *     responses:
 *       200:
 *         description: Lista de empleados
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Empleados
 *     summary: Crear empleado
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
 *               - tipoEmpleado
 *             properties:
 *               nombre:
 *                 type: string
 *               tipoEmpleado:
 *                 type: string
 *                 enum: [doctor, enfermero, administrativo, otro]
 *               cedula:
 *                 type: string
 *               especialidad:
 *                 type: string
 *     responses:
 *       201:
 *         description: Empleado creado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/inventory/products:
 *   get:
 *     tags:
 *       - Inventario
 *     summary: Listar productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de productos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Inventario
 *     summary: Crear producto
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
 *               - codigo
 *               - categoria
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               categoria:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Producto creado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/quirofanos:
 *   get:
 *     tags:
 *       - Quirófanos
 *     summary: Listar quirófanos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: disponible
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de quirófanos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Quirófanos
 *     summary: Crear quirófano
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - nombre
 *             properties:
 *               numero:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Quirófano creado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/quirofanos/cirugias:
 *   get:
 *     tags:
 *       - Quirófanos
 *     summary: Listar cirugías programadas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [programada, en_proceso, completada, cancelada]
 *     responses:
 *       200:
 *         description: Lista de cirugías
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Quirófanos
 *     summary: Programar cirugía
 *     description: |
 *       Programa una nueva cirugía con cargos automáticos a la cuenta del paciente.
 *
 *       **Funcionalidades:**
 *       - Validación de disponibilidad de quirófano
 *       - Cargos automáticos según tarifas configuradas
 *       - Integración con cuenta del paciente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quirofanoId
 *               - pacienteId
 *               - medicoId
 *               - fechaHora
 *               - tipoCirugia
 *             properties:
 *               quirofanoId:
 *                 type: integer
 *               pacienteId:
 *                 type: integer
 *               medicoId:
 *                 type: integer
 *               fechaHora:
 *                 type: string
 *                 format: date-time
 *               tipoCirugia:
 *                 type: string
 *               duracionEstimada:
 *                 type: integer
 *                 description: Duración en minutos
 *     responses:
 *       201:
 *         description: Cirugía programada exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/hospitalization/admissions:
 *   get:
 *     tags:
 *       - Hospitalización
 *     summary: Listar ingresos hospitalarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activa, finalizada]
 *       - in: query
 *         name: pacienteId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de ingresos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Hospitalización
 *     summary: Crear ingreso hospitalario
 *     description: |
 *       Crea un nuevo ingreso hospitalario con anticipo automático de $10,000 MXN.
 *
 *       **FASE 5 - Implementación:**
 *       - Anticipo automático de $10,000 MXN
 *       - Creación automática de cuenta del paciente
 *       - Asignación de habitación
 *       - Cargo automático del anticipo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pacienteId
 *               - habitacionId
 *               - medicoEspecialistaId
 *               - motivoHospitalizacion
 *             properties:
 *               pacienteId:
 *                 type: integer
 *               habitacionId:
 *                 type: integer
 *               medicoEspecialistaId:
 *                 type: integer
 *               motivoHospitalizacion:
 *                 type: string
 *               diagnosticoIngreso:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ingreso creado con anticipo de $10,000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags:
 *       - Habitaciones
 *     summary: Listar habitaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: disponible
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: piso
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de habitaciones
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Habitaciones
 *     summary: Crear habitación
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - tipo
 *             properties:
 *               numero:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [individual, doble, suite]
 *               piso:
 *                 type: integer
 *               precioNoche:
 *                 type: number
 *     responses:
 *       201:
 *         description: Habitación creada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/billing/invoices:
 *   get:
 *     tags:
 *       - Facturación
 *     summary: Listar facturas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, pagada, cancelada]
 *     responses:
 *       200:
 *         description: Lista de facturas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - Facturación
 *     summary: Crear factura
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cuentaPacienteId
 *             properties:
 *               cuentaPacienteId:
 *                 type: integer
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Factura creada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/pos:
 *   post:
 *     tags:
 *       - POS
 *     summary: Crear venta rápida
 *     description: Registra una venta en el punto de venta con descuento automático de inventario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productoId:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *               descuento:
 *                 type: number
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia]
 *     responses:
 *       201:
 *         description: Venta registrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Listar usuarios del sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [administrador, cajero, enfermero, almacenista, medico_residente, medico_especialista, socio]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Crear usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - rol
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [administrador, cajero, enfermero, almacenista, medico_residente, medico_especialista, socio]
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reports/financial:
 *   get:
 *     tags:
 *       - Reportes
 *     summary: Reporte financiero
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte financiero generado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     tags:
 *       - Auditoría
 *     summary: Consultar registros de auditoría
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modulo
 *         schema:
 *           type: string
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Registros de auditoría
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

module.exports = {}; // Export vacío, solo contiene documentación
