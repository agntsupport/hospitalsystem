// ABOUTME: Rutas API para gestión de comisiones médicas del 5%.
// ABOUTME: Permite calcular, generar reportes y procesar pagos de comisiones a médicos.

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { generateCommissionReceiptPdf } = require('../utils/pdfGenerator');

// Constante del porcentaje de comisión
const PORCENTAJE_COMISION = 5.00;

// ============================================
// ENDPOINTS DE COMISIONES MÉDICAS
// ============================================

/**
 * GET /api/comisiones/calcular
 * Calcula las comisiones para un periodo específico
 * Query params: fechaInicio, fechaFin
 */
router.get('/calcular', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'Fechas de inicio y fin son requeridas'
      });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    // Buscar cuentas cerradas en el periodo que tengan médico tratante asignado
    const cuentasCerradas = await prisma.cuentaPaciente.findMany({
      where: {
        estado: 'cerrada',
        fechaCierre: {
          gte: inicio,
          lte: fin
        },
        // El médico tratante está directamente en la cuenta
        medicoTratanteId: { not: null }
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numeroExpediente: true
          }
        },
        medicoTratante: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true,
            cedulaProfesional: true
          }
        },
        transacciones: {
          where: {
            OR: [
              { tipo: 'servicio' },
              { tipo: 'producto' }
            ]
          }
        }
      }
    });

    // Agrupar por médico
    const comisionesPorMedico = {};

    for (const cuenta of cuentasCerradas) {
      // Calcular total de la cuenta (servicios + productos)
      const totalCuenta = cuenta.transacciones.reduce((sum, t) => {
        return sum + parseFloat(t.monto || 0);
      }, 0);

      // Obtener médico tratante directamente de la cuenta
      const medico = cuenta.medicoTratante;
      if (!medico) continue;
      const medicoId = medico.id;

      if (!comisionesPorMedico[medicoId]) {
        comisionesPorMedico[medicoId] = {
          medicoId,
          nombreMedico: `${medico.nombre} ${medico.apellidoPaterno} ${medico.apellidoMaterno || ''}`.trim(),
          especialidad: medico.especialidad,
          cedulaProfesional: medico.cedulaProfesional,
          cuentas: [],
          totalFacturado: 0,
          porcentaje: PORCENTAJE_COMISION,
          montoComision: 0
        };
      }

      comisionesPorMedico[medicoId].cuentas.push({
        cuentaId: cuenta.id,
        paciente: `${cuenta.paciente.nombre} ${cuenta.paciente.apellidoPaterno}`.trim(),
        expediente: cuenta.paciente.numeroExpediente,
        totalCuenta,
        fechaCierre: cuenta.fechaCierre
      });

      comisionesPorMedico[medicoId].totalFacturado += totalCuenta;
    }

    // Calcular comisión para cada médico
    const comisiones = Object.values(comisionesPorMedico).map(med => ({
      ...med,
      totalCuentas: med.cuentas.length,
      montoComision: parseFloat((med.totalFacturado * (PORCENTAJE_COMISION / 100)).toFixed(2))
    }));

    // Resumen general
    const resumen = {
      periodo: { fechaInicio: inicio, fechaFin: fin },
      totalMedicos: comisiones.length,
      totalCuentas: comisiones.reduce((sum, c) => sum + c.totalCuentas, 0),
      totalFacturado: comisiones.reduce((sum, c) => sum + c.totalFacturado, 0),
      totalComisiones: comisiones.reduce((sum, c) => sum + c.montoComision, 0)
    };

    res.json({
      success: true,
      data: {
        resumen,
        comisiones
      }
    });

  } catch (error) {
    console.error('Error calculando comisiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al calcular comisiones'
    });
  }
});

/**
 * POST /api/comisiones/generar
 * Genera un registro de comisión para un médico en un periodo
 */
