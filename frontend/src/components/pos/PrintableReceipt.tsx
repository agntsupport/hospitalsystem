// ABOUTME: Componente de ticket imprimible para cobros POS
// Genera un recibo de caja con formato de 80mm para impresión térmica o estándar

import React, { forwardRef } from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface PrintableReceiptProps {
  transactionData: {
    paciente: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    cuentaId: number;
    totalCargos: number;
    totalAdeudado: number;
    montoRecibido: number;
    cambio: number;
    metodoPago: string;
    cajero: string;
    fecha: Date;
    tipoTransaccion: 'cobro' | 'devolucion' | 'cpc';
    motivoCPC?: string;
  };
}

const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ transactionData }, ref) => {
    const receiptStyles: React.CSSProperties = {
      width: '80mm',
      maxWidth: '80mm',
      margin: '0 auto',
      padding: '10mm',
      fontFamily: 'monospace, Courier New',
      fontSize: '12pt',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff'
    };

    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '8mm',
      borderBottom: '2px dashed #000',
      paddingBottom: '4mm'
    };

    const sectionStyle: React.CSSProperties = {
      marginBottom: '4mm'
    };

    const rowStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2mm'
    };

    const boldStyle: React.CSSProperties = {
      fontWeight: 'bold'
    };

    const centerStyle: React.CSSProperties = {
      textAlign: 'center'
    };

    const totalStyle: React.CSSProperties = {
      fontSize: '14pt',
      fontWeight: 'bold',
      borderTop: '2px solid #000',
      borderBottom: '2px solid #000',
      padding: '2mm 0',
      marginTop: '4mm',
      marginBottom: '4mm'
    };

    const footerStyle: React.CSSProperties = {
      marginTop: '8mm',
      paddingTop: '4mm',
      borderTop: '2px dashed #000',
      textAlign: 'center',
      fontSize: '10pt'
    };

    return (
      <div ref={ref} style={receiptStyles}>
        {/* Encabezado */}
        <div style={headerStyle}>
          <Typography variant="h5" style={{ ...boldStyle, marginBottom: '2mm' }}>
            HOSPITAL GENERAL
          </Typography>
          <Typography variant="caption" style={{ fontSize: '10pt' }}>
            Sistema de Gestión Hospitalaria
          </Typography>
          <br />
          <Typography variant="caption" style={{ fontSize: '10pt' }}>
            AGNT: Infraestructura Tecnológica
          </Typography>
        </div>

        {/* Tipo de Transacción */}
        <div style={{ ...centerStyle, ...sectionStyle }}>
          <Typography variant="h6" style={boldStyle}>
            {transactionData.tipoTransaccion === 'cobro' && '=== RECIBO DE PAGO ==='}
            {transactionData.tipoTransaccion === 'devolucion' && '=== COMPROBANTE DE DEVOLUCIÓN ==='}
            {transactionData.tipoTransaccion === 'cpc' && '=== CUENTA POR COBRAR ==='}
          </Typography>
        </div>

        {/* Información de la Cuenta */}
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span>Cuenta No.:</span>
            <span style={boldStyle}>{String(transactionData.cuentaId).padStart(6, '0')}</span>
          </div>
          <div style={rowStyle}>
            <span>Fecha:</span>
            <span>{new Date(transactionData.fecha).toLocaleDateString('es-MX')}</span>
          </div>
          <div style={rowStyle}>
            <span>Hora:</span>
            <span>{new Date(transactionData.fecha).toLocaleTimeString('es-MX')}</span>
          </div>
        </div>

        <Divider style={{ margin: '4mm 0', borderColor: '#000' }} />

        {/* Información del Paciente */}
        <div style={sectionStyle}>
          <Typography variant="body2" style={{ ...boldStyle, marginBottom: '2mm' }}>
            PACIENTE:
          </Typography>
          <Typography variant="body2">
            {transactionData.paciente.nombre} {transactionData.paciente.apellidoPaterno} {transactionData.paciente.apellidoMaterno}
          </Typography>
        </div>

        <Divider style={{ margin: '4mm 0', borderColor: '#000' }} />

        {/* Resumen Financiero */}
        <div style={sectionStyle}>
          <Typography variant="body2" style={{ ...boldStyle, marginBottom: '2mm' }}>
            DETALLE DE COBRO:
          </Typography>

          <div style={rowStyle}>
            <span>Total Servicios/Productos:</span>
            <span>${transactionData.totalCargos.toFixed(2)}</span>
          </div>

          {transactionData.tipoTransaccion === 'cobro' && (
            <>
              <div style={rowStyle}>
                <span>Saldo Adeudado:</span>
                <span style={{ color: '#d32f2f', ...boldStyle }}>
                  ${transactionData.totalAdeudado.toFixed(2)}
                </span>
              </div>

              <div style={{ ...rowStyle, ...totalStyle }}>
                <span>MONTO RECIBIDO:</span>
                <span>${transactionData.montoRecibido.toFixed(2)}</span>
              </div>

              {transactionData.cambio > 0 && (
                <div style={{ ...rowStyle, fontSize: '14pt', ...boldStyle }}>
                  <span>CAMBIO:</span>
                  <span>${transactionData.cambio.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {transactionData.tipoTransaccion === 'devolucion' && (
            <div style={{ ...rowStyle, ...totalStyle, color: '#ed6c02' }}>
              <span>DEVOLVER AL PACIENTE:</span>
              <span>${Math.abs(transactionData.totalAdeudado).toFixed(2)}</span>
            </div>
          )}

          {transactionData.tipoTransaccion === 'cpc' && (
            <>
              <div style={{ ...rowStyle, ...totalStyle, color: '#0288d1' }}>
                <span>SALDO POR COBRAR:</span>
                <span>${Math.abs(transactionData.totalAdeudado).toFixed(2)}</span>
              </div>
              {transactionData.motivoCPC && (
                <div style={{ marginTop: '4mm', fontSize: '10pt' }}>
                  <Typography variant="caption" style={{ ...boldStyle, display: 'block' }}>
                    Motivo CPC:
                  </Typography>
                  <Typography variant="caption">
                    {transactionData.motivoCPC}
                  </Typography>
                </div>
              )}
            </>
          )}
        </div>

        <Divider style={{ margin: '4mm 0', borderColor: '#000' }} />

        {/* Forma de Pago */}
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span style={boldStyle}>Forma de Pago:</span>
            <span style={boldStyle}>{transactionData.metodoPago.toUpperCase()}</span>
          </div>
        </div>

        <Divider style={{ margin: '4mm 0', borderColor: '#000' }} />

        {/* Cajero */}
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span>Atendió:</span>
            <span>{transactionData.cajero}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <Typography variant="caption" style={{ fontSize: '10pt', display: 'block', marginBottom: '2mm' }}>
            ¡Gracias por su preferencia!
          </Typography>
          <Typography variant="caption" style={{ fontSize: '9pt', display: 'block', marginBottom: '2mm' }}>
            Conserve este comprobante
          </Typography>
          <Typography variant="caption" style={{ fontSize: '8pt', display: 'block' }}>
            {transactionData.tipoTransaccion === 'cobro' && 'Comprobante válido de pago'}
            {transactionData.tipoTransaccion === 'devolucion' && 'Comprobante de devolución'}
            {transactionData.tipoTransaccion === 'cpc' && 'Cuenta pendiente de cobro'}
          </Typography>

          <Typography variant="caption" style={{ fontSize: '8pt', display: 'block', marginTop: '4mm' }}>
            © 2025 AGNT - Sistema Hospitalario
          </Typography>
        </div>

        {/* Código de barras simulado (opcional) */}
        <div style={{ ...centerStyle, marginTop: '6mm' }}>
          <Typography variant="caption" style={{ fontSize: '24pt', letterSpacing: '2px', fontFamily: 'monospace' }}>
            |||| ||| |||| |||
          </Typography>
          <br />
          <Typography variant="caption" style={{ fontSize: '8pt' }}>
            {String(transactionData.cuentaId).padStart(12, '0')}
          </Typography>
        </div>
      </div>
    );
  }
);

PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt;
