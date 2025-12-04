// ABOUTME: Utilidad para generar PDFs usando html-pdf-node.
// ABOUTME: Genera documentos de entrega COFEPRIS y comprobantes de comisiones médicas.

const htmlPdf = require('html-pdf-node');

/**
 * Genera un PDF desde contenido HTML
 * @param {string} htmlContent - Contenido HTML del documento
 * @param {Object} options - Opciones de generación
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generatePdfFromHtml(htmlContent, options = {}) {
  const defaultOptions = {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    printBackground: true,
  };

  const pdfOptions = { ...defaultOptions, ...options };

  const file = { content: htmlContent };

  try {
    const pdfBuffer = await htmlPdf.generatePdf(file, pdfOptions);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
}

/**
 * Genera HTML para el Acta de Entrega COFEPRIS
 * @param {Object} data - Datos del documento
 * @returns {string} - HTML del documento
 */
function generateDeliveryActHtml(data) {
  const {
    folio,
    fechaEntrega,
    solicitudNumero,
    paciente,
    solicitante,
    almacenista,
    items,
    firmaAlmacenista,
    nombreAlmacenista,
    firmaEnfermero,
    nombreEnfermero,
    observaciones,
  } = data;

  const fechaFormateada = new Date(fechaEntrega).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHtml = items.map((item, index) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.codigo || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.nombre}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
        ${item.verificado ? '✓ Verificado' : '✗ No verificado'}
      </td>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.observacion || '-'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2196F3;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #1976D2;
          margin: 0 0 5px 0;
          font-size: 18px;
        }
        .header h2 {
          color: #333;
          margin: 0 0 5px 0;
          font-size: 14px;
        }
        .header p {
          margin: 2px 0;
          color: #666;
          font-size: 11px;
        }
        .cofepris-badge {
          background: #4CAF50;
          color: white;
          padding: 5px 15px;
          border-radius: 15px;
          display: inline-block;
          margin-top: 10px;
          font-size: 10px;
          font-weight: bold;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-box {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          width: 48%;
        }
        .info-box h3 {
          margin: 0 0 8px 0;
          color: #1976D2;
          font-size: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .info-box p {
          margin: 3px 0;
          font-size: 11px;
        }
        .info-box strong {
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #1976D2;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-size: 11px;
        }
        .signatures-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 45%;
          text-align: center;
        }
        .signature-box h4 {
          color: #1976D2;
          margin: 0 0 10px 0;
          font-size: 12px;
        }
        .signature-image {
          border-bottom: 2px solid #333;
          height: 80px;
          margin-bottom: 5px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .signature-image img {
          max-height: 70px;
          max-width: 100%;
        }
        .signature-name {
          font-weight: bold;
          margin-top: 5px;
        }
        .signature-role {
          color: #666;
          font-size: 10px;
        }
        .observations {
          background: #fff3e0;
          padding: 10px;
          border-radius: 5px;
          margin: 20px 0;
          border-left: 4px solid #ff9800;
        }
        .observations h4 {
          margin: 0 0 5px 0;
          color: #e65100;
          font-size: 11px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 9px;
        }
        .folio {
          background: #e3f2fd;
          padding: 5px 10px;
          border-radius: 3px;
          font-weight: bold;
          color: #1565C0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HOSPITAL GENERAL</h1>
        <h2>ACTA DE ENTREGA DE PRODUCTOS</h2>
        <p>Documento con validez para auditoría COFEPRIS</p>
        <span class="cofepris-badge">CUMPLIMIENTO COFEPRIS</span>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <span class="folio">Folio: ${folio}</span>
        <span style="margin-left: 20px;">Solicitud: ${solicitudNumero}</span>
        <span style="margin-left: 20px;">Fecha: ${fechaFormateada}</span>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>DATOS DEL PACIENTE</h3>
          <p><strong>Nombre:</strong> ${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}</p>
          <p><strong>Expediente:</strong> ${paciente.numeroExpediente || 'N/A'}</p>
        </div>
        <div class="info-box">
          <h3>INFORMACIÓN DE ENTREGA</h3>
          <p><strong>Solicitante:</strong> ${solicitante.nombre}</p>
          <p><strong>Almacenista:</strong> ${almacenista.nombre}</p>
        </div>
      </div>

      <h3 style="color: #1976D2; border-bottom: 2px solid #1976D2; padding-bottom: 5px;">
        PRODUCTOS ENTREGADOS
      </h3>

      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 12%;">Código</th>
            <th style="width: 30%;">Producto</th>
            <th style="width: 10%;">Cantidad</th>
            <th style="width: 15%;">Estado</th>
            <th style="width: 28%;">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${observaciones ? `
        <div class="observations">
          <h4>OBSERVACIONES GENERALES</h4>
          <p>${observaciones}</p>
        </div>
      ` : ''}

      <div class="signatures-section">
        <div class="signature-box">
          <h4>ENTREGA (ALMACÉN)</h4>
          <div class="signature-image">
            ${firmaAlmacenista ? `<img src="${firmaAlmacenista}" alt="Firma Almacenista"/>` : ''}
          </div>
          <p class="signature-name">${nombreAlmacenista}</p>
          <p class="signature-role">Almacenista</p>
        </div>
        <div class="signature-box">
          <h4>RECIBE (ENFERMERÍA/MÉDICO)</h4>
          <div class="signature-image">
            ${firmaEnfermero ? `<img src="${firmaEnfermero}" alt="Firma Receptor"/>` : ''}
          </div>
          <p class="signature-name">${nombreEnfermero}</p>
          <p class="signature-role">Receptor</p>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado electrónicamente - Hospital General</p>
        <p>Este documento cumple con los requisitos de trazabilidad establecidos por COFEPRIS</p>
        <p>Fecha de generación: ${new Date().toLocaleString('es-MX')}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera HTML para el Comprobante de Pago de Comisión Médica
 * @param {Object} data - Datos del comprobante
 * @returns {string} - HTML del documento
 */
function generateCommissionReceiptHtml(data) {
  const {
    medico,
    periodo,
    totalCuentas,
    montoFacturado,
    porcentaje,
    montoComision,
    estado,
    fechaPago,
    firmaMedico,
    firmaAdmin,
    nombreAdmin,
    cuentasDetalle = [],
  } = data;

  const fechaInicioStr = new Date(periodo.fechaInicio).toLocaleDateString('es-MX');
  const fechaFinStr = new Date(periodo.fechaFin).toLocaleDateString('es-MX');
  const fechaPagoStr = fechaPago ? new Date(fechaPago).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Pendiente';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const cuentasHtml = cuentasDetalle.slice(0, 10).map((cuenta, index) => `
    <tr>
      <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
      <td style="padding: 6px; border: 1px solid #ddd;">${cuenta.paciente}</td>
      <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${new Date(cuenta.fechaCierre).toLocaleDateString('es-MX')}</td>
      <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(cuenta.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #2E7D32;
          margin: 0 0 5px 0;
          font-size: 18px;
        }
        .header h2 {
          color: #333;
          margin: 0 0 5px 0;
          font-size: 14px;
        }
        .status-badge {
          padding: 5px 15px;
          border-radius: 15px;
          display: inline-block;
          margin-top: 10px;
          font-size: 11px;
          font-weight: bold;
        }
        .status-pagada {
          background: #4CAF50;
          color: white;
        }
        .status-pendiente {
          background: #FF9800;
          color: white;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-box {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          width: 48%;
        }
        .info-box h3 {
          margin: 0 0 10px 0;
          color: #2E7D32;
          font-size: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .info-box p {
          margin: 5px 0;
          font-size: 11px;
        }
        .summary-box {
          background: #e8f5e9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 2px solid #4CAF50;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #c8e6c9;
        }
        .summary-row:last-child {
          border-bottom: none;
        }
        .summary-label {
          font-weight: bold;
          color: #2E7D32;
        }
        .summary-value {
          font-size: 14px;
        }
        .commission-total {
          font-size: 24px;
          font-weight: bold;
          color: #1B5E20;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10px;
        }
        th {
          background: #2E7D32;
          color: white;
          padding: 8px;
          text-align: left;
        }
        .signatures-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 45%;
          text-align: center;
        }
        .signature-box h4 {
          color: #2E7D32;
          margin: 0 0 10px 0;
          font-size: 12px;
        }
        .signature-image {
          border-bottom: 2px solid #333;
          height: 80px;
          margin-bottom: 5px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .signature-image img {
          max-height: 70px;
          max-width: 100%;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HOSPITAL GENERAL</h1>
        <h2>COMPROBANTE DE COMISIÓN MÉDICA</h2>
        <span class="status-badge ${estado === 'PAGADA' ? 'status-pagada' : 'status-pendiente'}">
          ${estado === 'PAGADA' ? 'COMISIÓN PAGADA' : 'PENDIENTE DE PAGO'}
        </span>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>DATOS DEL MÉDICO</h3>
          <p><strong>Nombre:</strong> ${medico.nombreMedico}</p>
          <p><strong>Especialidad:</strong> ${medico.especialidad || 'General'}</p>
          <p><strong>Cédula:</strong> ${medico.cedulaProfesional || 'N/A'}</p>
        </div>
        <div class="info-box">
          <h3>PERÍODO DE COMISIÓN</h3>
          <p><strong>Desde:</strong> ${fechaInicioStr}</p>
          <p><strong>Hasta:</strong> ${fechaFinStr}</p>
          <p><strong>Fecha de pago:</strong> ${fechaPagoStr}</p>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-row">
          <span class="summary-label">Total de cuentas cerradas:</span>
          <span class="summary-value">${totalCuentas} cuentas</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Monto total facturado:</span>
          <span class="summary-value">${formatCurrency(montoFacturado)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Porcentaje de comisión:</span>
          <span class="summary-value">${porcentaje}%</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">COMISIÓN A PAGAR:</span>
          <span class="commission-total">${formatCurrency(montoComision)}</span>
        </div>
      </div>

      ${cuentasDetalle.length > 0 ? `
        <h3 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 5px;">
          DETALLE DE CUENTAS (Primeras 10)
        </h3>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th style="width: 40%;">Paciente</th>
              <th style="width: 22%;">Fecha Cierre</th>
              <th style="width: 30%;">Total Cuenta</th>
            </tr>
          </thead>
          <tbody>
            ${cuentasHtml}
          </tbody>
        </table>
        ${cuentasDetalle.length > 10 ? `<p style="color: #666; font-size: 10px;">... y ${cuentasDetalle.length - 10} cuentas más</p>` : ''}
      ` : ''}

      <div class="signatures-section">
        <div class="signature-box">
          <h4>RECIBE (MÉDICO)</h4>
          <div class="signature-image">
            ${firmaMedico ? `<img src="${firmaMedico}" alt="Firma Médico"/>` : ''}
          </div>
          <p style="font-weight: bold; margin-top: 5px;">${medico.nombreMedico}</p>
          <p style="color: #666; font-size: 10px;">Médico</p>
        </div>
        <div class="signature-box">
          <h4>AUTORIZA (ADMINISTRACIÓN)</h4>
          <div class="signature-image">
            ${firmaAdmin ? `<img src="${firmaAdmin}" alt="Firma Admin"/>` : ''}
          </div>
          <p style="font-weight: bold; margin-top: 5px;">${nombreAdmin || 'Pendiente'}</p>
          <p style="color: #666; font-size: 10px;">Administrador</p>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado electrónicamente - Hospital General</p>
        <p>Este comprobante es válido como constancia de pago de comisión médica</p>
        <p>Fecha de generación: ${new Date().toLocaleString('es-MX')}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el Acta de Entrega COFEPRIS en PDF
 * @param {Object} data - Datos del acta
 * @returns {Promise<string>} - PDF en Base64
 */
async function generateDeliveryActPdf(data) {
  const html = generateDeliveryActHtml(data);
  const pdfBuffer = await generatePdfFromHtml(html);
  return pdfBuffer.toString('base64');
}

/**
 * Genera el Comprobante de Comisión en PDF
 * @param {Object} data - Datos del comprobante
 * @returns {Promise<string>} - PDF en Base64
 */
async function generateCommissionReceiptPdf(data) {
  const html = generateCommissionReceiptHtml(data);
  const pdfBuffer = await generatePdfFromHtml(html);
  return pdfBuffer.toString('base64');
}

module.exports = {
  generatePdfFromHtml,
  generateDeliveryActHtml,
  generateCommissionReceiptHtml,
  generateDeliveryActPdf,
  generateCommissionReceiptPdf,
};
