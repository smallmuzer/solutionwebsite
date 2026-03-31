// Test full auth flow
const BASE = 'http://localhost:3001';

// 1. Login
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@solutions.com.mv', password: 'Admin@1234' })
});
const loginJson = await loginRes.json();
console.log('=== LOGIN RESPONSE ===');
console.log(JSON.stringify(loginJson, null, 2));

const token = loginJson.data?.session?.access_token;
const userId = loginJson.data?.session?.user?.id;
console.log('\ntoken:', token);
console.log('userId:', userId);

// 2. Session check
if (token) {
  const sessRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const sessJson = await sessRes.json();
  console.log('\n=== SESSION CHECK ===');
  console.log(JSON.stringify(sessJson, null, 2));
}

// 3. Role check — what AdminLogin does after login
if (userId) {
  const roleRes = await fetch(`${BASE}/api/db/users?id=${userId}&userrole=admin`);
  const roleJson = await roleRes.json();
  console.log('\n=== ROLE CHECK (id + userrole filter) ===');
  console.log(JSON.stringify(roleJson, null, 2));
}

// 4. Wrong password
const badRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@solutions.com.mv', password: 'wrongpass' })
});
const badJson = await badRes.json();
console.log('\n=== WRONG PASSWORD ===');
console.log(JSON.stringify(badJson, null, 2));
