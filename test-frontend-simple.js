const http = require('http');

// Función simple para probar el frontend
console.log('🧪 Probando frontend en http://localhost:3000...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Frontend respondiendo correctamente');
      console.log(`📏 Tamaño respuesta: ${data.length} caracteres`);
      
      if (data.includes('Sistema de Gestión Hospitalaria') || data.includes('Hospital') || data.includes('root')) {
        console.log('🏥 Contenido del hospital detectado');
        console.log('🎯 FRONTEND FUNCIONAL ✅');
      } else {
        console.log('⚠️  Contenido inesperado');
        console.log('📄 Primeros 200 caracteres:', data.substring(0, 200));
      }
    } else {
      console.log(`❌ Error HTTP: ${res.statusCode}`);
      console.log('📄 Respuesta:', data);
    }
  });
});

req.on('error', (err) => {
  console.log(`❌ Error de conexión: ${err.code}`);
  console.log('🔧 Asegúrate de que Vite esté ejecutándose');
});

req.on('timeout', () => {
  req.destroy();
  console.log('❌ Timeout de conexión');
});

req.end();