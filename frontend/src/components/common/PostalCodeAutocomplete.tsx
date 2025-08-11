import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Grid,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Paper,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { PostalCodeService, PostalCodeInfo } from '@/services/postalCodeService';

interface PostalCodeAutocompleteProps {
  onAddressSelected: (addressInfo: {
    codigoPostal: string;
    estado: string;
    ciudad: string;
    municipio: string;
    colonia?: string;
  }) => void;
  initialPostalCode?: string;
  disabled?: boolean;
}

const PostalCodeAutocomplete: React.FC<PostalCodeAutocompleteProps> = ({
  onAddressSelected,
  initialPostalCode = '',
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialPostalCode);
  const [options, setOptions] = useState<PostalCodeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PostalCodeInfo | null>(null);

  // Buscar cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.length === 0) {
      setOptions([]);
      return;
    }

    setLoading(true);
    
    // Debounce la búsqueda
    const timeoutId = setTimeout(() => {
      let results: PostalCodeInfo[] = [];
      
      // Si parece un código postal (solo números), buscar por código postal
      if (/^\d+$/.test(searchTerm)) {
        results = PostalCodeService.searchPostalCodes(searchTerm, 15);
      } 
      // Si parece texto, buscar por ciudad
      else {
        results = PostalCodeService.findByCiudad(searchTerm, 15);
      }
      
      setOptions(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Buscar información inicial si se proporciona código postal
  useEffect(() => {
    if (initialPostalCode && PostalCodeService.isValidMexicanPostalCode(initialPostalCode)) {
      const info = PostalCodeService.findByPostalCode(initialPostalCode);
      if (info) {
        setSelectedOption(info);
        setSearchTerm(initialPostalCode);
      }
    }
  }, [initialPostalCode]);

  const handleSelectionChange = (event: any, newValue: PostalCodeInfo | null) => {
    setSelectedOption(newValue);
    
    if (newValue) {
      onAddressSelected({
        codigoPostal: newValue.codigoPostal,
        estado: newValue.estado,
        ciudad: newValue.ciudad,
        municipio: newValue.municipio,
        colonia: newValue.colonia.length > 0 ? newValue.colonia[0] : undefined,
      });
    }
  };

  const handleInputChange = (event: any, newInputValue: string) => {
    setSearchTerm(newInputValue);
  };

  return (
    <Box>
      <Autocomplete
        value={selectedOption}
        onChange={handleSelectionChange}
        inputValue={searchTerm}
        onInputChange={handleInputChange}
        options={options}
        loading={loading}
        disabled={disabled}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return `${option.codigoPostal} - ${option.ciudad}, ${option.estado}`;
        }}
        isOptionEqualToValue={(option, value) => option.codigoPostal === value.codigoPostal}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Buscar por Código Postal o Ciudad"
            placeholder="Ej: 44100 o Guadalajara"
            helperText="Escribe un código postal (5 dígitos) o nombre de ciudad"
            InputProps={{
              ...params.InputProps,
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <ListItem {...props} key={option.codigoPostal}>
            <LocationIcon color="primary" sx={{ mr: 2 }} />
            <ListItemText
              primary={
                <Typography variant="body1" fontWeight="medium">
                  {option.codigoPostal} - {option.ciudad}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {option.municipio}, {option.estado}
                  </Typography>
                  {option.colonia.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      {option.colonia.slice(0, 3).map((col, index) => (
                        <Chip
                          key={index}
                          label={col}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                        />
                      ))}
                      {option.colonia.length > 3 && (
                        <Chip
                          label={`+${option.colonia.length - 3} más`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
        )}
        PaperComponent={({ children, ...props }) => (
          <Paper {...props} elevation={8}>
            {options.length === 0 && searchTerm.length > 0 && !loading && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {/^\d+$/.test(searchTerm) 
                    ? 'No se encontraron códigos postales que coincidan'
                    : 'No se encontraron ciudades que coincidan'
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Intenta con: código postal (5 dígitos) o nombre de ciudad
                </Typography>
              </Box>
            )}
            {children}
          </Paper>
        )}
        noOptionsText="Comienza a escribir para buscar..."
      />
      
      {selectedOption && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid', borderColor: '#90caf9' }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            📍 Dirección Seleccionada:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Código Postal:</strong> {selectedOption.codigoPostal}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Estado:</strong> {selectedOption.estado}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Ciudad:</strong> {selectedOption.ciudad}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Municipio:</strong> {selectedOption.municipio}
              </Typography>
            </Grid>
            {selectedOption.colonia.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Colonias disponibles:</strong>
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {selectedOption.colonia.map((col, index) => (
                    <Chip
                      key={index}
                      label={col}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PostalCodeAutocomplete;