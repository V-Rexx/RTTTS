const Bus = require('../models/Bus');
const User = require('../models/User');
const City = require('../models/City');
const mongoose = require('mongoose');

const getBuses = async (req, res) => {
  try {
    const { driver, city } = req.query;

    if (driver === 'me') {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const buses = await Bus.find({ driverId: req.user._id });
      return res.json(buses);
    }

    let filter = {};
    if (city) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        filter.city = city;
      } else {
        const foundCity = await City.findOne({ slug: city.toLowerCase() });
        if (foundCity) {
          filter.city = foundCity._id;
        } else {
          // If no city found by slug, return empty buses
          return res.json([]);
        }
      }
    }

    const buses = await Bus.find(filter);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching buses' });
  }
};

const getLiveBuses = async (req, res) => {
  try {
    const { city } = req.query;
    let filter = { status: { $in: ['active', 'breakdown'] } };
    
    if (city) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        filter.city = city;
      } else {
        const foundCity = await City.findOne({ slug: city.toLowerCase() });
        if (foundCity) {
          filter.city = foundCity._id;
        } else {
          // If no city found by slug, return empty live buses
          return res.json({ buses: [] });
        }
      }
    }

    const activeBuses = await Bus.find(filter);

    // Resolve driver names
    const resolvedBuses = await Promise.all(activeBuses.map(async (bus) => {
      const driver = await User.findById(bus.driverId);
      return {
        _id: bus._id,
        busNumber: bus.busNumber,
        plateNumber: bus.plateNumber,
        lat: bus.lat,
        lng: bus.lng,
        speed: bus.speed,
        status: bus.status,
        routeId: bus.routeId,
        driverName: driver ? driver.name : 'Unknown'
      };
    }));

    res.json({ buses: resolvedBuses });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching live buses' });
  }
};

const createBus = async (req, res) => {
  try {
    const { busNumber, plateNumber, driverId, routeId, city } = req.body;
    if (!busNumber || !plateNumber || !city) {
      return res.status(400).json({ message: 'Bus code, plate number, and city are required' });
    }

    const newBus = new Bus({
      busNumber,
      plateNumber,
      driverId: driverId || null,
      routeId: routeId || null,
      city,
      status: 'offline',
      lat: 12.9716,
      lng: 77.5946,
      speed: 0
    });

    await newBus.save();
    res.status(201).json(newBus);
  } catch (err) {
    res.status(500).json({ message: 'Server error registering bus' });
  }
};

const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { busNumber, plateNumber, driverId, routeId, status, lat, lng, speed } = req.body;

    const bus = await Bus.findById(id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    if (busNumber) bus.busNumber = busNumber;
    if (plateNumber) bus.plateNumber = plateNumber;
    if (driverId !== undefined) bus.driverId = driverId || null;
    if (routeId !== undefined) bus.routeId = routeId || null;
    if (status) bus.status = status;
    if (lat !== undefined) bus.lat = lat;
    if (lng !== undefined) bus.lng = lng;
    if (speed !== undefined) bus.speed = speed;

    await bus.save();
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating bus' });
  }
};

const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await Bus.findByIdAndDelete(id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ message: 'Bus deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting bus' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { busId, lat, lng, speed } = req.body;
    if (!busId || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'BusId and location coordinates are required' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    bus.lat = lat;
    bus.lng = lng;
    bus.speed = speed || 0;
    await bus.save();

    // Dynamically require index to fetch Socket.io singleton and avoid circular dependencies
    const { io } = require('../index');
    if (io) {
      io.to(bus.city).emit('bus-location', {
        busId: bus._id,
        lat,
        lng,
        speed: bus.speed
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating coordinates' });
  }
};

module.exports = {
  getBuses,
  getLiveBuses,
  createBus,
  updateBus,
  deleteBus,
  updateLocation
};
