import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { SwapHoriz as MovementIcon } from '@mui/icons-material';

interface StockMovementDialogProps {
  open: boolean;
  onClose: () => void;
  onMovementCreated: () => void;
}

const StockMovementDialog: React.FC<StockMovementDialogProps> = ({ open, onClose, onMovementCreated }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MovementIcon />
        Registrar Movimiento de Stock
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          El formulario de movimientos estará disponible próximamente.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockMovementDialog;