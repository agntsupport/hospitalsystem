const http = require('http');

const testFrontend = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`Frontend Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response length: ${data.length} characters`);
        if (data.includes('Hospital') || data.includes('vite') || data.includes('html')) {
          console.log('✅ Frontend responding correctly');
        } else {
          console.log('❌ Frontend not serving expected content');
        }
        resolve({ status: res.statusCode, length: data.length });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Frontend connection error: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Frontend connection timeout');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

testFrontend().catch(console.error);