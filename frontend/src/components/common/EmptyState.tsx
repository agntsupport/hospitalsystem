// ABOUTME: Componente EmptyState unificado del Design System
// ABOUTME: Muestra estados vacíos consistentes en tablas, listas y búsquedas

import React, { memo } from 'react';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { spacing, emptyState } from '@/theme';

/**
 * Tipos predefinidos de estado vacío
 */
export type EmptyStateType = 'empty' | 'search' | 'error' | 'no-results' | 'custom';

/**
 * Props del componente EmptyState
 */
export interface EmptyStateProps {
  /** Tipo de estado vacío predefinido */
  type?: EmptyStateType;
  /** Título del estado */
  title?: string;
  /** Descripción o mensaje adicional */
  description?: string;
  /** Icono personalizado */
  icon?: React.ReactNode;
  /** Color del icono */
  iconColor?: 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'inherit';
  /** Acción principal */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'text' | 'outlined' | 'contained';
  };
  /** Acción secundaria */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Tamaño del componente */
  size?: 'small' | 'medium' | 'large';
  /** Término de búsqueda (para type='search' o 'no-results') */
  searchTerm?: string;
}

/**
 * Configuraciones predefinidas por tipo
 */
const typeConfigs: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  empty: {
    icon: <InboxIcon />,
    title: 'Sin datos',
    description: 'No hay información disponible en este momento.',
  },
  search: {
    icon: <SearchOffIcon />,
    title: 'Sin resultados',
    description: 'No se encontraron resultados para tu búsqueda.',
  },
  'no-results': {
    icon: <SearchOffIcon />,
    title: 'Sin coincidencias',
    description: 'Intenta con otros términos o ajusta los filtros.',
  },
  error: {
    icon: <ErrorOutlineIcon />,
    title: 'Error al cargar',
    description: 'Ocurrió un error al cargar los datos. Intenta de nuevo.',
  },
  custom: {
    icon: <InboxIcon />,
    title: 'Sin datos',
    description: '',
  },
};

/**
 * Tamaños predefinidos
 */
const sizeConfigs = {
  small: {
    iconSize: 48,
    titleVariant: 'subtitle1' as const,
    descVariant: 'body2' as const,
    padding: spacing.md,
  },
  medium: {
    iconSize: 64,
    titleVariant: 'h6' as const,
    descVariant: 'body2' as const,
    padding: spacing.lg,
  },
  large: {
    iconSize: 80,
    titleVariant: 'h5' as const,
    descVariant: 'body1' as const,
    padding: spacing.xl,
  },
};

/**
 * EmptyState - Componente para mostrar estados vacíos
 *
 * @example
 * // Estado vacío básico
 * <EmptyState
 *   type="empty"
 *   action={{ label: 'Agregar nuevo', onClick: handleAdd }}
 * />
 *
 * @example
 * // Resultado de búsqueda vacío
 * <EmptyState
 *   type="search"
 *   searchTerm="Juan Pérez"
 *   action={{ label: 'Limpiar búsqueda', onClick: handleClear }}
 * />
 *
 * @example
 * // Estado personalizado
 * <EmptyState
 *   type="custom"
 *   icon={<LocalHospitalIcon />}
 *   title="Sin pacientes hospitalizados"
 *   description="Actualmente no hay pacientes en hospitalización."
 *   action={{
 *     label: 'Registrar ingreso',
 *     onClick: handleNewAdmission,
 *     icon: <AddIcon />
 *   }}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = memo(({
  type = 'empty',
  title,
  description,
  icon,
  iconColor = 'inherit',
  action,
  secondaryAction,
  size = 'medium',
  searchTerm,
}) => {
  const theme = useTheme();
  const config = typeConfigs[type];
  const sizeConfig = sizeConfigs[size];

  // Determinar valores finales
  const finalIcon = icon || config.icon;
  const finalTitle = title || config.title;
  let finalDescription = description || config.description;

  // Agregar término de búsqueda a la descripción si aplica
  if (searchTerm && (type === 'search' || type === 'no-results')) {
    finalDescription = `No se encontraron resultados para "${searchTerm}". ${finalDescription}`;
  }

  // Determinar color del icono
  const getIconColor = () => {
    if (iconColor === 'inherit') {
      return theme.palette.grey[400];
    }
    return theme.palette[iconColor].main;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: sizeConfig.padding,
        px: spacing.md,
        minHeight: emptyState.minHeight,
      }}
    >
      {/* Icono */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sizeConfig.iconSize * 1.5,
          height: sizeConfig.iconSize * 1.5,
          borderRadius: '50%',
          bgcolor: alpha(getIconColor(), 0.1),
          color: getIconColor(),
          mb: spacing.sm,
          '& svg': {
            fontSize: sizeConfig.iconSize,
          },
        }}
      >
        {finalIcon}
      </Box>

      {/* Título */}
      <Typography
        variant={sizeConfig.titleVariant}
        color="text.primary"
        sx={{
          fontWeight: 600,
          mb: 1,
          maxWidth: emptyState.maxTextWidth,
        }}
      >
        {finalTitle}
      </Typography>

      {/* Descripción */}
      {finalDescription && (
        <Typography
          variant={sizeConfig.descVariant}
          color="text.secondary"
          sx={{
            mb: action || secondaryAction ? spacing.sm : 0,
            maxWidth: emptyState.maxTextWidth,
          }}
        >
          {finalDescription}
        </Typography>
      )}

      {/* Acciones */}
      {(action || secondaryAction) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            mt: spacing.sm,
          }}
        >
          {action && (
            <Button
              variant={action.variant || 'contained'}
              color="primary"
              startIcon={action.icon || <AddCircleOutlineIcon />}
              onClick={action.onClick}
              size={size === 'small' ? 'small' : 'medium'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="text"
              color="primary"
              onClick={secondaryAction.onClick}
              size="small"
            >
              {secondaryAction.label}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * TableEmptyState - Versión optimizada para tablas
 */
export const TableEmptyState: React.FC<Omit<EmptyStateProps, 'size'>> = (props) => (
  <EmptyState {...props} size="medium" />
);

/**
 * SearchEmptyState - Versión optimizada para búsquedas
 */
export const SearchEmptyState: React.FC<{
  searchTerm: string;
  onClear?: () => void;
}> = ({ searchTerm, onClear }) => (
  <EmptyState
    type="search"
    searchTerm={searchTerm}
    size="medium"
    action={
      onClear
        ? {
            label: 'Limpiar búsqueda',
            onClick: onClear,
            variant: 'outlined',
          }
        : undefined
    }
  />
);

export default EmptyState;
