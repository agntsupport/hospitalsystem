// ABOUTME: Tests comprehensivos para hospitalizationService
// ABOUTME: Cubre operaciones de admisiones, altas, notas médicas y estadísticas

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import hospitalizationService from '../hospitalizationService';
import { api } from '@/utils/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('hospitalizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdmissions', () => {
    it('should fetch admissions without filters', async () => {
      const mockResponse = {
        data: {
          items: [{ id: 1, paciente: { nombre: 'Juan' } }],
          total: 1
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.getAdmissions();

      expect(mockedApi.get).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should fetch admissions with filters', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const filters = {
        estado: ['estable', 'critico'],
        fechaIngresoDesde: '2025-01-01',
        pagina: 1,
        limite: 10
      };

      const result = await hospitalizationService.getAdmissions(filters as any);

      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('estado=estable'));
      expect(result.success).toBe(true);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue({ message: 'Error' });

      const result = await hospitalizationService.getAdmissions();

      expect(result.success).toBe(false);
    });
  });

  describe('getAdmissionDetail', () => {
    it('should fetch admission detail', async () => {
      const mockResponse = {
        data: {
          id: 1,
          paciente: { nombre: 'Juan' },
          notasMedicas: [],
          alta: null
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.getAdmissionDetail(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/hospitalization/admissions/1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
  });

  describe('createAdmission', () => {
    it('should create new admission', async () => {
      const admissionData = {
        pacienteId: 1,
        habitacionId: 5,
        motivoIngreso: 'Test ingreso con más de 10 caracteres',
        diagnosticoIngreso: 'Test diag',
        medicoTratanteId: 2
      };

      const mockResponse = { data: { id: 1, ...admissionData } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.createAdmission(admissionData);

      expect(mockedApi.post).toHaveBeenCalledWith('/hospitalization/admissions', admissionData);
      expect(result.success).toBe(true);
    });

    it('should validate admission data', async () => {
      const invalidData = {
        pacienteId: 0,
        habitacionId: 0
      };

      const result = await hospitalizationService.createAdmission(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('paciente');
    });
  });

  describe('updateAdmission', () => {
    it('should update admission', async () => {
      const updateData = { observaciones: 'Updated' };
      const mockResponse = { data: { id: 1, ...updateData } };

      mockedApi.put.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.updateAdmission(1, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/hospitalization/admissions/1', updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('getMedicalNotes', () => {
    it('should fetch medical notes', async () => {
      const mockResponse = {
        data: [
          { id: 1, tipo: 'evolucion_medica', createdAt: '2025-01-01' }
        ]
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.getMedicalNotes(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/hospitalization/admissions/1/notes');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
  });

  describe('createMedicalNote', () => {
    it('should create medical note', async () => {
      const noteData = {
        tipo: 'evolucion' as const,
        subjetivo: 'Patient status',
        objetivo: 'Vitals normal',
        analisis: 'Improving',
        plan: 'Continue treatment'
      };

      const mockResponse = { data: { id: 1 } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.createMedicalNote(1, noteData);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/hospitalization/admissions/1/notes',
        expect.objectContaining({
          tipoNota: 'evolucion_medica'
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('createDischarge', () => {
    it('should create discharge', async () => {
      const dischargeData = {
        tipoAlta: 'medica' as const,
        estadoAlta: 'mejorado' as const,
        diagnosticoEgreso: 'Recovered from condition after treatment',
        resumenEstancia: 'Patient stayed 5 days and recovered successfully',
        recomendacionesGenerales: 'Rest and hydration',
        cuidadosDomiciliarios: ['Rest', 'Medicine'],
        signosAlarma: ['Fever', 'Pain']
      };

      const mockResponse = { data: { id: 1 } };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.createDischarge(1, dischargeData);

      expect(mockedApi.post).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should validate discharge data', async () => {
      const invalidData = {
        tipoAlta: undefined,
        estadoAlta: undefined
      };

      const result = await hospitalizationService.createDischarge(1, invalidData as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('tipo de alta');
    });
  });

  describe('getStats', () => {
    it('should fetch hospitalization stats', async () => {
      const mockResponse = {
        data: {
          totalHospitalizados: 50,
          porEstado: {
            estable: 40,
            critico: 10
          }
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await hospitalizationService.getStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/hospitalization/stats');
      expect(result.success).toBe(true);
    });
  });

  describe('validateAdmissionForm', () => {
    it('should validate correct form', () => {
      const validData = {
        pacienteId: 1,
        habitacionId: 5,
        motivoIngreso: 'Test ingreso con más de 10 caracteres',
        diagnosticoIngreso: 'Test diag',
        medicoTratanteId: 2
      };

      const result = hospitalizationService.validateAdmissionForm(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {};

      const result = hospitalizationService.validateAdmissionForm(invalidData as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate minimum text lengths', () => {
      const invalidData = {
        pacienteId: 1,
        habitacionId: 5,
        motivoIngreso: 'short',
        diagnosticoIngreso: 'dia',
        medicoTratanteId: 2
      };

      const result = hospitalizationService.validateAdmissionForm(invalidData as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('El motivo de ingreso debe tener al menos 10 caracteres');
    });
  });

  describe('formatAdmissionStatus', () => {
    it('should format status labels', () => {
      expect(hospitalizationService.formatAdmissionStatus('en_observacion')).toBe('En Observación');
      expect(hospitalizationService.formatAdmissionStatus('estable')).toBe('Estable');
      expect(hospitalizationService.formatAdmissionStatus('critico')).toBe('Crítico');
      expect(hospitalizationService.formatAdmissionStatus('unknown')).toBe('unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors', () => {
      expect(hospitalizationService.getStatusColor('en_observacion')).toBe('warning');
      expect(hospitalizationService.getStatusColor('estable')).toBe('primary');
      expect(hospitalizationService.getStatusColor('critico')).toBe('error');
      expect(hospitalizationService.getStatusColor('alta_medica')).toBe('success');
    });
  });

  describe('calculateStayDays', () => {
    it('should calculate days between dates', () => {
      const fechaIngreso = '2025-01-01T00:00:00Z';
      const fechaAlta = '2025-01-05T00:00:00Z';

      const days = hospitalizationService.calculateStayDays(fechaIngreso, fechaAlta);

      expect(days).toBe(4);
    });

    it('should calculate days until now if no fechaAlta', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const days = hospitalizationService.calculateStayDays(yesterday.toISOString());

      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const result = hospitalizationService.formatDateTime('2025-01-15', '10:30');

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle invalid input', () => {
      const result = hospitalizationService.formatDateTime('invalid', 'invalid');

      expect(result).toContain('invalid');
    });
  });
});
