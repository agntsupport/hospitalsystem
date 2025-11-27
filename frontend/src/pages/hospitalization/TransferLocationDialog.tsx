// ABOUTME: Dialog component for transferring hospitalized patients to new locations
// ABOUTME: Supports transfers between rooms, offices, and operating rooms with automatic charges

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  Hotel as RoomIcon,
  LocalHospital as OfficeIcon,
  MedicalServices as OperatingRoomIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { roomsService } from '@/services/roomsService';
import hospitalizationService from '@/services/hospitalizationService';
import { api } from '@/utils/api';
import { HospitalAdmission } from '@/types/hospitalization.types';

interface TransferLocationDialogProps {
  open: boolean;
  onClose: () => void;
  admission: HospitalAdmission | null;
  onSuccess: () => void;
}

interface Space {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  precioPorDia?: number;
  precioHora?: number;
  especialidad?: string;
}

type SpaceType = 'habitacion' | 'consultorio' | 'quirofano';

const TransferLocationDialog: React.FC<TransferLocationDialogProps> = ({
  open,
  onClose,
  admission,
  onSuccess
}) => {
  // States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [destinationType, setDestinationType] = useState<SpaceType>('habitacion');
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');

  // Available spaces
  const [rooms, setRooms] = useState<Space[]>([]);
  const [offices, setOffices] = useState<Space[]>([]);
  const [operatingRooms, setOperatingRooms] = useState<Space[]>([]);

  // Current location info
  const currentLocation = useCallback(() => {
    if (!admission) return { tipo: '', numero: '', id: 0 };

    if (admission.habitacion) {
      return {
        tipo: 'habitacion',
        numero: admission.habitacion.numero,
        id: admission.habitacion.id
      };
    }
    if (admission.consultorio) {
      return {
        tipo: 'consultorio',
        numero: admission.consultorio.numero,
        id: admission.consultorio.id
      };
    }
    if (admission.quirofano) {
      return {
        tipo: 'quirofano',
        numero: admission.quirofano.numero,
        id: admission.quirofano.id
      };
    }
    return { tipo: '', numero: '', id: 0 };
  }, [admission]);

  // Load available spaces
  const loadSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomsRes, officesRes, orRes] = await Promise.all([
        roomsService.getRooms({ estado: 'disponible' }),
        roomsService.getOffices({ estado: 'disponible' }),
        api.get('/quirofanos?estado=disponible')
      ]);

      if (roomsRes.success && roomsRes.data?.rooms) {
        setRooms(roomsRes.data.rooms.map((r: any) => ({
          id: r.id,
          numero: r.numero,
          tipo: r.tipo,
          estado: r.estado,
          precioPorDia: r.precioPorDia || 0
        })));
      }

      if (officesRes.success && officesRes.data?.offices) {
        setOffices(officesRes.data.offices.map((o: any) => ({
          id: o.id,
          numero: o.numero,
          tipo: o.tipo,
          estado: o.estado,
          especialidad: o.especialidad
        })));
      }

      if (orRes.success && orRes.data?.items) {
        setOperatingRooms(orRes.data.items.map((q: any) => ({
          id: q.id,
          numero: q.numero,
          tipo: q.tipo,
          estado: q.estado,
          precioHora: q.precioHora || 0,
          especialidad: q.especialidad
        })));
      }
    } catch (err: any) {
      console.error('Error loading spaces:', err);
      setError('Error al cargar los espacios disponibles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSpaces();
      // Reset form
      setDestinationType('habitacion');
      setSelectedSpaceId('');
      setMotivo('');
      setError(null);
    }
  }, [open, loadSpaces]);

  const getAvailableSpaces = (): Space[] => {
    const current = currentLocation();

    switch (destinationType) {
      case 'habitacion':
        // Filter out current room if patient is in a room
        return rooms.filter(r => !(current.tipo === 'habitacion' && r.id === current.id));
      case 'consultorio':
        return offices.filter(o => !(current.tipo === 'consultorio' && o.id === current.id));
      case 'quirofano':
        return operatingRooms.filter(q => !(current.tipo === 'quirofano' && q.id === current.id));
      default:
        return [];
    }
  };

  const getSelectedSpace = (): Space | undefined => {
    if (!selectedSpaceId) return undefined;

    switch (destinationType) {
      case 'habitacion':
        return rooms.find(r => r.id === selectedSpaceId);
      case 'consultorio':
        return offices.find(o => o.id === selectedSpaceId);
      case 'quirofano':
        return operatingRooms.find(q => q.id === selectedSpaceId);
      default:
        return undefined;
    }
  };

  const handleSubmit = async () => {
    if (!admission || !selectedSpaceId) {
      toast.error('Debe seleccionar un espacio destino');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: {
        habitacionId?: number;
        consultorioId?: number;
        quirofanoId?: number;
        motivo?: string;
      } = {
        motivo: motivo || undefined
      };

      switch (destinationType) {
        case 'habitacion':
          payload.habitacionId = selectedSpaceId as number;
          break;
        case 'consultorio':
          payload.consultorioId = selectedSpaceId as number;
          break;
        case 'quirofano':
          payload.quirofanoId = selectedSpaceId as number;
          break;
      }

      const response = await api.put(`/hospitalization/admissions/${admission.id}/transfer-location`, payload);

      if (response.success) {
        toast.success(response.message || 'Paciente trasladado exitosamente');
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Error al trasladar al paciente');
        toast.error(response.message || 'Error al trasladar al paciente');
      }
    } catch (err: any) {
      console.error('Error transferring patient:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al trasladar al paciente';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getSpaceTypeIcon = (type: SpaceType) => {
    switch (type) {
      case 'habitacion':
        return <RoomIcon />;
      case 'consultorio':
        return <OfficeIcon />;
      case 'quirofano':
        return <OperatingRoomIcon />;
    }
  };

  const getSpaceTypeLabel = (type: SpaceType) => {
    switch (type) {
      case 'habitacion':
        return 'Habitación';
      case 'consultorio':
        return 'Consultorio';
      case 'quirofano':
        return 'Quirófano';
    }
  };

  const selectedSpace = getSelectedSpace();
  const current = currentLocation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      closeAfterTransition={false}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TransferIcon color="primary" />
          <Typography variant="h6">Trasladar Paciente</Typography>
        </Box>
        {admission && (
          <Typography variant="body2" color="textSecondary">
            {admission.paciente?.nombre || 'Paciente'} • {admission.numeroIngreso}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Current Location Card */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Ubicación Actual
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSpaceTypeIcon(current.tipo as SpaceType)}
                  <Typography variant="h6">
                    {current.numero || 'Sin asignar'}
                  </Typography>
                  <Chip
                    label={getSpaceTypeLabel(current.tipo as SpaceType)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }}>
              <Chip label="Trasladar a" icon={<TransferIcon />} />
            </Divider>

            {/* Destination Type Selection */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Espacio Destino</InputLabel>
                  <Select
                    value={destinationType}
                    label="Tipo de Espacio Destino"
                    onChange={(e) => {
                      setDestinationType(e.target.value as SpaceType);
                      setSelectedSpaceId('');
                    }}
                  >
                    <MenuItem value="habitacion">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoomIcon fontSize="small" />
                        🛏️ Habitación
                      </Box>
                    </MenuItem>
                    <MenuItem value="consultorio">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OfficeIcon fontSize="small" />
                        🏥 Consultorio
                      </Box>
                    </MenuItem>
                    <MenuItem value="quirofano">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OperatingRoomIcon fontSize="small" />
                        ⚕️ Quirófano
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Espacio Destino</InputLabel>
                  <Select
                    value={selectedSpaceId}
                    label="Espacio Destino"
                    onChange={(e) => setSelectedSpaceId(e.target.value as number)}
                    disabled={getAvailableSpaces().length === 0}
                  >
                    {getAvailableSpaces().length === 0 ? (
                      <MenuItem value="" disabled>
                        No hay espacios disponibles
                      </MenuItem>
                    ) : (
                      getAvailableSpaces().map((space) => (
                        <MenuItem key={space.id} value={space.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span>
                              {space.numero} - {space.tipo}
                              {space.especialidad && ` (${space.especialidad})`}
                            </span>
                            {space.precioPorDia && space.precioPorDia > 0 && (
                              <Chip
                                size="small"
                                label={`$${space.precioPorDia}/día`}
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Cost Warning */}
            {selectedSpace && selectedSpace.precioPorDia && selectedSpace.precioPorDia > 0 && (
              <Alert
                severity="info"
                icon={<MoneyIcon />}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  <strong>Cargo automático:</strong> Se generará un cargo de{' '}
                  <strong>${selectedSpace.precioPorDia.toLocaleString('es-MX')}/día</strong> por la habitación{' '}
                  {selectedSpace.numero} ({selectedSpace.tipo}).
                </Typography>
              </Alert>
            )}

            {/* Warning for OR transfers */}
            {destinationType === 'quirofano' && (
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  El traslado a quirófano es temporal. Los cargos se generan al completar la cirugía.
                </Typography>
              </Alert>
            )}

            {/* Motivo field */}
            <TextField
              fullWidth
              label="Motivo del traslado (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              multiline
              rows={2}
              sx={{ mt: 2 }}
              placeholder="Ej: Deterioro del estado del paciente, requiere monitoreo intensivo..."
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedSpaceId || submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : <TransferIcon />}
        >
          {submitting ? 'Trasladando...' : 'Confirmar Traslado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferLocationDialog;
