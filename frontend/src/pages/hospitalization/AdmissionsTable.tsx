// ABOUTME: Componente de tabla de admisiones hospitalarias
// ABOUTME: Extraído de HospitalizationPage para mejorar mantenibilidad

import React, { memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ExitToApp as ExitToAppIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  SwapHoriz as TransferIcon
} from '@mui/icons-material';
import hospitalizationService from '@/services/hospitalizationService';
import { HospitalAdmission } from '@/types/hospitalization.types';

interface AdmissionsTableProps {
  admissions: HospitalAdmission[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  userRole: string | undefined;
  permisos: {
    puedeCrearIngreso: boolean;
    puedeVerNotasSoap: boolean;
    puedeDarAlta: boolean;
    puedeTrasladar: boolean;
  };
  onNewAdmission: () => void;
  onViewDetails: (admission: HospitalAdmission) => void;
  onOpenMedicalNotes: (admission: HospitalAdmission) => void;
  onViewPatientStatus: (admission: HospitalAdmission) => void;
  onOpenDischarge: (admission: HospitalAdmission) => void;
  onOpenTransfer: (admission: HospitalAdmission) => void;
  onOpenAuditTrail: (admission: HospitalAdmission) => void;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
}

// Helper para determinar info del espacio
const getEspacioInfo = (admission: HospitalAdmission) => {
  if (admission.habitacion) {
    return {
      numero: admission.habitacion.numero,
      tipo: 'Habitación',
      icono: '🛏️',
      detalles: `${admission.habitacion.tipo}${admission.habitacion.piso ? ` • Piso ${admission.habitacion.piso}` : ''}`
    };
  }

  if (admission.consultorio) {
    const isConsultorioGeneral = admission.consultorio.tipo?.toLowerCase().includes('consulta_general') ||
                                 admission.consultorio.tipo?.toLowerCase().includes('general');
    if (isConsultorioGeneral) {
      return {
        numero: admission.consultorio.numero,
        tipo: 'Consultorio General',
        icono: '🏥',
        detalles: ''
      };
    }
    return {
      numero: admission.consultorio.numero,
      tipo: 'Consultorio',
      icono: '🏥',
      detalles: `${admission.consultorio.especialidad || admission.consultorio.tipo || ''}`
    };
  }

  if (admission.quirofano) {
    return {
      numero: admission.quirofano.numero,
      tipo: 'Quirófano',
      icono: '⚕️',
      detalles: `${admission.quirofano.tipo}${admission.quirofano.especialidad ? ` • ${admission.quirofano.especialidad}` : ''}`
    };
  }

  return { numero: '', tipo: '', icono: '', detalles: '' };
};

const AdmissionsTable: React.FC<AdmissionsTableProps> = ({
  admissions,
  loading,
  error,
  totalItems,
  totalPages,
  currentPage,
  userRole,
  permisos,
  onNewAdmission,
  onViewDetails,
  onOpenMedicalNotes,
  onViewPatientStatus,
  onOpenDischarge,
  onOpenTransfer,
  onOpenAuditTrail,
  onPageChange
}) => {
  const getStatusChip = (status: string) => (
    <Chip
      label={hospitalizationService.formatAdmissionStatus(status)}
      color={hospitalizationService.getStatusColor(status)}
      size="small"
    />
  );

  const getGeneralStatusChip = (status: string) => (
    <Chip
      label={hospitalizationService.formatGeneralStatus(status)}
      color={hospitalizationService.getGeneralStatusColor(status)}
      size="small"
      variant="outlined"
    />
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon />
            Pacientes Hospitalizados ({totalItems})
          </Typography>

          {permisos.puedeCrearIngreso && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewAdmission}
              color="primary"
            >
              Nuevo Ingreso
            </Button>
          )}

          {!permisos.puedeCrearIngreso && userRole === 'enfermero' && (
            <Tooltip title="Solo administradores, cajeros y médicos pueden crear ingresos">
              <Box sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.875rem' }}>
                Vista de consulta - Rol: {userRole}
              </Box>
            </Tooltip>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : admissions.length === 0 ? (
          <Alert severity="info">
            No se encontraron pacientes hospitalizados con los filtros seleccionados.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Espacio Asignado</TableCell>
                    <TableCell>Diagnóstico</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Médico Tratante</TableCell>
                    <TableCell>Ingreso</TableCell>
                    <TableCell>Estancia</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Estado General</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admissions.map((admission) => {
                    const espacioInfo = getEspacioInfo(admission);

                    return (
                      <TableRow key={admission.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {admission.paciente.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {admission.paciente.numeroExpediente} • {admission.numeroIngreso}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span style={{ fontSize: '1.2rem' }}>{espacioInfo.icono}</span>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {espacioInfo.numero}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {espacioInfo.detalles ? `${espacioInfo.tipo} • ${espacioInfo.detalles}` : espacioInfo.tipo}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {admission.diagnosticoIngreso}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {admission.especialidad}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Typography variant="body2" fontWeight="medium">
                            {admission.medicoTratante.nombre}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {admission.medicoTratante.especialidad}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {hospitalizationService.formatDate(admission.fechaIngreso)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {admission.horaIngreso}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {(() => {
                              const dias = admission.diasEstancia ?? hospitalizationService.calculateStayDays(admission.fechaIngreso, admission.fechaAlta);
                              return dias === 0 ? '< 1 día' : `${dias} día${dias > 1 ? 's' : ''}`;
                            })()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {hospitalizationService.formatAdmissionType(admission.tipoHospitalizacion)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {getStatusChip(admission.estado)}
                        </TableCell>

                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          {getGeneralStatusChip(admission.estadoGeneral)}
                        </TableCell>

                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Ver Detalle">
                              <IconButton
                                size="small"
                                onClick={() => onViewDetails(admission)}
                                aria-label="Ver detalle de hospitalización"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>

                            {permisos.puedeVerNotasSoap ? (
                              <Tooltip title="Notas Médicas SOAP">
                                <IconButton
                                  size="small"
                                  onClick={() => onOpenMedicalNotes(admission)}
                                  color="primary"
                                  aria-label="Ver notas médicas SOAP"
                                >
                                  <AssignmentIcon />
                                </IconButton>
                              </Tooltip>
                            ) : userRole === 'cajero' ? (
                              <Tooltip title="Estado del Paciente (Solo consulta)">
                                <IconButton
                                  size="small"
                                  onClick={() => onViewPatientStatus(admission)}
                                  color="info"
                                  aria-label="Ver estado del paciente"
                                >
                                  <AssignmentIcon />
                                </IconButton>
                              </Tooltip>
                            ) : null}

                            {!admission.fechaAlta && (
                              <>
                                {permisos.puedeTrasladar && (
                                  <Tooltip title="Trasladar a otra ubicación">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => onOpenTransfer(admission)}
                                      aria-label="Trasladar paciente a otra ubicación"
                                    >
                                      <TransferIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    aria-label="Editar hospitalización"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>

                                {permisos.puedeDarAlta ? (
                                  <Tooltip title="Dar de Alta">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => onOpenDischarge(admission)}
                                      aria-label="Dar de alta al paciente"
                                    >
                                      <ExitToAppIcon />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Solo médicos pueden dar de alta">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled
                                        aria-label="Dar de alta (requiere permisos)"
                                      >
                                        <ExitToAppIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}
                              </>
                            )}

                            <Tooltip title="Historial de cambios">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => onOpenAuditTrail(admission)}
                                aria-label="Ver historial de cambios"
                              >
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={onPageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(AdmissionsTable);
