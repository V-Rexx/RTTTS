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

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

initSocketHandler(io)

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
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