import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store } from '@/store/store';
import Layout from '@/components/common/Layout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Eager loading solo para Login (primera página que se carga)
import Login from '@/pages/auth/Login';

// Lazy loading para todas las demás páginas (Code Splitting)
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage'));
const POSPage = lazy(() => import('@/pages/pos/POSPage'));
const RoomsPage = lazy(() => import('@/pages/rooms/RoomsPage'));
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const CuentasPorCobrarPage = lazy(() => import('@/pages/cuentas-por-cobrar/CuentasPorCobrarPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const HospitalizationPage = lazy(() => import('@/pages/hospitalization/HospitalizationPage'));
const QuirofanosPage = lazy(() => import('@/pages/quirofanos/QuirofanosPage'));
const CirugiasPage = lazy(() => import('@/pages/quirofanos/CirugiasPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const SolicitudesPage = lazy(() => import('@/pages/solicitudes/SolicitudesPage'));

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      '50': '#e3f2fd',
      '200': '#90caf9',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Componente de loading para Lazy Loading
const PageLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      width: '100%',
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

// Componente placeholder para rutas no implementadas
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Esta funcionalidad estará disponible próximamente.</p>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Ruta pública - Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas con Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/patients" element={
              <ProtectedRoute roles={['cajero', 'enfermero', 'almacenista', 'medico_residente', 'medico_especialista', 'administrador']}>
                <Layout>
                  <PatientsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/employees" element={
              <ProtectedRoute roles={['administrador']}>
                <Layout>
                  <EmployeesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/rooms" element={
              <ProtectedRoute roles={['cajero', 'enfermero', 'almacenista', 'medico_residente', 'medico_especialista', 'administrador']}>
                <Layout>
                  <RoomsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/quirofanos" element={
              <ProtectedRoute roles={['enfermero', 'medico_residente', 'medico_especialista', 'administrador']}>
                <Layout>
                  <QuirofanosPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/cirugias" element={
              <ProtectedRoute roles={['enfermero', 'medico_residente', 'medico_especialista', 'administrador']}>
                <Layout>
                  <CirugiasPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/pos" element={
              <ProtectedRoute roles={['cajero', 'administrador']}>
                <Layout>
                  <POSPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute roles={['almacenista', 'administrador']}>
                <Layout>
                  <InventoryPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/solicitudes" element={
              <ProtectedRoute roles={['enfermero', 'medico_residente', 'medico_especialista', 'almacenista', 'administrador']}>
                <Layout>
                  <SolicitudesPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/billing" element={
              <ProtectedRoute roles={['cajero', 'administrador', 'socio']}>
                <Layout>
                  <BillingPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/cuentas-por-cobrar" element={
              <ProtectedRoute roles={['cajero', 'administrador', 'socio']}>
                <Layout>
                  <CuentasPorCobrarPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/hospitalization" element={
              <ProtectedRoute roles={['cajero', 'enfermero', 'medico_residente', 'medico_especialista', 'administrador']}>
                <Layout>
                  <HospitalizationPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute roles={['administrador', 'socio', 'almacenista']}>
                <Layout>
                  <ReportsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute roles={['administrador']}>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Mi Perfil" />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Página No Encontrada" />
                </Layout>
              </ProtectedRoute>
            } />
            </Routes>
          </Suspense>
        </Router>

        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ThemeProvider>
    </Provider>
  );
}

export default App;