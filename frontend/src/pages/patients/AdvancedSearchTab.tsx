import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import {
  PersonSearch as PersonSearchIcon,
  FileDownload as ExportIcon,
  Save as SaveIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';

import { usePatientSearch } from '@/hooks/usePatientSearch';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import PatientFormDialog from './PatientFormDialog';
import { GENDER_OPTIONS } from '@/types/patients.types';

interface AdvancedSearchTabProps {
  onStatsChange: () => void;
  onPatientCreated: () => void;
}

const AdvancedSearchTab: React.FC<AdvancedSearchTabProps> = ({ onStatsChange, onPatientCreated }) => {
  const {
    patients,
    loading,
    error,
    totalCount,
    page,
    rowsPerPage,
    filters,
    hasSearched,
    selectedPatient,
    viewDialogOpen,
    editDialogOpen,
    saveSearchDialogOpen,
    searchName,
    savedSearches,
    setFilters,
    setSearchName,
    setSaveSearchDialogOpen,
    handleSearch,
    handleFilterChange,
    clearFilters,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
    exportResults,
    handleOpenViewDialog,
    handleCloseViewDialog,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleChangePage,
    handleChangeRowsPerPage
  } = usePatientSearch();

  const handlePatientUpdated = () => {
    handleSearch();
    onStatsChange();
    onPatientCreated();
    handleCloseEditDialog();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  const formatPatientName = (patient: any) => {
    return `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno || ''}`.trim();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonSearchIcon />
          Búsqueda Avanzada de Pacientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasSearched && patients.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={exportResults}
              size="small"
            >
              Exportar
            </Button>
          )}
          {Object.keys(filters).length > 0 && (
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => setSaveSearchDialogOpen(true)}
              size="small"
            >
              Guardar Búsqueda
            </Button>
          )}
        </Box>
      </Box>

      {/* Búsquedas Guardadas */}
      {savedSearches.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkIcon />
              Búsquedas Guardadas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {savedSearches.map((search) => (
                <Chip
                  key={search.id}
                  label={search.name}
                  onClick={() => loadSavedSearch(search)}
                  onDelete={() => deleteSavedSearch(search.id)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Búsqueda Avanzada */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onClear={clearFilters}
            loading={loading}
            setFilters={setFilters}
          />
        </CardContent>
      </Card>

      {/* Resultados de Búsqueda */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {hasSearched && !loading && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Resultados de Búsqueda ({totalCount} encontrados)
              </Typography>
              {patients.length > 0 && (
                <Chip
                  label={`${patients.length} de ${totalCount}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            <SearchResults
              patients={patients}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onViewPatient={handleOpenViewDialog}
              onEditPatient={handleOpenEditDialog}
            />
          </CardContent>
        </Card>
      )}

      {/* Diálogo para Guardar Búsqueda */}
      <Dialog open={saveSearchDialogOpen} onClose={() => setSaveSearchDialogOpen(false)} closeAfterTransition={false}>
        <DialogTitle>Guardar Búsqueda</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nombre de la búsqueda"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Ej: Pacientes pediátricos con alergias"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveSearchDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveCurrentSearch}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Vista de Paciente */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth closeAfterTransition={false}>
        <DialogTitle>Detalles del Paciente</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nombre Completo</Typography>
                  <Typography variant="body1">{formatPatientName(selectedPatient)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Número de Expediente</Typography>
                  <Typography variant="body1">{selectedPatient.numeroExpediente}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha de Nacimiento</Typography>
                  <Typography variant="body1">{formatDate(selectedPatient.fechaNacimiento)} ({selectedPatient.edad} años)</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Género</Typography>
                  <Typography variant="body1">{GENDER_OPTIONS[selectedPatient.genero]}</Typography>
                </Grid>
                {selectedPatient.tipoSangre && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Tipo de Sangre</Typography>
                    <Typography variant="body1">{selectedPatient.tipoSangre}</Typography>
                  </Grid>
                )}
                {selectedPatient.telefono && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                    <Typography variant="body1">{selectedPatient.telefono}</Typography>
                  </Grid>
                )}
                {selectedPatient.email && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedPatient.email}</Typography>
                  </Grid>
                )}
                {selectedPatient.direccion && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Dirección</Typography>
                    <Typography variant="body1">{selectedPatient.direccion}</Typography>
                    {(selectedPatient.ciudad || selectedPatient.estado) && (
                      <Typography variant="body2" color="text.secondary">
                        {[selectedPatient.ciudad, selectedPatient.estado, selectedPatient.codigoPostal].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                  </Grid>
                )}
                {selectedPatient.alergias && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Alergias</Typography>
                    <Typography variant="body1">{selectedPatient.alergias}</Typography>
                  </Grid>
                )}
                {selectedPatient.contactoEmergencia && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Contacto de Emergencia</Typography>
                    <Typography variant="body1">
                      {selectedPatient.contactoEmergencia.nombre} ({selectedPatient.contactoEmergencia.relacion})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPatient.contactoEmergencia.telefono}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Edición de Paciente */}
      <PatientFormDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onPatientCreated={handlePatientUpdated}
        editingPatient={selectedPatient}
      />
    </Box>
  );
};

export default AdvancedSearchTab;
