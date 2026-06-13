const Route = require('../models/Route')
const City = require('../models/City')
const Stop = require('../models/Stop')
const mongoose = require('mongoose')

const validateStopsForCity = async (stopIds, cityId) => {
  if (!Array.isArray(stopIds) || stopIds.length === 0) {
    return { valid: true }  
  }

  for (const id of stopIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { valid: false, message: `Invalid stop ID: ${id}` }
    }
  }

  const stops = await Stop.find({ _id: { $in: stopIds }, city: cityId })

  if (stops.length !== stopIds.length) {
    return { 
      valid: false, 
      message: 'One or more stops do not exist or do not belong to this city' 
    }
  }

  return { valid: true }
}

const getRoutes = async (req, res) => {
  try {
    const { city } = req.query
    const filter = { isActive: true }

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

    const routes = await Route.find(filter)
      .populate('city', 'name slug')
      .populate('stops', 'name location')
      .sort({ routeNumber: 1 })
      .limit(200)

    res.json({ routes })

  } catch (err) {
    console.error('getRoutes error:', err)
    res.status(500).json({ message: 'Server error fetching routes' })
  }
}

const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('city', 'name slug')
      .populate('stops', 'name location')

    if (!route) {
      return res.status(404).json({ message: 'Route not found' })
    }

    res.json({ route })

  } catch (err) {
    console.error('getRouteById error:', err)
    res.status(500).json({ message: 'Server error fetching route' })
  }
}

const createRoute = async (req, res) => {
  try {
    const { routeNumber, routeName, color, citySlug, stops } = req.body

    if (!routeNumber || !routeName || !citySlug) {
      return res.status(400).json({ 
        message: 'routeNumber, routeName, and citySlug are required' 
      })
    }

    const city = await City.findOne({ slug: citySlug })
    if (!city) {
      return res.status(404).json({ message: 'City not found' })
    }

    const validation = await validateStopsForCity(stops, city._id)
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message })
    }

    const route = await Route.create({
      routeNumber,
      routeName,
      color,                    
      city: city._id,
      stops: stops || []
    })

    const populated = await Route.findById(route._id)
      .populate('city', 'name slug')
      .populate('stops', 'name location')

    res.status(201).json({ route: populated })

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('createRoute error:', err)
    res.status(500).json({ message: 'Server error creating route' })
  }
}

const updateRoute = async (req, res) => {
  try {
    const { routeNumber, routeName, color, stops, isActive } = req.body

    const route = await Route.findById(req.params.id)
    if (!route) {
      return res.status(404).json({ message: 'Route not found' })
    }

    if (stops !== undefined) {
      const validation = await validateStopsForCity(stops, route.city)
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message })
      }
    }

    if (routeNumber !== undefined) route.routeNumber = routeNumber
    if (routeName !== undefined) route.routeName = routeName
    if (color !== undefined) route.color = color
    if (stops !== undefined) route.stops = stops
    if (isActive !== undefined) route.isActive = isActive

    await route.save()

    const populated = await Route.findById(route._id)
      .populate('city', 'name slug')
      .populate('stops', 'name location')

    res.json({ route: populated })

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('updateRoute error:', err)
    res.status(500).json({ message: 'Server error updating route' })
  }
}

const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id)

    if (!route) {
      return res.status(404).json({ message: 'Route not found' })
    }

    res.json({ message: 'Route deleted', route })

  } catch (err) {
    console.error('deleteRoute error:', err)
    res.status(500).json({ message: 'Server error deleting route' })
  }
}

module.exports = {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
}