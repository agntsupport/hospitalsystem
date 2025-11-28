// ABOUTME: Componente de ticket imprimible para historial de cuentas POS
// ABOUTME: Genera un recibo detallado con todas las transacciones (servicios, productos, pagos)

import React, { forwardRef } from 'react';
import { Typography, Divider } from '@mui/material';
import { PatientAccount } from '@/types/pos.types';

interface HistoryPrintableReceiptProps {
  account: PatientAccount;
}

const HistoryPrintableReceipt = forwardRef<HTMLDivElement, HistoryPrintableReceiptProps>(
  ({ account }, ref) => {
    const receiptStyles: React.CSSProperties = {
      width: '80mm',
      maxWidth: '80mm',
      margin: '0 auto',
      padding: '10mm',
      fontFamily: 'monospace, Courier New',
      fontSize: '11pt',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff'
    };

    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '6mm',
      borderBottom: '2px dashed #000',
      paddingBottom: '4mm'
    };

    const sectionStyle: React.CSSProperties = {
      marginBottom: '4mm'
    };

    const rowStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '1.5mm'
    };

    const boldStyle: React.CSSProperties = {
      fontWeight: 'bold'
    };

    const centerStyle: React.CSSProperties = {
      textAlign: 'center'
    };

    const itemRowStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '1mm',
      fontSize: '10pt'
    };

    const totalStyle: React.CSSProperties = {
      fontSize: '12pt',
      fontWeight: 'bold',
      borderTop: '2px solid #000',
      borderBottom: '2px solid #000',
      padding: '2mm 0',
      marginTop: '3mm',
      marginBottom: '3mm'
    };

    const footerStyle: React.CSSProperties = {
      marginTop: '6mm',
      paddingTop: '4mm',
      borderTop: '2px dashed #000',
      textAlign: 'center',
      fontSize: '9pt'
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getAttentionTypeLabel = (tipo: string) => {
      const labels: Record<string, string> = {
        'consulta_general': 'Consulta General',
        'urgencia': 'Urgencia',
        'hospitalizacion': 'Hospitalización'
      };
      return labels[tipo] || tipo;
    };

    // Separar transacciones por tipo
    const servicios = account.transacciones?.filter(t => t.tipo === 'servicio') || [];
    const productos = account.transacciones?.filter(t => t.tipo === 'producto') || [];
    const pagos = account.transacciones?.filter(t => t.tipo === 'pago' || t.tipo === 'anticipo') || [];

    const pacienteNombre = account.paciente
      ? `${account.paciente.nombre} ${account.paciente.apellidoPaterno || ''} ${account.paciente.apellidoMaterno || ''}`.trim()
      : 'Paciente no encontrado';

    return (
      <div ref={ref} style={receiptStyles}>
        {/* Encabezado */}
        <div style={headerStyle}>
          <Typography variant="h5" style={{ ...boldStyle, marginBottom: '2mm', fontSize: '14pt' }}>
            HOSPITAL GENERAL
          </Typography>
          <Typography variant="caption" style={{ fontSize: '9pt', display: 'block' }}>
            Sistema de Gestión Hospitalaria
          </Typography>
          <Typography variant="caption" style={{ fontSize: '9pt', display: 'block' }}>
            AGNT: Infraestructura Tecnológica
          </Typography>
        </div>

        {/* Tipo de Documento */}
        <div style={{ ...centerStyle, ...sectionStyle }}>
          <Typography variant="h6" style={{ ...boldStyle, fontSize: '12pt' }}>
            === TICKET DE CUENTA ===
          </Typography>
          <Typography variant="caption" style={{ fontSize: '9pt' }}>
            (Copia del Historial)
          </Typography>
        </div>

        {/* Información de la Cuenta */}
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span>Cuenta No.:</span>
            <span style={boldStyle}>{String(account.id).padStart(6, '0')}</span>
          </div>
          <div style={rowStyle}>
            <span>Tipo:</span>
            <span>{getAttentionTypeLabel(account.tipoAtencion)}</span>
          </div>
          <div style={rowStyle}>
            <span>Fecha Apertura:</span>
            <span>{formatDate(account.fechaApertura)}</span>
          </div>
          {account.fechaCierre && (
            <div style={rowStyle}>
              <span>Fecha Cierre:</span>
              <span>{formatDate(account.fechaCierre)}</span>
            </div>
          )}
        </div>

        <Divider style={{ margin: '3mm 0', borderColor: '#000' }} />

        {/* Información del Paciente */}
        <div style={sectionStyle}>
          <Typography variant="body2" style={{ ...boldStyle, marginBottom: '1.5mm', fontSize: '10pt' }}>
            PACIENTE:
          </Typography>
          <Typography variant="body2" style={{ fontSize: '10pt' }}>
            {pacienteNombre}
          </Typography>
          {account.paciente?.telefono && (
            <Typography variant="body2" style={{ fontSize: '9pt' }}>
              Tel: {account.paciente.telefono}
            </Typography>
          )}
        </div>

        <Divider style={{ margin: '3mm 0', borderColor: '#000' }} />

        {/* Servicios */}
        {servicios.length > 0 && (
          <div style={sectionStyle}>
            <Typography variant="body2" style={{ ...boldStyle, marginBottom: '2mm', fontSize: '10pt' }}>
              SERVICIOS ({servicios.length}):
            </Typography>
            {servicios.map((item, idx) => (
              <div key={`serv-${idx}`} style={itemRowStyle}>
                <span style={{ maxWidth: '55mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.cantidad > 1 ? `${item.cantidad}x ` : ''}{item.concepto}
                </span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ ...rowStyle, marginTop: '1mm', borderTop: '1px dotted #000', paddingTop: '1mm' }}>
              <span style={boldStyle}>Subtotal Servicios:</span>
              <span style={boldStyle}>{formatCurrency(account.totalServicios)}</span>
            </div>
          </div>
        )}

        {/* Productos */}
        {productos.length > 0 && (
          <div style={sectionStyle}>
            <Typography variant="body2" style={{ ...boldStyle, marginBottom: '2mm', fontSize: '10pt' }}>
              PRODUCTOS ({productos.length}):
            </Typography>
            {productos.map((item, idx) => (
              <div key={`prod-${idx}`} style={itemRowStyle}>
                <span style={{ maxWidth: '55mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.cantidad > 1 ? `${item.cantidad}x ` : ''}{item.concepto}
                </span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ ...rowStyle, marginTop: '1mm', borderTop: '1px dotted #000', paddingTop: '1mm' }}>
              <span style={boldStyle}>Subtotal Productos:</span>
              <span style={boldStyle}>{formatCurrency(account.totalProductos)}</span>
            </div>
          </div>
        )}

        <Divider style={{ margin: '3mm 0', borderColor: '#000' }} />

        {/* Pagos Registrados */}
        {pagos.length > 0 && (
          <div style={sectionStyle}>
            <Typography variant="body2" style={{ ...boldStyle, marginBottom: '2mm', fontSize: '10pt' }}>
              PAGOS REGISTRADOS:
            </Typography>
            {pagos.map((pago, idx) => (
              <div key={`pago-${idx}`} style={itemRowStyle}>
                <span style={{ maxWidth: '50mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pago.concepto}
                </span>
                <span style={{ color: '#2e7d32' }}>{formatCurrency(pago.subtotal)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Resumen Financiero */}
        <div style={sectionStyle}>
          <Typography variant="body2" style={{ ...boldStyle, marginBottom: '2mm', fontSize: '10pt' }}>
            RESUMEN:
          </Typography>

          <div style={rowStyle}>
            <span>Total Servicios:</span>
            <span>{formatCurrency(account.totalServicios)}</span>
          </div>
          <div style={rowStyle}>
            <span>Total Productos:</span>
            <span>{formatCurrency(account.totalProductos)}</span>
          </div>

          <div style={{ ...rowStyle, ...totalStyle }}>
            <span>TOTAL CUENTA:</span>
            <span>{formatCurrency(account.totalCuenta)}</span>
          </div>

          {account.anticipo > 0 && (
            <div style={rowStyle}>
              <span>Anticipos/Pagos:</span>
              <span style={{ color: '#2e7d32' }}>-{formatCurrency(account.anticipo)}</span>
            </div>
          )}

          <div style={{ ...rowStyle, fontSize: '12pt', ...boldStyle }}>
            <span>SALDO FINAL:</span>
            <span style={{ color: account.saldoPendiente > 0 ? '#d32f2f' : '#2e7d32' }}>
              {formatCurrency(account.saldoPendiente)}
            </span>
          </div>
        </div>

        {/* Estado de la cuenta */}
        <div style={{ ...centerStyle, marginTop: '4mm', marginBottom: '4mm' }}>
          <Typography
            variant="body1"
            style={{
              ...boldStyle,
              fontSize: '12pt',
              padding: '2mm 4mm',
              border: '2px solid #000',
              display: 'inline-block'
            }}
          >
            ESTADO: {account.estado.toUpperCase()}
          </Typography>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <Typography variant="caption" style={{ fontSize: '9pt', display: 'block', marginBottom: '2mm' }}>
            Comprobante generado del historial
          </Typography>
          <Typography variant="caption" style={{ fontSize: '9pt', display: 'block', marginBottom: '2mm' }}>
            Fecha impresión: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')}
          </Typography>
          <Typography variant="caption" style={{ fontSize: '8pt', display: 'block', marginTop: '3mm' }}>
            &copy; 2025 AGNT - Sistema Hospitalario
          </Typography>
        </div>

        {/* Código de barras simulado */}
        <div style={{ ...centerStyle, marginTop: '5mm' }}>
          <Typography variant="caption" style={{ fontSize: '20pt', letterSpacing: '2px', fontFamily: 'monospace' }}>
            |||| ||| |||| |||
          </Typography>
          <br />
          <Typography variant="caption" style={{ fontSize: '8pt' }}>
            {String(account.id).padStart(12, '0')}
          </Typography>
        </div>
      </div>
    );
  }
);

HistoryPrintableReceipt.displayName = 'HistoryPrintableReceipt';

export default HistoryPrintableReceipt;
