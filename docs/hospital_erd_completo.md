# Diagrama Entidad-Relación Completo - Sistema de Gestión Hospitalaria

## Entidades Principales

### 1. USUARIOS
```sql
usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    rol ENUM('cajero', 'enfermero', 'almacenista', 'administrador', 'socio') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 2. PACIENTES
```sql
pacientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'Otro') NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion TEXT,
    curp VARCHAR(18) UNIQUE,
    nss VARCHAR(11),
    es_menor_edad BOOLEAN DEFAULT FALSE,
    responsable_id INT REFERENCES responsables(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 3. RESPONSABLES (para menores de edad)
```sql
responsables (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    telefono VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    parentesco VARCHAR(50) NOT NULL,
    identificacion VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 4. EMPLEADOS
```sql
empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    tipo_empleado ENUM('enfermero', 'medico_residente', 'medico_especialista') NOT NULL,
    cedula_profesional VARCHAR(20),
    especialidad VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(100),
    salario DECIMAL(10,2),
    fecha_ingreso DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 5. HABITACIONES
```sql
habitaciones (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    tipo ENUM('individual', 'doble', 'suite', 'terapia_intensiva') NOT NULL,
    precio_por_dia DECIMAL(8,2) NOT NULL,
    estado ENUM('disponible', 'ocupada', 'mantenimiento') DEFAULT 'disponible',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 6. CONSULTORIOS
```sql
consultorios (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    especialidad VARCHAR(100),
    estado ENUM('disponible', 'ocupado', 'mantenimiento') DEFAULT 'disponible',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 7. PROVEEDORES
```sql
proveedores (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(150) NOT NULL,
    contacto_nombre VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion TEXT,
    rfc VARCHAR(13),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 8. PRODUCTOS
```sql
productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria ENUM('medicamento', 'material_medico', 'insumo') NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    precio_compra DECIMAL(8,2),
    precio_venta DECIMAL(8,2) NOT NULL,
    stock_minimo INT DEFAULT 10,
    stock_actual INT DEFAULT 0,
    proveedor_id INT REFERENCES proveedores(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 9. SERVICIOS
```sql
servicios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo ENUM('consulta_general', 'consulta_especialidad', 'urgencia', 'curacion', 'hospitalizacion') NOT NULL,
    precio DECIMAL(8,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 10. CUENTAS_PACIENTES
```sql
cuentas_pacientes (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id),
    tipo_atencion ENUM('consulta_general', 'urgencia', 'hospitalizacion') NOT NULL,
    estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
    anticipo DECIMAL(10,2) DEFAULT 0,
    total_servicios DECIMAL(10,2) DEFAULT 0,
    total_productos DECIMAL(10,2) DEFAULT 0,
    total_cuenta DECIMAL(10,2) DEFAULT 0,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0,
    habitacion_id INT REFERENCES habitaciones(id),
    medico_tratante_id INT REFERENCES empleados(id),
    cajero_apertura_id INT NOT NULL REFERENCES usuarios(id),
    cajero_cierre_id INT REFERENCES usuarios(id),
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    observaciones TEXT
)
```

## NUEVAS ENTIDADES PARA HOSPITALIZACIÓN COLABORATIVA

### 11. HOSPITALIZACIONES
```sql
hospitalizaciones (
    id SERIAL PRIMARY KEY,
    cuenta_paciente_id INT NOT NULL REFERENCES cuentas_pacientes(id),
    habitacion_id INT NOT NULL REFERENCES habitaciones(id),
    medico_especialista_id INT NOT NULL REFERENCES empleados(id),
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_alta TIMESTAMP,
    motivo_hospitalizacion TEXT NOT NULL,
    diagnostico_ingreso TEXT NOT NULL,
    diagnostico_alta TEXT,
    estado ENUM('en_observacion', 'estable', 'critico', 'alta_medica', 'alta_voluntaria') DEFAULT 'en_observacion',
    indicaciones_generales TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 12. ORDENES_MEDICAS
```sql
ordenes_medicas (
    id SERIAL PRIMARY KEY,
    hospitalizacion_id INT NOT NULL REFERENCES hospitalizaciones(id),
    medico_id INT NOT NULL REFERENCES empleados(id),
    tipo_orden ENUM('medicamento', 'procedimiento', 'dieta', 'cuidados', 'laboratorio', 'interconsulta') NOT NULL,
    descripcion TEXT NOT NULL,
    frecuencia VARCHAR(100), -- Ej: "Cada 8 horas", "Una vez al día"
    duracion VARCHAR(100), -- Ej: "7 días", "Hasta nuevo aviso"
    prioridad ENUM('rutina', 'urgente', 'inmediata') DEFAULT 'rutina',
    estado ENUM('activa', 'completada', 'suspendida', 'cancelada') DEFAULT 'activa',
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 13. NOTAS_HOSPITALIZACION
```sql
notas_hospitalizacion (
    id SERIAL PRIMARY KEY,
    hospitalizacion_id INT NOT NULL REFERENCES hospitalizaciones(id),
    empleado_id INT NOT NULL REFERENCES empleados(id),
    tipo_nota ENUM('evolucion_medica', 'nota_enfermeria', 'interconsulta', 'procedimiento') NOT NULL,
    turno ENUM('matutino', 'vespertino', 'nocturno') NOT NULL,
    fecha_nota TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Signos vitales
    temperatura DECIMAL(4,2),
    presion_sistolica INT,
    presion_diastolica INT,
    frecuencia_cardiaca INT,
    frecuencia_respiratoria INT,
    saturacion_oxigeno INT,
    
    -- Evaluación
    estado_general TEXT,
    sintomas TEXT,
    examen_fisico TEXT,
    plan_tratamiento TEXT,
    observaciones TEXT,
    
    -- Referencias a órdenes relacionadas
    orden_medica_id INT REFERENCES ordenes_medicas(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 14. APLICACION_MEDICAMENTOS
```sql
aplicacion_medicamentos (
    id SERIAL PRIMARY KEY,
    orden_medica_id INT NOT NULL REFERENCES ordenes_medicas(id),
    enfermero_id INT NOT NULL REFERENCES empleados(id),
    producto_id INT REFERENCES productos(id),
    dosis_aplicada VARCHAR(100) NOT NULL,
    via_administracion ENUM('oral', 'intravenosa', 'intramuscular', 'subcutanea', 'topica', 'inhalatoria') NOT NULL,
    fecha_aplicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reaccion_adversa TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 15. SEGUIMIENTO_ORDENES
```sql
seguimiento_ordenes (
    id SERIAL PRIMARY KEY,
    orden_medica_id INT NOT NULL REFERENCES ordenes_medicas(id),
    empleado_id INT NOT NULL REFERENCES empleados(id),
    fecha_seguimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_anterior ENUM('activa', 'completada', 'suspendida', 'cancelada'),
    estado_nuevo ENUM('activa', 'completada', 'suspendida', 'cancelada'),
    motivo_cambio TEXT,
    observaciones TEXT
)
```

### ENTIDADES EXISTENTES ACTUALIZADAS

### 16. TRANSACCIONES_CUENTA
```sql
transacciones_cuenta (
    id SERIAL PRIMARY KEY,
    cuenta_id INT NOT NULL REFERENCES cuentas_pacientes(id),
    tipo ENUM('servicio', 'producto', 'anticipo', 'pago', 'medicamento_hospitalizado') NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    cantidad INT DEFAULT 1,
    precio_unitario DECIMAL(8,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    servicio_id INT REFERENCES servicios(id),
    producto_id INT REFERENCES productos(id),
    aplicacion_medicamento_id INT REFERENCES aplicacion_medicamentos(id),
    empleado_cargo_id INT REFERENCES usuarios(id),
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
)
```

### 17. CITAS_MEDICAS
```sql
citas_medicas (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id),
    medico_id INT NOT NULL REFERENCES empleados(id),
    consultorio_id INT REFERENCES consultorios(id),
    fecha_cita DATETIME NOT NULL,
    tipo_cita ENUM('consulta_general', 'seguimiento', 'urgencia', 'control_post_hospitalizacion') NOT NULL,
    estado ENUM('programada', 'confirmada', 'completada', 'cancelada') DEFAULT 'programada',
    motivo TEXT,
    observaciones TEXT,
    hospitalizacion_relacionada_id INT REFERENCES hospitalizaciones(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 18. HISTORIALES_MEDICOS
```sql
historiales_medicos (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id),
    medico_id INT NOT NULL REFERENCES empleados(id),
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_consulta ENUM('ambulatoria', 'urgencia', 'hospitalizacion') NOT NULL,
    motivo_consulta TEXT NOT NULL,
    sintomas TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    medicamentos_recetados TEXT,
    observaciones TEXT,
    proxima_cita DATE,
    hospitalizacion_id INT REFERENCES hospitalizaciones(id)
)
```

### 19. MOVIMIENTOS_INVENTARIO
```sql
movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'aplicacion_paciente') NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(8,2),
    motivo VARCHAR(200) NOT NULL,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    cuenta_paciente_id INT REFERENCES cuentas_pacientes(id),
    aplicacion_medicamento_id INT REFERENCES aplicacion_medicamentos(id),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
)
```

## Relaciones Principales del Módulo de Hospitalización

### Flujo de Hospitalización Colaborativa:
1. **Paciente ingresa** → Se crea `hospitalizaciones`
2. **Especialista deja órdenes** → Se crean `ordenes_medicas`
3. **Enfermeros/Residentes ejecutan** → Se crean `aplicacion_medicamentos` y `seguimiento_ordenes`
4. **Todos documentan evolución** → Se crean `notas_hospitalizacion`
5. **Movimientos de inventario** → Se actualizan automáticamente

### Relaciones Nuevas:
- **hospitalizaciones** ← **ordenes_medicas** (1:N)
- **ordenes_medicas** ← **aplicacion_medicamentos** (1:N)
- **ordenes_medicas** ← **seguimiento_ordenes** (1:N)
- **hospitalizaciones** ← **notas_hospitalizacion** (1:N)
- **empleados** ← **notas_hospitalizacion** (1:N)
- **aplicacion_medicamentos** ← **transacciones_cuenta** (1:1)
- **aplicacion_medicamentos** ← **movimientos_inventario** (1:1)

## Índices Adicionales para Hospitalización
```sql
-- Índices para el módulo de hospitalización
CREATE INDEX idx_hospitalizaciones_paciente ON hospitalizaciones(cuenta_paciente_id);
CREATE INDEX idx_hospitalizaciones_estado ON hospitalizaciones(estado);
CREATE INDEX idx_ordenes_hospitalizacion ON ordenes_medicas(hospitalizacion_id);
CREATE INDEX idx_ordenes_estado ON ordenes_medicas(estado);
CREATE INDEX idx_notas_hospitalizacion ON notas_hospitalizacion(hospitalizacion_id);
CREATE INDEX idx_notas_fecha ON notas_hospitalizacion(fecha_nota);
CREATE INDEX idx_aplicaciones_orden ON aplicacion_medicamentos(orden_medica_id);
CREATE INDEX idx_aplicaciones_fecha ON aplicacion_medicamentos(fecha_aplicacion);
```

## Flujo de Trabajo para Hospitalización

### 1. Ingreso del Paciente:
- Se crea registro en `hospitalizaciones`
- Se asigna habitación y médico especialista
- Estado inicial: "en_observacion"

### 2. Órdenes del Especialista:
- Crea `ordenes_medicas` con indicaciones específicas
- Define frecuencia, duración y prioridad
- Pueden ser medicamentos, procedimientos, dietas, etc.

### 3. Ejecución por Enfermeros/Residentes:
- Registran en `aplicacion_medicamentos` cuando aplican tratamientos
- Crean `seguimiento_ordenes` para cambios de estado
- Documentan en `notas_hospitalizacion` la evolución

### 4. Seguimiento Colaborativo:
- Todos los empleados pueden agregar `notas_hospitalizacion`
- Se mantiene historial completo de signos vitales
- Trazabilidad completa de quién hizo qué y cuándo

### 5. Control de Inventario Automático:
- Cada aplicación de medicamento genera movimiento de inventario
- Se cobra automáticamente a la cuenta del paciente
- Control de stock en tiempo real

Este diseño permite el seguimiento colaborativo completo durante la hospitalización, manteniendo la trazabilidad y el control financiero.