const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

async function runTests() {
  const endpoints = [
    '/health',
    '/api/employees/stats',
    '/api/rooms/stats',
    '/api/offices/stats'
  ];

  console.log('🧪 Testing API endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const result = await testEndpoint(endpoint);
      console.log(`✅ Status: ${result.status}`);
      console.log(`📄 Response:`, JSON.stringify(result.data, null, 2));
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
  }
}

runTests();