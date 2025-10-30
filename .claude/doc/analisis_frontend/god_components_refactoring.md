# God Components - Plan de Refactorización
**Sistema de Gestión Hospitalaria - Frontend**
**Total de God Components:** 6 componentes >700 líneas
**Fecha:** 30 de octubre de 2025

---

## RESUMEN EJECUTIVO

**Problema:** 6 componentes violan el Single Responsibility Principle con >700 líneas cada uno, dificultando mantenimiento, testing, y colaboración.

**Top 3 Críticos:**
1. `components/pos/HistoryTab.tsx` - 1,094 líneas (8 responsabilidades)
2. `pages/patients/AdvancedSearchTab.tsx` - 984 líneas (7 responsabilidades)
3. `pages/patients/PatientFormDialog.tsx` - 944 líneas (6 responsabilidades)

**Impacto:**
- 🔴 Mantenibilidad: Difícil de entender y modificar
- 🔴 Testabilidad: Imposible de testear por unidades
- 🔴 Colaboración: Conflictos de merge frecuentes
- 🔴 Reusabilidad: Lógica duplicada por no poder extraer

**Tiempo estimado de refactorización:** 3-4 días (Top 3), 5-7 días (todos)

---

## TOP 1: HistoryTab.tsx (1,094 líneas)

### Análisis Actual

**Ubicación:** `src/components/pos/HistoryTab.tsx`
**Líneas:** 1,094
**Responsabilidades:**
1. ✅ Gestión de estado de cuentas cerradas (closedAccounts)
2. ✅ Gestión de estado de ventas rápidas (quickSales)
3. ✅ Filtrado avanzado (por fecha, paciente, monto, tipo de atención)
4. ✅ Paginación de ambos tipos de historial
5. ✅ Diálogos de detalle (cuenta y venta)
6. ✅ Exportación de datos (PDF/Excel)
7. ✅ Impresión de tickets
8. ✅ Sistema de tabs para alternar entre vistas

**Estados locales (8):**
```typescript
const [closedAccounts, setClosedAccounts] = useState<PatientAccount[]>([]);
const [quickSales, setQuickSales] = useState<QuickSale[]>([]);
const [expandedAccount, setExpandedAccount] = useState<number | null>(null);
const [selectedAccount, setSelectedAccount] = useState<PatientAccount | null>(null);
const [selectedSale, setSelectedSale] = useState<QuickSale | null>(null);
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState<HistoryFilters>({});
const [activeTab, setActiveTab] = useState(0);
```

**useEffect hooks (6):** Fetching inicial, refresh en cambio de filtros, limpieza, etc.

**Funciones callback (10+):** handlePageChange, handleFilterChange, handleExport, handlePrint, etc.

### Propuesta de Refactorización

#### Arquitectura Objetivo

```
components/pos/history/
├── HistoryTab.tsx                      (200 líneas) - Componente contenedor
├── hooks/
│   ├── useClosedAccountsHistory.ts    (100 líneas) - Estado + lógica cuentas cerradas
│   ├── useQuickSalesHistory.ts        (100 líneas) - Estado + lógica ventas rápidas
│   └── useHistoryFilters.ts           (80 líneas)  - Lógica de filtrado
├── components/
│   ├── ClosedAccountsTable.tsx        (150 líneas) - Tabla de cuentas
│   ├── QuickSalesTable.tsx            (150 líneas) - Tabla de ventas
│   ├── HistoryFilters.tsx             (120 líneas) - Formulario de filtros
│   ├── AccountDetailDialog.tsx        (150 líneas) - Diálogo detalle cuenta
│   └── SaleDetailDialog.tsx           (120 líneas) - Diálogo detalle venta
└── utils/
    ├── historyExport.ts               (100 líneas) - Lógica de exportación
    └── historyPrint.ts                (80 líneas)  - Lógica de impresión
```

**Total:** ~1,250 líneas distribuidas en 11 archivos modulares

#### Implementación Detallada

**1. Hook: useClosedAccountsHistory.ts**

