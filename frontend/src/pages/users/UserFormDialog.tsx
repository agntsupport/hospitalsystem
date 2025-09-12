import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  FormHelperText,
  InputAdornment,
  IconButton,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import usersService, { User, CreateUserData, UpdateUserData } from '../../services/usersService';

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  user: User | null;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  user
}) => {
  const [formData, setFormData] = useState<CreateUserData & { password?: string }>({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellidos: '',
    telefono: '',
    rol: 'cajero'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        email: user.email || '',
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        telefono: user.telefono || '',
        rol: user.rol
      });
    } else {
      setFormData({
        username: '',
        password: '',
        email: '',
        nombre: '',
        apellidos: '',
        telefono: '',
        rol: 'cajero'
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!user && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!user && formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (formData.telefono && !isValidPhone(formData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido';
    }

    if (!formData.rol) {
      newErrors.rol = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === user?.username) return;
    
    setCheckingUsername(true);
    try {
      const isAvailable = await usersService.checkUsernameAvailable(username, user?.id);
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, username: 'Este nombre de usuario ya está en uso' }));
      }
    } catch (error) {
      console.error('Error verificando username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || email === user?.email) return;
    
    setCheckingEmail(true);
    try {
      const isAvailable = await usersService.checkEmailAvailable(email, user?.id);
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
      }
    } catch (error) {
      console.error('Error verificando email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (user) {
        // Actualizar usuario existente
        const updateData: UpdateUserData = {
          username: formData.username !== user.username ? formData.username : undefined,
          email: formData.email !== user.email ? formData.email : undefined,
          nombre: formData.nombre !== user.nombre ? formData.nombre : undefined,
          apellidos: formData.apellidos !== user.apellidos ? formData.apellidos : undefined,
          telefono: formData.telefono !== user.telefono ? formData.telefono : undefined,
          rol: formData.rol !== user.rol ? formData.rol : undefined,
          password: formData.password || undefined
        };

        // Eliminar campos undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof UpdateUserData] === undefined) {
            delete updateData[key as keyof UpdateUserData];
          }
        });

        await usersService.updateUser(user.id, updateData);
      } else {
        // Crear nuevo usuario
        await usersService.createUser({
          username: formData.username,
          password: formData.password!,
          email: formData.email || undefined,
          nombre: formData.nombre || undefined,
          apellidos: formData.apellidos || undefined,
          telefono: formData.telefono || undefined,
          rol: formData.rol
        });
      }

      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Error al guardar el usuario' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      administrador: 'Administrador',
      medico_especialista: 'Médico Especialista',
      medico_residente: 'Médico Residente',
      enfermero: 'Enfermero',
      cajero: 'Cajero',
      almacenista: 'Almacenista',
      socio: 'Socio'
    };
    return labels[rol] || rol;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <Typography variant="h6">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de Usuario"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              onBlur={(e) => checkUsernameAvailability(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: checkingUsername && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={user ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password || (user ? 'Dejar vacío para mantener la actual' : '')}
              required={!user}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Apellidos"
              value={formData.apellidos}
              onChange={(e) => handleChange('apellidos', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={(e) => checkEmailAvailability(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: checkingEmail && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              error={!!errors.telefono}
              helperText={errors.telefono}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required error={!!errors.rol}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.rol}
                label="Rol"
                onChange={(e: SelectChangeEvent) => handleChange('rol', e.target.value)}
              >
                <MenuItem value="administrador">{getRolLabel('administrador')}</MenuItem>
                <MenuItem value="medico_especialista">{getRolLabel('medico_especialista')}</MenuItem>
                <MenuItem value="medico_residente">{getRolLabel('medico_residente')}</MenuItem>
                <MenuItem value="enfermero">{getRolLabel('enfermero')}</MenuItem>
                <MenuItem value="cajero">{getRolLabel('cajero')}</MenuItem>
                <MenuItem value="almacenista">{getRolLabel('almacenista')}</MenuItem>
                <MenuItem value="socio">{getRolLabel('socio')}</MenuItem>
              </Select>
              {errors.rol && <FormHelperText>{errors.rol}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || checkingUsername || checkingEmail}
        >
          {loading ? <CircularProgress size={24} /> : (user ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormDialog;