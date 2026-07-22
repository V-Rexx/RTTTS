const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public search endpoints
router.get('/', stopController.getStops);
router.get('/nearest', stopController.getNearestStops);

// Admin protected endpoints
router.post('/', authMiddleware, roleMiddleware('admin'), stopController.createStop);
router.put('/:id', authMiddleware, roleMiddleware('admin'), stopController.updateStop);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), stopController.deleteStop);

module.exports = router;
