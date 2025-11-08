import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

import { PatientAccount } from '@/types/pos.types';
import { ATTENTION_TYPE_LABELS } from '@/utils/constants';

interface OpenAccountsListProps {
  accounts: PatientAccount[];
  loading: boolean;
  onAddTransaction: (account: PatientAccount) => void;
  onCloseAccount: (account: PatientAccount) => void;
  onViewAccount: (account: PatientAccount) => void;
  onPartialPayment?: (account: PatientAccount) => void;
  onRefresh: () => void;
}

const OpenAccountsList: React.FC<OpenAccountsListProps> = ({
  accounts,
  loading,
  onAddTransaction,
  onCloseAccount,
  onViewAccount,
  onPartialPayment,
  onRefresh,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttentionTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'consulta_general':
        return 'primary';
      case 'urgencia':
        return 'error';
      case 'hospitalizacion':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSaldoColor = (saldo: number) => {
    // Saldo positivo = saldo a favor del paciente (verde)
    // Saldo negativo = paciente debe dinero (rojo/warning)
    if (saldo > 0) return 'success';  // Verde para saldo a favor
    if (saldo < 0) return 'error';    // Rojo para deuda
    return 'default';                 // Neutro para saldo 0
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AccountIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay cuentas abiertas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Todas las cuentas están cerradas o no hay cuentas registradas
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Actualizar
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Cuentas Abiertas ({accounts.length})
        </Typography>
        <IconButton onClick={onRefresh} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cuenta #</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Médico</TableCell>
              <TableCell>Fecha Apertura</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    #{account.id}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}
                    >
                      {account.paciente ? 
                        `${account.paciente.nombre} ${account.paciente.apellidoPaterno} ${account.paciente.apellidoMaterno || ''}`.trim()
                        : 'Paciente no encontrado'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.paciente?.telefono || 'Sin teléfono'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={ATTENTION_TYPE_LABELS[account.tipoAtencion]}
                    color={getAttentionTypeColor(account.tipoAtencion) as any}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography 
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px'
                    }}
                  >
                    {account.medicoTratante ? 
                      `Dr(a). ${account.medicoTratante.nombre} ${account.medicoTratante.apellidoPaterno}`
                      : 'Sin asignar'
                    }
                  </Typography>
                  {account.medicoTratante?.especialidad && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px',
                        display: 'block'
                      }}
                    >
                      {account.medicoTratante.especialidad}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(account.fechaApertura)}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatCurrency(account.totalCuenta)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}
                  >
                    S: {formatCurrency(account.totalServicios)} | P: {formatCurrency(account.totalProductos)}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Chip
                    label={account.saldoPendiente >= 0 
                      ? `+${formatCurrency(Math.abs(account.saldoPendiente))} A FAVOR`
                      : `${formatCurrency(account.saldoPendiente)} DEBE`
                    }
                    color={getSaldoColor(account.saldoPendiente) as any}
                    size="small"
                    variant={account.saldoPendiente === 0 ? 'filled' : 'outlined'}
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => onViewAccount(account)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => onAddTransaction(account)}
                    >
                      Agregar
                    </Button>
                    {onPartialPayment && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        startIcon={<PaymentIcon />}
                        onClick={() => onPartialPayment(account)}
                      >
                        Pago Parcial
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CloseIcon />}
                      onClick={() => onCloseAccount(account)}
                    >
                      Cerrar
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OpenAccountsList;