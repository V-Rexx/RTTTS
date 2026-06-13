const express = require('express')
const router = express.Router()
const routeController = require('../controllers/routeController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

router.get('/', routeController.getRoutes)
router.get('/:id', routeController.getRouteById)

router.post('/', authMiddleware, roleMiddleware('admin'), routeController.createRoute)
router.put('/:id', authMiddleware, roleMiddleware('admin'), routeController.updateRoute)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), routeController.deleteRoute)

module.exports = router