```typescript
// hooks/useClosedAccountsHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';

interface UseClosedAccountsHistoryProps {
  filters: HistoryFilters;
  autoRefresh?: boolean;
}

export const useClosedAccountsHistory = ({
  filters,
  autoRefresh = false
}: UseClosedAccountsHistoryProps) => {
  const [accounts, setAccounts] = useState<PatientAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await posService.getClosedAccounts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success && response.data) {
        setAccounts(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Auto-refresh cada 30 segundos si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAccounts, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAccounts]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination({ page: 0, limit: newLimit, total: pagination.total });
  };

  const refresh = () => {
    fetchAccounts();
  };

  return {
    accounts,
    loading,
    error,
    pagination,
    handlePageChange,
    handleLimitChange,
    refresh
  };
};
```

**2. Componente: HistoryFilters.tsx**

```typescript
// components/HistoryFilters.tsx
import React from 'react';
import { Box, Grid, TextField, Button, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { HistoryFilters as FiltersType } from '@/types/pos.types';

interface HistoryFiltersProps {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
  onClear: () => void;
  loading?: boolean;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onChange,
  onClear,
  loading
}) => {
  const handleChange = (field: keyof FiltersType, value: any) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <DatePicker
            label="Fecha Inicio"
            value={filters.fechaInicio}
            onChange={(date) => handleChange('fechaInicio', date)}
            slotProps={{
              textField: { fullWidth: true, size: 'small' }
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <DatePicker
            label="Fecha Fin"
            value={filters.fechaFin}
            onChange={(date) => handleChange('fechaFin', date)}
            slotProps={{
              textField: { fullWidth: true, size: 'small' }
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Nombre Paciente"
            value={filters.pacienteNombre || ''}
            onChange={(e) => handleChange('pacienteNombre', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Tipo de Atención"
            value={filters.tipoAtencion || ''}
            onChange={(e) => handleChange('tipoAtencion', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ambulatorio">Ambulatorio</MenuItem>
            <MenuItem value="hospitalizado">Hospitalizado</MenuItem>
            <MenuItem value="urgencias">Urgencias</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Monto Mínimo"
              value={filters.montoMinimo || ''}
              onChange={(e) => handleChange('montoMinimo', Number(e.target.value))}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Monto Máximo"
              value={filters.montoMaximo || ''}
              onChange={(e) => handleChange('montoMaximo', Number(e.target.value))}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onClear}
              disabled={loading}
            >
              Limpiar Filtros
            </Button>
            <Button
              variant="contained"
              onClick={() => onChange(filters)}
              disabled={loading}
            >
              Buscar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
```

**3. Componente Contenedor: HistoryTab.tsx (REFACTORIZADO)**

```typescript
// HistoryTab.tsx (200 líneas después de refactorización)
import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useClosedAccountsHistory } from './hooks/useClosedAccountsHistory';
import { useQuickSalesHistory } from './hooks/useQuickSalesHistory';
import { useHistoryFilters } from './hooks/useHistoryFilters';
import { HistoryFilters } from './components/HistoryFilters';
import { ClosedAccountsTable } from './components/ClosedAccountsTable';
import { QuickSalesTable } from './components/QuickSalesTable';
import { AccountDetailDialog } from './components/AccountDetailDialog';
import { SaleDetailDialog } from './components/SaleDetailDialog';
import { exportHistoryToExcel, exportHistoryToPDF } from './utils/historyExport';
import { printTicket } from './utils/historyPrint';

interface HistoryTabProps {
  onRefresh?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const { filters, updateFilter, clearFilters } = useHistoryFilters();

  const closedAccountsHistory = useClosedAccountsHistory({
    filters,
    autoRefresh: activeTab === 0
  });

  const quickSalesHistory = useQuickSalesHistory({
    filters,
    autoRefresh: activeTab === 1
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    const data = activeTab === 0
      ? closedAccountsHistory.accounts
      : quickSalesHistory.sales;

    if (format === 'excel') {
      await exportHistoryToExcel(data, activeTab === 0 ? 'cuentas' : 'ventas');
    } else {
      await exportHistoryToPDF(data, activeTab === 0 ? 'cuentas' : 'ventas');
    }
  };

  const handlePrint = (item: any) => {
    printTicket(item);
  };

  return (
    <Box>
      {/* Filtros */}
      <HistoryFilters
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        loading={closedAccountsHistory.loading || quickSalesHistory.loading}
      />

      {/* Tabs */}
      <Paper sx={{ mt: 2 }}>
        <Tabs value={activeTab} onChange={(_, tab) => setActiveTab(tab)}>
          <Tab label="Cuentas Cerradas" />
          <Tab label="Ventas Rápidas" />
        </Tabs>

        {/* Contenido Tab 0: Cuentas Cerradas */}
        {activeTab === 0 && (
          <ClosedAccountsTable
            accounts={closedAccountsHistory.accounts}
            loading={closedAccountsHistory.loading}
            pagination={closedAccountsHistory.pagination}
            onPageChange={closedAccountsHistory.handlePageChange}
            onRowClick={setSelectedAccount}
            onExport={handleExport}
            onPrint={handlePrint}
          />
        )}

        {/* Contenido Tab 1: Ventas Rápidas */}
        {activeTab === 1 && (
          <QuickSalesTable
            sales={quickSalesHistory.sales}
            loading={quickSalesHistory.loading}
            pagination={quickSalesHistory.pagination}
            onPageChange={quickSalesHistory.handlePageChange}
            onRowClick={setSelectedSale}
            onExport={handleExport}
            onPrint={handlePrint}
          />
        )}
      </Paper>

      {/* Diálogos */}
      <AccountDetailDialog
        open={!!selectedAccount}
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
        onPrint={handlePrint}
      />

      <SaleDetailDialog
        open={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onPrint={handlePrint}
      />
    </Box>
  );
};
```

### Beneficios de la Refactorización

**Antes:**
- 1 archivo monolítico de 1,094 líneas
- 8 responsabilidades mezcladas
- Imposible de testear por unidades
- Difícil de entender y mantener

**Después:**
- 11 archivos modulares (~100-200 líneas cada uno)
- Cada archivo con responsabilidad única
- Testeable por unidades:
  - `useClosedAccountsHistory.test.ts` - Testear lógica de fetching
  - `HistoryFilters.test.tsx` - Testear UI de filtros
  - `exportHistory.test.ts` - Testear exportación
- Reutilizable:
  - `useHistoryFilters` puede usarse en otros módulos
  - `HistoryFilters` puede reutilizarse
  - `exportHistory` puede usarse desde otros lugares
- Fácil de mantener y extender

### Plan de Implementación (2 días)

**Día 1: Extraer lógica**
- [ ] Crear hooks: useClosedAccountsHistory, useQuickSalesHistory, useHistoryFilters
- [ ] Crear utils: historyExport, historyPrint
- [ ] Testear hooks aisladamente

**Día 2: Extraer UI**
- [ ] Crear componentes: HistoryFilters, ClosedAccountsTable, QuickSalesTable
- [ ] Crear diálogos: AccountDetailDialog, SaleDetailDialog
- [ ] Refactorizar HistoryTab.tsx a componente contenedor
- [ ] Testear integración completa
- [ ] Eliminar archivo antiguo

---

## TOP 2: AdvancedSearchTab.tsx (984 líneas)

### Análisis Actual

**Ubicación:** `src/pages/patients/AdvancedSearchTab.tsx`
**Líneas:** 984
**Responsabilidades:**
1. ✅ Formulario de búsqueda avanzada con 15+ filtros
2. ✅ Tabla de resultados con paginación
3. ✅ Diálogo de vista de paciente
4. ✅ Diálogo de edición de paciente
5. ✅ Guardado y gestión de búsquedas favoritas
6. ✅ Exportación de resultados
7. ✅ Accordion expandible con filtros complejos

### Propuesta de Refactorización

#### Arquitectura Objetivo

