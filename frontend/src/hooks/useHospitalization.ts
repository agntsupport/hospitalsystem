// ABOUTME: Custom hook para gestión de hospitalización
// ABOUTME: Centraliza estado, filtros, permisos y handlers de la página de hospitalización

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '@/store';
import hospitalizationService from '@/services/hospitalizationService';
import {
  HospitalAdmission,
  HospitalizationStats,
  HospitalizationFilters
} from '@/types/hospitalization.types';

// Constantes de roles autorizados
const ROLES_CREAR_INGRESO = ['administrador', 'cajero', 'medico_residente', 'medico_especialista'];
const ROLES_NOTAS_SOAP = ['administrador', 'enfermero', 'medico_residente', 'medico_especialista'];
const ROLES_DAR_ALTA = ['administrador', 'medico_residente', 'medico_especialista'];
const ROLES_TRASLADAR = ['administrador', 'cajero', 'enfermero', 'medico_residente', 'medico_especialista'];

export interface UseHospitalizationReturn {
  // Usuario y permisos
  user: RootState['auth']['user'];
  permisos: {
    puedeCrearIngreso: boolean;
    puedeVerNotasSoap: boolean;
    puedeDarAlta: boolean;
    puedeTrasladar: boolean;
  };

  // Datos principales
  admissions: HospitalAdmission[];
  stats: HospitalizationStats | null;
  loading: boolean;
  error: string | null;

  // Filtros y búsqueda
  filters: HospitalizationFilters;
  searchTerm: string;
  selectedStatus: string;
  selectedSpecialty: string;
  selectedSpaceType: string;
  setSearchTerm: (term: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedSpecialty: (specialty: string) => void;
  setSelectedSpaceType: (spaceType: string) => void;

  // Paginación
  totalItems: number;
  totalPages: number;

  // Handlers
  loadData: () => Promise<void>;
  handleSearch: () => void;
  handleClearFilters: () => void;
  handlePageChange: (event: React.ChangeEvent<unknown>, page: number) => void;

  // Handlers para diálogos
  handleViewPatientStatus: (admission: HospitalAdmission) => Promise<HospitalAdmission | null>;
}

export const useHospitalization = (): UseHospitalizationReturn => {
  const user = useSelector((state: RootState) => state.auth.user);

  // Permisos calculados
  const permisos = {
    puedeCrearIngreso: user ? ROLES_CREAR_INGRESO.includes(user.rol) : false,
    puedeVerNotasSoap: user ? ROLES_NOTAS_SOAP.includes(user.rol) : false,
    puedeDarAlta: user ? ROLES_DAR_ALTA.includes(user.rol) : false,
    puedeTrasladar: user ? ROLES_TRASLADAR.includes(user.rol) : false
  };

  // Estados principales
  const [admissions, setAdmissions] = useState<HospitalAdmission[]>([]);
  const [stats, setStats] = useState<HospitalizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [filters, setFilters] = useState<HospitalizationFilters>({
    pagina: 1,
    limite: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedSpaceType, setSelectedSpaceType] = useState<string>('');

  // Paginación
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [admissionsResponse, statsResponse] = await Promise.all([
        hospitalizationService.getAdmissions(filters),
        hospitalizationService.getStats()
      ]);

      if (admissionsResponse.success && admissionsResponse.data) {
        let admissionsData = admissionsResponse.data?.items || [];

        // Filtro de tipo de espacio en frontend
        if (selectedSpaceType) {
          admissionsData = admissionsData.filter((admission: HospitalAdmission) => {
            if (selectedSpaceType === 'habitacion' && admission.habitacion) return true;
            if (selectedSpaceType === 'consultorio' && admission.consultorio) return true;
            if (selectedSpaceType === 'quirofano' && admission.quirofano) return true;
            return false;
          });
        }

        setAdmissions(admissionsData);
        setTotalItems(admissionsResponse.data?.pagination?.total || 0);
        setTotalPages(admissionsResponse.data?.pagination?.totalPages || 1);
      } else {
        setError(admissionsResponse.message || 'Error al cargar hospitalizaciones');
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err: unknown) {
      setError('Error al cargar los datos de hospitalización');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedSpaceType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      busqueda: searchTerm || undefined,
      estado: selectedStatus ? [selectedStatus as 'en_observacion' | 'estable' | 'critico' | 'alta_medica' | 'alta_voluntaria'] : undefined,
      especialidades: selectedSpecialty ? [selectedSpecialty] : undefined,
      pagina: 1
    }));
  }, [searchTerm, selectedStatus, selectedSpecialty]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedSpecialty('');
    setSelectedSpaceType('');
    setFilters({
      pagina: 1,
      limite: 10
    });
  }, []);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({ ...prev, pagina: page }));
  }, []);

  const handleViewPatientStatus = useCallback(async (admission: HospitalAdmission): Promise<HospitalAdmission | null> => {
    try {
      const response = await hospitalizationService.getPatientStatus(admission.id);
      if (response.success && response.data) {
        return {
          ...admission,
          paciente: {
            ...admission.paciente,
            ...response.data.paciente
          },
          habitacion: response.data.habitacion || admission.habitacion,
          medicoTratante: response.data.medicoTratante || admission.medicoTratante,
          estado: response.data.hospitalizacion?.estado || admission.estado,
          diagnosticoIngreso: response.data.hospitalizacion?.diagnosticoIngreso || admission.diagnosticoIngreso,
          fechaIngreso: response.data.hospitalizacion?.fechaIngreso || admission.fechaIngreso,
          fechaAlta: response.data.hospitalizacion?.fechaAlta || admission.fechaAlta
        };
      } else {
        toast.error(response.message || 'Error al obtener estado del paciente');
        return null;
      }
    } catch (err) {
      toast.error('Error al obtener estado del paciente');
      return null;
    }
  }, []);

  return {
    user,
    permisos,
    admissions,
    stats,
    loading,
    error,
    filters,
    searchTerm,
    selectedStatus,
    selectedSpecialty,
    selectedSpaceType,
    setSearchTerm,
    setSelectedStatus,
    setSelectedSpecialty,
    setSelectedSpaceType,
    totalItems,
    totalPages,
    loadData,
    handleSearch,
    handleClearFilters,
    handlePageChange,
    handleViewPatientStatus
  };
};

export default useHospitalization;
