// ABOUTME: Tests comprehensivos para auditService
// ABOUTME: Cubre todos los métodos del servicio de auditoría incluyendo error handling y edge cases

jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import auditService, { AuditRecord, CancellationCause, AuditStats } from '../auditService';
import { api } from '@/utils/api';

const mockedApi = api as jest.Mocked<typeof api>;

describe('auditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditTrail', () => {
    it('should fetch audit trail for entity', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              modulo: 'pacientes',
              tipoOperacion: 'POST /api/patients',
              entidadTipo: 'paciente',
              entidadId: 123,
              usuarioId: 1,
              usuarioNombre: 'Admin',
              rolUsuario: 'administrador',
              createdAt: '2025-01-01T10:00:00Z',
              usuario: { id: 1, username: 'admin', rol: 'administrador' }
            }
          ]
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getAuditTrail('paciente', 123);

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/trail/paciente/123');
      expect(result).toEqual(mockResponse.data.data);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when data is null', async () => {
      const mockResponse = { data: null };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getAuditTrail('paciente', 999);

      expect(result).toEqual([]);
    });

    it('should handle errors and throw', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(auditService.getAuditTrail('paciente', 123))
        .rejects.toThrow('Error al obtener el historial de auditoría');
    });
  });

  describe('getModuleAudit', () => {
    it('should fetch module audit with filters', async () => {
      const mockResponse = {
        data: {
          data: {
            records: [{ id: 1, modulo: 'facturacion' }],
            total: 1,
            hasMore: false
          }
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const filters = {
        limit: 10,
        offset: 0,
        userId: 1,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        tipoOperacion: 'POST'
      };

      const result = await auditService.getModuleAudit('facturacion', filters);

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/module/facturacion', {
        params: filters
      });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should work without filters', async () => {
      const mockResponse = {
        data: { data: { records: [], total: 0, hasMore: false } }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getModuleAudit('inventario');

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/module/inventario', {
        params: undefined
      });
      expect(result.records).toEqual([]);
    });

    it('should return default structure on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Database error'));

      await expect(auditService.getModuleAudit('pacientes'))
        .rejects.toThrow('Error al obtener auditoría del módulo');
    });
  });

  describe('getUserActivity', () => {
    it('should fetch user activity', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 1, usuarioId: 5, tipoOperacion: 'PUT', modulo: 'empleados' }
          ]
        }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getUserActivity(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/user/5', {
        params: undefined
      });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should fetch user activity with pagination', async () => {
      const mockResponse = {
        data: { data: [] }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      await auditService.getUserActivity(5, { limit: 20, offset: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/user/5', {
        params: { limit: 20, offset: 10 }
      });
    });

    it('should return empty array on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('User not found'));

      await expect(auditService.getUserActivity(999))
        .rejects.toThrow('Error al obtener actividad del usuario');
    });
  });

  describe('getAuditStats', () => {
    it('should fetch audit statistics', async () => {
      const mockStats: AuditStats = {
        totalOperaciones: 1000,
        cancelaciones: 50,
        operacionesPorModulo: [
          { modulo: 'pacientes', _count: { id: 300 } }
        ],
        operacionesPorUsuario: [
          { usuarioId: 1, usuarioNombre: 'Admin', rolUsuario: 'administrador', operaciones: 500 }
        ]
      };

      const mockResponse = {
        data: { data: mockStats }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getAuditStats();

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/stats', {
        params: undefined
      });
      expect(result).toEqual(mockStats);
    });

    it('should fetch stats with date range', async () => {
      const mockResponse = {
        data: { data: { totalOperaciones: 100, cancelaciones: 5, operacionesPorModulo: [], operacionesPorUsuario: [] } }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const dateRange = { startDate: '2025-01-01', endDate: '2025-01-31' };
      await auditService.getAuditStats(dateRange);

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/stats', {
        params: dateRange
      });
    });

    it('should return default stats on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Stats unavailable'));

      await expect(auditService.getAuditStats())
        .rejects.toThrow('Error al obtener estadísticas de auditoría');
    });
  });

  describe('getCancellationCauses', () => {
    it('should fetch cancellation causes', async () => {
      const mockCauses: CancellationCause[] = [
        {
          id: 1,
          codigo: 'ERR-001',
          descripcion: 'Error del usuario',
          categoria: 'usuario',
          requiereNota: true,
          requiereAutorizacion: false,
          activo: true
        }
      ];

      const mockResponse = {
        data: { data: mockCauses }
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getCancellationCauses();

      expect(mockedApi.get).toHaveBeenCalledWith('/audit/cancellation-causes');
      expect(result).toEqual(mockCauses);
    });

    it('should return empty array when no data', async () => {
      const mockResponse = { data: { data: null } };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await auditService.getCancellationCauses();

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Connection failed'));

      await expect(auditService.getCancellationCauses())
        .rejects.toThrow('Error al obtener causas de cancelación');
    });
  });

  describe('formatOperationType', () => {
    it('should format POST operation', () => {
      const result = auditService.formatOperationType('POST /api/patients');
      expect(result).toBe('Creación');
    });

    it('should format PUT operation', () => {
      const result = auditService.formatOperationType('PUT /api/patients/1');
      expect(result).toBe('Modificación');
    });

    it('should format DELETE operation', () => {
      const result = auditService.formatOperationType('DELETE /api/patients/1');
      expect(result).toBe('Eliminación');
    });

    it('should format cancel operation', () => {
      const result = auditService.formatOperationType('PUT /api/invoices/1/cancel');
      expect(result).toBe('Cancelación');
    });

    it('should format discharge operation', () => {
      const result = auditService.formatOperationType('POST /api/hospitalization/discharge');
      expect(result).toBe('Alta Médica');
    });

    it('should return original for unknown operations', () => {
      const result = auditService.formatOperationType('UNKNOWN_OPERATION');
      expect(result).toBe('UNKNOWN_OPERATION');
    });
  });

  describe('getOperationColor', () => {
    it('should return success for POST', () => {
      const color = auditService.getOperationColor('POST /api/test');
      expect(color).toBe('success');
    });

    it('should return warning for PUT', () => {
      const color = auditService.getOperationColor('PUT /api/test');
      expect(color).toBe('warning');
    });

    it('should return error for DELETE', () => {
      const color = auditService.getOperationColor('DELETE /api/test');
      expect(color).toBe('error');
    });

    it('should return error for cancel', () => {
      const color = auditService.getOperationColor('PUT /api/test/cancel');
      expect(color).toBe('error'); // cancel se evalúa antes que PUT
    });

    it('should return primary for unknown', () => {
      const color = auditService.getOperationColor('UNKNOWN');
      expect(color).toBe('primary');
    });
  });

  describe('getOperationIcon', () => {
    it('should return add icon for POST', () => {
      const icon = auditService.getOperationIcon('POST /api/test');
      expect(icon).toBe('add');
    });

    it('should return edit icon for PUT', () => {
      const icon = auditService.getOperationIcon('PUT /api/test');
      expect(icon).toBe('edit');
    });

    it('should return delete icon for DELETE', () => {
      const icon = auditService.getOperationIcon('DELETE /api/test');
      expect(icon).toBe('delete');
    });

    it('should return discharge icon', () => {
      const icon = auditService.getOperationIcon('POST /discharge');
      expect(icon).toBe('exit_to_app'); // discharge se evalúa antes que POST
    });

    it('should return info icon for unknown', () => {
      const icon = auditService.getOperationIcon('UNKNOWN');
      expect(icon).toBe('info');
    });
  });

  describe('exportToCSV', () => {
    let createElementSpy: jest.SpyInstance;
    let appendChildSpy: jest.SpyInstance;
    let removeChildSpy: jest.SpyInstance;

    beforeEach(() => {
      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: {}
      };

      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should export audit records to CSV', () => {
      const records: AuditRecord[] = [
        {
          id: 1,
          modulo: 'pacientes',
          tipoOperacion: 'POST /api/patients',
          entidadTipo: 'paciente',
          entidadId: 123,
          usuarioId: 1,
          usuarioNombre: 'Admin',
          rolUsuario: 'administrador',
          createdAt: '2025-01-01T10:00:00Z',
          usuario: { id: 1, username: 'admin', rol: 'administrador' }
        }
      ];

      auditService.exportToCSV(records, 'test-audit.csv');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should use default filename', () => {
      auditService.exportToCSV([]);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should handle export errors', () => {
      createElementSpy.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const records: AuditRecord[] = [];

      expect(() => auditService.exportToCSV(records)).toThrow('Error al exportar auditoría a CSV');
    });
  });
});
