# Guía de Estilos - Sistema Hospitalario

**Fecha:** 28 de noviembre de 2025
**Versión:** 1.0.0

---

## 1. Estructura de Páginas

### Template PageLayout

Todas las páginas deben usar el componente `PageLayout` para mantener consistencia:

```tsx
import { PageLayout } from '@/components/layout';
import { People as PeopleIcon } from '@mui/icons-material';

const MiPagina = () => (
  <PageLayout
    title="Empleados"
    icon={<PeopleIcon />}
    subtitle="Gestión de personal del hospital"
    actions={
      <Button variant="contained" startIcon={<AddIcon />}>
        Nuevo
      </Button>
    }
    breadcrumbs={[
      { label: 'Inicio', href: '/' },
      { label: 'Empleados' }
    ]}
  >
    {/* Contenido de la página */}
  </PageLayout>
);
```

### Props de PageLayout

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `title` | string | Sí | Título principal de la página |
| `icon` | ReactNode | No | Icono junto al título |
| `actions` | ReactNode | No | Botones de acción en header |
| `children` | ReactNode | Sí | Contenido principal |
| `subtitle` | string | No | Descripción debajo del título |
| `breadcrumbs` | BreadcrumbItem[] | No | Navegación jerárquica |
| `maxWidth` | 'sm'\|'md'\|'lg'\|'xl'\|false | No | Ancho máximo del contenedor |
| `headerContent` | ReactNode | No | Contenido adicional (stats, filtros) |

---

## 2. Manejo de Diálogos

### Hook useDialogState

Para simplificar el manejo de estados de diálogos CRUD:

```tsx
import useDialogState from '@/hooks/useDialogState';
import { Employee } from '@/types';

const MiPagina = () => {
  const dialog = useDialogState<Employee>();

  return (
    <>
      {/* Botón para crear */}
      <Button onClick={dialog.openCreate}>Nuevo Empleado</Button>

      {/* Botón para editar (en tabla) */}
      <IconButton onClick={() => dialog.openEdit(employee)}>
        <EditIcon />
      </IconButton>

      {/* Diálogo */}
      <EmployeeFormDialog
        open={dialog.isOpen}
        mode={dialog.mode}
        employee={dialog.selectedItem}
        onClose={dialog.close}
      />
    </>
  );
};
```

### API del Hook

| Método/Propiedad | Tipo | Descripción |
|------------------|------|-------------|
| `isOpen` | boolean | Estado de apertura |
| `mode` | 'create'\|'edit'\|'view'\|'delete'\|'confirm' | Modo actual |
| `selectedItem` | T \| null | Item seleccionado |
| `openCreate()` | function | Abre en modo crear |
| `openEdit(item)` | function | Abre en modo editar |
| `openView(item)` | function | Abre en modo ver |
| `openDelete(item)` | function | Abre en modo eliminar |
| `close()` | function | Cierra el diálogo |
| `reset()` | function | Cierra y resetea estado |

---

## 3. Manejo de Notificaciones

### Hook useNotification

Usar **únicamente** el hook `useNotification` para todas las notificaciones:

```tsx
import { useNotification } from '@/hooks/useNotification';

const MiComponente = () => {
  const { showSuccess, showError, showWarning, showInfo, showLoading, updateToast } = useNotification();

  const handleSave = async () => {
    const toastId = showLoading('Guardando...');

    try {
      await saveData();
      updateToast(toastId, 'Guardado exitosamente', 'success');
    } catch (error) {
      updateToast(toastId, 'Error al guardar', 'error');
    }
  };

  return (
    <Button onClick={handleSave}>Guardar</Button>
  );
};
```

### Tipos de Notificación

| Método | Uso | Duración Default |
|--------|-----|------------------|
| `showSuccess` | Operaciones exitosas | 3 segundos |
| `showError` | Errores | 5 segundos |
| `showWarning` | Advertencias | 4 segundos |
| `showInfo` | Información general | 3 segundos |
| `showLoading` | Operaciones async | Manual |

**Prohibido:** Usar `Alert`, `Snackbar` o `toast` directamente.

---

## 4. Colores y Temas

### Colores de Acciones

| Acción | Color MUI | Variante | Ejemplo |
|--------|-----------|----------|---------|
| Crear/Agregar | `primary` | `contained` | `<Button color="primary" variant="contained">` |
| Editar | `primary` | `outlined` | `<Button color="primary" variant="outlined">` |
| Ver/Detalle | `info` | `outlined` | `<Button color="info" variant="outlined">` |
| Eliminar | `error` | `outlined` | `<Button color="error" variant="outlined">` |
| Confirmar | `success` | `contained` | `<Button color="success" variant="contained">` |
| Cancelar | `inherit` | `text` | `<Button color="inherit" variant="text">` |

### Chips de Estado

| Estado | Color | Variante |
|--------|-------|----------|
| Activo/Abierto/Disponible | `success` | `filled` |
| Inactivo/Cerrado | `default` | `outlined` |
| Pendiente/En proceso | `warning` | `filled` |
| Error/Rechazado | `error` | `filled` |
| Completado | `success` | `outlined` |
| Info/Neutral | `info` | `filled` |

---

## 5. Iconografía

### Iconos Estándar por Acción

