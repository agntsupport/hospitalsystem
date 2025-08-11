# Sistema de Roles y Permisos - Hospital Management System

## Definición de Roles

### 1. CAJERO
**Función principal**: Manejo de cuentas y facturación
- Abre y cierra cuentas de pacientes
- Procesa pagos y anticipos
- Genera facturas y recibos
- Consulta el estado financiero de pacientes

### 2. ENFERMERO
**Función principal**: Aplicación de tratamientos y carga de materiales
- Registra consumo de medicamentos y materiales
- Aplica medicamentos según órdenes médicas
- Actualiza notas de evolución de pacientes hospitalizados
- Registra signos vitales

### 3. ALMACENISTA
**Función principal**: Gestión de inventario y proveedores
- CRUD completo de proveedores
- CRUD completo de productos y medicamentos
- CRUD completo de servicios
- Controla entrada y salida de inventario
- Genera reportes de stock

### 4. ADMINISTRADOR
**Función principal**: Gestión completa del sistema
- Todas las funciones de cajero, enfermero y almacenista
- CRUD de habitaciones y consultorios
- CRUD de médicos y empleados
- Configuración del sistema
- Acceso completo a todos los módulos

### 5. SOCIO
**Función principal**: Supervisión y análisis de negocio
- Solo acceso de **LECTURA** al módulo de reportes
- Consulta reportes financieros y operativos
- No puede modificar ningún dato del sistema

## Matriz de Permisos por Módulo

### Módulo CRM (Pacientes)
| Rol | Crear | Leer | Actualizar | Eliminar |
|-----|-------|------|------------|----------|
| Cajero | ✅ | ✅ | ✅ | ❌ |
| Enfermero | ❌ | ✅ | ❌ | ❌ |
| Almacenista | ❌ | ✅ | ❌ | ❌ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

### Módulo Empleados
| Rol | Crear | Leer | Actualizar | Eliminar |
|-----|-------|------|------------|----------|
| Cajero | ❌ | ✅ | ❌ | ❌ |
| Enfermero | ❌ | ✅ | ❌ | ❌ |
| Almacenista | ❌ | ✅ | ❌ | ❌ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

### Módulo Habitaciones y Consultorios
| Rol | Crear | Leer | Actualizar | Eliminar |
|-----|-------|------|------------|----------|
| Cajero | ❌ | ✅ | ❌ | ❌ |
| Enfermero | ❌ | ✅ | ❌ | ❌ |
| Almacenista | ❌ | ✅ | ❌ | ❌ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

### Módulo Inventario (Proveedores, Productos, Servicios)
| Rol | Crear | Leer | Actualizar | Eliminar |
|-----|-------|------|------------|----------|
| Cajero | ❌ | ✅ | ❌ | ❌ |
| Enfermero | ❌ | ✅ | ❌ | ❌ |
| Almacenista | ✅ | ✅ | ✅ | ✅ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

### Módulo POS (Punto de Venta)
| Rol | Abrir Cuenta | Cerrar Cuenta | Procesar Pago | Consultar |
|-----|--------------|---------------|---------------|-----------|
| Cajero | ✅ | ✅ | ✅ | ✅ |
| Enfermero | ❌ | ❌ | ❌ | ✅ |
| Almacenista | ❌ | ❌ | ❌ | ✅ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

### Módulo Cuentas Abiertas
| Rol | Agregar Cargo | Ver Cuenta | Modificar | Cerrar |
|-----|---------------|------------|-----------|--------|
| Cajero | ❌ | ✅ | ❌ | ✅ |
| Enfermero | ✅ | ✅ | ❌ | ❌ |
| Almacenista | ❌ | ✅ | ❌ | ❌ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

### Módulo Hospitalización
| Rol | Crear Órdenes | Aplicar Medicamentos | Notas Evolución | Ver Historial |
|-----|---------------|---------------------|-----------------|---------------|
| Cajero | ❌ | ❌ | ❌ | ✅ |
| Enfermero | ❌ | ✅ | ✅ | ✅ |
| Almacenista | ❌ | ❌ | ❌ | ✅ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ❌ | ❌ | ❌ | ❌ |

**Nota**: Solo médicos especialistas pueden crear órdenes médicas, pero esto se controla por el campo `tipo_empleado` en la tabla empleados.

### Módulo Reportes
| Rol | Cortes Diarios | Cortes Mensuales | Reportes Pacientes | Reportes Habitaciones |
|-----|----------------|------------------|-------------------|---------------------|
| Cajero | ✅ | ❌ | ✅ | ✅ |
| Enfermero | ❌ | ❌ | ❌ | ✅ |
| Almacenista | ✅ | ❌ | ❌ | ✅ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
| Socio | ✅ | ✅ | ✅ | ✅ |

## Permisos Especiales por Tipo de Empleado

### Médicos Especialistas (tipo_empleado = 'medico_especialista')
- Crear y modificar órdenes médicas
- Crear notas de evolución médica
- Dar altas médicas
- Crear diagnósticos y tratamientos

### Médicos Residentes (tipo_empleado = 'medico_residente')
- Crear notas de evolución médica (supervisadas)
- Consultar órdenes médicas
- No pueden dar altas ni crear órdenes principales

### Enfermeros (tipo_empleado = 'enfermero')
- Aplicar medicamentos según órdenes
- Crear notas de enfermería
- Registrar signos vitales
- Cargar materiales a cuentas de pacientes

## Validaciones de Seguridad

### Validaciones por Rol:
1. **Cajero**: Solo puede cerrar cuentas que él mismo abrió (salvo administrador)
2. **Enfermero**: Solo puede cargar materiales a cuentas abiertas y activas
3. **Almacenista**: Solo puede modificar inventario con justificación
4. **Administrador**: Acceso completo pero con log de auditoría
5. **Socio**: Solo lectura, sin capacidad de exportar datos sensibles

### Validaciones por Horario:
- Enfermeros: Registro por turnos (matutino, vespertino, nocturno)
- Cajeros: Solo en horario de caja (definido por administrador)
- Reportes sensibles: Solo accesibles en horario administrativo

### Validaciones de Estado:
- No se pueden modificar cuentas cerradas
- No se pueden aplicar medicamentos sin orden médica activa
- No se pueden crear cargos en cuentas con saldo negativo excesivo

## Implementación Técnica

### Middleware de Autorización:
```javascript
// Ejemplo de middleware para verificar permisos
function checkPermission(module, action) {
  return (req, res, next) => {
    const userRole = req.user.rol;
    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions[module] && permissions[module][action]) {
      next();
    } else {
      res.status(403).json({ error: 'Acceso denegado' });
    }
  };
}
```

### Log de Auditoría:
Todas las acciones críticas se registran con:
- Usuario que ejecuta
- Fecha y hora
- Acción realizada
- Datos modificados (antes/después)
- IP de origen

### Sesiones Seguras:
- JWT con expiración de 8 horas
- Renovación automática cada 2 horas
- Logout automático por inactividad (30 min)
- Un usuario por sesión activa