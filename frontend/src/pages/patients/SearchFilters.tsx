import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

import { PatientFilters, GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, BLOOD_TYPES } from '@/types/patients.types';

interface SearchFiltersProps {
  filters: PatientFilters;
  onFilterChange: (field: keyof PatientFilters, value: string | number | boolean) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
  setFilters: React.Dispatch<React.SetStateAction<PatientFilters>>;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onClear,
  loading,
  setFilters
}) => {
  return (
    <>
      {/* Búsqueda General */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Búsqueda General</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar por nombre, apellido o expediente"
                value={filters.search || ''}
                onChange={(e) => onFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Ej: Juan Pérez, EXP-001"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  value={filters.genero || ''}
                  label="Género"
                  onChange={(e) => onFilterChange('genero', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(GENDER_OPTIONS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.activo !== undefined ? filters.activo.toString() : ''}
                  label="Estado"
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setFilters(prev => ({ ...prev, activo: undefined }));
                    } else {
                      onFilterChange('activo', e.target.value === 'true');
                    }
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Datos Demográficos */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Datos Demográficos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Edad mínima"
                type="number"
                value={filters.edadMin || ''}
                onChange={(e) => onFilterChange('edadMin', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Edad máxima"
                type="number"
                value={filters.edadMax || ''}
                onChange={(e) => onFilterChange('edadMax', parseInt(e.target.value) || 120)}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fecha nacimiento desde"
                type="date"
                value={filters.fechaNacimientoDesde || ''}
                onChange={(e) => onFilterChange('fechaNacimientoDesde', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fecha nacimiento hasta"
                type="date"
                value={filters.fechaNacimientoHasta || ''}
                onChange={(e) => onFilterChange('fechaNacimientoHasta', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  value={filters.estadoCivil || ''}
                  label="Estado Civil"
                  onChange={(e) => onFilterChange('estadoCivil', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(CIVIL_STATUS_OPTIONS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ocupación"
                value={filters.ocupacion || ''}
                onChange={(e) => onFilterChange('ocupacion', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Sangre</InputLabel>
                <Select
                  value={filters.tipoSangre || ''}
                  label="Tipo de Sangre"
                  onChange={(e) => onFilterChange('tipoSangre', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {BLOOD_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Información de Contacto */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Información de Contacto</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Teléfono"
                value={filters.telefono || ''}
                onChange={(e) => onFilterChange('telefono', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                value={filters.email || ''}
                onChange={(e) => onFilterChange('email', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Código Postal"
                value={filters.codigoPostal || ''}
                onChange={(e) => onFilterChange('codigoPostal', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ciudad"
                value={filters.ciudad || ''}
                onChange={(e) => onFilterChange('ciudad', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estado"
                value={filters.estado || ''}
                onChange={(e) => onFilterChange('estado', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Información Médica */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Información Médica</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Alergias"
                value={filters.alergias || ''}
                onChange={(e) => onFilterChange('alergias', e.target.value)}
                placeholder="Buscar por tipo de alergia"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Medicamentos actuales"
                value={filters.medicamentosActuales || ''}
                onChange={(e) => onFilterChange('medicamentosActuales', e.target.value)}
                placeholder="Buscar por medicamento"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Antecedentes patológicos"
                value={filters.antecedentesPatologicos || ''}
                onChange={(e) => onFilterChange('antecedentesPatologicos', e.target.value)}
                placeholder="Buscar por enfermedad o condición"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Opciones Especiales */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Opciones Especiales</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.soloMenores === true}
                    onChange={(e) => onFilterChange('soloMenores', e.target.checked)}
                  />
                }
                label="Solo pacientes menores de edad"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.conContactoEmergencia === true}
                    onChange={(e) => onFilterChange('conContactoEmergencia', e.target.checked)}
                  />
                }
                label="Con contacto de emergencia registrado"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.conSeguroMedico === true}
                    onChange={(e) => onFilterChange('conSeguroMedico', e.target.checked)}
                  />
                }
                label="Con seguro médico"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.conAlergias === true}
                    onChange={(e) => onFilterChange('conAlergias', e.target.checked)}
                  />
                }
                label="Con alergias registradas"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Botones de Acción */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          onClick={onSearch}
          disabled={loading || Object.keys(filters).length === 0}
        >
          {loading ? 'Buscando...' : 'Buscar Pacientes'}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ClearIcon />}
          onClick={onClear}
          disabled={loading}
        >
          Limpiar Filtros
        </Button>
      </Box>
    </>
  );
};

export default SearchFilters;
