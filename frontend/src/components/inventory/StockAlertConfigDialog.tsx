import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Typography,
  Box,
  Divider,
  Alert,
  Grid,
  InputAdornment,
  Slider,
  Paper
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  RestoreFromTrash as ResetIcon
} from '@mui/icons-material';

import { stockAlertService } from '@/services/stockAlertService';

interface StockAlertConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const StockAlertConfigDialog: React.FC<StockAlertConfigDialogProps> = ({
  open,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState(stockAlertService.getConfig());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(stockAlertService.getConfig());
      setHasChanges(false);
    }
  }, [open]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    stockAlertService.updateConfig(config);
    setHasChanges(false);
    onSave();
    onClose();
  };

  const handleReset = () => {
    const defaultConfig = {
      enableLowStockAlerts: true,
      enableExpirationAlerts: true,
      lowStockThresholdType: 'absolute' as const,
      lowStockThresholdValue: 10,
      expirationWarningDays: 30,
      criticalExpirationDays: 7
    };
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')) {
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Configuración de Alertas de Stock
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configura los parámetros para generar alertas automáticas de stock bajo y productos próximos a vencer.
        </Typography>

        <Grid container spacing={3}>
          {/* Alertas de Stock */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📦 Alertas de Stock
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableLowStockAlerts}
                      onChange={(e) => handleConfigChange('enableLowStockAlerts', e.target.checked)}
                    />
                  }
                  label="Activar alertas de stock bajo"
                />
              </Box>

              {config.enableLowStockAlerts && (
                <Box sx={{ ml: 4 }}>
                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <FormLabel component="legend">Tipo de umbral</FormLabel>
                    <RadioGroup
                      value={config.lowStockThresholdType}
                      onChange={(e) => handleConfigChange('lowStockThresholdType', e.target.value)}
                      row
                    >
                      <FormControlLabel
                        value="absolute"
                        control={<Radio />}
                        label="Usar stock mínimo del producto"
                      />
                      <FormControlLabel
                        value="percentage"
                        control={<Radio />}
                        label="Porcentaje sobre stock mínimo"
                      />
                    </RadioGroup>
                  </FormControl>

                  {config.lowStockThresholdType === 'percentage' ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography gutterBottom>
                        Porcentaje adicional sobre stock mínimo: {config.lowStockThresholdValue}%
                      </Typography>
                      <Slider
                        value={config.lowStockThresholdValue}
                        onChange={(_, value) => handleConfigChange('lowStockThresholdValue', value)}
                        min={0}
                        max={100}
                        step={5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 25, label: '25%' },
                          { value: 50, label: '50%' },
                          { value: 75, label: '75%' },
                          { value: 100, label: '100%' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Con {config.lowStockThresholdValue}%, un producto con stock mínimo de 10 unidades 
                        generará alerta cuando tenga {Math.floor(10 * (1 + config.lowStockThresholdValue / 100))} 
                        unidades o menos.
                      </Alert>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unidades adicionales sobre stock mínimo"
                        value={config.lowStockThresholdValue}
                        onChange={(e) => handleConfigChange('lowStockThresholdValue', Number(e.target.value))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">unidades</InputAdornment>
                        }}
                        helperText="Las alertas se generarán cuando el stock esté en: Stock Mínimo + este valor"
                        inputProps={{ min: 0, max: 1000 }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Alertas de Caducidad */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📅 Alertas de Caducidad
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableExpirationAlerts}
                      onChange={(e) => handleConfigChange('enableExpirationAlerts', e.target.checked)}
                    />
                  }
                  label="Activar alertas de productos próximos a vencer"
                />
              </Box>

              {config.enableExpirationAlerts && (
                <Box sx={{ ml: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Días para alerta de advertencia"
                        value={config.expirationWarningDays}
                        onChange={(e) => handleConfigChange('expirationWarningDays', Number(e.target.value))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">días</InputAdornment>
                        }}
                        helperText="Generar advertencia X días antes del vencimiento"
                        inputProps={{ min: 1, max: 365 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Días para alerta crítica"
                        value={config.criticalExpirationDays}
                        onChange={(e) => handleConfigChange('criticalExpirationDays', Number(e.target.value))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">días</InputAdornment>
                        }}
                        helperText="Generar alerta crítica X días antes del vencimiento"
                        inputProps={{ min: 1, max: config.expirationWarningDays }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Los productos generarán:
                    <br />• Advertencias {config.expirationWarningDays} días antes del vencimiento
                    <br />• Alertas críticas {config.criticalExpirationDays} días antes del vencimiento
                    <br />• Alertas de error si ya están vencidos
                  </Alert>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Vista Previa de Configuración
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="body2">
                <strong>Alertas de Stock:</strong> {config.enableLowStockAlerts ? 'Activadas' : 'Desactivadas'}
                {config.enableLowStockAlerts && (
                  <>
                    <br />• Umbral: {config.lowStockThresholdType === 'percentage' 
                      ? `${config.lowStockThresholdValue}% adicional sobre stock mínimo`
                      : `Stock mínimo + ${config.lowStockThresholdValue} unidades`
                    }
                  </>
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Alertas de Caducidad:</strong> {config.enableExpirationAlerts ? 'Activadas' : 'Desactivadas'}
                {config.enableExpirationAlerts && (
                  <>
                    <br />• Advertencia: {config.expirationWarningDays} días antes
                    <br />• Crítica: {config.criticalExpirationDays} días antes
                  </>
                )}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleReset}
          startIcon={<ResetIcon />}
          color="warning"
        >
          Restablecer
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          onClick={handleClose}
          startIcon={<CancelIcon />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={!hasChanges}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockAlertConfigDialog;