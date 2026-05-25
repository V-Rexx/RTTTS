const Route = require('../models/Route');
const Stop = require('../models/Stop');
const City = require('../models/City');
const mongoose = require('mongoose');

const getRoutes = async (req, res) => {
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
          // If no city found by slug, return empty routes
          return res.json([]);
        }
      }
    }
    const routes = await Route.find(query);
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching routes' });
  }
};

const createRoute = async (req, res) => {
  try {
    const { routeNumber, name, color, city, stops } = req.body;
    if (!routeNumber || !name || !color || !city) {
      return res.status(400).json({ message: 'Route number, name, color, and city are required' });
    }

    const newRoute = new Route({
      routeNumber,
      name,
      color,
      city,
      stops: stops || []
    });

    await newRoute.save();

    // Sync Stop objects with this new Route reference
    if (stops && stops.length > 0) {
      await Stop.updateMany(
        { _id: { $in: stops } },
        { $addToSet: { routes: newRoute._id } }
      );
    }

    res.status(201).json(newRoute);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating route' });
  }
};

const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { routeNumber, name, color, stops } = req.body;

    const route = await Route.findById(id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const oldStops = route.stops || [];

    if (routeNumber) route.routeNumber = routeNumber;
    if (name) route.name = name;
    if (color) route.color = color;
    if (stops !== undefined) route.stops = stops;

    await route.save();

    // Update Stops references
    if (stops !== undefined) {
      // 1. Remove route reference from stops that are no longer serviced
      const removedStops = oldStops.filter(sid => !stops.includes(sid.toString()));
      if (removedStops.length > 0) {
        await Stop.updateMany(
          { _id: { $in: removedStops } },
          { $pull: { routes: route._id } }
        );
      }

      // 2. Add route reference to newly added stops
      const addedStops = stops.filter(sid => !oldStops.map(o => o.toString()).includes(sid.toString()));
      if (addedStops.length > 0) {
        await Stop.updateMany(
          { _id: { $in: addedStops } },
          { $addToSet: { routes: route._id } }
        );
      }
    }

    res.json(route);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating route' });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await Route.findByIdAndDelete(id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // Remove route reference from all stops
    await Stop.updateMany(
      { routes: id },
      { $pull: { routes: id } }
    );

    res.json({ message: 'Route deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting route' });
  }
};

module.exports = {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute
};
