#!/usr/bin/env node

/**
 * Script de verificación de schema para detectar automáticamente
 * posibles mismatches entre código y schema de Prisma
 */

const fs = require('fs');
const path = require('path');
const { VALID_FIELDS } = require('./schema-validator');

// Patrones peligrosos a buscar
const DANGEROUS_PATTERNS = [
  // Campos que no existen en el schema
  { pattern: /nombreComercial/g, model: 'proveedor', shouldBe: 'contactoNombre', file: 'any' },
  { pattern: /createdAt.*movimiento/gi, model: 'movimientoInventario', shouldBe: 'fechaMovimiento', file: 'inventory' },
  { pattern: /contacto:\s*p\.contacto/g, model: 'proveedor', shouldBe: 'remove this field', file: 'any' },
  
  // Campos obsoletos de usuarios
  { pattern: /password[^H]/gi, model: 'usuario', shouldBe: 'passwordHash', file: 'auth' },
  
  // Enums que pueden estar mal escritos
  { pattern: /especialidad.*medico/gi, model: 'usuario', shouldBe: 'medico_especialista or medico_residente', file: 'any' }
];

/**
 * Busca archivos de rutas
 */
function findRouteFiles() {
  const routesDir = path.join(__dirname, '../routes');
  const serverFiles = [
    path.join(__dirname, '../server-modular.js'),
    path.join(__dirname, '../server-prisma.js')
  ];
  
  const files = [];
  
  // Agregar archivos de rutas
  if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('.routes.js'))
      .map(file => path.join(routesDir, file));
    files.push(...routeFiles);
  }
  
  // Agregar archivos de servidor
  serverFiles.forEach(file => {
    if (fs.existsSync(file)) {
      files.push(file);
    }
  });
  
  return files;
}

/**
 * Analiza un archivo en busca de patrones peligrosos
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const issues = [];
  
  DANGEROUS_PATTERNS.forEach(({ pattern, model, shouldBe, file }) => {
    if (file !== 'any' && !fileName.includes(file)) {
      return; // Skip si no es el archivo correcto
    }
    
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Obtener línea donde ocurre el error
        const lines = content.split('\n');
        const lineIndex = lines.findIndex(line => line.includes(match));
        
        issues.push({
          file: fileName,
          line: lineIndex + 1,
          pattern: match,
          model,
          suggestion: shouldBe,
          severity: file === 'any' ? 'HIGH' : 'MEDIUM'
        });
      });
    }
  });
  
  return issues;
}

/**
 * Valida que los select objects contengan solo campos válidos
 */
function validateSelectStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const issues = [];
  
  // Buscar select statements
  const selectRegex = /select:\s*{[^}]+}/gi;
  const matches = content.match(selectRegex);
  
  if (matches) {
    matches.forEach(match => {
      // Extraer campos del select
      const fieldRegex = /(\w+):\s*true/g;
      let fieldMatch;
      const fields = [];
      
      while ((fieldMatch = fieldRegex.exec(match)) !== null) {
        fields.push(fieldMatch[1]);
      }
      
      // Determinar modelo basado en el contexto
      let model = null;
      if (match.includes('proveedor') || fileName.includes('inventory')) {
        model = 'proveedor';
      } else if (match.includes('paciente') || fileName.includes('patient')) {
        model = 'paciente';
      } else if (match.includes('usuario') || fileName.includes('auth')) {
        model = 'usuario';
      } else if (match.includes('producto') || fileName.includes('inventory')) {
        model = 'producto';
      }
      
      if (model && VALID_FIELDS[model]) {
        const invalidFields = fields.filter(field => !VALID_FIELDS[model][field]);
        
        if (invalidFields.length > 0) {
          const lineIndex = content.split('\n').findIndex(line => line.includes(match.substring(0, 20)));
          
          issues.push({
            file: fileName,
            line: lineIndex + 1,
            pattern: match,
            model,
            invalidFields,
            suggestion: `Campos válidos para ${model}: ${Object.keys(VALID_FIELDS[model]).join(', ')}`,
            severity: 'HIGH'
          });
        }
      }
    });
  }
  
  return issues;
}

/**
 * Ejecuta todas las validaciones
 */
function runValidations() {
  console.log('🔍 VERIFICACIÓN DE SCHEMA AUTOMÁTICA');
  console.log('=====================================\n');
  
  const files = findRouteFiles();
  let totalIssues = 0;
  let highSeverityIssues = 0;
  
  console.log(`📂 Analizando ${files.length} archivos...\n`);
  
  files.forEach(file => {
    console.log(`📄 ${path.basename(file)}`);
    
    // Analizar patrones peligrosos
    const patternIssues = analyzeFile(file);
    
    // Analizar select statements
    const selectIssues = validateSelectStatements(file);
    
    const allIssues = [...patternIssues, ...selectIssues];
    totalIssues += allIssues.length;
    
    if (allIssues.length === 0) {
      console.log('  ✅ Sin problemas detectados\n');
    } else {
      allIssues.forEach(issue => {
        const severityIcon = issue.severity === 'HIGH' ? '🚨' : '⚠️';
        if (issue.severity === 'HIGH') highSeverityIssues++;
        
        console.log(`  ${severityIcon} Línea ${issue.line}: ${issue.pattern}`);
        console.log(`     Modelo: ${issue.model}`);
        console.log(`     Sugerencia: ${issue.suggestion}`);
        
        if (issue.invalidFields) {
          console.log(`     Campos inválidos: ${issue.invalidFields.join(', ')}`);
        }
        
        console.log('');
      });
    }
  });
  
  console.log('=====================================');
  console.log(`📊 RESUMEN DE VALIDACIÓN:`);
  console.log(`   Total de problemas: ${totalIssues}`);
  console.log(`   Severidad alta: ${highSeverityIssues}`);
  console.log(`   Severidad media: ${totalIssues - highSeverityIssues}`);
  
  if (totalIssues === 0) {
    console.log('✅ ¡TODO CORRECTO! No se encontraron problemas de schema.');
  } else if (highSeverityIssues > 0) {
    console.log('🚨 ACCIÓN REQUERIDA: Se encontraron problemas críticos.');
    process.exit(1);
  } else {
    console.log('⚠️  Se encontraron advertencias menores.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runValidations();
}

module.exports = {
  runValidations,
  analyzeFile,
  validateSelectStatements,
  DANGEROUS_PATTERNS
};