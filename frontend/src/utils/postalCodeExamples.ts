// Ejemplos de códigos postales para pruebas y demostración

export const POSTAL_CODE_EXAMPLES = {
  // Ejemplos para diferentes estados
  ciudadDeMexico: [
    { codigo: '01000', ciudad: 'Ciudad de México', descripcion: 'San Ángel, Álvaro Obregón' },
    { codigo: '01010', ciudad: 'Ciudad de México', descripcion: 'San Ángel Inn, Álvaro Obregón' },
    { codigo: '01020', ciudad: 'Ciudad de México', descripcion: 'San Ángel, Álvaro Obregón' },
    { codigo: '01030', ciudad: 'Ciudad de México', descripcion: 'Axotla, Álvaro Obregón' },
    { codigo: '01040', ciudad: 'Ciudad de México', descripcion: 'Campestre, Álvaro Obregón' },
  ],
  
  jalisco: [
    { codigo: '44100', ciudad: 'Guadalajara', descripcion: 'Centro, Guadalajara' },
    { codigo: '44110', ciudad: 'Guadalajara', descripcion: 'Zona Centro, Guadalajara' },
    { codigo: '44210', ciudad: 'Guadalajara', descripcion: 'Americana, Guadalajara' },
    { codigo: '44220', ciudad: 'Guadalajara', descripcion: 'Lafayette, Guadalajara' },
    { codigo: '44250', ciudad: 'Guadalajara', descripcion: 'Arcos Vallarta, Guadalajara' },
  ],
  
  nuevoLeon: [
    { codigo: '64000', ciudad: 'Monterrey', descripcion: 'Centro, Monterrey' },
    { codigo: '64100', ciudad: 'Monterrey', descripcion: 'Del Valle, Monterrey' },
    { codigo: '64110', ciudad: 'Monterrey', descripcion: 'Del Valle, Monterrey' },
    { codigo: '64120', ciudad: 'Monterrey', descripcion: 'Del Valle, Monterrey' },
    { codigo: '64130', ciudad: 'Monterrey', descripcion: 'Del Valle, Monterrey' },
  ],
  
  puebla: [
    { codigo: '72000', ciudad: 'Puebla', descripcion: 'Centro Histórico, Puebla' },
    { codigo: '72100', ciudad: 'Puebla', descripcion: 'La Paz, Puebla' },
    { codigo: '72110', ciudad: 'Puebla', descripcion: 'Humboldt, Puebla' },
    { codigo: '72130', ciudad: 'Puebla', descripcion: 'Buenos Aires, Puebla' },
    { codigo: '72150', ciudad: 'Puebla', descripcion: 'Humboldt, Puebla' },
  ],
  
  bajaCalifornia: [
    { codigo: '22000', ciudad: 'Tijuana', descripcion: 'Centro, Tijuana' },
    { codigo: '22100', ciudad: 'Tijuana', descripcion: 'Zona Urbana Río, Tijuana' },
    { codigo: '22110', ciudad: 'Tijuana', descripcion: 'Zona Urbana Río, Tijuana' },
    { codigo: '22125', ciudad: 'Tijuana', descripcion: 'Río, Tijuana' },
    { codigo: '22135', ciudad: 'Tijuana', descripcion: 'Río, Tijuana' },
  ],
  
  quintanaRoo: [
    { codigo: '77500', ciudad: 'Cancún', descripcion: 'Centro, Benito Juárez' },
    { codigo: '77510', ciudad: 'Cancún', descripcion: 'Centro, Benito Juárez' },
    { codigo: '77533', ciudad: 'Cancún', descripcion: 'Supermanzana 2A Centro, Benito Juárez' },
    { codigo: '77540', ciudad: 'Cancún', descripcion: 'Centro, Benito Juárez' },
    { codigo: '77550', ciudad: 'Cancún', descripcion: 'Centro, Benito Juárez' },
  ],
  
  guanajuato: [
    { codigo: '37000', ciudad: 'León', descripcion: 'Centro, León' },
    { codigo: '37100', ciudad: 'León', descripcion: 'Centro, León' },
    { codigo: '37110', ciudad: 'León', descripcion: 'San Isidro, León' },
    { codigo: '37120', ciudad: 'León', descripcion: 'Obregón, León' },
    { codigo: '37130', ciudad: 'León', descripcion: 'Obregón, León' },
  ],
  
  yucatan: [
    { codigo: '97000', ciudad: 'Mérida', descripcion: 'Centro Histórico, Mérida' },
    { codigo: '97100', ciudad: 'Mérida', descripcion: 'Pensiones, Mérida' },
    { codigo: '97119', ciudad: 'Mérida', descripcion: 'García Ginerés, Mérida' },
    { codigo: '97120', ciudad: 'Mérida', descripcion: 'García Ginerés, Mérida' },
    { codigo: '97115', ciudad: 'Mérida', descripcion: 'Pensiones, Mérida' },
  ],
  
  chihuahua: [
    { codigo: '31000', ciudad: 'Chihuahua', descripcion: 'Centro, Chihuahua' },
    { codigo: '31100', ciudad: 'Chihuahua', descripcion: 'Santo Niño, Chihuahua' },
    { codigo: '31110', ciudad: 'Chihuahua', descripcion: 'Santo Niño, Chihuahua' },
    { codigo: '31125', ciudad: 'Chihuahua', descripcion: 'Pacífico, Chihuahua' },
    { codigo: '31130', ciudad: 'Chihuahua', descripcion: 'Santo Niño, Chihuahua' },
  ],
  
  estadoDeMexico: [
    { codigo: '50000', ciudad: 'Toluca', descripcion: 'Centro, Toluca' },
    { codigo: '50100', ciudad: 'Toluca', descripcion: 'Universidad, Toluca' },
    { codigo: '50110', ciudad: 'Toluca', descripcion: 'Universidad, Toluca' },
    { codigo: '50120', ciudad: 'Toluca', descripcion: 'Universidad, Toluca' },
    { codigo: '50130', ciudad: 'Toluca', descripcion: 'Universidad, Toluca' },
  ],
};

// Función para obtener ejemplos aleatorios
export const getRandomPostalCodeExamples = (count: number = 5) => {
  const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();
  const shuffled = allExamples.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Función para buscar ejemplos por ciudad
export const findExamplesByCity = (cityName: string) => {
  const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();
  return allExamples.filter(example => 
    example.ciudad.toLowerCase().includes(cityName.toLowerCase())
  );
};

// Estados disponibles
export const AVAILABLE_STATES = [
  'Ciudad de México',
  'Jalisco', 
  'Nuevo León',
  'Puebla',
  'Baja California',
  'Quintana Roo',
  'Guanajuato',
  'Yucatán',
  'Chihuahua',
  'Estado de México'
];

// Guía de uso para el usuario
export const USAGE_GUIDE = {
  search: {
    postalCode: "Busca escribiendo los primeros dígitos: 44, 64, 77...",
    city: "Busca escribiendo el nombre de la ciudad: Guadalajara, Monterrey, Cancún...",
    examples: "Ejemplos rápidos: 44100 (Guadalajara), 64000 (Monterrey), 77500 (Cancún)"
  },
  features: {
    autocomplete: "Autocompletado inteligente con códigos postales de México",
    validation: "Validación automática de formato de código postal mexicano (5 dígitos)",
    colonies: "Muestra colonias disponibles para cada código postal",
    statesCities: "Base de datos con principales ciudades de México"
  }
};