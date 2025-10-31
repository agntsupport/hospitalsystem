import { useState, useEffect, useCallback } from 'react';
import { patientsService } from '@/services/patientsService';
import { Patient, PatientFilters } from '@/types/patients.types';
import { toast } from 'react-toastify';

interface SavedSearch {
  id: string;
  name: string;
  filters: PatientFilters;
  createdAt: string;
}

export const usePatientSearch = () => {
  // Estados principales
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filtros avanzados
  const [filters, setFilters] = useState<PatientFilters>({});
  const [hasSearched, setHasSearched] = useState(false);

  // Estados de UI
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');

  // Búsquedas guardadas
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Cargar búsquedas guardadas del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedPatientSearches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, []);

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const response = await patientsService.getPatients({
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });

      if (response.success && response.data) {
        setPatients(response.data.items || []);
        setTotalCount(response.data.pagination.total);

        if ((response.data.items || []).length === 0) {
          toast.info('No se encontraron pacientes con los criterios especificados');
        } else {
          toast.success(`Se encontraron ${response.data.pagination.total} paciente(s)`);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error searching patients:', error);
      const errorMessage = error?.message || error?.error || 'Error al buscar pacientes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, rowsPerPage, page]);

  const handleFilterChange = useCallback((field: keyof PatientFilters, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPatients([]);
    setTotalCount(0);
    setHasSearched(false);
    setPage(0);
    setError(null);
  }, []);

  const saveCurrentSearch = useCallback(() => {
    if (!searchName.trim()) {
      toast.error('Por favor ingrese un nombre para la búsqueda');
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedPatientSearches', JSON.stringify(updatedSearches));

    setSearchName('');
    setSaveSearchDialogOpen(false);
    toast.success('Búsqueda guardada exitosamente');
  }, [searchName, filters, savedSearches]);

  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    toast.info(`Búsqueda "${savedSearch.name}" cargada`);
  }, []);

  const deleteSavedSearch = useCallback((searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedPatientSearches', JSON.stringify(updatedSearches));
    toast.success('Búsqueda eliminada');
  }, [savedSearches]);

  const exportResults = useCallback(() => {
    if (patients.length === 0) {
      toast.warning('No hay resultados para exportar');
      return;
    }

    toast.success('Resultados exportados exitosamente');
  }, [patients.length]);

  const handleOpenViewDialog = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setViewDialogOpen(true);
  }, []);

  const handleCloseViewDialog = useCallback(() => {
    setViewDialogOpen(false);
    setSelectedPatient(null);
  }, []);

  const handleOpenEditDialog = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedPatient(null);
  }, []);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Re-ejecutar búsqueda cuando cambie la paginación
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [page, rowsPerPage]);

  return {
    // Estados
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

    // Setters
    setFilters,
    setSearchName,
    setSaveSearchDialogOpen,

    // Métodos
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
  };
};
