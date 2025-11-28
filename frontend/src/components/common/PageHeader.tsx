// ABOUTME: Componente PageHeader unificado del Design System
// ABOUTME: Proporciona un header consistente para todas las páginas del sistema

import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { spacing, iconSize, typography } from '@/theme';

/**
 * Item de breadcrumb
 */
export interface BreadcrumbItem {
  /** Texto a mostrar */
  label: string;
  /** URL para navegación (opcional, el último item no tiene link) */
  href?: string;
  /** Icono opcional */
  icon?: React.ReactNode;
}

/**
 * Acción del header
 */
export interface HeaderAction {
  /** Texto del botón */
  label: string;
  /** Icono del botón */
  icon?: React.ReactNode;
  /** Función al hacer click */
  onClick: () => void;
  /** Variante del botón */
  variant?: 'text' | 'outlined' | 'contained';
  /** Color del botón */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Deshabilitado */
  disabled?: boolean;
  /** Tooltip */
  tooltip?: string;
}

/**
 * Props del componente PageHeader
 */
export interface PageHeaderProps {
  /** Título de la página */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Icono de la página */
  icon?: React.ReactNode;
  /** Color del icono */
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Breadcrumbs de navegación */
  breadcrumbs?: BreadcrumbItem[];
  /** Acciones del header (botones) */
  actions?: HeaderAction[];
  /** Acciones como iconos (para acciones secundarias) */
  iconActions?: Array<{
    icon: React.ReactNode;
    onClick: () => void;
    tooltip: string;
    disabled?: boolean;
  }>;
  /** Mostrar botón de regreso */
  showBackButton?: boolean;
  /** URL para el botón de regreso (default: -1 en history) */
  backUrl?: string;
  /** Contenido adicional debajo del título */
  children?: React.ReactNode;
}

/**
 * PageHeader - Header unificado para todas las páginas
 *
 * @example
 * // Uso básico
 * <PageHeader
 *   title="Pacientes"
 *   icon={<PeopleIcon />}
 * />
 *
 * @example
 * // Con breadcrumbs y acciones
 * <PageHeader
 *   title="Detalle de Paciente"
 *   subtitle="Juan Pérez García"
 *   icon={<PersonIcon />}
 *   breadcrumbs={[
 *     { label: 'Inicio', href: '/dashboard' },
 *     { label: 'Pacientes', href: '/patients' },
 *     { label: 'Detalle' },
 *   ]}
 *   actions={[
 *     { label: 'Editar', icon: <EditIcon />, onClick: handleEdit, variant: 'outlined' },
 *     { label: 'Nuevo Ingreso', icon: <AddIcon />, onClick: handleNew, variant: 'contained' },
 *   ]}
 *   showBackButton
 * />
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconColor = 'primary',
  breadcrumbs,
  actions,
  iconActions,
  showBackButton = false,
  backUrl,
  children,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const colorValue = theme.palette[iconColor].main;
  const lightColor = alpha(colorValue, 0.1);

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={{ mb: spacing.md }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: spacing.sm }}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography
                key={index}
                color="text.primary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {item.icon}
                {item.label}
              </Typography>
            ) : (
              <Link
                key={index}
                color="inherit"
                href={item.href}
                onClick={(e) => {
                  if (item.href) {
                    e.preventDefault();
                    navigate(item.href);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header principal */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        {/* Lado izquierdo: Back button + Icon + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          {/* Botón de regreso */}
          {showBackButton && (
            <IconButton
              onClick={handleBack}
              sx={{
                bgcolor: 'grey.100',
                '&:hover': {
                  bgcolor: 'grey.200',
                },
              }}
              aria-label="Regresar"
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          {/* Icono de página */}
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: iconSize.xl,
                height: iconSize.xl,
                borderRadius: 1,
                bgcolor: lightColor,
                color: colorValue,
                '& svg': {
                  fontSize: iconSize.lg,
                },
              }}
            >
              {icon}
            </Box>
          )}

          {/* Título y subtítulo */}
          <Box>
            <Typography
              variant={typography.pageTitle}
              component="h1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Lado derecho: Acciones */}
        {(actions || iconActions) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* Acciones como iconos */}
            {iconActions?.map((action, index) => (
              <Tooltip key={`icon-action-${index}`} title={action.tooltip}>
                <span>
                  <IconButton
                    onClick={action.onClick}
                    disabled={action.disabled}
                    size="medium"
                    sx={{
                      bgcolor: 'grey.100',
                      '&:hover': {
                        bgcolor: 'grey.200',
                      },
                    }}
                  >
                    {action.icon}
                  </IconButton>
                </span>
              </Tooltip>
            ))}

            {/* Acciones como botones */}
            {actions?.map((action, index) => {
              const button = (
                <Button
                  key={`action-${index}`}
                  variant={action.variant || 'contained'}
                  color={action.color || 'primary'}
                  startIcon={action.icon}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  size="medium"
                >
                  {action.label}
                </Button>
              );

              return action.tooltip ? (
                <Tooltip key={`action-${index}`} title={action.tooltip}>
                  <span>{button}</span>
                </Tooltip>
              ) : (
                button
              );
            })}
          </Box>
        )}
      </Box>

      {/* Contenido adicional */}
      {children && <Box sx={{ mt: spacing.sm }}>{children}</Box>}
    </Box>
  );
};

export default PageHeader;
