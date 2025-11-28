import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';

import { PatientAccount } from '@/types/pos.types';
import { ATTENTION_TYPE_LABELS } from '@/utils/constants';
import PrintableAccountStatement from './PrintableAccountStatement';

interface AccountHistoryListProps {
  accounts: PatientAccount[];
  expandedAccount: number | null;
  onExpandAccount: (accountId: number) => void;
  onViewDetails: (account: PatientAccount) => void;
  loading: boolean;
}

const AccountHistoryList: React.FC<AccountHistoryListProps> = ({
  accounts,
  expandedAccount,
  onExpandAccount,
  onViewDetails,
  loading
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [accountToPrint, setAccountToPrint] = useState<PatientAccount | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Estado_Cuenta_${accountToPrint?.id || ''}_${new Date().getTime()}`,
    pageStyle: `
      @page {
        size: letter portrait;
        margin: 0.5in;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
    onAfterPrint: () => {
      setAccountToPrint(null);
    },
    onPrintError: (error) => {
      console.error('Error al imprimir:', error);
      toast.error('Error al imprimir el estado de cuenta');
      setAccountToPrint(null);
    }
  });

  const handlePrintAccount = useCallback((account: PatientAccount) => {
    if (!account.transacciones || account.transacciones.length === 0) {
      toast.warning('Primero expanda la cuenta para cargar las transacciones');
      return;
    }
    setAccountToPrint(account);
    // Pequeño delay para que el componente se renderice antes de imprimir
    setTimeout(() => {
      handlePrint();
    }, 100);
  }, [handlePrint]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getAttentionTypeColor = useCallback((tipo: string) => {
    switch (tipo) {
      case 'consulta_general': return 'primary';
      case 'urgencia': return 'error';
      case 'hospitalizacion': return 'warning';
      default: return 'default';
    }
  }, []);

  if (accounts.length === 0 && !loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AccountIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No se encontraron cuentas cerradas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No hay cuentas que coincidan con los filtros seleccionados
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer>
        <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cuenta #</TableCell>
            <TableCell>Paciente</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Fecha Cierre</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Método Pago</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <React.Fragment key={account.id}>
              <TableRow
                hover
                sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    #{account.id}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}
                    >
                      {account.paciente ?
                        `${account.paciente.nombre} ${account.paciente.apellidoPaterno} ${account.paciente.apellidoMaterno || ''}`.trim()
                        : 'Paciente no encontrado'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.paciente?.telefono || 'Sin teléfono'}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={ATTENTION_TYPE_LABELS[account.tipoAtencion]}
                    color={getAttentionTypeColor(account.tipoAtencion) as any}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {account.fechaCierre ? formatDate(account.fechaCierre) : 'N/A'}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatCurrency(account.totalCuenta)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}
                  >
                    S: {formatCurrency(account.totalServicios)} | P: {formatCurrency(account.totalProductos)}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Chip
                    label="Efectivo"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Chip
                    label="CERRADA"
                    color="success"
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(account)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={expandedAccount === account.id ? "Ocultar transacciones" : "Ver transacciones"}>
                      <IconButton
                        size="small"
                        onClick={() => onExpandAccount(account.id)}
                      >
                        {expandedAccount === account.id ?
                          <CollapseIcon fontSize="small" /> :
                          <ExpandIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Imprimir estado de cuenta">
                      <IconButton
                        size="small"
                        onClick={() => handlePrintAccount(account)}
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>

              {/* Fila expandible con transacciones */}
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 0 }}>
                  <Collapse in={expandedAccount === account.id} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Transacciones de la Cuenta #{account.id}
                      </Typography>

                      {account.transacciones && account.transacciones.length > 0 ? (
                        <List dense>
                          {account.transacciones.map((transaction: any, idx: number) => (
                            <ListItem key={idx} divider>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '300px'
                                      }}
                                    >
                                      {transaction.concepto}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                      {formatCurrency(transaction.subtotal)}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {transaction.tipo.toUpperCase()} • {formatDate(transaction.fecha)}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron transacciones para esta cuenta.
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
        </Table>
      </TableContainer>

      {/* Componente oculto para impresión - Estado de Cuenta formato Carta */}
      <div style={{ display: 'none' }}>
        {accountToPrint && (
          <PrintableAccountStatement
            ref={printRef}
            data={{
              cuentaId: accountToPrint.id,
              fechaEmision: new Date(),
              paciente: {
                nombre: accountToPrint.paciente?.nombre || '',
                apellidoPaterno: accountToPrint.paciente?.apellidoPaterno || '',
                apellidoMaterno: accountToPrint.paciente?.apellidoMaterno,
                telefono: accountToPrint.paciente?.telefono,
                email: accountToPrint.paciente?.email,
                direccion: accountToPrint.paciente?.direccion
              },
              medicoTratante: accountToPrint.medicoTratante ? {
                nombre: accountToPrint.medicoTratante.nombre,
                apellidoPaterno: accountToPrint.medicoTratante.apellidoPaterno,
                especialidad: accountToPrint.medicoTratante.especialidad
              } : undefined,
              tipoAtencion: accountToPrint.tipoAtencion,
              fechaIngreso: accountToPrint.fechaApertura,
              transacciones: (accountToPrint.transacciones || []).map((t: any) => ({
                id: t.id,
                tipo: t.tipo,
                concepto: t.concepto,
                cantidad: t.cantidad || 1,
                precioUnitario: t.precioUnitario || t.subtotal,
                subtotal: t.subtotal,
                fecha: t.fecha,
                producto: t.producto,
                servicio: t.servicio
              })),
              totales: {
                anticipo: accountToPrint.anticipo || 0,
                totalServicios: accountToPrint.totalServicios || 0,
                totalProductos: accountToPrint.totalProductos || 0,
                totalCuenta: accountToPrint.totalCuenta || 0,
                saldoPendiente: accountToPrint.saldoPendiente || 0
              },
              estado: accountToPrint.estado
            }}
          />
        )}
      </div>
    </>
  );
};

export default AccountHistoryList;
