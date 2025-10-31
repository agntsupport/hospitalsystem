import { useState, useEffect, useCallback } from 'react';
import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';
import { toast } from 'react-toastify';

interface QuickSale {
  id: number;
  numeroVenta: string;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  cajero: {
    id: number;
    username: string;
  };
  fecha: string;
  observaciones?: string;
  items: Array<{
    tipo: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

export interface HistoryFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  pacienteNombre?: string;
  tipoAtencion?: string;
  montoMinimo?: number;
  montoMaximo?: number;
}

const ITEMS_PER_PAGE = 10;

export const useAccountHistory = () => {
  // Estados para cuentas cerradas
  const [closedAccounts, setClosedAccounts] = useState<PatientAccount[]>([]);
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PatientAccount | null>(null);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);

  // Estados para ventas rápidas
  const [quickSales, setQuickSales] = useState<QuickSale[]>([]);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [selectedSale, setSelectedSale] = useState<QuickSale | null>(null);
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false);

  // Estados compartidos
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyTab, setHistoryTab] = useState(0); // 0: Cuentas Cerradas, 1: Ventas Rápidas

  const loadClosedAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await posService.getPatientAccounts({
        estado: 'cerrada'
      });

      if (response.success && response.data) {
        setClosedAccounts(response.data.accounts || []);
        setTotalPages(Math.ceil((response.data.accounts?.length || 0) / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error loading closed accounts:', error);
      toast.error('Error al cargar cuentas cerradas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuickSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE
      };

      // Aplicar filtros
      if (filters.fechaInicio) {
        params.fechaInicio = filters.fechaInicio.toISOString().split('T')[0];
      }
      if (filters.fechaFin) {
        params.fechaFin = filters.fechaFin.toISOString().split('T')[0];
      }
      if (filters.pacienteNombre) {
        params.cajero = filters.pacienteNombre;
      }
      if (filters.tipoAtencion) {
        params.metodoPago = filters.tipoAtencion;
      }

      const response = await posService.getSalesHistory(params);

      if (response.success && response.data) {
        setQuickSales(response.data.items || []);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error loading quick sales:', error);
      toast.error('Error al cargar ventas rápidas');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const handleExpandAccount = useCallback(async (accountId: number) => {
    setExpandedAccount(prev => prev === accountId ? null : accountId);
  }, []);

  const handleViewDetails = useCallback(async (account: PatientAccount) => {
    try {
      const response = await posService.getPatientAccountById(account.id);
      if (response.success && response.data) {
        setSelectedAccount(response.data.account);
        setAccountDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error loading account details:', error);
      toast.error('Error al cargar detalles de la cuenta');
    }
  }, []);

  const handleExpandSale = useCallback((saleId: number) => {
    setExpandedSale(prev => prev === saleId ? null : saleId);
  }, []);

  const handleViewSaleDetails = useCallback((sale: QuickSale) => {
    setSelectedSale(sale);
    setSaleDetailsOpen(true);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setPage(1);
    if (historyTab === 0) {
      loadClosedAccounts();
    } else {
      loadQuickSales();
    }
    setShowFilters(false);
  }, [historyTab, loadClosedAccounts, loadQuickSales]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  }, []);

  const handleExportData = useCallback(() => {
    if (historyTab === 0) {
      toast.success(`Exportando ${closedAccounts.length} cuentas cerradas`);
    } else {
      toast.success(`Exportando ${quickSales.length} ventas rápidas`);
    }
  }, [historyTab, closedAccounts.length, quickSales.length]);

  useEffect(() => {
    if (historyTab === 0) {
      loadClosedAccounts();
    } else {
      loadQuickSales();
    }
  }, [page, filters, historyTab, loadClosedAccounts, loadQuickSales]);

  return {
    // Estados de cuentas cerradas
    closedAccounts,
    expandedAccount,
    selectedAccount,
    accountDetailsOpen,
    setAccountDetailsOpen,

    // Estados de ventas rápidas
    quickSales,
    expandedSale,
    selectedSale,
    saleDetailsOpen,
    setSaleDetailsOpen,

    // Estados compartidos
    loading,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    page,
    setPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    historyTab,
    setHistoryTab,

    // Métodos
    loadClosedAccounts,
    loadQuickSales,
    handleExpandAccount,
    handleViewDetails,
    handleExpandSale,
    handleViewSaleDetails,
    handleApplyFilters,
    handleClearFilters,
    handleExportData
  };
};
