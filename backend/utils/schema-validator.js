const { prisma } = require('./database');

/**
 * Utilidad de validación de schema para prevenir errores de campos
 * Genera automáticamente los campos válidos desde Prisma
 */

// Mapeos de campos válidos extraídos del schema
const VALID_FIELDS = {
  proveedor: {
    id: true,
    nombreEmpresa: true,
    contactoNombre: true,  // NO nombreComercial
    telefono: true,
    email: true,
    direccion: true,
    rfc: true,
    activo: true,
    createdAt: true,
    updatedAt: true
  },
  
  producto: {
    id: true,
    codigo: true,
    codigoBarras: true,
    nombre: true,
    descripcion: true,
    categoria: true,
    unidadMedida: true,
    contenidoPorUnidad: true,
    precioCompra: true,
    precioVenta: true,
    stockMinimo: true,
    stockMaximo: true,
    stockActual: true,
    ubicacion: true,
    requiereReceta: true,
    fechaCaducidad: true,
    lote: true,
    proveedorId: true,
    activo: true,
    createdAt: true,
    updatedAt: true
  },
  
  movimientoInventario: {
    id: true,
    productoId: true,
    tipo: true,
    cantidad: true,
    motivo: true,
    observaciones: true,
    usuarioId: true,
    fechaMovimiento: true,  // NO createdAt para movimientos
    createdAt: true,
    updatedAt: true
  },
  
  paciente: {
    id: true,
    numeroExpediente: true,
    nombre: true,
    apellidoPaterno: true,
    apellidoMaterno: true,
    fechaNacimiento: true,
    genero: true,
    tipoSangre: true,
    telefono: true,
    email: true,
    direccion: true,
    ciudad: true,
    estado: true,
    codigoPostal: true,
    ocupacion: true,
    estadoCivil: true,
    religion: true,
    alergias: true,
    medicamentosActuales: true,
    antecedentesPatologicos: true,
    antecedentesFamiliares: true,
    contactoEmergenciaNombre: true,
    contactoEmergenciaRelacion: true,
    contactoEmergenciaTelefono: true,
    seguroAseguradora: true,
    seguroNumeroPoliza: true,
    seguroVigencia: true,
    curp: true,
    nss: true,
    esMenorEdad: true,
    responsableId: true,
    activo: true,
    ultimaVisita: true,
    createdAt: true,
    updatedAt: true
  },
  
  usuario: {
    id: true,
    username: true,
    passwordHash: true,
    email: true,
    rol: true,
    activo: true,
    createdAt: true,
    updatedAt: true
  }
};

/**
 * Valida que un select object contenga solo campos válidos
 * @param {string} modelName - Nombre del modelo
 * @param {object} selectObj - Objeto select a validar
 * @returns {object} - Objeto select válido o error
 */
function validateSelect(modelName, selectObj) {
  const validFields = VALID_FIELDS[modelName];
  
  if (!validFields) {
    throw new Error(`Modelo '${modelName}' no encontrado en validaciones`);
  }
  
  const invalidFields = [];
  const validatedSelect = {};
  
  for (const [fieldName, value] of Object.entries(selectObj)) {
    if (validFields[fieldName]) {
      validatedSelect[fieldName] = value;
    } else {
      invalidFields.push(fieldName);
    }
  }
  
  if (invalidFields.length > 0) {
    const availableFields = Object.keys(validFields);
    throw new Error(
      `Campo(s) inválido(s) '${invalidFields.join(', ')}' en modelo '${modelName}'. ` +
      `Campos disponibles: ${availableFields.join(', ')}`
    );
  }
  
  return validatedSelect;
}

/**
 * Genera select objects seguros para modelos comunes
 */
const SAFE_SELECTS = {
  proveedor: {
    basic: {
      id: true,
      nombreEmpresa: true,
      contactoNombre: true
    },
    full: {
      id: true,
      nombreEmpresa: true,
      contactoNombre: true,
      telefono: true,
      email: true,
      direccion: true,
      rfc: true,
      activo: true
    }
  },
  
  producto: {
    basic: {
      id: true,
      codigo: true,
      nombre: true,
      categoria: true,
      stockActual: true
    },
    full: {
      id: true,
      codigo: true,
      codigoBarras: true,
      nombre: true,
      descripcion: true,
      categoria: true,
      precioVenta: true,
      stockActual: true,
      stockMinimo: true
    }
  },
  
  usuario: {
    basic: {
      id: true,
      username: true
    },
    safe: {
      id: true,
      username: true,
      email: true,
      rol: true,
      activo: true
    }
  },
  
  paciente: {
    basic: {
      id: true,
      numeroExpediente: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true
    },
    full: {
      id: true,
      numeroExpediente: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      fechaNacimiento: true,
      genero: true,
      telefono: true,
      email: true
    }
  }
};

/**
 * Obtiene un select object seguro
 * @param {string} modelName - Nombre del modelo
 * @param {string} type - Tipo de select (basic, full, safe, etc.)
 * @returns {object} - Select object válido
 */
function getSafeSelect(modelName, type = 'basic') {
  const modelSelects = SAFE_SELECTS[modelName];
  
  if (!modelSelects) {
    throw new Error(`No hay selects seguros definidos para modelo '${modelName}'`);
  }
  
  const select = modelSelects[type];
  
  if (!select) {
    const availableTypes = Object.keys(modelSelects);
    throw new Error(
      `Tipo '${type}' no disponible para modelo '${modelName}'. ` +
      `Tipos disponibles: ${availableTypes.join(', ')}`
    );
  }
  
  return select;
}

/**
 * Middleware para validar selects en rutas
 */
function validateSelectMiddleware(modelName) {
  return (req, res, next) => {
    try {
      // Validar select si existe en el query
      if (req.query.select) {
        const selectFields = JSON.parse(req.query.select);
        req.validatedSelect = validateSelect(modelName, selectFields);
      }
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Error de validación de campos: ${error.message}`,
        type: 'SCHEMA_VALIDATION_ERROR'
      });
    }
  };
}

module.exports = {
  VALID_FIELDS,
  SAFE_SELECTS,
  validateSelect,
  getSafeSelect,
  validateSelectMiddleware
};