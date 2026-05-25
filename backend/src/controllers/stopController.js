const Stop = require('../models/Stop');
const Route = require('../models/Route');
const City = require('../models/City');
const mongoose = require('mongoose');

const getStops = async (req, res) => {
  try {
    const { city } = req.query;
    let query = {};
    if (city) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        query.city = city;
      } else {
        const foundCity = await City.findOne({ slug: city.toLowerCase() });
        if (foundCity) {
          query.city = foundCity._id;
        } else {
          // If no city found by slug, return empty stops
          return res.json([]);
        }
      }
    }
    const stops = await Stop.find(query);
    res.json(stops);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching stops' });
  }
};

const getNearestStops = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude coordinates' });
    }

    const stops = await Stop.find({});
    
    // Perform Haversine proximity calculations
    const stopsWithDistance = stops.map(stop => {
      const R = 6371e3; // Earth radius in meters
      const phi1 = (lat * Math.PI) / 180;
      const phi2 = (stop.lat * Math.PI) / 180;
      const deltaPhi = ((stop.lat - lat) * Math.PI) / 180;
      const deltaLambda = ((stop.lng - lng) * Math.PI) / 180;

      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return {
        _id: stop._id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        city: stop.city,
        routes: stop.routes,
        distance
      };
    });

    // Sort by proximity and slice nearest 5
    stopsWithDistance.sort((a, b) => a.distance - b.distance);
    res.json(stopsWithDistance.slice(0, 5));
  } catch (err) {
    res.status(500).json({ message: 'Server error searching nearest stops' });
  }
};

const createStop = async (req, res) => {
  try {
    const { name, lat, lng, city, routes } = req.body;
    if (!name || lat === undefined || lng === undefined || !city) {
      return res.status(400).json({ message: 'Stop name, location lat/lng, and city are required' });
    }

    const newStop = new Stop({
      name,
      lat,
      lng,
      city,
      routes: routes || []
    });

    await newStop.save();

    // If stop is assigned to routes on creation, update those routes
    if (routes && routes.length > 0) {
      await Route.updateMany(
        { _id: { $in: routes } },
        { $addToSet: { stops: newStop._id } }
      );
    }

    res.status(201).json(newStop);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating stop' });
  }
};

const updateStop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lat, lng, routes } = req.body;

    const stop = await Stop.findById(id);
    if (!stop) return res.status(404).json({ message: 'Stop not found' });

    if (name) stop.name = name;
    if (lat !== undefined) stop.lat = lat;
    if (lng !== undefined) stop.lng = lng;
    if (routes !== undefined) stop.routes = routes;

    await stop.save();
    res.json(stop);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating stop' });
  }
};

const deleteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const stop = await Stop.findByIdAndDelete(id);
    if (!stop) return res.status(404).json({ message: 'Stop not found' });

    // Remove stop reference from all servicing routes
    await Route.updateMany(
      { stops: id },
      { $pull: { stops: id } }
    );

    res.json({ message: 'Stop deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting stop' });
  }
};

module.exports = {
  getStops,
  getNearestStops,
  createStop,
  updateStop,
  deleteStop
};
