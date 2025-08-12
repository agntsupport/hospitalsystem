import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Typography,
  Chip,
  Box,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/lab';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MoneyOff as MoneyOffIcon,
  ExitToApp as ExitToAppIcon,
  Lock as LockIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import auditService, { AuditRecord } from '@/services/auditService';

interface AuditTrailProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: number;
  title?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  title = 'Historial de Cambios'
}) => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && entityId > 0) {
      loadAuditTrail();
    }
  }, [open, entityId, entityType]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditService.getAuditTrail(entityType, entityId);
      setRecords(data);
    } catch (error: any) {
      console.error('Error loading audit trail:', error);
      setError(error.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (operation: string) => {
    const iconName = auditService.getOperationIcon(operation);
    switch (iconName) {
      case 'add': return <AddIcon />;
      case 'edit': return <EditIcon />;
      case 'delete': return <DeleteIcon />;
      case 'money_off': return <MoneyOffIcon />;
      case 'exit_to_app': return <ExitToAppIcon />;
      case 'lock': return <LockIcon />;
      default: return <PersonIcon />;
    }
  };

  const handleExportCSV = () => {
    if (records.length > 0) {
      auditService.exportToCSV(
        records, 
        `auditoria_${entityType}_${entityId}_${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  const renderDataChanges = (record: AuditRecord) => {
    if (!record.datosAnteriores && !record.datosNuevos) return null;

    return (
      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="caption">Ver detalles de cambios</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            {record.datosAnteriores && (
              <Box>
                <Typography variant="subtitle2" color="error">
                  Datos Anteriores:
                </Typography>
                <Paper sx={{ p: 1, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                    {JSON.stringify(record.datosAnteriores, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
            {record.datosNuevos && (
              <Box>
                <Typography variant="subtitle2" color="success.main">
                  Datos Nuevos:
                </Typography>
                <Paper sx={{ p: 1, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                    {JSON.stringify(record.datosNuevos, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {title} - {entityType} #{entityId}
          </Typography>
          <Stack direction="row" spacing={1}>
            {records.length > 0 && (
              <Tooltip title="Exportar a CSV">
                <IconButton size="small" onClick={handleExportCSV}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Historial completo de operaciones realizadas
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography variant="body2">Cargando historial...</Typography>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && records.length === 0 && (
          <Alert severity="info">
            No hay registros de auditoría para esta entidad.
          </Alert>
        )}

        {!loading && !error && records.length > 0 && (
          <Timeline position="alternate">
            {records.map((record, index) => (
              <TimelineItem key={record.id}>
                <TimelineSeparator>
                  <TimelineDot 
                    color={auditService.getOperationColor(record.tipoOperacion)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40
                    }}
                  >
                    {getIcon(record.tipoOperacion)}
                  </TimelineDot>
                  {index < records.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 2,
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        boxShadow: 6
                      }
                    }}
                  >
                    <Stack spacing={1}>
                      {/* Encabezado */}
                      <Box>
                        <Typography variant="h6" component="h3">
                          {auditService.formatOperationType(record.tipoOperacion)}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          <Chip 
                            label={record.usuarioNombre}
                            size="small"
                            icon={<PersonIcon />}
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={record.rolUsuario}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>

                      {/* Fecha y hora */}
                      <Typography color="text.secondary" variant="caption">
                        {new Date(record.createdAt).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </Typography>

                      {/* Motivo */}
                      {record.motivo && (
                        <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Motivo:</strong> {record.motivo}
                          </Typography>
                        </Alert>
                      )}

                      {/* Causa de cancelación */}
                      {record.causaCancelacion && (
                        <Alert severity="warning" variant="outlined">
                          <Typography variant="body2">
                            <strong>Causa:</strong> {record.causaCancelacion.descripcion}
                          </Typography>
                          <Typography variant="caption">
                            Categoría: {record.causaCancelacion.categoria}
                          </Typography>
                        </Alert>
                      )}

                      {/* Dirección IP */}
                      {record.ipAddress && (
                        <Typography variant="caption" color="text.secondary">
                          IP: {record.ipAddress}
                        </Typography>
                      )}

                      {/* Cambios detallados */}
                      {renderDataChanges(record)}
                    </Stack>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>

      <DialogActions sx={{ pt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {records.length} registro{records.length !== 1 ? 's' : ''} encontrado{records.length !== 1 ? 's' : ''}
        </Typography>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditTrail;