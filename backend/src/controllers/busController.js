const Bus = require('../models/Bus')
const Route = require('../models/Route')
const City = require('../models/City')
const User = require('../models/User')
const Stop = require('../models/Stop')
const mongoose = require('mongoose')
const busManager = require('../utils/busManager')
const { haversine, walkingTimeSeconds, busTravelTimeSeconds } = require('../utils/haversine')



const getBuses = async (req, res) => {
  try {
    const { driver, city } = req.query
    const filter = {}

    if (driver === 'me') {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }
      filter.driver = req.user._id
    }

    if (city) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        filter.city = city
      } else {
        const foundCity = await City.findOne({ slug: city.toLowerCase() })
        if (!foundCity) {
          return res.status(404).json({ message: 'City not found' })
        }
        filter.city = foundCity._id
      }
    }

    const buses = await Bus.find(filter)
      .populate('driver', 'name email avatarColor')
      .populate('route', 'routeNumber routeName color')
      .populate('city', 'name slug')
      .sort({ busNumber: 1 })
      .limit(500)

    res.json({ buses })

  } catch (err) {
    console.error('getBuses error:', err)
    res.status(500).json({ message: 'Server error fetching buses' })
  }
}

const getLiveBuses = async (req, res) => {
  try {
    const { city } = req.query

    const filter = {
      isOnline: true,
      status: { $in: ['active', 'breakdown'] },
      'currentLocation.lat': { $ne: null }   
    }

    if (city) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        filter.city = city
      } else {
        const foundCity = await City.findOne({ slug: city.toLowerCase(), isActive: true })
        if (!foundCity) {
          return res.status(404).json({ message: 'City not found' })
        }
        filter.city = foundCity._id
      }
    }

    const buses = await Bus.find(filter)
      .populate('driver', 'name avatarColor')
      .populate('route', 'routeNumber color')
      .select('busNumber currentLocation status isOnline route driver city lastUpdated')
      .limit(500)

    res.json({ buses })

  } catch (err) {
    console.error('getLiveBuses error:', err)
    res.status(500).json({ message: 'Server error fetching live buses' })
  }
}

const createBus = async (req, res) => {
  try {
    const { busNumber, plateNumber, driverId, routeId, citySlug } = req.body

    if (!busNumber || !plateNumber || !driverId || !routeId || !citySlug) {
      return res.status(400).json({ 
        message: 'busNumber, plateNumber, driverId, routeId, and citySlug are required' 
      })
    }

    const driver = await User.findById(driverId)
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' })
    }
    if (driver.role !== 'driver') {
      return res.status(400).json({ message: 'Assigned user must have driver role' })
    }

    const city = await City.findOne({ slug: citySlug.toLowerCase() })
    if (!city) {
      return res.status(404).json({ message: 'City not found' })
    }

    const route = await Route.findById(routeId)
    if (!route) {
      return res.status(404).json({ message: 'Route not found' })
    }
    if (route.city.toString() !== city._id.toString()) {
      return res.status(400).json({ 
        message: 'Route must belong to the same city as the bus' 
      })
    }

    const existing = await Bus.findOne({ plateNumber: plateNumber.toUpperCase() })
    if (existing) {
      return res.status(409).json({ message: 'Plate number already registered' })
    }

    const bus = await Bus.create({
      busNumber,
      plateNumber,
      driver: driverId,
      route: routeId,
      city: city._id,
    })

    const populated = await Bus.findById(bus._id)
      .populate('driver', 'name email')
      .populate('route', 'routeNumber routeName')
      .populate('city', 'name slug')

    res.status(201).json({ bus: populated })

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Plate number already exists' })
    }
    console.error('createBus error:', err)
    res.status(500).json({ message: 'Server error creating bus' })
  }
}

const updateBus = async (req, res) => {
  try {
    const { busNumber, plateNumber, driverId, routeId, status, isActive } = req.body

    const bus = await Bus.findById(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    if (routeId !== undefined) {
      const route = await Route.findById(routeId)
      if (!route) {
        return res.status(404).json({ message: 'Route not found' })
      }
      if (route.city.toString() !== bus.city.toString()) {
        return res.status(400).json({ 
          message: 'Route must belong to the same city as the bus' 
        })
      }
      bus.route = routeId
    }

    if (driverId !== undefined) {
      const driver = await User.findById(driverId)
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' })
      }
      if (driver.role !== 'driver') {
        return res.status(400).json({ message: 'Assigned user must have driver role' })
      }
      bus.driver = driverId
    }

    if (busNumber !== undefined) bus.busNumber = busNumber
    if (plateNumber !== undefined) bus.plateNumber = plateNumber
    if (status !== undefined) bus.status = status

    await bus.save()

    const populated = await Bus.findById(bus._id)
      .populate('driver', 'name email')
      .populate('route', 'routeNumber routeName')
      .populate('city', 'name slug')

    res.json({ bus: populated })

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('updateBus error:', err)
    res.status(500).json({ message: 'Server error updating bus' })
  }
}

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    res.json({ message: 'Bus deleted', bus })
  } catch (err) {
    console.error('deleteBus error:', err)
    res.status(500).json({ message: 'Server error deleting bus' })
  }
}


