require('dotenv').config()
const mongoose = require('mongoose')
const { io } = require('socket.io-client')
const User = require('./src/models/User')
const City = require('./src/models/City')
const Stop = require('./src/models/Stop')
const Route = require('./src/models/Route')
const Bus = require('./src/models/Bus')

const SERVER = 'http://localhost:5001'

const waitForEvent = (socket, event, timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${event}`)), timeoutMs)
    socket.once(event, (data) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function test() {
  await mongoose.connect(process.env.MONGO_URI)

  // Setup
  await Bus.deleteMany({})
  await Route.deleteMany({})
  await Stop.deleteMany({})
  await User.deleteMany({ email: 'driver1@test.com' })

  const bangalore = await City.findOne({ slug: 'bangalore' })

  const driver = new User({
    name: 'Test Driver',
    email: 'driver1@test.com',
    passwordHash: 'driver123',
    role: 'driver'
  })
  await driver.save()

  const stops = await Stop.insertMany([
    { name: 'Central Station', location: { type: 'Point', coordinates: [77.58, 12.97] }, city: bangalore._id },
    { name: 'MG Road',         location: { type: 'Point', coordinates: [77.60, 12.97] }, city: bangalore._id },
    { name: 'Indiranagar',     location: { type: 'Point', coordinates: [77.64, 12.97] }, city: bangalore._id },
    { name: 'Airport',         location: { type: 'Point', coordinates: [77.70, 13.19] }, city: bangalore._id }
  ])

  const route = await Route.create({
    routeNumber: '42A',
    routeName: 'Central → Airport Express',
    city: bangalore._id,
    stops: stops.map(s => s._id),
    color: '#FF6B6B'
  })

  await Bus.create({
    busNumber: '42A',
    plateNumber: 'KA-99-XX-0001',
    driver: driver._id,
    route: route._id,
    city: bangalore._id
  })

  await mongoose.disconnect()
  console.log('✅ Setup done')

  // Get a bus online for realism
  let res = await fetch(`${SERVER}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver1@test.com', password: 'driver123' })
  })
  const { accessToken: driverToken } = await res.json()

  const driverSocket = io(`${SERVER}/driver`, {
    transports: ['websocket'],
    auth: { token: driverToken }
  })
  await waitForEvent(driverSocket, 'connect')
  driverSocket.emit('driver-connect')
  await waitForEvent(driverSocket, 'shift-started')
  driverSocket.emit('location-update', { lat: 12.98, lng: 77.60, speed: 30 })
  await sleep(300)
  console.log('✅ Bus 42A is live\n')

  // ─── Test 1 — Context endpoint ──────────────────────
  console.log('Test 1 — GET context')
  res = await fetch(`${SERVER}/api/chat/context?citySlug=bangalore`)
  let data = await res.json()
  console.log(`  ${data.context.routes.length} routes, ${data.context.stops.length} stops, ${data.context.liveBuses.length} live buses\n`)

  // ─── Test 2 — Simple question about routes ──────────
  console.log('Test 2 — "What routes are available?"')
  res = await fetch(`${SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What routes are available in Bangalore?',
      citySlug: 'bangalore'
    })
  })
  data = await res.json()
  console.log(`  Response: ${data.response}`)
  if (data.action) console.log(`  Action: ${data.action.type} → ${data.action.target}`)
  console.log(`  Context used: ${JSON.stringify(data.contextUsed)}\n`)

  // ─── Test 3 — Question requiring the AI to recommend a route ──
  console.log('Test 3 — "How do I get to the airport?"')
  res = await fetch(`${SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'How do I get to the airport?',
      citySlug: 'bangalore'
    })
  })
  data = await res.json()
  console.log(`  Response: ${data.response}`)
  if (data.action) console.log(`  Action: ${data.action.type} → ${data.action.target}\n`)

  // ─── Test 4 — Multi-turn conversation ───────────────
  console.log('Test 4 — Multi-turn (with history)')
  res = await fetch(`${SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'How many stops does it have?',
      citySlug: 'bangalore',
      history: [
        { role: 'user', content: 'Tell me about route 42A' },
        { role: 'assistant', content: 'Route 42A runs from Central Station to Airport.' }
      ]
    })
  })
  data = await res.json()
  console.log(`  Response: ${data.response}\n`)

  // ─── Test 5 — Question it can't answer from data ────
  console.log('Test 5 — "What time does the last bus run?" (not in data)')
  res = await fetch(`${SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What time does the last bus run tonight?',
      citySlug: 'bangalore'
    })
  })
  data = await res.json()
  console.log(`  Response: ${data.response}\n`)

  // ─── Test 6 — Missing citySlug ──────────────────────
  res = await fetch(`${SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello' })
  })
  data = await res.json()
  console.log(`Test 6 — Missing citySlug → ${res.status} ${data.message}`)

  // ─── Test 7 — Invalid city ──────────────────────────
  res = await fetch(`${SERVER}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'hi',
      citySlug: 'atlantis'
    })
  })
  data = await res.json()
  console.log(`Test 7 — Non-existent city → ${res.status} ${data.message}`)

  driverSocket.disconnect()
  console.log('\n🎉 Chatbot working!')
  process.exit(0)
}

test().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})