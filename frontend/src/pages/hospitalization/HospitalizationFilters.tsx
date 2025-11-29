// ABOUTME: Componente de filtros de búsqueda para hospitalización
// ABOUTME: Extraído de HospitalizationPage para mejorar mantenibilidad

import React, { memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

interface HospitalizationFiltersProps {
  searchTerm: string;
  selectedStatus: string;
  selectedSpecialty: string;
  selectedSpaceType: string;
  onSearchTermChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSpecialtyChange: (value: string) => void;
  onSpaceTypeChange: (value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
}

const HospitalizationFilters: React.FC<HospitalizationFiltersProps> = ({
  searchTerm,
  selectedStatus,
  selectedSpecialty,
  selectedSpaceType,
  onSearchTermChange,
  onStatusChange,
  onSpecialtyChange,
  onSpaceTypeChange,
  onSearch,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || selectedStatus || selectedSpecialty || selectedSpaceType;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          Filtros de Búsqueda
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar paciente, expediente o diagnóstico"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSearch();
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={selectedStatus}
                label="Estado"
                onChange={(e) => onStatusChange(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="en_observacion">En Observación</MenuItem>
                <MenuItem value="estable">Estable</MenuItem>
                <MenuItem value="critico">Crítico</MenuItem>
                <MenuItem value="alta_medica">Alta Médica</MenuItem>
                <MenuItem value="alta_voluntaria">Alta Voluntaria</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Especialidad</InputLabel>
              <Select
                value={selectedSpecialty}
                label="Especialidad"
                onChange={(e) => onSpecialtyChange(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Cardiología">Cardiología</MenuItem>
                <MenuItem value="Ginecología">Ginecología y Obstetricia</MenuItem>
                <MenuItem value="Neumología">Neumología</MenuItem>
                <MenuItem value="Medicina Interna">Medicina Interna</MenuItem>
                <MenuItem value="Cirugía General">Cirugía General</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Espacio</InputLabel>
              <Select
                value={selectedSpaceType}
                label="Tipo de Espacio"
                onChange={(e) => onSpaceTypeChange(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="habitacion">🛏️ Habitaciones</MenuItem>
                <MenuItem value="consultorio">🏥 Consultorios</MenuItem>
                <MenuItem value="quirofano">⚕️ Quirófanos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={onSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Buscar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onClearFilters}
            >
              Limpiar Filtros
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(HospitalizationFilters);
