import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { inventoryService } from '@/services/inventoryService';
import { CreateSupplierRequest, PAYMENT_TERMS } from '@/types/inventory.types';
import { toast } from 'react-toastify';

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSupplierCreated: () => void;
}

const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  open,
  onClose,
  onSupplierCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    razonSocial: '',
    nombreComercial: '',
    rfc: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    contacto: {
      nombre: '',
      cargo: '',
      telefono: '',
      email: ''
    },
    condicionesPago: 'Contado',
    diasCredito: 0
  });

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setError(null);
    setFormData({
      razonSocial: '',
      nombreComercial: '',
      rfc: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      estado: '',
      codigoPostal: '',
      contacto: {
        nombre: '',
        cargo: '',
        telefono: '',
        email: ''
      },
      condicionesPago: 'Contado',
      diasCredito: 0
    });
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreateSupplierRequest],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.razonSocial.trim()) {
      setError('La razón social es requerida');
      return false;
    }

    if (!formData.rfc.trim()) {
      setError('El RFC es requerido');
      return false;
    }

    // Validar formato de RFC (básico)
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
    if (!rfcRegex.test(formData.rfc.toUpperCase())) {
      setError('El formato del RFC no es válido');
      return false;
    }

    // Validar email si se proporciona
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('El formato del email no es válido');
        return false;
      }
    }

    // Validar email de contacto si se proporciona
    if (formData.contacto?.email && formData.contacto.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contacto.email)) {
        setError('El formato del email de contacto no es válido');
        return false;
      }
    }

    // Validar días de crédito
    if (formData.condicionesPago !== 'Contado' && (!formData.diasCredito || formData.diasCredito <= 0)) {
      setError('Los días de crédito deben ser mayor a 0 para condiciones de pago a crédito');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Limpiar campos vacíos
      const cleanFormData = { ...formData };
      
      // Formatear RFC a mayúsculas
      cleanFormData.rfc = cleanFormData.rfc.toUpperCase();
      
      // Remover contacto vacío si no hay datos
      if (!cleanFormData.contacto?.nombre && !cleanFormData.contacto?.telefono && !cleanFormData.contacto?.email) {
        delete cleanFormData.contacto;
      }
      
      // Establecer días de crédito en 0 si es contado
      if (cleanFormData.condicionesPago === 'Contado') {
        cleanFormData.diasCredito = 0;
      }

      const response = await inventoryService.createSupplier(cleanFormData);

      if (response.success) {
        toast.success('Proveedor creado exitosamente');
        onSupplierCreated();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      const errorMessage = error?.message || error?.error || 'Error al crear proveedor';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          Registrar Nuevo Proveedor
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Información Básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información Básica
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Razón Social *"
              value={formData.razonSocial}
              onChange={(e) => handleInputChange('razonSocial', e.target.value)}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="RFC *"
              value={formData.rfc}
              onChange={(e) => handleInputChange('rfc', e.target.value.toUpperCase())}
              required
              inputProps={{ style: { textTransform: 'uppercase' } }}
              placeholder="ABC123456789"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Comercial"
              value={formData.nombreComercial}
              onChange={(e) => handleInputChange('nombreComercial', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="5551234567"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contacto@proveedor.com"
            />
          </Grid>

          {/* Dirección */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Dirección
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              placeholder="Calle, número, colonia"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Ciudad"
              value={formData.ciudad}
              onChange={(e) => handleInputChange('ciudad', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Estado"
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Código Postal"
              value={formData.codigoPostal}
              onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
              placeholder="12345"
            />
          </Grid>

          {/* Contacto */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Contacto Principal (Opcional)
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre del Contacto"
              value={formData.contacto?.nombre || ''}
              onChange={(e) => handleInputChange('contacto.nombre', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cargo"
              value={formData.contacto?.cargo || ''}
              onChange={(e) => handleInputChange('contacto.cargo', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono del Contacto"
              value={formData.contacto?.telefono || ''}
              onChange={(e) => handleInputChange('contacto.telefono', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email del Contacto"
              type="email"
              value={formData.contacto?.email || ''}
              onChange={(e) => handleInputChange('contacto.email', e.target.value)}
            />
          </Grid>

          {/* Condiciones de Pago */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Condiciones de Pago
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Condiciones de Pago</InputLabel>
              <Select
                value={formData.condicionesPago || 'Contado'}
                label="Condiciones de Pago"
                onChange={(e) => handleInputChange('condicionesPago', e.target.value)}
              >
                {PAYMENT_TERMS.map((term) => (
                  <MenuItem key={term} value={term}>
                    {term}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Días de Crédito"
              type="number"
              value={formData.diasCredito || 0}
              onChange={(e) => handleInputChange('diasCredito', parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 365 }}
              disabled={formData.condicionesPago === 'Contado'}
              helperText={formData.condicionesPago === 'Contado' ? 'No aplica para pagos de contado' : ''}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          <CancelIcon sx={{ mr: 1 }} />
          Cancelar
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Guardando...' : 'Guardar Proveedor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierFormDialog;