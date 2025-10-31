import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Avatar
} from '@mui/material';
import {
  PersonSearch as PersonSearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { Patient, GENDER_OPTIONS } from '@/types/patients.types';

interface SearchResultsProps {
  patients: Patient[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  patients,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewPatient,
  onEditPatient
}) => {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }, []);

  const formatPatientName = useCallback((patient: Patient) => {
    return `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}`.trim();
  }, []);

  const getGenderIcon = useCallback((gender: string) => {
    switch (gender) {
      case 'M':
        return <MaleIcon color="info" fontSize="small" />;
      case 'F':
        return <FemaleIcon color="secondary" fontSize="small" />;
      default:
        return <PersonIcon color="action" fontSize="small" />;
    }
  }, []);

  if (patients.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PersonSearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No se encontraron pacientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Intenta modificar los criterios de búsqueda
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Expediente</TableCell>
              <TableCell>Edad</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {getGenderIcon(patient.genero)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPatientName(patient)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {patient.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {patient.numeroExpediente}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {patient.edad} años
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(patient.fechaNacimiento)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={GENDER_OPTIONS[patient.genero]}
                    size="small"
                    variant="outlined"
                    icon={getGenderIcon(patient.genero)}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    {patient.telefono && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" />
                        {patient.telefono}
                      </Typography>
                    )}
                    {patient.email && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" />
                        {patient.email}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {patient.ciudad || 'No especificada'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {patient.estado || ''} {patient.codigoPostal || ''}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => onViewPatient(patient)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar paciente">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEditPatient(patient)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Resultados por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </>
  );
};

export default SearchResults;
