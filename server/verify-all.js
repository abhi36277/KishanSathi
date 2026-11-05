import app from './server.js';
import net from 'net';

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(true);
        else resolve(false);
      })
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port);
  });
}

async function runFullDiagnostics() {
  const port = 5000;
  const inUse = await isPortInUse(port);
  let server = null;

  if (!inUse) {
    server = app.listen(port);
    console.log(`Started internal test server on port ${port}...`);
  } else {
    console.log(`Detected existing running server on port ${port}. Running live tests against it...`);
  }

  const BASE = `http://localhost:${port}/api`;
  const results = [];

  const check = async (name, fn) => {
    try {
      const start = Date.now();
      const res = await fn();
      const duration = Date.now() - start;
      results.push({ name, status: 'PASS', duration: `${duration}ms`, details: res });
      console.log(`[PASS] ${name} (${duration}ms) -> ${res}`);
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
      console.error(`[FAIL] ${name}:`, err.message);
    }
  };

  console.log('\n=============================================');
  console.log('       KISANSATHI AI BACKEND DIAGNOSTICS      ');
  console.log('=============================================\n');

  // 1. Health check
  await check('1. Health Check Endpoint (/api/health)', async () => {
    const res = await fetch(`${BASE}/health`);
    const json = await res.json();
    if (!json.success || json.data.status !== 'healthy') throw new Error('Health check returned non-healthy');
    return `Status: ${json.data.status}, Integrations: ${JSON.stringify(json.data.integrations)}`;
  });

  // 2. Weather Service (Open-Meteo Proxy)
  await check('2. Weather Proxy (/api/weather)', async () => {
    const res = await fetch(`${BASE}/weather?lat=12.5238&lon=76.8967`);
    const json = await res.json();
    if (!json.success || !json.data.current) throw new Error('Weather data missing');
    return `Temp: ${json.data.current.temperature}°C, Condition: ${json.data.current.condition}, Source: ${json.data.source}`;
  });

  // 3. Farmer Profile (Demo Mode)
  await check('3. Farmer Profile Ownership (/api/farmers/:id)', async () => {
    const res = await fetch(`${BASE}/farmers/00000000-0000-0000-0000-000000000001`, {
      headers: { 'x-demo-user': 'true' }
    });
    const json = await res.json();
    if (!json.success || json.data.name !== 'Ramesh Gowda') throw new Error('Farmer profile mismatch');
    return `Farmer: ${json.data.name}, Location: ${json.data.district}, ${json.data.state}`;
  });

  // 4. Daily Action Plan Generation (Deterministic Rule Engine)
  let testTaskId = null;
  await check('4. Daily Action Plan Engine (/api/action-plan/:id)', async () => {
    const res = await fetch(`${BASE}/action-plan/00000000-0000-0000-0000-000000000001`, {
      headers: { 'x-demo-user': 'true' }
    });
    const json = await res.json();
    if (!json.success || !json.data.tasks || json.data.tasks.length === 0) throw new Error('Action plan tasks empty');
    testTaskId = json.data.tasks[0].id;
    return `Generated ${json.data.tasks.length} tasks for crop "${json.data.crop_name}" (${json.data.growth_stage})`;
  });

  // 5. Missed-Task Recovery & Adaptive Recalculation
  await check('5. Missed-Task Adaptive Recalculation (/api/action-plan/recover-missed)', async () => {
    if (!testTaskId) throw new Error('No task ID available from step 4');
    const res = await fetch(`${BASE}/action-plan/recover-missed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
      body: JSON.stringify({
        farmerId: '00000000-0000-0000-0000-000000000001',
        taskId: testTaskId,
        reason: 'Heavy unseasonal rain flooded the field paths',
        postponeDays: 2
      })
    });
    const json = await res.json();
    if (!json.success || !json.data.action) throw new Error('Recovery recalculation failed');
    return `Action: ${json.data.action}, New Date: ${json.data.newDueDate}`;
  });

  // 6. Multilingual Grounded AI (Kannada Query)
  await check('6. Grounded AI Chat Assistant (/api/ai/chat)', async () => {
    const res = await fetch(`${BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
      body: JSON.stringify({
        farmerId: '00000000-0000-0000-0000-000000000001',
        message: 'ನನ್ನ ಬೆಳೆಗೆ ಯೂರಿಯಾ ಯಾವಾಗ ಹಾಕಬೇಕು?',
        language: 'kn'
      })
    });
    const json = await res.json();
    if (!json.success || !json.data.reply) throw new Error('AI reply missing');
    return `Source: ${json.data.source}, Length: ${json.data.reply.length} chars`;
  });

  // 7. Pre-Planting Crop Comparison Tool
  await check('7. Pre-Planting Crop Comparison (/api/crop-comparison)', async () => {
    const res = await fetch(`${BASE}/crop-comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acres: 1, crops: ['Tomatoes', 'Chillies', 'Beans'] })
    });
    const json = await res.json();
    if (!json.success || json.data.comparison.length !== 3) throw new Error('Comparison failed');
    const summaries = json.data.comparison.map(c => `${c.crop_name}: ${c.potential_net_profit}`).join(' | ');
    return `Crops: ${summaries}`;
  });

  // 8. Farm Expense Voice Ledger
  await check('8. Farm Expense Ledger (/api/expenses)', async () => {
    const res = await fetch(`${BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
      body: JSON.stringify({
        farmerId: '00000000-0000-0000-0000-000000000001',
        transcript: 'bought 2 bags of urea for 850 rupees'
      })
    });
    const json = await res.json();
    if (!json.success || json.data.amount !== 850 || json.data.category !== 'fertilizer') {
      throw new Error('Expense parsing mismatch');
    }
    return `Amount: ₹${json.data.amount}, Category: ${json.data.category}`;
  });

  // 9. Verified Government Schemes
  await check('9. Govt Schemes Dataset (/api/schemes)', async () => {
    const res = await fetch(`${BASE}/schemes`);
    const json = await res.json();
    if (!json.success || json.data.schemes.length === 0) throw new Error('Schemes missing');
    return `Count: ${json.data.schemes.length} schemes verified`;
  });

  // 10. Transport Pooling
  await check('10. Transport Pooling Rides (/api/transport-pools)', async () => {
    const res = await fetch(`${BASE}/transport-pools`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error('Transport pool query failed');
    return `Active rides: ${json.data.length}`;
  });

  // 11. Farmer Community Forum
  await check('11. Farmer Community Forum (/api/community/posts)', async () => {
    const res = await fetch(`${BASE}/community/posts`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error('Community posts query failed');
    return `Posts: ${json.data.length}`;
  });

  console.log('\n=============================================');
  const allPass = results.every(r => r.status === 'PASS');
  console.log(`Diagnostic Summary: ${results.filter(r => r.status === 'PASS').length}/${results.length} Endpoints Operational`);
  console.log('=============================================\n');

  if (server) server.close();
  process.exit(allPass ? 0 : 1);
}

runFullDiagnostics().catch(err => {
  console.error('Fatal diagnostic crash:', err);
  process.exit(1);
});
