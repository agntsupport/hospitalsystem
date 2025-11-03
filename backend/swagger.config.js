const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión Hospitalaria Integral - API',
      version: '2.0.0',
      description: `
# API del Sistema de Gestión Hospitalaria

Desarrollado por **Alfredo Manuel Reyes**
**Empresa:** AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
**Teléfono:** 443 104 7479

## Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación.

Para acceder a endpoints protegidos:
1. Obtén un token en \`POST /api/auth/login\`
2. Incluye el token en el header: \`Authorization: Bearer {token}\`

## Roles de Usuario

- **administrador**: Acceso completo al sistema
- **cajero**: POS, pacientes, habitaciones, crear ingresos hospitalarios
- **enfermero**: Pacientes, hospitalización (consulta), notas médicas, altas
- **almacenista**: Inventario completo, consulta general
- **medico_residente**: Pacientes, habitaciones, crear ingresos, notas médicas
- **medico_especialista**: Pacientes, habitaciones, crear ingresos, notas médicas, reportes
- **socio**: Reportes financieros (solo lectura)

## Respuestas

Todas las respuestas siguen el formato:
\`\`\`json
{
  "success": true|false,
  "data": { ... },
  "message": "Mensaje descriptivo"
}
\`\`\`

## Paginación

Endpoints con listados soportan paginación:
- \`page\`: Número de página (default: 1)
- \`limit\`: Items por página (default: 10)
- \`search\`: Búsqueda global (opcional)
      `,
      contact: {
        name: 'Alfredo Manuel Reyes',
        email: 'alfredo@agnt.dev',
        url: 'https://agnt.dev',
        'x-phone': '443 104 7479'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://api.hospital.agnt.dev',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error descriptivo'
            },
            error: {
              type: 'string',
              description: 'Detalles técnicos del error (solo en desarrollo)'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total de registros'
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas'
            },
            currentPage: {
              type: 'integer',
              description: 'Página actual'
            },
            limit: {
              type: 'integer',
              description: 'Items por página'
            },
            offset: {
              type: 'integer',
              description: 'Offset de la consulta'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token no proporcionado o inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Token no proporcionado'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Usuario no tiene permisos para esta acción',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'No tienes permisos para realizar esta acción'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Recurso no encontrado'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación de datos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Datos inválidos',
                errors: ['Campo requerido: nombre']
              }
            }
          }
        },
        ServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Error interno del servidor'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints de autenticación y gestión de sesiones'
      },
      {
        name: 'Pacientes',
        description: 'Gestión de pacientes y expedientes'
      },
      {
        name: 'Empleados',
        description: 'Gestión de empleados (médicos, enfermeros, administrativos)'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema'
      },
      {
        name: 'Hospitalización',
        description: 'Ingresos, altas y notas médicas'
      },
      {
        name: 'Quirófanos',
        description: 'Gestión de quirófanos y cirugías programadas'
      },
      {
        name: 'Habitaciones',
        description: 'Gestión de habitaciones y ocupación'
      },
      {
        name: 'Consultorios',
        description: 'Gestión de consultorios médicos'
      },
      {
        name: 'Inventario',
        description: 'Productos, proveedores y movimientos de inventario'
      },
      {
        name: 'POS',
        description: 'Punto de venta y ventas rápidas'
      },
      {
        name: 'Facturación',
        description: 'Facturas, pagos y cuentas por cobrar'
      },
      {
        name: 'Reportes',
        description: 'Reportes financieros y operativos'
      },
      {
        name: 'Auditoría',
        description: 'Trazabilidad de operaciones del sistema'
      },
      {
        name: 'Solicitudes',
        description: 'Sistema de solicitudes internas de productos'
      },
      {
        name: 'Notificaciones',
        description: 'Notificaciones del sistema'
      }
    ]
  },
  apis: ['./routes/*.js', './routes/swagger-docs.js', './server-modular.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
