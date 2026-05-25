const City = require('../models/City');

// Auto-seed hubs if database is empty on connection
async function seedCitiesIfEmpty() {
  try {
    const count = await City.countDocuments();
    if (count === 0) {
      console.log('🌱 Seed database empty. Pre-seeding Bangalore, Mumbai, and Jorhat hubs...');
      await City.create([
        { name: 'Bangalore', slug: 'bangalore', center: { lat: 12.9716, lng: 77.5946 }, zoom: 12 },
        { name: 'Mumbai', slug: 'mumbai', center: { lat: 19.0760, lng: 72.8777 }, zoom: 11 },
        { name: 'Jorhat', slug: 'jorhat', center: { lat: 26.7509, lng: 94.2037 }, zoom: 13 }
      ]);
      console.log('✅ Pre-seeded cities successfully.');
    }
  } catch (err) {
    console.error('Error auto-seeding database hubs:', err.message);
  }
}

// Trigger check
setTimeout(seedCitiesIfEmpty, 2000);

const getCities = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const cities = await City.find(query);
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching cities' });
  }
};

const getCityBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const city = await City.findOne({ slug });
    if (!city) {
      return res.status(404).json({ message: 'City profile not found' });
    }
    // Shape back center coordinate for leaflet standard format
    const reshaped = {
      _id: city._id,
      name: city.name,
      slug: city.slug,
      lat: city.center.lat,
      lng: city.center.lng,
      zoom: city.zoom
    };
    res.json(reshaped);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching city' });
  }
};

const createCity = async (req, res) => {
  try {
    const { name, lat, lng, zoom } = req.body;
    if (!name || !lat || !lng) {
      return res.status(400).json({ message: 'Name and center coordinates are required' });
    }

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await City.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: 'City slug already registered' });
    }

    const newCity = new City({
      name,
      slug,
      center: { lat, lng },
      zoom: zoom || 12
    });

    await newCity.save();
    res.status(201).json(newCity);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating city' });
  }
};

const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lat, lng, zoom } = req.body;

    const city = await City.findById(id);
    if (!city) return res.status(404).json({ message: 'City not found' });

    if (name) {
      city.name = name;
      city.slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (lat !== undefined && lng !== undefined) {
      city.center = { lat, lng };
    }
    if (zoom !== undefined) {
      city.zoom = zoom;
    }

    await city.save();
    res.json(city);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating city' });
  }
};

const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByIdAndDelete(id);
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.json({ message: 'City profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting city' });
  }
};

module.exports = {
  getCities,
  getCityBySlug,
  createCity,
  updateCity,
  deleteCity
};
