const express = require('express')
const router = express.Router()
const chatController = require('../controllers/chatController')

// Both are public — no auth required for the chatbot
router.post('/', chatController.chat)
router.get('/context', chatController.getCityContext)

module.exports = router