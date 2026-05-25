const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const authMiddleware = require('../middleware/authMiddleware');

// Public search endpoints
router.get('/', cityController.getCities);
router.get('/:slug', cityController.getCityBySlug);

// Admin-only protected operations
router.post('/', authMiddleware, cityController.createCity);
router.put('/:id', authMiddleware, cityController.updateCity);
router.delete('/:id', authMiddleware, cityController.deleteCity);

module.exports = router;
