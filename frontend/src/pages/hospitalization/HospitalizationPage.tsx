// ABOUTME: Página de Hospitalización del sistema hospitalario
// ABOUTME: Gestión de ingresos, altas, notas médicas y traslados de pacientes

import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import {
  LocalHospital as LocalHospitalIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import PageHeader from '@/components/common/PageHeader';
import AuditTrail from '@/components/common/AuditTrail';
import { HospitalAdmission } from '@/types/hospitalization.types';

// Hook personalizado
import useHospitalization from '@/hooks/useHospitalization';

// Componentes extraídos
import HospitalizationStatsCards from './HospitalizationStatsCards';
import HospitalizationFilters from './HospitalizationFilters';
import AdmissionsTable from './AdmissionsTable';
import AdmissionDetailDialog from './AdmissionDetailDialog';

// Diálogos existentes
import AdmissionFormDialog from './AdmissionFormDialog';
import MedicalNotesDialog from './MedicalNotesDialog';
import DischargeDialog from './DischargeDialog';
import TransferLocationDialog from './TransferLocationDialog';

const HospitalizationPage: React.FC = () => {
  // Hook centralizado
  const {
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
  } = useHospitalization();

  // Estados de diálogos
  const [admissionDialogOpen, setAdmissionDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<HospitalAdmission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [medicalNotesDialogOpen, setMedicalNotesDialogOpen] = useState(false);
  const [selectedAdmissionForNotes, setSelectedAdmissionForNotes] = useState<HospitalAdmission | null>(null);
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<HospitalAdmission | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedAdmissionForTransfer, setSelectedAdmissionForTransfer] = useState<HospitalAdmission | null>(null);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [auditEntityId, setAuditEntityId] = useState<number>(0);

  // Handlers de diálogos
  const handleViewDetails = useCallback((admission: HospitalAdmission) => {
    setSelectedAdmission(admission);
    setDetailDialogOpen(true);
  }, []);

  const handleOpenMedicalNotes = useCallback((admission: HospitalAdmission) => {
    setSelectedAdmissionForNotes(admission);
    setMedicalNotesDialogOpen(true);
  }, []);

  const handleOpenDischarge = useCallback((admission: HospitalAdmission) => {
    setSelectedAdmissionForDischarge(admission);
    setDischargeDialogOpen(true);
  }, []);

  const handleOpenTransfer = useCallback((admission: HospitalAdmission) => {
    setSelectedAdmissionForTransfer(admission);
    setTransferDialogOpen(true);
  }, []);

  const handleOpenAuditTrail = useCallback((admission: HospitalAdmission) => {
    setAuditEntityId(admission.id);
    setAuditTrailOpen(true);
  }, []);

  const handleCloseAuditTrail = useCallback(() => {
    setAuditTrailOpen(false);
    setAuditEntityId(0);
  }, []);

  const onViewPatientStatus = useCallback(async (admission: HospitalAdmission) => {
    const patientData = await handleViewPatientStatus(admission);
    if (patientData) {
      setSelectedAdmission(patientData);
      setDetailDialogOpen(true);
    }
  }, [handleViewPatientStatus]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header unificado */}
      <PageHeader
        title="Hospitalización"
        subtitle="Gestión integral de pacientes hospitalizados, ingresos y altas médicas"
        icon={<LocalHospitalIcon />}
        iconColor="primary"
        actions={permisos.puedeCrearIngreso ? [
          {
            label: 'Nuevo Ingreso',
            icon: <AddIcon />,
            onClick: () => setAdmissionDialogOpen(true),
            variant: 'contained',
          }
        ] : undefined}
      />

      {/* Tarjetas de estadísticas */}
      <HospitalizationStatsCards stats={stats} />

      {/* Filtros de búsqueda */}
      <HospitalizationFilters
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        selectedSpecialty={selectedSpecialty}
        selectedSpaceType={selectedSpaceType}
        onSearchTermChange={setSearchTerm}
        onStatusChange={setSelectedStatus}
        onSpecialtyChange={setSelectedSpecialty}
        onSpaceTypeChange={setSelectedSpaceType}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
      />

      {/* Tabla de hospitalizaciones */}
      <AdmissionsTable
        admissions={admissions}
        loading={loading}
        error={error}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={filters.pagina || 1}
        userRole={user?.rol}
        permisos={permisos}
        onNewAdmission={() => setAdmissionDialogOpen(true)}
        onViewDetails={handleViewDetails}
        onOpenMedicalNotes={handleOpenMedicalNotes}
        onViewPatientStatus={onViewPatientStatus}
        onOpenDischarge={handleOpenDischarge}
        onOpenTransfer={handleOpenTransfer}
        onOpenAuditTrail={handleOpenAuditTrail}
        onPageChange={handlePageChange}
      />

      {/* Diálogo de detalle de hospitalización */}
      <AdmissionDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        admission={selectedAdmission}
      />

      {/* Diálogo para nuevo ingreso */}
      <AdmissionFormDialog
        open={admissionDialogOpen}
        onClose={() => setAdmissionDialogOpen(false)}
        onSuccess={() => {
          setAdmissionDialogOpen(false);
          loadData();
        }}
      />

      {/* Diálogo para notas médicas SOAP */}
      <MedicalNotesDialog
        open={medicalNotesDialogOpen}
        onClose={() => {
          setMedicalNotesDialogOpen(false);
          setSelectedAdmissionForNotes(null);
        }}
        admission={selectedAdmissionForNotes}
        onSuccess={() => {
          toast.success('Nota médica guardada exitosamente');
        }}
      />

      {/* Diálogo para alta hospitalaria */}
      <DischargeDialog
        open={dischargeDialogOpen}
        onClose={() => {
          setDischargeDialogOpen(false);
          setSelectedAdmissionForDischarge(null);
        }}
        admission={selectedAdmissionForDischarge}
        onSuccess={() => {
          setDischargeDialogOpen(false);
          setSelectedAdmissionForDischarge(null);
          loadData();
        }}
      />

      {/* Diálogo para traslado de ubicación */}
      <TransferLocationDialog
        open={transferDialogOpen}
        onClose={() => {
          setTransferDialogOpen(false);
          setSelectedAdmissionForTransfer(null);
        }}
        admission={selectedAdmissionForTransfer}
        onSuccess={() => {
          setTransferDialogOpen(false);
          setSelectedAdmissionForTransfer(null);
          loadData();
        }}
      />

      {/* Audit Trail Dialog */}
      <AuditTrail
        open={auditTrailOpen}
        onClose={handleCloseAuditTrail}
        entityType="hospitalizacion"
        entityId={auditEntityId}
        title="Historial de Cambios - Hospitalización"
      />
    </Box>
  );
};

export default HospitalizationPage;
