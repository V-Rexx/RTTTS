require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const City = require('../models/City')

const ADMIN_CONFIG = {
  name: 'CityTrack Admin',
  email: 'admin@citytrack.com',
  password: 'admin123',
  role: 'admin'
}

const CITIES = [
  { name: 'Bangalore', slug: 'bangalore', center: { lat: 12.9716, lng: 77.5946 }, zoom: 12 },
  { name: 'Mumbai',    slug: 'mumbai',    center: { lat: 19.0760, lng: 72.8777 }, zoom: 11 },
  { name: 'Jorhat',    slug: 'jorhat',    center: { lat: 26.7509, lng: 94.2037 }, zoom: 13 }
]

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected')

    const existingAdmin = await User.findOne({ email: ADMIN_CONFIG.email })
    if (existingAdmin) {
      console.log('Admin already exists — skipping')
    } else {
      const admin = new User({
        name: ADMIN_CONFIG.name,
        email: ADMIN_CONFIG.email,
        passwordHash: ADMIN_CONFIG.password,
        role: ADMIN_CONFIG.role
      })
      await admin.save()
      console.log('Admin created:', ADMIN_CONFIG.email)
    }

    // ─── 2. Cities ──────────────────────────────────────
    const cityCount = await City.countDocuments()
    if (cityCount > 0) {
      console.log(`${cityCount} cities already exist — skipping`)
    } else {
      await City.insertMany(CITIES)
      console.log(`Seeded ${CITIES.length} cities: ${CITIES.map(c => c.name).join(', ')}`)
    }

    console.log('')
    console.log('Seed complete!')

  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()