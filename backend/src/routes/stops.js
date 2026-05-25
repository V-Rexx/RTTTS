const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');
const authMiddleware = require('../middleware/authMiddleware');

// Public search endpoints
router.get('/', stopController.getStops);
router.get('/nearest', stopController.getNearestStops);

// Admin protected endpoints
router.post('/', authMiddleware, stopController.createStop);
router.put('/:id', authMiddleware, stopController.updateStop);
router.delete('/:id', authMiddleware, stopController.deleteStop);

module.exports = router;
