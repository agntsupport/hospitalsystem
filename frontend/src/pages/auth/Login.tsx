import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Container,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
  Person,
  Lock,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types/auth.types';

const schema = yup.object().shape({
  username: yup
    .string()
    .required('El nombre de usuario es requerido')
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type FormData = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al montar el componente
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: FormData) => {
    clearError();
    const credentials: LoginCredentials = {
      username: data.username.trim(),
      password: data.password,
    };

    const result = await login(credentials);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'primary.main',
              width: 64,
              height: 64,
            }}
          >
            <LocalHospital fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h4" align="center" color="primary" gutterBottom>
            Sistema Hospitalario
          </Typography>
          
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Ingrese sus credenciales para acceder al sistema
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ width: '100%' }}
          >
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Nombre de usuario"
                  margin="normal"
                  variant="outlined"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </Box>

          {/* Credenciales de prueba */}
          <Box sx={{ mt: 3, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Credenciales de prueba:
            </Typography>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                <strong>Administrador:</strong> admin / admin123
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Cajero:</strong> cajero1 / cajero123
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Enfermero:</strong> enfermero1 / enfermero123
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Especialista:</strong> especialista1 / medico123
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © 2024 Sistema de Gestión Hospitalaria v1.0.0
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;