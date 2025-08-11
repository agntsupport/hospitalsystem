# 📋 PLAN DE IMPLEMENTACIÓN - REQUERIMIENTOS EJECUTIVOS DEL HOSPITAL

## 📊 ANÁLISIS DE REQUERIMIENTOS

### 1. TRAZABILIDAD DE OPERACIONES 🔍
**Impacto**: ALTO | **Complejidad**: ALTA | **Prioridad**: CRÍTICA

#### Operaciones a Auditar:
- ✅ Ingreso de pacientes (cajero responsable)
- ✅ Carga de productos/servicios a cuenta
- ✅ Cancelaciones y eliminaciones (con motivo)
- ✅ Cobros de cuenta (cajero responsable)
- ✅ Altas médicas (médico responsable)
- ✅ Cierre de cuentas (usuario responsable)
- ✅ Descuentos aplicados (solo administrador)
- ✅ **Movimientos de inventario** (usuario, motivo, afectación)
- ✅ **Transacciones POS** (cajero, items, modificaciones)
- ✅ **Operaciones de hospitalización** (admisiones, altas, notas)

### 2. REPORTES CRÍTICOS 📈
**Impacto**: ALTO | **Complejidad**: ALTA | **Prioridad**: CRÍTICA

#### Reportes Operativos:
- Lista de ocupación (habitaciones, quirófanos, consultorios)
- Cuentas abiertas en tiempo real
- Ingresos facturados vs no facturados (solo admin)
- Rendimiento por médico (MXN)
- Análisis de productos y proveedores (MXN)
- Margen de utilidades por paciente/médico

#### Reportes Financieros:
- Inventario: costo vs precio público
- Costos indirectos consolidados
- Ingresos por hospitalización vs ambulatorio

### 3. NUEVOS CATÁLOGOS 📁
**Impacto**: MEDIO | **Complejidad**: BAJA | **Prioridad**: ALTA

- **Catálogo de Causas de Cancelación**
- **Catálogo de Costos Indirectos**

### 4. GESTIÓN DE USUARIOS 👥
**Impacto**: MEDIO | **Complejidad**: BAJA | **Prioridad**: MEDIA

---

## 🚀 PLAN DE IMPLEMENTACIÓN POR FASES

### **FASE 1: INFRAESTRUCTURA DE AUDITORÍA Y TRAZABILIDAD** (1 semana)
**Objetivo**: Trazabilidad completa en TODOS los módulos críticos

#### 1.1 Base de Datos - Sistema de Auditoría Universal
```sql
-- Tabla principal de auditoría
CREATE TABLE auditoria_operaciones (
  id SERIAL PRIMARY KEY,
  modulo VARCHAR(50) NOT NULL, -- 'inventario', 'pos', 'hospitalizacion', 'facturacion'
  tipo_operacion VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50) NOT NULL,
  entidad_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  usuario_nombre VARCHAR(100) NOT NULL,
  rol_usuario VARCHAR(50) NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  motivo TEXT,
  causa_cancelacion_id INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX idx_audit_modulo ON auditoria_operaciones(modulo);
CREATE INDEX idx_audit_usuario ON auditoria_operaciones(usuario_id);
CREATE INDEX idx_audit_fecha ON auditoria_operaciones(created_at);
CREATE INDEX idx_audit_entidad ON auditoria_operaciones(entidad_tipo, entidad_id);
```

#### 1.2 Integración en Módulos Existentes

##### **INVENTARIO - Trazabilidad Completa**
```typescript
// MovimientoInventario extendido
interface MovimientoInventarioAuditado {
  // Campos existentes...
  
  // Nuevos campos de trazabilidad
  usuarioResponsable: {
    id: number;
    nombre: string;
    rol: string;
  };
  motivoMovimiento?: string;
  autorizadoPor?: {
    id: number;
    nombre: string;
  };
  modificaciones: {
    fecha: Date;
    usuario: string;
    campoModificado: string;
    valorAnterior: any;
    valorNuevo: any;
  }[];
}

// Componente mejorado
<StockMovementsTab>
  <MovementsList>
    {/* Nueva columna de trazabilidad */}
    <TableCell>
      <AuditChip 
        usuario={movement.usuarioResponsable}
        fecha={movement.created_at}
        onClick={() => showAuditDetails(movement.id)}
      />
    </TableCell>
  </MovementsList>
</StockMovementsTab>
```

##### **POS - Trazabilidad en Transacciones**
```typescript
// Componente POS mejorado
<POSPage>
  <TransactionHistory>
    {transactions.map(transaction => (
      <TransactionCard>
        {/* Información existente */}
        
        {/* Nueva sección de trazabilidad */}
        <AuditSection>
          <Typography variant="caption">
            Cajero: {transaction.cajero.nombre}
          </Typography>
          <Typography variant="caption">
            Modificaciones: {transaction.modificaciones.length}
          </Typography>
          {transaction.cancelaciones && (
            <Alert severity="warning">
              Items cancelados: {transaction.cancelaciones.length}
              <IconButton onClick={() => showCancelDetails(transaction)}>
                <InfoIcon />
              </IconButton>
            </Alert>
          )}
        </AuditSection>
      </TransactionCard>
    ))}
  </TransactionHistory>
</POSPage>
```

##### **HOSPITALIZACIÓN - Trazabilidad en Admisiones**
```typescript
// HospitalizationPage mejorado
<HospitalizationPage>
  <AdmissionsList>
    <DataGrid
      columns={[
        // Columnas existentes...
        {
          field: 'trazabilidad',
          headerName: 'Trazabilidad',
          width: 200,
          renderCell: (params) => (
            <Stack spacing={0.5}>
              <Chip 
                size="small"
                label={`Ingreso: ${params.row.usuarioIngreso}`}
                color="primary"
              />
              {params.row.modificaciones > 0 && (
                <Chip 
                  size="small"
                  label={`${params.row.modificaciones} cambios`}
                  color="warning"
                  onClick={() => showAuditTrail(params.row.id)}
                />
              )}
            </Stack>
          )
        }
      ]}
    />
  </AdmissionsList>
</HospitalizationPage>
```

#### 1.3 Componente Universal de Auditoría
```typescript
// Nuevo componente reutilizable
export const AuditTrailDialog: React.FC<{entityId: number, entityType: string}> = ({
  entityId, 
  entityType
}) => {
  return (
    <Dialog maxWidth="md" fullWidth>
      <DialogTitle>
        Historial de Cambios - {entityType} #{entityId}
      </DialogTitle>
      <DialogContent>
        <Timeline>
          {auditRecords.map(record => (
            <TimelineItem key={record.id}>
              <TimelineSeparator>
                <TimelineDot color={getColorByAction(record.tipo_operacion)}>
                  {getIconByAction(record.tipo_operacion)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6">
                    {record.tipo_operacion}
                  </Typography>
                  <Typography color="text.secondary">
                    Por: {record.usuario_nombre} ({record.rol_usuario})
                  </Typography>
                  <Typography variant="caption">
                    {formatDate(record.created_at)}
                  </Typography>
                  {record.motivo && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Motivo: {record.motivo}
                    </Alert>
                  )}
                  {record.datos_anteriores && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2">Cambios:</Typography>
                      <DiffViewer 
                        oldValue={record.datos_anteriores}
                        newValue={record.datos_nuevos}
                      />
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </DialogContent>
    </Dialog>
  );
};
```

---

### **FASE 2: CATÁLOGOS Y SISTEMA DE CANCELACIONES** (4 días)
**Objetivo**: Control estricto de cancelaciones con trazabilidad

#### 2.1 Catálogo de Causas de Cancelación
```typescript
// Modelo Prisma actualizado
model CausaCancelacion {
  id            Int      @id @default(autoincrement())
  codigo        String   @unique
  descripcion   String
  categoria     String   // 'error_captura' | 'devolucion' | 'medico' | 'administrativo'
  requiereNota  Boolean  @default(false)
  requiereAutorizacion Boolean @default(true)
  activo        Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  cancelaciones Cancelacion[]
  @@map("causas_cancelacion")
}

model Cancelacion {
  id              Int      @id @default(autoincrement())
  modulo          String   // 'inventario' | 'pos' | 'hospitalizacion'
  tipoEntidad     String   // 'producto' | 'servicio' | 'movimiento'
  entidadId       Int
  cuentaId        Int?
  causaId         Int
  usuarioId       Int
  usuarioAutorizaId Int?  // Admin que autoriza
  medicoId        Int?
  notas           String?
  montoAfectado   Decimal
  datosOriginales Json    // Backup de datos cancelados
  createdAt       DateTime @default(now())
  
  // Relaciones
  causa           CausaCancelacion @relation(fields: [causaId])
  usuario         Usuario @relation(fields: [usuarioId])
  usuarioAutoriza Usuario? @relation(fields: [usuarioAutorizaId])
  cuenta          CuentaPaciente? @relation(fields: [cuentaId])
  
  // Auditoría automática
  @@map("cancelaciones")
}
```

#### 2.2 Dialog Universal de Cancelación
```typescript
// Componente que aparece en TODOS los módulos
export const CancelationDialog: React.FC<CancelationProps> = ({
  entity,
  module,
  onConfirm,
  onCancel
}) => {
  const [causa, setCausa] = useState('');
  const [notas, setNotas] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(false);
  
  return (
    <Dialog open maxWidth="sm" fullWidth>
      <DialogTitle>
        <Alert severity="warning">
          Cancelación de {entity.tipo} - Requiere Justificación
        </Alert>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {/* Información del item a cancelar */}
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="subtitle2">Detalles:</Typography>
            <Typography>Módulo: {module}</Typography>
            <Typography>Item: {entity.descripcion}</Typography>
            <Typography>Valor: ${entity.monto}</Typography>
          </Paper>
          
          {/* Selector de causa */}
          <FormControl required fullWidth>
            <InputLabel>Causa de Cancelación</InputLabel>
            <Select value={causa} onChange={(e) => setCausa(e.target.value)}>
              <MenuItem value="error_captura">Error de Captura</MenuItem>
              <MenuItem value="duplicado">Duplicado</MenuItem>
              <MenuItem value="devolucion">Devolución</MenuItem>
              <MenuItem value="medico">Indicación Médica</MenuItem>
              <MenuItem value="no_deducible">Consumible No Deducible</MenuItem>
            </Select>
          </FormControl>
          
          {/* Notas adicionales */}
          <TextField
            label="Notas Adicionales"
            multiline
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            required
          />
          
          {/* Autorización de administrador */}
          {requiresAuth && (
            <Alert severity="error">
              Esta cancelación requiere autorización del Administrador
              <AdminAuthorizationField />
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button 
          onClick={() => onConfirm(causa, notas)}
          color="error"
          variant="contained"
          disabled={!causa || !notas}
        >
          Confirmar Cancelación
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

### **FASE 3: CATÁLOGO DE COSTOS INDIRECTOS** (4 días)
**Objetivo**: Control financiero con trazabilidad

#### 3.1 Estructura de Costos con Auditoría
```typescript
model CostoIndirecto {
  id              Int      @id @default(autoincrement())
  categoria       String   // 'personal' | 'infraestructura' | 'servicios' | 'insumos'
  subcategoria    String
  concepto        String
  unidadMedida    String   // 'hora' | 'dia' | 'mes' | 'unidad'
  costoUnitario   Decimal
  aplicacion      String   // 'habitacion' | 'quirofano' | 'consultorio' | 'general'
  vigenciaInicio  DateTime
  vigenciaFin     DateTime?
  activo          Boolean  @default(true)
  
  // Trazabilidad
  creadoPor       Int
  modificadoPor   Int?
  fechaModificacion DateTime?
  
  // Relación con usuario
  usuarioCreador  Usuario @relation(fields: [creadoPor])
  usuarioModificador Usuario? @relation(fields: [modificadoPor])
  
  @@map("costos_indirectos")
}
```

---

### **FASE 4: REPORTES OPERATIVOS CON TRAZABILIDAD** (1 semana)
**Objetivo**: Reportes que incluyan información de auditoría

#### 4.1 Dashboard de Ocupación con Trazabilidad
```typescript
// Dashboard principal mejorado
<ExecutiveDashboard>
  {/* Panel de Ocupación */}
  <OccupancyPanel>
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Ocupación Actual" />
          <CardContent>
            <Typography variant="h3">
              {occupancy.percentage}%
            </Typography>
            <List dense>
              {recentAdmissions.map(admission => (
                <ListItem>
                  <ListItemText 
                    primary={admission.paciente}
                    secondary={`Ingresado por: ${admission.usuarioIngreso}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </OccupancyPanel>
  
  {/* Panel de Cuentas Abiertas con Trazabilidad */}
  <OpenAccountsPanel>
    <DataGrid
      columns={[
        { field: 'paciente', headerName: 'Paciente', width: 200 },
        { field: 'total', headerName: 'Total', width: 120 },
        { 
          field: 'cajeroApertura', 
          headerName: 'Abierto Por', 
          width: 150,
          renderCell: (params) => (
            <Chip label={params.value} size="small" />
          )
        },
        { 
          field: 'modificaciones', 
          headerName: 'Modificaciones', 
          width: 120,
          renderCell: (params) => (
            <Badge badgeContent={params.value} color="warning">
              <EditIcon />
            </Badge>
          )
        },
        { 
          field: 'cancelaciones', 
          headerName: 'Cancelaciones', 
          width: 120,
          renderCell: (params) => (
            params.value > 0 && (
              <Chip 
                label={`${params.value} items`} 
                color="error" 
                size="small"
                onClick={() => showCancelations(params.row.id)}
              />
            )
          )
        }
      ]}
      rows={openAccounts}
    />
  </OpenAccountsPanel>
  
  {/* Panel de Ingresos (Solo Admin) */}
  {userRole === 'administrador' && (
    <RevenuePanel>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Ingresos Facturados" />
            <CardContent>
              <Typography variant="h4">
                ${revenue.facturado.toLocaleString('es-MX')} MXN
              </Typography>
              <AuditInfo>
                Última actualización: {revenue.ultimaActualizacion}
                Por: {revenue.usuarioActualizacion}
              </AuditInfo>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '2px solid red' }}>
            <CardHeader 
              title="Ingresos NO Facturados" 
              avatar={<LockIcon color="error" />}
            />
            <CardContent>
              <Typography variant="h4" color="error">
                ${revenue.noFacturado.toLocaleString('es-MX')} MXN
              </Typography>
              <Alert severity="warning">
                Información confidencial - Solo Administrador
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </RevenuePanel>
  )}
</ExecutiveDashboard>
```

#### 4.2 Reporte de Rendimiento por Médico
```typescript
// Nuevo reporte con trazabilidad
<DoctorPerformanceReport>
  <ReportHeader>
    <Typography variant="h5">
      Rendimiento por Médico - Incluye Trazabilidad
    </Typography>
    <DateRangePicker />
    <ExportButton formats={['PDF', 'Excel', 'CSV']} />
  </ReportHeader>
  
  <ReportContent>
    {doctors.map(doctor => (
      <DoctorCard key={doctor.id}>
        <Grid container>
          <Grid item xs={12} md={3}>
            <MetricBox>
              <Typography variant="h6">
                Dr. {doctor.nombre}
              </Typography>
              <Typography variant="h4">
                ${doctor.ingresosTotales.toLocaleString('es-MX')} MXN
              </Typography>
            </MetricBox>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <MetricBox>
              <Typography variant="subtitle2">Pacientes Atendidos</Typography>
              <Typography variant="h5">{doctor.pacientesAtendidos}</Typography>
              <Typography variant="caption">
                Hospitalizados: {doctor.pacientesHospitalizados}
              </Typography>
              <Typography variant="caption">
                Ambulatorios: {doctor.pacientesAmbulatorios}
              </Typography>
            </MetricBox>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <MetricBox>
              <Typography variant="subtitle2">Operaciones</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Altas dadas"
                    secondary={doctor.altasDadas}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Cancelaciones"
                    secondary={doctor.cancelaciones}
                  />
                </ListItem>
              </List>
            </MetricBox>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <MetricBox>
              <Typography variant="subtitle2">Trazabilidad</Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => showDoctorAuditTrail(doctor.id)}
              >
                Ver Historial Completo
              </Button>
            </MetricBox>
          </Grid>
        </Grid>
      </DoctorCard>
    ))}
  </ReportContent>
</DoctorPerformanceReport>
```

---

### **FASE 5: REPORTES FINANCIEROS AVANZADOS** (1 semana)
**Objetivo**: Análisis financiero con trazabilidad completa

#### 5.1 Reporte de Márgenes con Auditoría
```typescript
// Reporte de márgenes de utilidad
<ProfitMarginReport>
  <ReportFilters>
    <DateRangePicker />
    <Select label="Agrupar por">
      <MenuItem value="paciente">Por Paciente</MenuItem>
      <MenuItem value="medico">Por Médico</MenuItem>
      <MenuItem value="servicio">Por Servicio</MenuItem>
      <MenuItem value="producto">Por Producto</MenuItem>
    </Select>
  </ReportFilters>
  
  <MarginAnalysis>
    <DataGrid
      columns={[
        { field: 'concepto', headerName: 'Concepto', width: 200 },
        { field: 'costoTotal', headerName: 'Costo Total', width: 120 },
        { field: 'precioVenta', headerName: 'Precio Venta', width: 120 },
        { 
          field: 'margen', 
          headerName: 'Margen %', 
          width: 100,
          renderCell: (params) => (
            <Chip 
              label={`${params.value}%`}
              color={params.value > 30 ? 'success' : 'warning'}
            />
          )
        },
        { 
          field: 'modificaciones', 
          headerName: 'Ajustes', 
          width: 100,
          renderCell: (params) => (
            <IconButton onClick={() => showPriceHistory(params.row)}>
              <HistoryIcon />
            </IconButton>
          )
        }
      ]}
    />
  </MarginAnalysis>
</ProfitMarginReport>
```

#### 5.2 Análisis de Productos y Proveedores
```typescript
// Reporte de ingresos por producto/proveedor
<ProductSupplierAnalysis>
  <Tabs>
    <Tab label="Por Producto" />
    <Tab label="Por Proveedor" />
  </Tabs>
  
  <TabPanel value={0}>
    <ProductRevenueChart>
      {/* Gráfica de ingresos por producto */}
      <BarChart data={productRevenue}>
        <Bar dataKey="ingresos" fill="#8884d8" />
        <Tooltip content={<CustomTooltip />} />
      </BarChart>
      
      {/* Tabla detallada con trazabilidad */}
      <DataGrid
        columns={[
          { field: 'producto', headerName: 'Producto' },
          { field: 'unidadesVendidas', headerName: 'Unidades' },
          { field: 'ingresoTotal', headerName: 'Ingreso Total MXN' },
          { field: 'margenPromedio', headerName: 'Margen %' },
          { 
            field: 'ultimaVenta', 
            headerName: 'Última Venta',
            renderCell: (params) => (
              <Stack>
                <Typography variant="caption">
                  {params.value.fecha}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Por: {params.value.usuario}
                </Typography>
              </Stack>
            )
          }
        ]}
      />
    </TabPanel>
  </TabPanel>
</ProductSupplierAnalysis>
```

---

### **FASE 6: GESTIÓN DE USUARIOS MEJORADA** (3-4 días)
**Objetivo**: Control administrativo con auditoría completa

#### 6.1 Módulo de Administración de Usuarios
```typescript
// Nueva sección exclusiva para administrador
<AdminUserManagement>
  <UserList>
    <DataGrid
      columns={[
        { field: 'username', headerName: 'Usuario' },
        { field: 'nombre', headerName: 'Nombre Completo' },
        { field: 'rol', headerName: 'Rol' },
        { field: 'estado', headerName: 'Estado' },
        { 
          field: 'ultimaActividad', 
          headerName: 'Última Actividad',
          width: 200,
          renderCell: (params) => (
            <Stack>
              <Typography variant="caption">
                {params.value.fecha}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {params.value.accion}
              </Typography>
            </Stack>
          )
        },
        { 
          field: 'operacionesCriticas', 
          headerName: 'Op. Críticas',
          renderCell: (params) => (
            <Badge badgeContent={params.value} color="error">
              <WarningIcon />
            </Badge>
          )
        }
      ]}
    />
  </UserList>
  
  <UserActivityLog>
    <Typography variant="h6">Registro de Actividad</Typography>
    <Timeline>
      {activities.map(activity => (
        <TimelineItem>
          <TimelineContent>
            <Alert severity={activity.severity}>
              <AlertTitle>{activity.usuario}</AlertTitle>
              {activity.descripcion} - {activity.fecha}
            </Alert>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  </UserActivityLog>
</AdminUserManagement>
```

---

## 📊 INTEGRACIONES CRÍTICAS CON MÓDULOS EXISTENTES

### Modificaciones Requeridas por Módulo:

#### **INVENTARIO**
- ✅ Agregar columnas de trazabilidad en tabla de movimientos
- ✅ Mostrar usuario responsable en cada movimiento
- ✅ Historial de modificaciones por producto
- ✅ Dialog de cancelación con causas

#### **POS**
- ✅ Mostrar cajero en cada transacción
- ✅ Historial de modificaciones en cuentas
- ✅ Registro de cancelaciones con motivos
- ✅ Trazabilidad de descuentos aplicados

#### **HOSPITALIZACIÓN**
- ✅ Usuario que realiza admisión
- ✅ Médico que da de alta
- ✅ Historial de notas médicas con autor
- ✅ Trazabilidad de cambios en tratamiento

#### **FACTURACIÓN**
- ✅ Cajero que genera factura
- ✅ Historial de pagos con responsable
- ✅ Cancelaciones de facturas con autorización
- ✅ Modificaciones en montos con justificación

---

## 🛡️ CONSIDERACIONES DE SEGURIDAD Y PERMISOS

### Matriz de Permisos Actualizada:
```javascript
const PERMISOS_SISTEMA = {
  // Solo Administrador
  CANCELAR_ITEMS: ['administrador'],
  APLICAR_DESCUENTOS: ['administrador'],
  VER_INGRESOS_NO_FACTURADOS: ['administrador'],
  MODIFICAR_COSTOS: ['administrador'],
  GESTIONAR_USUARIOS: ['administrador'],
  VER_AUDITORIA_COMPLETA: ['administrador'],
  
  // Múltiples Roles
  VER_TRAZABILIDAD_BASICA: ['administrador', 'cajero', 'medico_especialista'],
  GENERAR_REPORTES: ['administrador', 'socio', 'medico_especialista'],
  
  // Todos los Roles
  VER_PROPIAS_OPERACIONES: ['*']
};
```

---

## 📅 CRONOGRAMA ACTUALIZADO

| FASE | DURACIÓN | COMPONENTES AFECTADOS | PRIORIDAD |
|------|----------|----------------------|-----------|
| **Fase 1**: Infraestructura Auditoría | 5 días | Todos los módulos | 🔴 CRÍTICA |
| **Fase 2**: Cancelaciones | 4 días | POS, Inventario, Hospitalización | 🔴 CRÍTICA |
| **Fase 3**: Costos Indirectos | 4 días | Facturación, Reportes | 🟠 ALTA |
| **Fase 4**: Reportes Operativos | 5 días | Dashboard, Reportes | 🔴 CRÍTICA |
| **Fase 5**: Reportes Financieros | 5 días | Reportes, Facturación | 🟠 ALTA |
| **Fase 6**: Gestión Usuarios | 3 días | Admin, Seguridad | 🟡 MEDIA |
| **Testing & QA** | 3 días | Todo el sistema | 🔴 CRÍTICA |
| **Deployment** | 2 días | Infraestructura | 🔴 CRÍTICA |

**⏱️ TIEMPO TOTAL: 5 SEMANAS**

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs del Proyecto:
- 📈 100% de operaciones con trazabilidad visible
- 📈 0 operaciones sin registro de usuario responsable
- 📈 100% de cancelaciones con causa documentada
- 📈 Reducción 50% en tiempo de auditoría
- 📈 100% visibilidad de márgenes de utilidad
- 📈 Generación de reportes < 3 segundos

---

## 🚨 PUNTOS CRÍTICOS DE IMPLEMENTACIÓN

1. **TODOS los movimientos de inventario** deben mostrar:
   - Usuario que realizó el movimiento
   - Fecha y hora exacta
   - Motivo del movimiento
   - Historial de modificaciones

2. **TODAS las transacciones POS** deben incluir:
   - Cajero responsable
   - Items cancelados con justificación
   - Descuentos con autorización
   - Timeline de modificaciones

3. **TODAS las operaciones de hospitalización** deben registrar:
   - Usuario que admite
   - Médico que da de alta
   - Cambios en tratamiento
   - Cancelaciones de servicios

---

**📅 Fecha de creación**: 11 de Agosto de 2025
**👨‍💼 Preparado para**: Ejecutivos del Hospital
**🏥 Sistema**: Hospital Management System v2.0
**⚠️ NOTA IMPORTANTE**: La trazabilidad debe ser visible en TODAS las pantallas donde aparezcan registros de operaciones