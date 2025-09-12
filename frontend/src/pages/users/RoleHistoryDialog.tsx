import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import usersService, { User, RoleHistory } from '../../services/usersService';

interface RoleHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const RoleHistoryDialog: React.FC<RoleHistoryDialogProps> = ({
  open,
  onClose,
  user
}) => {
  const [history, setHistory] = useState<RoleHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadHistory();
    }
  }, [open, user]);

  const loadHistory = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getRoleHistory(user.id);
      setHistory(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError('Error al cargar el historial de cambios');
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

  const getRolColor = (rol: string) => {
    const colors: Record<string, string> = {
      administrador: '#d32f2f',
      medico_especialista: '#1976d2',
      medico_residente: '#2196f3',
      enfermero: '#9c27b0',
      cajero: '#ff9800',
      almacenista: '#4caf50',
      socio: '#795548'
    };
    return colors[rol] || '#757575';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">
            Historial de Cambios de Rol
          </Typography>
        </Box>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Usuario: <strong>{user.username}</strong>
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : history.length === 0 ? (
          <Alert severity="info">
            No hay cambios de rol registrados para este usuario
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cambio de Rol</TableCell>
                  <TableCell>Razón</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={getRolLabel(item.rolAnterior)}
                          size="small"
                          sx={{
                            backgroundColor: getRolColor(item.rolAnterior),
                            color: 'white'
                          }}
                        />
                        <ArrowIcon fontSize="small" color="action" />
                        <Chip
                          label={getRolLabel(item.rolNuevo)}
                          size="small"
                          sx={{
                            backgroundColor: getRolColor(item.rolNuevo),
                            color: 'white'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.razon || (
                        <Typography variant="body2" color="text.secondary">
                          Sin razón especificada
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleHistoryDialog;