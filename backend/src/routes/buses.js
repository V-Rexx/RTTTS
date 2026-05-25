const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints
router.get('/live', busController.getLiveBuses);

// Protected endpoints (driver/admin)
router.get('/', authMiddleware, busController.getBuses);
router.post('/location', authMiddleware, busController.updateLocation);

// Admin protected endpoints
router.post('/', authMiddleware, busController.createBus);
router.put('/:id', authMiddleware, busController.updateBus);
router.delete('/:id', authMiddleware, busController.deleteBus);

module.exports = router;
