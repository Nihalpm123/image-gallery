const http = require('http');

const request = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: 5050,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING IMAGE GALLERY API VERIFICATION ---');
  
  try {
    // 1. Health check
    console.log('\nChecking health status...');
    const health = await request('GET', '/api/health');
    console.log(`Status: ${health.status}, Result:`, health.data);
    
    if (health.status !== 200 || health.data.status !== 'OK') {
      throw new Error('Health check failed!');
    }

    // 2. Public images list
    console.log('\nFetching images (public)...');
    const images = await request('GET', '/api/images');
    console.log(`Status: ${images.status}, Total images: ${Array.isArray(images.data) ? images.data.length : 'error'}`);
    
    // 3. Admin Login
    console.log('\nLogging in as Admin...');
    const loginRes = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`Status: ${loginRes.status}, Response:`, loginRes.data);
    
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error('Login failed!');
    }
    
    const token = loginRes.data.token;
    
    // 4. Session token verification
    console.log('\nVerifying session JWT token...');
    const verifyRes = await request('GET', '/api/auth/verify', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`Status: ${verifyRes.status}, Response:`, verifyRes.data);
    
    if (verifyRes.status !== 200 || !verifyRes.data.valid) {
      throw new Error('JWT token verification failed!');
    }
    
    console.log('\n--- ALL API INTEGRATION TESTS PASSED ---');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
};

runTests();
