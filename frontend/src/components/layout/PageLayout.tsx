// ABOUTME: Componente template para estructura consistente de páginas
// Proporciona header estándar con título, icono y acciones, más contenedor para contenido

import React from 'react';
import { Box, Typography, Container, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageLayoutProps {
  /** Título principal de la página */
  title: string;
  /** Icono a mostrar junto al título */
  icon?: React.ReactNode;
  /** Acciones a mostrar en la esquina superior derecha (botones, etc.) */
  actions?: React.ReactNode;
  /** Contenido principal de la página */
  children: React.ReactNode;
  /** Ancho máximo del contenedor (default: false = sin límite) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  /** Padding interno (default: 3) */
  padding?: number;
  /** Breadcrumbs de navegación */
  breadcrumbs?: BreadcrumbItem[];
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Contenido adicional en el header (estadísticas, filtros, etc.) */
  headerContent?: React.ReactNode;
  /** Si se debe mostrar el header (default: true) */
  showHeader?: boolean;
}

/**
 * PageLayout - Template estándar para todas las páginas del sistema
 *
 * @example
 * // Uso básico
 * <PageLayout
 *   title="Empleados"
 *   icon={<PeopleIcon />}
 *   actions={<Button>Nuevo</Button>}
 * >
 *   {contenido}
 * </PageLayout>
 *
 * @example
 * // Con breadcrumbs y subtítulo
 * <PageLayout
 *   title="Detalle de Paciente"
 *   subtitle="Información completa del paciente"
 *   breadcrumbs={[
 *     { label: 'Pacientes', href: '/patients' },
 *     { label: 'Juan Pérez' }
 *   ]}
 * >
 *   {contenido}
 * </PageLayout>
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  icon,
  actions,
  children,
  maxWidth = false,
  padding = 3,
  breadcrumbs,
  subtitle,
  headerContent,
  showHeader = true
}) => {
  const navigate = useNavigate();

  const handleBreadcrumbClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  const content = (
    <Box sx={{ p: padding }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 2 }} aria-label="navegación">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return item.href && !isLast ? (
              <Link
                key={index}
                color="inherit"
                href={item.href}
                onClick={handleBreadcrumbClick(item.href)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {item.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {item.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header con título y acciones */}
      {showHeader && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontWeight: 500
              }}
            >
              {icon}
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {actions}
            </Box>
          )}
        </Box>
      )}

      {/* Contenido adicional del header */}
      {headerContent && (
        <Box sx={{ mb: 3 }}>
          {headerContent}
        </Box>
      )}

      {/* Contenido principal */}
      {children}
    </Box>
  );

  // Si maxWidth está definido, envolver en Container
  if (maxWidth) {
    return (
      <Container maxWidth={maxWidth}>
        {content}
      </Container>
    );
  }

  return content;
};

export default PageLayout;
