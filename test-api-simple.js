// Simple API Test - Wait for server and test
const http = require('http');

function testEndpoint(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data, headers: res.headers });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('\n=== Testing API Endpoints ===\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  try {
    const result = await testEndpoint('/health');
    if (result.status === 200) {
      console.log('✅ Test 1: Health Check - PASSED (200)');
      console.log('   Response:', result.data.substring(0, 100));
      passed++;
    } else {
      console.log('❌ Test 1: Health Check - FAILED (Status:', result.status + ')');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 1: Health Check - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }

  // Test 2: Get Auth URL
  try {
    const result = await testEndpoint('/auth/google/url');
    if (result.status === 200) {
      const json = JSON.parse(result.data);
      console.log('✅ Test 2: Get Auth URL - PASSED (200)');
      console.log('   Has URL:', json.url ? 'Yes' : 'No');
      passed++;
    } else {
      console.log('❌ Test 2: Get Auth URL - FAILED (Status:', result.status + ')');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2: Get Auth URL - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }

  // Test 3: Get Events without token (should return 401)
  try {
    const result = await testEndpoint('/events');
    if (result.status === 401) {
      console.log('✅ Test 3: Get Events without token - PASSED (401 Unauthorized)');
      passed++;
    } else {
      console.log('❌ Test 3: Get Events without token - FAILED (Expected 401, got', result.status + ')');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 3: Get Events without token - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }

  // Test 4: Create Event without token (should return 401)
  try {
    const result = await testEndpoint('/events', 'POST', {
      sheetId: 'test-123',
      tabName: 'Test Tab',
      title: 'Test Event',
      startTime: '2025-02-01T08:00:00Z',
      endTime: '2025-02-01T10:00:00Z'
    });
    if (result.status === 401) {
      console.log('✅ Test 4: Create Event without token - PASSED (401 Unauthorized)');
      passed++;
    } else {
      console.log('❌ Test 4: Create Event without token - FAILED (Expected 401, got', result.status + ')');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4: Create Event without token - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }

  // Test 5: Get Events with invalid token (should return 401)
  try {
    const result = await testEndpoint('/events', 'GET', null, {
      'Authorization': 'Bearer invalid-token-12345'
    });
    if (result.status === 401) {
      console.log('✅ Test 5: Get Events with invalid token - PASSED (401 Unauthorized)');
      passed++;
    } else {
      console.log('❌ Test 5: Get Events with invalid token - FAILED (Expected 401, got', result.status + ')');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5: Get Events with invalid token - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }

  // Test 6: Refresh Token with invalid token
  try {
    const result = await testEndpoint('/auth/refresh', 'POST', {
      refreshToken: 'invalid-refresh-token-12345'
    });
    if (result.status === 400 || result.status === 401) {
      console.log('✅ Test 6: Refresh Token with invalid token - PASSED (Status:', result.status + ')');
      passed++;
    } else {
      console.log('⚠️  Test 6: Refresh Token - Got status', result.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 6: Refresh Token - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }

  console.log('\n=== Test Summary ===');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);
}

// Wait for server to start, then run tests
console.log('Waiting for server to start...');
setTimeout(() => {
  runAllTests().catch(console.error);
}, 8000);
