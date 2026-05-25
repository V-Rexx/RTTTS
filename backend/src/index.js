// Load environment variables FIRST
require('dotenv').config()

// Core Node module
const http = require('http')

// Installed packages
const express = require('express')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')

// ─── Import routes ──────────────────────────────────────
const authRoutes = require('./routes/auth')
const cityRoutes = require('./routes/cities')
const stopRoutes = require('./routes/stops')
const routeRoutes = require('./routes/routes')
const busRoutes = require('./routes/buses')
const chatRoutes = require('./routes/chat')

// Create Express app
const app = express()

// Create HTTP server wrapping Express
const server = http.createServer(app)

// Attach Socket.io to the same HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Initialize Socket.io Event handlers
const setupSocket = require('./socket/socketHandler');
setupSocket(io);

// ─── Express middleware ─────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/cities', cityRoutes)
app.use('/api/stops', stopRoutes)
app.use('/api/routes', routeRoutes)
app.use('/api/buses', busRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CityTrack server is running',
    time: new Date().toISOString()
  })
})

// ─── Connect MongoDB, then start server ─────────────────
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citytrack';
mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB connected')

    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📍 Health check: http://localhost:${PORT}/health`)
      console.log(`🔐 Auth API:    http://localhost:${PORT}/api/auth/login`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })

// Export io for other files to use later
module.exports = { io }