```
pages/patients/advanced-search/
├── AdvancedSearchTab.tsx              (250 líneas) - Contenedor
├── hooks/
│   ├── usePatientSearch.ts           (150 líneas) - Lógica de búsqueda
│   ├── useSavedSearches.ts           (80 líneas)  - Gestión de favoritos
│   └── usePatientFilters.ts          (100 líneas) - Gestión de filtros
├── components/
│   ├── PatientSearchFilters.tsx      (200 líneas) - Formulario de filtros
│   ├── PatientSearchResults.tsx      (180 líneas) - Tabla de resultados
│   ├── PatientDetailDialog.tsx       (150 líneas) - Vista de paciente
│   ├── SaveSearchDialog.tsx          (80 líneas)  - Guardar búsqueda
│   └── SavedSearchesList.tsx         (100 líneas) - Lista de búsquedas guardadas
└── utils/
    ├── searchUtils.ts                (100 líneas) - Helpers de búsqueda
    └── searchExport.ts               (80 líneas)  - Exportación de resultados
```

#### Implementación Clave

**Hook: usePatientSearch.ts**

```typescript
// hooks/usePatientSearch.ts
import { useState, useCallback } from 'react';
import { patientsService } from '@/services/patientsService';
import { Patient, PatientFilters } from '@/types/patients.types';
import { usePagination } from '@/hooks/usePagination';

export const usePatientSearch = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const search = useCallback(async (filters: PatientFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await patientsService.getPatients({
        ...filters,
        page,
        limit
      });

      if (response.success && response.data) {
        setPatients(response.data.items);
        setTotalCount(response.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar pacientes');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const clear = () => {
    setPatients([]);
    setTotalCount(0);
    setError(null);
  };

  return {
    patients,
    loading,
    error,
    totalCount,
    page,
    limit,
    search,
    clear,
    handlePageChange,
    handleLimitChange
  };
};
```

**Componente: PatientSearchFilters.tsx**

```typescript
// components/PatientSearchFilters.tsx
import React from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { PatientFilters } from '@/types/patients.types';

interface PatientSearchFiltersProps {
  filters: PatientFilters;
  onChange: (filters: PatientFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  loading?: boolean;
}

export const PatientSearchFilters: React.FC<PatientSearchFiltersProps> = ({
  filters,
  onChange,
  onSearch,
  onClear,
  loading
}) => {
  const handleChange = (field: keyof PatientFilters, value: any) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <Box>
      {/* Filtros básicos siempre visibles */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre o CURP"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Buscar por nombre, apellido o CURP..."
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Género"
            value={filters.genero || ''}
            onChange={(e) => handleChange('genero', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="masculino">Masculino</MenuItem>
            <MenuItem value="femenino">Femenino</MenuItem>
            <MenuItem value="otro">Otro</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Es Menor de Edad"
            value={filters.esMenorEdad === undefined ? '' : filters.esMenorEdad.toString()}
            onChange={(e) => handleChange('esMenorEdad', e.target.value === 'true')}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Sí</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Filtros avanzados en accordion */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Filtros Avanzados
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Tipo de Sangre"
                value={filters.tipoSangre || ''}
                onChange={(e) => handleChange('tipoSangre', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Estado Civil"
                value={filters.estadoCivil || ''}
                onChange={(e) => handleChange('estadoCivil', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="soltero">Soltero</MenuItem>
                <MenuItem value="casado">Casado</MenuItem>
                <MenuItem value="divorciado">Divorciado</MenuItem>
                <MenuItem value="viudo">Viudo</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Código Postal"
                value={filters.codigoPostal || ''}
                onChange={(e) => handleChange('codigoPostal', e.target.value)}
              />
            </Grid>

            {/* Más filtros... */}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Botones de acción */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClear} disabled={loading}>
          Limpiar
        </Button>
        <Button variant="contained" onClick={onSearch} disabled={loading}>
          Buscar
        </Button>
      </Box>
    </Box>
  );
};
```

### Plan de Implementación (1.5 días)

**Día 1: Extraer lógica y componentes principales**
- [ ] Crear hooks: usePatientSearch, useSavedSearches, usePatientFilters
- [ ] Crear componentes: PatientSearchFilters, PatientSearchResults
- [ ] Crear utils: searchUtils, searchExport
- [ ] Testear hooks

**Día 2 (medio día): Integración**
- [ ] Refactorizar AdvancedSearchTab.tsx
- [ ] Crear diálogos: SaveSearchDialog, SavedSearchesList
- [ ] Testing integración
- [ ] Eliminar archivo antiguo

---

## TOP 3: PatientFormDialog.tsx (944 líneas)

### Análisis Actual

**Ubicación:** `src/pages/patients/PatientFormDialog.tsx`
**Líneas:** 944
**Responsabilidades:**
1. ✅ Formulario de creación (20+ campos)
2. ✅ Formulario de edición
3. ✅ Validación compleja con Yup
4. ✅ Gestión de responsables (menor de edad)
5. ✅ Integración con código postal API
6. ✅ Cálculo de edad automático

### Propuesta de Refactorización

#### Arquitectura Objetivo

```
pages/patients/form/
├── PatientFormDialog.tsx              (200 líneas) - Contenedor
├── hooks/
│   ├── usePatientForm.ts             (150 líneas) - Lógica del formulario
│   ├── useResponsibleValidation.ts   (80 líneas)  - Validación de responsables
│   └── usePostalCodeLookup.ts        (60 líneas)  - Búsqueda de CP
├── components/
│   ├── PatientBasicInfoFields.tsx    (150 líneas) - Datos básicos
│   ├── PatientContactFields.tsx      (100 líneas) - Contacto
│   ├── PatientMedicalFields.tsx      (120 líneas) - Info médica
│   ├── ResponsibleFields.tsx         (150 líneas) - Datos del responsable
│   └── FormActions.tsx               (60 líneas)  - Botones de acción
└── utils/
    └── patientFormUtils.ts           (80 líneas)  - Helpers
```

#### Implementación Clave

**Hook: usePatientForm.ts**

```typescript
// hooks/usePatientForm.ts
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { patientSchema } from '@/schemas/patients.schemas';
import { patientsService } from '@/services/patientsService';
import { Patient, CreatePatientRequest } from '@/types/patients.types';
import { toast } from 'react-toastify';

interface UsePatientFormProps {
  patient?: Patient | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const usePatientForm = ({
  patient,
  onSuccess,
  onClose
}: UsePatientFormProps) => {
  const isEditing = !!patient;

  const form = useForm<CreatePatientRequest>({
    resolver: yupResolver(patientSchema),
    defaultValues: patient || {
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: null,
      genero: '',
      curp: '',
      // ... más campos
    },
    mode: 'onChange'
  });

  const { watch, setValue } = form;

  // Calcular edad automáticamente
  const fechaNacimiento = watch('fechaNacimiento');
  useEffect(() => {
    if (fechaNacimiento) {
      const edad = patientsService.calculateAge(fechaNacimiento);
      setValue('edad', edad);

      const esMenor = edad < 18;
      setValue('esMenorEdad', esMenor);

      // Limpiar responsable si ya no es menor
      if (!esMenor) {
        setValue('responsable', undefined);
      }
    }
  }, [fechaNacimiento, setValue]);

  const handleSubmit = useCallback(async (data: CreatePatientRequest) => {
    try {
      if (isEditing) {
        await patientsService.updatePatient(patient.id, data);
        toast.success('Paciente actualizado exitosamente');
      } else {
        await patientsService.createPatient(data);
        toast.success('Paciente creado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar paciente');
    }
  }, [isEditing, patient, onSuccess, onClose]);

  return {
    form,
    isEditing,
    handleSubmit
  };
};
```

**Componente: PatientBasicInfoFields.tsx**

```typescript
// components/PatientBasicInfoFields.tsx
import React from 'react';
import { Grid } from '@mui/material';
import { Control } from 'react-hook-form';
import { ControlledTextField } from '@/components/forms/ControlledTextField';
import { ControlledSelect } from '@/components/forms/ControlledSelect';
import { DatePicker } from '@mui/x-date-pickers';
import { CreatePatientRequest } from '@/types/patients.types';
import { GENDER_OPTIONS } from '@/utils/constants';

interface PatientBasicInfoFieldsProps {
  control: Control<CreatePatientRequest>;
}

export const PatientBasicInfoFields: React.FC<PatientBasicInfoFieldsProps> = ({
  control
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <ControlledTextField
          name="nombre"
          control={control}
          label="Nombre(s)"
          required
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <ControlledTextField
          name="apellidoPaterno"
          control={control}
          label="Apellido Paterno"
          required
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <ControlledTextField
          name="apellidoMaterno"
          control={control}
          label="Apellido Materno"
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <ControlledSelect
          name="genero"
          control={control}
          label="Género"
          required
          fullWidth
          options={GENDER_OPTIONS}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <DatePicker
          label="Fecha de Nacimiento"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true
            }
          }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <ControlledTextField
          name="curp"
          control={control}
          label="CURP"
          required
          fullWidth
          inputProps={{ maxLength: 18 }}
        />
      </Grid>

      {/* Más campos... */}
    </Grid>
  );
};
```

**Componente Contenedor: PatientFormDialog.tsx (REFACTORIZADO)**

```typescript
// PatientFormDialog.tsx (200 líneas después de refactorización)
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { usePatientForm } from './hooks/usePatientForm';
import { PatientBasicInfoFields } from './components/PatientBasicInfoFields';
import { PatientContactFields } from './components/PatientContactFields';
import { PatientMedicalFields } from './components/PatientMedicalFields';
import { ResponsibleFields } from './components/ResponsibleFields';
import { Patient } from '@/types/patients.types';

interface PatientFormDialogProps {
  open: boolean;
  patient?: Patient | null;
  onSuccess: () => void;
  onClose: () => void;
}

const steps = ['Datos Básicos', 'Contacto', 'Información Médica', 'Responsable'];

export const PatientFormDialog: React.FC<PatientFormDialogProps> = ({
  open,
  patient,
  onSuccess,
  onClose
}) => {
  const [activeStep, setActiveStep] = React.useState(0);

  const { form, isEditing, handleSubmit } = usePatientForm({
    patient,
    onSuccess,
    onClose
  });

  const { control, watch, formState: { isValid } } = form;

  const esMenorEdad = watch('esMenorEdad');

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      form.handleSubmit(handleSubmit)();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <PatientBasicInfoFields control={control} />;
      case 1:
        return <PatientContactFields control={control} />;
      case 2:
        return <PatientMedicalFields control={control} />;
      case 3:
        return esMenorEdad ? (
          <ResponsibleFields control={control} />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            No se requieren datos de responsable (paciente mayor de edad)
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>
          {getStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Atrás
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid}
        >
          {activeStep === steps.length - 1
            ? (isEditing ? 'Actualizar' : 'Crear')
            : 'Siguiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Beneficios Adicionales

**Experiencia de Usuario Mejorada:**
- Stepper divide formulario en pasos manejables
- Validación por sección
- Navegación intuitiva

**Mantenibilidad:**
- Cada sección de campos es un componente independiente
- Fácil agregar nuevos campos
- Fácil modificar validaciones

### Plan de Implementación (1.5 días)

**Día 1: Extraer hooks y componentes**
- [ ] Crear hooks: usePatientForm, useResponsibleValidation, usePostalCodeLookup
- [ ] Crear componentes de campos: PatientBasicInfoFields, PatientContactFields, etc.
- [ ] Testear hooks y componentes

**Día 2 (medio día): Integración con Stepper**
- [ ] Refactorizar PatientFormDialog con Stepper
- [ ] Testear flujo completo
- [ ] Eliminar archivo antiguo

---

## COMPONENTES MEDIOS (500-800 líneas)

### Resumen

| Componente | Líneas | Tiempo Estimado | Prioridad |
|------------|--------|-----------------|-----------|
| HospitalizationPage.tsx | 800 | 1 día | 🟡 MEDIA |
| QuickSalesTab.tsx | 752 | 1 día | 🟡 MEDIA |
| EmployeesPage.tsx | 748 | 0.5 día | 🟡 MEDIA |
| SolicitudFormDialog.tsx | 706 | 1 día | 🟡 MEDIA |
| ProductFormDialog.tsx | 684 | 0.5 día | 🟡 MEDIA |

**Total:** 2-3 días para refactorizar los 5 componentes medios

### Estrategia de Refactorización (Rápida)

Para componentes medios (500-800 líneas), aplicar estrategia simplificada:

1. **Extraer custom hooks** para lógica de negocio (1-2 hooks por componente)
2. **Separar tabs** en componentes individuales (si aplica)
3. **Extraer diálogos pesados** (>200 líneas) en archivos separados
4. **NO reestructurar** completamente como los Top 3

**Ejemplo: EmployeesPage.tsx (748 líneas)**

```
pages/employees/
├── EmployeesPage.tsx           (300 líneas) - Contenedor simplificado
├── hooks/
│   └── useEmployees.ts        (100 líneas) - Lógica de CRUD
├── components/
│   ├── EmployeesTable.tsx     (200 líneas) - Tabla
│   └── EmployeeFormDialog.tsx (150 líneas) - Ya existe como archivo separado
```

Refactorización en **medio día** vs 1.5 días para Top 3.

---

## MÉTRICAS DE ÉXITO

### Pre-Refactorización

| Métrica | Valor Actual |
|---------|--------------|
| Componentes >700 líneas | 6 |
| Componentes >500 líneas | 12 |
| Línea promedio por componente | 320 |
| Tests para God Components | 0 |
| Tiempo para entender componente | 30-60 min |
| Tiempo para modificar | 2-4 horas |
| Merge conflicts frecuencia | Alta |

### Post-Refactorización (Objetivo)

| Métrica | Valor Objetivo |
|---------|----------------|
| Componentes >700 líneas | 0 |
| Componentes >500 líneas | 0 |
| Línea promedio por componente | 150 |
| Tests para God Components | 80% coverage |
| Tiempo para entender componente | 5-10 min |
| Tiempo para modificar | 30-60 min |
| Merge conflicts frecuencia | Baja |

---

## PLAN DE EJECUCIÓN COMPLETO

### FASE 1: Top 3 God Components (4 días)

**Semana 1:**
- Día 1-2: HistoryTab.tsx (1,094 líneas)
- Día 3-4: AdvancedSearchTab.tsx (984 líneas)

**Semana 2:**
- Día 1-2: PatientFormDialog.tsx (944 líneas)

### FASE 2: Componentes Medios (3 días)

**Semana 2:**
- Día 3: HospitalizationPage.tsx (800 líneas)
- Día 4: QuickSalesTab.tsx (752 líneas)

**Semana 3:**
- Día 1: EmployeesPage.tsx (748 líneas)
- Día 2: SolicitudFormDialog.tsx (706 líneas)
- Día 3: ProductFormDialog.tsx (684 líneas)

### FASE 3: Testing y Documentación (2 días)

**Semana 3:**
- Día 4: Testing exhaustivo de componentes refactorizados
- Día 5: Documentación y guías de uso

**Total: 2-3 semanas**

---

## PREVENCIÓN FUTURA

### 1. Regla de Líneas Máximas

Configurar ESLint:

```json
// .eslintrc.json
{
  "rules": {
    "max-lines": ["error", {
      "max": 300,
      "skipBlankLines": true,
      "skipComments": true
    }],
    "max-lines-per-function": ["warn", {
      "max": 50,
      "skipBlankLines": true,
      "skipComments": true
    }]
  }
}
```

### 2. Code Review Checklist

- [ ] ¿El componente tiene <300 líneas?
- [ ] ¿El componente tiene una responsabilidad única?
- [ ] ¿La lógica de negocio está en un hook?
- [ ] ¿Los sub-componentes grandes están extraídos?
- [ ] ¿El componente es testeable?

### 3. Template de Componente

Crear template en `.claude/templates/component-template.tsx` con estructura recomendada.

### 4. Monitoreo Continuo

Script para detectar God Components:

```bash
#!/bin/bash
# detect-god-components.sh

echo "Componentes con más de 500 líneas:"
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | awk '$1 > 500 {print $0}' | head -20
```

Ejecutar semanalmente en CI/CD.

---

**FIN DEL PLAN DE REFACTORIZACIÓN**

**Próximos pasos:**
1. Aprobar plan y asignar recursos
2. Comenzar con HistoryTab.tsx (Top 1)
3. Iterar con review después de cada componente
4. Celebrar al completar 🎉
