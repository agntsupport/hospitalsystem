// Servicio de códigos postales para México
// Base de datos de códigos postales mexicanos (muestra representativa)

export interface PostalCodeInfo {
  codigoPostal: string;
  estado: string;
  municipio: string;
  ciudad: string;
  colonia: string[];
  zona?: string;
}

// Base de datos de códigos postales de México (muestra amplia)
const MEXICAN_POSTAL_CODES: PostalCodeInfo[] = [
  // Ciudad de México
  { codigoPostal: "01000", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["San Ángel"] },
  { codigoPostal: "01010", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["San Ángel Inn"] },
  { codigoPostal: "01020", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["San Ángel"] },
  { codigoPostal: "01030", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Axotla"] },
  { codigoPostal: "01040", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Campestre"] },
  { codigoPostal: "01050", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Florida"] },
  { codigoPostal: "01060", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Tlacopac"] },
  { codigoPostal: "01070", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Ex-Hacienda de Guadalupe Chimalistac"] },
  { codigoPostal: "01080", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Chimalistac"] },
  { codigoPostal: "01090", estado: "Ciudad de México", municipio: "Álvaro Obregón", ciudad: "Ciudad de México", colonia: ["Pueblo San Ángel"] },

  // Guadalajara, Jalisco
  { codigoPostal: "44100", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44110", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Zona Centro"] },
  { codigoPostal: "44120", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44130", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Zona Centro"] },
  { codigoPostal: "44140", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44150", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44160", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44170", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44180", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44190", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44200", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Centro"] },
  { codigoPostal: "44210", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Americana"] },
  { codigoPostal: "44220", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Lafayette"] },
  { codigoPostal: "44230", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Americana"] },
  { codigoPostal: "44240", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Americana"] },
  { codigoPostal: "44250", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Arcos Vallarta"] },
  { codigoPostal: "44260", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Americana"] },
  { codigoPostal: "44270", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Americana"] },
  { codigoPostal: "44280", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Ladrón de Guevara"] },
  { codigoPostal: "44290", estado: "Jalisco", municipio: "Guadalajara", ciudad: "Guadalajara", colonia: ["Americana"] },

  // Monterrey, Nuevo León
  { codigoPostal: "64000", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64010", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64020", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64030", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64040", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64050", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64060", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64070", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64080", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64090", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Centro"] },
  { codigoPostal: "64100", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64110", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64120", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64130", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64140", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64150", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64160", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64170", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64180", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },
  { codigoPostal: "64190", estado: "Nuevo León", municipio: "Monterrey", ciudad: "Monterrey", colonia: ["Del Valle"] },

  // Puebla, Puebla
  { codigoPostal: "72000", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72010", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72020", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72030", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72040", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72050", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72060", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72070", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72080", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72090", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Centro Histórico"] },
  { codigoPostal: "72100", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["La Paz"] },
  { codigoPostal: "72110", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Humboldt"] },
  { codigoPostal: "72120", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["La Paz"] },
  { codigoPostal: "72130", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Buenos Aires"] },
  { codigoPostal: "72140", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Buenos Aires"] },
  { codigoPostal: "72150", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Humboldt"] },
  { codigoPostal: "72160", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["La Paz"] },
  { codigoPostal: "72170", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Buenos Aires"] },
  { codigoPostal: "72180", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["Humboldt"] },
  { codigoPostal: "72190", estado: "Puebla", municipio: "Puebla", ciudad: "Puebla", colonia: ["La Paz"] },

  // Tijuana, Baja California
  { codigoPostal: "22000", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Centro"] },
  { codigoPostal: "22010", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Centro"] },
  { codigoPostal: "22020", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Centro"] },
  { codigoPostal: "22030", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Centro"] },
  { codigoPostal: "22040", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Centro"] },
  { codigoPostal: "22050", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Centro"] },
  { codigoPostal: "22100", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Zona Urbana Río"] },
  { codigoPostal: "22110", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Zona Urbana Río"] },
  { codigoPostal: "22120", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Zona Urbana Río"] },
  { codigoPostal: "22125", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Río"] },
  { codigoPostal: "22130", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Zona Urbana Río"] },
  { codigoPostal: "22135", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Río"] },
  { codigoPostal: "22140", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Zona Urbana Río"] },
  { codigoPostal: "22150", estado: "Baja California", municipio: "Tijuana", ciudad: "Tijuana", colonia: ["Zona Urbana Río"] },

  // Cancún, Quintana Roo
  { codigoPostal: "77500", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },
  { codigoPostal: "77510", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },
  { codigoPostal: "77520", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },
  { codigoPostal: "77530", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },
  { codigoPostal: "77533", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 2A Centro"] },
  { codigoPostal: "77534", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 3 Centro"] },
  { codigoPostal: "77535", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 4 Centro"] },
  { codigoPostal: "77536", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 5 Centro"] },
  { codigoPostal: "77537", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 6 Centro"] },
  { codigoPostal: "77538", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 7 Centro"] },
  { codigoPostal: "77539", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Supermanzana 8 Centro"] },
  { codigoPostal: "77540", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },
  { codigoPostal: "77550", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },
  { codigoPostal: "77560", estado: "Quintana Roo", municipio: "Benito Juárez", ciudad: "Cancún", colonia: ["Centro"] },

  // León, Guanajuato
  { codigoPostal: "37000", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37010", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37020", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37030", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37040", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37050", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37060", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37070", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37080", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37090", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37100", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Centro"] },
  { codigoPostal: "37110", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["San Isidro"] },
  { codigoPostal: "37120", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Obregón"] },
  { codigoPostal: "37130", estado: "Guanajuato", municipio: "León", ciudad: "León", colonia: ["Obregón"] },

  // Mérida, Yucatán
  { codigoPostal: "97000", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro Histórico"] },
  { codigoPostal: "97010", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97020", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97030", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97040", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97050", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97060", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97070", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97080", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97090", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Centro"] },
  { codigoPostal: "97100", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Pensiones"] },
  { codigoPostal: "97110", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Pensiones"] },
  { codigoPostal: "97115", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["Pensiones"] },
  { codigoPostal: "97119", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["García Ginerés"] },
  { codigoPostal: "97120", estado: "Yucatán", municipio: "Mérida", ciudad: "Mérida", colonia: ["García Ginerés"] },

  // Chihuahua, Chihuahua
  { codigoPostal: "31000", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31010", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31020", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31030", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31040", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31050", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31060", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31070", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31080", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31090", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Centro"] },
  { codigoPostal: "31100", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Santo Niño"] },
  { codigoPostal: "31110", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Santo Niño"] },
  { codigoPostal: "31120", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Santo Niño"] },
  { codigoPostal: "31125", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Pacífico"] },
  { codigoPostal: "31130", estado: "Chihuahua", municipio: "Chihuahua", ciudad: "Chihuahua", colonia: ["Santo Niño"] },

  // Toluca, Estado de México
  { codigoPostal: "50000", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50010", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50020", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50030", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50040", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50050", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50060", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50070", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50080", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50090", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Centro"] },
  { codigoPostal: "50100", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Universidad"] },
  { codigoPostal: "50110", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Universidad"] },
  { codigoPostal: "50120", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Universidad"] },
  { codigoPostal: "50130", estado: "Estado de México", municipio: "Toluca", ciudad: "Toluca", colonia: ["Universidad"] },
];

// Crear un índice para búsqueda rápida
const postalCodeIndex = new Map<string, PostalCodeInfo>();
MEXICAN_POSTAL_CODES.forEach(info => {
  postalCodeIndex.set(info.codigoPostal, info);
});

export class PostalCodeService {
  
  /**
   * Busca información por código postal exacto
   */
  static findByPostalCode(postalCode: string): PostalCodeInfo | null {
    const cleanCode = postalCode.replace(/\D/g, ''); // Remove non-digits
    return postalCodeIndex.get(cleanCode) || null;
  }

  /**
   * Busca códigos postales que coincidan parcialmente
   */
  static searchPostalCodes(partialCode: string, limit: number = 10): PostalCodeInfo[] {
    const cleanCode = partialCode.replace(/\D/g, '');
    if (cleanCode.length === 0) return [];

    const results: PostalCodeInfo[] = [];
    
    for (const info of MEXICAN_POSTAL_CODES) {
      if (info.codigoPostal.startsWith(cleanCode)) {
        results.push(info);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Busca por ciudad
   */
  static findByCiudad(ciudad: string, limit: number = 10): PostalCodeInfo[] {
    const searchTerm = ciudad.toLowerCase().trim();
    if (searchTerm.length === 0) return [];

    const results: PostalCodeInfo[] = [];
    
    for (const info of MEXICAN_POSTAL_CODES) {
      if (info.ciudad.toLowerCase().includes(searchTerm)) {
        results.push(info);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Busca por estado
   */
  static findByEstado(estado: string, limit: number = 20): PostalCodeInfo[] {
    const searchTerm = estado.toLowerCase().trim();
    if (searchTerm.length === 0) return [];

    const results: PostalCodeInfo[] = [];
    
    for (const info of MEXICAN_POSTAL_CODES) {
      if (info.estado.toLowerCase().includes(searchTerm)) {
        results.push(info);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Obtiene todos los estados únicos
   */
  static getAllEstados(): string[] {
    const estados = new Set<string>();
    MEXICAN_POSTAL_CODES.forEach(info => estados.add(info.estado));
    return Array.from(estados).sort();
  }

  /**
   * Obtiene todas las ciudades únicas para un estado
   */
  static getCiudadesByEstado(estado: string): string[] {
    const ciudades = new Set<string>();
    
    MEXICAN_POSTAL_CODES
      .filter(info => info.estado === estado)
      .forEach(info => ciudades.add(info.ciudad));
    
    return Array.from(ciudades).sort();
  }

  /**
   * Valida formato de código postal mexicano
   */
  static isValidMexicanPostalCode(postalCode: string): boolean {
    const cleanCode = postalCode.replace(/\D/g, '');
    return cleanCode.length === 5 && /^\d{5}$/.test(cleanCode);
  }

  /**
   * Formatea código postal (agrega espacios si es necesario)
   */
  static formatPostalCode(postalCode: string): string {
    const cleanCode = postalCode.replace(/\D/g, '');
    if (cleanCode.length === 5) {
      return cleanCode;
    }
    return postalCode; // Return original if not valid
  }
}