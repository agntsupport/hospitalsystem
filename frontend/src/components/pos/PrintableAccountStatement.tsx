// ABOUTME: Componente de Estado de Cuenta imprimible en formato Carta (8.5x11 pulgadas)
// Genera un documento profesional con detalles completos de servicios y productos para pacientes hospitalizados

import React, { forwardRef } from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface Transaction {
  id: number;
  tipo: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fecha: string;
  producto?: {
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
  servicio?: {
    codigo: string;
    nombre: string;
    tipo: string;
  };
}

interface AccountStatementData {
  cuentaId: number;
  fechaEmision: Date;
  paciente: {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  };
  medicoTratante?: {
    nombre: string;
    apellidoPaterno: string;
    especialidad?: string;
  };
  tipoAtencion: string;
  fechaIngreso: string;
  habitacion?: string;
  transacciones: Transaction[];
  totales: {
    anticipo: number;
    totalServicios: number;
    totalProductos: number;
    totalCuenta: number;
    saldoPendiente: number;
  };
  estado: 'abierta' | 'cerrada';
}

interface PrintableAccountStatementProps {
  data: AccountStatementData;
}

const PrintableAccountStatement = forwardRef<HTMLDivElement, PrintableAccountStatementProps>(
  ({ data }, ref) => {
    // Estilos para formato Carta (8.5" x 11")
    const pageStyles: React.CSSProperties = {
      width: '8.5in',
      minHeight: '11in',
      margin: '0 auto',
      padding: '0.5in 0.75in',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '10pt',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff',
      boxSizing: 'border-box'
    };

    const headerStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '2px solid #1976d2'
    };

    const logoSection: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    };

    const documentInfo: React.CSSProperties = {
      textAlign: 'right'
    };

    const sectionTitle: React.CSSProperties = {
      fontSize: '12pt',
      fontWeight: 'bold',
      color: '#1976d2',
      marginBottom: '10px',
      marginTop: '20px',
      paddingBottom: '5px',
      borderBottom: '1px solid #e0e0e0'
    };

    const infoGrid: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginBottom: '15px'
    };

    const infoBox: React.CSSProperties = {
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px'
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '9pt',
      color: '#666',
      marginBottom: '2px'
    };

    const valueStyle: React.CSSProperties = {
      fontSize: '10pt',
      fontWeight: 500
    };

    const tableStyle: React.CSSProperties = {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '20px',
      fontSize: '9pt'
    };

    const thStyle: React.CSSProperties = {
      backgroundColor: '#1976d2',
      color: '#fff',
      padding: '8px 6px',
      textAlign: 'left',
      fontWeight: 'bold',
      fontSize: '9pt'
    };

    const tdStyle: React.CSSProperties = {
      padding: '6px',
      borderBottom: '1px solid #e0e0e0',
      verticalAlign: 'top'
    };

    const tdRightStyle: React.CSSProperties = {
      ...tdStyle,
      textAlign: 'right'
    };

    const tdCenterStyle: React.CSSProperties = {
      ...tdStyle,
      textAlign: 'center'
    };

    const totalsBox: React.CSSProperties = {
      marginTop: '20px',
      marginLeft: 'auto',
      width: '300px',
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px'
    };

    const totalRow: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      fontSize: '10pt'
    };

    const grandTotalRow: React.CSSProperties = {
      ...totalRow,
      paddingTop: '10px',
      marginTop: '10px',
      borderTop: '2px solid #1976d2',
      fontWeight: 'bold',
      fontSize: '12pt'
    };

    const footerStyle: React.CSSProperties = {
      marginTop: '30px',
      paddingTop: '15px',
      borderTop: '1px solid #e0e0e0',
      fontSize: '8pt',
      color: '#666',
      textAlign: 'center'
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getTipoAtencionLabel = (tipo: string) => {
      const labels: Record<string, string> = {
        consulta_general: 'Consulta General',
        urgencia: 'Urgencias',
        hospitalizacion: 'Hospitalización'
      };
      return labels[tipo] || tipo;
    };

    // Separar transacciones por tipo
    const servicios = data.transacciones.filter(t => t.tipo === 'servicio');
    const productos = data.transacciones.filter(t => t.tipo === 'producto');
    const anticipos = data.transacciones.filter(t => t.tipo === 'anticipo');

    return (
      <div ref={ref} style={pageStyles}>
        {/* Encabezado */}
        <div style={headerStyle}>
          <div style={logoSection}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
              HOSPITAL GENERAL
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Sistema de Gestión Hospitalaria
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              AGNT: Infraestructura Tecnológica Empresarial
            </Typography>
          </div>
          <div style={documentInfo}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
              ESTADO DE CUENTA
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Cuenta #{String(data.cuentaId).padStart(6, '0')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Fecha: {formatDate(data.fechaEmision.toISOString())}
            </Typography>
            <Box sx={{
              mt: 1,
              px: 1.5,
              py: 0.5,
              bgcolor: data.estado === 'abierta' ? '#e3f2fd' : '#e8f5e9',
              borderRadius: 1,
              display: 'inline-block'
            }}>
              <Typography variant="caption" sx={{
                fontWeight: 'bold',
                color: data.estado === 'abierta' ? '#1565c0' : '#2e7d32'
              }}>
                {data.estado === 'abierta' ? 'CUENTA EN CURSO' : 'CUENTA CERRADA'}
              </Typography>
            </Box>
          </div>
        </div>

        {/* Información del Paciente y Atención */}
        <div style={infoGrid}>
          <div style={infoBox}>
            <div style={sectionTitle}>DATOS DEL PACIENTE</div>
            <div style={{ marginBottom: '8px' }}>
              <div style={labelStyle}>Nombre Completo</div>
              <div style={{ ...valueStyle, fontSize: '11pt' }}>
                {data.paciente.nombre} {data.paciente.apellidoPaterno} {data.paciente.apellidoMaterno || ''}
              </div>
            </div>
            {data.paciente.telefono && (
              <div style={{ marginBottom: '8px' }}>
                <div style={labelStyle}>Teléfono</div>
                <div style={valueStyle}>{data.paciente.telefono}</div>
              </div>
            )}
            {data.paciente.email && (
              <div>
                <div style={labelStyle}>Correo Electrónico</div>
                <div style={valueStyle}>{data.paciente.email}</div>
              </div>
            )}
          </div>

          <div style={infoBox}>
            <div style={sectionTitle}>DATOS DE ATENCIÓN</div>
            <div style={{ marginBottom: '8px' }}>
              <div style={labelStyle}>Tipo de Atención</div>
              <div style={valueStyle}>{getTipoAtencionLabel(data.tipoAtencion)}</div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={labelStyle}>Fecha de Ingreso</div>
              <div style={valueStyle}>{formatDateTime(data.fechaIngreso)}</div>
            </div>
            {data.medicoTratante && (
              <div style={{ marginBottom: '8px' }}>
                <div style={labelStyle}>Médico Tratante</div>
                <div style={valueStyle}>
                  Dr(a). {data.medicoTratante.nombre} {data.medicoTratante.apellidoPaterno}
                </div>
                {data.medicoTratante.especialidad && (
                  <div style={{ fontSize: '9pt', color: '#666' }}>
                    {data.medicoTratante.especialidad}
                  </div>
                )}
              </div>
            )}
            {data.habitacion && (
              <div>
                <div style={labelStyle}>Habitación</div>
                <div style={valueStyle}>{data.habitacion}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Anticipos */}
        {anticipos.length > 0 && (
          <>
            <div style={sectionTitle}>ANTICIPOS REGISTRADOS</div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Concepto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {anticipos.map((item, idx) => (
                  <tr key={`anticipo-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>{formatDateTime(item.fecha)}</td>
                    <td style={tdStyle}>{item.concepto}</td>
                    <td style={tdRightStyle}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Tabla de Servicios */}
        {servicios.length > 0 && (
          <>
            <div style={sectionTitle}>SERVICIOS MÉDICOS</div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Código</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Cant.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>P. Unitario</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((item, idx) => (
                  <tr key={`servicio-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>{formatDateTime(item.fecha)}</td>
                    <td style={tdStyle}>{item.servicio?.codigo || '-'}</td>
                    <td style={tdStyle}>
                      {item.concepto}
                      {item.servicio?.tipo && (
                        <span style={{ fontSize: '8pt', color: '#666', display: 'block' }}>
                          ({item.servicio.tipo})
                        </span>
                      )}
                    </td>
                    <td style={tdCenterStyle}>{item.cantidad}</td>
                    <td style={tdRightStyle}>{formatCurrency(item.precioUnitario)}</td>
                    <td style={tdRightStyle}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#e3f2fd' }}>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>
                    Subtotal Servicios:
                  </td>
                  <td style={{ ...tdRightStyle, fontWeight: 'bold' }}>
                    {formatCurrency(data.totales.totalServicios)}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Tabla de Productos */}
        {productos.length > 0 && (
          <>
            <div style={sectionTitle}>PRODUCTOS Y MEDICAMENTOS</div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Código</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Cant.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>P. Unitario</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((item, idx) => (
                  <tr key={`producto-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>{formatDateTime(item.fecha)}</td>
                    <td style={tdStyle}>{item.producto?.codigo || '-'}</td>
                    <td style={tdStyle}>
                      {item.concepto}
                      {item.producto?.unidadMedida && (
                        <span style={{ fontSize: '8pt', color: '#666', display: 'block' }}>
                          Unidad: {item.producto.unidadMedida}
                        </span>
                      )}
                    </td>
                    <td style={tdCenterStyle}>{item.cantidad}</td>
                    <td style={tdRightStyle}>{formatCurrency(item.precioUnitario)}</td>
                    <td style={tdRightStyle}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#e3f2fd' }}>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>
                    Subtotal Productos:
                  </td>
                  <td style={{ ...tdRightStyle, fontWeight: 'bold' }}>
                    {formatCurrency(data.totales.totalProductos)}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Resumen de Totales */}
        <div style={totalsBox}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#1976d2' }}>
            RESUMEN DE CUENTA
          </Typography>

          <div style={totalRow}>
            <span>Subtotal Servicios:</span>
            <span>{formatCurrency(data.totales.totalServicios)}</span>
          </div>

          <div style={totalRow}>
            <span>Subtotal Productos:</span>
            <span>{formatCurrency(data.totales.totalProductos)}</span>
          </div>

          <div style={{ ...totalRow, borderTop: '1px solid #ccc', paddingTop: '8px', marginTop: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Total Cargos:</span>
            <span style={{ fontWeight: 'bold' }}>{formatCurrency(data.totales.totalCuenta)}</span>
          </div>

          <div style={totalRow}>
            <span style={{ color: '#2e7d32' }}>(-) Anticipos:</span>
            <span style={{ color: '#2e7d32' }}>{formatCurrency(data.totales.anticipo)}</span>
          </div>

          <div style={grandTotalRow}>
            <span>{data.totales.saldoPendiente >= 0 ? 'Saldo a Favor:' : 'Saldo por Pagar:'}</span>
            <span style={{
              color: data.totales.saldoPendiente >= 0 ? '#2e7d32' : '#d32f2f'
            }}>
              {data.totales.saldoPendiente >= 0
                ? `+${formatCurrency(Math.abs(data.totales.saldoPendiente))}`
                : formatCurrency(Math.abs(data.totales.saldoPendiente))
              }
            </span>
          </div>
        </div>

        {/* Nota informativa para cuentas abiertas */}
        {data.estado === 'abierta' && (
          <Box sx={{
            mt: 3,
            p: 2,
            bgcolor: '#fff3e0',
            borderRadius: 1,
            border: '1px solid #ffcc80'
          }}>
            <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 'bold', mb: 0.5 }}>
              NOTA IMPORTANTE
            </Typography>
            <Typography variant="caption" sx={{ color: '#bf360c' }}>
              Este estado de cuenta es informativo y corresponde a los cargos registrados hasta la fecha de emisión.
              El monto final puede variar con servicios y productos adicionales que se agreguen durante la estancia.
              Para información actualizada, solicite un nuevo estado de cuenta en caja.
            </Typography>
          </Box>
        )}

        {/* Pie de página */}
        <div style={footerStyle}>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
            Este documento es un comprobante informativo generado por el Sistema de Gestión Hospitalaria
          </Typography>
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            Fecha y hora de impresión: {new Date().toLocaleString('es-MX')}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" display="block">
            © {new Date().getFullYear()} AGNT: Infraestructura Tecnológica Empresarial e Inteligencia Artificial
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            Hospital General - Tel: (443) 104-7479
          </Typography>
        </div>
      </div>
    );
  }
);

PrintableAccountStatement.displayName = 'PrintableAccountStatement';

export default PrintableAccountStatement;
