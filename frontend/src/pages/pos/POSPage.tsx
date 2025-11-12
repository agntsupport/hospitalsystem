import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  PointOfSale as POSIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';

import { posService } from '@/services/posService';
import { PatientAccount } from '@/types/pos.types';
import NewAccountDialog from '@/components/pos/NewAccountDialog';
import OpenAccountsList from '@/components/pos/OpenAccountsList';
import POSTransactionDialog from '@/components/pos/POSTransactionDialog';
import HistoryTab from '@/components/pos/HistoryTab';
import QuickSalesTab from '@/components/pos/QuickSalesTab';
import AccountClosureDialog from '@/components/pos/AccountClosureDialog';
import AccountDetailDialog from '@/components/pos/AccountDetailDialog';
import PartialPaymentDialog from '@/components/pos/PartialPaymentDialog';

const POSPage: React.FC = () => {
  const [openAccounts, setOpenAccounts] = useState<PatientAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialogs
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PatientAccount | null>(null);
  const [closureDialogOpen, setClosureDialogOpen] = useState(false);
  const [accountToClose, setAccountToClose] = useState<PatientAccount | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [accountToView, setAccountToView] = useState<PatientAccount | null>(null);
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);
  const [accountForPartialPayment, setAccountForPartialPayment] = useState<PatientAccount | null>(null);
  
  // Tabs
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      await loadOpenAccounts();
    } catch (error: any) {
      setError(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadOpenAccounts = async () => {
    try {
      const response = await posService.getPatientAccounts({ estado: 'abierta' });
      if (response.success && response.data) {
        setOpenAccounts(response.data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading open accounts:', error);
    }
  };

  const handleNewAccount = () => {
    setNewAccountOpen(true);
  };

  const handleAccountCreated = () => {
    setNewAccountOpen(false);
    loadOpenAccounts();
  };

  const handleAddTransaction = (account: PatientAccount) => {
    setSelectedAccount(account);
    setTransactionDialogOpen(true);
  };

  const handleTransactionAdded = () => {
    setTransactionDialogOpen(false);
    setSelectedAccount(null);
    loadOpenAccounts();
  };

  const handleCloseAccount = (account: PatientAccount) => {
    setAccountToClose(account);
    setClosureDialogOpen(true);
  };

  const handleViewAccount = (account: PatientAccount) => {
    setAccountToView(account);
    setDetailDialogOpen(true);
  };

  const handleClosureSuccess = () => {
    setClosureDialogOpen(false);
    setAccountToClose(null);
    loadOpenAccounts();
  };

  const handlePartialPayment = (account: PatientAccount) => {
    setAccountForPartialPayment(account);
    setPartialPaymentDialogOpen(true);
  };

  const handlePartialPaymentRegistered = () => {
    setPartialPaymentDialogOpen(false);
    setAccountForPartialPayment(null);
    loadOpenAccounts();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          <POSIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Punto de Venta
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          onClick={handleNewAccount}
        >
          Nueva Cuenta
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mt: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<AccountIcon />} 
            label="Cuentas Abiertas" 
            iconPosition="start"
          />
          <Tab 
            icon={<ReceiptIcon />} 
            label="Historial" 
            iconPosition="start"
          />
          <Tab 
            icon={<CartIcon />} 
            label="Ventas Rápidas" 
            iconPosition="start"
          />
        </Tabs>

        <CardContent>
          {currentTab === 0 && (
            <OpenAccountsList
              accounts={openAccounts}
              loading={loading}
              onAddTransaction={handleAddTransaction}
              onCloseAccount={handleCloseAccount}
              onViewAccount={handleViewAccount}
              onPartialPayment={handlePartialPayment}
              onRefresh={loadOpenAccounts}
              onCreateAccount={handleNewAccount}
            />
          )}
          
          {currentTab === 1 && (
            <HistoryTab onRefresh={loadInitialData} />
          )}
          
          {currentTab === 2 && (
            <QuickSalesTab onRefresh={loadInitialData} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewAccountDialog
        open={newAccountOpen}
        onClose={() => setNewAccountOpen(false)}
        onAccountCreated={handleAccountCreated}
      />

      <POSTransactionDialog
        open={transactionDialogOpen}
        account={selectedAccount}
        onClose={() => {
          setTransactionDialogOpen(false);
          setSelectedAccount(null);
        }}
        onTransactionAdded={handleTransactionAdded}
      />

      <AccountClosureDialog
        open={closureDialogOpen}
        account={accountToClose}
        onClose={() => {
          setClosureDialogOpen(false);
          setAccountToClose(null);
        }}
        onSuccess={handleClosureSuccess}
      />

      <PartialPaymentDialog
        open={partialPaymentDialogOpen}
        account={accountForPartialPayment}
        onClose={() => {
          setPartialPaymentDialogOpen(false);
          setAccountForPartialPayment(null);
        }}
        onPaymentRegistered={handlePartialPaymentRegistered}
      />

      <AccountDetailDialog
        open={detailDialogOpen}
        account={accountToView}
        onClose={() => {
          setDetailDialogOpen(false);
          setAccountToView(null);
        }}
      />
    </Box>
  );
};

export default POSPage;