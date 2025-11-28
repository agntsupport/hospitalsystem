import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Divider
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import { PatientAccount } from '@/types/pos.types';
import { ATTENTION_TYPE_LABELS } from '@/utils/constants';

interface AccountDetailsDialogProps {
  accountDetailsOpen: boolean;
  selectedAccount: PatientAccount | null;
  onCloseAccountDetails: () => void;
}

const AccountDetailsDialog: React.FC<AccountDetailsDialogProps> = ({
  accountDetailsOpen,
  selectedAccount,
  onCloseAccountDetails
}) => {
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <Dialog
      open={accountDetailsOpen}
      onClose={onCloseAccountDetails}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon />
        Detalles de la Cuenta #{selectedAccount?.id}
      </DialogTitle>

      <DialogContent>
        {selectedAccount && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Información del Paciente
                </Typography>
                <Typography variant="body2">
                  <strong>Nombre:</strong> {selectedAccount.paciente?.nombre} {selectedAccount.paciente?.apellidoPaterno}
                </Typography>
                <Typography variant="body2">
                  <strong>Teléfono:</strong> {selectedAccount.paciente?.telefono}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Información de la Cuenta
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo:</strong> {ATTENTION_TYPE_LABELS[selectedAccount.tipoAtencion]}
                </Typography>
                <Typography variant="body2">
                  <strong>Apertura:</strong> {formatDate(selectedAccount.fechaApertura)}
                </Typography>
                <Typography variant="body2">
                  <strong>Cierre:</strong> {selectedAccount.fechaCierre ? formatDate(selectedAccount.fechaCierre) : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Resumen Financiero
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2">
                  <strong>Servicios:</strong> {formatCurrency(selectedAccount.totalServicios)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  <strong>Productos:</strong> {formatCurrency(selectedAccount.totalProductos)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  <strong>Total:</strong> {formatCurrency(selectedAccount.totalCuenta)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCloseAccountDetails}>
          Cerrar
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountDetailsDialog;
