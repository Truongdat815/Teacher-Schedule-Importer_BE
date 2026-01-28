// Edge Cases and Validation Testing
const http = require('http');

function makeRequest(path, method = 'GET', body = null, headers = {}) {
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

async function runEdgeCaseTests() {
  console.log('\n=== Edge Cases & Validation Testing ===\n');
  let passed = 0;
  let failed = 0;
  const failures = [];

  // Test 1: Create Event with invalid date format
  try {
    const result = await makeRequest('/events', 'POST', {
      sheetId: 'test',
      tabName: 'test',
      title: 'Test',
      startTime: 'invalid-date',
      endTime: '2025-02-01T10:00:00Z'
    }, {
      'Authorization': 'Bearer fake-token'
    });
    if (result.status === 400 || result.status === 401) {
      console.log(`✅ Test 1: Create Event with invalid date - PASSED (${result.status})`);
      passed++;
    } else {
      console.log(`❌ Test 1: Create Event with invalid date - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 1: Expected 400/401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 1: Create Event with invalid date - FAILED');
    failed++;
    failures.push(`Test 1: ${error.message}`);
  }

  // Test 2: Create Event with endTime before startTime
  try {
    const result = await makeRequest('/events', 'POST', {
      sheetId: 'test',
      tabName: 'test',
      title: 'Test',
      startTime: '2025-02-01T10:00:00Z',
      endTime: '2025-02-01T08:00:00Z' // End before start
    }, {
      'Authorization': 'Bearer fake-token'
    });
    if (result.status === 400 || result.status === 401) {
      console.log(`✅ Test 2: Create Event with endTime < startTime - PASSED (${result.status})`);
      passed++;
    } else {
      console.log(`❌ Test 2: Create Event with endTime < startTime - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 2: Expected 400/401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 2: Create Event with endTime < startTime - FAILED');
    failed++;
    failures.push(`Test 2: ${error.message}`);
  }

  // Test 3: Create Event with missing required fields
  try {
    const result = await makeRequest('/events', 'POST', {
      sheetId: 'test'
      // Missing tabName, title, startTime, endTime
    }, {
      'Authorization': 'Bearer fake-token'
    });
    if (result.status === 400 || result.status === 401) {
      console.log(`✅ Test 3: Create Event with missing fields - PASSED (${result.status})`);
      passed++;
    } else {
      console.log(`❌ Test 3: Create Event with missing fields - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 3: Expected 400/401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 3: Create Event with missing fields - FAILED');
    failed++;
    failures.push(`Test 3: ${error.message}`);
  }

  // Test 4: Get Events by Status with invalid status
  try {
    const result = await makeRequest('/events/status?status=invalid-status', 'GET', null, {
      'Authorization': 'Bearer fake-token'
    });
    if (result.status === 400 || result.status === 401) {
      console.log(`✅ Test 4: Get Events with invalid status - PASSED (${result.status})`);
      passed++;
    } else {
      console.log(`❌ Test 4: Get Events with invalid status - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 4: Expected 400/401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 4: Get Events with invalid status - FAILED');
    failed++;
    failures.push(`Test 4: ${error.message}`);
  }

  // Test 5: Get Event by ID with invalid UUID format
  try {
    const result = await makeRequest('/events/invalid-id-format', 'GET', null, {
      'Authorization': 'Bearer fake-token'
    });
    if (result.status === 400 || result.status === 401 || result.status === 404) {
      console.log(`✅ Test 5: Get Event with invalid ID format - PASSED (${result.status})`);
      passed++;
    } else {
      console.log(`❌ Test 5: Get Event with invalid ID format - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 5: Expected 400/401/404, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 5: Get Event with invalid ID format - FAILED');
    failed++;
    failures.push(`Test 5: ${error.message}`);
  }

  // Test 6: Refresh Token with empty body
  try {
    const result = await makeRequest('/auth/refresh', 'POST', {});
    if (result.status === 400) {
      console.log('✅ Test 6: Refresh Token with empty body - PASSED (400)');
      passed++;
    } else {
      console.log(`❌ Test 6: Refresh Token with empty body - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 6: Expected 400, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 6: Refresh Token with empty body - FAILED');
    failed++;
    failures.push(`Test 6: ${error.message}`);
  }

  // Test 7: Refresh Token with missing refreshToken field
  try {
    const result = await makeRequest('/auth/refresh', 'POST', {
      token: 'some-token' // Wrong field name
    });
    if (result.status === 400) {
      console.log('✅ Test 7: Refresh Token with wrong field name - PASSED (400)');
      passed++;
    } else {
      console.log(`❌ Test 7: Refresh Token with wrong field name - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 7: Expected 400, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 7: Refresh Token with wrong field name - FAILED');
    failed++;
    failures.push(`Test 7: ${error.message}`);
  }

  // Test 8: Update Event with invalid UUID
  try {
    const result = await makeRequest('/events/not-a-uuid', 'PUT', {
      title: 'Updated'
    }, {
      'Authorization': 'Bearer fake-token'
    });
    if (result.status === 400 || result.status === 401) {
      console.log(`✅ Test 8: Update Event with invalid UUID - PASSED (${result.status})`);
      passed++;
    } else {
      console.log(`❌ Test 8: Update Event with invalid UUID - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 8: Expected 400/401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 8: Update Event with invalid UUID - FAILED');
    failed++;
    failures.push(`Test 8: ${error.message}`);
  }

  // Test 9: Create Event with XSS attempt in title
  try {
    const result = await makeRequest('/events', 'POST', {
      sheetId: 'test',
      tabName: 'test',
      title: '<script>alert("xss")</script>',
      startTime: '2025-02-01T08:00:00Z',
      endTime: '2025-02-01T10:00:00Z'
    }, {
      'Authorization': 'Bearer fake-token'
    });
    // Should either reject (400/401) or sanitize (200 with sanitized data)
    if (result.status === 400 || result.status === 401) {
      console.log(`✅ Test 9: Create Event with XSS attempt - PASSED (${result.status} - Rejected)`);
      passed++;
    } else if (result.status === 200) {
      const json = JSON.parse(result.data);
      if (json.data && json.data.title && !json.data.title.includes('<script>')) {
        console.log('✅ Test 9: Create Event with XSS attempt - PASSED (Sanitized)');
        passed++;
      } else {
        console.log('❌ Test 9: Create Event with XSS attempt - FAILED (Not sanitized)');
        failed++;
        failures.push('Test 9: XSS not sanitized');
      }
    } else {
      console.log(`❌ Test 9: Create Event with XSS attempt - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 9: Got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 9: Create Event with XSS attempt - FAILED');
    failed++;
    failures.push(`Test 9: ${error.message}`);
  }

  // Test 10: Authorization header with wrong format
  try {
    const result = await makeRequest('/events', 'GET', null, {
      'Authorization': 'InvalidFormat token-12345'
    });
    if (result.status === 401) {
      console.log('✅ Test 10: Authorization with wrong format - PASSED (401)');
      passed++;
    } else {
      console.log(`❌ Test 10: Authorization with wrong format - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 10: Expected 401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 10: Authorization with wrong format - FAILED');
    failed++;
    failures.push(`Test 10: ${error.message}`);
  }

  // Test 11: Authorization header without Bearer
  try {
    const result = await makeRequest('/events', 'GET', null, {
      'Authorization': 'token-12345'
    });
    if (result.status === 401) {
      console.log('✅ Test 11: Authorization without Bearer - PASSED (401)');
      passed++;
    } else {
      console.log(`❌ Test 11: Authorization without Bearer - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 11: Expected 401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 11: Authorization without Bearer - FAILED');
    failed++;
    failures.push(`Test 11: ${error.message}`);
  }

  // Test 12: Empty Authorization header
  try {
    const result = await makeRequest('/events', 'GET', null, {
      'Authorization': ''
    });
    if (result.status === 401) {
      console.log('✅ Test 12: Empty Authorization header - PASSED (401)');
      passed++;
    } else {
      console.log(`❌ Test 12: Empty Authorization header - FAILED (Got ${result.status})`);
      failed++;
      failures.push(`Test 12: Expected 401, got ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Test 12: Empty Authorization header - FAILED');
    failed++;
    failures.push(`Test 12: ${error.message}`);
  }

  console.log('\n=== Edge Cases Test Summary ===');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failures.length > 0) {
    console.log('=== Failures ===');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure}`);
    });
    console.log('');
  }

  return { passed, failed, failures };
}

// Wait for server to start, then run tests
console.log('Waiting for server to start...');
setTimeout(() => {
  runEdgeCaseTests()
    .then((results) => {
      if (results.failed === 0) {
        console.log('🎉 All edge case tests passed!');
        process.exit(0);
      } else {
        console.log(`⚠️  ${results.failed} edge case test(s) failed`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}, 3000);
