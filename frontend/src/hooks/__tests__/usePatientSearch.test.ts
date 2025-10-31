import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientSearch } from '../usePatientSearch';
import { patientsService } from '@/services/patientsService';
import { toast } from 'react-toastify';
import { Patient } from '@/types/patients.types';

// Mock dependencies
jest.mock('@/services/patientsService');
jest.mock('react-toastify');

const mockedPatientsService = patientsService as jest.Mocked<typeof patientsService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('usePatientSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should initialize with default state values', () => {
      const { result } = renderHook(() => usePatientSearch());

      expect(result.current.patients).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.totalCount).toBe(0);
      expect(result.current.page).toBe(0);
      expect(result.current.rowsPerPage).toBe(25);
      expect(result.current.filters).toEqual({});
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.selectedPatient).toBeNull();
      expect(result.current.viewDialogOpen).toBe(false);
      expect(result.current.editDialogOpen).toBe(false);
      expect(result.current.saveSearchDialogOpen).toBe(false);
      expect(result.current.searchName).toBe('');
      expect(result.current.savedSearches).toEqual([]);
    });

    it('should load saved searches from localStorage on mount', () => {
      const savedSearches = [
        {
          id: '1',
          name: 'Test Search',
          filters: { search: 'Juan' },
          createdAt: '2025-10-31T00:00:00.000Z'
        }
      ];

      localStorageMock.setItem('savedPatientSearches', JSON.stringify(savedSearches));

      const { result } = renderHook(() => usePatientSearch());

      expect(result.current.savedSearches).toEqual(savedSearches);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('savedPatientSearches', 'invalid json');

      const { result } = renderHook(() => usePatientSearch());

      expect(result.current.savedSearches).toEqual([]);
    });

    it('should handle missing localStorage data', () => {
      const { result } = renderHook(() => usePatientSearch());

      expect(result.current.savedSearches).toEqual([]);
    });
  });

  describe('handleSearch', () => {
    const mockPatients: Patient[] = [
      {
        id: 1,
        numeroExpediente: 'EXP001',
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      },
      {
        id: 2,
        numeroExpediente: 'EXP002',
        nombre: 'María',
        apellidoPaterno: 'López',
        fechaNacimiento: '1985-05-15',
        edad: 40,
        genero: 'F',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      }
    ];

    it('should search patients successfully', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: mockPatients,
          pagination: { total: 2, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.patients).toEqual(mockPatients);
        expect(result.current.totalCount).toBe(2);
        expect(result.current.hasSearched).toBe(true);
        expect(result.current.loading).toBe(false);
      });

      expect(mockedToast.success).toHaveBeenCalledWith('Se encontraron 2 paciente(s)');
    });

    it('should apply filters correctly in search', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setFilters({
          search: 'Juan',
          genero: 'M',
          edadMin: 18
        });
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith({
          search: 'Juan',
          genero: 'M',
          edadMin: 18,
          limit: 25,
          offset: 0
        });
      });
    });

    it('should apply pagination parameters', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 2, limit: 10, offset: 10 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleChangePage(null, 1); // Page 2 (0-indexed)
        result.current.handleChangeRowsPerPage({ target: { value: '10' } } as any);
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 10,
            offset: 10 // page 1 * rowsPerPage 10
          })
        );
      });
    });

    it('should show info toast when no patients found', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(mockedToast.info).toHaveBeenCalledWith(
          'No se encontraron pacientes con los criterios especificados'
        );
      });
    });

    it('should handle API error during search', async () => {
      const error = new Error('Network error');
      mockedPatientsService.getPatients.mockRejectedValue(error);

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network error');
        expect(mockedToast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('should handle API response with error message', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: false,
        data: null,
        message: 'Invalid parameters'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid parameters');
        expect(mockedToast.error).toHaveBeenCalledWith('Invalid parameters');
      });
    });

    it('should handle error object with nested error property', async () => {
      const error = { error: 'Validation failed' };
      mockedPatientsService.getPatients.mockRejectedValue(error);

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Validation failed');
        expect(mockedToast.error).toHaveBeenCalledWith('Validation failed');
      });
    });

    it('should set loading state correctly during search', async () => {
      mockedPatientsService.getPatients.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { items: [], pagination: { total: 0, page: 1, limit: 25, offset: 0 } },
          message: 'Success'
        }), 100))
      );

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleSearch();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error state before new search', async () => {
      mockedPatientsService.getPatients
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          success: true,
          data: { items: [], pagination: { total: 0, page: 1, limit: 25, offset: 0 } },
          message: 'Success'
        });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.error).toBe('First error');

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('handleFilterChange', () => {
    it('should update filter value', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleFilterChange('search', 'Juan');
      });

      expect(result.current.filters.search).toBe('Juan');
    });

    it('should remove filter when value is empty string', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleFilterChange('search', 'Juan');
      });

      expect(result.current.filters.search).toBe('Juan');

      act(() => {
        result.current.handleFilterChange('search', '');
      });

      expect(result.current.filters.search).toBeUndefined();
    });

    it('should reset page to 0 when filter changes', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleChangePage(null, 5);
      });

      expect(result.current.page).toBe(5);

      act(() => {
        result.current.handleFilterChange('genero', 'M');
      });

      expect(result.current.page).toBe(0);
    });

    it('should handle numeric filter values', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleFilterChange('edadMin', 18);
      });

      expect(result.current.filters.edadMin).toBe(18);
    });

    it('should handle boolean filter values', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleFilterChange('activo', true);
      });

      expect(result.current.filters.activo).toBe(true);
    });
  });

  describe('clearFilters', () => {
    it('should reset all filters and search state', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setFilters({
          search: 'Juan',
          genero: 'M',
          edadMin: 18
        });
        result.current.handleChangePage(null, 2);
      });

      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: { items: [{ id: 1 } as Patient], pagination: { total: 1, page: 1, limit: 25, offset: 0 } },
        message: 'Success'
      });

      act(() => {
        result.current.handleSearch();
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.patients).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.page).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('saveCurrentSearch', () => {
    it('should save search with valid name', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setFilters({ search: 'Juan', genero: 'M' });
        result.current.setSearchName('My Search');
      });

      act(() => {
        result.current.saveCurrentSearch();
      });

      expect(result.current.savedSearches).toHaveLength(1);
      expect(result.current.savedSearches[0]).toMatchObject({
        name: 'My Search',
        filters: { search: 'Juan', genero: 'M' }
      });
      expect(result.current.savedSearches[0].id).toBeDefined();
      expect(result.current.savedSearches[0].createdAt).toBeDefined();
      expect(result.current.searchName).toBe('');
      expect(result.current.saveSearchDialogOpen).toBe(false);
      expect(mockedToast.success).toHaveBeenCalledWith('Búsqueda guardada exitosamente');
    });

    it('should show error when name is empty', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setSearchName('');
      });

      act(() => {
        result.current.saveCurrentSearch();
      });

      expect(result.current.savedSearches).toHaveLength(0);
      expect(mockedToast.error).toHaveBeenCalledWith('Por favor ingrese un nombre para la búsqueda');
    });

    it('should show error when name is only whitespace', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setSearchName('   ');
      });

      act(() => {
        result.current.saveCurrentSearch();
      });

      expect(result.current.savedSearches).toHaveLength(0);
      expect(mockedToast.error).toHaveBeenCalledWith('Por favor ingrese un nombre para la búsqueda');
    });

    it('should trim search name before saving', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setSearchName('  My Search  ');
      });

      act(() => {
        result.current.saveCurrentSearch();
      });

      expect(result.current.savedSearches[0].name).toBe('My Search');
    });

    it('should save to localStorage', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setFilters({ search: 'Juan' });
        result.current.setSearchName('Test Search');
      });

      act(() => {
        result.current.saveCurrentSearch();
      });

      const saved = localStorageMock.getItem('savedPatientSearches');
      expect(saved).toBeDefined();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Test Search');
    });

    it('should preserve existing saved searches', () => {
      const existingSearch = {
        id: '1',
        name: 'Existing',
        filters: {},
        createdAt: '2025-10-30T00:00:00.000Z'
      };

      localStorageMock.setItem('savedPatientSearches', JSON.stringify([existingSearch]));

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setSearchName('New Search');
      });

      act(() => {
        result.current.saveCurrentSearch();
      });

      expect(result.current.savedSearches).toHaveLength(2);
      expect(result.current.savedSearches[0]).toEqual(existingSearch);
    });
  });

  describe('loadSavedSearch', () => {
    it('should load filters from saved search', () => {
      const { result } = renderHook(() => usePatientSearch());

      const savedSearch = {
        id: '1',
        name: 'Test Search',
        filters: { search: 'Juan', genero: 'M', edadMin: 18 },
        createdAt: '2025-10-31T00:00:00.000Z'
      };

      act(() => {
        result.current.loadSavedSearch(savedSearch);
      });

      expect(result.current.filters).toEqual(savedSearch.filters);
      expect(mockedToast.info).toHaveBeenCalledWith('Búsqueda "Test Search" cargada');
    });

    it('should replace current filters', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setFilters({ search: 'Maria', genero: 'F' });
      });

      const savedSearch = {
        id: '1',
        name: 'Juan Search',
        filters: { search: 'Juan', genero: 'M' },
        createdAt: '2025-10-31T00:00:00.000Z'
      };

      act(() => {
        result.current.loadSavedSearch(savedSearch);
      });

      expect(result.current.filters).toEqual({ search: 'Juan', genero: 'M' });
    });
  });

  describe('deleteSavedSearch', () => {
    it('should delete saved search by id', () => {
      const savedSearches = [
        { id: '1', name: 'Search 1', filters: {}, createdAt: '2025-10-31' },
        { id: '2', name: 'Search 2', filters: {}, createdAt: '2025-10-31' },
        { id: '3', name: 'Search 3', filters: {}, createdAt: '2025-10-31' }
      ];

      localStorageMock.setItem('savedPatientSearches', JSON.stringify(savedSearches));

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.deleteSavedSearch('2');
      });

      expect(result.current.savedSearches).toHaveLength(2);
      expect(result.current.savedSearches.find(s => s.id === '2')).toBeUndefined();
      expect(mockedToast.success).toHaveBeenCalledWith('Búsqueda eliminada');
    });

    it('should update localStorage after deletion', () => {
      const savedSearches = [
        { id: '1', name: 'Search 1', filters: {}, createdAt: '2025-10-31' },
        { id: '2', name: 'Search 2', filters: {}, createdAt: '2025-10-31' }
      ];

      localStorageMock.setItem('savedPatientSearches', JSON.stringify(savedSearches));

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.deleteSavedSearch('1');
      });

      const saved = localStorageMock.getItem('savedPatientSearches');
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('2');
    });

    it('should handle deleting non-existent search', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.deleteSavedSearch('non-existent');
      });

      expect(result.current.savedSearches).toEqual([]);
      expect(mockedToast.success).toHaveBeenCalledWith('Búsqueda eliminada');
    });
  });

  describe('exportResults', () => {
    it('should export when patients exist', () => {
      const { result } = renderHook(() => usePatientSearch());

      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 1 } as Patient],
          pagination: { total: 1, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      act(() => {
        result.current.handleSearch();
      });

      waitFor(() => {
        act(() => {
          result.current.exportResults();
        });

        expect(mockedToast.success).toHaveBeenCalledWith('Resultados exportados exitosamente');
      });
    });

    it('should show warning when no patients to export', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.exportResults();
      });

      expect(mockedToast.warning).toHaveBeenCalledWith('No hay resultados para exportar');
    });
  });

  describe('Dialog Management', () => {
    it('should open and close view dialog', () => {
      const { result } = renderHook(() => usePatientSearch());

      const patient: Patient = {
        id: 1,
        numeroExpediente: 'EXP001',
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      };

      act(() => {
        result.current.handleOpenViewDialog(patient);
      });

      expect(result.current.selectedPatient).toEqual(patient);
      expect(result.current.viewDialogOpen).toBe(true);

      act(() => {
        result.current.handleCloseViewDialog();
      });

      expect(result.current.viewDialogOpen).toBe(false);
      expect(result.current.selectedPatient).toBeNull();
    });

    it('should open and close edit dialog', () => {
      const { result } = renderHook(() => usePatientSearch());

      const patient: Patient = {
        id: 1,
        numeroExpediente: 'EXP001',
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M',
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      };

      act(() => {
        result.current.handleOpenEditDialog(patient);
      });

      expect(result.current.selectedPatient).toEqual(patient);
      expect(result.current.editDialogOpen).toBe(true);

      act(() => {
        result.current.handleCloseEditDialog();
      });

      expect(result.current.editDialogOpen).toBe(false);
      expect(result.current.selectedPatient).toBeNull();
    });

    it('should handle save search dialog state', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.setSaveSearchDialogOpen(true);
      });

      expect(result.current.saveSearchDialogOpen).toBe(true);

      act(() => {
        result.current.setSaveSearchDialogOpen(false);
      });

      expect(result.current.saveSearchDialogOpen).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should change page', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleChangePage(null, 3);
      });

      expect(result.current.page).toBe(3);
    });

    it('should change rows per page and reset to page 0', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleChangePage(null, 5);
      });

      expect(result.current.page).toBe(5);

      act(() => {
        result.current.handleChangeRowsPerPage({ target: { value: '50' } } as any);
      });

      expect(result.current.rowsPerPage).toBe(50);
      expect(result.current.page).toBe(0);
    });

    it('should handle various rows per page values', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleChangeRowsPerPage({ target: { value: '10' } } as any);
      });

      expect(result.current.rowsPerPage).toBe(10);

      act(() => {
        result.current.handleChangeRowsPerPage({ target: { value: '100' } } as any);
      });

      expect(result.current.rowsPerPage).toBe(100);
    });
  });

  describe('useEffect - Re-search on Pagination Change', () => {
    it('should re-execute search when page changes after initial search', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(mockedPatientsService.getPatients).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleChangePage(null, 2);
      });

      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledTimes(2);
      });
    });

    it('should re-execute search when rowsPerPage changes after initial search', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(mockedPatientsService.getPatients).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleChangeRowsPerPage({ target: { value: '50' } } as any);
      });

      await waitFor(() => {
        expect(mockedPatientsService.getPatients).toHaveBeenCalledTimes(2);
      });
    });

    it('should not search on pagination change if hasSearched is false', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: { total: 0, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleChangePage(null, 2);
      });

      await waitFor(() => {
        // Should not call getPatients because hasSearched is false
        expect(mockedPatientsService.getPatients).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined pagination in response', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: [],
          pagination: undefined as any
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      // Should not crash
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle null data in response', async () => {
      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: null,
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      // Should handle gracefully (likely throw error)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle multiple rapid filter changes', () => {
      const { result } = renderHook(() => usePatientSearch());

      act(() => {
        result.current.handleFilterChange('search', 'J');
        result.current.handleFilterChange('search', 'Ju');
        result.current.handleFilterChange('search', 'Jua');
        result.current.handleFilterChange('search', 'Juan');
      });

      expect(result.current.filters.search).toBe('Juan');
      expect(result.current.page).toBe(0);
    });

    it('should handle very large patient datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        numeroExpediente: `EXP${i}`,
        nombre: `Patient${i}`,
        apellidoPaterno: 'Test',
        fechaNacimiento: '1990-01-01',
        edad: 35,
        genero: 'M' as const,
        activo: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      }));

      mockedPatientsService.getPatients.mockResolvedValue({
        success: true,
        data: {
          items: largeDataset.slice(0, 25),
          pagination: { total: 1000, page: 1, limit: 25, offset: 0 }
        },
        message: 'Success'
      });

      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.patients).toHaveLength(25);
        expect(result.current.totalCount).toBe(1000);
      });
    });
  });
});
