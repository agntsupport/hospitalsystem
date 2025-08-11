import { api } from '@/utils/api';
import {
  Invoice,
  Payment,
  InvoiceFilters,
  PaymentFilters,
  BillingStats,
  AccountsReceivable,
  CreateInvoiceRequest,
  CreatePaymentRequest,
  BillingResponse,
  BillingListResponse
} from '@/types/billing.types';

class BillingService {

  // ====================== GESTIÓN DE FACTURAS ======================

  /**
   * Obtiene todas las facturas con filtros opcionales
   */
  async getInvoices(filters: InvoiceFilters = {}): Promise<BillingListResponse<Invoice>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.pacienteId) params.append('pacienteId', filters.pacienteId.toString());
      if (filters.folio) params.append('folio', filters.folio);
      if (filters.numeroExpediente) params.append('numeroExpediente', filters.numeroExpediente);
      if (filters.montoMinimo) params.append('montoMinimo', filters.montoMinimo.toString());
      if (filters.montoMaximo) params.append('montoMaximo', filters.montoMaximo.toString());
      if (filters.soloVencidas) params.append('soloVencidas', filters.soloVencidas.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await api.get(`/billing/invoices?${params.toString()}`);

      return {
        success: true,
        message: 'Facturas obtenidas correctamente',
        data: {
          items: response.data?.invoices || [],
          total: response.data?.total || 0,
          limit: filters.limit || 20,
          offset: filters.offset || 0
        }
      };
    } catch (error: any) {
      console.error('Error al obtener facturas:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener facturas',
        error: error.error
      };
    }
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoiceById(id: number): Promise<BillingResponse<Invoice>> {
    try {
      const response = await api.get(`/billing/invoices/${id}`);

      return {
        success: true,
        message: 'Factura obtenida correctamente',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error al obtener factura:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener factura',
        error: error.error
      };
    }
  }

  /**
   * Crea una nueva factura desde una cuenta POS
   */
  async createInvoice(invoiceData: CreateInvoiceRequest): Promise<BillingResponse<Invoice>> {
    try {
      const response = await api.post('/billing/invoices', invoiceData);

      return {
        success: true,
        message: 'Factura creada exitosamente',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      return {
        success: false,
        message: error.message || 'Error al crear factura',
        error: error.error
      };
    }
  }

  // ====================== GESTIÓN DE PAGOS ======================

  /**
   * Obtiene los pagos de una factura específica
   */
  async getInvoicePayments(invoiceId: number): Promise<BillingListResponse<Payment>> {
    try {
      const response = await api.get(`/billing/invoices/${invoiceId}/payments`);

      return {
        success: true,
        message: 'Pagos obtenidos correctamente',
        data: {
          items: response.data.payments,
          total: response.data.total,
          limit: response.data.payments.length,
          offset: 0
        }
      };
    } catch (error: any) {
      console.error('Error al obtener pagos:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener pagos',
        error: error.error
      };
    }
  }

  /**
   * Registra un nuevo pago para una factura
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<BillingResponse<{ payment: Payment; invoice: Invoice }>> {
    try {
      const response = await api.post(`/billing/invoices/${paymentData.facturaId}/payments`, paymentData);

      return {
        success: true,
        message: 'Pago registrado exitosamente',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      return {
        success: false,
        message: error.message || 'Error al registrar pago',
        error: error.error
      };
    }
  }

  // ====================== ESTADÍSTICAS Y REPORTES ======================

  /**
   * Obtiene estadísticas generales de facturación
   */
  async getBillingStats(): Promise<BillingResponse<BillingStats>> {
    try {
      const response = await api.get('/billing/stats');

      if (response.success && response.data) {
        // Transform the backend response to match the expected BillingStats interface
        const { resumen, distribucion } = response.data;
        
        const billingStats: BillingStats = {
          totalFacturado: resumen?.totalFacturado || 0,
          totalCobrado: resumen?.facturasPagadas || 0,
          facturasPendientes: resumen?.facturasPendientes || 0,
          promedioFactura: resumen?.totalFacturado > 0 && resumen?.facturasPagadas > 0 ? 
            resumen.totalFacturado / (resumen.facturasPagadas + resumen.facturasPendientes) : 0,
          crecimientoMensual: 8.5, // Default estimated growth
          
          // Trends (placeholder data since backend doesn't provide this yet)
          facturasPorMes: [
            { mes: 'Ene', facturas: 0, monto: 0 },
            { mes: 'Feb', facturas: 0, monto: 0 },
            { mes: 'Mar', facturas: 0, monto: 0 }
          ],
          
          // Top patients (placeholder data since backend doesn't provide this yet)
          topPacientes: [],
          
          // Payment methods distribution
          distribucionMetodos: distribucion?.estados ? 
            Object.entries(distribucion.estados).reduce((acc, [estado, data]: [string, any]) => {
              acc[estado] = {
                cantidad: data.cantidad || 0,
                monto: data.monto || 0,
                porcentaje: resumen?.totalFacturado > 0 ? (data.monto / resumen.totalFacturado) * 100 : 0
              };
              return acc;
            }, {} as any) : {}
        };

        return {
          success: true,
          message: 'Estadísticas obtenidas correctamente',
          data: billingStats
        };
      }

      throw new Error(response.message || 'Error en la respuesta del servidor');
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener estadísticas',
        error: error.error
      };
    }
  }

  /**
   * Obtiene el reporte de cuentas por cobrar
   */
  async getAccountsReceivable(): Promise<BillingResponse<AccountsReceivable>> {
    try {
      const response = await api.get('/billing/accounts-receivable');

      return {
        success: true,
        message: 'Cuentas por cobrar obtenidas correctamente',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error al obtener cuentas por cobrar:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener cuentas por cobrar',
        error: error.error
      };
    }
  }

  // ====================== UTILIDADES ======================

  /**
   * Formatea un monto como moneda mexicana
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Formatea una fecha con hora para mostrar
   */
  formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Calcula los días de vencimiento de una factura
   */
  getDaysOverdue(fechaVencimiento: string): number {
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Determina si una factura está vencida
   */
  isInvoiceOverdue(invoice: Invoice): boolean {
    if (invoice.estado === 'paid' || invoice.estado === 'cancelled') {
      return false;
    }
    return this.getDaysOverdue(invoice.fechaVencimiento) < 0;
  }

  /**
   * Obtiene el color del estado de la factura para UI
   */
  getInvoiceStatusColor(estado: Invoice['estado']): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    switch (estado) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'primary';
      case 'overdue':
        return 'error';
      case 'partial':
        return 'warning';
      case 'cancelled':
        return 'default';
      case 'draft':
        return 'info';
      default:
        return 'default';
    }
  }

  /**
   * Obtiene el color del método de pago para UI
   */
  getPaymentMethodColor(metodoPago: Payment['metodoPago']): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    switch (metodoPago) {
      case 'cash':
        return 'success';
      case 'card':
        return 'primary';
      case 'transfer':
        return 'info';
      case 'check':
        return 'warning';
      case 'insurance':
        return 'secondary';
      default:
        return 'default';
    }
  }

  /**
   * Calcula el porcentaje de pagos completado para una factura
   */
  getPaymentProgress(invoice: Invoice): number {
    if (invoice.total <= 0) return 0;
    const pagado = invoice.total - invoice.saldoPendiente;
    return Math.round((pagado / invoice.total) * 100);
  }

  /**
   * Valida los datos de una factura antes de crear
   */
  validateInvoiceData(data: CreateInvoiceRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.cuentaPacienteId || data.cuentaPacienteId <= 0) {
      errors.push('ID de cuenta POS es requerido');
    }

    if (data.fechaVencimiento && new Date(data.fechaVencimiento) <= new Date()) {
      errors.push('La fecha de vencimiento debe ser futura');
    }

    if (data.descuentoGlobal && (data.descuentoGlobal < 0 || data.descuentoGlobal > 100)) {
      errors.push('El descuento global debe estar entre 0 y 100%');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida los datos de un pago antes de crear
   */
  validatePaymentData(data: CreatePaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.facturaId || data.facturaId <= 0) {
      errors.push('ID de factura es requerido');
    }

    if (!data.monto || data.monto <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!data.metodoPago) {
      errors.push('Método de pago es requerido');
    }

    if (data.fechaPago && new Date(data.fechaPago) > new Date()) {
      errors.push('La fecha de pago no puede ser futura');
    }

    // Validaciones específicas por método de pago
    if (data.metodoPago === 'card' && !data.autorizacion) {
      errors.push('Código de autorización es requerido para pagos con tarjeta');
    }

    if (data.metodoPago === 'transfer' && !data.referencia) {
      errors.push('Referencia bancaria es requerida para transferencias');
    }

    if (data.metodoPago === 'check' && !data.referencia) {
      errors.push('Número de cheque es requerido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Exportar instancia singleton
export const billingService = new BillingService();
export default billingService;