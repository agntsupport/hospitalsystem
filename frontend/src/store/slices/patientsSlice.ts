import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  Patient, 
  PatientsResponse, 
  PatientResponse, 
  CreatePatientData, 
  UpdatePatientData,
  PatientsFilters,
  PaginationParams,
  PatientsStatsResponse 
} from '@/types/patient.types';
import { api } from '@/utils/api';
import { API_ROUTES } from '@/utils/constants';

interface PatientsState {
  patients: Patient[];
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: PatientsFilters;
  stats: {
    totalPacientes: number;
    pacientesMenores: number;
    pacientesAdultos: number;
    pacientesConCuentaAbierta: number;
    pacientesHospitalizados: number;
    pacientesAmbulatorios: number;
  } | null;
}

const initialState: PatientsState = {
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
};

// Thunks asíncronos
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async ({ pagination, filters }: { pagination: PaginationParams; filters: PatientsFilters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (typeof filters.esMenorEdad === 'boolean') {
        params.append('esMenorEdad', filters.esMenorEdad.toString());
      }

      const response = await api.get<PatientsResponse['data']>(`${API_ROUTES.PATIENTS.BASE}?${params.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue('Error al obtener pacientes');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al obtener pacientes');
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchPatientById',
  async ({ id, includeHistory = false }: { id: number | string; includeHistory?: boolean }, { rejectWithValue }) => {
    try {
      const params = includeHistory ? '?includeHistory=true' : '';
      const response = await api.get<PatientResponse['data']>(`${API_ROUTES.PATIENTS.BY_ID(id)}${params}`);
      
      if (response.success && response.data) {
        return response.data.patient;
      }
      
      return rejectWithValue('Error al obtener paciente');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al obtener paciente');
    }
  }
);

export const createPatient = createAsyncThunk(
  'patients/createPatient',
  async (patientData: CreatePatientData, { rejectWithValue }) => {
    try {
      const response = await api.post<PatientResponse['data']>(API_ROUTES.PATIENTS.BASE, patientData);
      
      if (response.success && response.data) {
        return response.data.patient;
      }
      
      return rejectWithValue('Error al crear paciente');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al crear paciente');
    }
  }
);

export const updatePatient = createAsyncThunk(
  'patients/updatePatient',
  async ({ id, data }: { id: number | string; data: UpdatePatientData }, { rejectWithValue }) => {
    try {
      const response = await api.put<PatientResponse['data']>(API_ROUTES.PATIENTS.BY_ID(id), data);
      
      if (response.success && response.data) {
        return response.data.patient;
      }
      
      return rejectWithValue('Error al actualizar paciente');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al actualizar paciente');
    }
  }
);

export const searchPatients = createAsyncThunk(
  'patients/searchPatients',
  async ({ query, limit = 10 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('limit', limit.toString());

      const response = await api.get<{ patients: Patient[] }>(`${API_ROUTES.PATIENTS.SEARCH}?${params.toString()}`);
      
      if (response.success && response.data) {
        return response.data.patients;
      }
      
      return rejectWithValue('Error al buscar pacientes');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al buscar pacientes');
    }
  }
);

export const fetchPatientsStats = createAsyncThunk(
  'patients/fetchPatientsStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<PatientsStatsResponse['data']>(API_ROUTES.PATIENTS.STATS);
      
      if (response.success && response.data) {
        return response.data.stats;
      }
      
      return rejectWithValue('Error al obtener estadísticas');
    } catch (error: any) {
      return rejectWithValue(error.error || 'Error al obtener estadísticas');
    }
  }
);

// Slice
const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch patients
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload.patients;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch patient by ID
    builder
      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create patient
    builder
      .addCase(createPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.patients.unshift(action.payload);
        state.currentPatient = action.payload;
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update patient
    builder
      .addCase(updatePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.patients.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
        if (state.currentPatient?.id === action.payload.id) {
          state.currentPatient = action.payload;
        }
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search patients
    builder
      .addCase(searchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.loading = false;
        // Para búsqueda, no reemplazamos la lista principal
      })
      .addCase(searchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch stats
    builder
      .addCase(fetchPatientsStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchPatientsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  setCurrentPatient, 
  clearCurrentPatient 
} = patientsSlice.actions;

export default patientsSlice.reducer;