// ABOUTME: Componente de tarjetas de estadísticas de hospitalización
// ABOUTME: Extraído de HospitalizationPage para mejorar mantenibilidad

import React, { memo } from 'react';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import StatCard, { StatCardsGrid } from '@/components/common/StatCard';
import { HospitalizationStats } from '@/types/hospitalization.types';

interface HospitalizationStatsCardsProps {
  stats: HospitalizationStats | null;
}

const HospitalizationStatsCards: React.FC<HospitalizationStatsCardsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <StatCardsGrid sx={{ mb: 3 }}>
      <StatCard
        title="Total Camas"
        value={stats.totalCamas}
        subtitle={`${stats.camasDisponibles} disponibles`}
        icon={<HotelIcon />}
        color="primary"
      />
      <StatCard
        title="Ocupación"
        value={stats.porcentajeOcupacion}
        subtitle={`${stats.camasOcupadas} ocupadas`}
        icon={<TrendingUpIcon />}
        color="warning"
        format="percentage"
      />
      <StatCard
        title="Pacientes Hospitalizados"
        value={stats.pacientesHospitalizados}
        subtitle={`${stats.ingresosHoy} ingresos hoy`}
        icon={<PeopleIcon />}
        color="success"
      />
      <StatCard
        title="Altas Hoy"
        value={stats.altasHoy}
        subtitle={`Estancia: ${stats.estanciaPromedio} días`}
        icon={<ExitToAppIcon />}
        color="info"
      />
    </StatCardsGrid>
  );
};

export default memo(HospitalizationStatsCards);
