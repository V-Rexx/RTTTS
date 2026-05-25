const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', routeController.getRoutes);

// Admin protected endpoints
router.post('/', authMiddleware, routeController.createRoute);
router.put('/:id', authMiddleware, routeController.updateRoute);
router.delete('/:id', authMiddleware, routeController.deleteRoute);

module.exports = router;
