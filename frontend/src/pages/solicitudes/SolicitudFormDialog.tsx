import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import solicitudesService, { 
  CreateSolicitudData, 
  PrioridadSolicitud 
} from '../../services/solicitudesService';
import { inventoryService } from '../../services/inventoryService';
import { Product } from '../../types/inventory.types';
import { patientsService, Patient } from '../../services/patientsService';
import hospitalizationService from '../../services/hospitalizationService';

interface SolicitudFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

interface ProductoSolicitud {
  productoId: number;
  producto: Product;
  cantidadSolicitada: number;
  observaciones: string;
}

interface CuentaPaciente {
  id: number;
  tipoAtencion: string;
  estado: string;
  fechaApertura: string;
}

const SolicitudFormDialog: React.FC<SolicitudFormDialogProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Estados del formulario
  const [selectedPaciente, setSelectedPaciente] = useState<Patient | null>(null);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaPaciente | null>(null);
  const [prioridad, setPrioridad] = useState<PrioridadSolicitud>('NORMAL');
  const [observaciones, setObservaciones] = useState('');
  const [productos, setProductos] = useState<ProductoSolicitud[]>([]);
  
  // Estados para autocompletado
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [cuentasPaciente, setCuentasPaciente] = useState<CuentaPaciente[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Product[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<Product | null>(null);
  
  const [cantidad, setCantidad] = useState<number>(1);
  const [observacionesProducto, setObservacionesProducto] = useState('');
  
  // Estados de carga y validación
  const [loading, setLoading] = useState(false);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [stockValidation, setStockValidation] = useState<{
    disponible: boolean;
    productos: { productoId: number; stockActual: number; stockSolicitado: number; disponible: boolean }[];
  } | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadPacientes();
      loadProductos();
    }
  }, [open]);

  // Cargar cuentas cuando se selecciona un paciente
  useEffect(() => {
    if (selectedPaciente) {
      loadCuentasPaciente(selectedPaciente.id);
    } else {
      setCuentasPaciente([]);
      setSelectedCuenta(null);
    }
  }, [selectedPaciente]);

  // Validar stock cuando cambian los productos
  useEffect(() => {
    if (productos.length > 0) {
      validateStock();
    } else {
      setStockValidation(null);
    }
  }, [productos]);

  const loadPacientes = async () => {
    try {
      setLoadingPacientes(true);
      // Cargar solo pacientes hospitalizados activos (no dados de alta)
      const response = await hospitalizationService.getActiveHospitalizedPatients();
      
      if (response.success && response.data?.items) {
        // Transformar datos para que sean compatibles con la interfaz Patient
        const pacientesHospitalizados = response.data.items.map((paciente: any) => ({
          id: paciente.id,
          nombre: paciente.nombre,
          apellidoPaterno: paciente.apellidoPaterno || '',
          apellidoMaterno: paciente.apellidoMaterno || '',
          numeroExpediente: paciente.numeroExpediente,
          activo: true,
          // Campos adicionales para mostrar contexto hospitalario
          hospitalizacionId: paciente.hospitalizacionId,
          cuentaId: paciente.cuentaId,
          cuentaPaciente: paciente.cuentaPaciente,
          habitacion: paciente.habitacion,
          estado: paciente.estado
        }));
        
        setPacientes(pacientesHospitalizados);
      } else {
        setPacientes([]);
      }
    } catch (error) {
      console.error('💥 Error cargando pacientes hospitalizados:', error);
      setPacientes([]);
    } finally {
      setLoadingPacientes(false);
    }
  };

  const loadCuentasPaciente = async (pacienteId: number) => {
    try {
      setLoadingCuentas(true);
      
      // Buscar la cuenta asociada a la hospitalización activa de este paciente
      // Primero, verificamos si tenemos información de hospitalización del paciente
      const pacienteSeleccionado = pacientes.find(p => p.id === pacienteId);
      
      if (pacienteSeleccionado && (pacienteSeleccionado as any).cuentaPaciente) {
        // Usar la cuenta completa del paciente hospitalizado
        const cuentaReal = (pacienteSeleccionado as any).cuentaPaciente;
        const cuentaFormateada: CuentaPaciente = {
          id: cuentaReal.id,
          tipoAtencion: cuentaReal.tipoAtencion,
          estado: cuentaReal.estado,
          fechaApertura: cuentaReal.fechaApertura
        };
        
        setCuentasPaciente([cuentaFormateada]);
        setSelectedCuenta(cuentaFormateada);
      } else if (pacienteSeleccionado && (pacienteSeleccionado as any).cuentaId) {
        // Usar el ID de cuenta si existe pero falta información completa
        const cuentaBasica: CuentaPaciente = {
          id: (pacienteSeleccionado as any).cuentaId,
          tipoAtencion: 'hospitalizacion',
          estado: 'abierta',
          fechaApertura: new Date().toISOString()
        };
        
        setCuentasPaciente([cuentaBasica]);
        setSelectedCuenta(cuentaBasica);
      } else {
        setCuentasPaciente([]);
        setSelectedCuenta(null);
      }
    } catch (error) {
      console.error('💥 Error cargando cuentas del paciente:', error);
      // Crear cuenta simulada como respaldo
      const cuentaSimulada: CuentaPaciente = {
        id: pacienteId * 1000,
        tipoAtencion: 'hospitalizacion',
        estado: 'abierta',
        fechaApertura: new Date().toISOString()
      };
      setCuentasPaciente([cuentaSimulada]);
      setSelectedCuenta(cuentaSimulada);
    } finally {
      setLoadingCuentas(false);
    }
  };

  const loadProductos = async () => {
    try {
      setLoadingProductos(true);
      const response = await inventoryService.getProducts({ 
        activo: true, 
        limit: 500 
      });
      
      // Asegurar que sea un array - el backend devuelve response.data?.products || [], no items
      const productos = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.products || response.data?.items || []);
      
      setProductosDisponibles(productos);
    } catch (error) {
      console.error('💥 Error cargando productos:', error);
      setProductosDisponibles([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  const validateStock = async () => {
    try {
      const productosValidacion = productos.map(p => ({
        productoId: p.productoId,
        cantidad: p.cantidadSolicitada
      }));
      
      const validation = await solicitudesService.validarDisponibilidadProductos(productosValidacion);
      setStockValidation(validation);
    } catch (error) {
      console.error('Error validando stock:', error);
    }
  };

  const agregarProducto = () => {
    if (!selectedProducto || cantidad <= 0) {
      return;
    }

    // Verificar si el producto ya está en la lista
    const productoExistente = productos.find(p => p.productoId === selectedProducto.id);
    if (productoExistente) {
      setErrors({ producto: 'Este producto ya está en la solicitud' });
      return;
    }

    const nuevoProducto: ProductoSolicitud = {
      productoId: selectedProducto.id,
      producto: selectedProducto,
      cantidadSolicitada: cantidad,
      observaciones: observacionesProducto
    };

    setProductos([...productos, nuevoProducto]);
    setSelectedProducto(null);
    setCantidad(1);
    setObservacionesProducto('');
    setErrors({});
  };

  const eliminarProducto = (index: number) => {
    const nuevosProductos = productos.filter((_, i) => i !== index);
    setProductos(nuevosProductos);
  };

  const updateCantidadProducto = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) return;
    
    const nuevosProductos = [...productos];
    nuevosProductos[index].cantidadSolicitada = nuevaCantidad;
    setProductos(nuevosProductos);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedPaciente) {
      newErrors.paciente = 'Debe seleccionar un paciente';
    }

    if (!selectedCuenta) {
      newErrors.cuenta = 'Debe seleccionar una cuenta del paciente';
    }

    if (productos.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto';
    }

    // Validar stock
    if (stockValidation && !stockValidation.disponible) {
      newErrors.stock = 'Algunos productos no tienen stock suficiente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const solicitudData: CreateSolicitudData = {
        pacienteId: selectedPaciente!.id,
        cuentaPacienteId: selectedCuenta!.id,
        prioridad,
        observaciones: observaciones || undefined,
        productos: productos.map(p => ({
          productoId: p.productoId,
          cantidadSolicitada: p.cantidadSolicitada,
          observaciones: p.observaciones || undefined
        }))
      };

      await solicitudesService.createSolicitud(solicitudData);
      onSubmit();
      handleClose();
    } catch (error) {
      console.error('Error creando solicitud:', error);
      setErrors({ submit: 'Error al crear la solicitud' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPaciente(null);
    setSelectedCuenta(null);
    setPrioridad('NORMAL');
    setObservaciones('');
    setProductos([]);
    setSelectedProducto(null);
    setCantidad(1);
    setObservacionesProducto('');
    setErrors({});
    setStockValidation(null);
    onClose();
  };

  const getStockInfo = (productoId: number) => {
    if (!stockValidation) return null;
    return stockValidation.productos.find(p => p.productoId === productoId);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon />
          Nueva Solicitud de Productos
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            {/* Información del paciente */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Información del Paciente
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Solo se muestran pacientes actualmente hospitalizados (no dados de alta)
                  </Alert>
                  
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={pacientes}
                      getOptionLabel={(option) => `${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`}
                      value={selectedPaciente}
                      onChange={(_, newValue) => setSelectedPaciente(newValue)}
                      loading={loadingPacientes}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Seleccionar Paciente"
                          error={!!errors.paciente}
                          helperText={errors.paciente}
                          required
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <Box>
                              <Typography variant="body2">
                                {`${option.nombre} ${option.apellidoPaterno} ${option.apellidoMaterno || ''}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Exp: {option.numeroExpediente}
                                {(option as any).habitacion && ` • Hab: ${(option as any).habitacion}`}
                                {(option as any).estado && ` • ${(option as any).estado.charAt(0).toUpperCase() + (option as any).estado.slice(1).replace('_', ' ')}`}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                  </Box>

                  {cuentasPaciente.length > 0 && (
                    <FormControl fullWidth error={!!errors.cuenta}>
                      <InputLabel>Cuenta del Paciente</InputLabel>
                      <Select
                        value={selectedCuenta?.id || ''}
                        label="Cuenta del Paciente"
                        onChange={(e) => {
                          const cuenta = cuentasPaciente.find(c => c.id === e.target.value);
                          setSelectedCuenta(cuenta || null);
                        }}
                        disabled={loadingCuentas}
                      >
                        {cuentasPaciente.map((cuenta) => (
                          <MenuItem key={cuenta.id} value={cuenta.id}>
                            <Box>
                              <Typography variant="body2">
                                {cuenta.tipoAtencion.replace('_', ' ').toUpperCase()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Estado: {cuenta.estado}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Configuración de la solicitud */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuración de la Solicitud
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Prioridad</InputLabel>
                      <Select
                        value={prioridad}
                        label="Prioridad"
                        onChange={(e) => setPrioridad(e.target.value as PrioridadSolicitud)}
                      >
                        <MenuItem value="BAJA">Baja</MenuItem>
                        <MenuItem value="NORMAL">Normal</MenuItem>
                        <MenuItem value="ALTA">Alta</MenuItem>
                        <MenuItem value="URGENTE">Urgente</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones adicionales sobre la solicitud..."
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Sección de productos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon />
            Productos Solicitados
          </Typography>

          {/* Agregar producto */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Agregar Producto
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={productosDisponibles}
                    getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
                    value={selectedProducto}
                    onChange={(_, newValue) => setSelectedProducto(newValue)}
                    loading={loadingProductos}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar Producto"
                        error={!!errors.producto}
                        helperText={errors.producto}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box>
                            <Typography variant="body2">
                              {option.codigo} - {option.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Stock: {option.stockActual} {option.unidadMedida}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    value={observacionesProducto}
                    onChange={(e) => setObservacionesProducto(e.target.value)}
                    placeholder="Opcional..."
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={agregarProducto}
                    disabled={!selectedProducto || cantidad <= 0}
                    startIcon={<AddIcon />}
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de productos agregados */}
          {productos.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Observaciones</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.map((producto, index) => {
                    const stockInfo = getStockInfo(producto.productoId);
                    return (
                      <TableRow key={index}>
                        <TableCell>{producto.producto.codigo}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {producto.producto.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {producto.producto.unidadMedida}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={producto.cantidadSolicitada}
                            onChange={(e) => updateCantidadProducto(index, parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, style: { width: '80px' } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">
                              {stockInfo ? stockInfo.stockActual : producto.producto.stockActual}
                            </Typography>
                            {stockInfo && (
                              <Chip
                                icon={stockInfo.disponible ? <CheckIcon /> : <WarningIcon />}
                                label={stockInfo.disponible ? 'OK' : 'Insuf.'}
                                color={stockInfo.disponible ? 'success' : 'error'}
                                size="small"
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {producto.observaciones || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => eliminarProducto(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Validación de stock */}
          {stockValidation && !stockValidation.disponible && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Algunos productos no tienen stock suficiente. La solicitud se creará pero puede requerir 
                ajustes en las cantidades durante la preparación.
              </Typography>
            </Alert>
          )}

          {errors.productos && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.productos}
            </Alert>
          )}
        </Box>

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || productos.length === 0 || !selectedPaciente || !selectedCuenta}
        >
          {loading ? 'Creando...' : 'Crear Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SolicitudFormDialog;