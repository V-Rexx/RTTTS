const Stop = require('../models/Stop')
const Route = require('../models/Route')
const City = require('../models/City')
const mongoose = require('mongoose')

const getStops = async (req, res) => {
  try {
    const { city } = req.query
    const filter = {}

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

    const stops = await Stop.find(filter)
      .populate('city', 'name slug')
      .sort({ name: 1 })
      .limit(500)

    res.json({ stops })

  } catch (err) {
    console.error('getStops error:', err)
    res.status(500).json({ message: 'Server error fetching stops' })
  }
}

const getNearestStops = async (req, res) => {
  try {
    const latNum = parseFloat(req.query.lat)
    const lngNum = parseFloat(req.query.lng)
    const maxDistance = parseInt(req.query.maxDistance) || 5000
    const limit = parseInt(req.query.limit) || 5

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ 
        message: 'lat and lng are required and must be numbers' 
      })
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ 
        message: 'lat must be in [-90, 90], lng must be in [-180, 180]' 
      })
    }

    const stops = await Stop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lngNum, latNum]   
          },
          $maxDistance: maxDistance
        }
      }
    })
      .populate('city', 'name slug')
      .limit(limit)

    res.json({ stops })

  } catch (err) {
    console.error('getNearestStops error:', err)
    res.status(500).json({ message: 'Server error finding nearest stops' })
  }
}


const createStop = async (req, res) => {
  try {
    const { name, lat, lng, citySlug } = req.body

    if (!name || lat === undefined || lng === undefined || !citySlug) {
      return res.status(400).json({ 
        message: 'name, lat, lng, and citySlug are required' 
      })
    }

    const city = await City.findOne({ slug: citySlug })
    if (!city) {
      return res.status(404).json({ message: 'City not found' })
    }

    const stop = await Stop.create({
      name,
      location: {
        type: 'Point',
        coordinates: [lng, lat]   
      },
      city: city._id
    })

    res.status(201).json({ stop })

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('createStop error:', err)
    res.status(500).json({ message: 'Server error creating stop' })
  }
}

const updateStop = async (req, res) => {
  try {
    const { name, lat, lng } = req.body

    const updates = {}

    if (name !== undefined) {
      updates.name = name
    }

    if (lat !== undefined && lng !== undefined) {
      updates.location = {
        type: 'Point',
        coordinates: [lng, lat]
      }
    } else if (lat !== undefined || lng !== undefined) {
      return res.status(400).json({ 
        message: 'lat and lng must be provided together' 
      })
    }

    const stop = await Stop.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('city', 'name slug')

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' })
    }

    res.json({ stop })

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('updateStop error:', err)
    res.status(500).json({ message: 'Server error updating stop' })
  }
}

const deleteStop = async (req, res) => {
  try {
    const stop = await Stop.findByIdAndDelete(req.params.id)

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' })
    }

    await Route.updateMany(
      { stops: req.params.id },
      { $pull: { stops: req.params.id } }
    )

    res.json({ message: 'Stop deleted', stop })

  } catch (err) {
    console.error('deleteStop error:', err)
    res.status(500).json({ message: 'Server error deleting stop' })
  }
}

module.exports = {
  getStops,
  getNearestStops,
  createStop,
  updateStop,
  deleteStop
}