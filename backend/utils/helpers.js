// Utilidades y helpers generales

// Formatear números a moneda mexicana
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount || 0);
};

// Generar número de expediente único
const generateExpediente = async (prisma) => {
  const year = new Date().getFullYear();
  const count = await prisma.paciente.count({
    where: {
      numeroExpediente: {
        startsWith: `EXP-${year}`
      }
    }
  });
  
  return `EXP-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Generar número de factura único
const generateInvoiceNumber = async (prisma) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const count = await prisma.factura.count({
    where: {
      numeroFactura: {
        startsWith: `FAC-${year}${month}`
      }
    }
  });
  
  return `FAC-${year}${month}-${String(count + 1).padStart(4, '0')}`;
};

// Generar número de venta rápida único
const generateQuickSaleNumber = async (prisma) => {
  const year = new Date().getFullYear();
  const count = await prisma.ventaRapida.count({
    where: {
      numeroVenta: {
        startsWith: `VR-${year}`
      }
    }
  });
  
  return `VR-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Sanitizar string para búsqueda
const sanitizeSearch = (term) => {
  if (!term) return '';
  return term.toString().trim().toLowerCase();
};

// Validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar CURP mexicano
const isValidCURP = (curp) => {
  if (!curp) return true; // CURP es opcional
  const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
  return curpRegex.test(curp.toUpperCase());
};

// Formatear fecha para respuesta JSON
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

// Construir filtros WHERE para Prisma
const buildWhereFilter = (filters) => {
  const where = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key.includes('search') || key.includes('Search')) {
        // Para campos de búsqueda, usar contains insensitive
        where[key.replace('search', '').replace('Search', '')] = {
          contains: value.toString(),
          mode: 'insensitive'
        };
      } else if (typeof value === 'boolean') {
        where[key] = value;
      } else if (typeof value === 'number') {
        where[key] = value;
      } else if (typeof value === 'string') {
        where[key] = value;
      }
    }
  });
  
  return where;
};

module.exports = {
  formatCurrency,
  generateExpediente,
  generateInvoiceNumber,
  generateQuickSaleNumber,
  sanitizeSearch,
  isValidEmail,
  isValidCURP,
  formatDate,
  buildWhereFilter
};