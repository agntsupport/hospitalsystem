// ABOUTME: Utilidad para generar PDFs usando pdfmake (sin dependencia de Chrome).
// ABOUTME: Genera documentos de entrega COFEPRIS y comprobantes de comisiones médicas.

const PdfPrinter = require('pdfmake');

// Definir fuentes (usando las fuentes estándar de Helvetica)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

/**
 * Formatea una cantidad como moneda MXN
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Formatea una fecha en español
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Genera un PDF usando pdfmake y devuelve un Buffer
 * @param {Object} docDefinition - Definición del documento pdfmake
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generatePdfBuffer(docDefinition) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Genera el Acta de Entrega COFEPRIS en PDF
 * @param {Object} data - Datos del acta
 * @returns {Promise<string>} - PDF en Base64
 */
async function generateDeliveryActPdf(data) {
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

  // Construir tabla de items
  const itemsTableBody = [
    [
      { text: '#', style: 'tableHeader', alignment: 'center' },
      { text: 'Código', style: 'tableHeader' },
      { text: 'Producto', style: 'tableHeader' },
      { text: 'Cantidad', style: 'tableHeader', alignment: 'center' },
      { text: 'Estado', style: 'tableHeader', alignment: 'center' },
      { text: 'Observaciones', style: 'tableHeader' },
    ],
    ...items.map((item, index) => [
      { text: (index + 1).toString(), alignment: 'center' },
      { text: item.codigo || '-' },
      { text: item.nombre },
      { text: item.cantidad.toString(), alignment: 'center' },
      { text: item.verificado ? '✓ Verificado' : '✗ No verificado', alignment: 'center' },
      { text: item.observacion || '-' },
    ]),
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      // Header
      { text: 'HOSPITAL GENERAL', style: 'header', alignment: 'center' },
      { text: 'ACTA DE ENTREGA DE PRODUCTOS', style: 'subheader', alignment: 'center' },
      { text: 'Documento con validez para auditoría COFEPRIS', style: 'small', alignment: 'center', margin: [0, 0, 0, 5] },
      { text: 'CUMPLIMIENTO COFEPRIS', style: 'badge', alignment: 'center', margin: [0, 5, 0, 15] },

      // Info row
      {
        columns: [
          { text: `Folio: ${folio}`, style: 'infoText' },
          { text: `Solicitud: ${solicitudNumero}`, style: 'infoText' },
          { text: `Fecha: ${fechaFormateada}`, style: 'infoText' },
        ],
        margin: [0, 0, 0, 15],
      },

      // Info boxes
      {
        columns: [
          {
            width: '48%',
            stack: [
              { text: 'DATOS DEL PACIENTE', style: 'sectionHeader' },
              { text: `Nombre: ${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}`, margin: [0, 5, 0, 2] },
              { text: `Expediente: ${paciente.numeroExpediente || 'N/A'}` },
            ],
            style: 'infoBox',
          },
          { width: '4%', text: '' },
          {
            width: '48%',
            stack: [
              { text: 'INFORMACIÓN DE ENTREGA', style: 'sectionHeader' },
              { text: `Solicitante: ${solicitante.nombre}`, margin: [0, 5, 0, 2] },
              { text: `Almacenista: ${almacenista.nombre}` },
            ],
            style: 'infoBox',
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Products table
      { text: 'PRODUCTOS ENTREGADOS', style: 'sectionTitle', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['5%', '12%', '30%', '10%', '15%', '28%'],
          body: itemsTableBody,
        },
        layout: 'lightHorizontalLines',
      },

      // Observations
      ...(observaciones ? [
        { text: 'OBSERVACIONES GENERALES', style: 'sectionTitle', margin: [0, 20, 0, 5] },
        { text: observaciones, style: 'observations' },
      ] : []),

      // Signatures
      {
        columns: [
          {
            width: '45%',
            stack: [
              { text: 'ENTREGA (ALMACÉN)', style: 'signatureHeader', alignment: 'center' },
              ...(firmaAlmacenista ? [{ image: firmaAlmacenista, width: 150, height: 60, alignment: 'center', margin: [0, 10, 0, 5] }] : [{ text: '', margin: [0, 70, 0, 0] }]),
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1 }], alignment: 'center' },
              { text: nombreAlmacenista, alignment: 'center', bold: true, margin: [0, 5, 0, 0] },
              { text: 'Almacenista', alignment: 'center', style: 'small' },
            ],
          },
          { width: '10%', text: '' },
          {
            width: '45%',
            stack: [
              { text: 'RECIBE (ENFERMERÍA/MÉDICO)', style: 'signatureHeader', alignment: 'center' },
              ...(firmaEnfermero ? [{ image: firmaEnfermero, width: 150, height: 60, alignment: 'center', margin: [0, 10, 0, 5] }] : [{ text: '', margin: [0, 70, 0, 0] }]),
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1 }], alignment: 'center' },
              { text: nombreEnfermero, alignment: 'center', bold: true, margin: [0, 5, 0, 0] },
              { text: 'Receptor', alignment: 'center', style: 'small' },
            ],
          },
        ],
        margin: [0, 40, 0, 0],
      },

      // Footer
      {
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }] },
          { text: 'Documento generado electrónicamente - Hospital General', alignment: 'center', style: 'footer', margin: [0, 10, 0, 0] },
          { text: 'Este documento cumple con los requisitos de trazabilidad establecidos por COFEPRIS', alignment: 'center', style: 'footer' },
          { text: `Fecha de generación: ${new Date().toLocaleString('es-MX')}`, alignment: 'center', style: 'footer' },
        ],
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true, color: '#1976D2' },
      subheader: { fontSize: 12, bold: true, margin: [0, 5, 0, 0] },
      badge: { fontSize: 9, bold: true, color: '#4CAF50' },
      sectionHeader: { fontSize: 10, bold: true, color: '#1976D2', margin: [0, 0, 0, 5] },
      sectionTitle: { fontSize: 11, bold: true, color: '#1976D2' },
      tableHeader: { fontSize: 9, bold: true, color: 'white', fillColor: '#1976D2' },
      infoBox: { fontSize: 10 },
      infoText: { fontSize: 10 },
      small: { fontSize: 9, color: '#666666' },
      observations: { fontSize: 10, italics: true, color: '#e65100' },
      signatureHeader: { fontSize: 10, bold: true, color: '#1976D2' },
      footer: { fontSize: 8, color: '#666666' },
    },
  };

  try {
    const pdfBuffer = await generatePdfBuffer(docDefinition);
    return pdfBuffer.toString('base64');
  } catch (error) {
    console.error('Error generando PDF de acta de entrega:', error);
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
}

/**
 * Genera el Comprobante de Comisión en PDF
 * @param {Object} data - Datos del comprobante
 * @returns {Promise<string>} - PDF en Base64
 */
async function generateCommissionReceiptPdf(data) {
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

  const fechaInicioStr = formatDate(periodo.fechaInicio);
  const fechaFinStr = formatDate(periodo.fechaFin);
  const fechaPagoStr = fechaPago ? formatDate(fechaPago) : 'Pendiente';

  // Construir tabla de cuentas si hay detalle
  let cuentasTable = null;
  if (cuentasDetalle.length > 0) {
    const cuentasTableBody = [
      [
        { text: '#', style: 'tableHeader', alignment: 'center' },
        { text: 'Paciente', style: 'tableHeader' },
        { text: 'Fecha Cierre', style: 'tableHeader', alignment: 'center' },
        { text: 'Total Cuenta', style: 'tableHeader', alignment: 'right' },
      ],
      ...cuentasDetalle.slice(0, 10).map((cuenta, index) => [
        { text: (index + 1).toString(), alignment: 'center' },
        { text: cuenta.paciente },
        { text: formatDate(cuenta.fechaCierre), alignment: 'center' },
        { text: formatCurrency(cuenta.total), alignment: 'right' },
      ]),
    ];
    cuentasTable = {
      table: {
        headerRows: 1,
        widths: ['8%', '40%', '22%', '30%'],
        body: cuentasTableBody,
      },
      layout: 'lightHorizontalLines',
    };
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      // Header
      { text: 'HOSPITAL GENERAL', style: 'header', alignment: 'center' },
      { text: 'COMPROBANTE DE COMISIÓN MÉDICA', style: 'subheader', alignment: 'center' },
      {
        text: estado === 'PAGADA' ? 'COMISIÓN PAGADA' : 'PENDIENTE DE PAGO',
        style: estado === 'PAGADA' ? 'badgePaid' : 'badgePending',
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },

      // Info boxes
      {
        columns: [
          {
            width: '48%',
            stack: [
              { text: 'DATOS DEL MÉDICO', style: 'sectionHeader' },
              { text: `Nombre: ${medico.nombreMedico}`, margin: [0, 5, 0, 2] },
              { text: `Especialidad: ${medico.especialidad || 'General'}`, margin: [0, 0, 0, 2] },
              { text: `Cédula: ${medico.cedulaProfesional || 'N/A'}` },
            ],
            style: 'infoBox',
          },
          { width: '4%', text: '' },
          {
            width: '48%',
            stack: [
              { text: 'PERÍODO DE COMISIÓN', style: 'sectionHeader' },
              { text: `Desde: ${fechaInicioStr}`, margin: [0, 5, 0, 2] },
              { text: `Hasta: ${fechaFinStr}`, margin: [0, 0, 0, 2] },
              { text: `Fecha de pago: ${fechaPagoStr}` },
            ],
            style: 'infoBox',
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Summary box
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Total de cuentas cerradas:', style: 'summaryLabel' },
              { text: `${totalCuentas} cuentas`, style: 'summaryValue', alignment: 'right' },
            ],
            [
              { text: 'Monto total facturado:', style: 'summaryLabel' },
              { text: formatCurrency(montoFacturado), style: 'summaryValue', alignment: 'right' },
            ],
            [
              { text: 'Porcentaje de comisión:', style: 'summaryLabel' },
              { text: `${porcentaje}%`, style: 'summaryValue', alignment: 'right' },
            ],
            [
              { text: 'COMISIÓN A PAGAR:', style: 'summaryLabel', bold: true },
              { text: formatCurrency(montoComision), style: 'commissionTotal', alignment: 'right' },
            ],
          ],
        },
        layout: {
          fillColor: function (rowIndex) {
            return '#e8f5e9';
          },
          hLineWidth: function () { return 1; },
          vLineWidth: function () { return 0; },
          hLineColor: function () { return '#c8e6c9'; },
          paddingLeft: function () { return 15; },
          paddingRight: function () { return 15; },
          paddingTop: function () { return 10; },
          paddingBottom: function () { return 10; },
        },
        margin: [0, 0, 0, 20],
      },

      // Cuentas table (if exists)
      ...(cuentasTable ? [
        { text: 'DETALLE DE CUENTAS (Primeras 10)', style: 'sectionTitle', margin: [0, 0, 0, 10] },
        cuentasTable,
        ...(cuentasDetalle.length > 10 ? [{ text: `... y ${cuentasDetalle.length - 10} cuentas más`, style: 'small', margin: [0, 5, 0, 0] }] : []),
      ] : []),

      // Signatures
      {
        columns: [
          {
            width: '45%',
            stack: [
              { text: 'RECIBE (MÉDICO)', style: 'signatureHeader', alignment: 'center' },
              ...(firmaMedico ? [{ image: firmaMedico, width: 150, height: 60, alignment: 'center', margin: [0, 10, 0, 5] }] : [{ text: '', margin: [0, 70, 0, 0] }]),
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1 }], alignment: 'center' },
              { text: medico.nombreMedico, alignment: 'center', bold: true, margin: [0, 5, 0, 0] },
              { text: 'Médico', alignment: 'center', style: 'small' },
            ],
          },
          { width: '10%', text: '' },
          {
            width: '45%',
            stack: [
              { text: 'AUTORIZA (ADMINISTRACIÓN)', style: 'signatureHeader', alignment: 'center' },
              ...(firmaAdmin ? [{ image: firmaAdmin, width: 150, height: 60, alignment: 'center', margin: [0, 10, 0, 5] }] : [{ text: '', margin: [0, 70, 0, 0] }]),
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1 }], alignment: 'center' },
              { text: nombreAdmin || 'Pendiente', alignment: 'center', bold: true, margin: [0, 5, 0, 0] },
              { text: 'Administrador', alignment: 'center', style: 'small' },
            ],
          },
        ],
        margin: [0, 40, 0, 0],
      },

      // Footer
      {
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }] },
          { text: 'Documento generado electrónicamente - Hospital General', alignment: 'center', style: 'footer', margin: [0, 10, 0, 0] },
          { text: 'Este comprobante es válido como constancia de pago de comisión médica', alignment: 'center', style: 'footer' },
          { text: `Fecha de generación: ${new Date().toLocaleString('es-MX')}`, alignment: 'center', style: 'footer' },
        ],
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true, color: '#2E7D32' },
      subheader: { fontSize: 12, bold: true, margin: [0, 5, 0, 0] },
      badgePaid: { fontSize: 10, bold: true, color: '#4CAF50' },
      badgePending: { fontSize: 10, bold: true, color: '#FF9800' },
      sectionHeader: { fontSize: 10, bold: true, color: '#2E7D32', margin: [0, 0, 0, 5] },
      sectionTitle: { fontSize: 11, bold: true, color: '#2E7D32' },
      tableHeader: { fontSize: 9, bold: true, color: 'white', fillColor: '#2E7D32' },
      infoBox: { fontSize: 10 },
      summaryLabel: { fontSize: 10, color: '#2E7D32' },
      summaryValue: { fontSize: 11 },
      commissionTotal: { fontSize: 18, bold: true, color: '#1B5E20' },
      small: { fontSize: 9, color: '#666666' },
      signatureHeader: { fontSize: 10, bold: true, color: '#2E7D32' },
      footer: { fontSize: 8, color: '#666666' },
    },
  };

  try {
    const pdfBuffer = await generatePdfBuffer(docDefinition);
    return pdfBuffer.toString('base64');
  } catch (error) {
    console.error('Error generando PDF de comisión:', error);
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
}

// Funciones legacy para mantener compatibilidad (aunque no se usan activamente)
function generateDeliveryActHtml() {
  throw new Error('HTML generation deprecated. Use generateDeliveryActPdf directly.');
}

function generateCommissionReceiptHtml() {
  throw new Error('HTML generation deprecated. Use generateCommissionReceiptPdf directly.');
}

async function generatePdfFromHtml() {
  throw new Error('HTML to PDF deprecated. Use pdfmake functions directly.');
}

module.exports = {
  generatePdfFromHtml,
  generateDeliveryActHtml,
  generateCommissionReceiptHtml,
  generateDeliveryActPdf,
  generateCommissionReceiptPdf,
};
