const express = require('express')
const router = express.Router()
const busController = require('../controllers/busController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

// Public — specific routes BEFORE parameterized
router.get('/live', busController.getLiveBuses)
router.get('/catchable', busController.getNearestCatchableBuses)   // ← new

// Driver-only — SW posts GPS here
router.post('/location', authMiddleware, busController.updateLocation)
router.post('/breakdown', authMiddleware, busController.reportBreakdown)

// Either driver or admin
router.get('/', authMiddleware, busController.getBuses)

// Admin-only fleet management
router.post('/', authMiddleware, roleMiddleware('admin'), busController.createBus)
router.put('/:id', authMiddleware, roleMiddleware('admin'), busController.updateBus)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), busController.deleteBus)

module.exports = router