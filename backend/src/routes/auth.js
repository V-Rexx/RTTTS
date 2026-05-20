const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

// Public routes
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)

// Protected routes (require valid JWT)
router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.me)

// Admin-only register (we'll add roleMiddleware later in Phase 7)
router.post('/register', authMiddleware, authController.register)

module.exports = router