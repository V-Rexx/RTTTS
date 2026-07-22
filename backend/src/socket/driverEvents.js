const Bus = require('../models/Bus')
const busManager = require('../utils/busManager')

const registerDriverEvents = (io, socket) => {

  socket.on('driver-connect', async () => {
    try {
      const user = socket.data.user
      if (!user) return socket.emit('error', { message: 'Not authenticated' })

      const bus = await Bus.findOne({ driver: user._id })
        .populate('city', 'slug name')
        .populate('route', 'routeNumber color')

      if (!bus) {
        return socket.emit('error', { message: 'No bus assigned' })
      }

      socket.data.bus = {
        _id: bus._id,
        busNumber: bus.busNumber,
        route: bus.route?._id,
        routeNumber: bus.route?.routeNumber,
        city: bus.city._id,
        citySlug: bus.city.slug,
        status: 'active'
      }

      bus.status = 'active'
      bus.isOnline = true
      bus.lastUpdated = new Date()
      // Clear any position from a previous shift — it's stale until this
      // shift's first real GPS fix POSTs to /api/buses/location. Without
      // this, a bus with prior location history would briefly show its old
      // spot to passengers instead of correctly staying hidden until located.
      bus.currentLocation = { lat: null, lng: null }
      await bus.save()

      io.to(bus.city.slug).emit('bus-online', {
        busId: bus._id,
        busNumber: bus.busNumber,
        route: bus.route?._id,
        driverName: user.name
      })

      socket.emit('shift-started', {
        bus: {
          _id: bus._id,
          busNumber: bus.busNumber,
          route: bus.route,
          city: bus.city
        }
      })

    } catch (err) {
      console.error('driver-connect error:', err.message)
      socket.emit('error', { message: 'Failed to start shift' })
    }
  })

  socket.on('driver-disconnect', async () => {
    await markBusOffline(io, socket)
  })

  socket.on('bus-breakdown', async ({ message }) => {
    try {
      const busInfo = socket.data.bus
      if (!busInfo) return

      await Bus.findByIdAndUpdate(busInfo._id, { status: 'breakdown' })

      const cached = busManager.getBus(busInfo._id)
      if (cached) {
        busManager.setBus(busInfo._id, { ...cached, status: 'breakdown' })
      }

      io.to(busInfo.citySlug).emit('bus-breakdown', {
        busId: busInfo._id,
        busNumber: busInfo.busNumber,
        message: message || 'Bus reported as broken down'
      })

      socket.data.bus.status = 'breakdown'

    } catch (err) {
      console.error('bus-breakdown error:', err.message)
    }
  })

  socket.on('disconnect', async () => {
    await markBusOffline(io, socket)
  })
}

const markBusOffline = async (io, socket) => {
  try {
    const busInfo = socket.data.bus
    if (!busInfo) return

    busManager.removeBus(busInfo._id)

    await Bus.findByIdAndUpdate(busInfo._id, {
      isOnline: false,
      status: 'inactive'
    })

    io.to(busInfo.citySlug).emit('bus-offline', {
      busId: busInfo._id,
      busNumber: busInfo.busNumber
    })

  } catch (err) {
    console.error('markBusOffline error:', err.message)
  }
}

module.exports = registerDriverEvents