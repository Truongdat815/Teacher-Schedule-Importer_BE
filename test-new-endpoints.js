/**
 * Test New Sheets & Calendar Endpoints
 * 
 * Tests the refactored endpoints:
 * - POST /api/sheets/preview
 * - POST /api/calendar/sync
 */

const http = require('http');

// Sample JWT token (you need to get a real one from /api/auth/google/callback)
const JWT_TOKEN = 'your-actual-jwt-token-here';

// Sample row data from Google Sheets
const sampleRowData = {
  'A': 'SP123456',  // Topic Code
  'B': 'GSP123345', // Group Code
  'C': 'AI Chatbot Implementation',  // Topic Name EN
  'D': 'Xây dựng chatbot AI',  // Topic Name VI
  'E': 'Dr. Nguyen Van A',  // Mentor
  'F': 'Dr. Le Thi B',  // Mentor 1
  'G': 'Dr. Tran Van C',  // Mentor 2
  // REVIEW 1 Stage (columns H-N)
  'H': '1/22/2026',  // Review 1 Date
  'I': '1',  // Review 1 Slot
  'J': 'Room 101',  // Review 1 Room
  'K': 'REV001',  // Review 1 Reviewer
  'L': 'COUNCIL1',  // Review 1 Council
  'M': 'No conflicts',  // Review 1 Conflicts
  'N': 'Pass',  // Review 1 Result
  // REVIEW 2 Stage (columns O-U)
  'O': '1/29/2026',
  'P': '2',
  'Q': 'Room 102',
  'R': 'REV002',
  'S': 'COUNCIL1',
  'T': 'No conflicts',
  'U': 'Pass',
  // ... add more stages as needed
};

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing New Sheets & Calendar Endpoints\n');

  try {
    // Test 1: Health Check
    console.log('Test 1: Health Check');
    const healthRes = await makeRequest('GET', '/api/health');
    console.log(`Status: ${healthRes.status}`);
    console.log(`Response: ${JSON.stringify(healthRes.body, null, 2)}\n`);

    // Test 2: Preview Sheet Row (requires auth)
    console.log('Test 2: Preview Sheet Row');
    if (JWT_TOKEN === 'your-actual-jwt-token-here') {
      console.log('⚠️  Skipping - Need valid JWT token first');
      console.log('   Get a token from: http://localhost:5000/api/auth/google/url\n');
    } else {
      const previewRes = await makeRequest('POST', '/api/sheets/preview', {
        sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        tabName: 'Capstone 2026',
        rowNumber: 4,
        rowData: sampleRowData,
      });
      console.log(`Status: ${previewRes.status}`);
      console.log(`Response: ${JSON.stringify(previewRes.body, null, 2)}\n`);
    }

    // Test 3: Sync Sheet to Calendar (requires auth)
    console.log('Test 3: Sync Sheet to Calendar');
    if (JWT_TOKEN === 'your-actual-jwt-token-here') {
      console.log('⚠️  Skipping - Need valid JWT token first\n');
    } else {
      const syncRes = await makeRequest('POST', '/api/calendar/sync', {
        sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        tabName: 'Capstone 2026',
        rowNumber: 4,
        rowData: sampleRowData,
        syncOptions: {
          syncAllStages: true,
          overwriteExisting: false,
        },
      });
      console.log(`Status: ${syncRes.status}`);
      console.log(`Response: ${JSON.stringify(syncRes.body, null, 2)}\n`);
    }

    console.log('✅ Tests complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Get OAuth token: http://localhost:5000/api/auth/google/url');
    console.log('2. Copy the access token from the response');
    console.log('3. Update JWT_TOKEN in this test file');
    console.log('4. Run this test again with the real token');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run tests
runTests();
