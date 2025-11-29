// ABOUTME: Página principal del módulo de Facturación
// ABOUTME: Gestiona facturas, pagos y cuentas por cobrar del sistema hospitalario

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as AccountsIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';

import InvoicesTab from './InvoicesTab';
import PaymentsTab from './PaymentsTab';
import AccountsReceivableTab from './AccountsReceivableTab';
import BillingStatsTab from './BillingStatsTab';
import BillingStatsCards from '@/components/billing/BillingStatsCards';
import PageHeader from '@/components/common/PageHeader';
import { billingService } from '@/services/billingService';
import { BillingStats } from '@/types/billing.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const BillingPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await billingService.getBillingStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Error al cargar estadísticas');
      }
    } catch (err) {
      setError('Error al cargar estadísticas de facturación');
      console.error('Error loading billing stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDataChange = () => {
    // Callback para refrescar datos cuando se realizan cambios
    loadStats();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header unificado */}
      <PageHeader
        title="Facturación y Cuentas por Cobrar"
        subtitle="Gestión completa de facturas, pagos y cuentas por cobrar del sistema hospitalario"
        icon={<InvoiceIcon />}
        iconColor="primary"
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ mb: 3 }}>
        <BillingStatsCards stats={stats} loading={loading} onRefresh={loadStats} />
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="billing tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Facturas" 
            icon={<InvoiceIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Pagos" 
            icon={<PaymentIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Cuentas por Cobrar" 
            icon={<AccountsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Estadísticas" 
            icon={<StatsIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <InvoicesTab onDataChange={handleDataChange} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PaymentsTab onDataChange={handleDataChange} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <AccountsReceivableTab onDataChange={handleDataChange} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <BillingStatsTab stats={stats} loading={loading} onRefresh={loadStats} />
      </TabPanel>
    </Box>
  );
};

export default BillingPage;