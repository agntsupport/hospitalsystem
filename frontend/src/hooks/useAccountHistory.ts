import { useState, useEffect, useCallback } from 'react';
import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';
import { toast } from 'react-toastify';

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

  // Estados compartidos
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleExpandAccount = useCallback(async (accountId: number) => {
    // Toggle expand state
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
      return;
    }

    setExpandedAccount(accountId);

    // Load transactions for this account if not already loaded
    const account = closedAccounts.find(a => a.id === accountId);
    if (account && (!account.transacciones || account.transacciones.length === 0)) {
      try {
        const response = await posService.getAccountTransactions(accountId);
        if (response.success && response.data) {
          // Update the account in closedAccounts with loaded transactions
          setClosedAccounts(prev => prev.map(acc =>
            acc.id === accountId
              ? { ...acc, transacciones: response.data.transacciones }
              : acc
          ));
        }
      } catch (error) {
        console.error('Error loading account transactions:', error);
        toast.error('Error al cargar transacciones de la cuenta');
      }
    }
  }, [expandedAccount, closedAccounts]);

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

  const handleApplyFilters = useCallback(() => {
    setPage(1);
    loadClosedAccounts();
    setShowFilters(false);
  }, [loadClosedAccounts]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  }, []);

  const handleExportData = useCallback(() => {
    toast.success(`Exportando ${closedAccounts.length} cuentas cerradas`);
  }, [closedAccounts.length]);

  useEffect(() => {
    loadClosedAccounts();
  }, [page, filters, loadClosedAccounts]);

  return {
    // Estados de cuentas cerradas
    closedAccounts,
    expandedAccount,
    selectedAccount,
    accountDetailsOpen,
    setAccountDetailsOpen,

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

    // Métodos
    loadClosedAccounts,
    handleExpandAccount,
    handleViewDetails,
    handleApplyFilters,
    handleClearFilters,
    handleExportData
  };
};
