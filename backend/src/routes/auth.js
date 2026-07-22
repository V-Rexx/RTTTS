const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

// Public routes
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)

// Protected routes (require valid JWT)
router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.me)

// Admin-only register
router.post('/register', authMiddleware, roleMiddleware('admin'), authController.register)

// Admin-only driver listing (for assigning drivers to buses)
router.get('/drivers', authMiddleware, roleMiddleware('admin'), authController.getDrivers)

module.exports = router