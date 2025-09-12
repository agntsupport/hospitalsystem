
const empleados = [
  {id: 22, nombre: 'Cristian', apellidoPaterno: 'Calderon', tipoEmpleado: 'medico_especialista', especialidad: 'Medicina integral'},
  {id: 21, nombre: 'Dra. Ana', apellidoPaterno: 'Martínez', tipoEmpleado: 'medico_residente', especialidad: null},
  {id: 20, nombre: 'Dr. Carlos', apellidoPaterno: 'Rodríguez', tipoEmpleado: 'medico_especialista', especialidad: 'Medicina Interna'},
  {id: 19, nombre: 'María', apellidoPaterno: 'González', tipoEmpleado: 'enfermero', especialidad: null}
];

const medicosList = empleados.filter(e => 
  e.tipoEmpleado === 'medico_especialista' || e.tipoEmpleado === 'medico_residente'
);

console.log('Filtered medicos:', medicosList);

