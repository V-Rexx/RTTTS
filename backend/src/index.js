require('dotenv').config()

const http = require('http')

const express = require('express')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth')
const cityRoutes = require('./routes/cities')
const stopRoutes = require('./routes/stops')
const routeRoutes = require('./routes/routes')
const busRoutes = require('./routes/buses')
const chatRoutes = require('./routes/chat')
const initSocketHandler = require('./socket/socketHandler')

const app = express()

const server = http.createServer(app)

// CLIENT_URLS accepts a comma-separated list so both the local dev origin
// and a deployed frontend (or several Vercel preview URLs) can be allowed
// at once. Falls back to CLIENT_URL (single value) for backward compat.
// If neither is set, all origins are allowed — fine for local dev, but set
// one of these in production since credentialed CORS can't use '*'.
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true) // non-browser requests (curl, health checks)
  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return callback(null, true)
  }
  callback(new Error(`Origin ${origin} not allowed by CORS`))
}

const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

initSocketHandler(io)

app.use(cors({
  origin: corsOriginCheck,
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/cities', cityRoutes)
app.use('/api/stops', stopRoutes)
app.use('/api/routes', routeRoutes)
app.use('/api/buses', busRoutes)
app.use('/api/chat', chatRoutes)

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CityTrack server is running',
    time: new Date().toISOString()
  })
})

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citytrack';
mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected')

    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
      console.log(`Auth API:    http://localhost:${PORT}/api/auth/login`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })

module.exports = { io }