router.post('/generar', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const {
      medicoId,
      fechaInicio,
      fechaFin,
      nombreMedico,
      especialidad,
      cedulaProfesional,
      totalCuentas,
      montoFacturado,
      montoComision
    } = req.body;

    if (!medicoId || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: 'Datos de comisión incompletos'
      });
    }

    // Verificar que no exista ya una comisión para este médico en el mismo periodo
    const existente = await prisma.comisionMedica.findFirst({
      where: {
        medicoId: parseInt(medicoId),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin)
      }
    });

    if (existente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una comisión generada para este médico en el periodo especificado'
      });
    }

    const comision = await prisma.comisionMedica.create({
      data: {
        medicoId: parseInt(medicoId),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        nombreMedico,
        especialidad,
        cedulaProfesional,
        totalCuentas: parseInt(totalCuentas),
        montoFacturado: parseFloat(montoFacturado),
        porcentaje: PORCENTAJE_COMISION,
        montoComision: parseFloat(montoComision),
        estado: 'PENDIENTE',
        creadoPorId: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Comisión generada exitosamente',
      data: comision
    });

  } catch (error) {
    console.error('Error generando comisión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar comisión'
    });
  }
});

/**
 * GET /api/comisiones
 * Lista todas las comisiones con filtros
 * Query params: estado, medicoId, page, limit
 */
router.get('/', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const { estado, medicoId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (estado) where.estado = estado;
    if (medicoId) where.medicoId = parseInt(medicoId);

    const [comisiones, total] = await Promise.all([
      prisma.comisionMedica.findMany({
        where,
        include: {
          medico: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              especialidad: true
            }
          },
          creadoPor: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.comisionMedica.count({ where })
    ]);

    res.json({
      success: true,
      data: comisiones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error listando comisiones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar comisiones'
    });
  }
});

/**
 * GET /api/comisiones/:id
 * Obtiene detalle de una comisión específica
 */
router.get('/:id', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const { id } = req.params;

    const comision = await prisma.comisionMedica.findUnique({
      where: { id: parseInt(id) },
      include: {
        medico: {
          select: {
            id: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            especialidad: true,
            cedulaProfesional: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!comision) {
      return res.status(404).json({
        success: false,
        error: 'Comisión no encontrada'
      });
    }

    res.json({
      success: true,
      data: comision
    });

  } catch (error) {
    console.error('Error obteniendo comisión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener comisión'
    });
  }
});

/**
 * PUT /api/comisiones/:id/firmar-medico
 * Registra la firma del médico en la comisión
 */
router.put('/:id/firmar-medico', authenticateToken, authorizeRoles('administrador', 'medico_especialista', 'medico_residente'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firmaMedico, nombreMedico } = req.body;

    if (!firmaMedico) {
      return res.status(400).json({
        success: false,
        error: 'La firma del médico es requerida'
      });
    }

    const comision = await prisma.comisionMedica.findUnique({
      where: { id: parseInt(id) }
    });

    if (!comision) {
      return res.status(404).json({
        success: false,
        error: 'Comisión no encontrada'
      });
    }

    if (comision.firmaMedico) {
      return res.status(400).json({
        success: false,
        error: 'Esta comisión ya tiene la firma del médico'
      });
    }

    const updated = await prisma.comisionMedica.update({
      where: { id: parseInt(id) },
      data: {
        firmaMedico,
        fechaFirmaMedico: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Firma del médico registrada',
      data: updated
    });

  } catch (error) {
    console.error('Error firmando comisión (médico):', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar firma del médico'
    });
  }
});

/**
 * PUT /api/comisiones/:id/pagar
 * Marca la comisión como pagada con firma del admin y genera PDF
 */
