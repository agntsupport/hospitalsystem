// ABOUTME: Comprehensive tests for patientsSlice Redux slice - CRUD operations, pagination, filters, stats

import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import patientsReducer, {
  fetchPatients,
  fetchPatientById,
  createPatient,
  updatePatient,
  searchPatients,
  fetchPatientsStats,
  clearError,
  setFilters,
  clearFilters,
  setCurrentPatient,
  clearCurrentPatient
} from '../patientsSlice';
import { Patient } from '@/types/patient.types';

// Mock the api module
jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

import { api } from '@/utils/api';
const mockedApi = api as jest.Mocked<typeof api>;

describe('patientsSlice', () => {
  let store: EnhancedStore;

  const mockPatient: Patient = {
    id: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'García',
    fechaNacimiento: '1990-01-01',
    genero: 'M',
    telefono: '1234567890',
    email: 'juan@example.com',
    activo: true,
    createdAt: '2025-01-01',
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        patients: patientsReducer,
      },
    });

    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().patients;

      expect(state).toEqual({
        patients: [],
        currentPatient: null,
        loading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: {},
        stats: null,
      });
    });
  });

  describe('Synchronous Reducers', () => {
    describe('clearError', () => {
      it('should clear error state', () => {
        // Set error first
        const action = fetchPatients.rejected(
          new Error('Failed'),
          'requestId',
          { pagination: { page: 1, limit: 20 }, filters: {} },
          'Failed to fetch'
        );
        store.dispatch(action);

        expect(store.getState().patients.error).toBe('Failed to fetch');

        store.dispatch(clearError());

        expect(store.getState().patients.error).toBeNull();
      });
    });

    describe('setFilters', () => {
      it('should set filters', () => {
        store.dispatch(setFilters({ search: 'Juan', esMenorEdad: true }));

        const state = store.getState().patients;
        expect(state.filters).toEqual({ search: 'Juan', esMenorEdad: true });
      });

      it('should merge filters', () => {
        store.dispatch(setFilters({ search: 'Juan' }));
        store.dispatch(setFilters({ esMenorEdad: true }));

        const state = store.getState().patients;
        expect(state.filters).toEqual({ search: 'Juan', esMenorEdad: true });
      });
    });

    describe('clearFilters', () => {
      it('should clear all filters', () => {
        store.dispatch(setFilters({ search: 'Juan', esMenorEdad: true }));
        store.dispatch(clearFilters());

        const state = store.getState().patients;
        expect(state.filters).toEqual({});
      });
    });

    describe('setCurrentPatient', () => {
      it('should set current patient', () => {
        store.dispatch(setCurrentPatient(mockPatient));

        const state = store.getState().patients;
        expect(state.currentPatient).toEqual(mockPatient);
      });
    });

    describe('clearCurrentPatient', () => {
      it('should clear current patient', () => {
        store.dispatch(setCurrentPatient(mockPatient));
        store.dispatch(clearCurrentPatient());

        const state = store.getState().patients;
        expect(state.currentPatient).toBeNull();
      });
    });
  });

  describe('Async Thunks - fetchPatients', () => {
    it('should handle fetchPatients pending state', () => {
      const action = fetchPatients.pending('requestId', {
        pagination: { page: 1, limit: 20 },
        filters: {},
      });
      const state = patientsReducer(undefined, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should fetch patients successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          patients: [mockPatient],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(
        fetchPatients({
          pagination: { page: 1, limit: 20 },
          filters: {},
        })
      );

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.patients).toEqual([mockPatient]);
      expect(state.pagination).toEqual(mockResponse.data.pagination);
      expect(state.error).toBeNull();
    });

    it('should handle fetchPatients with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          patients: [mockPatient],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(
        fetchPatients({
          pagination: { page: 1, limit: 20 },
          filters: { search: 'Juan', esMenorEdad: false },
        })
      );

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('search=Juan')
      );
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('esMenorEdad=false')
      );
    });

    it('should handle fetchPatients error', async () => {
      mockedApi.get.mockRejectedValue({ error: 'Error al obtener pacientes' });

      await store.dispatch(
        fetchPatients({
          pagination: { page: 1, limit: 20 },
          filters: {},
        })
      );

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al obtener pacientes');
    });
  });

  describe('Async Thunks - fetchPatientById', () => {
    it('should fetch patient by ID successfully', async () => {
      const mockResponse = {
        success: true,
        data: { patient: mockPatient },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(fetchPatientById({ id: 1 }));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.currentPatient).toEqual(mockPatient);
      expect(state.error).toBeNull();
    });

    it('should fetch patient with history', async () => {
      const mockResponse = {
        success: true,
        data: { patient: { ...mockPatient, history: [] } },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(fetchPatientById({ id: 1, includeHistory: true }));

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('includeHistory=true')
      );
    });

    it('should handle fetchPatientById error', async () => {
      mockedApi.get.mockRejectedValue({ error: 'Error al obtener paciente' });

      await store.dispatch(fetchPatientById({ id: 999 }));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al obtener paciente');
    });
  });

  describe('Async Thunks - createPatient', () => {
    const newPatientData = {
      nombre: 'María',
      apellidoPaterno: 'López',
      fechaNacimiento: '1995-01-01',
      genero: 'F' as const,
      telefono: '9876543210',
    };

    it('should create patient successfully', async () => {
      const createdPatient: Patient = {
        id: 2,
        ...newPatientData,
        activo: true,
        createdAt: '2025-01-01',
      };

      const mockResponse = {
        success: true,
        data: { patient: createdPatient },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      await store.dispatch(createPatient(newPatientData));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.patients).toContainEqual(createdPatient);
      expect(state.currentPatient).toEqual(createdPatient);
      expect(state.error).toBeNull();
    });

    it('should add new patient to beginning of list', async () => {
      const existingPatients = [mockPatient];
      const createdPatient: Patient = {
        id: 2,
        ...newPatientData,
        activo: true,
        createdAt: '2025-01-02',
      };

      const storeWithPatients = configureStore({
        reducer: { patients: patientsReducer },
        preloadedState: {
          patients: {
            patients: existingPatients,
            currentPatient: null,
            loading: false,
            error: null,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            filters: {},
            stats: null,
          },
        },
      });

      const mockResponse = {
        success: true,
        data: { patient: createdPatient },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      await storeWithPatients.dispatch(createPatient(newPatientData));

      const state = storeWithPatients.getState().patients;
      expect(state.patients[0]).toEqual(createdPatient);
      expect(state.patients[1]).toEqual(mockPatient);
    });

    it('should handle createPatient error', async () => {
      mockedApi.post.mockRejectedValue({ error: 'Error al crear paciente' });

      await store.dispatch(createPatient(newPatientData));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al crear paciente');
    });
  });

  describe('Async Thunks - updatePatient', () => {
    const updateData = {
      telefono: '1111111111',
      email: 'newemail@example.com',
    };

    it('should update patient successfully', async () => {
      const updatedPatient: Patient = {
        ...mockPatient,
        ...updateData,
      };

      const storeWithPatients = configureStore({
        reducer: { patients: patientsReducer },
        preloadedState: {
          patients: {
            patients: [mockPatient],
            currentPatient: mockPatient,
            loading: false,
            error: null,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            filters: {},
            stats: null,
          },
        },
      });

      const mockResponse = {
        success: true,
        data: { patient: updatedPatient },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      await storeWithPatients.dispatch(
        updatePatient({ id: 1, data: updateData })
      );

      const state = storeWithPatients.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.patients[0]).toEqual(updatedPatient);
      expect(state.currentPatient).toEqual(updatedPatient);
      expect(state.error).toBeNull();
    });

    it('should not update if patient not in list', async () => {
      const updatedPatient: Patient = {
        id: 999,
        nombre: 'Other',
        apellidoPaterno: 'Patient',
        fechaNacimiento: '2000-01-01',
        genero: 'M',
        telefono: '9999999999',
        activo: true,
        createdAt: '2025-01-01',
      };

      const storeWithPatients = configureStore({
        reducer: { patients: patientsReducer },
        preloadedState: {
          patients: {
            patients: [mockPatient],
            currentPatient: null,
            loading: false,
            error: null,
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            filters: {},
            stats: null,
          },
        },
      });

      const mockResponse = {
        success: true,
        data: { patient: updatedPatient },
      };

      mockedApi.put.mockResolvedValue(mockResponse);

      await storeWithPatients.dispatch(
        updatePatient({ id: 999, data: { telefono: '9999999999' } })
      );

      const state = storeWithPatients.getState().patients;
      expect(state.patients.length).toBe(1);
      expect(state.patients[0]).toEqual(mockPatient);
    });

    it('should handle updatePatient error', async () => {
      mockedApi.put.mockRejectedValue({ error: 'Error al actualizar paciente' });

      await store.dispatch(updatePatient({ id: 1, data: updateData }));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al actualizar paciente');
    });
  });

  describe('Async Thunks - searchPatients', () => {
    it('should search patients successfully', async () => {
      const mockResponse = {
        success: true,
        data: { patients: [mockPatient] },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(searchPatients({ query: 'Juan', limit: 10 }));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle searchPatients error', async () => {
      mockedApi.get.mockRejectedValue({ error: 'Error al buscar pacientes' });

      await store.dispatch(searchPatients({ query: 'Juan' }));

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al buscar pacientes');
    });
  });

  describe('Async Thunks - fetchPatientsStats', () => {
    it('should fetch stats successfully', async () => {
      const mockStats = {
        totalPacientes: 100,
        pacientesMenores: 15,
        pacientesAdultos: 85,
        pacientesConCuentaAbierta: 25,
        pacientesHospitalizados: 20,
        pacientesAmbulatorios: 5,
      };

      const mockResponse = {
        success: true,
        data: { stats: mockStats },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await store.dispatch(fetchPatientsStats());

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.stats).toEqual(mockStats);
      expect(state.error).toBeNull();
    });

    it('should handle fetchPatientsStats error', async () => {
      mockedApi.get.mockRejectedValue({ error: 'Error al obtener estadísticas' });

      await store.dispatch(fetchPatientsStats());

      const state = store.getState().patients;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al obtener estadísticas');
    });
  });
});