const updateLocation = async (req, res) => {
  try {
    const { lat, lng, speed } = req.body

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required' })
    }

    const bus = await Bus.findOne({ driver: req.user._id })
      .populate('city', 'slug')

    if (!bus) {
      return res.status(404).json({ message: 'No bus assigned to this driver' })
    }

    bus.currentLocation = { lat, lng }
    bus.isOnline = true
    bus.lastUpdated = new Date()
    if (bus.status === 'inactive') bus.status = 'active'

    await bus.save()

    // Drivers report location over REST (not the socket location-update
    // event), so this is the only place that can keep the in-memory
    // busManager cache in sync — getNearestCatchableBuses and the stale-bus
    // sweep in socketHandler.js both read from it, not from MongoDB.
    if (bus.city?.slug) {
      busManager.setBus(bus._id, {
        _id: bus._id,
        busNumber: bus.busNumber,
        route: bus.route,
        city: bus.city._id,
        citySlug: bus.city.slug,
        lat,
        lng,
        speed: speed || 0,
        status: bus.status,
        isOnline: true
      })
    }

    try {
      const { io } = require('../index')
      if (io && bus.city?.slug) {
        io.to(bus.city.slug).emit('bus-location', {
          busId: bus._id,
          busNumber: bus.busNumber,
          route: bus.route,
          lat,
          lng,
          speed: speed || 0,
          status: bus.status,
          isOnline: true,
          lastUpdated: bus.lastUpdated
        })
      }
    } catch (broadcastErr) {
      console.error('Broadcast failed:', broadcastErr.message)
    }

    res.json({ success: true, lastUpdated: bus.lastUpdated })

  } catch (err) {
    console.error('updateLocation error:', err)
    res.status(500).json({ message: 'Server error updating location' })
  }
}

const reportBreakdown = async (req, res) => {
  try {
    const bus = await Bus.findOne({ driver: req.user._id })
      .populate('city', 'slug')

    if (!bus) {
      return res.status(404).json({ message: 'No bus assigned to this driver' })
    }

    bus.status = 'breakdown'
    await bus.save()

    try {
      const { io } = require('../index')
      if (io && bus.city?.slug) {
        io.to(bus.city.slug).emit('bus-breakdown', {
          busId: bus._id,
          busNumber: bus.busNumber,
          message: req.body.message || 'Bus reported as broken down'
        })
      }
    } catch (broadcastErr) {
      console.error('Breakdown broadcast failed:', broadcastErr.message)
    }

    res.json({ success: true, bus: bus.toLiveState() })

  } catch (err) {
    console.error('reportBreakdown error:', err)
    res.status(500).json({ message: 'Server error reporting breakdown' })
  }
}

// ─── GET /api/buses/catchable?lat=&lng=&maxStopDistance= ──
// "Find buses near me that I can actually catch"
// Public
const getNearestCatchableBuses = async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat)
    const userLng = parseFloat(req.query.lng)
    const maxStopDistance = parseInt(req.query.maxStopDistance) || 1500   // metres

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ 
        message: 'lat and lng required and must be numbers' 
      })
    }

    // 1. Find nearest stops to the user (uses 2dsphere)
    const nearbyStops = await Stop.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [userLng, userLat] },
          $maxDistance: maxStopDistance
        }
      }
    })
      .populate('city', 'slug')
      .limit(5)

    if (nearbyStops.length === 0) {
      return res.json({ catchableBuses: [], reason: 'No stops within walking distance' })
    }

    // 2. For each stop, find live buses on routes that include this stop,
    //    calculate ETAs, walk times, and catchability.
    const catchableBuses = []

    for (const stop of nearbyStops) {
      const stopLng = stop.location.coordinates[0]
      const stopLat = stop.location.coordinates[1]

      // Distance + walking time from user to this stop
      const walkDistance = haversine(userLat, userLng, stopLat, stopLng)
      const walkSeconds = walkingTimeSeconds(walkDistance)

      // Get all live buses in this city
      const liveBuses = busManager.getBusesByCity(stop.city.slug)

      for (const bus of liveBuses) {
        // Skip buses without GPS yet
        if (typeof bus.lat !== 'number' || typeof bus.lng !== 'number') continue
        if (bus.status === 'breakdown') continue

        // Distance from bus to stop
        const busToStopDistance = haversine(bus.lat, bus.lng, stopLat, stopLng)

        // ETA for bus to reach stop
        const busEtaSeconds = busTravelTimeSeconds(busToStopDistance, bus.speed)

        // Can the user reach the stop before the bus?
        // Add a 30-second buffer for safety (don't sprint to barely-miss)
        const isCatchable = walkSeconds + 30 <= busEtaSeconds

        if (isCatchable) {
          catchableBuses.push({
            busId: bus._id,
            busNumber: bus.busNumber,
            route: bus.route,
            stop: {
              _id: stop._id,
              name: stop.name,
              lat: stopLat,
              lng: stopLng
            },
            walkDistance: Math.round(walkDistance),
            walkTimeSeconds: Math.round(walkSeconds),
            busEtaSeconds: Math.round(busEtaSeconds),
            currentLocation: { lat: bus.lat, lng: bus.lng }
          })
        }
      }
    }

    // 3. Sort by bus ETA — soonest arrivals first
    catchableBuses.sort((a, b) => a.busEtaSeconds - b.busEtaSeconds)

    res.json({ catchableBuses: catchableBuses.slice(0, 10) })

  } catch (err) {
    console.error('getNearestCatchableBuses error:', err)
    res.status(500).json({ message: 'Server error finding catchable buses' })
  }
}


module.exports = {
  getBuses,
  getLiveBuses,
  createBus,
  updateBus,
  deleteBus,
  updateLocation,
  reportBreakdown,
  getNearestCatchableBuses
}