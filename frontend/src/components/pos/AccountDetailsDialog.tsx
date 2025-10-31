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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

import { PatientAccount } from '@/types/pos.types';
import { ATTENTION_TYPE_LABELS } from '@/utils/constants';

interface QuickSale {
  id: number;
  numeroVenta: string;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  cajero: {
    id: number;
    username: string;
  };
  fecha: string;
  observaciones?: string;
  items: Array<{
    tipo: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

interface AccountDetailsDialogProps {
  accountDetailsOpen: boolean;
  saleDetailsOpen: boolean;
  selectedAccount: PatientAccount | null;
  selectedSale: QuickSale | null;
  onCloseAccountDetails: () => void;
  onCloseSaleDetails: () => void;
}

const AccountDetailsDialog: React.FC<AccountDetailsDialogProps> = ({
  accountDetailsOpen,
  saleDetailsOpen,
  selectedAccount,
  selectedSale,
  onCloseAccountDetails,
  onCloseSaleDetails
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
    <>
      {/* Dialog de detalles de cuenta */}
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

      {/* Dialog de detalles de venta rápida */}
      <Dialog
        open={saleDetailsOpen}
        onClose={onCloseSaleDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon />
          Detalles de la Venta {selectedSale?.numeroVenta}
        </DialogTitle>

        <DialogContent>
          {selectedSale && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información de la Venta
                  </Typography>
                  <Typography variant="body2">
                    <strong>Número:</strong> {selectedSale.numeroVenta}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fecha:</strong> {formatDate(selectedSale.fecha)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cajero:</strong> {selectedSale.cajero.username}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información de Pago
                  </Typography>
                  <Typography variant="body2">
                    <strong>Método:</strong> {selectedSale.metodoPago.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total:</strong> {formatCurrency(selectedSale.total)}
                  </Typography>
                  {selectedSale.metodoPago === 'efectivo' && (
                    <>
                      <Typography variant="body2">
                        <strong>Recibido:</strong> {formatCurrency(selectedSale.montoRecibido)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Cambio:</strong> {formatCurrency(selectedSale.cambio)}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Items Vendidos
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSale.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip
                            label={item.tipo.toUpperCase()}
                            size="small"
                            color={item.tipo === 'servicio' ? 'primary' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(item.precioUnitario)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(selectedSale.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedSale.observaciones && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Observaciones:</Typography>
                  <Typography variant="body2">{selectedSale.observaciones}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onCloseSaleDetails}>
            Cerrar
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />}>
            Imprimir Recibo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AccountDetailsDialog;
