# 🚀 GUÍA DE INICIO - DESARROLLO FASE 1: INFRAESTRUCTURA DE AUDITORÍA

## ✅ PASO 1: VERIFICAR SISTEMA ACTUAL

### 1.1 Iniciar el sistema
```bash
# Desde la raíz del proyecto
cd /Users/alfredo/agntsystemsc
npm run dev
```

### 1.2 Verificar que funcione
```bash
# En otra terminal, verificar servicios
curl http://localhost:3001/health
curl http://localhost:3000
```

### 1.3 Probar login
- URL: http://localhost:3000
- Usuario: admin
- Password: admin123

---

## ✅ PASO 2: PREPARAR ENTORNO DE DESARROLLO

### 2.1 Inicializar Git (si no existe)
```bash
# En la raíz del proyecto
git init
git add .
git commit -m "Estado inicial antes de implementación de auditoría"
```

### 2.2 Crear branch de desarrollo
```bash
git checkout -b feature/auditoria-trazabilidad
```

---

## ✅ PASO 3: IMPLEMENTAR BASE DE DATOS DE AUDITORÍA

### 3.1 Crear migración de Prisma
```bash
cd backend
```

Crear archivo: `backend/prisma/migrations/add_auditoria_table.sql`
```sql
-- CreateTable
CREATE TABLE "auditoria_operaciones" (
    "id" SERIAL NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "tipo_operacion" VARCHAR(50) NOT NULL,
    "entidad_tipo" VARCHAR(50) NOT NULL,
    "entidad_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "usuario_nombre" VARCHAR(100) NOT NULL,
    "rol_usuario" VARCHAR(50) NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "motivo" TEXT,
    "causa_cancelacion_id" INTEGER,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_operaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_modulo" ON "auditoria_operaciones"("modulo");
CREATE INDEX "idx_audit_usuario" ON "auditoria_operaciones"("usuario_id");
CREATE INDEX "idx_audit_fecha" ON "auditoria_operaciones"("created_at");
CREATE INDEX "idx_audit_entidad" ON "auditoria_operaciones"("entidad_tipo", "entidad_id");

-- CreateTable para Causas de Cancelación
CREATE TABLE "causas_cancelacion" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "requiere_nota" BOOLEAN NOT NULL DEFAULT false,
    "requiere_autorizacion" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "causas_cancelacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "causas_cancelacion_codigo_key" ON "causas_cancelacion"("codigo");

-- Insertar causas iniciales
INSERT INTO "causas_cancelacion" (codigo, descripcion, categoria, requiere_nota, requiere_autorizacion) VALUES
('ERROR_CAPTURA', 'Error de captura', 'administrativo', true, false),
('DUPLICADO', 'Registro duplicado', 'administrativo', true, false),
('DEVOLUCION', 'Devolución de producto', 'operativo', true, true),
('INDICACION_MEDICA', 'Por indicación médica', 'medico', true, false),
('NO_DEDUCIBLE', 'Consumible no deducible', 'administrativo', true, true),
('CAMBIO_TRATAMIENTO', 'Cambio de tratamiento', 'medico', true, false),
('ERROR_SISTEMA', 'Error del sistema', 'tecnico', true, false);
```

### 3.2 Actualizar schema.prisma
Agregar al archivo `backend/prisma/schema.prisma`:

```prisma
model AuditoriaOperacion {
  id                  Int       @id @default(autoincrement())
  modulo              String    @db.VarChar(50)
  tipoOperacion       String    @map("tipo_operacion") @db.VarChar(50)
  entidadTipo         String    @map("entidad_tipo") @db.VarChar(50)
  entidadId           Int       @map("entidad_id")
  usuarioId           Int       @map("usuario_id")
  usuarioNombre       String    @map("usuario_nombre") @db.VarChar(100)
  rolUsuario          String    @map("rol_usuario") @db.VarChar(50)
  datosAnteriores     Json?     @map("datos_anteriores")
  datosNuevos         Json?     @map("datos_nuevos")
  motivo              String?
  causaCancelacionId  Int?      @map("causa_cancelacion_id")
  ipAddress           String?   @map("ip_address") @db.VarChar(45)
  userAgent           String?   @map("user_agent")
  createdAt           DateTime  @default(now()) @map("created_at")

  // Relaciones
  usuario            Usuario    @relation(fields: [usuarioId], references: [id])
  causaCancelacion   CausaCancelacion? @relation(fields: [causaCancelacionId], references: [id])

  @@index([modulo])
  @@index([usuarioId])
  @@index([createdAt])
  @@index([entidadTipo, entidadId])
  @@map("auditoria_operaciones")
}

model CausaCancelacion {
  id                    Int      @id @default(autoincrement())
  codigo                String   @unique @db.VarChar(50)
  descripcion           String   @db.VarChar(200)
  categoria             String   @db.VarChar(50)
  requiereNota          Boolean  @default(false) @map("requiere_nota")
  requiereAutorizacion  Boolean  @default(true) @map("requiere_autorizacion")
  activo                Boolean  @default(true)
  createdAt             DateTime @default(now()) @map("created_at")

  // Relaciones
  auditorias            AuditoriaOperacion[]

  @@map("causas_cancelacion")
}
```

### 3.3 Ejecutar migración
```bash
# En backend/
npx prisma migrate dev --name add_auditoria_system
npx prisma generate
```

---

## ✅ PASO 4: CREAR MIDDLEWARE DE AUDITORÍA

### 4.1 Crear archivo middleware
Crear `backend/middleware/audit.middleware.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auditMiddleware = (modulo) => {
  return async (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);
    
    // Sobrescribir res.json para capturar respuestas
    res.json = function(data) {
      // Si la operación fue exitosa, registrar auditoría
      if (data.success && req.user) {
        const auditData = {
          modulo: modulo,
          tipoOperacion: req.method + ' ' + req.route.path,
          entidadTipo: determineEntityType(req.route.path),
          entidadId: data.data?.id || 0,
          usuarioId: req.user.id,
          usuarioNombre: req.user.username,
          rolUsuario: req.user.rol,
          datosNuevos: req.body,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          motivo: req.body.motivo || null
        };
        
        // Registrar asíncronamente sin bloquear respuesta
        prisma.auditoriaOperacion.create({
          data: auditData
        }).catch(error => {
          console.error('Error al registrar auditoría:', error);
        });
      }
      
      // Llamar al método original
      return originalJson(data);
    };
    
    next();
  };
};

const determineEntityType = (path) => {
  if (path.includes('patient')) return 'paciente';
  if (path.includes('product')) return 'producto';
  if (path.includes('movement')) return 'movimiento';
  if (path.includes('invoice')) return 'factura';
  if (path.includes('admission')) return 'hospitalizacion';
  return 'general';
};

// Middleware específico para operaciones críticas
const criticalOperationAudit = async (req, res, next) => {
  const criticalOps = [
    'DELETE',
    'cancelar',
    'descuento',
    'alta',
    'cierre'
  ];
  
  const isCritical = criticalOps.some(op => 
    req.method === op || req.path.includes(op)
  );
  
  if (isCritical) {
    // Validar que haya motivo
    if (!req.body.motivo) {
      return res.status(400).json({
        success: false,
        message: 'Esta operación requiere un motivo'
      });
    }
    
    // Si es cancelación, validar causa
    if (req.path.includes('cancel')) {
      if (!req.body.causaCancelacionId) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar una causa de cancelación'
        });
      }
    }
  }
  
  next();
};

module.exports = {
  auditMiddleware,
  criticalOperationAudit
};
```

### 4.2 Integrar middleware en rutas
Modificar `backend/server-modular.js`:

```javascript
// Agregar después de los imports
const { auditMiddleware, criticalOperationAudit } = require('./middleware/audit.middleware');

// Aplicar a rutas de inventario
app.use('/api/inventory', 
  authenticateToken,
  auditMiddleware('inventario'),
  inventoryRoutes
);

// Aplicar a rutas de POS
app.use('/api/pos',
  authenticateToken,
  auditMiddleware('pos'),
  posRoutes
);

// Aplicar a rutas de hospitalización
app.use('/api/hospitalization',
  authenticateToken,
  auditMiddleware('hospitalizacion'),
  hospitalizationRoutes
);
```

---

## ✅ PASO 5: CREAR SERVICIO DE AUDITORÍA EN FRONTEND

### 5.1 Crear servicio
Crear `frontend/src/services/auditService.ts`:

```typescript
import api from '@/utils/api';

export interface AuditRecord {
  id: number;
  modulo: string;
  tipoOperacion: string;
  entidadTipo: string;
  entidadId: number;
  usuarioNombre: string;
  rolUsuario: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  motivo?: string;
  createdAt: string;
}

class AuditService {
  async getAuditTrail(entityType: string, entityId: number): Promise<AuditRecord[]> {
    const response = await api.get(`/audit/trail/${entityType}/${entityId}`);
    return response.data;
  }

  async getModuleAudit(module: string, filters?: any): Promise<AuditRecord[]> {
    const response = await api.get(`/audit/module/${module}`, { params: filters });
    return response.data;
  }

  async getUserActivity(userId: number): Promise<AuditRecord[]> {
    const response = await api.get(`/audit/user/${userId}`);
    return response.data;
  }
}

export default new AuditService();
```

### 5.2 Crear componente de visualización
Crear `frontend/src/components/common/AuditTrail.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  Paper,
  Typography,
  Chip,
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import auditService, { AuditRecord } from '@/services/auditService';

interface AuditTrailProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: number;
  title?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  title = 'Historial de Cambios'
}) => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && entityId) {
      loadAuditTrail();
    }
  }, [open, entityId]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAuditTrail(entityType, entityId);
      setRecords(data);
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (operation: string) => {
    if (operation.includes('POST')) return <AddIcon />;
    if (operation.includes('PUT')) return <EditIcon />;
    if (operation.includes('DELETE')) return <DeleteIcon />;
    return <PersonIcon />;
  };

  const getColor = (operation: string): any => {
    if (operation.includes('POST')) return 'primary';
    if (operation.includes('PUT')) return 'warning';
    if (operation.includes('DELETE')) return 'error';
    return 'grey';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Timeline position="alternate">
          {records.map((record, index) => (
            <TimelineItem key={record.id}>
              <TimelineSeparator>
                <TimelineDot color={getColor(record.tipoOperacion)}>
                  {getIcon(record.tipoOperacion)}
                </TimelineDot>
                {index < records.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" component="h1">
                    {record.tipoOperacion}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Chip 
                      label={record.usuarioNombre}
                      size="small"
                      icon={<PersonIcon />}
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={record.rolUsuario}
                      size="small"
                      color="secondary"
                    />
                  </Box>
                  <Typography color="text.secondary" variant="caption">
                    {new Date(record.createdAt).toLocaleString()}
                  </Typography>
                  {record.motivo && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Motivo: {record.motivo}
                    </Typography>
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

## ✅ PASO 6: INTEGRAR EN MÓDULO DE INVENTARIO (EJEMPLO)

### 6.1 Modificar StockMovementsTab
Actualizar `frontend/src/pages/inventory/StockMovementsTab.tsx`:

```typescript
// Agregar import
import { AuditTrail } from '@/components/common/AuditTrail';
import { IconButton, Chip } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';

// Agregar estado
const [auditDialogOpen, setAuditDialogOpen] = useState(false);
const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null);

// Agregar columna en DataGrid
const columns = [
  // ... columnas existentes
  {
    field: 'usuarioResponsable',
    headerName: 'Responsable',
    width: 150,
    renderCell: (params) => (
      <Chip 
        label={params.row.usuario?.username || 'Sistema'}
        size="small"
        color="primary"
      />
    )
  },
  {
    field: 'auditoria',
    headerName: 'Trazabilidad',
    width: 100,
    renderCell: (params) => (
      <IconButton
        size="small"
        onClick={() => {
          setSelectedMovementId(params.row.id);
          setAuditDialogOpen(true);
        }}
      >
        <HistoryIcon />
      </IconButton>
    )
  }
];

// Agregar dialog al final del componente
return (
  <>
    {/* Contenido existente */}
    
    <AuditTrail
      open={auditDialogOpen}
      onClose={() => setAuditDialogOpen(false)}
      entityType="movimiento"
      entityId={selectedMovementId || 0}
      title="Historial del Movimiento"
    />
  </>
);
```

---

## ✅ PASO 7: PROBAR LA IMPLEMENTACIÓN

### 7.1 Reiniciar servicios
```bash
# Detener servicios actuales (Ctrl+C)
# Reiniciar
npm run dev
```

### 7.2 Probar flujo
1. Login como admin
2. Ir a Inventario
3. Crear un movimiento de stock
4. Ver que aparezca el usuario responsable
5. Click en botón de trazabilidad
6. Verificar que se muestre el historial

### 7.3 Verificar base de datos
```bash
cd backend
npx prisma studio
# Revisar tabla auditoria_operaciones
```

---

## 📋 CHECKLIST DE VALIDACIÓN

- [ ] Base de datos creada correctamente
- [ ] Middleware capturando operaciones
- [ ] Frontend mostrando trazabilidad
- [ ] Auditoría guardándose en BD
- [ ] Sin errores en consola
- [ ] Performance aceptable

---

## 🎯 PRÓXIMOS PASOS

Una vez validada la Fase 1 en Inventario:
1. Replicar en módulo POS
2. Replicar en módulo Hospitalización
3. Implementar sistema de cancelaciones (Fase 2)
4. Continuar con reportes

---

## 📝 COMANDOS ÚTILES

```bash
# Ver logs del backend
tail -f backend/logs/hospital.log

# Ver registros de auditoría
cd backend && npx prisma studio

# Verificar cambios
git status
git diff

# Guardar progreso
git add .
git commit -m "feat: Implementar sistema de auditoría - Fase 1"
```

---

**⚠️ IMPORTANTE**: 
- Hacer commits frecuentes
- Probar cada cambio antes de continuar
- Documentar cualquier problema encontrado
- No modificar funcionalidad existente, solo agregar

**📅 Fecha**: 11 de Agosto de 2025
**🎯 Objetivo**: Tener auditoría funcionando en 1 módulo como prueba