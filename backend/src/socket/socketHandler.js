const socketAuthMiddleware = require('../middleware/socketAuthMiddleware')
const registerDriverEvents = require('./driverEvents')
const registerLocationEvents = require('./locationEvents')
const busManager = require('../utils/busManager')
const Bus = require('../models/Bus')

const initSocketHandler = (io) => {

  const driverNs = io.of('/driver')
  driverNs.use(socketAuthMiddleware)

  driverNs.on('connection', (socket) => {
    console.log(`Driver connected: ${socket.data.user.name} (${socket.id})`)

    registerDriverEvents(io, socket)
    registerLocationEvents(io, socket)
  })

  io.on('connection', (socket) => {
    console.log(`Passenger connected: ${socket.id}`)

    socket.on('subscribe-city', ({ citySlug }) => {
      if (!citySlug || typeof citySlug !== 'string') return
      const slug = citySlug.toLowerCase()
      socket.join(slug)
      const buses = busManager.getBusesByCity(slug)
      socket.emit('initial-state', { buses })
    })

    socket.on('unsubscribe-city', ({ citySlug }) => {
      if (citySlug) socket.leave(citySlug.toLowerCase())
    })

    socket.on('disconnect', () => {
    
    })
  })

  
  setInterval(async () => {
    const STALE_TIMEOUT_MS = 30000   
    const stale = busManager.findStaleBuses(STALE_TIMEOUT_MS)

    for (const busId of stale) {
      const cached = busManager.getBus(busId)
      if (!cached) continue

      busManager.removeBus(busId)

      try {
        await Bus.findByIdAndUpdate(busId, {
          isOnline: false,
          status: 'inactive'
        })
      } catch (err) {
        console.error('Stale bus DB update failed:', err.message)
      }

      if (cached.citySlug) {
        io.to(cached.citySlug).emit('bus-offline', {
          busId,
          busNumber: cached.busNumber
        })
      }
    }
  }, 10000)

  console.log('Socket.io initialized — /driver (auth) + / (passenger)')
}

module.exports = initSocketHandler