| Acción | Icono | Import |
|--------|-------|--------|
| Crear | AddIcon | `@mui/icons-material/Add` |
| Editar | EditIcon | `@mui/icons-material/Edit` |
| Ver | VisibilityIcon | `@mui/icons-material/Visibility` |
| Eliminar | DeleteIcon | `@mui/icons-material/Delete` |
| Buscar | SearchIcon | `@mui/icons-material/Search` |
| Filtrar | FilterListIcon | `@mui/icons-material/FilterList` |
| Exportar | DownloadIcon | `@mui/icons-material/Download` |
| Imprimir | PrintIcon | `@mui/icons-material/Print` |
| Refrescar | RefreshIcon | `@mui/icons-material/Refresh` |
| Guardar | SaveIcon | `@mui/icons-material/Save` |
| Cerrar | CloseIcon | `@mui/icons-material/Close` |

---

## 6. Tipografía

### Jerarquía de Texto

| Elemento | Variante MUI | Uso |
|----------|--------------|-----|
| Título de página | `h4` | PageLayout title |
| Título de sección | `h5` | Cards, secciones |
| Título de subsección | `h6` | Sub-cards, acordeones |
| Subtítulo | `subtitle1` | Descripciones |
| Texto principal | `body1` | Contenido general |
| Texto secundario | `body2` | Info adicional |
| Caption | `caption` | Timestamps, metadata |

### Ejemplo

```tsx
<Typography variant="h4">Gestión de Empleados</Typography>
<Typography variant="subtitle1" color="text.secondary">
  Administración del personal del hospital
</Typography>

<Card>
  <Typography variant="h6">Información Personal</Typography>
  <Typography variant="body1">Nombre: Juan Pérez</Typography>
  <Typography variant="caption" color="text.secondary">
    Última actualización: 28/11/2025
  </Typography>
</Card>
```

---

## 7. Tablas

### Estructura Estándar

```tsx
<TableContainer component={Paper} variant="outlined">
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Nombre</TableCell>           {/* Texto: left */}
        <TableCell align="right">Monto</TableCell>      {/* Número: right */}
        <TableCell align="center">Estado</TableCell>    {/* Status: center */}
        <TableCell align="center">Acciones</TableCell>  {/* Acciones: center */}
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id} hover>
          <TableCell>{item.nombre}</TableCell>
          <TableCell align="right">${item.monto.toLocaleString()}</TableCell>
          <TableCell align="center">
            <Chip label={item.estado} color="success" size="small" />
          </TableCell>
          <TableCell align="center">
            <IconButton size="small" onClick={() => dialog.openEdit(item)}>
              <EditIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Reglas de Alineación

| Tipo de Dato | Alineación |
|--------------|------------|
| Texto | `left` |
| Números/Montos | `right` |
| Fechas | `center` |
| Estados (Chips) | `center` |
| Acciones | `center` |
| Booleanos | `center` |

---

## 8. Formularios

### Estructura de Diálogo de Formulario

```tsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>
    {mode === 'create' ? 'Nuevo Empleado' : 'Editar Empleado'}
  </DialogTitle>

  <DialogContent>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nombre"
          required
          error={!!errors.nombre}
          helperText={errors.nombre}
        />
      </Grid>
      {/* Más campos... */}
    </Grid>
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose} color="inherit">
      Cancelar
    </Button>
    <Button
      onClick={handleSubmit}
      variant="contained"
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Guardar'}
    </Button>
  </DialogActions>
</Dialog>
```

### Validación con Yup

```tsx
import * as yup from 'yup';

const schema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  email: yup.string().email('Email inválido').required('El email es requerido'),
  telefono: yup.string().matches(/^\d{10}$/, 'Debe tener 10 dígitos'),
});
```

---

## 9. ABOUTME Comments

Todos los archivos deben iniciar con un comentario ABOUTME de 2 líneas:

```tsx
// ABOUTME: Componente principal de la página de empleados
// Incluye tabla, filtros, formulario de creación/edición y estadísticas
```

---

## 10. Constantes de UI

Usar las constantes definidas en `@/utils/uiConstants.ts`:

```tsx
import {
  BUTTON_CONFIG,
  TABLE_CONFIG,
  TYPOGRAPHY,
  STATUS_CHIP_CONFIG
} from '@/utils/uiConstants';

// Ejemplo de uso
<Button {...BUTTON_CONFIG.CREATE}>Nuevo</Button>
<Table size={TABLE_CONFIG.SIZE}>...</Table>
<Typography variant={TYPOGRAPHY.PAGE_TITLE}>...</Typography>
<Chip {...STATUS_CHIP_CONFIG.ACTIVE} label="Activo" />
```

---

## Checklist de Revisión

Antes de hacer PR, verificar:

- [ ] Página usa `PageLayout`
- [ ] Diálogos usan `useDialogState`
- [ ] Notificaciones usan `useNotification`
- [ ] Colores de acciones correctos
- [ ] Iconos estándar
- [ ] Tipografía correcta
- [ ] Tablas con alineación correcta
- [ ] ABOUTME al inicio del archivo
- [ ] Sin `any` en TypeScript
- [ ] Sin errores de ESLint

---

**Autor:** Claude Code
**Sistema:** Hospital Management System
