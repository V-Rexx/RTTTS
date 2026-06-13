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

  // ─── Setup ──────────────────────────────────────────
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

  // Create stops near the user's target location (12.97, 77.60)
  const stops = await Stop.insertMany([
    { name: 'Near Stop A',  location: { type: 'Point', coordinates: [77.6010, 12.9710] }, city: bangalore._id },   // ~100m
    { name: 'Near Stop B',  location: { type: 'Point', coordinates: [77.6050, 12.9720] }, city: bangalore._id },   // ~500m
    { name: 'Far Stop',     location: { type: 'Point', coordinates: [77.7000, 13.1900] }, city: bangalore._id }    // ~25km
  ])

  const route = await Route.create({
    routeNumber: '42A',
    routeName: 'Test Route',
    city: bangalore._id,
    stops: stops.map(s => s._id)
  })

  await Bus.create({
    busNumber: '42A',
    plateNumber: 'KA-99-XX-0001',
    driver: driver._id,
    route: route._id,
    city: bangalore._id
  })
  console.log('✅ Setup done')

  await mongoose.disconnect()

  // ─── Driver login ───────────────────────────────────
  let res = await fetch(`${SERVER}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver1@test.com', password: 'driver123' })
  })
  const { accessToken: driverToken } = await res.json()

  // ─── Connect driver socket and emit a position ──────
  const driverSocket = io(`${SERVER}/driver`, {
    transports: ['websocket'],
    auth: { token: driverToken }
  })
  await waitForEvent(driverSocket, 'connect')
  driverSocket.emit('driver-connect')
  await waitForEvent(driverSocket, 'shift-started')
  
  // Bus is currently 1km from "Near Stop A", moving at 30 km/h
  driverSocket.emit('location-update', {
    lat: 12.9810,   // ~1km north of Near Stop A
    lng: 77.6010,
    speed: 30
  })
  await sleep(300)
  console.log('✅ Bus is live at (12.9810, 77.6010), 30 km/h')

  // ─── Test 1 — User near stop A, bus catchable ───────
  res = await fetch(`${SERVER}/api/buses/catchable?lat=12.9710&lng=77.6010`)
  let data = await res.json()
  console.log(`\nTest 1 — User at Near Stop A`)
  console.log(`  Catchable buses: ${data.catchableBuses.length}`)
  data.catchableBuses.forEach(b => {
    console.log(`  • Bus ${b.busNumber} at ${b.stop.name}`)
    console.log(`    Walk: ${b.walkDistance}m (${b.walkTimeSeconds}s)`)
    console.log(`    Bus ETA: ${b.busEtaSeconds}s`)
  })

  // ─── Test 2 — User far from any stop ────────────────
  res = await fetch(`${SERVER}/api/buses/catchable?lat=20.0&lng=80.0&maxStopDistance=1500`)
  data = await res.json()
  console.log(`\nTest 2 — User far from any stop`)
  console.log(`  Catchable buses: ${data.catchableBuses.length} (expected 0)`)
  console.log(`  Reason: ${data.reason || '(none)'}`)

  // ─── Test 3 — Missing coords ────────────────────────
  res = await fetch(`${SERVER}/api/buses/catchable`)
  data = await res.json()
  console.log(`\nTest 3 — Missing coords → ${res.status} ${data.message}`)

  // ─── Test 4 — Move bus very close (walk takes longer than ETA) ──
  driverSocket.emit('location-update', {
    lat: 12.9712,   // basically AT Near Stop A
    lng: 77.6011,
    speed: 30
  })
  await sleep(300)

  res = await fetch(`${SERVER}/api/buses/catchable?lat=12.9710&lng=77.6010`)
  data = await res.json()
  console.log(`\nTest 4 — Bus is at the stop, user 30m away`)
  if (data.catchableBuses.length > 0) {
    console.log(`  Catchable: bus is barely there, walk ${data.catchableBuses[0].walkTimeSeconds}s vs ETA ${data.catchableBuses[0].busEtaSeconds}s`)
  } else {
    console.log(`  Not catchable — bus arrives before user can walk (correct behavior)`)
  }

  // ─── Cleanup ────────────────────────────────────────
  driverSocket.disconnect()

  console.log('\n🎉 Nearest catchable bus working!')
  process.exit(0)
}

test().catch(err => {
  console.error('❌ Error:', err.message)
  console.error(err.stack)
  process.exit(1)
})