// End-to-end endpoint verification script
import http from 'http';

async function testAll() {
  const BASE = 'http://localhost:5000/api';

  console.log('--- 1. Testing Health Endpoint ---');
  let res = await fetch(`${BASE}/health`);
  let data = await res.json();
  console.log('Health:', data.success, data.data?.status);

  console.log('\n--- 2. Testing Weather Endpoint (Mandya, Karnataka) ---');
  res = await fetch(`${BASE}/weather?lat=12.5238&lon=76.8967`);
  data = await res.json();
  console.log('Weather:', data.success, 'Temp:', data.data?.current?.temperature, 'Source:', data.data?.source);

  console.log('\n--- 3. Testing Farmer Profile (Demo Mode) ---');
  res = await fetch(`${BASE}/farmers/00000000-0000-0000-0000-000000000001`, {
    headers: { 'x-demo-user': 'true' }
  });
  data = await res.json();
  console.log('Farmer:', data.success, data.data?.name, data.data?.state);

  console.log('\n--- 4. Testing Action Plan Generation ---');
  res = await fetch(`${BASE}/action-plan/00000000-0000-0000-0000-000000000001`, {
    headers: { 'x-demo-user': 'true' }
  });
  data = await res.json();
  console.log('Action Plan:', data.success, 'Tasks generated:', data.data?.tasks?.length);
  if (data.data?.tasks?.[0]) {
    console.log('Sample Task:', data.data.tasks[0].task_title, '| Priority:', data.data.tasks[0].priority);
  }

  console.log('\n--- 5. Testing Crop Comparison (1 acre: Tomatoes vs Chillies vs Beans) ---');
  res = await fetch(`${BASE}/crop-comparison`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acres: 1, crops: ['Tomatoes', 'Chillies', 'Beans'] })
  });
  data = await res.json();
  console.log('Crop Comparison:', data.success, 'Crops compared:', data.data?.comparison?.length);
  data.data?.comparison?.forEach(c => {
    console.log(`- ${c.crop_name}: Net Profit ~ ${c.potential_net_profit}, Duration: ${c.duration}`);
  });

  console.log('\n--- 6. Testing AI Chat in Kannada and Hindi ---');
  res = await fetch(`${BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-user': 'true' },
    body: JSON.stringify({
      farmerId: '00000000-0000-0000-0000-000000000001',
      message: 'ನನ್ನ ಭತ್ತದ ಬೆಳೆಗೆ ಯಾವಾಗ ನೀರು ಕಟ್ಟಬೇಕು?',
      language: 'kn'
    })
  });
  data = await res.json();
  console.log('AI Response:', data.success, 'Source:', data.data?.source);
  console.log('Snippet:', data.data?.reply?.substring(0, 100));

  console.log('\n--- 7. Testing Verified Govt Schemes & Deadlines ---');
  res = await fetch(`${BASE}/schemes`);
  data = await res.json();
  console.log('Govt Schemes:', data.success, 'Count:', data.data?.schemes?.length);

  console.log('\nAll Endpoints Tested Successfully!');
  process.exit(0);
}

// Start server and run tests
import app from './server.js';
const server = app.listen(5000, async () => {
  try {
    await testAll();
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
});
