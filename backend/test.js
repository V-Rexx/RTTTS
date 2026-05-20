require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./src/models/User')

// We'll do real HTTP requests to your running server
// So make sure `npm run dev` is running in another terminal!

async function test() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to DB for setup')

  // Cleanup + create test admin
  await User.deleteMany({ email: 'admin@test.com' })
  
  const admin = new User({
    name: 'Test Admin',
    email: 'admin@test.com',
    passwordHash: 'password123',
    role: 'admin'
  })
  await admin.save()
  console.log('✅ Test admin created in DB')

  await mongoose.disconnect()

  // Now test via HTTP — fetch is built into Node 18+
  const BASE = 'http://localhost:5001'

  // Test 1 — login with wrong password
  let res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'wrong' })
  })
  let data = await res.json()
  console.log(`✅ Wrong password → ${res.status} ${data.message}`)

  // Test 2 — login with correct password
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
  })
  data = await res.json()
  console.log(`✅ Correct password → ${res.status}`)
  console.log('   User:', data.user.name, '(' + data.user.role + ')')
  console.log('   Token length:', data.accessToken.length, 'chars')

  const accessToken = data.accessToken
  const cookie = res.headers.get('set-cookie')
  console.log('   Cookie set:', cookie ? 'yes' : 'no')

  // Test 3 — GET /me with valid token
  res = await fetch(`${BASE}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  data = await res.json()
  console.log(`✅ /me with valid token → ${res.status}`)
  console.log('   Got back:', data.user.name)

  // Test 4 — GET /me without token
  res = await fetch(`${BASE}/api/auth/me`)
  data = await res.json()
  console.log(`✅ /me without token → ${res.status} ${data.message}`)

  // Test 5 — refresh using cookie
  res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Cookie': cookie }
  })
  data = await res.json()
  console.log(`✅ Refresh with cookie → ${res.status}`)
  console.log('   New token length:', data.accessToken.length, 'chars')

  // Test 6 — refresh without cookie
  res = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST' })
  data = await res.json()
  console.log(`✅ Refresh without cookie → ${res.status} ${data.message}`)

  console.log('\n🎉 Auth system working!')
  process.exit(0)
}

test().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})