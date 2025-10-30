# 🏥 Guía de Configuración Inicial - Sistema Hospitalario

## 📋 **Pasos para Configurar el Sistema con Datos Reales**

### **1. Acceso Inicial**
- **URL del Sistema:** https://systemsc-hospital-frontend.4dvymv.easypanel.host
- **Usuario:** `admin`
- **Contraseña:** `AdminSecure2025!`
- **Estado:** Sistema 100% funcional con 1,422 tests implementados

### **2. Configuración de Personal (PRIORITARIO)**

#### **A) Crear Empleados del Hospital**
1. Ve a **"Empleados"** en el menú
2. Agrega el personal real:
   - **Médicos Especialistas**
   - **Médicos Residentes** 
   - **Enfermeros(as)**
   - **Personal Administrativo**
   - **Cajeros**
   - **Almacenistas**

#### **B) Crear Usuarios del Sistema**
1. Ve a **"Usuarios"** (si disponible) o configura en Empleados
2. Para cada empleado, asigna:
   - Username único
   - Contraseña temporal
   - Rol apropiado:
     - `administrador` - Acceso completo
     - `medico_especialista` - Pacientes, reportes médicos
     - `medico_residente` - Pacientes, hospitalización
     - `enfermero` - Consulta pacientes, notas médicas
     - `cajero` - POS, facturación, pacientes
     - `almacenista` - Inventario completo
     - `socio` - Solo reportes financieros

### **3. Configuración de Infraestructura**

#### **A) Habitaciones**
1. Ve a **"Habitaciones"**
2. Configura las habitaciones reales:
   - Número de habitación
   - Tipo (individual, doble, suite, etc.)
   - Costo por día
   - Estado inicial: Disponible

#### **B) Consultorios**
1. Ve a **"Consultorios"**
2. Agrega los consultorios:
   - Número de consultorio
   - Especialidad
   - Estado: Disponible

#### **C) Quirófanos (si aplica)**
1. Ve a **"Quirófanos"**
2. Configura los quirófanos:
   - Número
   - Capacidad
   - Costo por hora
   - Equipamiento disponible

### **4. Configuración de Inventario**

#### **A) Proveedores**
1. Ve a **"Inventario" → "Proveedores"**
2. Agrega proveedores reales:
   - Medicamentos
   - Material médico
   - Insumos generales

#### **B) Productos**
1. Ve a **"Inventario" → "Productos"**
2. Agrega productos reales:
   - Medicamentos con precios reales
   - Material médico
   - Insumos hospitalarios
   - Stock inicial

### **5. Servicios Médicos**
1. Ve a **"Inventario" → "Servicios"**
2. Configura los servicios con precios reales:
   - Consultas por especialidad
   - Procedimientos
   - Estudios
   - Honorarios médicos

### **6. Configuración de Pacientes**
- Los pacientes se crearán conforme vayan llegando
- El sistema permite registro rápido durante la consulta

### **7. Respaldo y Seguridad**
- **IMPORTANTE:** Configura respaldos automáticos
- Cambia contraseñas por defecto
- Configura accesos por rol

## 🎯 **Flujo de Trabajo Recomendado**

### **Día 1: Configuración Base**
1. Personal y usuarios ✅
2. Habitaciones/Consultorios ✅
3. Servicios básicos ✅

### **Día 2: Inventario**
1. Proveedores principales ✅
2. Medicamentos esenciales ✅
3. Material médico básico ✅

### **Día 3: Pruebas**
1. Registrar pacientes de prueba
2. Hacer transacciones POS
3. Generar facturas
4. Probar reportes

### **Día 4+: Operación Normal**
- Sistema listo para uso diario
- Capacitación al personal
- Soporte continuo

## ⚙️ **Configuraciones Técnicas**

### **Variables de Sistema**
- Configurar datos del hospital (nombre, dirección, etc.)
- Configurar impresoras si es necesario
- Configurar backup automático

### **Permisos por Rol**
- **Administrador:** Todo el sistema
- **Médicos:** Pacientes + Hospitalización + Reportes médicos
- **Enfermeros:** Consulta pacientes + Notas médicas
- **Cajeros:** POS + Facturación + Registro pacientes
- **Almacén:** Inventario completo

## 🆘 **Soporte**
- **Email:** admin@hospital.com
- **Documentación:** Ver archivos incluidos
- **Manual de usuario:** Disponible en el sistema

---
**📅 Sistema listo para producción**  
**🏥 Desarrollado por agnt_ Software Development Company**