router.put('/:id/pagar', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firmaAdmin, nombreAdmin } = req.body;

    if (!firmaAdmin || !nombreAdmin) {
      return res.status(400).json({
        success: false,
        error: 'La firma y nombre del administrador son requeridos'
      });
    }

    const comision = await prisma.comisionMedica.findUnique({
      where: { id: parseInt(id) },
      include: {
        medico: true
      }
    });

    if (!comision) {
      return res.status(404).json({
        success: false,
        error: 'Comisión no encontrada'
      });
    }

    if (comision.estado === 'PAGADA') {
      return res.status(400).json({
        success: false,
        error: 'Esta comisión ya está pagada'
      });
    }

    if (!comision.firmaMedico) {
      return res.status(400).json({
        success: false,
        error: 'El médico debe firmar primero la comisión'
      });
    }

    // Generar PDF del comprobante
    let pdfBase64 = null;
    try {
      pdfBase64 = await generateCommissionReceiptPdf({
        comision: {
          id: comision.id,
          fechaInicio: comision.fechaInicio,
          fechaFin: comision.fechaFin,
          totalCuentas: comision.totalCuentas,
          montoFacturado: comision.montoFacturado,
          porcentaje: comision.porcentaje,
          montoComision: comision.montoComision
        },
        medico: {
          nombre: comision.nombreMedico,
          especialidad: comision.especialidad,
          cedula: comision.cedulaProfesional
        },
        firmas: {
          firmaMedico: comision.firmaMedico,
          fechaFirmaMedico: comision.fechaFirmaMedico,
          firmaAdmin,
          nombreAdmin,
          fechaFirmaAdmin: new Date()
        },
        hospitalInfo: {
          nombre: 'Hospital Integral',
          direccion: 'Dirección del Hospital',
          telefono: '443 104 7479'
        }
      });
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
      // Continuar sin PDF si falla
    }

    const updated = await prisma.comisionMedica.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'PAGADA',
        fechaPago: new Date(),
        firmaAdmin,
        nombreAdmin,
        fechaFirmaAdmin: new Date(),
        pdfComprobante: pdfBase64
      }
    });

    res.json({
      success: true,
      message: 'Comisión pagada exitosamente',
      data: {
        ...updated,
        tienePdf: !!pdfBase64
      }
    });

  } catch (error) {
    console.error('Error pagando comisión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al pagar comisión'
    });
  }
});

/**
 * PUT /api/comisiones/:id/anular
 * Anula una comisión pendiente
 */
router.put('/:id/anular', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const { id } = req.params;

    const comision = await prisma.comisionMedica.findUnique({
      where: { id: parseInt(id) }
    });

    if (!comision) {
      return res.status(404).json({
        success: false,
        error: 'Comisión no encontrada'
      });
    }

    if (comision.estado === 'PAGADA') {
      return res.status(400).json({
        success: false,
        error: 'No se puede anular una comisión ya pagada'
      });
    }

    const updated = await prisma.comisionMedica.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'ANULADA'
      }
    });

    res.json({
      success: true,
      message: 'Comisión anulada',
      data: updated
    });

  } catch (error) {
    console.error('Error anulando comisión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al anular comisión'
    });
  }
});

/**
 * GET /api/comisiones/:id/pdf
 * Descarga el PDF del comprobante de pago
 */
router.get('/:id/pdf', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const { id } = req.params;

    const comision = await prisma.comisionMedica.findUnique({
      where: { id: parseInt(id) }
    });

    if (!comision) {
      return res.status(404).json({
        success: false,
        error: 'Comisión no encontrada'
      });
    }

    if (!comision.pdfComprobante) {
      return res.status(404).json({
        success: false,
        error: 'Esta comisión no tiene PDF generado'
      });
    }

    const pdfBuffer = Buffer.from(comision.pdfComprobante, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comision-${comision.id}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error descargando PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al descargar PDF'
    });
  }
});

/**
 * GET /api/comisiones/stats/resumen
 * Estadísticas generales de comisiones
 */
router.get('/stats/resumen', authenticateToken, authorizeRoles('administrador'), async (req, res) => {
  try {
    const [
      pendientes,
      pagadas,
      anuladas,
      totalPagado
    ] = await Promise.all([
      prisma.comisionMedica.count({ where: { estado: 'PENDIENTE' } }),
      prisma.comisionMedica.count({ where: { estado: 'PAGADA' } }),
      prisma.comisionMedica.count({ where: { estado: 'ANULADA' } }),
      prisma.comisionMedica.aggregate({
        where: { estado: 'PAGADA' },
        _sum: { montoComision: true }
      })
    ]);

    // Comisiones del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const comisionesMes = await prisma.comisionMedica.aggregate({
      where: {
        estado: 'PAGADA',
        fechaPago: { gte: inicioMes }
      },
      _sum: { montoComision: true },
      _count: true
    });

    res.json({
      success: true,
      data: {
        porEstado: {
          pendientes,
          pagadas,
          anuladas
        },
        totalPagado: parseFloat(totalPagado._sum.montoComision || 0),
        mesActual: {
          cantidad: comisionesMes._count || 0,
          monto: parseFloat(comisionesMes._sum.montoComision || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

module.exports = router;
