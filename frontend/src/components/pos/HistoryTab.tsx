import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  Grid,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Filter as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import { useAccountHistory } from '@/hooks/useAccountHistory';
import AccountHistoryList from './AccountHistoryList';
import AccountDetailsDialog from './AccountDetailsDialog';

interface HistoryTabProps {
  onRefresh?: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onRefresh }) => {
  const {
    closedAccounts,
    expandedAccount,
    selectedAccount,
    accountDetailsOpen,
    setAccountDetailsOpen,
    loading,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    page,
    setPage,
    totalPages,
    loadClosedAccounts,
    handleExpandAccount,
    handleViewDetails,
    handleApplyFilters,
    handleClearFilters,
    handleExportData
  } = useAccountHistory();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        {/* Header con controles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Historial de Cuentas Cerradas
            </Typography>
            <Chip
              label={`${closedAccounts.length} cuentas`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualizar">
              <IconButton onClick={loadClosedAccounts} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filtros">
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar">
              <IconButton onClick={handleExportData} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Panel de filtros */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon fontSize="small" />
                Filtros de Búsqueda
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={filters.fechaInicio || null}
                    onChange={(date) => setFilters({ ...filters, fechaInicio: date || undefined })}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Fecha Fin"
                    value={filters.fechaFin || null}
                    onChange={(date) => setFilters({ ...filters, fechaFin: date || undefined })}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Nombre del Paciente"
                    value={filters.pacienteNombre || ''}
                    onChange={(e) => setFilters({ ...filters, pacienteNombre: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Tipo de Atención</InputLabel>
                    <Select
                      value={filters.tipoAtencion || ''}
                      onChange={(e) => setFilters({ ...filters, tipoAtencion: e.target.value })}
                      label="Tipo de Atención"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="consulta_general">Consulta General</MenuItem>
                      <MenuItem value="urgencia">Urgencia</MenuItem>
                      <MenuItem value="hospitalizacion">Hospitalización</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  size="small"
                >
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  size="small"
                >
                  Aplicar Filtros
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Collapse>

        {/* Lista de cuentas cerradas */}
        <Card>
          <AccountHistoryList
            accounts={closedAccounts}
            expandedAccount={expandedAccount}
            onExpandAccount={handleExpandAccount}
            onViewDetails={handleViewDetails}
            loading={loading}
          />

          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Card>

        {/* Diálogo de detalles */}
        <AccountDetailsDialog
          accountDetailsOpen={accountDetailsOpen}
          selectedAccount={selectedAccount}
          onCloseAccountDetails={() => setAccountDetailsOpen(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default HistoryTab;
