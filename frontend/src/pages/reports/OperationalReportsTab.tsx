import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Hotel as HotelIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  LocalHospital as LocalHospitalIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  ReportFilters,
  RoomOccupancyReport,
  EmployeeProductivityReport,
  InventoryTurnoverReport,
  PatientFlowReport
} from '@/types/reports.types';
import reportsService from '@/services/reportsService';
import { BarChart, DonutChart, MetricCard } from '@/components/reports/ReportChart';

interface OperationalReportsTabProps {
  filters: ReportFilters;
  onError: (error: string | null) => void;
  onLoading: (loading: boolean) => void;
}

const OperationalReportsTab: React.FC<OperationalReportsTabProps> = ({
  filters,
  onError,
  onLoading
}) => {
  const [loading, setLoading] = useState(false);
  const [roomOccupancy, setRoomOccupancy] = useState<RoomOccupancyReport | null>(null);
  const [employeeProductivity, setEmployeeProductivity] = useState<EmployeeProductivityReport[]>([]);
  const [inventoryTurnover, setInventoryTurnover] = useState<InventoryTurnoverReport[]>([]);
  const [patientFlow, setPatientFlow] = useState<PatientFlowReport | null>(null);

  const loadOperationalData = async () => {
    try {
      setLoading(true);
      onLoading(true);
      onError(null);

      // Validar filtros
      const validation = reportsService.validateFilters(filters);
      if (!validation.valid) {
        onError(validation.errors.join(', '));
        return;
      }

      // Cargar todos los datos en paralelo
      const [
        roomResponse,
        employeeResponse,
        inventoryResponse,
        patientResponse
      ] = await Promise.all([
        reportsService.getRoomOccupancy(filters),
        reportsService.getEmployeeProductivity(filters),
        reportsService.getInventoryTurnover(filters),
        reportsService.getPatientFlow(filters)
      ]);

      // Procesar respuestas
      if (roomResponse.success && roomResponse.data) {
        setRoomOccupancy(roomResponse.data);
      } else {
        console.error('Error en ocupación de habitaciones:', roomResponse.message);
      }

      if (employeeResponse.success) {
        setEmployeeProductivity(employeeResponse.data?.items || []);
      } else {
        console.error('Error en productividad de empleados:', employeeResponse.message);
      }

      if (inventoryResponse.success) {
        setInventoryTurnover(inventoryResponse.data?.items || []);
      } else {
        console.error('Error en rotación de inventario:', inventoryResponse.message);
      }

      if (patientResponse.success && patientResponse.data) {
        setPatientFlow(patientResponse.data);
      } else {
        console.error('Error en flujo de pacientes:', patientResponse.message);
      }

    } catch (error: any) {
      console.error('Error al cargar datos operativos:', error);
      onError('Error al cargar los datos operativos');
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  useEffect(() => {
    loadOperationalData();
  }, [filters]);

  const renderRoomOccupancy = () => {
    if (loading || !roomOccupancy) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ocupación General"
            value={`${roomOccupancy.porcentajeOcupacion.toFixed(1)}%`}
            subtitle={`${roomOccupancy.ocupadas}/${roomOccupancy.totalHabitaciones} habitaciones`}
            trend={roomOccupancy.porcentajeOcupacion > 75 ? 'up' : 'down'}
            trendValue={Math.abs(roomOccupancy.porcentajeOcupacion - 75)}
            icon={<HotelIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Habitaciones Disponibles"
            value={roomOccupancy.disponibles}
            subtitle="Listas para uso"
            icon={<LocalHospitalIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Promedio Estancia"
            value={`${roomOccupancy.promedioEstancia} días`}
            subtitle="Por paciente"
            icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ingresos por Habitación"
            value={reportsService.formatCurrency((roomOccupancy.ocupadas || 0) * 1500)}
            subtitle="Promedio diario"
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <DonutChart
            title="Ocupación por Tipo de Habitación"
            data={Object.entries(roomOccupancy.ocupacionPorTipo || {}).map(([tipo, data]) => ({
              label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
              value: data.ocupadas || 0
            }))}
            height={300}
            innerRadius={0.5}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalle por Tipo de Habitación
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="center">Ocupadas</TableCell>
                      <TableCell align="center">Ocupación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(roomOccupancy.ocupacionPorTipo || {}).map(([tipo, data], index) => {
                      const porcentaje = data.total > 0 ? (data.ocupadas / data.total) * 100 : 0;
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography 
                              variant="body2"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '120px'
                              }}
                            >
                              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{data.total}</TableCell>
                          <TableCell align="center">{data.ocupadas}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={porcentaje}
                                sx={{ minWidth: 60, flexGrow: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {porcentaje.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderEmployeeProductivity = () => {
    if (loading || employeeProductivity.length === 0) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </CardContent>
        </Card>
      );
    }

    const getEmployeeTypeColor = (tipo: string) => {
      switch (tipo) {
        case 'medico_especialista': return 'primary';
        case 'medico_residente': return 'secondary';
        case 'enfermero': return 'success';
        default: return 'default';
      }
    };

    const getEmployeeTypeLabel = (tipo: string) => {
      switch (tipo) {
        case 'medico_especialista': return 'Especialista';
        case 'medico_residente': return 'Residente';
        case 'enfermero': return 'Enfermero/a';
        default: return tipo;
      }
    };

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            Productividad de Empleados
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center">Pacientes</TableCell>
                  <TableCell align="center">Horas</TableCell>
                  <TableCell align="center">Ingresos</TableCell>
                  <TableCell align="center">Eficiencia</TableCell>
                  <TableCell align="center">Satisfacción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeProductivity.filter(employee => employee && employee.empleado?.nombre).map((employee, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.empleado.nombre}
                        </Typography>
                        {employee.empleado.tipo && (
                          <Typography variant="caption" color="text.secondary">
                            {employee.empleado.tipo}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.empleado.especialidad || 'Sin especialidad'}
                        color="default"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{employee.pacientesAtendidos || 0}</TableCell>
                    <TableCell align="center">{employee.horasTrabajadas || 0}h</TableCell>
                    <TableCell align="center">
                      {reportsService.formatCurrency((employee.pacientesAtendidos || 0) * 500)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={employee.eficiencia || 0}
                          sx={{ minWidth: 60, flexGrow: 1 }}
                          color={(employee.eficiencia || 0) > 85 ? 'success' : (employee.eficiencia || 0) > 70 ? 'warning' : 'error'}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {(employee.eficiencia || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {employee.satisfaccionPacientes && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2">
                            {employee.satisfaccionPacientes.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderInventoryTurnover = () => {
    if (loading || inventoryTurnover.length === 0) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon />
            Rotación de Inventario
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="center">Stock Inicial</TableCell>
                  <TableCell align="center">Consumido</TableCell>
                  <TableCell align="center">Stock Final</TableCell>
                  <TableCell align="center">Rotación</TableCell>
                  <TableCell align="center">Días Inventario</TableCell>
                  <TableCell align="center">Valor Rotación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryTurnover.filter(item => item && item.producto?.nombre).map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.producto.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.producto.categoria || 'Sin categoría'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{(((item.stockInicial || 0) + (item.stockFinal || 0)) / 2).toLocaleString()}</TableCell>
                    <TableCell align="center">{(item.consumido || 0).toLocaleString()}</TableCell>
                    <TableCell align="center">{Math.max(0, (((item.stockInicial || 0) + (item.stockFinal || 0)) / 2) - (item.consumido || 0)).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color={(item.rotacion || 0) > 8 ? 'success.main' : (item.rotacion || 0) > 5 ? 'warning.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {(item.rotacion || 0).toFixed(1)}x
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.diasInventario || 0} días</TableCell>
                    <TableCell align="center">
                      {reportsService.formatCurrency(item.valorRotacion || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPatientFlow = () => {
    if (loading || !patientFlow) {
      return (
        <Grid container spacing={3}>
          {[1, 2].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" width="100%" height={200} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalHospitalIcon />
                Flujo de Pacientes
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                      {patientFlow.nuevosIngresos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nuevos Ingresos
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {patientFlow.altas}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Altas
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {patientFlow.pacientesActivos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pacientes Activos
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {patientFlow.promedioEstancia}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Días Promedio
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="body2">
                  <strong>Tasa de Reingreso:</strong> {patientFlow.tasaReingreso}%
                </Typography>
                <Typography variant="body2">
                  <strong>Satisfacción Promedio:</strong> {patientFlow.satisfaccionPromedio}/5.0
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <DonutChart
            title="Consultas por Tipo"
            data={(patientFlow.consultasPorTipo || []).map((item) => ({
              label: item.tipo,
              value: item.cantidad
            }))}
            height={350}
            innerRadius={0.4}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 600,
            mb: 1
          }}
        >
          <AssessmentIcon color="primary" />
          Reportes Operativos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Análisis de ocupación, productividad y flujo operativo
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Ocupación de Habitaciones */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                pl: 2,
                py: 1,
                backgroundColor: 'background.paper',
                borderLeft: '4px solid',
                borderLeftColor: 'warning.main',
                borderRadius: '4px 0 0 4px',
                fontWeight: 600
              }}
            >
              Ocupación de Habitaciones
            </Typography>
          </Box>
          {renderRoomOccupancy()}
        </Grid>

        {/* Flujo de Pacientes */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                pl: 2,
                py: 1,
                backgroundColor: 'background.paper',
                borderLeft: '4px solid',
                borderLeftColor: 'info.main',
                borderRadius: '4px 0 0 4px',
                fontWeight: 600
              }}
            >
              Flujo de Pacientes
            </Typography>
          </Box>
          {renderPatientFlow()}
        </Grid>

        {/* Productividad de Empleados */}
        <Grid item xs={12}>
          {renderEmployeeProductivity()}
        </Grid>

        {/* Rotación de Inventario */}
        <Grid item xs={12}>
          {renderInventoryTurnover()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperationalReportsTab;