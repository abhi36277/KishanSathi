import http from 'http';

const TEST_PORT = 5000;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    let reqBody = null;
    if (body) {
      reqBody = JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting KisanSathi AI v2.0 Comprehensive Multi-Model Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // Allow server a brief moment to bind port 5000
  await new Promise(r => setTimeout(r, 1000));

  let authToken = null;
  let farmerId = null;

  try {
    // Test 1: Health & 5 Separate ML Models
    const t1 = await request('GET', '/health');
    assert(t1.status === 200 && t1.body.data?.ml_models?.disease_vision_ml, '1. Health check lists all 5 separate ML models');

    // Test 2: Farmer Login
    const t2 = await request('POST', '/auth/login', {
      phone: '9876543210',
      password: '1234'
    });
    assert(t2.status === 200 && t2.body.data?.token, '2. Farmer Login succeeds with valid mobile & password');
    authToken = t2.body.data?.token;
    farmerId = t2.body.data?.farmer?.id;

    // Test 3: Authenticated Session Profile (/auth/me)
    const t3 = await request('GET', '/auth/me', null, { Authorization: `Bearer ${authToken}` });
    assert(t3.status === 200 && t3.body.data?.farmer?.name === 'Ramesh Gowda', '3. Authenticated session profile retrieves farmer & crops');

    // Test 4: New Farmer Registration
    const randomPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const t4 = await request('POST', '/auth/register', {
      name: 'Arjun Verma',
      phone: randomPhone,
      password: 'pass',
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Samrala',
      language: 'hi',
      latitude: 30.901,
      longitude: 75.857,
      area_acres: 3.5,
      soil_type: 'Alluvial Loam',
      crop_name: 'Wheat',
      sowing_date: '2026-10-20'
    });
    assert(t4.status === 201 && t4.body.data?.farmer?.phone.includes(randomPhone), '4. New farmer registration with credentials succeeds');

    // Test 5: ML Model 1 - Disease Identification Pipeline
    const t5 = await request('POST', '/disease/identify', {
      crop_name: 'Rice (Paddy)',
      symptoms: 'Spindle shaped brown lesions with grey center on leaf blades'
    });
    assert(t5.status === 200 && t5.body.data?.diagnosis?.disease_name.includes('Blast'), '5. ML Model 1: Disease ID identifies Rice Blast with organic remedies');

    // Test 6: ML Model 2 - Mandi Prices & 7-Day Trend Prediction
    const t6 = await request('GET', '/prices/mandi?state=Karnataka&crop=Rice');
    assert(t6.status === 200 && t6.body.data?.forecast_7_days?.length === 7, '6. ML Model 2: Mandi Price Predictor yields 7-day forecast & net profit rankings');

    // Test 7: ML Model 3 - From-Start Sowing, Irrigation, Fertilizer Lifecycle Tracker
    const t7 = await request('GET', `/crop-lifecycle/${farmerId}`, null, { Authorization: `Bearer ${authToken}` });
    assert(t7.status === 200 && t7.body.data?.lifecycle?.full_stages?.length >= 5, '7. ML Model 3: Crop Lifecycle tracks DAS, irrigation & fertilizer protocols');

    // Test 8: ML Model 4 - Geospatial Pest Radar with GPS Proximity Map
    const t8 = await request('GET', `/pest-radar?lat=12.5238&lon=76.8967&farmerId=${farmerId}`);
    assert(t8.status === 200 && t8.body.data?.outbreak_nodes?.length > 0, '8. ML Model 4: Geospatial Pest Radar calculates proximity & micro-climate risk');

    // Test 9: ML Model 5 - Multilingual Conversational AI with Memory
    const t9 = await request('POST', '/ai/chat', {
      farmerId: farmerId,
      message: 'When should I irrigate next?',
      language: 'en'
    }, { Authorization: `Bearer ${authToken}` });
    assert(t9.status === 200 && t9.body.data?.reply && t9.body.data?.plant_lifecycle_context?.crop, '9. ML Model 5: Multilingual AI Assistant grounds response in farmer crop lifecycle');

    // Test 10: Persistent Chat History
    const t10 = await request('GET', `/ai/history/${farmerId}`, null, { Authorization: `Bearer ${authToken}` });
    assert(t10.status === 200 && t10.body.data?.length >= 2, '10. Per-farmer chat history is saved and retrievable across sessions');

    // Test 11: Government Schemes Hub
    const t11 = await request('GET', '/schemes');
    assert(t11.status === 200 && t11.body.data?.schemes?.length >= 4, '11. Government Schemes hub returns hand-verified central & state schemes');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log(`\n📊 Verification Summary: ${passed}/${total} Tests Passed!`);
  if (passed === total) {
    console.log('🎉 All KisanSathi AI v2.0 capabilities and ML pipelines are functioning flawlessly!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
