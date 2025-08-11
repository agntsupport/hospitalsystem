import React from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

interface PaymentsTabProps {
  onDataChange: () => void;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ onDataChange }) => {
  return (
    <Box>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PaymentIcon color="primary" />
        Gestión de Pagos
      </Typography>

      <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ConstructionIcon />
        Esta funcionalidad estará disponible próximamente. Los pagos se pueden registrar desde la pestaña de Facturas.
      </Alert>
    </Box>
  );
};

export default PaymentsTab;