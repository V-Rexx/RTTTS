const Bus = require('../models/Bus')
const busManager = require('../utils/busManager')

const PERSIST_INTERVAL_MS = 30000

const lastPersisted = new Map()

const registerLocationEvents = (io, socket) => {

  socket.on('location-update', async ({ lat, lng, speed }) => {
    try {
      const user = socket.data.user
      if (!user) return 

      const busInfo = socket.data.bus
      if (!busInfo) return

      if (typeof lat !== 'number' || typeof lng !== 'number') return
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return

      busManager.setBus(busInfo._id, {
        _id: busInfo._id,
        busNumber: busInfo.busNumber,
        route: busInfo.route,
        city: busInfo.city,
        citySlug: busInfo.citySlug,
        lat,
        lng,
        speed: speed || 0,
        status: busInfo.status || 'active',
        isOnline: true,
        socketId: socket.id
      })

      io.to(busInfo.citySlug).emit('bus-location', {
        busId: busInfo._id,
        busNumber: busInfo.busNumber,
        route: busInfo.route,
        lat,
        lng,
        speed: speed || 0,
        status: busInfo.status || 'active',
        isOnline: true,
        lastUpdated: new Date()
      })

      const lastTime = lastPersisted.get(busInfo._id.toString()) || 0
      if (Date.now() - lastTime > PERSIST_INTERVAL_MS) {
        Bus.findByIdAndUpdate(busInfo._id, {
          currentLocation: { lat, lng },
          isOnline: true,
          lastUpdated: new Date(),
          status: busInfo.status || 'active'
        }).catch(err => console.error('DB persist failed:', err.message))

        lastPersisted.set(busInfo._id.toString(), Date.now())
      }

    } catch (err) {
      console.error('location-update error:', err.message)
    }
  })

  socket.on('subscribe-city', ({ citySlug }) => {
    if (!citySlug || typeof citySlug !== 'string') return
    const slug = citySlug.toLowerCase()
    socket.join(slug)

    const buses = busManager.getBusesByCity(slug)
    socket.emit('initial-state', { buses })
  })

  socket.on('unsubscribe-city', ({ citySlug }) => {
    if (!citySlug || typeof citySlug !== 'string') return
    socket.leave(citySlug.toLowerCase())
  })
}

module.exports = registerLocationEvents