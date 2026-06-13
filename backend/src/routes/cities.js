const express = require('express')
const router = express.Router()
const cityController = require('../controllers/cityController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

router.get('/', cityController.getCities)
router.get('/:slug', cityController.getCityBySlug)

router.post('/', authMiddleware, roleMiddleware('admin'), cityController.createCity)
router.put('/:id', authMiddleware, roleMiddleware('admin'), cityController.updateCity)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), cityController.deleteCity)

module.exports = router
